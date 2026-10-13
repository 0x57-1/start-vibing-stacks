---
name: api-security
version: 2.1.1
description: Laravel 13 + Sanctum + Octane API hardening — cookie-based SPA auth
  by default, token auth for mobile/3rd-party, CORS/CSRF/HSTS/CSP, rate limiting,
  brute-force protection, audit logging, encryption at rest. Use when building
  any auth endpoint, public API, or handling user input. Pairs with
  `laravel-api-architecture` and `axios-laravel-api`.
---

# API Security — NSA-Level Hardening for Laravel 13 + Octane

**ALWAYS invoke when building APIs, auth endpoints, or handling user input.**

## Security Layers

```
Internet → CDN/WAF → Rate Limiter → CORS → Auth Middleware
  → CSRF (cookie clients) → FormRequest validation → Policy
  → Service business logic → Resource output sanitization → JSON

Every layer is a wall. Assume the previous one failed.
```

## 1. Authentication

### Choose ONE per client type

| Client | Mode | Why |
|--------|------|-----|
| **Same / cross-origin React SPA** | **Sanctum SPA (cookie)** | XSS-safe HttpOnly cookie; no token storage in JS |
| Mobile app | Sanctum personal access token | No browser cookie context |
| 3rd-party server-to-server | Sanctum token (scoped abilities) | Long-lived; per-key access |

### A. Sanctum SPA (Cookie) — DEFAULT for React

```php
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->statefulApi();      // accepts session cookie on /api/*
})

// config/sanctum.php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS',
    'localhost,localhost:5173,127.0.0.1,127.0.0.1:8000'
)),
'guard' => ['web'],

// config/session.php — production
'driver'    => 'cookie',
'http_only' => true,                  // MANDATORY: blocks JS access
'secure'    => true,                  // MANDATORY in HTTPS prod
'same_site' => 'lax',                 // 'none' only if cross-origin AND HTTPS
'domain'    => '.example.com',        // shared across subdomains

// config/cors.php
'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout'],
'allowed_origins' => [env('FRONTEND_URL')],
'supports_credentials' => true,       // MANDATORY for cookie auth
```

```php
// routes/web.php — login on web so session middleware runs
Route::post('/login',  [AuthController::class, 'login'])->middleware('throttle:auth');
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// routes/api.php — protected JSON endpoints
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::apiResource('orders', OrderController::class);
});
```

```php
// AuthController::login (regenerate session = anti-fixation)
if (! Auth::attempt($request->validated(), remember: true)) {
    return response()->json(['message' => 'Invalid credentials'], 422);
}
$request->session()->regenerate();
return response()->json(['data' => UserResource::make($request->user())]);
```

**Rules:**
- `http_only: true` is non-negotiable — XSS cannot read the session cookie.
- `secure: true` in any HTTPS environment (so dev = false, prod = true).
- `SameSite=Lax` for same-origin SPAs. `SameSite=None; Secure` for cross-origin.
- Always `regenerate()` after login.
- Frontend must set `withCredentials: true` and `withXSRFToken: true` (Axios).
  See `axios-laravel-api`.

### B. Sanctum Token (Mobile / 3rd-Party)

```php
// config/sanctum.php
'expiration'   => 60 * 24,    // 24h token expiry (MANDATORY for tokens)
'token_prefix' => 'app_',     // prefix for log scanning + secret-scanner tools

// Issue token with abilities (least privilege)
$token = $user->createToken('api-client', [
    'read:leads',
    'write:leads',
    // NEVER '*' — no wildcard abilities
])->plainTextToken;

// Per-route ability check
Route::middleware(['auth:sanctum', 'ability:read:leads'])->group(function () {
    Route::get('/api/v1/leads', [LeadController::class, 'index']);
});
```

### Token Rotation (sensitive actions)

```php
public function changePassword(ChangePasswordRequest $request): JsonResponse
{
    // ... change password logic

    $request->user()->tokens()->delete();                            // revoke all
    $newToken = $request->user()->createToken('session', ['*'])->plainTextToken;

    return response()->json(['token' => $newToken]);                 // token clients
    // Cookie clients: also call $request->session()->regenerate()
}
```

