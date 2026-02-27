# MariaDB + Octane — Database Patterns for Persistent Workers

**ALWAYS invoke when writing queries, migrations, models, or DB config in Laravel Octane.**

## Why Octane Changes Everything

```
Traditional PHP:           Octane (RoadRunner):
┌──────────┐              ┌──────────────────────┐
│ Request → │              │ Worker boots ONCE     │
│ Boot app  │              │   ↓                   │
│ DB connect│              │ Request 1 → process   │
│ Process   │              │ Request 2 → process   │  ← SAME connection
│ DB close  │              │ Request 3 → process   │  ← SAME state
│ Die       │              │ ...500 requests...    │
└──────────┘              │ Worker restarts       │
                          └──────────────────────┘

Problems in Octane:
- Connection stays open → stale connections, gone away errors
- Transaction leaks → uncommitted TX bleeds to next request
- Query builder state → leftover bindings
- String truncation → silent data loss in strict mode OFF
```

## Connection Configuration

```php
// config/database.php
'mysql' => [
    'driver' => 'mysql',
    'host' => env('DB_HOST', '127.0.0.1'),
    'port' => env('DB_PORT', '3306'),
    'database' => env('DB_DATABASE'),
    'username' => env('DB_USERNAME'),
    'password' => env('DB_PASSWORD'),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
    'strict' => true,                    // ← MANDATORY
    'engine' => 'InnoDB',
    'options' => [
        PDO::ATTR_PERSISTENT => true,    // ← Octane reuses connections
        PDO::ATTR_EMULATE_PREPARES => false,  // ← Real prepared statements
        PDO::ATTR_STRINGIFY_FETCHES => false,  // ← Preserve int/float types
        PDO::MYSQL_ATTR_FOUND_ROWS => true,    // ← Accurate affected rows
    ],
    'modes' => [
        'STRICT_TRANS_TABLES',           // ← Errors instead of truncation
        'NO_ZERO_IN_DATE',               // ← No 0000-00-00 dates
        'NO_ZERO_DATE',
        'ERROR_FOR_DIVISION_BY_ZERO',
        'NO_ENGINE_SUBSTITUTION',
        'ONLY_FULL_GROUP_BY',            // ← Force explicit GROUP BY
    ],
],
```

### Why `strict => true` + SQL Modes

```
strict: false (DEFAULT MariaDB):
INSERT INTO users (name) VALUES ('This is a very long name that exceeds the column limit')
→ Silently TRUNCATES to column length! No error! DATA LOST!

strict: true (OUR STANDARD):
→ ERROR 1406: Data too long for column 'name'
→ You KNOW the problem immediately
```

**Rule:** `strict => true` is NON-NEGOTIABLE. Every silent truncation is a bug waiting to explode.

## Octane Connection Flush (MANDATORY)

```php
// app/Providers/AppServiceProvider.php
use Laravel\Octane\Facades\Octane;

public function boot(): void
{
    // Flush stale connections between requests
    Octane::prepare(function ($sandbox) {
        $sandbox->flushDatabaseConnections();
    });

    // Also flush on tick (long-running operations)
    Octane::tick('db-health', function () {
        try {
            DB::connection()->getPdo();
        } catch (\Exception $e) {
            DB::reconnect();
        }
    })->seconds(30);
}
```

## Migration Patterns

### Column Definitions — Be Explicit

