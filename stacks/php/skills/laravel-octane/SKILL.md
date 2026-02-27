# Laravel Octane (RoadRunner) Patterns

## Critical Rules

Octane runs your app in a **long-lived process** — different from traditional PHP.

### ✅ DO

```php
// Dependency Injection over resolve()
public function __construct(
    private readonly UserService $userService,
) {}

// Use Request object
public function store(Request $request): JsonResponse
{
    $name = $request->input('name');
}

// Persistent DB connections with flush
// config/database.php
'options' => [PDO::ATTR_PERSISTENT => true]
// Octane::prepare to flush connections between requests
```

### ❌ NEVER

```php
// Static state (leaks between requests!)
class Service {
    private static array $cache = []; // ❌ LEAKS
}

// Global variables
global $user; // ❌

// Modifying config at runtime
config(['app.name' => 'New']); // ❌ Affects ALL requests

// die() or exit()
die('error'); // ❌ Kills the worker

// Superglobals
$_GET['id']; // ❌ Stale between requests
$_POST['name']; // ❌
$_SESSION['user']; // ❌
```

### Memoization in Workers

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
        // Cache is GC'd when job instance is destroyed
    }
}

// ❌ Static cache (persists across jobs in Octane!)
private static array $cache = [];
```

## RoadRunner Configuration (rr.yaml)

```yaml
server:
  command: "php artisan octane:start --server=roadrunner --host=0.0.0.0 --port=8000"

http:
  address: 0.0.0.0:8000
  pool:
    num_workers: 4
    max_jobs: 500        # Restart worker after 500 requests (memory safety)
    supervisor:
      max_worker_memory: 128  # MB

logs:
  level: info
```

## Database Safety

- **NEVER** execute `db:wipe`, `migrate:fresh`, `migrate:refresh`, `db:reset`
- **ALWAYS** use incremental migrations (`make:migration`)
- If migration fails → fix the file or create a new one
- Assume **all environments contain critical data**
