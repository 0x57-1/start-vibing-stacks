---
name: pydantic-validation
version: 1.0.0
---

# Pydantic Validation — Runtime Type Safety for Python

**ALWAYS use Pydantic for API schemas, config, and data boundaries.**

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
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    DEBUG: bool = False
    REDIS_URL: str = "redis://localhost:6379"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

settings = Settings()
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

## FORBIDDEN

1. **Raw dicts for API I/O** — always Pydantic models
2. **Skipping validation** — `model_validate()` not `dict()`
3. **Single model for everything** — use Base/Create/Update/Response pattern
4. **No `from_attributes`** — needed for ORM integration
