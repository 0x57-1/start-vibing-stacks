---
name: laravel-octane-inertia
version: 1.1.1
description: "Laravel 13 + Octane (FrankenPHP/Swoole) + Inertia.js + React 19.3 production patterns for 2026. Covers stateless architecture, worker recycling (--max-requests), scoped bindings, Octane::concurrently(), Inertia SSR, React Server Components inside Inertia pages, queue integration with Horizon, and FrankenPHP as the recommended driver."
---

# Laravel 13 + Octane + Inertia + React 19.3 (2026)

**Invoke when building high-performance Laravel applications with Inertia + React frontend and Octane workers.**

> 2026 reality: **FrankenPHP is the recommended Octane driver** for most teams. Octane gives 5-10x throughput, but requires strict stateless code. Inertia + React 19.3 lets you build SPA-like UX without maintaining a separate API layer. Pin `react` / `react-dom` to **≥ 19.3** (or the Flight floor on older lines — see `cve-watchlist.md`).

---

## 1. Octane Mental Model

Octane boots Laravel **once** and reuses the application instance across thousands of requests.

**Consequences:**

- Singletons and static properties live forever in the worker.
- Request-scoped data must be re-created on every request.
- Memory leaks accumulate until the worker is recycled.

**Rule:** Treat every request as if it were the first request the worker has ever seen.

---

## 2. Stateless Architecture Rules

### Never do this

```php
// Bad — lives in memory forever
private static $user;

public function __construct()
{
    self::$user = auth()->user();   // captured once
}
```

### Do this instead

```php
// Good — resolved at runtime
public function handle(Request $request)
{
    $user = $request->user();       // fresh on every request
    // or
    $user = app('auth')->user();
}
```

### Use scoped bindings for request-scoped services

```php
// AppServiceProvider
$this->app->scoped(ExpensiveService::class, function () {
    return new ExpensiveService(...);
});
```

---

## 3. Worker Recycling (`--max-requests`)

Always set a recycle limit:

```bash
php artisan octane:start --server=frankenphp --max-requests=1000
```

This forces workers to die after 1000 requests, releasing any leaked memory.

---

## 4. Inertia + React 19 (No Separate API)

Inertia lets you use Laravel routes + controllers while rendering React components.

```php
// routes/web.php
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard', [
        'user' => auth()->user(),
        'posts' => Post::with('author')->latest()->take(10)->get(),
    ]);
});
```

```tsx
// resources/js/Pages/Dashboard.tsx (React 19 Server Component inside Inertia)
export default function Dashboard({ user, posts }: PageProps) {
  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <PostList posts={posts} />
    </div>
  );
}
```

Inertia handles the SSR + hydration automatically.

---

## 5. React Server Components inside Inertia

You can use React Server Components inside Inertia pages (Next.js-style data fetching).

```tsx
// resources/js/Pages/Posts/Show.tsx
import { getPost } from '@/actions/posts';

export default async function Show({ id }: { id: number }) {
  const post = await getPost(id);   // runs on the server

  return (
    <article>
      <h1>{post.title}</h1>
      <Content>{post.body}</Content>
    </article>
  );
}
```

---

## 6. Concurrent Tasks with `Octane::concurrently()`

```php
use Laravel\Octane\Facades\Octane;

[$user, $posts, $notifications] = Octane::concurrently([
    fn () => User::find($id),
    fn () => Post::where('user_id', $id)->get(),
    fn () => Notification::where('user_id', $id)->get(),
], 5000); // 5 second timeout
```

This runs the closures in parallel using Swoole/RoadRunner task workers.

---

## 7. Queues + Horizon (Move Heavy Work Out of Workers)

Anything that takes > 200ms should be queued.

```php
// In a controller or action
dispatch(new ProcessVideo($video))->onQueue('videos');
```

Monitor with Horizon:

```bash
php artisan horizon
```

---

## 8. FrankenPHP vs Swoole vs RoadRunner (2026 Recommendation)

| Driver | Ease of use | Performance | Production maturity | Recommendation |
|--------|-------------|-------------|---------------------|----------------|
| **FrankenPHP** | Highest | Excellent | Very high (Caddy-based) | **Default choice** |
| Swoole | Medium | Highest | High | When you need extreme concurrency |
| RoadRunner | Medium | Very high | High | When you prefer Go-based workers |

**Recommendation:** Start with FrankenPHP unless you have a specific reason not to.

---

## 9. Production Docker + Octane Checklist

- Use multi-stage build (see `docker-patterns`)
- Run as non-root (`www-data` or `10001`)
- Set `--max-requests=1000`
- Enable OPcache with `opcache.validate_timestamps=0` and `opcache.jit=tracing`
- Use `readOnlyRootFilesystem: true` + `emptyDir` for `/tmp` and `storage/framework/cache`
- Healthcheck on `/healthz`

---

## FORBIDDEN

| Pattern | Reason |
|---------|--------|
| Storing request data in singletons or static properties | Leaks between users |
| Using `Date::now()` or `Carbon::now()` in service constructors | Frozen time across requests |
| Not setting `--max-requests` | Memory leaks eventually OOM the worker |
| Heavy work inside Octane workers | Blocks the event loop |
| Passing Eloquent models with relations into Inertia props without `only()` | N+1 queries + bloated payloads |

---

## See Also

- `laravel-api-architecture` — controller / form request / policy / resource structure
- `docker-patterns` / `podman-patterns` — containerizing Octane apps
- `task-queues` — Horizon patterns (when implemented)
- Official Laravel Octane docs

---

## Memory Optimization Trigger

If this skill grows beyond ~250 lines or accumulates duplicate Octane configuration examples, run:

```bash
npx start-vibing-stacks memory optimize --dry-run
```