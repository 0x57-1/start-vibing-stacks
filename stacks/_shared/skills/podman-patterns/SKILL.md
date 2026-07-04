---
name: podman-patterns
version: 1.0.0
description: "Podman 2026 patterns: rootless containers (no daemon, no root), Quadlet (systemd units), podman play kube, podman compose (Docker Compose compatibility), podman machine (macOS/Windows), healthchecks, secrets via --secret, distroless images. Replaces Docker daemon in CI and production for security and simplicity."
---

# Podman Patterns (2026)

**Invoke when writing container definitions, systemd services for containers, Kubernetes manifests for single pods, or migrating from Docker daemon.**

> 2026 reality: **Rootless is the default**. No container runtime should run as root. Podman + Quadlet is the recommended path on Linux for production services. `podman play kube` replaces simple `kubectl apply` for single-pod workloads. Dockerfiles are fully compatible.

## Why Podman in 2026

| Aspect | Docker | Podman | Winner |
|--------|--------|--------|--------|
| Daemon | Required (root) | None | Podman |
| Root | Required for daemon | Rootless by default | Podman |
| Kubernetes | Separate (kind/minikube) | `podman play kube` | Podman |
| Systemd | Manual units | Quadlet (native) | Podman |
| macOS/Windows | Docker Desktop | `podman machine` | Tie |
| CI | Docker-in-Docker | Native rootless | Podman |

**Rule:** If the target is Linux (server or CI), prefer Podman. If you need Docker Compose syntax, use `podman compose` — it is a drop-in replacement.

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

## 5. Podman Machine (macOS / Windows)

On non-Linux hosts:

```bash
podman machine init
podman machine start
podman machine ssh          # for debugging
```

Use the same Dockerfiles and Quadlet files — Podman abstracts the VM.

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

---

## Pre-Deployment Checklist

- [ ] Image built with multi-stage + distroless/chiseled
- [ ] Non-root user (10001:10001 or higher)
- [ ] Read-only root filesystem
- [ ] Healthcheck defined
- [ ] Secrets passed via `--secret` (not ENV or COPY)
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