---
name: php-patterns
version: 2.0.1
description: "Modern PHP idioms for Laravel apps targeting PHP 8.3 and 8.4 (Nov 2024). Covers property hooks (replace boilerplate getters/setters), asymmetric visibility (public read / private write), lazy objects via Reflection, typed class constants (8.3), readonly classes, enums, match, named args, null-safe, first-class callable syntax, constructor promotion, Octane-safe DI patterns. Invoke for any new PHP class, refactor of an old one, or when reviewing OOP code."
---

# PHP 8.3 / 8.4 Patterns for Laravel

## Version Requirements

- **PHP ≥ 8.3** — minimum. Laravel 13 requires PHP `^8.3`. New apps pin `laravel/framework` **≥ 13.30.0** (current 13.36). An existing Laravel 12 app stays on 12 at **≥ 12.69.0**.
- **PHP 8.4 strongly recommended** for new projects — property hooks, asymmetric visibility, lazy objects. PHP 8.5 is current and supported.
- **Composer ≥ 2.8** — see `composer-workflow`.
- `declare(strict_types=1);` in EVERY file. No exceptions.

## PHP 8.4 Highlights — adopt for new code

### Property Hooks — replace getter/setter boilerplate

The single most consequential 8.4 feature. Replaces hand-rolled `get`/`set` methods that exist solely to wrap a stored value.

```php
class User
{
    public function __construct(
        public string $firstName,
        public string $lastName,
    ) {}

    // Computed property — no method call, no boilerplate
    public string $fullName {
        get => trim("{$this->firstName} {$this->lastName}");
    }

    // Validation on assignment
    public string $email {
        set (string $value) {
            if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                throw new \InvalidArgumentException("Invalid email: {$value}");
            }
            $this->email = strtolower($value);
        }
    }
}

$u = new User('John', 'Doe');
echo $u->fullName;          // "John Doe" — read like a field
$u->email = 'JOHN@DOE.COM'; // validated + lowercased on assign
```

Use property hooks when the field has computation or validation. **Don't** wrap a plain value just because old code did.

### Asymmetric Visibility — read public, write protected

```php
final class Order
{
    public function __construct(
        public private(set) string $id,         // readable everywhere; writable only inside Order
        public protected(set) string $status,   // writable in Order + subclasses
    ) {}

    public function markPaid(): void { $this->status = 'paid'; }
}

$o = new Order('ord_123', 'pending');
echo $o->id;             // OK
$o->status = 'paid';     // ERROR — only Order/subclasses can write
$o->markPaid();          // OK
```

Replaces the `private $id; public function id() { return $this->id; }` pattern entirely.

### Lazy Objects — defer expensive init

```php
$reflector = new \ReflectionClass(ExpensiveService::class);
$service = $reflector->newLazyGhost(function (ExpensiveService $svc): void {
    // Runs only on first real access — bootstraps DB conn, loads cache, etc.
    $svc->__construct(/* ... */);
});

// $service behaves like ExpensiveService but does nothing until used:
$service->doSomething();   // <-- init runs here, exactly once
```

Mostly relevant for ORM-style proxies / DI containers. Day-to-day app code rarely needs it.

### New JIT (IR Framework)

Enabled by default in PHP 8.4. No app code change needed; just verify your `opcache.ini` enables JIT in production:

```ini
opcache.jit_buffer_size=128M
opcache.jit=tracing
```

### Other 8.4 deltas worth knowing

- HTML5-aware `Dom\HTMLDocument` (replaces the legacy quirks-mode parser)
- `array_find()`, `array_find_key()`, `array_any()`, `array_all()` — finally
- Object API for `BCMath\Number` — chainable arbitrary-precision math
- 4-year support lifecycle (active + security)

## Modern PHP Features (USE THESE)

## Modern PHP Features (USE THESE)

### Typed Properties & Constructor Promotion

```php
class CreateUserDTO {
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly int $age,
    ) {}
}
```

### Enums (Use for Status, Types, Roles)

```php
enum OrderStatus: string {
    case Pending = 'pending';
    case Processing = 'processing';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function label(): string {
        return match($this) {
            self::Pending => 'Awaiting Processing',
            self::Processing => 'In Progress',
            self::Completed => 'Done',
            self::Cancelled => 'Cancelled',
        };
    }
}

// In Eloquent model:
protected $casts = [
    'status' => OrderStatus::class,
];
```

### Readonly Classes for DTOs

```php
readonly class PaymentResult {
    public function __construct(
        public string $transactionId,
        public float $amount,
        public bool $success,
    ) {}
}
```

### Typed Class Constants (8.3+)

```php
class RateLimiter {
    public const int MAX_ATTEMPTS = 5;
    public const int DECAY_SECONDS = 60;
    public const string CACHE_PREFIX = 'rate_limit';
}
```

### Match Expression (Prefer over switch)

```php
$result = match($request->input('action')) {
    'approve' => $service->approve($record),
    'reject' => $service->reject($record),
    'escalate' => $service->escalate($record),
    default => throw new \InvalidArgumentException("Unknown action"),
};
```

### Named Arguments

```php
$response = Response::json(
    data: $collection,
    status: 200,
    headers: ['X-Total-Count' => $total],
);
```

### Null-safe Operator

```php
$country = $user?->address?->country?->name ?? 'Unknown';
```

### First-class Callable Syntax

```php
$filtered = $collection->filter($this->isEligible(...));
```

## Clean Code Patterns

### Dependency Injection (Octane-safe)

```php
// CORRECT: Constructor injection
class OrderService {
    public function __construct(
        private readonly PaymentGateway $gateway,
        private readonly OrderRepository $orders,
        private readonly LoggerInterface $logger,
    ) {}
}

// WRONG: Service locator
class OrderService {
    public function process(): void {
        $gateway = app(PaymentGateway::class); // Avoid in Octane
    }
}
```

### Service Architecture

```
App\Services\
├── UserService.php              # Core user operations
├── PaymentService.php           # Payment processing
└── AdPlatforms\
    ├── AdPlatformService.php    # Main service
    └── Helpers\
        ├── GoogleAdsHelper.php  # Extracted complex logic
        └── MetaAdsHelper.php
```

**Rule:** When a service class exceeds ~200 lines, extract specific logic into `Helpers` sub-namespace.

### Return Types & Exceptions

```php
public function findOrFail(string $id): User
{
    return User::findOrFail($id);
}

public function process(Order $order): PaymentResult
{
    try {
        return $this->gateway->charge($order);
    } catch (GatewayException $e) {
        $this->logger->error('Payment failed', [
            'order_id' => $order->id,
            'error' => $e->getMessage(),
        ]);
        throw new PaymentFailedException($order, $e);
    }
}
```

## FORBIDDEN Patterns

| Don't | Do Instead |
|-------|------------|
| `$var = isset($x) ? $x : $default` | `$var = $x ?? $default` |
| `function foo($x)` (no types) | `function foo(string $x): void` |
| `array()` | `[]` |
| Untyped properties | Always type properties |
| `static` properties on services | Instance properties (Octane-safe) |
| Global variables | Dependency injection |
| `switch` with simple mapping | `match` expression |
| Large service classes (200+ lines) | Extract into Helpers |
| `mixed` type without justification | Use specific types or union types |

## PSR Standards

- **PSR-4**: Autoloading (Laravel default)
- **PSR-12**: Coding Style (enforced by PHP-CS-Fixer)
