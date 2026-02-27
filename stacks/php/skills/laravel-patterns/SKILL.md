# Laravel Patterns & Standards

## Model Standards

### UUIDs as Primary Keys

```php
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class User extends Model
{
    use HasUuids;
    
    // Auto-generates UUID for 'id' column
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
// ✅ Defensive decoding — assume double-encoding possible
protected $casts = [
    'metadata' => 'array',
    'data' => 'array',
];

// For manual handling:
$data = is_string($model->data) 
    ? json_decode($model->data, true) 
    : $model->data;
```

## Service Architecture

### Helpers for Complex Services

```
App\Services\
├── UserService.php           # Core service
├── PaymentService.php
└── AdPlatforms\
    ├── AdPlatformService.php  # Main service
    └── Helpers\
        ├── GoogleAdsHelper.php  # Extracted logic
        └── MetaAdsHelper.php
```

**Rule:** Extract specific logic into `Helpers` sub-namespaces. Avoid bloated service classes.

### Service Naming

- **Convention:** `snake_case` for service container bindings
- **Class names:** `PascalCase` as standard

## API Standards

### Date Formatting

```php
// Trait: FormatsDatesForApi
trait FormatsDatesForApi
{
    protected function formatDateTime($date, Request $request): ?string
    {
        if (!$date) return null;
        // DB stores UTC, convert to user timezone in API Resource only
        $tz = $request->header('X-Timezone', 'UTC');
        return $date->setTimezone($tz)->toISOString();
    }
}

// Usage in API Resource:
class UserResource extends JsonResource
{
    use FormatsDatesForApi;
    
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
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
// ✅ Dedicated POST endpoints for specific business actions
Route::post('/leads/{lead}/reset-attempts', [LeadController::class, 'resetAttempts']);
Route::post('/domains/{domain}/refresh-list', [DomainController::class, 'refreshList']);

// ❌ Don't use generic PATCH for specific actions
Route::patch('/leads/{lead}', ...); // Too generic for business logic
```

### Job Design

```php
// ✅ Idempotent jobs — safe to retry
class SendConversionJob implements ShouldQueue
{
    public function handle(): void
    {
        // Check status BEFORE processing
        if ($this->lead->conversion_sent) {
            return; // Already processed
        }
        
        // Use unique keys for external APIs
        $api->sendConversion(
            unique_key: $this->lead->order_id,
            data: $this->lead->toArray(),
        );
        
        $this->lead->update(['conversion_sent' => true]);
    }
}
```

**Rules:**
- Jobs MUST be idempotent
- Reset jobs: set `status = pending`, reset counters
- Batch processing for high-volume data (chunks)

## Authorization & Caching

### User-Scoped Queries

```php
// ✅ Always filter by authenticated user
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
// User-specific cache keys for data isolation
$domains = Cache::store('redis')
    ->remember(
        "domains:user:{$userId}",
        now()->addMinutes(15),
        fn () => Domain::where('user_id', $userId)->get()
    );
```

**Rules:**
- User-specific cache keys: `"resource:user:{$userId}"`
- Default TTL: 15 minutes
- Invalidate on write operations

## Migration Safety

```bash
# ✅ Always incremental
php artisan make:migration add_status_to_leads_table

# ❌ NEVER (destroys data)
php artisan migrate:fresh
php artisan migrate:refresh  
php artisan db:wipe
php artisan db:reset
```