```php
// ✅ ALWAYS define exact lengths — no surprises with strict mode
Schema::create('leads', function (Blueprint $table) {
    $table->uuid('id')->primary();

    // Strings: ALWAYS define max length
    $table->string('name', 255);                // varchar(255)
    $table->string('email', 320);               // RFC 5321 max email
    $table->string('phone', 20);                // E.164 max
    $table->string('status', 30);               // enum-like but flexible
    $table->string('country_code', 3);          // ISO 3166-1 alpha-2/3
    $table->string('currency', 3);              // ISO 4217

    // Use text() for unbounded content
    $table->text('notes');                       // 64KB
    $table->mediumText('description');           // 16MB
    $table->longText('raw_payload');             // 4GB

    // Decimals: ALWAYS precision + scale
    $table->decimal('price', 10, 2);            // 99,999,999.99
    $table->decimal('commission_rate', 5, 4);   // 0.0000 to 9.9999
    $table->unsignedBigInteger('impressions')->default(0);

    // Dates
    $table->timestamp('converted_at')->nullable();
    $table->timestamps();                        // created_at, updated_at
    $table->softDeletes();                       // deleted_at

    // JSON (MariaDB 10.2+)
    $table->json('metadata')->nullable();

    // Indexes
    $table->index('status');
    $table->index(['status', 'created_at']);     // Composite for common queries
    $table->unique('email');
});
```

### Index Strategy for MariaDB

```php
// ✅ Composite indexes — leftmost prefix rule
$table->index(['user_id', 'status', 'created_at']);
// Covers: WHERE user_id = ? 
// Covers: WHERE user_id = ? AND status = ?
// Covers: WHERE user_id = ? AND status = ? ORDER BY created_at
// Does NOT cover: WHERE status = ? (user_id not in query)

// ✅ Covering index for frequent queries
$table->index(['domain_id', 'status', 'created_at', 'id'], 'idx_leads_dashboard');

// ✅ Partial-like with generated column (MariaDB 10.2+)
// For: WHERE JSON_EXTRACT(metadata, '$.source') = 'google'
$table->string('metadata_source', 50)->virtualAs("JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.source'))");
$table->index('metadata_source');
```

## Eloquent Patterns for Octane

### Scoped Queries (avoid stale state)

```php
class Lead extends Model
{
    use HasUuids;

    // ✅ Scopes — reusable, composable
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function scopeForUser(Builder $query, string $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeCreatedBetween(Builder $query, Carbon $from, Carbon $to): Builder
    {
        return $query->whereBetween('created_at', [$from, $to]);
    }
}

// Usage (always fresh query, no state leaks):
Lead::query()
    ->active()
    ->forUser($request->user()->id)
    ->createdBetween(now()->subDays(30), now())
    ->paginate(20);
```

### N+1 Prevention

```php
// ✅ ALWAYS eager load relationships
class LeadController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $leads = Lead::query()
            ->with(['domain:id,name', 'user:id,name,email'])  // Select only needed columns
            ->select('id', 'name', 'email', 'status', 'domain_id', 'user_id', 'created_at')
            ->forUser($request->user()->id)
            ->latest()
            ->paginate(20);

        return LeadResource::collection($leads);
    }
}

// ❌ NEVER in Octane (N+1 with persistent connections = compounding slowness)
foreach ($leads as $lead) {
    echo $lead->domain->name;  // N+1 query PER lead, PER request, ALL DAY
}
```

### Bulk Operations (Octane-safe)

```php
// ✅ Chunked processing — controls memory in long-lived worker
Lead::query()
    ->where('status', 'pending')
    ->chunkById(500, function ($leads) {
        foreach ($leads as $lead) {
            ProcessLeadJob::dispatch($lead);
        }
    });

// ✅ Bulk insert (single query)
Lead::insert(
    collect($rows)->map(fn ($row) => [
        'id' => Str::uuid()->toString(),
        'name' => $row['name'],
        'email' => $row['email'],
        'created_at' => now(),
        'updated_at' => now(),
    ])->toArray()
);

// ✅ Bulk update
Lead::query()
    ->whereIn('id', $ids)
    ->update(['status' => 'processed', 'processed_at' => now()]);

// ❌ NEVER in Octane (memory grows with each request)
$allLeads = Lead::all();  // Loads EVERYTHING into worker memory
```

### Transaction Safety in Octane

