---
name: podman-patterns
version: 1.1.0
description: "Podman on macOS for local tests: install, podman machine, a throwaway database container, and a pod for the app even when the test has no database. Also Quadlet, play kube, and compose on Linux. Use when a php/node/python test needs MariaDB, Postgres, Redis, or the same image CI runs."
---

# Podman Patterns (2026)

**Invoke when a local test needs a database or a containerized app, when installing Podman on a Mac, or when writing Quadlet / play-kube definitions on Linux.**

> 2026 reality: **Rootless is the default**. No container runtime should run as root. Podman + Quadlet is the recommended path on Linux for production services. `podman play kube` replaces simple `kubectl apply` for single-pod workloads. Dockerfiles are fully compatible.

## Why Podman in 2026

| Aspect | Docker | Podman | Winner |
|--------|--------|--------|--------|
| Daemon | Required (root) | None | Podman |
| Root | Required for daemon | Rootless by default | Podman |
| Kubernetes | Separate (kind/minikube) | `podman play kube` | Podman |
| Systemd | Manual units | Quadlet (native) | Podman |
| macOS/Windows | Docker Desktop | `podman machine` + a local pod | Podman for local tests |
| CI | Docker-in-Docker | Native rootless | Podman |

**Rule:** On a Mac, local tests run in the Podman machine (§5). On a Linux server or in CI, prefer Podman. Compose files stay as they are and run with `podman compose`.

---

## 1. Rootless + Distroless (Node.js example)

```dockerfile
# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=22.11.0

FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts
COPY . .
RUN npm run build && npm prune --omit=dev

FROM gcr.io/distroless/nodejs22-debian12:nonroot
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

Run rootless:

```bash
podman run -d --name app \
  --user 10001:10001 \
  --read-only \
  --security-opt no-new-privileges \
  -p 3000:3000 \
  localhost/myapp:latest
```

---

## 2. Quadlet — The 2026 Way to Run Containers as Services

Instead of writing systemd units by hand, use **Quadlet** (`.container` files).

### Example: `myapp.container`

```ini
[Unit]
Description=My Node.js App
After=network-online.target
Wants=network-online.target

[Container]
Image=localhost/myapp:latest
ContainerName=myapp
PublishPort=3000:3000
Environment=NODE_ENV=production
HealthCmd=/nodejs/bin/node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
HealthInterval=30s
HealthTimeout=3s
HealthStartPeriod=5s
HealthRetries=3
ReadOnly=true
User=10001
Group=10001
SecurityLabelDisable=false

[Service]
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Install:

```bash
sudo cp myapp.container /etc/containers/systemd/
sudo systemctl daemon-reload
sudo systemctl start myapp.service
```

Quadlet automatically creates the proper systemd service, handles restarts, and integrates with `podman`.

---

## 3. `podman play kube` — Single-Pod Kubernetes

For simple workloads, avoid full Kubernetes. Use a Pod manifest:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  containers:
  - name: app
    image: localhost/myapp:latest
    ports:
    - containerPort: 3000
    env:
    - name: NODE_ENV
      value: production
    securityContext:
      runAsNonRoot: true
      runAsUser: 10001
      readOnlyRootFilesystem: true
    livenessProbe:
      exec:
        command:
        - /nodejs/bin/node
        - -e
        - "fetch('http://127.0.0.1:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
      initialDelaySeconds: 5
      periodSeconds: 30
  restartPolicy: Always
```

Deploy:

```bash
podman play kube myapp.yaml
```

Stop:

```bash
podman play kube --down myapp.yaml
```

This is dramatically simpler than Helm or full K8s for single-service apps.

---

## 4. Secrets (Better Than Docker Build Secrets)

Podman supports `--secret` natively:

```bash
podman run --secret id=stripe_key,src=.env.d/local/secrets/stripe.key \
  -e STRIPE_SECRET_KEY_FILE=/run/secrets/stripe_key \
  localhost/myapp
```

Inside the container, the secret is available at `/run/secrets/stripe_key` and is never stored in the image layer.

See `secrets-management` for the full `.env.d/` + secret file pattern.

---

## 5. macOS — install, then test in a pod

Containers are Linux. On a Mac the CLI talks to a Linux VM called a Podman machine. That machine is the local runtime. A **pod** is the unit that runs the app, with a database container beside it only when the test needs one.

Quadlet and `systemctl` belong on the Linux server. Do not copy `.container` files onto the Mac.

### Install

Podman documents the `.pkg` from [podman.io](https://podman.io/docs/installation) as the stable Mac install. When Homebrew is already the machine's package manager:

```bash
brew install podman
podman machine init --now
podman info
podman run --rm quay.io/podman/hello
```

`podman machine init --now` creates `podman-machine-default` and starts it. The default connection is **rootless**. Do not switch the machine to rootful for a test.

If the machine already exists and `podman info` says the service is down:

```bash
podman machine start
```

`podman compose` is a wrapper. If it reports a missing provider:

```bash
brew install docker-compose
```

That installs Compose v2. It does not install Docker Desktop. Keep the repo's `compose.yaml` / `docker-compose.yml` and run it with `podman compose`.

Bind mounts work for a repo under `/Users`. A path outside the home directory is not shared into the VM.

### When the pod is the test target

| Situation | What to run |
|---|---|
| Repo already has a compose file | `podman compose up -d --wait` from that file. Do not invent a second compose. |
| Test needs MariaDB, Postgres, Redis, or Mongo and nothing is listening on `127.0.0.1` | One throwaway database container, published only on `127.0.0.1`. |
| No database (sqlite, in-memory, or a pure API) | Still run the **app** container or pod. The test hits the same image CI runs. |

Do not `brew install mariadb` / `postgresql` / `redis` on the Mac to unblock a test. The container is the database.

### Database container

Password stays in this shell. Do not write it into the repo `.env` and do not print it.

```bash
export MARIADB_ROOT_PASSWORD="$(openssl rand -base64 24)"
podman run -d --name svs-test-db --replace \
  -p 127.0.0.1:3306:3306 \
  -e MARIADB_ROOT_PASSWORD \
  -e MARIADB_DATABASE=app_test \
  docker.io/library/mariadb:11.8
