---
name: laravel-octane
version: 2.0.1
description: "Laravel Octane patterns for production 2026 — covers FrankenPHP (recommended for new projects: single binary, automatic HTTPS, HTTP/3, early hints, Brotli, ~5× FPM throughput), RoadRunner (mature, best raw RPS, gRPC/WebSocket), and Swoole (best for I/O-heavy workloads via coroutines). Long-lived worker rules: no static state, no globals, no superglobals, no config() mutations, no die/exit/dd, scoped bindings instead of singletons, persistent DB connections with Octane flush, instance-scoped memoization. Includes server selection matrix and per-server config. Invoke when adopting Octane, choosing a server, debugging worker leaks, or hardening for persistent processes."
---

# Laravel Octane Patterns (FrankenPHP / RoadRunner / Swoole)

## Jev server

No `TYPESAFE_API_KEY`, or `SVS_JEV=0`: the matrix below. Default remains FrankenPHP.

With a key: Choice `frankenphp` | `roadrunner` | `swoole` before reading the other
server’s config. Confidence &lt; 0.75 → FrankenPHP. Questions:
`typesafe-jev/reference/skill-routines.md` § stack-pick.

## How Octane Works

Octane runs your app in a **long-lived worker process**. The application boots ONCE and handles many requests without restarting. This is fundamentally different from traditional PHP where each request boots a fresh process.

**Consequence:** Any state stored in static properties, globals, or singletons persists across requests and can leak between users.

## Server Selection — 2026 matrix

| Server | When to choose | Strengths | Trade-offs |
|---|---|---|---|
| **FrankenPHP** | New projects; teams that value simplicity | Single Go binary; automatic HTTPS via Caddy; **HTTP/3**, early hints, Brotli; 5× PHP-FPM in 2025 benchmarks | Smaller community; weaker under heavy I/O latency |
| **RoadRunner** | Production at scale; need consistent top-tier RPS | Battle-tested; ~111% higher RPS than FPM; gRPC + WebSocket built-in; rich plugin ecosystem | Steeper DevOps curve; YAML config |
| **Swoole** | Workloads dominated by 200–500 ms I/O waits (DB, upstream APIs) | Coroutine concurrency shines under high I/O latency | Lower RPS in light-I/O workloads; smaller adoption for new apps |

Default recommendation for new Laravel 12 projects in 2026: **FrankenPHP** (developer experience + modern HTTP). Pick **RoadRunner** if you've already standardized on it or need its specific features.

## Critical Rules

### DO: Dependency Injection

```php
// CORRECT: Constructor injection (resolved fresh per request scope)
class OrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService,
        private readonly CacheManager $cache,
    ) {}
}

// CORRECT: Method injection in controller actions
public function store(StoreOrderRequest $request, PaymentGateway $gateway): JsonResponse
{
    $result = $gateway->charge($request->validated());
    return response()->json($result, 201);
}
```

### DO: Use the Request Object

```php
public function store(Request $request): JsonResponse
{
    $name = $request->input('name');
    $token = $request->bearerToken();
    $ip = $request->ip();
    $user = $request->user();
}
```

### DO: Persistent DB Connections with Flush

```php
// config/database.php
'mysql' => [
    'options' => [
        PDO::ATTR_PERSISTENT => true,
    ],
],

// Octane automatically flushes connections between requests
// via Octane::prepare() — no manual work needed
```

### DO: Instance-scoped Memoization

```php
// ✅ Scoped to instance, cleared per request
class ProcessLeadsJob implements ShouldQueue
{
    private array $lookupCache = [];

    public function handle(): void
    {
        foreach ($this->leads as $lead) {
            $result = $this->lookupCache[$lead->key]
                ??= $this->expensiveLookup($lead->key);
        }
        // Cache is garbage collected when job instance is destroyed
    }
}
```

## NEVER Do These in Octane

### No Static State

```php
// WRONG: Static properties persist across ALL requests
class AuthService {
    private static ?User $currentUser = null; // LEAKS between users!
    private static array $cache = [];          // Grows forever!
}

// CORRECT: Instance properties (scoped to request)
class AuthService {
    private ?User $currentUser = null;
    private array $cache = [];
}
```

### No Global Variables

```php
// WRONG
global $config;
$GLOBALS['user'] = $user;

// CORRECT: Use DI or config()
$value = config('app.name');
```

### No Runtime Config Mutation

```php
// WRONG: Affects ALL concurrent requests in the worker
config(['app.timezone' => 'America/Sao_Paulo']);
config(['services.stripe.key' => $newKey]);

// CORRECT: Pass values explicitly
$this->service->processWithTimezone('America/Sao_Paulo');
```

