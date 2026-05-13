---
name: docker-patterns
version: 2.0.0
description: "Docker patterns for 2026: BuildKit + Buildx Bake (default builder for Docker Compose since June 2025), multi-stage builds, distroless / chiseled bases (90% size reduction, no shell), non-root users, .dockerignore, healthchecks, additional_contexts for service deps, secrets via build mounts (not COPY), reproducible builds. Stack examples: Node 22, Python 3.13 (uv), PHP 8.4 (FPM + Nginx)."
---

# Docker Patterns (2026)

**Invoke when writing or modifying any `Dockerfile`, `docker-compose.yml`, `docker-bake.hcl`, or container build config.**

> 2026 reality: BuildKit is the only builder; Bake is the default for Compose multi-image projects (since June 2025); distroless / chiseled bases are the default for production runtime; non-root + readonly rootfs is the default. **Anything else needs justification.**

## 1. The four non-negotiables

1. **Multi-stage build** — separate build deps from runtime deps. No exceptions.
2. **Distroless or chiseled runtime** — no shell, no package manager, no curl. ~2 MB instead of ~120 MB.
3. **Non-root user** — `USER 10001:10001` in the runtime stage. Never `root`.
4. **`.dockerignore`** — at minimum: `node_modules`, `vendor`, `.git`, `.env*`, `*.log`, `dist`, `build`, `coverage`, `__pycache__`, `.venv`.

## 2. Node.js 22 — production-grade Dockerfile

```dockerfile
# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=22.11.0

# ---------- builder ----------
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts
COPY . .
RUN npm run build && npm prune --omit=dev

# ---------- runtime: distroless, no shell ----------
FROM gcr.io/distroless/nodejs22-debian12:nonroot AS runtime
WORKDIR /app
COPY --from=builder --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=builder --chown=nonroot:nonroot /app/dist         ./dist
COPY --from=builder --chown=nonroot:nonroot /app/package.json ./
USER nonroot
EXPOSE 3000
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["/nodejs/bin/node", "-e", "fetch('http://127.0.0.1:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["dist/server.js"]
```

Key 2026 patterns: `--mount=type=cache` for npm, `--ignore-scripts` (supply-chain hardening — see `secrets-management` §2025-A03), distroless `nonroot` tag, `--chown` on COPY, healthcheck against `/healthz`.

## 3. Python 3.13 + `uv` — production-grade Dockerfile

```dockerfile
# syntax=docker/dockerfile:1.7
FROM python:3.13-slim-bookworm AS builder
COPY --from=ghcr.io/astral-sh/uv:0.5 /uv /usr/local/bin/uv
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project
COPY . .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

FROM gcr.io/distroless/python3-debian12:nonroot AS runtime
WORKDIR /app
COPY --from=builder --chown=nonroot:nonroot /app /app
USER nonroot
EXPOSE 8000
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
CMD ["/app/.venv/bin/uvicorn", "myapp.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 4. PHP 8.4 (FPM + Nginx) with Composer install in builder

```dockerfile
# syntax=docker/dockerfile:1.7
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-scripts --prefer-dist --optimize-autoloader

FROM php:8.4-fpm-alpine AS runtime
RUN apk add --no-cache libzip-dev oniguruma-dev icu-dev \
 && docker-php-ext-install pdo_mysql zip opcache intl bcmath \
 && rm -rf /var/cache/apk/*
WORKDIR /var/www/html
COPY --from=vendor /app/vendor ./vendor
COPY --chown=www-data:www-data . .
USER www-data
EXPOSE 9000
HEALTHCHECK --interval=30s --timeout=3s CMD php-fpm-healthcheck || exit 1
CMD ["php-fpm"]
```

## 5. Compose with `additional_contexts` — service deps without sequential builds

For a project where service B depends on service A's image, **don't** rely on `depends_on` for build order — declare a build-time dependency:

```yaml
# docker-compose.yml
services:
  api:
    build:
      context: ./api
      dockerfile: Dockerfile

  worker:
    build:
      context: ./worker
      dockerfile: Dockerfile
      additional_contexts:
        api: "service:api"          # build worker AFTER api, with api's image as a context
```

## 6. Bake — the default Compose builder (since Jun 2025)

Compose v2 now invokes Buildx Bake by default for multi-service projects. Opt out with `COMPOSE_BAKE=false` only if you need a feature Bake doesn't support (rare).

```hcl
# docker-bake.hcl — explicit form for CI / multi-arch
variable "TAG" { default = "latest" }

group "default" {
  targets = ["api", "worker"]
}

target "api" {
  context    = "./api"
  dockerfile = "Dockerfile"
  platforms  = ["linux/amd64", "linux/arm64"]
  tags       = ["myorg/api:${TAG}"]
  cache-from = ["type=gha"]
  cache-to   = ["type=gha,mode=max"]
}

target "worker" {
  inherits  = ["api"]
  context   = "./worker"
  tags      = ["myorg/worker:${TAG}"]
}
```

```bash
# Build everything in parallel, push to registry, with cache shared via GitHub Actions
TAG=v1.2.3 docker buildx bake --push
```

## 7. Build-time secrets — `--mount=type=secret`, never `COPY .env`

```dockerfile
# syntax=docker/dockerfile:1.7
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci
```

```bash
docker buildx build --secret id=npmrc,src=$HOME/.npmrc .
```

The secret never lands in any image layer. **Never** `COPY .env` or `ENV API_KEY=...`. See `secrets-management`.

## 8. Healthchecks — match the orchestrator's expectation

```dockerfile
# Application-level check; fast; idempotent.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1
```

For Kubernetes the Dockerfile HEALTHCHECK is informational only — the cluster uses `livenessProbe` / `readinessProbe`. See `observability` §7.

## 9. Image hardening checklist

- [ ] Multi-stage build present
- [ ] Runtime stage is distroless / chiseled / scratch (no shell, no package manager)
- [ ] `USER` directive set to non-root before `CMD`
- [ ] `.dockerignore` excludes `.env*`, `node_modules`, `.git`, build outputs
- [ ] No secrets baked into layers (`docker history --no-trunc IMAGE` clean)
- [ ] `HEALTHCHECK` directive present
- [ ] Image pinned by digest in production manifests (`image@sha256:...`)
- [ ] `docker scout cves IMAGE` (or `trivy image IMAGE`) clean of HIGH/CRITICAL
- [ ] Build is reproducible — same input → same digest

## FORBIDDEN

| Pattern | Why |
|---|---|
| `FROM ubuntu:latest` (or any `latest`) | Unpinned, unreproducible |
| `RUN apt-get install ...` without `--no-install-recommends` and `rm -rf /var/lib/apt/lists/*` | Bloated layers, stale package cache |
| `COPY .env .` | Secrets in image layer forever |
| `ENV API_KEY=...` in Dockerfile | Same |
| `USER root` in runtime stage | Container escape blast radius |
| `chmod 777` on app dirs | Privilege escalation in shared envs |
| `--privileged` containers without explicit security review | Almost always wrong |
| `curl ... | sh` in RUN | Unverifiable supply chain |
| Single-stage build with dev deps in final image | Bloated, exposes build tools |
| `HEALTHCHECK NONE` | Orchestrator can't tell if app is wedged |

## See Also

- `secrets-management` — build-time secret mounts, OIDC for registry push
- `security-baseline` (2025-A03) — supply chain: pin actions by SHA, sign images (Sigstore/cosign)
- `observability` — `/healthz` + `/readyz` semantics
- `ci-pipelines` — building & pushing in CI
