---
name: python-performance
version: 2.0.0
description: "Performance profiling and optimisation for Python 3.13/3.14. Covers cProfile/line-profiler/memory-profiler/py-spy choice, the experimental copy-and-patch JIT in 3.13 (PEP 744 — disabled by default), free-threaded mode in 3.14 (PEP 779 officially supported — when it actually wins vs asyncio + multiprocessing), `functools.cache` (unbounded) vs `lru_cache` (bounded), structural optimisations (set vs list membership, generators for memory, `str.join` vs `+`), bulk DB ops in SQLAlchemy/Django, async caching with redis-py, and Polars (Rust-backed dataframes, ~10× pandas) for data work. Profile FIRST, optimise SECOND."
---

# Python Performance — Profiling & Optimisation (3.13 / 3.14)

**ALWAYS invoke when optimising slow Python code. Profile FIRST.**

## What to reach for in 2026

| Symptom | Tool / Pattern |
|---|---|
| "Function X is hot" | `cProfile` → `snakeviz`, then `line_profiler` for line-by-line |
| "Process eats RAM" | `memory_profiler` for line-level, `tracemalloc` for snapshots |
| "Production is slow but we can't repro" | **`py-spy`** (sampling, no code change, attaches by PID) |
| "I want a flame graph" | `py-spy record -o profile.svg --pid …` |
| "Hot Python loop, can't rewrite in C" | Try **3.13 JIT** (`PYTHON_JIT=1`) — still experimental |
| "Multi-thread CPU-bound, GIL is the wall" | **3.14 free-threaded** build (`python3.14t`) — officially supported |
| "Tabular data crunching" | **Polars** (Rust-backed, ~10× pandas, lazy frames) |
| "Pure-Python hot path" | `mypyc`, `cython`, `numba` — pick based on dependency tolerance |

## Profiling

```bash
# CPU — cumulative time per function
python -m cProfile -o prof.out app.py
uv run snakeviz prof.out                          # interactive HTML view

# Line-level (decorate target with @profile, no import needed)
uv run kernprof -l -v script.py

# Memory — line-level allocations
uv run python -m memory_profiler script.py

# Production-safe sampling profiler — attach by PID
py-spy top --pid 12345
py-spy record -o flame.svg --duration 30 --pid 12345
```

py-spy is the safest tool for prod: zero code changes, low overhead (~5%), works on a running process.

## Free-threading vs JIT — when each helps

```
3.13 JIT (PEP 744)
├── Status: experimental, OFF by default
├── Win: hot Python bytecode loops (~5-15% on micro-benchmarks)
└── Enable: build with --enable-experimental-jit OR run PYTHON_JIT=1 (when distro supports it)

3.14 Free-threaded (PEP 779)
├── Status: OFFICIALLY SUPPORTED
├── Binary: python3.14t (separate from python3.14)
├── Win: parallel CPU work across threads — no GIL
├── Cost: ~10-15% slower per-thread vs GIL build
└── Use when: CPU-bound multi-thread work where multiprocessing overhead is too high
```

Don't bank on either for I/O-bound web servers — asyncio dominates that case.

## Caching primitives

```python
from functools import cache, lru_cache

# Bounded — pick a sensible maxsize for your hot paths
@lru_cache(maxsize=1024)
def expensive(n: int) -> int:
    return sum(range(n))

# Unbounded — only when input space is small AND fixed
@cache                        # 3.9+, equivalent to @lru_cache(maxsize=None) but faster
def settings_for(env: str) -> Settings:
    return Settings(env=env)

# Async — use redis-py async; lru_cache does NOT support coroutines
import redis.asyncio as redis

cache = redis.from_url("redis://localhost", decode_responses=False)

async def get_user(id: str) -> User:
    cached = await cache.get(f"user:{id}")
    if cached:
        return User.model_validate_json(cached)
    user = await db.get(User, id)
    await cache.set(f"user:{id}", user.model_dump_json(), ex=300)
    return user
```

## Data structures

```python
# O(n) → O(1) — set lookup wins by 100×+ on big lists
big_list = [...]                 # 1M items
big_set  = set(big_list)
"target" in big_list             # SLOW
"target" in big_set              # FAST

# dict.get() over try/except for happy-path
value = data.get("key", default)

# Specialised collections
from collections import defaultdict, Counter, deque
counts = Counter(events)
queue  = deque(maxlen=1000)      # bounded ring buffer
```

## Generators — memory wins

```python
# WRONG — materialises 10M dicts in RAM
all_rows = [process(x) for x in huge_dataset]
total    = sum(r["price"] for r in all_rows)

# CORRECT — single pass, constant memory
total = sum(process(x)["price"] for x in huge_dataset)
```