```php
// ✅ Always explicit transactions with try/catch
// In Octane, an uncaught exception leaves the TX open for the NEXT request!
try {
    DB::beginTransaction();

    $lead = Lead::create($validated);
    $lead->attempts()->create(['status' => 'new']);
    ConversionService::fire($lead);

    DB::commit();
} catch (\Throwable $e) {
    DB::rollBack();  // ← CRITICAL in Octane — prevents TX leak
    report($e);
    throw $e;
}

// ✅ Or use the closure syntax (auto-rollback on exception)
$lead = DB::transaction(function () use ($validated) {
    $lead = Lead::create($validated);
    $lead->attempts()->create(['status' => 'new']);
    return $lead;
}, attempts: 3);  // Retry on deadlock
```

## Query Performance

### Explain Before Deploy

```php
// In Tinker or test:
DB::enableQueryLog();
$leads = Lead::query()->active()->forUser($userId)->paginate(20);
$queries = DB::getQueryLog();

// Check for full table scans:
// EXPLAIN SELECT * FROM leads WHERE user_id = ? AND status = 'active'
// Look for: type=ref or type=range (GOOD), type=ALL (BAD — full scan)
```

### Pagination (NEVER offset for large tables)

```php
// ✅ Cursor pagination (fast on large tables)
$leads = Lead::query()
    ->where('user_id', $userId)
    ->orderBy('id')
    ->cursorPaginate(20);

// ✅ Standard pagination (OK for admin panels)
$leads = Lead::query()->paginate(20);

// ❌ NEVER manual offset on large tables
Lead::query()->offset(100000)->limit(20)->get();
// Full scan of 100,000 rows just to skip them!
```

### Count Optimization

```php
// ❌ SLOW on large tables
$total = Lead::count();  // Full table scan

// ✅ Approximate count (MariaDB)
$total = DB::selectOne("SELECT TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_NAME = 'leads'")->TABLE_ROWS;

// ✅ Exact count with cache
$total = Cache::remember("leads:count:{$userId}", 60, function () use ($userId) {
    return Lead::where('user_id', $userId)->count();
});
```

## Model Casts (Strict Types)

```php
class Lead extends Model
{
    protected $casts = [
        'metadata' => 'array',              // JSON → array (auto encode/decode)
        'price' => 'decimal:2',             // Always 2 decimal places
        'is_active' => 'boolean',           // 1/0 → true/false
        'converted_at' => 'immutable_datetime',  // Carbon Immutable (Octane-safe)
        'impressions' => 'integer',         // String → int
        'status' => LeadStatus::class,      // Backed enum
    ];
}

// ✅ Backed enums for status columns
enum LeadStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
    case Converted = 'converted';
    case Rejected = 'rejected';
}
```

## Health Check

```php
// routes/web.php — Octane worker health
Route::get('/health', function () {
    try {
        DB::connection()->getPdo();
        $dbOk = true;
    } catch (\Exception $e) {
        DB::reconnect();
        $dbOk = false;
    }

    return response()->json([
        'status' => $dbOk ? 'healthy' : 'degraded',
        'db' => $dbOk,
        'worker_memory' => memory_get_usage(true) / 1024 / 1024 . ' MB',
        'worker_peak' => memory_get_peak_usage(true) / 1024 / 1024 . ' MB',
    ], $dbOk ? 200 : 503);
});
```

## FORBIDDEN

| ❌ Don't | ✅ Do |
|---|---|
| `strict => false` | `strict => true` + SQL modes |
| `$table->string('name')` (no length) | `$table->string('name', 255)` |
| `Lead::all()` in Octane | `Lead::query()->paginate()` or `chunkById()` |
| Uncaught exception in transaction | `DB::transaction()` closure or explicit rollBack |
| `$_GET`, `$_POST` | `$request->input()` |
| `static $cache = []` | Instance property or Redis cache |
| `offset()` on large tables | `cursorPaginate()` |
| `migrate:fresh`, `db:wipe` | Incremental migrations only |
| No index on WHERE/ORDER columns | Composite indexes matching query patterns |
| `Lead::count()` on millions of rows | Cached count or approximate count |
| `'metadata' => 'json'` cast | `'metadata' => 'array'` (auto decode) |
| `datetime` cast | `immutable_datetime` (Octane-safe, no mutation) |
