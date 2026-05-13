---
name: api-design
version: 2.0.0
description: PHP/Laravel REST API design contract — endpoint shape, pagination,
  filtering, sorting, dates, idempotency, error response envelope. The contract
  the React+Axios SPA expects on the wire. Use when designing any new API
  surface. Pairs with `laravel-api-architecture` (the implementation pipeline)
  and `axios-laravel-api` (the consumer).
---

# Laravel REST API Design Contract

**ALWAYS invoke when designing or naming endpoints, response shapes, pagination,
or filters. This is the contract — the implementation pipeline is in
`laravel-api-architecture`.**

## RESTful Principles

### Endpoint Naming

```
GET    /api/users                # List (paginated)
GET    /api/users/{id}           # Show
POST   /api/users                # Create
PUT    /api/users/{id}           # Replace (full update)
PATCH  /api/users/{id}           # Partial update
DELETE /api/users/{id}           # Delete
```

### Action Endpoints (NOT generic PATCH)

```
POST   /api/leads/{id}/reset-attempts
POST   /api/domains/{id}/refresh-list
POST   /api/orders/{id}/cancel
POST   /api/reports/{id}/regenerate
```

**Rule:** Specific business actions get dedicated `POST` endpoints. Don't
overload `PATCH` with side-effects.

## Response Envelope

### Success (single resource)

Use Laravel's `JsonResource` directly — Laravel wraps it automatically:

```json
{
    "data": {
        "id": "9b8c...",
        "name": "Order #1234",
        "status": "paid",
        "created_at": "2026-05-13T12:34:56-03:00"
    }
}
```

### Success (collection / paginated)

```json
{
    "data": [ { "id": "..." }, { "id": "..." } ],
    "links": {
        "first": "https://api.example.com/api/orders?page=1",
        "last":  "https://api.example.com/api/orders?page=4",
        "prev":  null,
        "next":  "https://api.example.com/api/orders?page=2"
    },
    "meta": {
        "current_page": 1,
        "from": 1,
        "to": 25,
        "last_page": 4,
        "per_page": 25,
        "total": 92,
        "path": "https://api.example.com/api/orders"
    }
}
```

**Rule:** Get this for free with Laravel's `->paginate($perPage)`. Don't
hand-roll pagination.

### Error envelope

Laravel returns these natively — match them:

```json
// 401 Unauthenticated
{ "message": "Unauthenticated." }

// 403 Forbidden (Policy denied)
{ "message": "This action is unauthorized." }

// 404 Not Found
{ "message": "No query results for model [App\\Models\\Order] 123." }

// 419 CSRF Token Mismatch
{ "message": "CSRF token mismatch." }

// 422 Validation
{
    "message": "The given data was invalid.",
    "errors": {
        "email":   ["The email field is required."],
        "password":["The password must be at least 8 characters."]
    }
}

// 429 Too Many Requests (also returns header Retry-After)
{ "message": "Too Many Requests" }

// 500
{ "message": "Server Error" }
```

**Rule:** Don't reinvent. The frontend's Axios interceptor (see
`axios-laravel-api`) is built around exactly these shapes. Adding a custom
envelope (`{success, data, errors}`) requires updating BOTH layers — keep
Laravel defaults unless you have a hard reason not to.

## Pagination Contract

```php
// Controller
public function index(IndexOrderRequest $request): AnonymousResourceCollection
{
    $perPage = (int) ($request->validated('per_page') ?? 25);
    $perPage = min($perPage, 100);              // hard cap
    return OrderResource::collection(
        $this->orders->listFor($request->user(), $request->validated())->paginate($perPage)
    );
}
```

```php
// FormRequest
'page'     => ['nullable', 'integer', 'min:1'],
'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
```

**Rules:**
- Default `per_page = 25`. Hard cap = 100.
- Always validate `page` and `per_page` to prevent abuse.
- Use `->paginate()` for offset pagination (default), `->cursorPaginate()`
  for high-volume cursors (>100k rows, infinite scroll).

## Filter & Sort Contract

```
GET /api/orders?status=paid&q=acme&sort=-created_at&page=2&per_page=25
```

```php
// FormRequest
'status'   => ['nullable', 'string', 'in:pending,paid,shipped,cancelled'],
'q'        => ['nullable', 'string', 'max:255'],
'sort'     => ['nullable', 'string', 'in:created_at,-created_at,total,-total'],
'page'     => ['nullable', 'integer', 'min:1'],
'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
```

```php
// Service
if ($status = $filters['status'] ?? null) $query->where('status', $status);
if ($q      = $filters['q']      ?? null) $query->where('reference', 'like', "%{$q}%");

if ($sort = $filters['sort'] ?? null) {
    $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
    $column    = ltrim($sort, '-');
    $query->orderBy($column, $direction);
}
```

**Rules:**
- Sort syntax: `sort=field` (asc), `sort=-field` (desc). Allowed columns
  whitelisted in FormRequest.
- Filter values whitelisted via `in:...` in FormRequest — never trust
  enum-like params.
- `q` (free-text search) is `LIKE`/`ILIKE`. For real search, use scout +
  Meilisearch / Typesense.

## Date Handling