podman wait --condition=healthy svs-test-db
```

Postgres is the same shape: `docker.io/library/postgres:17`, port `127.0.0.1:5432`, `POSTGRES_PASSWORD` and `POSTGRES_DB=app_test`. Redis: `docker.io/library/redis:7`, port `127.0.0.1:6379`, no password on this loopback port. Point the test process at `127.0.0.1` and the published port. Apple Silicon pulls the arm64 image. Add `--platform linux/amd64` only when that image has no arm64 build.

### App pod, with or without a database

```bash
podman pod create --name svs-test --replace \
  -p 127.0.0.1:8080:8080
podman run -d --pod svs-test --name svs-test-app \
  -e APP_ENV=testing \
  localhost/myapp:latest
```

Containers in one pod share `localhost`, so an app container can use `127.0.0.1:3306` for a database container started in the same pod. Publish the app port to the Mac with `127.0.0.1` so the Playwright walk and the test runner reach it. Do not publish `0.0.0.0`.

When the repo compose file already declares the app and its database, prefer that file:

```bash
podman compose up -d --wait
```

### Tear down

Remove the test pod and the database container when the task is done, unless the same session still needs them. A named volume keeps the last schema; drop it when the next run must start empty.

```bash
podman pod rm -f svs-test
podman rm -f svs-test-db
podman volume rm svs-test-db
```

`podman machine stop` stops every container on the Mac. Use it when the user asks to shut the VM down, not after each test.

---

## 6. Migration from Docker

| Docker Command | Podman Equivalent | Notes |
|----------------|-------------------|-------|
| `docker build` | `podman build` | Same syntax |
| `docker compose up` | `podman compose up` | Full compatibility |
| `docker run --user` | `podman run --user` | Rootless is default |
| Manual systemd unit | Quadlet `.container` | Much simpler |
| `docker ps` | `podman ps` | Identical output |
| `docker system prune` | `podman system prune` | Same |

**Rule:** Keep using `docker-compose.yml` if you want — just run it with `podman compose`. The compose file is unchanged.

---

## 7. Integration With Other Skills

- `secrets-management` — Use `.env.d/` + `--secret` mounts.
- `security-baseline` — Rootless + read-only + no-new-privileges is the baseline.
- `ci-pipelines` — Run `podman` instead of `docker` in GitHub Actions (no DinD needed).
- `docker-patterns` — Podman can consume the exact same Dockerfiles. The two skills are complementary.

---

## FORBIDDEN

| Pattern | Reason |
|---------|--------|
| Running Podman as root | Defeats the entire security model |
| Using `sudo podman` in scripts | Indicates misconfiguration |
| Storing secrets in image layers | Use `--secret` or mounted files |
| Running containers with `--privileged` | Never needed with rootless + proper capabilities |
| Ignoring healthchecks | Quadlet and `podman play kube` both support them natively |
| `podman machine set --rootful` for a local test | The default machine is rootless |
| Publishing a test database on `0.0.0.0` | Bind `127.0.0.1` only |
| Quadlet or `systemctl` on the Mac | The Mac uses the machine and a pod. Quadlet is the Linux server |
| `brew install` of MariaDB, Postgres, or Redis to unblock a test | Run that engine in a container |

---

## Pre-Deployment Checklist

- [ ] Image built with multi-stage + distroless/chiseled
- [ ] Non-root user (10001:10001 or higher)
- [ ] Read-only root filesystem
- [ ] Healthcheck defined
- [ ] Secrets passed via `--secret` (not ENV or COPY)
- [ ] On a Mac → `podman machine` is up, test ports bound to `127.0.0.1`, pod removed when the task ends
- [ ] If Linux server → Quadlet `.container` file
- [ ] If simple K8s workload → `podman play kube` manifest
- [ ] `.dockerignore` present (same as Docker)

---

## See Also

- `docker-patterns` — the Docker side of the same story (compatible)
- `secrets-management` — how to structure `.env.d/` and secret files
- `security-baseline` — rootless is now table stakes
- `ci-pipelines` — rootless CI runners

---

## Memory Optimization Trigger

If this skill grows beyond ~250 lines or accumulates many near-duplicate Quadlet examples, run:

```bash
npx start-vibing-stacks memory optimize --dry-run
```