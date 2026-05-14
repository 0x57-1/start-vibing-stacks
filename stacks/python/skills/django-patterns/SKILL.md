---
name: django-patterns
version: 2.0.0
description: "Django 5.2 LTS (April 2025, supported through April 2028) patterns for full-stack Python. Covers Composite Primary Keys (new in 5.2), `select_related`/`prefetch_related` for N+1 prevention, fat-model/thin-view discipline with custom managers, Django REST Framework viewsets/serializers/permissions, **async views** (5.0+) plus the honest caveat that the ORM remains synchronous — `sync_to_async()` is required when calling ORM from `async def`. Includes `pyproject.toml` + uv setup, migration discipline, and the upgrade timeline (Django 4.2 LTS support ends April 2026 — projects must be on 5.2)."
---

# Django Patterns — Django 5.2 LTS (2025–2028)

**ALWAYS invoke when writing Django models, views, or serializers.**

## Version Policy (2026)

| Branch | Released | Support ends | Status |
|---|---|---|---|
| **5.2 LTS** | April 2025 | **April 2028** | ✅ Use this for new projects |
| 5.1 | Aug 2024 | Apr 2025 | EOL |
| 4.2 LTS | Apr 2023 | **April 2026** | ⚠️ Plan upgrade NOW if still on it |

Django 5.2 brings **Composite Primary Keys**, automatic model imports in `manage.py shell`, and simplified `BoundField` overrides. It's the LTS to standardise on for the next 2 years.

## Setup with uv

```bash
uv init my-django-app && cd my-django-app
uv add django>=5.2 djangorestframework psycopg[binary] django-environ
uv add --dev pytest pytest-django ruff mypy django-stubs

uv run django-admin startproject config .
uv run python manage.py startapp users
```

## Model Design (Fat Models, Thin Views)

```python
from django.db import models
from django.utils import timezone
import uuid

class TimeStampedModel(models.Model):
    """Abstract base — reuse in all models."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class User(TimeStampedModel):
    email = models.EmailField(unique=True, db_index=True)
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    # Fat model: business logic HERE
    def deactivate(self):
        self.is_active = False
        self.save(update_fields=['is_active', 'updated_at'])

    # Custom manager
    objects = UserManager()
```

## QuerySet Optimization

```python
# ALWAYS use select_related for ForeignKey
users = User.objects.select_related('profile').filter(is_active=True)

# ALWAYS use prefetch_related for ManyToMany
posts = Post.objects.prefetch_related('tags', 'comments').all()

# Use .only() for specific fields
User.objects.only('id', 'email').filter(is_active=True)

# Avoid N+1 — NEVER loop queries
# WRONG:
for post in Post.objects.all():
    print(post.author.name)  # N+1!

# CORRECT:
for post in Post.objects.select_related('author'):
    print(post.author.name)  # 1 query
```

## Django REST Framework

```python
# serializers.py
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'created_at']
        read_only_fields = ['id', 'created_at']

# views.py
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination
```

## Composite Primary Keys (new in 5.2)

```python
from django.db.models import CompositePrimaryKey

class OrderLine(models.Model):
    pk = CompositePrimaryKey("order", "product")
    order   = models.ForeignKey(Order,   on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    qty     = models.PositiveIntegerField()
```

Use composite PKs for join tables that have no business identity of their own — saves an autoincrement column and an index.

## Async Views (5.0+) — and the ORM caveat

```python
import httpx
from django.http import JsonResponse
from asgiref.sync import sync_to_async

# OK — purely external I/O, no ORM
async def fetch_external_data(request):
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get("https://api.example.com/data")
    return JsonResponse(response.json())

# ORM is still SYNCHRONOUS — you MUST adapt it
async def list_users(request):
    users = await sync_to_async(list, thread_sensitive=True)(
        User.objects.filter(is_active=True)[:50]
    )
    return JsonResponse({"users": [u.email for u in users]})
```

Django itself notes: *"We're still working on async support for the ORM and other parts of Django."* Until that lands, calling ORM in `async def` without `sync_to_async()` will either deadlock or raise `SynchronousOnlyOperation`. **For DB-heavy apps in 2026, sync views remain the default**; reach for async only when most of the work is external I/O.

## Migrations Best Practices

```bash
python manage.py makemigrations --name descriptive_name
python manage.py migrate

# Check for missing migrations in CI
python manage.py makemigrations --check --dry-run
```

## Settings — env-driven, no surprises

```python
# config/settings.py
import environ
from pathlib import Path

env = environ.Env(DEBUG=(bool, False))
BASE_DIR = Path(__file__).resolve().parent.parent
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("SECRET_KEY")
DEBUG      = env("DEBUG")
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=[])

DATABASES = {"default": env.db()}              # parses DATABASE_URL
CACHES    = {"default": env.cache()}           # parses CACHE_URL

# Security defaults — see api-security-python
SECURE_HSTS_SECONDS = 31_536_000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = True
```

## FORBIDDEN

| Anti-pattern | Reason |
|---|---|
| Logic in views | Fat models, thin views — keeps logic testable & reusable |
| N+1 queries | Always `select_related` (FK) / `prefetch_related` (M2M) |
| `Model.objects.all()` without `.only()`/pagination | Loads whole table into memory |
| Raw SQL with f-strings | SQL injection — use ORM or `params=[...]` |
| Skipping migrations | `makemigrations --check --dry-run` in CI |
| ORM in `async def` without `sync_to_async()` | `SynchronousOnlyOperation` / deadlock |
| Disabling `CsrfViewMiddleware` globally | Wide-open CSRF |
| Plain `pip` for new projects | Use `uv` |
| Staying on Django 4.2 LTS past April 2026 | Out of security support |
| New project on Django < 5.2 | 5.2 is the current LTS — start here |

## See Also

- `api-security-python` — Django settings checklist (HSTS, CSRF, sessions, CORS)
- `pydantic-validation` — DRF-Spectacular + Pydantic for OpenAPI (when DRF serializers aren't enough)
- `pytest-testing` — `pytest-django` setup
- `_shared/skills/postgres-patterns` — `uuidv7()`, virtual generated columns (PG18) usable from Django
- `_shared/skills/observability` — Django + structlog + OpenTelemetry
