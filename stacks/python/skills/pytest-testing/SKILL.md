# Pytest Testing — Python Testing Patterns

**ALWAYS invoke AFTER implementing any feature.**

## Structure

```
tests/
├── conftest.py          # Shared fixtures
├── unit/
│   ├── test_services.py
│   └── test_models.py
├── integration/
│   ├── test_api.py
│   └── test_db.py
└── e2e/
    └── test_flows.py
```

## Fixtures

```python
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def db_session():
    async with async_session() as session:
        yield session
        await session.rollback()  # Cleanup

@pytest.fixture
def sample_user():
    return {"name": "Test User", "email": f"test_{uuid4().hex[:8]}@test.com", "password": "Pass1234!"}
```

## Async Tests

```python
import pytest

@pytest.mark.asyncio
async def test_create_user(client, sample_user):
    response = await client.post("/api/v1/users", json=sample_user)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == sample_user["email"]
    assert "id" in data
    assert "password" not in data  # Never leak passwords

@pytest.mark.asyncio
async def test_get_me_unauthorized(client):
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401
```

## Parameterized Tests

```python
@pytest.mark.parametrize("email,expected", [
    ("valid@test.com", 201),
    ("invalid-email", 422),
    ("", 422),
])
async def test_email_validation(client, email, expected):
    response = await client.post("/api/v1/users", json={"name": "Test", "email": email, "password": "Pass1234!"})
    assert response.status_code == expected
```

## Mocking

```python
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_external_api_failure(client):
    with patch("app.services.external.fetch_data", new_callable=AsyncMock) as mock:
        mock.side_effect = ConnectionError("API down")
        response = await client.get("/api/v1/data")
        assert response.status_code == 503
```

## Commands

```bash
pytest                       # Run all
pytest -x                    # Stop on first failure
pytest --tb=short            # Short traceback
pytest -k "test_create"      # Filter by name
pytest --cov=app --cov-report=html  # Coverage
pytest -n auto               # Parallel (pytest-xdist)
```

## FORBIDDEN

1. **No fixtures for cleanup** — always rollback/cleanup
2. **Hardcoded test data** — use factories/uuid
3. **Testing implementation** — test behavior, not internals
4. **Skipping async tests** — use `pytest-asyncio`
5. **No coverage in CI** — `--cov --cov-fail-under=70`
