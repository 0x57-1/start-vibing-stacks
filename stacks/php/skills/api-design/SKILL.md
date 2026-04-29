---
name: api-design
version: 1.0.0
---

# PHP API Design Standards

## RESTful Principles

### Endpoint Design

```
GET    /api/users              # List (paginated)
GET    /api/users/{id}         # Show
POST   /api/users              # Create
PUT    /api/users/{id}         # Full update
PATCH  /api/users/{id}         # Partial update
DELETE /api/users/{id}         # Delete

# Business action endpoints (NOT generic PATCH)
POST   /api/leads/{id}/reset-attempts
POST   /api/domains/{id}/refresh-list
POST   /api/reports/{id}/regenerate
```

**Rule:** Specific business actions get dedicated `POST` endpoints, not generic `PUT/PATCH`.

## Date Handling

```
Client → API: ISO 8601 (UTC or with timezone offset)
Database: UTC always
API → Client: UTC, converted to user timezone in Resource/Response only
```

**Rules:**
- Backend/DB stores **UTC always**
- Timezone conversion **only** in API response layer
- Use trait/helper for consistent formatting
- Accept timezone via header (`X-Timezone`) or user profile

## Authorization Patterns

### User-Scoped Resources

```php
// Every list endpoint must scope by user (unless admin)
public function index(): JsonResponse
{
    $query = Resource::query();
    
    if (!auth()->user()->isAdmin()) {
        $query->where('user_id', auth()->id());
    }
    
    return ResourceCollection::make($query->paginate());
}
```

**Rule:** Never return unscoped queries. Always filter by authenticated user.

## Caching Strategy

```php
// User-specific cache keys
$key = "domains:user:{$userId}";
$ttl = 900; // 15 minutes default

$data = Cache::remember($key, $ttl, fn () => $query->get());

// Invalidate on write
Cache::forget("domains:user:{$userId}");
```

**Rules:**
- Cache keys MUST include user ID for isolation
- Default TTL: 15 minutes
- Invalidate cache on any write operation
- Use Redis for user-specific, frequently accessed data

## Job & Queue Patterns

### Idempotency

```php
// Check state BEFORE processing
public function handle(): void
{
    if ($this->record->already_processed) {
        return; // Skip — idempotent
    }
    
    // Process...
    
    $this->record->update(['already_processed' => true]);
}
```

### Batch Processing

```php
// Process in chunks for memory control
Lead::query()
    ->where('status', 'pending')
    ->chunkById(100, function ($leads) {
        foreach ($leads as $lead) {
            ProcessLeadJob::dispatch($lead);
        }
    });
```

**Rules:**
- Jobs MUST be idempotent (safe to retry)
- Use unique keys for external API calls
- Reset jobs: set status to `pending` + reset counters
- Batch/chunk for high-volume data

## Data Integrity

### JSON Column Safety

```php
// Defensive decoding — handle double-encoding
$data = $model->metadata;
if (is_string($data)) {
    $data = json_decode($data, true);
}

// Or use Model casts (preferred)
protected $casts = [
    'metadata' => 'array',
];
```

### External Data Quality

Before sending data to external partners (Google, Meta, etc.):
1. Validate data status
2. Filter bots/invalid entries
3. Apply quality thresholds
4. Use unique keys to prevent duplicates
