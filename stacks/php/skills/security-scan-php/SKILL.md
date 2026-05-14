---
name: security-scan-php
version: 2.0.0
description: "Laravel-specific security overlay on top of `security-baseline` (OWASP 2021 + 2025 deltas). Mass assignment, Sanctum/policies, Blade XSS, env() pitfalls in Octane, file upload validation, signed URLs, password hashing (Argon2id default since L10), CSRF on web routes, role-aware scoping, supply-chain hardening (composer audit + Roave Security Advisories + gitleaks 3-layer). Cross-references stay aligned with `security-baseline` §A01–§A10 anchors so the security-auditor agent can match. Invoke when reviewing any Laravel feature touching user data, auth, persistence, file IO, or external calls."
---

# Laravel Security Scan (overlay on `security-baseline`)

> **This skill is a Laravel overlay.** The universal OWASP rules (with 2025 deltas — Software Supply Chain Failures, Mishandling Exceptional Conditions) live in `_shared/skills/security-baseline`. The §A01–§A10 anchors below match those (2021 numbering kept for security-auditor cross-references).

## OWASP Top 10 for Laravel

### A01 - Broken Access Control

```php
// WRONG: Trust user input for authorization
$userId = $request->input('user_id');
$user = User::find($userId);

// CORRECT: Use authenticated session
$user = $request->user();

// CORRECT: Scope queries by authenticated user
$query = Resource::query();
if (!$request->user()->isAdmin()) {
    $query->where('user_id', $request->user()->id);
}
```

**Rules:**
- NEVER return unscoped queries — always filter by authenticated user
- Use Policies for authorization logic
- Use Form Requests with `authorize()` method
- Use Route Model Binding with scoping

### A02 - Cryptographic Failures

```php
// WRONG
md5($password);
sha1($password);

// CORRECT (Laravel handles this via Hash facade)
Hash::make($password);
Hash::check($input, $hashedPassword);

// For API tokens: use Laravel Sanctum
// Table: users_access_tokens (UUIDs + Soft Deletes)
// All token actions logged via Loggable trait
```

### A03 - Injection

```php
// WRONG: SQL Injection via DB::raw
$users = DB::select("SELECT * FROM users WHERE id = {$id}");
DB::raw("WHERE name = '{$name}'");

// CORRECT: Eloquent (preferred)
$user = User::findOrFail($id);

// CORRECT: Query Builder with bindings
$users = DB::table('users')->where('name', $name)->get();

// CORRECT: Raw with parameter binding (last resort)
$results = DB::select('SELECT * FROM users WHERE id = ?', [$id]);
```

### A07 - XSS Prevention

```php
// WRONG: Unescaped output in Blade
{!! $userInput !!}

// CORRECT: Auto-escaped (Blade default)
{{ $userInput }}

// Only use {!! !!} for TRUSTED, pre-sanitized HTML
{!! $trustedHtmlFromCMS !!}
```

### A08 - Insecure Deserialization

```php
// WRONG: Unserialize user data
$data = unserialize($request->input('data'));

// CORRECT: Use JSON with Model casts
protected $casts = [
    'metadata' => 'array',
    'settings' => 'array',
];

// CORRECT: Defensive JSON handling
$data = is_string($model->data) 
    ? json_decode($model->data, true) 
    : $model->data;
```

## Laravel-Specific Security

### Mass Assignment Protection

```php
// WRONG: No protection
$user = User::create($request->all());

// CORRECT: Define $fillable
class User extends Model {
    protected $fillable = ['name', 'email'];
}

// CORRECT: Use Form Request validated data
$user = User::create($request->validated());
```

### Environment Variables

```php
// WRONG: env() outside config files (null when cached)
$apiKey = env('API_KEY');

// CORRECT: Use config files
// config/services.php
'stripe' => ['key' => env('STRIPE_KEY')],

// In code:
$apiKey = config('services.stripe.key');
```

### CSRF & Authentication

```php
// Blade forms — CSRF automatic
<form method="POST">
    @csrf
    ...
</form>

// API routes — use Sanctum middleware
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('users', UserController::class);
});
```

### File Upload Validation

```php
public function rules(): array
{
    return [
        'avatar' => [
            'required',
            'image',
            'mimes:jpg,jpeg,png,webp',
            'max:2048', // 2MB
            'dimensions:max_width=2000,max_height=2000',
        ],
    ];
}
```

## Octane Security Considerations

```php
// WRONG: Static state leaks user data between requests
class AuthService {
    private static ?User $currentUser = null; // LEAKS!
}

// WRONG: Superglobals are stale in Octane
$token = $_SERVER['HTTP_AUTHORIZATION'];

// CORRECT: Use Request object
$token = $request->bearerToken();
$user = $request->user();
```

## Security Checklist

- [ ] All queries use Eloquent or Query Builder (no raw SQL with user input)
- [ ] All Blade output uses `{{ }}` (auto-escaped)
- [ ] CSRF protection on all forms (`@csrf`)
- [ ] Passwords use `Hash::make()` / `Hash::check()`
- [ ] File uploads validated (type, size, dimensions)
- [ ] API routes protected with Sanctum middleware
- [ ] Models define `$fillable` (no `$guarded = []`)
- [ ] Queries scoped by authenticated user (unless admin)
- [ ] No `env()` calls outside config files
- [ ] No static state in services (Octane-safe)
- [ ] No superglobals (`$_GET`, `$_POST`, `$_SESSION`)
- [ ] Sensitive headers set (X-Content-Type-Options, X-Frame-Options, CSP)
- [ ] Rate limiting on authentication endpoints

