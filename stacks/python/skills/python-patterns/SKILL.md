# Python Patterns — Architecture & Decision-Making

**ALWAYS invoke when making Python architecture decisions.**

## Framework Selection

```
What are you building?
├── API / Microservices     → FastAPI (async, Pydantic, fast)
├── Full-stack / CMS / Admin → Django (batteries-included)
├── Simple / Script         → Flask (minimal)
├── AI/ML API serving       → FastAPI (Pydantic, uvicorn)
└── Background workers      → Celery + any framework
```

## Async vs Sync

```
I/O-bound (waiting for DB, HTTP, files) → async def
CPU-bound (computing, parsing)          → def + multiprocessing

Don't:
├── Mix sync and async carelessly
├── Use sync libraries in async code (blocks event loop!)
└── Force async for CPU work
```

### Async Library Selection

| Need | Library |
|------|---------|
| HTTP client | `httpx` |
| PostgreSQL | `asyncpg` |
| Redis | `redis[async]` |
| File I/O | `aiofiles` |
| ORM | SQLAlchemy 2.0+ async, Tortoise |

## Type Hints (MANDATORY for public APIs)

```python
from typing import Optional

def find_user(id: int) -> Optional[User]: ...
def process(data: str | dict) -> None: ...
def get_items() -> list[Item]: ...
```

## Project Structure

### FastAPI
```
app/
├── main.py           # FastAPI app + startup
├── api/v1/
│   ├── routes/       # Endpoints
│   └── deps.py       # Dependencies (auth, db)
├── models/           # SQLAlchemy / Beanie models
├── schemas/          # Pydantic schemas
├── services/         # Business logic
├── core/
│   ├── config.py     # Pydantic Settings
│   └── security.py   # Auth helpers
└── tests/
```

### Django
```
myproject/
├── manage.py
├── config/           # Settings, URLs, ASGI/WSGI
├── apps/
│   ├── users/        # Per-app: models, views, serializers, tests
│   └── products/
└── tests/
```

## Error Handling

```python
# Custom exceptions in services
class NotFoundError(Exception):
    def __init__(self, resource: str, id: str):
        self.resource = resource
        self.id = id

# FastAPI exception handler
@app.exception_handler(NotFoundError)
async def not_found_handler(request, exc):
    return JSONResponse(status_code=404, content={
        "error": "not_found",
        "message": f"{exc.resource} {exc.id} not found"
    })
```

## Background Tasks

| Solution | Best For |
|----------|----------|
| `BackgroundTasks` | Simple, in-process, fire-and-forget |
| `Celery` | Distributed, retries, complex workflows |
| `ARQ` | Async, Redis-based, lightweight |
| `Dramatiq` | Actor-based, simpler than Celery |

## FORBIDDEN

1. **Business logic in routes/views** — use services layer
2. **Sync libraries in async code** — blocks event loop
3. **No type hints on public APIs** — always type
4. **Raw SQL without parameterization** — injection risk
5. **`import *`** — explicit imports only
