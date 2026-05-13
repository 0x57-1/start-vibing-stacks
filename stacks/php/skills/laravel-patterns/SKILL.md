---
name: laravel-patterns
version: 2.0.0
description: Laravel 12 model/controller/service/job patterns — UUIDs, Loggable
  trait, mass-assignment, JSON casts, thin Service-driven controllers, idempotent
  jobs, batch processing. API-first by default (controllers return Resources, NOT
  `Inertia::render()`). Use for any Laravel domain code. Pairs with
  `laravel-api-architecture` (the pipeline) and `laravel-octane` (worker safety).
---

# Laravel 12 Patterns & Standards

> **Default architecture is API-first.** Controllers return `JsonResponse` /
> `JsonResource` consumed by a React+Axios SPA. The full pipeline
> (Route → Controller → FormRequest → Policy → Service → Resource → JSON) lives
> in `laravel-api-architecture`. This skill covers the building blocks
> (Models, Services, Jobs, Caching) that compose into that pipeline.
>
> **Do NOT add new `Inertia::render()` controllers.** Inertia is supported only
> for legacy projects (see `inertia-react` skill, marked LEGACY).

## Model Standards

### UUIDs as Primary Keys

```php
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class User extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'email'];
}
```

**Rule:** All new models MUST use UUIDs for security and scalability.

### Auditing with Loggable Trait

```php
use App\Traits\Loggable;

class User extends Model
{
    use HasUuids, Loggable;
    // All changes automatically recorded
}
```

**Rule:** All models handling critical data must use auditing.

### JSON Column Handling

```php
// Defensive decoding — assume double-encoding possible
protected $casts = [
    'metadata' => 'array',
    'data' => 'array',
    'status' => OrderStatus::class,  // Enum casting
];

// For manual handling:
$data = is_string($model->data) 
    ? json_decode($model->data, true) 
    : $model->data;
```

### Mass Assignment

```php
// ALWAYS define $fillable explicitly
protected $fillable = ['name', 'email', 'status'];

// Use validated data from Form Requests
$user = User::create($request->validated());

// NEVER use $guarded = [] (allows everything)
```

## Controller Standards

### Thin API Controllers (default)

Controllers ONLY handle HTTP concerns. Delegate to Services. Validation goes
through FormRequest, authorization through Policy. Full end-to-end example
lives in `laravel-api-architecture` — this section is the contract.

```php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
        $paginated = $this->orders->listFor($request->user(), $request->validated());
        return OrderResource::collection($paginated);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $order = $this->orders->create($request->user(), $request->validated());
        return OrderResource::make($order)->response()->setStatusCode(201);
    }

    public function show(Order $order): OrderResource
    {
        $this->authorize('view', $order);
        return OrderResource::make($order);
    }

    public function resetAttempts(Order $order): OrderResource
    {
        $this->authorize('update', $order);
        $this->orders->resetAttempts($order);
        return OrderResource::make($order->fresh());
    }
}
```

**Rules:**
- No business logic in controllers — delegate to Services.
- One Service per controller method (composition: a controller may use multiple
  services overall, but each method calls one entry point).
- Use FormRequest for validation; use `$this->authorize()` only on routes that
  rely on RouteModelBinding without a FormRequest.
- API: always wrap responses in `JsonResource` / `JsonResource::collection`.
- DI in constructors only — never `app()` / `resolve()` / `new`.
- Action endpoints get `POST /resource/{id}/action` (NOT generic `PATCH`).

### Form Request Validation

```php
class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Order::class);   // routes to Policy
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'uuid', 'exists:products,id'],
            'quantity'   => ['required', 'integer', 'min:1', 'max:100'],
            'notes'      => ['nullable', 'string', 'max:500'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['notes' => $this->notes ? trim($this->notes) : null]);
    }
}
```

**Rules:**
- `authorize()` MUST call a Policy via `$user->can(...)`. Returning `true`
  without policy is allowed ONLY for `index` actions where Service-level
  user scoping is the gate.
- `rules()` exhaustive: type, length, allowed enum values, FK existence
  (`exists:table,id`), file mime/size where applicable.
- `prepareForValidation()` for input normalization (trim, lowercase email).
- One FormRequest per Controller action: `StoreOrderRequest`,
  `UpdateOrderRequest`, `IndexOrderRequest`, etc. — group under
  `app/Http/Requests/Order/`.

### Policy (mandatory for protected resources)

```php
namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    // Super-admin bypass — return null (NOT false) to fall through
    public function before(User $user, string $ability): ?bool
    {
        return $user->isSuperAdmin() ? true : null;
    }

    public function viewAny(User $user): bool   { return true; }            // scope in Service
    public function view(User $user, Order $o): bool { return $user->isAdmin() || $o->user_id === $user->id; }
    public function create(User $user): bool    { return $user->isAdmin() || $user->isUser(); }
    public function update(User $user, Order $o): bool { return $user->isAdmin() || $o->user_id === $user->id; }
    public function delete(User $user, Order $o): bool { return $user->isAdmin(); }
}
```

**Rule pattern:** `superadmin` → bypass via `before()`; `admin` → broad access;
`user` → only own resources (`$model->user_id === $user->id`).

## Service Architecture

### Service Layer Pattern

```php
class OrderService
{
    public function __construct(
        private readonly PaymentGateway $gateway,
        private readonly NotificationService $notifications,
    ) {}

    public function create(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $order = Order::create($data);
            $this->gateway->authorize($order);
            $this->notifications->orderCreated($order);

            return $order;
        });
    }

    public function resetAttempts(Order $order): void
    {
        $order->update([
            'status' => OrderStatus::Pending,
            'attempts' => 0,
        ]);
    }
}
```

