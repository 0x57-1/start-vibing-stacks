# Python Performance — Profiling & Optimization

**ALWAYS invoke when optimizing slow Python code.**

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