### Octane Session Safety

```php
// app/Providers/AppServiceProvider.php
use Laravel\Octane\Facades\Octane;

public function boot(): void
{
    Octane::prepare(function ($sandbox) {
        $sandbox->forgetScopedInstances();
        $sandbox->flushDatabaseConnections();
    });
}
```

## 2. Input Validation (Trust NOTHING)

### FormRequest (Always)

```php
// app/Http/Requests/StoreLeadRequest.php
class StoreLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->tokenCan('write:leads');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'email:rfc,dns', 'max:320'],  // RFC + DNS check
            'phone' => ['nullable', 'string', 'regex:/^\+?[1-9]\d{1,14}$/'],  // E.164
            'domain_id' => ['required', 'uuid', 'exists:domains,id'],
            'metadata' => ['nullable', 'json', 'max:10000'],  // Size limit on JSON
            'tags' => ['nullable', 'array', 'max:10'],
            'tags.*' => ['string', 'max:50', 'alpha_dash'],
        ];
    }

    // Sanitize AFTER validation
    public function validated($key = null, $default = null): array
    {
        $data = parent::validated($key, $default);
        $data['email'] = strtolower(trim($data['email']));
        $data['name'] = strip_tags($data['name']);
        return $data;
    }
}
```

### SQL Injection Prevention

```php
// ✅ ALWAYS Eloquent or parameterized
Lead::where('email', $request->validated('email'))->first();

// ✅ Raw with bindings
DB::select('SELECT * FROM leads WHERE email = ?', [$email]);

// ❌ NEVER interpolate user input
DB::select("SELECT * FROM leads WHERE email = '{$email}'");  // ❌ SQL INJECTION
```

### Mass Assignment Protection

```php
class Lead extends Model
{
    // Explicit fillable (whitelist approach)
    protected $fillable = [
        'name', 'email', 'phone', 'domain_id', 'metadata',
    ];

    // NEVER: protected $guarded = []; ← allows EVERYTHING
}
```

## 3. Rate Limiting (Multi-Layer)

```php
// app/Providers/AppServiceProvider.php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

public function boot(): void
{
    // Global API limit
    RateLimiter::for('api', function ($request) {
        return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
    });

    // Strict limit on auth endpoints
    RateLimiter::for('auth', function ($request) {
        return [
            Limit::perMinute(5)->by($request->ip()),           // 5/min per IP
            Limit::perHour(20)->by($request->ip()),            // 20/hour per IP
            Limit::perDay(50)->by($request->ip()),             // 50/day per IP
        ];
    });

    // Strict limit on sensitive actions
    RateLimiter::for('sensitive', function ($request) {
        return Limit::perMinute(3)->by($request->user()->id);  // 3/min per user
    });

    // Webhook endpoints
    RateLimiter::for('webhooks', function ($request) {
        return Limit::perMinute(100)->by($request->ip());
    });
}

// Routes
Route::middleware('throttle:auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
});

Route::middleware('throttle:sensitive')->group(function () {
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/change-email', [AuthController::class, 'changeEmail']);
    Route::delete('/account', [AuthController::class, 'deleteAccount']);
});
```

## 4. CORS (Restrictive — credentials-aware)

```php
// config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    'allowed_origins' => [
        env('FRONTEND_URL', env('APP_URL')),    // SPECIFIC origin, never '*'
    ],
    'allowed_origins_patterns' => [
        // optional: '#^https://([a-z0-9-]+\.)?example\.com$#'
    ],
    'allowed_headers' => [
        'Content-Type', 'Authorization', 'X-Requested-With',
        'X-Timezone', 'Accept', 'X-XSRF-TOKEN', 'X-CSRF-TOKEN',
    ],
    'exposed_headers' => ['X-Request-ID', 'Retry-After'],
    'max_age' => 86400,                          // 24h preflight cache
    'supports_credentials' => true,              // MANDATORY for cookie auth
];
```

