# PHP 8.3+ Patterns

## Version Requirements

- **PHP >= 8.3** — MANDATORY. Do not use deprecated patterns.
- **Composer >= 2.0** — For dependency management.
- Use strict types: `declare(strict_types=1);` in EVERY file.

## Modern PHP Features (USE THESE)

### Typed Properties & Constructor Promotion

```php
class User {
    public function __construct(
        private readonly string $name,
        private readonly string $email,
        private readonly int $age,
    ) {}
}
```

### Enums

```php
enum Status: string {
    case Active = 'active';
    case Inactive = 'inactive';
    case Suspended = 'suspended';
}
```

### Readonly Classes (8.2+)

```php
readonly class UserDTO {
    public function __construct(
        public string $name,
        public string $email,
    ) {}
}
```

### Typed Class Constants (8.3+)

```php
class Config {
    public const string APP_NAME = 'MyApp';
    public const int MAX_RETRIES = 3;
}
```

### Match Expression

```php
$result = match($status) {
    'active' => handleActive(),
    'inactive' => handleInactive(),
    default => throw new \InvalidArgumentException("Unknown status: {$status}"),
};
```

### Named Arguments

```php
$response = new Response(
    content: $html,
    status: 200,
    headers: ['Content-Type' => 'text/html'],
);
```

### Null-safe Operator

```php
$country = $user?->address?->country?->name;
```

### Fibers (8.1+)

```php
$fiber = new Fiber(function (): void {
    $value = Fiber::suspend('fiber started');
    echo "Resumed with: {$value}";
});
```

## FORBIDDEN Patterns

| Don't | Do Instead |
|-------|------------|
| `$var = isset($x) ? $x : $default` | `$var = $x ?? $default` |
| `function foo($x)` (no types) | `function foo(string $x): void` |
| `array()` | `[]` |
| `mysql_*` functions | PDO or Doctrine |
| Global variables | Dependency injection |
| `eval()` | Never use eval |
| Untyped properties | Always type properties |

## Error Handling

```php
try {
    $result = riskyOperation();
} catch (SpecificException $e) {
    logger()->error('Operation failed', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
    ]);
    throw new DomainException('Friendly message', 0, $e);
}
```

## PSR Standards

- **PSR-4**: Autoloading
- **PSR-7**: HTTP Messages (if not using framework)
- **PSR-12**: Coding Style
- **PSR-15**: HTTP Handlers
