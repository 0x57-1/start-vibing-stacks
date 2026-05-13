---
name: laravel-api-architecture
version: 1.0.0
description: Laravel 12 + Octane + Sanctum API-first architecture pipeline —
  Route → Controller → FormRequest → Policy → Service → Resource → JSON.
  Single-responsibility per layer, role-based bypass via Policy `before()`,
  thin controllers, no DB queries before first byte. Use as the default
  blueprint for every new API endpoint. Pairs with `axios-laravel-api` and
  `react-api-standards`.
---

# Laravel 12 API-First Architecture (the One Pipeline)

**ALWAYS invoke when designing or implementing any Laravel API endpoint that
will be consumed by a React (Vite/Axios) SPA.**

## The Pipeline

```
React (api.get) → Route → Controller → FormRequest (rules + Policy)
                              │
                              ├── Service (business logic, transactions)
                              │       └── Eloquent / external APIs
                              │
                              └── Resource (Eloquent → safe JSON)
                                      ↓
                                  JsonResponse
```

| Layer | File | Single Responsibility |
|-------|------|------------------------|
| **Route** | `routes/api.php` | URL ↔ Controller; group by middleware (auth, throttle) |
| **Controller** | `app/Http/Controllers/Api/*Controller.php` | Receive `Request`, delegate to Service, return `Resource` |
| **FormRequest** | `app/Http/Requests/*Request.php` | `rules()` validation + `authorize()` calling Policy |
| **Policy** | `app/Policies/*Policy.php` | `before()` super-admin bypass; per-action checks |
| **Service** | `app/Services/*Service.php` | Business logic, transactions, side-effects, NO HTTP |
| **Resource** | `app/Http/Resources/*Resource.php` | Eloquent → JSON; whitelist fields; format dates |

**Rule:** Each layer does ONE thing. A Controller method that runs an Eloquent
query, formats dates, and returns JSON is wrong on three counts.

## Rule of Thumb

- Controller method body: ≤ 10 lines.
- Service method: any length, but extract helpers in a `Helpers/` sub-namespace
  past 200 lines.
- FormRequest: ONLY `rules()` + `authorize()` + (optionally) `prepareForValidation()` /
  `passedValidation()`.
- Policy: `before()` for role bypass; one method per ability.
- Resource: pure mapper. NO DB queries inside.

## End-to-End Example — `GET /api/orders`

### 1. Route — `routes/api.php`

```php
use App\Http\Controllers\Api\OrderController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::apiResource('orders', OrderController::class);
    Route::post('orders/{order}/cancel', [OrderController::class, 'cancel']);
});
```

**Rules:**

- API routes go in `routes/api.php` (auto-prefixed with `/api`).
- Group by middleware — DRY for `auth:sanctum` and rate limits.
- Use `apiResource` for the 5 standard verbs; `Route::post` for action endpoints.
- Action endpoints are `POST /resource/{id}/action` (NOT a generic `PATCH`).

### 2. Controller — `app/Http/Controllers/Api/OrderController.php`

```php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\IndexOrderRequest;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orders,
    ) {}

    public function index(IndexOrderRequest $request): AnonymousResourceCollection
    {
        $orders = $this->orders->listFor(
            user: $request->user(),
            filters: $request->validated(),
        );
        return OrderResource::collection($orders);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $order = $this->orders->create(
            user: $request->user(),
            data: $request->validated(),
        );
        return OrderResource::make($order)->response()->setStatusCode(201);
    }

    public function show(Order $order): OrderResource
    {
        $this->authorize('view', $order);
        return OrderResource::make($order->load('items'));
    }

    public function cancel(Order $order): OrderResource
    {
        $this->authorize('cancel', $order);
        $this->orders->cancel($order);
        return OrderResource::make($order->fresh());
    }
}
```

**Rules:**

- Constructor injection — never `app()` / `resolve()` / `new`.
- One Service per controller (composition: a Controller can use multiple
  Services if needed, but each method calls ONE Service entry point).
- `$this->authorize()` for RouteModelBinding paths (no FormRequest).
- Return type hints on every method — PHPStan level 6+ requires it.

### 3. FormRequest — `app/Http/Requests/Order/StoreOrderRequest.php`

