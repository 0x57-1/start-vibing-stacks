---
name: pydantic-validation
version: 2.0.0
description: "Runtime type-safety for Python boundaries with Pydantic V2 (Rust-backed pydantic-core, 5–50× faster than V1). Covers the Base/Create/Update/Response/InDB multi-model pattern, V2 validators (`field_validator` + `model_validator(mode='after')`), `ConfigDict(extra='forbid')` to block mass-assignment, `TypeAdapter` for non-BaseModel types (lists of dicts, primitives), discriminated unions for polymorphic payloads, JSON Schema export for OpenAPI, snake_case ↔ camelCase aliasing, and Pydantic Settings for env config (`SettingsConfigDict`). Invoke whenever you cross a trust boundary: HTTP body, query params, env vars, queue messages, ORM-to-API conversion, or LLM tool-call validation."
---

# Pydantic V2 — Runtime Validation at Boundaries

**ALWAYS use Pydantic for API schemas, config, and any external data boundary.**

> Pydantic V1 is end-of-life — the V1 → V2 migration tool (`bump-pydantic`) handles the bulk. Anything below assumes V2 (`pydantic >= 2.x`, `pydantic-settings >= 2.x`).

## Why V2

- Core rewritten in Rust → 5–50× faster than V1
- Built-in JSON parser → no `json.loads` first
- Cleaner discriminated unions, stricter coercion modes
- Native support in FastAPI, LangChain (LLM tool args), msgspec interop

## Multi-Model Pattern

```python
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from uuid import UUID

# Base — shared fields
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr

# Create — request body (required fields)
class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

# Update — PATCH (all optional)
class UserUpdate(BaseModel):
    name: str | None = Field(None, min_length=2)
    email: EmailStr | None = None

# Response — API output
class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    is_active: bool

    model_config = {"from_attributes": True}  # Works with ORM objects

# InDB — database document (Cosmos, Mongo)
class UserInDB(UserResponse):
    doc_type: str = "user"
    hashed_password: str
```

## Validators

```python
from pydantic import field_validator, model_validator

class OrderCreate(BaseModel):
    quantity: int
    price: float
    discount: float = 0.0

    @field_validator('quantity')
    @classmethod
    def quantity_positive(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be positive')
        return v

    @model_validator(mode='after')
    def discount_not_exceed_price(self):
        if self.discount > self.price * self.quantity:
            raise ValueError('Discount exceeds total')
        return self
```

## Settings (env config)

```python
from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="forbid",                 # unknown env vars → error early
        env_nested_delimiter="__",      # DB__HOST → settings.db.host
    )

    DATABASE_URL: str = Field(min_length=10)
    SECRET_KEY: str = Field(min_length=32)
    DEBUG: bool = False
    REDIS_URL: str = "redis://localhost:6379"

@lru_cache
def get_settings() -> Settings:
    return Settings()                   # validated once, raises on missing/invalid env

settings = get_settings()
```

## Discriminated Unions (polymorphic payloads)

```python
from typing import Annotated, Literal
from pydantic import BaseModel, Field, TypeAdapter

class CardPayment(BaseModel):
    type: Literal["card"]
    last4: str
    brand: str

class PixPayment(BaseModel):
    type: Literal["pix"]
    key: str

# `type` field tells Pydantic which variant to instantiate — no isinstance dance
Payment = Annotated[CardPayment | PixPayment, Field(discriminator="type")]

class Order(BaseModel):
    id: str
    payment: Payment
```

## TypeAdapter — validate things that aren't BaseModel

When you receive a list of dicts, a primitive with constraints, or a payload you don't want to wrap in a class:

```python
from pydantic import TypeAdapter, conint

PositiveInt = conint(gt=0)
positive = TypeAdapter(PositiveInt)
positive.validate_python(42)               # 42
positive.validate_python(-1)               # ValidationError

UserList = TypeAdapter(list[UserResponse])
users = UserList.validate_python(rows)     # validates the whole list, not row-by-row
schema = UserList.json_schema()            # OpenAPI / docs
```

## JSON Schema export (OpenAPI, LLM tool calls)

```python
from app.schemas.user import UserCreate

UserCreate.model_json_schema()
# Use the result as `parameters` of an LLM tool definition (Anthropic, OpenAI),
# or merge into your OpenAPI spec.
```

## camelCase API (Python snake_case → JSON camelCase)

```python
from pydantic import ConfigDict

class ApiModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=lambda s: ''.join(
            w.capitalize() if i else w for i, w in enumerate(s.split('_'))
        ),
    )

class UserResponse(ApiModel):
    first_name: str    # JSON: "firstName"
    created_at: datetime  # JSON: "createdAt"
```

## Strict mode (when you mean it)

```python
from pydantic import BaseModel, ConfigDict

class StrictUser(BaseModel):
    model_config = ConfigDict(strict=True)   # NO coercion: "1" != 1, "true" != True
    id: int
    is_active: bool
```

Strict mode is the right default for queue messages, internal RPC, and anything machine-to-machine. For HTTP endpoints, the default lax mode (with explicit `Field(...)` constraints) is more tolerant of legacy clients.

## FORBIDDEN

1. **Raw dicts for API I/O** — always Pydantic models
2. **`dict(model)` to serialize** — use `model.model_dump()` / `model_dump_json()`
3. **Skipping validation** — `model_validate(data)`, never `Model(**data)` for untrusted input
4. **Single model for everything** — Base/Create/Update/Response/InDB
5. **Missing `from_attributes=True`** — needed when reading from ORM rows
6. **Missing `extra="forbid"` on Settings or write payloads** — opens door to mass-assignment
7. **Pydantic V1 syntax** (`@validator`, `class Config:`, `BaseSettings` from `pydantic`) — V1 is EOL, use V2 (`@field_validator`, `model_config = ConfigDict(...)`, `pydantic_settings.BaseSettings`)
8. **Hand-rolled discriminator branching** (`if data["type"] == "card": ...`) — use `Annotated[Union[...], Field(discriminator=...)]`

## See Also

- `fastapi-patterns` — request/response wiring
- `api-security-python` — `extra="forbid"` as anti-mass-assignment defense
- `_shared/skills/openapi-design` — schemas → OpenAPI 3.2

