# FastAPI Patterns — High-Performance Async APIs

**ALWAYS invoke when writing FastAPI routes, dependencies, or middleware.**

## Route Pattern

```python
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import UserCreate, UserResponse
from app.services.user import UserService
from app.api.deps import get_current_user, get_db

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(data: UserCreate, db=Depends(get_db)):
    service = UserService(db)
    return await service.create(data)

@router.get("/me", response_model=UserResponse)
async def get_me(user=Depends(get_current_user)):
    return user
```

## Dependency Injection

```python
# app/api/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def get_db():
    async with async_session() as session:
        yield session  # Auto-cleanup

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db=Depends(get_db),
) -> User:
    user = await verify_token(credentials.credentials, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return user
```

## Pydantic Settings (env config)

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    DEBUG: bool = False
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"

settings = Settings()
```

## Middleware

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware
@app.middleware("http")
async def add_request_id(request, call_next):
    request_id = str(uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response
```

## SQLAlchemy 2.0 Async

```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

engine = create_async_engine(settings.DATABASE_URL, pool_size=20, max_overflow=10)
async_session = async_sessionmaker(engine, expire_on_commit=False)

# Repository pattern
class UserRepository:
    def __init__(self, session):
        self.session = session

    async def get_by_id(self, id: UUID) -> User | None:
        result = await self.session.execute(
            select(User).where(User.id == id)
        )
        return result.scalar_one_or_none()
```

## Production Deployment

```bash
# uvicorn with gunicorn (production)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Docker
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

## FORBIDDEN

1. **`def` routes with async DB calls** — use `async def`
2. **Business logic in routes** — use services layer
3. **Hardcoded secrets** — use Pydantic Settings + `.env`
4. **No response_model** — always specify for auto-docs
5. **Catching bare `Exception`** — catch specific exceptions
