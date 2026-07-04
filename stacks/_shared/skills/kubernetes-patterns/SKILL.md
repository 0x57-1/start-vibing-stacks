---
name: kubernetes-patterns
version: 1.0.0
description: "Kubernetes 2026 production patterns: Pod Security Standards (restricted), NetworkPolicy default-deny, graceful shutdown with preStop + SIGTERM draining, zero-downtime rolling updates (maxUnavailable:0 + readiness), HPA with custom metrics, PDBs, topology spread, resource QoS, and day-2 readiness checklist. Use when deploying to EKS, GKE, AKS or self-managed clusters."
---

# Kubernetes Patterns (2026 Production)

**Invoke when writing Deployments, Services, NetworkPolicies, HPA, PodDisruptionBudgets, or any workload manifest for production clusters.**

> 2026 reality: Pod Security Standards (PSS) + NetworkPolicy default-deny is the baseline. Zero-downtime requires readiness probe + preStop sleep + `maxUnavailable: 0`. Graceful shutdown is mandatory — pods that ignore SIGTERM cause request drops during rollouts and drains.

---

## 1. The Day-2 Readiness Checklist (Non-Negotiable)

Every production workload must have:

| Control | Why | How |
|---------|-----|-----|
| **Readiness probe** | Traffic only reaches healthy pods | `httpGet /readyz` or `exec` |
| **Liveness probe** | Restart stuck containers | `httpGet /livez` |
| **Startup probe** (slow apps) | Give slow containers time to boot | `httpGet /startupz` |
| **Resource requests + limits** | QoS class + scheduling | `requests.memory/cpu`, `limits` |
| **PodDisruptionBudget** | Survive voluntary disruptions (drains) | `minAvailable: 1` or `maxUnavailable: 1` |
| **Topology spread** | High availability across zones/nodes | `topologySpreadConstraints` |
| **SecurityContext** | Non-root + read-only + drop ALL | See §Security |
| **NetworkPolicy** | Default-deny + explicit allow | See §NetworkPolicy |
| **Graceful shutdown** | Drain in-flight requests on SIGTERM | `preStop` + handler |
| **Rolling update strategy** | Zero downtime | `maxUnavailable: 0`, `maxSurge: 1` |

---

## 2. Zero-Downtime Rolling Update (The 2026 Pattern)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0          # Never drop below desired replicas
      maxSurge: 1                # Add one extra pod during rollout
  minReadySeconds: 10            # Wait before marking new pod "ready"
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      terminationGracePeriodSeconds: 45   # > preStop sleep + longest request
      containers:
      - name: api
        image: myorg/api:v1.2.3
        ports:
        - containerPort: 3000
        readinessProbe:
          httpGet:
            path: /readyz
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          failureThreshold: 3
        livenessProbe:
          httpGet:
            path: /livez
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 10
          failureThreshold: 3
        lifecycle:
          preStop:
            exec:
              command: ["sh", "-c", "sleep 10"]   # Give kube-proxy time to remove endpoint
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

**Why the preStop sleep?**

When a pod is deleted, Kubernetes removes it from Endpoints **asynchronously**. For a few seconds, traffic can still arrive at a `Terminating` pod. The `sleep 10` in `preStop` delays SIGTERM long enough for endpoint propagation to finish.

---

## 3. Graceful Shutdown in Code (Node.js / Python / PHP)

Your application **must** handle `SIGTERM` and stop accepting new connections + drain in-flight requests.

### Node.js (Express / Fastify)

```ts
const server = app.listen(3000);

process.on('SIGTERM', () => {
  server.close(() => {
    // Close DB connections, flush logs, etc.
    process.exit(0);
  });
});
```

### Python (FastAPI / Uvicorn)

```python
import signal
import sys
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # Cleanup on shutdown
    await db.disconnect()

app = FastAPI(lifespan=lifespan)

def handle_sigterm(signum, frame):
    sys.exit(0)

signal.signal(signal.SIGTERM, handle_sigterm)
```

### PHP (Laravel Octane / FrankenPHP)

Laravel Octane already handles graceful shutdown. Just make sure your services are stateless between requests (see `laravel-octane-inertia` skill).

---

## 4. Pod Security Standards (Restricted Profile)

Apply at namespace level:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

**What `restricted` enforces:**

- No privileged containers
- No hostNetwork / hostPID / hostIPC
- No hostPath volumes
- Must run as non-root (`runAsNonRoot: true`)
- Must drop ALL capabilities
- `readOnlyRootFilesystem: true` (recommended)
- `allowPrivilegeEscalation: false`

---

## 5. NetworkPolicy — Default Deny + Explicit Allow

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to: []   # Allow DNS egress
    ports:
    - protocol: UDP
      port: 53
```

---

## 6. HorizontalPodAutoscaler + PodDisruptionBudget

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api
  namespace: production
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: api
```

---

## 7. SecurityContext (Every Pod)

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 10001
  runAsGroup: 10001
  fsGroup: 10001
  seccompProfile:
    type: RuntimeDefault
containers:
- name: app
  securityContext:
    allowPrivilegeEscalation: false
    readOnlyRootFilesystem: true
    capabilities:
      drop: ["ALL"]
```

---

## FORBIDDEN

| Pattern | Reason |
|---------|--------|
| `maxUnavailable: 1` on user-facing services | Drops capacity during rollout |
| No readiness probe | Traffic can hit pods that are still starting |
| Ignoring SIGTERM | Requests dropped during drains/rollouts |
| `runAsUser: 0` or `privileged: true` | Container escape risk |
| No NetworkPolicy | Lateral movement after compromise |
| `latest` tag | Unreproducible, hard to rollback |
| No resource limits | Noisy neighbor + OOMKills |

---

## See Also

- `podman-patterns` — rootless local development that mirrors production security posture
- `docker-patterns` — building the images that run on Kubernetes
- `secrets-management` — how to mount secrets without baking them into images
- `ci-pipelines` — GitOps deployment patterns with Argo CD / Flux

---

## Memory Optimization Trigger

If this skill grows beyond ~300 lines or accumulates many near-duplicate Deployment examples, run:

```bash
npx start-vibing-stacks memory optimize --dry-run
```