---
name: django-patterns
version: 1.0.0
---

# Django Patterns — Full-Stack Python (Django 5+)

**ALWAYS invoke when writing Django models, views, or serializers.**

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

## Async Views (Django 5.0+)

```python
# Use async when calling external APIs or heavy I/O
async def fetch_external_data(request):
    async with httpx.AsyncClient() as client:
        response = await client.get('https://api.example.com/data')
    return JsonResponse(response.json())
```

## Migrations Best Practices

```bash
python manage.py makemigrations --name descriptive_name
python manage.py migrate

# Check for missing migrations in CI
python manage.py makemigrations --check --dry-run
```

## FORBIDDEN

1. **Logic in views** — fat models, thin views
2. **N+1 queries** — always `select_related`/`prefetch_related`
3. **`objects.all()` without limit** — paginate or `.only()`
4. **Raw SQL without parameterization** — use ORM or `params=[]`
5. **Skipping migrations** — always `makemigrations` after model changes
