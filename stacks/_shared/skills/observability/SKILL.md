---
name: observability
version: 1.0.0
description: Structured logging, correlation IDs, OpenTelemetry tracing, error tracking (Sentry), metrics, and PII redaction. Invoke when adding logging, instrumentation, or debugging production issues.
---

# Observability — Logs, Traces, Metrics

**ALWAYS invoke when adding logging, instrumentation, error tracking, or analyzing production issues.**

> Three pillars: **Logs** (what happened) + **Traces** (where time was spent) + **Metrics** (how much / how often).
> One signal: **correlation/trace IDs** that thread through all three.

---

## 1. Structured Logging — Mandatory

Logs are JSON, not text. Free-form strings can't be queried, aggregated, or alerted on.

### Required fields per log line

| Field | Source |
|---|---|
| `timestamp` | ISO-8601, UTC |
| `level` | `trace` / `debug` / `info` / `warn` / `error` / `fatal` |
| `msg` | Short human description |
| `service` | Service name |
| `env` | `production` / `staging` / `development` |
| `trace_id` | OpenTelemetry trace id (W3C `traceparent`) |
| `span_id` | Current span |
| `request_id` | Inbound HTTP request id (mirror to `x-request-id` header) |
| `user_id` | Authenticated user (hash if PII concerns) — **never** email/full name |

### Node.js — pino
```ts
// lib/logger.ts
import pino from 'pino';
import { randomUUID } from 'crypto';

export const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  base: {
    service: 'api',
    env: process.env['NODE_ENV'],
    pid: process.pid,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      '*.password',
      '*.creditCard',
      '*.ssn',
    ],
    censor: '[REDACTED]',
  },
});

// HTTP middleware: attach request_id + child logger to req
export function requestLogger(req, res, next) {
  const requestId = req.headers['x-request-id'] ?? randomUUID();
  res.setHeader('x-request-id', requestId);
  req.log = logger.child({ request_id: requestId, method: req.method, path: req.path });
  req.log.info({ event: 'request.start' });
  res.on('finish', () => {
    req.log.info({ event: 'request.end', status: res.statusCode, duration_ms: Date.now() - req.startTime });
  });
  next();
}
```

### Python — structlog
```python
import structlog, logging, sys, uuid

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
)

log = structlog.get_logger()

# FastAPI middleware
@app.middleware("http")
async def request_logger(request, call_next):
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    structlog.contextvars.bind_contextvars(
        request_id=request_id, method=request.method, path=request.url.path
    )
    log.info("request.start")
    response = await call_next(request)
    response.headers["x-request-id"] = request_id
    log.info("request.end", status=response.status_code)
    structlog.contextvars.clear_contextvars()
    return response
```

### PHP — Monolog
```php
// config/logging.php
'channels' => [
    'json' => [
        'driver' => 'monolog',
        'handler' => Monolog\Handler\StreamHandler::class,
        'with' => ['stream' => 'php://stdout'],
        'formatter' => Monolog\Formatter\JsonFormatter::class,
        'processors' => [
            Monolog\Processor\WebProcessor::class,
            Monolog\Processor\UidProcessor::class,
        ],
    ],
],
```

---

## 2. Log Levels — Use Them Right

| Level | When |
|---|---|
| `trace` | Verbose diagnostics, off in prod |
| `debug` | Development helper, off in prod by default |
| `info` | Business events: signup, payment, login, job completed |
| `warn` | Recoverable anomaly: retry, deprecated path, fallback used |
| `error` | Operation failed for one user/request, system continues |
| `fatal` | Cannot continue, process exits |

Default prod level: `info`. Errors should always page or alert. `debug` flooding logs is a cost issue.

---

## 3. PII Redaction — Mandatory

Never log:
- Passwords, hashes, tokens, cookies, `Authorization` headers
- Full credit card / IBAN / SSN / passport
- Plaintext email if your jurisdiction (GDPR/LGPD) treats it as PII without legitimate basis
- Full request body or full response body without filtering

