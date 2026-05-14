---
name: python-patterns
version: 2.0.0
description: "Python architecture decisions for Python 3.13 (Oct 2024) / 3.14 (Oct 2025) projects. Framework selection (FastAPI / Django 5.2 LTS / Flask / scripts), async vs sync rules, free-threaded mode awareness (officially supported in 3.14 via PEP 779), modern typing (`X | None`, `TypeIs`, type-param defaults), project structure per app type, error handling, background-task choice. Pairs with the per-framework skills (fastapi-patterns, django-patterns, scripting-automation). Invoke for any new Python project, framework choice, or architectural decision."
---

# Python Patterns — Architecture & Decisions (3.13 / 3.14)

**ALWAYS invoke when making Python architecture decisions.**

## Version Policy (2026)

- **Python 3.13** (Oct 7, 2024) — minimum for new projects
- **Python 3.14** (Oct 7, 2025) — recommended; brings **officially supported free-threaded mode** (PEP 779), template strings (PEP 750), deferred annotation evaluation
- **Package manager: `uv`** (Astral, acquired by OpenAI Mar 2026) — 10–100× faster than pip, 10–20× faster than Poetry; surpassed Poetry in monthly downloads in early 2026. Pin `uv` for new projects unless a constraint forces Poetry/pip.
- **Lint + format: `ruff`** (one Rust binary; replaces flake8 + isort + black + pydocstyle + pyupgrade + autoflake)
- **Type checker: `pyright`** for correctness (97.8% conformance), `ty` (Astral) when Pyright is too slow on huge codebases — still beta but 10–60× faster

## Free-Threaded vs GIL — When to care

| Workload | Build | Notes |
|---|---|---|
| Web server (I/O-bound) | Standard GIL | asyncio handles concurrency; free-threading buys little |
| Mixed I/O + light CPU | Standard GIL | Standard build is faster per-thread |
| **CPU-bound multi-thread** (parsing, math, ML pre-processing) | **Free-threaded 3.14** | Real parallelism — replaces the multiprocessing dance |
| Library author | Both | Test with `python3.14t` to flag thread-safety bugs |

The free-threaded interpreter ships as a separate binary (`python3.14t`). It's slower per-thread (~10–15% overhead) than the GIL build — only adopt when you actually need parallel CPU.

## Framework Selection

```
What are you building?
├── API / Microservices       → FastAPI (async, Pydantic, fast)
├── Full-stack / CMS / Admin  → Django (batteries-included)
├── Lightweight web app       → Flask (minimal)
├── AI/ML API serving         → FastAPI (Pydantic, uvicorn)
├── Local scripts / automation → Scripts (httpx, argparse, rich)
├── WordPress / Ads / ETL     → Scripts (no framework needed)
└── Background workers        → Celery + any framework
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

Modern syntax — `X | None` over `Optional[X]`, lowercase generics, `TypeIs` for narrowing.

```python
from typing import TypeIs

def find_user(id: int) -> User | None: ...                     # 3.10+ union syntax
def process(data: str | dict[str, object]) -> None: ...
def get_items() -> list[Item]: ...

# TypeIs (3.13+) — narrow types in type guards (better than TypeGuard for negative branches)
def is_admin(user: User | Guest) -> TypeIs[User]:
    return isinstance(user, User) and user.role == "admin"

# Type parameter defaults (3.13+) — generic classes with sensible defaults
class Repo[T = User]:
    def find(self, id: str) -> T | None: ...
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

### Local Scripts / Automation
```
project/
├── main.py           # CLI entry (argparse + match/case)
├── scripts/          # One module per task
├── lib/
│   ├── config.py     # Pydantic Settings (.env)
│   ├── http_client.py # httpx + tenacity retry
│   └── logger.py     # rich logging
├── data/             # Input/output files
├── logs/
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
2. **Sync libraries in async code** — blocks event loop (`requests`, `psycopg2` sync, `pymongo` sync, `time.sleep`)
3. **No type hints on public APIs** — always type
4. **Raw SQL without parameterization** — injection risk (use ORM bindings or `:name` / `?` placeholders)
5. **`import *`** — explicit imports only
6. **`Optional[X]`** — write `X | None` (3.10+ syntax)
7. **`pip install` in new projects** — use `uv add` (uv is the 2026 default; pip still fine for legacy)
8. **Per-tool config files (`.flake8`, `.isort.cfg`, `pyproject` for black + isort + ruff…)** — consolidate under `[tool.ruff]` in `pyproject.toml`
9. **Banking on free-threading for an I/O-bound web app** — use asyncio; the GIL build is faster

## See Also

- `fastapi-patterns` / `django-patterns` / `scripting-automation` — per-application-type setup
- `pydantic-validation` — boundary validation (Pydantic V2)
- `pytest-testing` — pytest 9 + pytest-asyncio 1
- `async-patterns` — asyncio.timeout, TaskGroup, AnyIO
- `python-performance` — profiling, free-threading trade-offs
