# PHP 8.3+ Patterns for Laravel

## Version Requirements

- **PHP >= 8.3** — MANDATORY. Use all modern features.
- **Composer >= 2.0** — For dependency management.
- Use strict types: `declare(strict_types=1);` in EVERY file.

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
