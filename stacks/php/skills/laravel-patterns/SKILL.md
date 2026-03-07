# Laravel Patterns & Standards

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

### Thin Controllers

Controllers should ONLY handle HTTP concerns. Delegate to Services.

#### Inertia Controllers (Frontend pages)

```php
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService,
    ) {}

    public function index(Request $request): InertiaResponse
    {
        return Inertia::render('Orders/Index', [
            'orders' => OrderResource::collection(
                $this->orderService->listForUser($request->user())
            ),
        ]);
    }

    public function store(StoreOrderRequest $request): RedirectResponse
    {
        $this->orderService->create($request->validated());

        return redirect()
            ->route('orders.index')
            ->with('success', __('orders.created'));
    }
}
```

#### API Controllers (JSON responses)

```php
class OrderApiController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService,
    ) {}

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $order = $this->orderService->create($request->validated());

        return OrderResource::make($order)
            ->response()
            ->setStatusCode(201);
    }

    public function resetAttempts(Order $order): JsonResponse
    {
        $this->orderService->resetAttempts($order);

        return response()->json(['message' => 'Attempts reset']);
    }
}
```

**Rules:**
- No business logic in controllers
- Use Form Requests for validation
- Inertia: return `Inertia::render()` for GET, `redirect()` for POST/PUT/DELETE
- API: use API Resources for response formatting
- Use DI for services (constructor injection)

### Form Request Validation

```php
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
            'quantity' => ['required', 'integer', 'min:1', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
```

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

### Translations with Inertia (On-Demand)

Translations are sent to the frontend per-page via `config/translations_inertia.php`:

```php
// config/translations_inertia.php
return [
    'global' => ['common', 'errors', 'validation'],
    'pages' => [
        'dashboard' => ['dashboard'],
        'orders/*' => ['orders', 'products'],
    ],
];
```

The `InertiaShare` class loads and caches translations per locale + route, merging global files with page-specific files. Frontend accesses them via the `__()` helper (see inertia-react skill).