```
Client → API:   ISO 8601 (UTC or with timezone offset)
Database:        UTC always
API → Client:    ISO 8601, converted to caller's timezone in Resource only
```

```php
// app/Traits/FormatsDatesForApi.php
trait FormatsDatesForApi
{
    protected function formatDateTime(?Carbon $date, Request $request): ?string
    {
        if (! $date) return null;
        $tz = $request->header('X-Timezone', $request->user()?->timezone ?? 'UTC');
        return $date->copy()->setTimezone($tz)->toISOString();
    }
}
```

**Rules:**
- Backend / DB stores **UTC always**.
- Timezone conversion **only** in API Resource layer.
- Accept timezone via `X-Timezone` header or fall back to user profile.

## Idempotency for Unsafe Methods

For external integrations (webhooks, payment endpoints), accept an
`Idempotency-Key` header and de-dupe:

```php
public function store(StoreLeadRequest $request): JsonResource
{
    $key = $request->header('Idempotency-Key');
    if ($key && $existing = Lead::where('idempotency_key', $key)->first()) {
        return LeadResource::make($existing);
    }
    $lead = $this->leads->create([...$request->validated(), 'idempotency_key' => $key]);
    return LeadResource::make($lead);
}
```

**Rule:** All public webhook receivers MUST be idempotent (assume retries).

## Authentication Contract (Sanctum SPA + Optional Token)

| Caller | Auth | Header / Cookie |
|--------|------|------------------|
| Same-origin React SPA | Session cookie + CSRF | `XSRF-TOKEN` cookie → `X-XSRF-TOKEN` header |
| Cross-origin React SPA | Session cookie + CSRF (CORS w/ credentials) | Same |
| Mobile / 3rd-party | Personal access token | `Authorization: Bearer <token>` |

`auth:sanctum` accepts BOTH transparently. See `axios-laravel-api` for the
Axios setup and `api-security` for token issuing/scopes.

## Authorization Pattern

### User-Scoped Resources (default)

Every collection endpoint MUST scope by user (admins may see everything):

```php
// In the Service (NOT controller, NOT resource)
public function listFor(User $user, array $filters): Builder
{
    $query = Order::query();
    if (! $user->isAdmin()) {
        $query->where('user_id', $user->id);
    }
    // ...
    return $query;
}
```

### Per-Resource via Policy

```php
public function show(Order $order): OrderResource
{
    $this->authorize('view', $order);
    return OrderResource::make($order);
}
```

**Rule:** Never return unscoped queries from a Service. Scoping = security.

## Caching Strategy

```php
// User-specific cache keys
$key = "domains:user:{$userId}";
$ttl = now()->addMinutes(15);

$data = Cache::remember($key, $ttl, fn () => $query->get());

// Invalidate on write
Cache::forget("domains:user:{$userId}");
```

**Rules:**
- Cache keys MUST include user ID for isolation (avoid one user seeing another's data).
- Default TTL: 15 minutes.
- Invalidate on any write operation (in the Service that performed the write).
- Use Redis for user-specific, frequently accessed data.
- For collections that mutate constantly, prefer ETag/conditional GET over cache.

## Job & Queue Patterns

### Idempotency

```php
public function handle(): void
{
    if ($this->record->already_processed) return;        // skip — idempotent
    $this->process();
    $this->record->update(['already_processed' => true]);
}
```

### Batch Processing

```php
Lead::query()
    ->where('status', 'pending')
    ->chunkById(100, function ($leads) {
        foreach ($leads as $lead) {
            ProcessLeadJob::dispatch($lead);
        }
    });
```

**Rules:**
- Jobs MUST be idempotent (safe to retry).
- Use unique keys for external API calls.
- Batch / chunk for high-volume data.

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
2. Filter bots / invalid entries
3. Apply quality thresholds
4. Use unique keys to prevent duplicates

## Versioning (when you outgrow `/api`)

```
/api/v1/orders     # current
/api/v2/orders     # breaking changes
```

**Rule:** Add a version prefix only when breaking changes are imminent. Don't
preemptively version every endpoint.

## Checklist — Designing Any New Endpoint

- [ ] Verb + URL match REST conventions (or it's an explicit action endpoint)
- [ ] Behind `auth:sanctum` (and `throttle:api`) by default
- [ ] FormRequest with `rules()` + `authorize()` (Policy)
- [ ] Service does the work; Controller just orchestrates
- [ ] Returns `JsonResource` / `JsonResource::collection`
- [ ] Pagination uses `->paginate()` returning `data + meta + links`
- [ ] Dates formatted via `FormatsDatesForApi`
- [ ] Sensitive fields hidden (`$hidden` on model + whitelist in Resource)
- [ ] PHPUnit feature test for happy + 422 + 403 + 401 cases

## See Also

- `laravel-api-architecture` — the full Controller→Service→Resource pipeline
- `axios-laravel-api` — frontend client + CSRF/cookie + interceptors
- `react-api-standards` — page contract that consumes these endpoints
- `api-security` — Sanctum config, CORS, rate limiting, token abilities
- `external-api-patterns` — consuming OTHER APIs from your Laravel app
- `openapi-design` — describing the contract in OpenAPI 3.1
