---
name: async-patterns
version: 2.0.0
description: "Async Python concurrency patterns for Python 3.13 / 3.14. Covers structured concurrency with `asyncio.TaskGroup` (3.11+), the new `asyncio.timeout()` context manager (3.11+, replaces `wait_for`), `asyncio.Runner` for one-shot scripts, AnyIO for backend-agnostic code (asyncio + trio), httpx.AsyncClient connection pooling, semaphore-based rate limiting, producer/consumer with backpressure, free-threaded mode (PEP 779 — officially supported in 3.14) for true CPU parallelism. Invoke when writing any async/await code, fan-out/fan-in flows, or deciding between threads and async."
---

# Async Patterns — Python 3.13/3.14

**ALWAYS invoke when writing async/await code, fan-out flows, or rate-limited callers.**

## Decision Map — when to reach for what

```
Job kind?
├── I/O-bound (HTTP, DB, file, queue)     → asyncio (one event loop)
├── CPU-bound, single-threaded            → just call it; don't async
├── CPU-bound, multi-thread, GIL build    → multiprocessing (workaround for GIL)
└── CPU-bound, multi-thread, 3.14 free-th → threading on python3.14t (real parallelism)
```

Free-threaded mode is now **officially supported** in Python 3.14 (PEP 779). Ships as a separate binary (`python3.14t`); per-thread overhead ~10–15% slower than the GIL build, so only switch when you actually need parallel CPU.

## Structured Concurrency — `TaskGroup` over `gather`

```python
import asyncio

async def fetch_all_safe():
    async with asyncio.TaskGroup() as tg:
        users    = tg.create_task(fetch_users())
        products = tg.create_task(fetch_products())
        orders   = tg.create_task(fetch_orders())
    # If ANY task raises, all siblings are cancelled, exception(s) re-raised as ExceptionGroup
    return users.result(), products.result(), orders.result()
```

`TaskGroup` (3.11+) is the modern default. It propagates exceptions as `ExceptionGroup` and cancels siblings on failure — exactly what you want. `asyncio.gather(...)` only swallows errors when you pass `return_exceptions=True`, which is rarely correct.

```python
# OK only when partial failure is the desired semantics
results = await asyncio.gather(*coros, return_exceptions=True)
ok = [r for r in results if not isinstance(r, Exception)]
errors = [r for r in results if isinstance(r, Exception)]
```

## Timeouts — `asyncio.timeout()` over `wait_for`

```python
# 3.11+ — context manager, composes inside TaskGroup, supports deadlines
async def fetch_with_budget():
    try:
        async with asyncio.timeout(5):
            return await fetch_data()
    except TimeoutError:
        return default_value

# Deadline-style — useful for chained operations sharing a budget
async def call_with_deadline(deadline_ts: float):
    async with asyncio.timeout_at(deadline_ts):
        await step1()
        await step2()
```

Old `asyncio.wait_for(coro, 5)` still works but doesn't compose well inside `TaskGroup` — prefer `timeout()`.

## HTTP Client — httpx (reuse the client)

```python
import httpx

# REUSE — connection pooling, http/2, keepalive
async def fetch_data(url: str) -> dict:
    async with httpx.AsyncClient(
        timeout=httpx.Timeout(connect=5, read=10, write=10, pool=5),
        limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
        http2=True,
    ) as client:
        r = await client.get(url)
        r.raise_for_status()
        return r.json()

# In FastAPI — store on app.state in lifespan, reuse for the whole process
async def lifespan(app):
    app.state.http = httpx.AsyncClient(timeout=10.0)
    yield
    await app.state.http.aclose()
```

`httpx.AsyncClient` opened per-request is **wrong** — you lose the pool, pay TCP+TLS handshake every call. Reuse one per process.

## Concurrent calls with bounded fan-out

