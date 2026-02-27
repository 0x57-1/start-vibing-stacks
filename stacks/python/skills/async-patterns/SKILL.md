# Async Python Patterns — Concurrency & Performance

**ALWAYS invoke when writing async/await code or concurrent operations.**

## Core: asyncio.gather vs TaskGroup

```python
import asyncio

# Gather — run multiple coroutines concurrently
async def fetch_all():
    results = await asyncio.gather(
        fetch_users(),
        fetch_products(),
        fetch_orders(),
    )
    users, products, orders = results

# TaskGroup (Python 3.11+) — structured concurrency with proper cancellation
async def fetch_all_safe():
    async with asyncio.TaskGroup() as tg:
        t1 = tg.create_task(fetch_users())
        t2 = tg.create_task(fetch_products())
    return t1.result(), t2.result()
    # If any task fails, ALL are cancelled
```

## HTTP Client (httpx)

```python
import httpx

# REUSE client (connection pooling)
async def fetch_data():
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get("https://api.example.com/data")
        response.raise_for_status()
        return response.json()

# Concurrent requests
async def fetch_many(urls: list[str]) -> list[dict]:
    async with httpx.AsyncClient() as client:
        tasks = [client.get(url) for url in urls]
        responses = await asyncio.gather(*tasks)
        return [r.json() for r in responses]
```

## Semaphore (rate limiting)

```python
# Limit concurrent operations
sem = asyncio.Semaphore(10)  # Max 10 concurrent

async def fetch_with_limit(url: str):
    async with sem:
        async with httpx.AsyncClient() as client:
            return await client.get(url)
```

## Queue Pattern (producer/consumer)

```python
async def producer(queue: asyncio.Queue):
    for item in data:
        await queue.put(item)
    await queue.put(None)  # Sentinel

async def consumer(queue: asyncio.Queue):
    while True:
        item = await queue.get()
        if item is None:
            break
        await process(item)
        queue.task_done()

async def main():
    queue = asyncio.Queue(maxsize=100)  # Backpressure
    await asyncio.gather(producer(queue), consumer(queue))
```

## Timeouts

```python
# Always add timeouts to external calls
try:
    result = await asyncio.wait_for(fetch_data(), timeout=5.0)
except asyncio.TimeoutError:
    logger.warning("External API timed out")
    result = default_value
```

## FORBIDDEN

1. **`time.sleep()` in async code** — use `await asyncio.sleep()`
2. **Sync HTTP in async context** — use `httpx.AsyncClient`, not `requests`
3. **No timeout on external calls** — always `asyncio.wait_for()` or `httpx.Timeout`
4. **Creating new client per request** — reuse with `async with`
5. **Bare `asyncio.gather` without error handling** — use `return_exceptions=True` or TaskGroup
