---
name: api-security-python
version: 1.0.0
description: Production-grade API hardening for Python (FastAPI, Django, Flask). Rate limit, CORS, JWT, secure cookies, CSRF, OAuth2.
---

# API Security — Python

**ALWAYS invoke when building API endpoints, auth flows, or admin actions.**

> Pair this with `security-baseline` for OWASP Top 10. This skill is stack-specific hardening.

## Layered Defense

```
Edge (CDN/WAF) → Rate Limit → CORS → Headers → Auth → Authz → Validate → Logic → Encode → Audit
```

---

## 1. Security Headers

### FastAPI — middleware
```python
from fastapi import FastAPI
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeaders(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; frame-ancestors 'none'"
        )
        return response

app = FastAPI()
app.add_middleware(SecurityHeaders)
```

### Django — `settings.py`
```python
SECURE_HSTS_SECONDS = 63072000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
X_FRAME_OPTIONS = "DENY"
```

---

## 2. CORS — Strict Allowlist

```python
from fastapi.middleware.cors import CORSMiddleware
import os

ALLOW = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW,           # explicit list, NEVER ["*"] with credentials
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],
    max_age=600,
)
```

**Never** `allow_origins=["*"]` with `allow_credentials=True` — browsers reject and auth silently breaks.

---

## 3. Rate Limiting

### FastAPI — `slowapi`
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address, storage_uri="redis://localhost:6379")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/auth/login")
@limiter.limit("5/15minutes")
async def login(request: Request, body: LoginIn):
    ...
```

### Django — `django-ratelimit`
```python
from django_ratelimit.decorators import ratelimit

@ratelimit(key='ip', rate='5/15m', block=True)
def login_view(request):
    ...
```

**Limits to set:** auth (5/15min), password reset (3/hour), signup (3/hour/IP), generic write (60/min/user).

---

## 4. Cookies

### FastAPI
```python
from fastapi import Response

response.set_cookie(
    key="session",
    value=token,
    httponly=True,                              # JS cannot read
    secure=True,                                 # HTTPS only
    samesite="lax",                              # 'strict' if no cross-site flows
    max_age=60 * 60 * 24 * 7,                    # 7d
    path="/",
    domain=os.getenv("COOKIE_DOMAIN"),
)
```

---

## 5. JWT / OAuth2 — FastAPI

```python
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
import os, uuid

SECRET = os.environ["JWT_SECRET"]
ALG = "HS256"

def issue_access_token(user_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": user_id,
            "role": role,
            "iat": now,
            "exp": now + timedelta(minutes=15),
            "jti": str(uuid.uuid4()),
        },
        SECRET,
        algorithm=ALG,
    )

async def current_user(token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALG])  # pin algorithm
    except JWTError:
        raise HTTPException(401, "Invalid token")
    user = await User.get_or_none(id=payload["sub"])
    if not user:
        raise HTTPException(401, "User not found")
    return user
```

Rules:
- Access tokens: ≤ 15 min. Refresh tokens: rotate on use, store hash in DB, revocable.
- Pin `algorithms=[ALG]`. Never accept `alg: none`.
- Include `jti` for revocation lists.

---

## 6. CSRF

### Django
Built-in: `django.middleware.csrf.CsrfViewMiddleware`. Always enabled — never disable globally.
For DRF + SessionAuth, use `@ensure_csrf_cookie` on the view that bootstraps the SPA.

### FastAPI — double-submit cookie
```python
import secrets
from fastapi import Request, HTTPException

CSRF_COOKIE = "csrf-token"
CSRF_HEADER = "x-csrf-token"
UNSAFE = {"POST", "PUT", "PATCH", "DELETE"}

@app.middleware("http")
async def csrf(request: Request, call_next):
    if request.method in UNSAFE:
        cookie = request.cookies.get(CSRF_COOKIE)
        header = request.headers.get(CSRF_HEADER)
        if not cookie or cookie != header:
            raise HTTPException(403, "CSRF")
    response = await call_next(request)
    if not request.cookies.get(CSRF_COOKIE):
        response.set_cookie(CSRF_COOKIE, secrets.token_urlsafe(32),
                            secure=True, samesite="lax", path="/")
    return response
```

---

## 7. Input Validation Boundary (Pydantic)

```python
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class CreateUser(BaseModel):
    model_config = ConfigDict(extra="forbid")    # rejects unknown keys → blocks mass assignment
    email: EmailStr = Field(max_length=254)
    age: int = Field(ge=13, le=120)

@app.post("/users")
async def create(body: CreateUser):  # FastAPI validates automatically; 422 on failure
    ...
```

---

## 8. File Upload

```python
import magic                          # python-magic — reads magic bytes
ALLOWED = {"image/jpeg", "image/png", "image/webp"}

async def upload(file: UploadFile = File(...)):
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(413, "Too large")
    head = await file.read(2048)
    mime = magic.from_buffer(head, mime=True)
    if mime not in ALLOWED:
        raise HTTPException(415, "Unsupported type")
    await file.seek(0)
    # Save with UUID name, outside webroot
```

---

## 9. Password Hashing

```python
from argon2 import PasswordHasher
ph = PasswordHasher(memory_cost=19_456, time_cost=2, parallelism=1)

hashed = ph.hash(password)
try:
    ph.verify(hashed, attempt)
except argon2.exceptions.VerifyMismatchError:
    raise HTTPException(401, "Invalid credentials")

if ph.check_needs_rehash(hashed):    # transparent upgrade
    user.password = ph.hash(attempt)
```

Argon2id is the modern default. Avoid bare `hashlib`. For Django, the framework handles this — don't reinvent it.

---

## 10. SQL Injection — Use ORM Bindings

```python
# WRONG — string interpolation
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")

# CORRECT — parameterized
cursor.execute("SELECT * FROM users WHERE id = %s", [user_id])

# CORRECT — ORM
user = await User.get(id=user_id)                   # Tortoise / SQLAlchemy / Django ORM
```

`SQLAlchemy.text()` with `:param` bindings is also safe. Raw f-strings are not.

---

## Endpoint Checklist

- [ ] `Depends(current_user)` for protected routes
- [ ] User ID from `current_user`, **never** from body
- [ ] Pydantic model with `extra="forbid"`
- [ ] Authz check on the resource (object-level)
- [ ] Rate limit applied to auth + writes
- [ ] No PII in logs
- [ ] Errors: `HTTPException` with generic detail; full info to logs only

## FORBIDDEN Patterns

| Anti-pattern | Reason |
|---|---|
| `allow_origins=["*"]` with credentials | Browsers reject; auth breaks |
| Calling `jwt.decode` without `algorithms=` | `alg: none` and confusion attacks |
| Storing JWT in `localStorage` | XSS exfiltration |
| Disabling Django `CsrfViewMiddleware` globally | CSRF wide open |
| f-string interpolation in SQL | SQL injection |
| Deserializing untrusted bytes (pickle, marshal, shelve) | RCE via gadget chains — use JSON |
| `eval` / `exec` on user input | RCE |
| Logging request body or headers raw | Leaks passwords, cookies, tokens |
| Shell-mode subprocess with user input | Command injection — use list args, no shell |

## See Also

- `security-baseline` — OWASP Top 10
- `secrets-management` — env vars, rotation
- `pydantic-validation` — schema patterns
- `observability` — structured logs without PII