### No Process Termination

```php
// WRONG: Kills the entire worker process
die('Something went wrong');
exit(1);
dd($variable);

// CORRECT: Throw exceptions (handled by Laravel)
throw new RuntimeException('Something went wrong');
abort(500, 'Internal error');

// For debugging: use dump() without die
dump($variable); // Outputs without killing worker
Log::debug('Debug info', ['var' => $variable]);
```

### No Superglobals

```php
// WRONG: Stale data from previous requests
$_GET['id'];
$_POST['name'];
$_SESSION['user'];
$_SERVER['HTTP_AUTHORIZATION'];
$_COOKIE['token'];

// CORRECT: Use Request object
$request->input('id');
$request->post('name');
$request->session()->get('user');
$request->header('Authorization');
$request->cookie('token');
```

### No Singleton Abuse

```php
// WRONG: Singleton state leaks
app()->singleton('cart', fn () => new Cart());
// The same Cart instance serves ALL users!

// CORRECT: Use scoped bindings
app()->scoped('cart', fn () => new Cart());
// Fresh instance per request, cleared between requests
```

## FrankenPHP Configuration *(2026 default)*

Single binary; Caddy-based HTTPS; no PHP extension required.

```bash
composer require laravel/octane
php artisan octane:install --server=frankenphp
php artisan octane:start --server=frankenphp --workers=4 --max-requests=500
```

`Caddyfile` (production-grade, with HTTP/3 + early hints):

```caddyfile
{
    frankenphp
    order php_server before file_server
    servers {
        protocols h1 h2 h2c h3
    }
}

api.example.com {
    encode br zstd gzip
    root * public/
    php_server {
        worker /path/to/public/frankenphp-worker.php 4
    }
    header ?Permissions-Policy "interest-cohort=()"
    header Early-Hints rel=preload
}
```

`public/frankenphp-worker.php` (worker mode — what gives you the 5× speedup):

```php
<?php
ignore_user_abort(true);
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$max = (int)($_SERVER['MAX_REQUESTS'] ?? 500);
for ($i = 0; $i < $max; $i++) {
    $keepRunning = \frankenphp_handle_request(function () use ($kernel) {
        $request = Illuminate\Http\Request::capture();
        $response = $kernel->handle($request);
        $response->send();
        $kernel->terminate($request, $response);
    });
    gc_collect_cycles();
    if (!$keepRunning) break;
}
```

| Setting | Where | Notes |
|---|---|---|
| `--workers` | CLI | Defaults to CPU cores; tune to CPU/IO ratio |
| `--max-requests` | CLI | Restart worker after N requests (memory safety, like RoadRunner's `max_jobs`) |
| `protocols h3` | Caddyfile | Enable HTTP/3 (QUIC) — single biggest mobile-network win |
| `Early-Hints` header | Response | Browser preloads CSS/JS during PHP think-time |

## RoadRunner Configuration (rr.yaml)

```yaml
version: '3'

server:
  command: "php artisan octane:start --server=roadrunner --host=0.0.0.0 --port=8000"

http:
  address: 0.0.0.0:8000
  pool:
    num_workers: 4
    max_jobs: 500
    supervisor:
      max_worker_memory: 128

logs:
  level: info
  encoding: json
```

### Worker Tuning

| Setting | Default | Description |
|---------|---------|-------------|
| `num_workers` | CPU cores | Number of worker processes |
| `max_jobs` | 500 | Restart worker after N requests (memory safety) |
| `max_worker_memory` | 128 MB | Kill worker if exceeds memory |

**Rule:** Always set `max_jobs` to prevent memory leaks from accumulating.

## Database Safety

- **NEVER** execute `db:wipe`, `migrate:fresh`, `migrate:refresh`, `db:reset`
- **ALWAYS** use incremental migrations (`make:migration`)
- If migration fails, fix the file or create a new one
- Assume **all environments contain critical data**

## Octane Checklist

- [ ] No `static` properties on service classes
- [ ] No global variables or `$GLOBALS`
- [ ] No `config()` mutations at runtime
- [ ] No `die()`, `exit()`, or `dd()` in production code
- [ ] No superglobals (`$_GET`, `$_POST`, `$_SESSION`, `$_SERVER`)
- [ ] No `app()->singleton()` for request-scoped data (use `scoped`)
- [ ] All services use constructor DI (not `app()` or `resolve()`)
- [ ] Memoization scoped to instance, not static
- [ ] `max_jobs` configured in `rr.yaml` for memory safety
- [ ] Persistent DB connections enabled with Octane flush
