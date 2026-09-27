---
name: fastapi-patterns
version: 2.0.1
description: "FastAPI patterns for Python 3.13/3.14 production APIs in 2026. Covers lifespan context manager (replaces deprecated @app.on_event), Pydantic V2 (Rust-backed), SQLAlchemy 2.0 async with Mapped[] type hints + async_sessionmaker(expire_on_commit=False) + pool_pre_ping, dependency injection with @lru_cache for settings and yield-based deps for cleanup, mandatory async/sync separation (NEVER mix sync DB driver in async def — freezes the worker), security headers + CORS via Starlette middleware, BackgroundTasks vs Celery/ARQ, deployment with uvicorn (production-ready since 2024 — gunicorn no longer required for most workloads). Invoke when writing FastAPI routes, dependencies, middleware, lifespan, or DB integration."
---

# FastAPI Patterns — Production APIs (2026)

**ALWAYS invoke when writing FastAPI routes, dependencies, middleware, lifespan, or DB integration.**

> Pair with `pydantic-validation` for schemas, `api-security-python` for OWASP/Sanctum equivalents, `async-patterns` for `asyncio.timeout`/TaskGroup, `pytest-testing` for `httpx.AsyncClient` test client.

## Project Structure

```
app/
├── main.py             # FastAPI app + lifespan
├── api/
│   ├── v1/
│   │   ├── routes/     # Thin endpoint handlers (HTTP only)
│   │   └── deps.py     # Auth, db, current_user, request_id
│   └── deps.py
├── core/
│   ├── config.py       # Pydantic Settings, @lru_cache
│   ├── security.py     # JWT issue/verify, password hashing
│   └── exceptions.py
├── db/
│   ├── base.py         # SQLAlchemy DeclarativeBase
│   ├── models/         # SQLAlchemy ORM (Mapped[])
│   └── session.py      # engine + async_sessionmaker
├── schemas/            # Pydantic V2 models (Base/Create/Update/Response)
├── services/           # Business logic — routers DELEGATE here
└── tests/
```

## Lifespan — startup/shutdown the modern way

`@app.on_event("startup"|"shutdown")` is **deprecated**. Use a single `lifespan` async context manager:

```python
# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
import httpx

from app.db.session import engine
from app.core.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ---- startup ----
    app.state.http = httpx.AsyncClient(timeout=10.0)
    yield
    # ---- shutdown ----
    await app.state.http.aclose()
    await engine.dispose()

app = FastAPI(
    title="MyAPI",
    version="1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
)
```

Anything that needs setup once and teardown on shutdown (HTTP clients, DB pool, message broker, cache) goes here — not in module-level globals.

## Route — thin, typed, delegates

```python
from fastapi import APIRouter, Depends, status
from app.schemas.user import UserCreate, UserResponse
from app.services.user import UserService
from app.api.v1.deps import get_user_service, get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create user",
)
async def create_user(
    body: UserCreate,
    svc: UserService = Depends(get_user_service),
) -> UserResponse:
    return await svc.create(body)

@router.get("/me", response_model=UserResponse)
async def get_me(user = Depends(get_current_user)) -> UserResponse:
    return user
```

Routes don't touch the DB. Services do. Routes don't catch exceptions to translate codes either — exception handlers do.

## Dependency Injection — patterns

```python
# app/api/v1/deps.py
from functools import lru_cache
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings  # @lru_cache below
from app.db.session import async_session
from app.services.user import UserService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# yield-based — auto cleanup on response (or exception)
async def get_db() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise

# composition — DI just plugs sub-deps in
def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(db)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    svc: UserService = Depends(get_user_service),
):
    user = await svc.from_token(token)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")
    return user
```

```python
# app/core/config.py — settings cached, validated at import
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="forbid")

    DATABASE_URL: str
    SECRET_KEY: str
    DEBUG: bool = False
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

@lru_cache
def get_settings() -> Settings:
    return Settings()  # raises ValidationError if env missing/invalid

settings = get_settings()
```

## SQLAlchemy 2.0 Async — `Mapped[]` style

```python
# app/db/base.py
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

# app/db/models/user.py
from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id:         Mapped[UUID]      = mapped_column(primary_key=True, default=uuid4)
    email:      Mapped[str]       = mapped_column(String(320), unique=True, index=True)
    name:       Mapped[str]       = mapped_column(String(255))
    is_active:  Mapped[bool]      = mapped_column(default=True)
    created_at: Mapped[datetime]  = mapped_column(server_default="now()")

# app/db/session.py
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,           # postgresql+asyncpg://… for PG; mysql+asyncmy://… for MySQL/MariaDB
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,              # detect stale conns; mandatory in 2026
    pool_recycle=1800,               # recycle conns every 30 min
)
async_session = async_sessionmaker(engine, expire_on_commit=False)
```

`Mapped[]` is mandatory in 2.0 — `Column()` without `Mapped[]` loses type inference. `expire_on_commit=False` prevents the "DetachedInstanceError" trap when you return ORM rows from an endpoint after the session closed.

### Repository pattern

```python
# app/services/user.py
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.user import User

class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, id: UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.id == id))
        return result.scalar_one_or_none()

    async def create(self, data) -> User:
        user = User(email=data.email, name=data.name)
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
```