**Critical:** `supports_credentials: true` is INCOMPATIBLE with
`allowed_origins: ['*']`. Browsers will reject the response. Always list
specific origins. For multiple subdomains, use `allowed_origins_patterns`.

## 5. Security Headers Middleware

```php
// app/Http/Middleware/SecurityHeaders.php
class SecurityHeaders
{
    public function handle($request, Closure $next)
    {
        $response = $next($request);

        return $response
            ->header('X-Content-Type-Options', 'nosniff')
            ->header('X-Frame-Options', 'DENY')
            ->header('X-XSS-Protection', '0')  // Modern browsers use CSP instead
            ->header('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
            ->header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
            ->header('X-Request-ID', $request->attributes->get('request_id', (string) Str::uuid()))
            ->header('Content-Security-Policy', implode('; ', [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' https://js.stripe.com",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "img-src 'self' data: https:",
                "font-src 'self' https://fonts.gstatic.com",
                "connect-src 'self' https://api.stripe.com",
                "frame-src https://js.stripe.com",
                "object-src 'none'",
                "base-uri 'self'",
            ]));
    }
}
```

## 6. Output Sanitization

```php
// app/Http/Resources/LeadResource.php
class LeadResource extends JsonResource
{
    use FormatsDatesForApi;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => e($this->name),           // HTML entity encode
            'email' => $this->email,
            'status' => $this->status->value,
            'created_at' => $this->formatDateTime($this->created_at, $request),
            // NEVER expose:
            // 'password' → NEVER
            // 'api_token' → NEVER
            // 'ip_address' → only if admin
            // 'remember_token' → NEVER
        ];
    }
}

// Model hidden attributes (defense in depth)
class User extends Authenticatable
{
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];
}
```

## 7. Encryption at Rest

```php
// Encrypt sensitive data in database
use Illuminate\Database\Eloquent\Casts\Attribute;

class ApiCredential extends Model
{
    // Laravel encrypted cast (AES-256-CBC)
    protected $casts = [
        'api_key' => 'encrypted',
        'api_secret' => 'encrypted',
        'webhook_secret' => 'encrypted',
    ];
}

// For searchable encrypted fields
use Illuminate\Support\Facades\Crypt;

class Lead extends Model
{
    // Store hash for lookup, encrypted value for display
    protected static function booted(): void
    {
        static::creating(function ($lead) {
            $lead->email_hash = hash('sha256', strtolower($lead->email));
            $lead->email_encrypted = Crypt::encryptString($lead->email);
        });
    }
}
```

## 8. Audit Logging

```php
// app/Traits/Auditable.php
trait Auditable
{
    protected static function bootAuditable(): void
    {
        foreach (['created', 'updated', 'deleted'] as $event) {
            static::$event(function ($model) use ($event) {
                AuditLog::create([
                    'auditable_type' => $model->getMorphClass(),
                    'auditable_id' => $model->getKey(),
                    'event' => $event,
                    'old_values' => $event === 'updated' ? $model->getOriginal() : null,
                    'new_values' => $event !== 'deleted' ? $model->getAttributes() : null,
                    'user_id' => auth()->id(),
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ]);
            });
        }
    }
}

// Usage on sensitive models
class Lead extends Model
{
    use HasUuids, Auditable;
}
```

## 9. Brute Force Protection

```php
// app/Http/Controllers/Auth/LoginController.php
public function login(LoginRequest $request): JsonResponse
{
    $key = 'login_attempts:' . $request->ip() . ':' . Str::lower($request->email);

    // Check lockout (progressive delay)
    $attempts = (int) Cache::get($key, 0);
    if ($attempts >= 5) {
        $lockoutMinutes = min(pow(2, $attempts - 5), 60);  // 1, 2, 4, 8, 16, 32, 60 min
        $ttl = Cache::get("{$key}:lockout");
        if ($ttl && now()->lt($ttl)) {
            return $this->error('Too many attempts. Try again later.', 429);
        }
    }

    if (!Auth::attempt($request->validated())) {
        // Increment with exponential TTL
        Cache::put($key, $attempts + 1, now()->addHours(1));
        if ($attempts + 1 >= 5) {
            $lockoutMinutes = min(pow(2, $attempts - 4), 60);
            Cache::put("{$key}:lockout", now()->addMinutes($lockoutMinutes), now()->addMinutes($lockoutMinutes));
        }

        // Generic message (don't reveal if user exists)
        return $this->error('Invalid credentials', 401);
    }

    // Reset on success
    Cache::forget($key);
    Cache::forget("{$key}:lockout");

    $token = $request->user()->createToken('session')->plainTextToken;
    return $this->success(['token' => $token]);
}
```

