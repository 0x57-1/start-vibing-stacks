# Laravel Security Scan

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

## Sensitive Patterns (FORBIDDEN)

| Pattern | Risk |
|---------|------|
| `DB::raw()` with user input | SQL Injection |
| `{!! $userInput !!}` | XSS |
| `md5()` / `sha1()` for passwords | Weak hashing |
| Dynamic code execution | RCE |
| `unserialize()` on user data | Object injection |
| `$request->all()` without `$fillable` | Mass assignment |
| `env()` in runtime code | Null after config cache |
| Static user state in services | Data leaks in Octane |