```php
namespace App\Http\Requests\Order;

use App\Models\Order;
use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Order::class);
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'uuid', 'exists:products,id'],
            'quantity'   => ['required', 'integer', 'min:1', 'max:100'],
            'notes'      => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'product_id.exists' => 'The selected product does not exist.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'notes' => $this->notes ? trim($this->notes) : null,
        ]);
    }
}
```

```php
namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class IndexOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;       // policy is enforced via Service scope
    }

    public function rules(): array
    {
        return [
            'status'   => ['nullable', 'string', 'in:pending,paid,shipped,cancelled'],
            'q'        => ['nullable', 'string', 'max:255'],
            'page'     => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort'     => ['nullable', 'string', 'in:created_at,-created_at,total,-total'],
        ];
    }
}
```

**Rules:**

- `authorize()` MUST call a Policy — never return `true` blindly except on
  `index` where Service-level user scoping is the gate.
- `rules()` exhaustive: type, length, allowed enum values, FK existence.
- `prepareForValidation()` for input normalization (trim, lowercase email).
- `passedValidation()` for cross-field invariants (`if A then B required`).
- Custom messages stay in the FormRequest, NOT translated globally.

### 4. Policy — `app/Policies/OrderPolicy.php`

```php
namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        return $user->isSuperAdmin() ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return true;                                  // scoping in Service
    }

    public function view(User $user, Order $order): bool
    {
        return $user->isAdmin() || $order->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isUser();
    }

    public function update(User $user, Order $order): bool
    {
        return $user->isAdmin() || $order->user_id === $user->id;
    }

    public function delete(User $user, Order $order): bool
    {
        return $user->isAdmin();
    }

    public function cancel(User $user, Order $order): bool
    {
        return $user->isAdmin() || ($order->user_id === $user->id && $order->isCancellable());
    }
}
```

**Rules:**

- `before()` returning `true` bypasses every ability for the role — use for
  `superadmin`. Return `null` (NOT `false`) to fall through to per-method checks.
- `admin` may have blanket access in some methods; regular `user` only owns
  their own resources (`$order->user_id === $user->id`).
- Register Policy in `AuthServiceProvider::$policies` OR rely on Laravel's
  auto-discovery (model `Order` ↔ `OrderPolicy` in `app/Policies/`).

### 5. Service — `app/Services/OrderService.php`

```php
namespace App\Services;

use App\Models\Order;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class OrderService
{
    public function listFor(User $user, array $filters = []): LengthAwarePaginator
    {
        $query = Order::query()->with('items');

        if (! $user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        if ($status = $filters['status'] ?? null) {
            $query->where('status', $status);
        }

        if ($q = $filters['q'] ?? null) {
            $query->where('reference', 'like', "%{$q}%");
        }

        if ($sort = $filters['sort'] ?? null) {
            $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
            $column = ltrim($sort, '-');
            $query->orderBy($column, $direction);
        } else {
            $query->latest();
        }

        return $query->paginate($filters['per_page'] ?? 25)->withQueryString();
    }

    public function create(User $user, array $data): Order
    {
        return DB::transaction(function () use ($user, $data) {
            $order = Order::create([
                ...$data,
                'user_id' => $user->id,
                'status'  => 'pending',
            ]);
            // dispatch jobs, fire events, etc.
            return $order;
        });
    }

    public function cancel(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $order->update(['status' => 'cancelled', 'cancelled_at' => now()]);
            // refund, notify, etc.
        });
    }
}
```

**Rules:**

- Service knows nothing about HTTP (`$request`, `response()`, `redirect()`).
- Always use `DB::transaction()` when there are 2+ writes.
- Scoping by user happens HERE (not in Controller, not in Resource).
- Return Eloquent models or paginators — let the Controller wrap in Resource.

### 6. Resource — `app/Http/Resources/OrderResource.php`

```php
namespace App\Http\Resources;

use App\Traits\FormatsDatesForApi;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    use FormatsDatesForApi;

    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'reference'     => $this->reference,
            'status'        => $this->status->value,
            'total'         => (float) $this->total,
            'quantity'      => $this->quantity,
            'notes'         => $this->notes,
            'user'          => UserResource::make($this->whenLoaded('user')),
            'items'         => OrderItemResource::collection($this->whenLoaded('items')),
            'created_at'    => $this->formatDateTime($this->created_at, $request),
            'cancelled_at'  => $this->formatDateTime($this->cancelled_at, $request),
            // NEVER include: secret_token, internal_notes, user.password
        ];
    }
}
```