Redact at the logger level (so it can't be bypassed by a forgetful caller):

```ts
// pino redact paths (above)
// or wrap manually:
function safeBody(body: any) {
  const out = { ...body };
  for (const k of ['password', 'token', 'cookie', 'authorization']) {
    if (k in out) out[k] = '[REDACTED]';
  }
  return out;
}
```

For email: log a hash of the email or the first 2 chars + domain (`jo***@example.com`). Document the policy.

---

## 4. Distributed Tracing — OpenTelemetry

Tracing answers "where did the request spend time" across services.

### Node.js (auto-instrumentation)
```ts
// instrumentation.ts — load BEFORE any other import
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

new NodeSDK({
  resource: new Resource({ [ATTR_SERVICE_NAME]: 'api' }),
  traceExporter: new OTLPTraceExporter({ url: process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] }),
  instrumentations: [getNodeAutoInstrumentations()],
}).start();
```

Run: `node --import ./instrumentation.js dist/index.js`

### Python (FastAPI)
```python
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor

FastAPIInstrumentor.instrument_app(app)
SQLAlchemyInstrumentor().instrument(engine=engine)
HTTPXClientInstrumentor().instrument()
```

### Manual span — when you want to time business logic
```ts
import { trace } from '@opentelemetry/api';
const tracer = trace.getTracer('billing');

await tracer.startActiveSpan('charge_customer', async (span) => {
  try {
    span.setAttribute('customer.id', customerId);
    const charge = await stripe.charges.create({ amount, customer: customerId });
    span.setAttribute('charge.id', charge.id);
    return charge;
  } catch (err) {
    span.recordException(err);
    span.setStatus({ code: 2 /* ERROR */ });
    throw err;
  } finally {
    span.end();
  }
});
```

---

## 5. Error Tracking — Sentry

Pair with structured logging. Sentry is for **alertable** errors with full stack + breadcrumbs; logs are for **everything**.

### Node.js
```ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env['SENTRY_DSN'],
  environment: process.env['NODE_ENV'],
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
  beforeSend(event) {
    // Defense in depth — strip if logger redaction missed it
    if (event.request?.cookies) delete event.request.cookies;
    if (event.request?.headers?.['authorization']) {
      event.request.headers['authorization'] = '[REDACTED]';
    }
    return event;
  },
});
```

### Python
```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.scrubber import EventScrubber, DEFAULT_DENYLIST

sentry_sdk.init(
    dsn=os.environ["SENTRY_DSN"],
    environment=os.environ["APP_ENV"],
    traces_sample_rate=0.1,
    integrations=[FastApiIntegration()],
    event_scrubber=EventScrubber(denylist=DEFAULT_DENYLIST + ["jwt", "session"]),
    send_default_pii=False,
)
```

---

## 6. Metrics

Track **RED** (Rate / Errors / Duration) on every endpoint and **USE** (Utilization / Saturation / Errors) on every resource.

OpenTelemetry metrics + Prometheus exporter, or vendor SDK (Datadog, New Relic).

```ts
import { metrics } from '@opentelemetry/api';
const meter = metrics.getMeter('api');

const httpDuration = meter.createHistogram('http.server.duration', { unit: 'ms' });
const ordersCreated = meter.createCounter('orders.created');

httpDuration.record(durationMs, { method, route, status: String(statusCode) });
ordersCreated.add(1, { plan: order.plan });
```

Cardinality rule: never tag with user_id, email, or unbounded values — explodes time-series storage. Use `route`, `status`, `plan`, etc.

---

## 7. Health Checks

Two endpoints, distinct semantics:

```ts
app.get('/healthz', (_, res) => res.json({ ok: true }));   // liveness — am I running?

app.get('/readyz', async (_, res) => {                      // readiness — can I serve?
  const checks = await Promise.allSettled([
    db.raw('SELECT 1'),
    redis.ping(),
  ]);
  const allOk = checks.every(c => c.status === 'fulfilled');
  res.status(allOk ? 200 : 503).json({ ok: allOk, checks });
});
```

Kubernetes uses `livenessProbe` → `/healthz` (restart on fail) and `readinessProbe` → `/readyz` (remove from LB on fail).

---

## 8. Audit Log — Separate Stream

Security-relevant events go to a dedicated, append-only stream:

- Logins (success + failure)
- Authorization denials
- Permission/role changes
- Admin actions (impersonation, data exports, deletes)
- Payment events
- Data access (when required by compliance: HIPAA, SOC 2)

Different retention (often longer), different access (security team), different integrity guarantees (immutable, hash-chained).

---

## Pre-Commit Checklist

- [ ] Logger configured with redact paths for password/token/cookie/authorization
- [ ] All endpoints emit `request.start` / `request.end` with `request_id`
- [ ] Errors include stack trace and `trace_id`
- [ ] No `console.log` / `print` / `dd()` left in code (use the logger)
- [ ] No PII in info-level logs
- [ ] Sentry initialized with `beforeSend` scrubber
- [ ] Tracing initialized at process start (before app code)
- [ ] `/healthz` + `/readyz` endpoints exist

## FORBIDDEN

| Pattern | Reason |
|---|---|
| `console.log(req.body)` | Leaks passwords, tokens |
| Logger without redaction | Future caller will leak |
| Unbounded label cardinality (user_id as metric tag) | Cost explosion |
| Same severity for everything (all `info`) | No alerting signal |
| Tracing in dev only | Prod is where you need it |
| Sentry without scrubber | PII in error reports |
| Audit log in same stream as app log | Tamper risk, retention conflict |

## See Also

- `secrets-management` — what NEVER to log
- `error-handling` — Result types and error taxonomy
- `security-baseline` — A09: Security Logging Failures