```python
async def fetch_many(urls: list[str], client: httpx.AsyncClient) -> list[dict]:
    sem = asyncio.Semaphore(10)                # max 10 in flight at once

    async def one(url):
        async with sem:
            r = await client.get(url)
            r.raise_for_status()
            return r.json()

    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(one(u)) for u in urls]
    return [t.result() for t in tasks]
```

Always cap fan-out — unbounded `gather`/`TaskGroup` over thousands of URLs will exhaust file descriptors, TLS sessions, or the remote rate limit.

## Producer / Consumer — with backpressure

```python
async def producer(queue: asyncio.Queue, items):
    for item in items:
        await queue.put(item)               # blocks if queue full → backpressure
    for _ in range(N_CONSUMERS):
        await queue.put(None)               # one sentinel per consumer

async def consumer(queue: asyncio.Queue):
    while True:
        item = await queue.get()
        try:
            if item is None:
                return
            await process(item)
        finally:
            queue.task_done()

async def main():
    queue = asyncio.Queue(maxsize=100)      # the cap is the backpressure
    async with asyncio.TaskGroup() as tg:
        tg.create_task(producer(queue, items))
        for _ in range(N_CONSUMERS):
            tg.create_task(consumer(queue))
```

## Entry-points — `asyncio.Runner` (3.11+)

```python
import asyncio

async def main(): ...

# Modern — explicit lifecycle, works repeatedly, handles uvloop substitution
with asyncio.Runner() as runner:
    runner.run(main())
```

`asyncio.run(main())` is fine for one-shot scripts; `Runner` is better when you need to call multiple top-level coroutines or swap event loops (uvloop in production).

## AnyIO — when the library must support both backends

If you ship a library used by both asyncio and trio consumers, write against `anyio`:

```python
import anyio
from anyio import create_task_group, fail_after

async def fetch(url): ...

async def main():
    async with create_task_group() as tg:
        with fail_after(5):                  # AnyIO's timeout
            for url in urls:
                tg.start_soon(fetch, url)

anyio.run(main)                              # works on asyncio AND trio
```

## Threads + async — the right escape hatch

Sync code that you can't replace (legacy SDKs, blocking C extensions) must run **off the event loop**:

```python
import asyncio

# Run blocking CPU/IO in the default thread pool
result = await asyncio.to_thread(blocking_function, arg1, arg2)

# Bigger pool for many concurrent blocking calls
loop = asyncio.get_running_loop()
with concurrent.futures.ThreadPoolExecutor(max_workers=32) as pool:
    result = await loop.run_in_executor(pool, blocking_function, arg)
```

For pure-CPU work on the standard GIL build, prefer `multiprocessing` or `concurrent.futures.ProcessPoolExecutor` — threads won't go faster.

## FORBIDDEN

| Pattern | Why |
|---|---|
| `time.sleep(x)` inside `async def` | Blocks the entire event loop — use `await asyncio.sleep(x)` |
| `requests.get(...)` inside `async def` | Blocks event loop — use `httpx.AsyncClient` |
| Bare `asyncio.gather(...)` without error handling | Swallows exceptions of completed tasks; use `TaskGroup` |
| `asyncio.wait_for` instead of `asyncio.timeout()` | Older API, doesn't compose inside TaskGroup |
| New `httpx.AsyncClient()` per request | Loses pool/keepalive — reuse |
| Unbounded `TaskGroup` over user-provided list | DoS yourself — use Semaphore + cap |
| Mixing `asyncio` and `trio` directly | Use `anyio` to bridge or pick one |
| `asyncio.run` inside an existing loop | RuntimeError — use `asyncio.get_running_loop()` and `await` |
| Banking on free-threading for an I/O-bound API | asyncio is faster; free-threading buys CPU parallelism only |

## See Also

- `python-patterns` — async vs sync decision; free-threading rules
- `fastapi-patterns` — lifespan-managed http client, timeouts in routes
- `python-performance` — when to actually reach for `python3.14t`
- `pytest-testing` — testing async code (pytest-asyncio 1.0 + AnyIO)
