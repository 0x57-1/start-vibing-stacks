---
name: pytest-testing
version: 2.0.0
description: "Pytest 9 (Nov 2025) testing patterns for Python 3.13/3.14. Covers conftest fixtures with autouse cleanup, parametrize + the new pytest 9 subtests API, async testing with pytest-asyncio 1.0 (May 2025 — `event_loop` fixture removed) and AnyIO for backend-agnostic tests, httpx.AsyncClient + ASGITransport as the FastAPI test client, DB rollback fixtures, mocking with `unittest.mock.AsyncMock`, parallel runs with pytest-xdist + sharding for CI, coverage with `--cov-fail-under` gate, and uv-friendly invocation. Invoke after writing any feature, fixture, or before merging."
---

# Pytest 9 — Python Testing Patterns (2026)

**ALWAYS invoke AFTER implementing a feature, before opening a PR, and as part of CI.**

## Toolchain

| Tool | Version | Notes |
|---|---|---|
| `pytest` | **9.0+** (Nov 5, 2025) | Subtests built-in; new collection internals |
| `pytest-asyncio` | **1.0+** (May 26, 2025) | `event_loop` fixture removed; preliminary 3.14 support |
| `anyio[pytest]` | 4.x | Backend-agnostic async tests (asyncio + trio) |
| `pytest-cov` | 6.x | `--cov` + `--cov-fail-under` |
| `pytest-xdist` | 3.x | Parallel + sharding for CI |
| `httpx` | 0.27+ | `AsyncClient` + `ASGITransport` for FastAPI |
| `pytest-mock` | optional | `mocker` fixture wrapping unittest.mock |

Install via uv:

```bash
uv add --dev pytest pytest-asyncio pytest-cov pytest-xdist httpx anyio
```

## Structure

```
tests/
├── conftest.py            # Shared fixtures (event-loop policy, DB, client)
├── factories.py           # Test data factories (uuid + faker)
├── unit/
│   ├── test_services.py
│   └── test_models.py
├── integration/
│   ├── test_api.py
│   └── test_db.py
└── e2e/
    └── test_flows.py
```

## `pyproject.toml` configuration

```toml
[tool.pytest.ini_options]
minversion = "9.0"
asyncio_mode = "auto"                       # @pytest.mark.asyncio not required
asyncio_default_fixture_loop_scope = "session"
addopts = [
    "-ra",                                  # short summary for skip/xfail/error
    "--strict-markers",
    "--strict-config",
    "--cov=app",
    "--cov-report=term-missing",
    "--cov-fail-under=80",
]
testpaths = ["tests"]
markers = [
    "slow: marks tests as slow (deselect with -m 'not slow')",
    "e2e: end-to-end tests requiring external services",
]
```

## Async client fixture (FastAPI)

`pytest-asyncio` 1.0 dropped the `event_loop` fixture. Use the new `asyncio_default_fixture_loop_scope = "session"` setting (above) instead of overriding the loop manually.

```python
# tests/conftest.py
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.session import async_session, engine
from app.db.base import Base

@pytest_asyncio.fixture(scope="session", autouse=True)
async def _create_schema():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture
async def db():
    """Per-test session that always rolls back — no test pollutes another."""
    async with async_session() as session:
        yield session
        await session.rollback()
```

## AnyIO — backend-agnostic async tests

When the code under test must work for both asyncio and trio (e.g. shared library code), use AnyIO instead of pytest-asyncio:

```python
import pytest

pytestmark = pytest.mark.anyio        # whole module is async

async def test_works_under_either_backend(anyio_backend):
    # anyio_backend is parametrised over ['asyncio', 'trio']
    ...
```

Configure once in `pyproject.toml`:

```toml
[tool.pytest.ini_options]
anyio_mode = "auto"
```

## Subtests (new in pytest 9)

For dataset-driven tests where you want **each row reported individually** without the parametrize ID overhead:

```python
def test_email_normalization(subtests):
    cases = [("A@B.com", "a@b.com"), (" a@b.com ", "a@b.com")]
    for raw, expected in cases:
        with subtests.test(raw=raw):
            assert normalize_email(raw) == expected
```

Each subtest reports as a distinct outcome — failures don't stop the others.

## Parametrize — for combinatorial inputs

```python
@pytest.mark.parametrize(
    "email,status",
    [
        ("valid@test.com", 201),
        ("invalid-email",  422),
        ("",               422),
        ("a" * 320,        422),
    ],
    ids=["valid", "no-at", "empty", "too-long"],
)
async def test_email_validation(client, email, status):
    body = {"name": "Test", "email": email, "password": "Pass1234!"}
    r = await client.post("/api/v1/users", json=body)
    assert r.status_code == status
```

## Mocking

```python
from unittest.mock import AsyncMock, patch
import pytest

@pytest.mark.anyio
async def test_external_api_failure(client):
    with patch("app.services.external.fetch_data", new_callable=AsyncMock) as mock:
        mock.side_effect = ConnectionError("API down")
        r = await client.get("/api/v1/data")
        assert r.status_code == 503
```

For HTTP mocking specifically, prefer `respx` (drop-in for httpx) over hand-rolled patches.

## Test data factories

```python
# tests/factories.py
from uuid import uuid4
from faker import Faker

fake = Faker()

def user_payload(**overrides):
    return {
        "name":     fake.name(),
        "email":    f"{uuid4().hex[:8]}@test.com",
        "password": "Pass1234!",
        **overrides,
    }
```

Factories are functions, not classes — keeps them testable, composable, type-safe.

## Coverage gate

```bash
pytest --cov=app --cov-report=term-missing --cov-fail-under=80
```

Set the gate per package, raise it incrementally — never lower it. Use `--cov-config=.coveragerc` to exclude generated code (`migrations/`, `__init__.py`).

## CI parallelism + sharding

```bash
# Local — use all cores
uv run pytest -n auto

# CI — split tests across N runners (matrix job in GitHub Actions)
uv run pytest --shard-id=$SHARD_INDEX --num-shards=$TOTAL_SHARDS
```

`pytest-xdist` distributes tests across processes; `pytest-split` (or the built-in `--shard` style on newer versions) splits across CI runners.

## FORBIDDEN

| Anti-pattern | Reason |
|---|---|
| `@pytest_asyncio.fixture(loop_scope="function")` for DB-heavy suites | Recreates pool every test → slow; use `session` scope + per-test rollback |
| Defining your own `event_loop` fixture | Removed in pytest-asyncio 1.0 — use `asyncio_default_fixture_loop_scope` |
| Hardcoded test data (`"test@test.com"`) | Tests collide in parallel — use uuid/faker |
| Testing private methods (`_calculate_x`) | Test public behaviour, not internals |
| No cleanup → flaky tests | Always rollback or use isolated DB per test |
| `print()` for debugging | Use `pytest -s` + `caplog` fixture |
| Skipping coverage in CI | `--cov-fail-under=N` gate, raise over time |
| Catching `Exception` then asserting | Use `pytest.raises(SpecificError)` |
| Importing app at module top in slow tests | Lazy-import in fixtures so collection is fast |

## See Also

- `fastapi-patterns` — endpoints + DI under test
- `pydantic-validation` — schema fuzzing with hypothesis
- `async-patterns` — TaskGroup/timeout patterns the tests verify
- `_shared/skills/playwright-automation` — for browser/E2E coverage