## Async / Sync — never mix

```python
# WRONG — sync psycopg2 inside async def → freezes the event loop for ALL users
@router.get("/users")
async def list_users():
    rows = sync_psycopg2.execute("SELECT * FROM users")  # ❌
    return rows

# CORRECT — async driver (asyncpg) inside async def
@router.get("/users")
async def list_users(db: AsyncSession = Depends(get_db)):
    return (await db.execute(select(User))).scalars().all()

# CORRECT — sync driver inside def → FastAPI runs in threadpool, doesn't block loop
@router.get("/legacy")
def list_legacy_users():                                  # plain def
    return SyncSession().query(User).all()
```

If you're stuck with sync drivers (psycopg2, pymongo sync, mysqlclient), **declare the route as `def`, not `async def`**. FastAPI offloads it. Mixing the two paradigms inside `async def` is the #1 cause of "the API hangs under load".

## Middleware

```python
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from uuid import uuid4

app.add_middleware(GZipMiddleware, minimum_size=1024)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,    # explicit list — never ["*"] with credentials
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)

@app.middleware("http")
async def add_request_id(request, call_next):
    rid = request.headers.get("x-request-id", str(uuid4()))
    request.state.request_id = rid
    response = await call_next(request)
    response.headers["X-Request-ID"] = rid
    return response
```

For the full security-headers / CORS / rate-limit pattern see `api-security-python`.

## Exception handlers — translate, don't catch

```python
# app/core/exceptions.py
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse

class NotFoundError(Exception):
    def __init__(self, resource: str, id: str) -> None:
        self.resource, self.id = resource, id

def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(NotFoundError)
    async def not_found(_: Request, exc: NotFoundError):
        return JSONResponse(
            status_code=404,
            content={"type": "/problems/not-found",
                     "title": f"{exc.resource} not found",
                     "instance": exc.id},
        )
```

Use `application/problem+json` shape — see the universal `openapi-design` skill.

## Background work — pick by need

## Jev worker

No `TYPESAFE_API_KEY`, or `SVS_JEV=0`: the table below.

With a key: Choice `background_tasks` | `arq` | `dramatiq` | `celery` | `temporal`
before the long worker examples. Read only the winner. Confidence &lt; 0.75 →
the table (ARQ is the lightweight default). Questions:
`typesafe-jev/reference/skill-routines.md` § stack-pick.

| Tool | When |
|---|---|
| `BackgroundTasks` (built-in) | < 1 s, in-process, fire-and-forget after response |
| **ARQ** | Lightweight async tasks via Redis; preferred for FastAPI |
| **Dramatiq** | Actor-based, simpler than Celery |
| **Celery** | Distributed, complex retries/chains, multi-language workforce |
| **Temporal / Hatchet** | Long-running workflows (hours/days), need replay |

## Production Deployment

```dockerfile
# syntax=docker/dockerfile:1.7
FROM python:3.13-slim-bookworm AS builder
COPY --from=ghcr.io/astral-sh/uv:0.5 /uv /usr/local/bin/uv
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv uv sync --frozen --no-dev --no-install-project
COPY . .
RUN --mount=type=cache,target=/root/.cache/uv uv sync --frozen --no-dev

FROM gcr.io/distroless/python3-debian12:nonroot
WORKDIR /app
COPY --from=builder --chown=nonroot:nonroot /app /app
USER nonroot
EXPOSE 8000
CMD ["/app/.venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

`uvicorn` is **production-ready** since the rewrite — `gunicorn` as a process manager is no longer required for most deployments. Use `--workers N` to fork. For Kubernetes, a single worker per pod + horizontal scaling is generally cleaner than multi-worker pods.

## FORBIDDEN

| Pattern | Why |
|---|---|
| `@app.on_event("startup"\|"shutdown")` | Deprecated — use `lifespan` |
| `class Config:` inside Pydantic models | Pydantic V1 syntax — use `model_config = ConfigDict(...)` |
| `from sqlalchemy import Column` for new models | 2.0 style is `mapped_column` + `Mapped[]` |
| Sync DB call inside `async def` route | Blocks event loop for everyone |
| `def` route doing async work | Run inside `async def` to use `await` |
| `Settings()` called per-request | Reads env each time — wrap in `@lru_cache` |
| `response_model=None` on a public endpoint | Loses validation + auto-docs |
| `allow_origins=["*"]` with `allow_credentials=True` | Browser silently blocks; auth breaks |
| Catching bare `Exception` in routes | Hides real bugs; use exception handlers |
| `engine` created at module scope without `pool_pre_ping=True` | Stale conns → 500s after pool idle |

## See Also

- `pydantic-validation` — V2 schema patterns (Base/Create/Update/Response)
- `api-security-python` — security headers, CORS, JWT, rate limit, CSRF
- `async-patterns` — asyncio.timeout, TaskGroup, httpx best practice
- `pytest-testing` — async client fixture + DB rollback
- `_shared/skills/openapi-design` — `application/problem+json` shape
- `_shared/skills/observability` — request IDs, structured logs, GenAI semconv
