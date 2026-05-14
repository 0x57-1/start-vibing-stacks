---
name: api-security-python
version: 2.0.0
description: "Python (FastAPI / Django / Flask) overlay on top of _shared/security-baseline v2 (OWASP Top 10:2025). Production-grade hardening: security headers via Starlette middleware and SECURE_* settings, strict CORS allowlist, rate limiting (slowapi / django-ratelimit), HttpOnly+Secure+SameSite cookies, JWT with algorithms=[ALG] pinning + jti for revocation using PyJWT (python-jose is unmaintained as of 2025), CSRF built-in for Django and double-submit cookie for FastAPI, Pydantic V2 extra='forbid' against mass-assignment, file-upload magic-byte sniffing, Argon2id passwords, parameterised SQL/ORM. Cross-references 2025-A03 (Software Supply Chain Failures) and 2025-A10 (Mishandling Exceptional Conditions)."
---

# API Security — Python (FastAPI / Django / Flask)

**ALWAYS invoke when building API endpoints, auth flows, or admin actions.**

> Stack-specific overlay on top of `_shared/skills/security-baseline` v2 (OWASP Top 10:2025). The shared skill defines §A01–§A10 anchors; this one wires the Python equivalents.

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

> **Library choice (2026):** Use **PyJWT** (`pyjwt[crypto]`) or **authlib** for OAuth2/OIDC flows. `python-jose` has been effectively unmaintained since 2024 and should be removed from dependencies. For the resource-server side that just verifies tokens, PyJWT is enough.

```python
from datetime import datetime, timedelta, timezone
import os, uuid
import jwt
from jwt import InvalidTokenError

SECRET = os.environ["JWT_SECRET"]
ALG = "HS256"                    # use RS256/EdDSA when verifying tokens minted elsewhere

def issue_access_token(user_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": user_id,
            "role": role,
            "iat": now,
            "nbf": now,
            "exp": now + timedelta(minutes=15),
            "jti": str(uuid.uuid4()),
            "iss": os.environ["JWT_ISSUER"],
            "aud": os.environ["JWT_AUDIENCE"],
        },
        SECRET,
        algorithm=ALG,
    )

async def current_user(token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = jwt.decode(
            token,
            SECRET,
            algorithms=[ALG],                # pin — never accept "alg: none"
            audience=os.environ["JWT_AUDIENCE"],
            issuer=os.environ["JWT_ISSUER"],
            options={"require": ["exp", "iat", "sub", "jti"]},
        )
    except InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    if await is_revoked(payload["jti"]):     # check revocation list (Redis set)
        raise HTTPException(401, "Token revoked")
    user = await User.get_or_none(id=payload["sub"])
    if not user:
        raise HTTPException(401, "User not found")
    return user
```

Rules:
- Access tokens ≤ 15 min. Refresh tokens: rotate on use, store **hash** in DB, revocable.
- Pin `algorithms=[ALG]`. Never accept `alg: none` or omit the kwarg (confusion attack).
- Always validate `aud` and `iss` when present.
- Include `jti` and check a revocation set for sensitive scopes.
- Store JWTs in **HttpOnly+Secure+SameSite cookies**, not `localStorage` (XSS exfiltration).

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

## 11. Outbound calls — SSRF guard (OWASP 2025 still relevant)

SSRF was demoted from a top-level OWASP category in the 2025 list but remains in scope. Any time you fetch a URL the user controls (preview cards, webhooks, image proxies), validate the destination:

```python
import ipaddress
import socket
from urllib.parse import urlparse
import httpx

PRIVATE = ipaddress.collapse_addresses([
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),     # link-local + AWS metadata
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("::1/128"),
])

def safe_url(url: str) -> str:
    p = urlparse(url)
    if p.scheme not in {"http", "https"}:
        raise ValueError("scheme")
    host = p.hostname
    if not host:
        raise ValueError("host")
    for fam, _, _, _, sockaddr in socket.getaddrinfo(host, None):
        ip = ipaddress.ip_address(sockaddr[0])
        if any(ip in net for net in PRIVATE):
            raise ValueError("private")
    return url

async def fetch_user_url(url: str):
    safe_url(url)
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=False) as c:
        return await c.get(url)
```

Disable redirect-following or re-validate every hop — otherwise an attacker can redirect from a public IP to `169.254.169.254` (cloud metadata).

## 12. OWASP 2025 deltas — Python specifics

### §A03 — Software Supply Chain Failures (NEW in 2025)

```toml
# pyproject.toml — pin everything; uv produces a deterministic lockfile
[project]
dependencies = ["fastapi>=0.115,<0.116", "pydantic>=2.6,<3"]

[tool.uv]
dev-dependencies = ["pip-audit>=2.7", "ruff>=0.5"]
```

```bash
# Lock + verify in CI
uv lock --check                              # fails if lockfile drifted
uv export --format requirements-txt --no-dev | pip-audit -r /dev/stdin --strict
```

- Use `uv` (or Poetry) to produce a deterministic lockfile; never `pip install` without one in production.
- Run `pip-audit` (PyPA) **and** subscribe to GHSA advisories for your deps.
- Pin GitHub Actions by SHA, not tag — see `_shared/skills/secrets-management`.

### §A10 — Mishandling Exceptional Conditions (NEW in 2025)

```python
# WRONG — silently swallows everything, including programming bugs
try:
    user = await get_user(id)
except Exception:
    user = None

# CORRECT — narrow except + log + propagate or translate
try:
    user = await get_user(id)
except UserNotFoundError:
    raise HTTPException(404, "user not found")
except DatabaseUnavailableError as e:
    logger.exception("db-down", extra={"user_id": id})
    raise HTTPException(503, "service unavailable") from e
# Programming errors (KeyError, TypeError) are NOT caught — let the global handler 500 + log
```

Bare `except Exception:` (or worse, `except:`) is now an explicit OWASP pattern to flag. Use `logger.exception()` so the stack trace lands in logs, return a **generic** message to the client, never the original exception text.

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

- `_shared/skills/security-baseline` v2 — OWASP Top 10:2025 (§A01–§A10 anchors)
- `_shared/skills/secrets-management` v2 — OIDC federation, gitleaks 3-layer, SOPS+age
- `_shared/skills/observability` v2 — structured logs without PII, GenAI semconv 1.41+
- `pydantic-validation` v2 — `extra="forbid"` against mass-assignment
- `fastapi-patterns` v2 — lifespan, DI, exception handlers