### Helpers for Complex Services

```
App\Services\
├── UserService.php              # Core service
├── PaymentService.php
└── AdPlatforms\
    ├── AdPlatformService.php    # Main service
    └── Helpers\
        ├── GoogleAdsHelper.php  # Extracted logic
        └── MetaAdsHelper.php
```

**Rule:** Extract into `Helpers` sub-namespace when service exceeds ~200 lines.

## API Standards

### Date Formatting

```php
trait FormatsDatesForApi
{
    protected function formatDateTime(
        ?Carbon $date,
        Request $request,
    ): ?string {
        if (!$date) return null;
        $tz = $request->header('X-Timezone', 'UTC');
        return $date->setTimezone($tz)->toISOString();
    }
}

class UserResource extends JsonResource
{
    use FormatsDatesForApi;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'created_at' => $this->formatDateTime($this->created_at, $request),
        ];
    }
}
```

**Implementation:**

```php
// app/Traits/FormatsDatesForApi.php
trait FormatsDatesForApi
{
    protected function formatDateTime(
        ?\Carbon\Carbon $date,
        Request $request,
        string $format = 'Y-m-d\TH:i:sP'
    ): ?string {
        if (!$date) return null;
        $tz = $request->header('X-Timezone', $request->user()?->timezone ?? 'UTC');
        return $date->copy()->setTimezone($tz)->format($format);
    }
}
```

**Rule:** Backend/DB in UTC. Timezone conversion ONLY in API Resources. ALL Resources with dates MUST use this trait.

### Action Endpoints

```php
// Dedicated POST endpoints for specific business actions
Route::post('/leads/{lead}/reset-attempts', [LeadController::class, 'resetAttempts']);
Route::post('/domains/{domain}/refresh-list', [DomainController::class, 'refreshList']);

// DON'T use generic PATCH for business logic
```

### API Resources (Always Use)

```php
class LeadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'status' => $this->status->value,
            'domain' => DomainResource::make($this->whenLoaded('domain')),
            'created_at' => $this->formatDateTime($this->created_at, $request),
        ];
    }
}
```

## Job Design

```php
class SendConversionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function handle(ConversionGateway $gateway): void
    {
        // Idempotent: check status BEFORE processing
        if ($this->lead->conversion_sent) {
            return;
        }

        $gateway->send(
            unique_key: $this->lead->order_id,
            data: $this->lead->toConversionArray(),
        );

        $this->lead->update(['conversion_sent' => true]);
    }
}
```

**Rules:**
- Jobs MUST be idempotent (safe to retry)
- Use unique keys for external API calls
- Reset jobs: set `status = pending`, reset counters
- Batch/chunk for high-volume data

### Batch Processing

```php
Lead::query()
    ->where('status', OrderStatus::Pending)
    ->chunkById(100, function ($leads) {
        foreach ($leads as $lead) {
            ProcessLeadJob::dispatch($lead);
        }
    });
```

## Authorization & Caching

### User-Scoped Queries

```php
public function index(Request $request): JsonResponse
{
    $query = Domain::query();

    if (!$request->user()->isAdmin()) {
        $query->where('user_id', $request->user()->id);
    }

    return DomainResource::collection($query->paginate());
}
```

### Redis Caching

```php
$domains = Cache::store('redis')
    ->remember(
        "domains:user:{$userId}",
        now()->addMinutes(15),
        fn () => Domain::where('user_id', $userId)->get()
    );

// Invalidate on write
Cache::forget("domains:user:{$userId}");
```

**Rules:**
- User-specific cache keys: `"resource:user:{$userId}"`
- Default TTL: 15 minutes
- Invalidate on write operations

## Migration Safety

```bash
# ALWAYS incremental
php artisan make:migration add_status_to_leads_table

# NEVER (destroys data)
php artisan migrate:fresh
php artisan migrate:refresh
php artisan db:wipe
php artisan db:reset
```

## Translations

```php
// Store in lang/en/*.php and lang/pt/*.php
// Organize by category within files
return [
    'orders' => [
        'created' => 'Order created successfully',
        'not_found' => 'Order not found',
    ],
    'errors' => [
        'unauthorized' => 'You are not authorized',
        'rate_limited' => 'Too many attempts',
    ],
];
```

**Rules:**
- Centralize all user-facing strings in lang files. No hardcoded strings.
- Always add to BOTH `lang/en/*.php` and `lang/pt/*.php`
- Error strings in `lang/*/errors.php`

### Translations for API-First Frontend (default)

The React SPA owns its own i18n bundle (e.g. `react-intl`, `i18next`). Backend
exposes translations via a single API endpoint that the frontend caches:

```php
// routes/api.php
Route::get('/i18n/{locale}', [I18nController::class, 'show'])
    ->whereIn('locale', ['en', 'pt']);

// app/Http/Controllers/Api/I18nController.php
public function show(string $locale): JsonResponse
{
    return response()
        ->json(Cache::rememberForever("i18n:{$locale}", function () use ($locale) {
            $bag = [];
            foreach (File::files(lang_path($locale)) as $file) {
                $bag[$file->getFilenameWithoutExtension()] = require $file->getPathname();
            }
            return $bag;
        }))
        ->setMaxAge(3600);
}
```

**Rules:**
- Centralize ALL user-facing strings in `lang/{locale}/*.php` (single source of truth).
- Frontend pulls them once on boot, caches in memory + `localStorage`.
- Cache invalidation: bump a version number or clear cache on deploy.
- For projects already using Inertia, see the **legacy** `inertia-react` and
  `laravel-inertia-i18n` skills.