**Rules:**

- Whitelist explicitly — never `return $this->resource->toArray()`.
- Use `whenLoaded()` to avoid N+1 (only includes if `->with()` was called).
- Format dates with `FormatsDatesForApi` trait (timezone via `X-Timezone` header).
- NEVER include secrets, password hashes, internal IDs, or PII not approved
  for the consumer.

## Sanctum SPA Backend Configuration

### `bootstrap/app.php`

```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();             // <-- enables Sanctum SPA cookie
        $middleware->throttleApi('60,1');
        $middleware->validateCsrfTokens(except: [
            'webhooks/*',                       // exempt INCOMING webhooks only
        ]);
        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(
            fn ($request) => $request->is('api/*') || $request->expectsJson(),
        );
    })
    ->create();
```

### `config/sanctum.php`

```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
    '%s%s,localhost,localhost:5173,127.0.0.1,127.0.0.1:8000',
    Sanctum::currentApplicationUrlWithPort(),
    Sanctum::currentRequestHost() ? ','.Sanctum::currentRequestHost() : '',
))),

'guard' => ['web'],

'expiration' => 60 * 24,    // 24h for token-based clients (mobile / 3rd party)

'middleware' => [
    'authenticate_session' => Authenticate::class,
    'encrypt_cookies'      => EncryptCookies::class,
    'validate_csrf_token'  => ValidateCsrfToken::class,
],
```

### `config/cors.php`

```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],
    'allowed_headers' => ['*'],
    'exposed_headers' => ['X-Request-ID'],
    'max_age' => 86400,
    'supports_credentials' => true,        // MANDATORY for cookie auth
];
```

### `config/session.php` (production)

```php
'driver'      => env('SESSION_DRIVER', 'cookie'),
'lifetime'    => env('SESSION_LIFETIME', 120),
'encrypt'     => true,
'http_only'   => true,                     // MANDATORY
'same_site'   => env('SESSION_SAME_SITE', 'lax'),
'secure'      => env('SESSION_SECURE_COOKIE', false),  // true in HTTPS prod
'domain'      => env('SESSION_DOMAIN'),    // .example.com for cross-subdomain
```

### `.env` (production sketch)

```
APP_URL=https://app.example.com
SESSION_DRIVER=cookie
SESSION_LIFETIME=120
SESSION_DOMAIN=.example.com
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
SANCTUM_STATEFUL_DOMAINS=app.example.com
FRONTEND_URL=https://app.example.com
```

## Login & Logout Endpoints (Sanctum SPA)

```php
// app/Http/Controllers/Api/AuthController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        if (! Auth::attempt($request->validated(), remember: true)) {
            return response()->json([
                'message' => 'Invalid credentials',
            ], 422);
        }

        $request->session()->regenerate();
        return response()->json([
            'data' => UserResource::make($request->user()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request): UserResource
    {
        return UserResource::make($request->user());
    }
}
```

```php
// routes/web.php — login/logout MUST be on web (session middleware)
Route::post('/login',  [AuthController::class, 'login'])->middleware('throttle:auth');
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// routes/api.php
Route::middleware('auth:sanctum')->get('/user', [AuthController::class, 'me']);
```

**Rules:**

- `/login` and `/logout` go in `routes/web.php` so the session middleware runs
  and the cookie is created/destroyed.
- Always `regenerate()` after login to prevent session fixation.
- Throttle `/login` (5/min/IP) — see `api-security` skill.

## Folder Map

```
app/
├── Http/
│   ├── Controllers/
│   │   └── Api/                  # JSON-only controllers
│   │       ├── OrderController.php
│   │       └── UserController.php
│   ├── Requests/
│   │   ├── Order/
│   │   │   ├── IndexOrderRequest.php
│   │   │   ├── StoreOrderRequest.php
│   │   │   └── UpdateOrderRequest.php
│   │   └── Auth/
│   │       └── LoginRequest.php
│   ├── Resources/
│   │   ├── OrderResource.php
│   │   ├── OrderItemResource.php
│   │   └── UserResource.php
│   └── Middleware/
│       ├── SecurityHeaders.php
│       └── RequestId.php
├── Policies/
│   ├── OrderPolicy.php
│   └── UserPolicy.php
├── Services/
│   ├── OrderService.php
│   ├── UserService.php
│   └── External/
│       └── StripeService.php
├── Models/
│   ├── Order.php
│   └── User.php
└── Traits/
    ├── FormatsDatesForApi.php
    └── ApiResponse.php
```