## 10. Request ID Tracking

```php
// app/Http/Middleware/RequestId.php
class RequestId
{
    public function handle($request, Closure $next)
    {
        $requestId = $request->header('X-Request-ID', (string) Str::uuid());
        $request->attributes->set('request_id', $requestId);

        // Add to all log entries in this request
        Log::shareContext(['request_id' => $requestId]);

        $response = $next($request);
        $response->header('X-Request-ID', $requestId);

        return $response;
    }
}
```

## Security Checklist — Before Deploy

- [ ] `statefulApi()` middleware enabled in `bootstrap/app.php`
- [ ] `SANCTUM_STATEFUL_DOMAINS` lists exact frontend hostnames
- [ ] `config/session.php`: `http_only=true`, `secure=true` (prod), `same_site=lax`
- [ ] `config/cors.php`: `supports_credentials=true`, specific `allowed_origins`
- [ ] All endpoints have `auth:sanctum` middleware (or explicit public reasoning)
- [ ] All input validated via FormRequest with Policy in `authorize()`
- [ ] Rate limiting: `throttle:auth` on `/login`, `throttle:api` on protected
- [ ] Brute force protection on login (progressive lockout)
- [ ] Sensitive fields `$hidden` on models
- [ ] API tokens encrypted at rest (`'encrypted'` cast on `ApiCredential`)
- [ ] Audit logging on sensitive models (Auditable trait)
- [ ] Request ID tracking in all logs (X-Request-ID middleware)
- [ ] Security headers middleware (CSP, HSTS, X-Frame-Options, X-Content-Type)
- [ ] No `env()` outside `config/*.php`
- [ ] No `*` in token abilities
- [ ] No `$guarded = []` on models
- [ ] No `Inertia::render()` for new endpoints (use API + Resource)
- [ ] No tokens in `localStorage` (cookie auth for SPAs)
- [ ] Webhook signatures verified before processing
- [ ] Error responses don't expose stack traces in production

## FORBIDDEN

| ❌ Don't | ✅ Do |
|---|---|
| Store JWT/Sanctum token in `localStorage` | HttpOnly session cookie (Sanctum SPA) |
| `'allowed_origins' => ['*']` with credentials | Specific origins or patterns |
| `axios.defaults.withCredentials = false` | `true` is MANDATORY for cookie auth |
| `withXSRFToken: 1` / `"true"` | Literal boolean `true` (CVE-2026-42042) |
| Caller-controlled absolute URL into axios | `allowAbsoluteUrls: false`; axios ≥ 1.20.0 |
| `same_site=none` over HTTP | `none` requires `secure=true` (HTTPS) |
| `$guarded = []` | Explicit `$fillable` |
| `createToken('x', ['*'])` | Specific abilities (least privilege) |
| `"WHERE email = '$email'"` | Parameterized queries / Eloquent |
| `dd($user)` in production | Structured `Log::info()` |
| Generic error responses leaking stack trace | Clean message + `request_id` for support |
| Store API keys in plaintext | `'encrypted'` cast on the column |
| Same rate limit for all endpoints | Progressive: auth(5/min) < api(60/min) |
| Trust `X-Forwarded-For` directly | Use Laravel's trusted proxies config |
| No token expiry | 24h max + rotate on sensitive actions |
| Login route on `/api/*` | Login goes on `routes/web.php` (session middleware) |
| `Inertia::render()` for new endpoints | API + Resource consumed by Axios |