## Supply-Chain Hardening (OWASP 2025-A03)

Laravel apps inherit every CVE in the Composer tree. The build server is a target.

```bash
# Production install — never run third-party scripts on the build server
composer install --no-dev --no-scripts --optimize-autoloader --classmap-authoritative

# Audit (Composer 2.8+) — fail the PR on vulns OR abandoned packages
composer audit --abandoned=fail --ignore-severity=low
```

```json
// composer.json — refuse to install any version with a known CVE
"require-dev": {
    "roave/security-advisories": "dev-latest"
},
"config": {
    "allow-plugins": {
        "pestphp/pest-plugin": true
        // Add new plugins explicitly. Default-deny.
    }
}
```

Layered secret detection (mirrors `secrets-management` skill):

```yaml
# .github/workflows/ci.yml
- uses: gitleaks/gitleaks-action@v2     # Layer 2 — CI scan
- run: composer audit --abandoned=fail   # Composer-side audit
```

Layer 1 = pre-commit gitleaks hook locally. Layer 3 = GitHub Push Protection at the org/repo. See `secrets-management` skill for full setup.

---

## Mishandling Exceptional Conditions (OWASP 2025-A10) — Laravel-specific

The new 2025 category. Common Laravel mistakes:

| Anti-pattern | Why dangerous | Fix |
|---|---|---|
| `try { Gate::authorize(...) } catch { /* ignore */ }` | Authz fails open — caller proceeds as if allowed | Let it bubble; Laravel maps `AuthorizationException` to 403 |
| `Render::abort` returning a 500 with full stack trace | Leaks file paths, ORM internals, env hints | Set `APP_DEBUG=false` in prod; custom `app/Exceptions/Handler.php` returns generic problem+json |
| Webhook handler returns 500 on parse error | Provider retries forever, floods the queue | Verify signature first; on parse error log + return 200 (idempotently dropped) |
| Partial writes when transaction rolls back partially | Money charged but order not created | `DB::transaction()` closure (auto-rollback) — see `mariadb-octane` |
| `if (!config('feature.requireMfa')) return $user;` | Missing config = MFA bypassed | Default-deny: `if (config('feature.requireMfa', true) === false && app()->runningInConsole())` — and even then, gate behind explicit env |
| Octane uncaught exception leaves DB in TX | Next request inherits open TX → cascading failures | `try/finally { DB::rollBack() }` or `DB::transaction()` closure (see `mariadb-octane`) |

```php
// Correct webhook reception — fail closed on signature, fail open on parse
public function handle(Request $request): JsonResponse
{
    try {
        $event = \Stripe\Webhook::constructEvent(
            $request->getContent(),
            $request->header('Stripe-Signature'),
            config('services.stripe.webhook_secret'),
        );
    } catch (\UnexpectedValueException | \Stripe\Exception\SignatureVerificationException $e) {
        Log::warning('[stripe] invalid signature', ['err' => $e->getMessage()]);
        return response()->json(['error' => 'invalid signature'], 400);   // 4xx → provider stops retrying
    }

    try {
        ProcessStripeEvent::dispatch($event->type, $event->data->object);
    } catch (\Throwable $e) {
        Log::error('[stripe] dispatch failed', ['event' => $event->id, 'err' => $e->getMessage()]);
        // Acknowledge anyway — we'll reconcile from the webhook log
    }
    return response()->json(['status' => 'received']);
}
```

---

## Sensitive Patterns (FORBIDDEN)

| Pattern | Risk |
|---------|------|
| `DB::raw()` with user input | SQL Injection |
| `{!! $userInput !!}` | XSS |
| `md5()` / `sha1()` for passwords | Weak hashing (Argon2id is the Laravel 10+ default) |
| Dynamic code execution | RCE |
| `unserialize()` on user data | Object injection |
| `$request->all()` without `$fillable` | Mass assignment |
| `env()` in runtime code | Null after config cache |
| Static user state in services | Data leaks in Octane |
| `composer install` with `--ignore-platform-reqs` in prod | Hides incompatible PHP/ext versions |
| `composer install` in prod **without** `--no-scripts` | Supply-chain RCE on package post-install hooks |
| Missing `roave/security-advisories` dev dep | Known CVE installs silently |
| `try { ... } catch { /* nothing */ }` around authz | 2025-A10 fail-open |

## See Also

- `_shared/skills/security-baseline` — universal §A01–§A10 (OWASP 2021 + 2025 deltas)
- `_shared/skills/secrets-management` — gitleaks 3-layer + OIDC + Roave
- `_shared/skills/observability` — log redaction
- `composer-workflow` — `audit` + `roave/security-advisories`
- `mariadb-octane` — transaction safety in long-lived workers
- `api-security` — Sanctum cookie SPA + CORS hardening