## Pagination Contract (consumed by React)

Laravel default `->paginate()` returns:

```json
{
    "data": [ /* OrderResource[] */ ],
    "links": { "first": "...", "last": "...", "prev": null, "next": "..." },
    "meta":  {
        "current_page": 1,
        "from": 1,
        "last_page": 4,
        "per_page": 25,
        "to": 25,
        "total": 92,
        "path": "https://api.example.com/api/orders"
    }
}
```

**Rule:** Frontend reads `data` for items and `meta.current_page` /
`meta.last_page` for the pager. Don't reinvent — use `->paginate()`.

## Action Endpoints — When (Not) to Use

```php
// ✅ Specific business action with side-effects
POST /api/orders/{order}/cancel       → OrderController::cancel
POST /api/users/{user}/reset-password → UserController::resetPassword

// ❌ Generic PATCH for business logic
PATCH /api/orders/{order} { "status": "cancelled" }   // hides side-effects
```

## Routing Cheatsheet

| Verb | URI | Controller method | Returns |
|------|-----|--------------------|---------|
| GET    | `/api/orders`             | `index`   | `OrderResource::collection` (paginated) |
| POST   | `/api/orders`             | `store`   | `OrderResource` (201) |
| GET    | `/api/orders/{order}`     | `show`    | `OrderResource` |
| PUT    | `/api/orders/{order}`     | `update`  | `OrderResource` |
| DELETE | `/api/orders/{order}`     | `destroy` | 204 No Content |
| POST   | `/api/orders/{id}/cancel` | `cancel`  | `OrderResource` |

## Octane Safety Checklist (per-endpoint)

- [ ] Controller depends on Services via `__construct()`, not `app()`
- [ ] Service has no `static` properties
- [ ] Service does not mutate `config()` at runtime
- [ ] No superglobals (`$_GET`, `$_SESSION`, `$_SERVER`)
- [ ] No `dd()` / `die()` / `exit()` (kills the worker)
- [ ] Service-level memoization is instance-scoped, not static
- [ ] DB transactions wrap multi-write business actions

## End-to-End Checklist — Before Merging an Endpoint

- [ ] Route in `routes/api.php`, behind `auth:sanctum` + `throttle`
- [ ] Controller method ≤ 10 lines, only delegates
- [ ] FormRequest with strict `rules()` AND `authorize()` calling Policy
- [ ] Policy has `before()` for super-admin bypass + per-action checks
- [ ] Service holds the business logic, transactions, side-effects
- [ ] Resource whitelists fields; uses `whenLoaded()` for relations
- [ ] Dates formatted via `FormatsDatesForApi`
- [ ] Pagination via `->paginate()` returning `data + meta + links`
- [ ] PHPUnit feature test for happy path + 422 + 403 + 401 cases
- [ ] PHPStan level 6+ passes (no `mixed`, no `array` returns)

## FORBIDDEN

| Action | Reason |
|--------|--------|
| Eloquent query inside a Controller | Move it to a Service |
| FormRequest `authorize()` returning `true` blindly | Must call Policy or be index |
| Resource performing DB queries | Use `whenLoaded()` and pre-load in Service |
| Returning `Inertia::render()` from new endpoints | Defeats the API-first model |
| Cross-cutting business logic in middleware | Middleware = HTTP concerns only |
| `->get()->map()->...` followed by `->paginate()` | Forces full hydration; paginate first |
| Skipping the FormRequest layer | Validation drift; CVE waiting to happen |
| Adding new "smart" abilities without Policy methods | Hidden access logic |
| Service instantiating a Service via `new` | Use DI all the way down |
| `static $cache` in a Service | Octane state leak across requests |
| `env()` outside `config/*.php` | Returns `null` once `config:cache` runs |

## See Also

- `axios-laravel-api` — frontend client + CSRF/cookie flow
- `react-api-standards` — React page contracts
- `api-design` — generic REST principles, pagination, dates
- `api-security` — Sanctum hardening, rate limits, CORS, audit log
- `laravel-octane` — worker memory, no statics, persistent connections
- `laravel-patterns` — UUID models, Loggable trait, JSON casts