Generator expressions are not always faster wall-clock, but they **always** beat list comprehensions on memory.

## String operations

```python
# O(n²) — Python recreates the string each iteration
result = ""
for s in strings:
    result += s

# O(n) — single allocation
result = "".join(strings)

# Building structured strings
parts = [f"row {i}" for i in range(1000)]
out   = "\n".join(parts)
```

## Database — bulk over loops

```python
# SQLAlchemy 2.0 async — bulk insert
from sqlalchemy import insert
await db.execute(insert(Item), [{"name": n} for n in names])
await db.commit()

# Django ORM
Item.objects.bulk_create([Item(name=n) for n in names], batch_size=1000)

# Avoid the N+1 trap — see django-patterns / fastapi-patterns
```

## Polars — when pandas is the bottleneck

```python
import polars as pl

# Lazy — query is optimised before execution
df = (
    pl.scan_csv("orders.csv")
    .filter(pl.col("amount") > 100)
    .group_by("customer_id")
    .agg(pl.col("amount").sum().alias("total"))
    .sort("total", descending=True)
    .collect(streaming=True)               # streams when bigger than RAM
)
```

Polars is Rust-backed, multi-threaded by default, and lazy — typical 5–30× speedup over pandas on aggregation/filter pipelines, plus much lower memory.

## FORBIDDEN

| Anti-pattern | Reason |
|---|---|
| Optimising before profiling | "Premature optimisation is the root of all evil" — measure first |
| `+` for string concat in loops | O(n²) — use `"".join()` |
| `list` for membership testing | O(n) per lookup — use `set` |
| Loading whole dataset in memory | Use generators / streaming / pagination |
| One-by-one DB inserts | Use `bulk_create`/`executemany`/SQLAlchemy `insert(...)` |
| `lru_cache` on `async def` | Doesn't cache coroutines correctly — use Redis or `aiocache` |
| Banking on JIT for production wins today | Still experimental in 3.13 — measure on YOUR workload |
| Switching whole app to free-threaded for "free speed" | Per-thread overhead can make I/O-bound code slower |

## See Also

- `python-patterns` — async vs threads vs processes decision
- `async-patterns` — TaskGroup / Semaphore / httpx pooling
- `_shared/skills/observability` — measure latency and memory in prod
- `_shared/skills/postgres-patterns` — index design, EXPLAIN, AIO in PG18

## Profiling Tools

```bash
# CPU profiling
python -m cProfile -s cumulative app.py

# Line profiling (pip install line-profiler)
kernprof -l -v script.py

# Memory profiling (pip install memory-profiler)
python -m memory_profiler script.py

# py-spy (production-safe, no code changes)
py-spy top --pid 12345
py-spy record -o profile.svg --pid 12345
```

## Common Optimizations

### Data Structures
```python
# Use set for membership testing (O(1) vs O(n))
# SLOW:
if item in large_list: ...
# FAST:
large_set = set(large_list)
if item in large_set: ...

# Use dict.get() instead of try/except
value = data.get('key', default)

# Use collections for specialized needs
from collections import defaultdict, Counter, deque
```

### Generators (memory)
```python
# WRONG — loads everything in memory
def get_all():
    return [process(x) for x in huge_dataset]

# CORRECT — lazy evaluation
def get_all():
    for x in huge_dataset:
        yield process(x)

# Or generator expression
total = sum(x.price for x in orders)  # Not [x.price for x in orders]
```

### String Operations
```python
# SLOW — string concatenation in loop
result = ""
for s in strings:
    result += s  # O(n²)

# FAST — join
result = "".join(strings)  # O(n)
```

### Database (SQLAlchemy / Django ORM)
```python
# Bulk operations (not one-by-one)
# SLOW:
for item in items:
    db.add(Item(**item))

# FAST:
db.add_all([Item(**item) for item in items])
await db.commit()

# Django bulk
Item.objects.bulk_create([Item(**item) for item in items], batch_size=1000)
```

### Caching
```python
from functools import lru_cache

@lru_cache(maxsize=256)
def expensive_computation(n: int) -> int:
    return sum(range(n))

# Async caching with Redis
import redis.asyncio as redis

cache = redis.from_url("redis://localhost")

async def get_user(id: str) -> User:
    cached = await cache.get(f"user:{id}")
    if cached:
        return User.model_validate_json(cached)
    user = await db.get(User, id)
    await cache.setex(f"user:{id}", 300, user.model_dump_json())
    return user
```

## FORBIDDEN

1. **Premature optimization** — profile FIRST, optimize SECOND
2. **`+` for string concatenation in loops** — use `"".join()`
3. **`list` for membership testing** — use `set`
4. **Loading entire dataset in memory** — use generators/pagination
5. **Individual DB inserts in loop** — use bulk operations
