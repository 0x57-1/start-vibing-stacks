---
name: performance-patterns
version: 1.0.0
---

# Performance Patterns

**Invoke when app is slow or needs optimization.**

## Universal Patterns

### Database
- **Index** frequently queried columns
- **Eager load** relationships (avoid N+1)
- **Paginate** large result sets
- **Cache** expensive queries (Redis, 15min TTL)
- **Chunk** batch operations (100-500 per batch)

### API
- **Compress** responses (gzip/brotli)
- **Cache** with ETags / Last-Modified
- **Paginate** list endpoints
- **Select only needed fields** (no `SELECT *`)

### Memory
- **Stream** large files (don't load into memory)
- **Release** references in loops
- **Monitor** memory usage in long-running processes

## PHP Specific

```php
// ❌ N+1 problem
$users = User::all();
foreach ($users as $user) {
    echo $user->posts->count(); // Query per user!
}

// ✅ Eager loading
$users = User::with('posts')->get();

// ✅ Chunked processing
User::where('active', true)->chunkById(100, function ($users) {
    foreach ($users as $user) {
        ProcessUserJob::dispatch($user);
    }
});
```

## React Specific

```tsx
// ❌ New object every render
<Component style={{ color: 'red' }} />

// ✅ Memoized
const style = useMemo(() => ({ color: 'red' }), []);

// ✅ Lazy loading
const HeavyChart = lazy(() => import('./HeavyChart'));

// ✅ Virtualization for long lists
import { useVirtualizer } from '@tanstack/react-virtual';
```

## Rules

1. **MEASURE FIRST** — don't optimize blindly
2. **PROFILE** — identify the actual bottleneck
3. **ONE CHANGE AT A TIME** — isolate improvements
4. **BENCHMARK** — before and after metrics
