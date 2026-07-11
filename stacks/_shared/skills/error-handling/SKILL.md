---
name: error-handling
version: 1.1.0
description: Universal error-handling patterns. Error taxonomy, Result types, error boundaries, structured exceptions, never-swallow rules. Invoke when designing service layers, API responses, or any try/catch.
---

# Error Handling

**ALWAYS invoke when adding try/catch, designing service layers, API error responses, or handling external API failures.**

> The default state of software is broken. Errors are not exceptional — handling them is the job.

## Core Principles

1. **Errors are values.** Plan for them in the type signature, not as a side channel.
2. **Throw at boundaries, return at edges.** Internal modules return Results; HTTP layer translates to status codes; user sees a generic message.
3. **Never swallow.** A `catch` with no log, no rethrow, and no recovery is a bug.
4. **Fail closed.** On unexpected error, deny — don't continue with degraded state.
5. **Distinguish operational from programmer errors.** Operational = expected (network blip, validation). Programmer = bug. They get different treatment.

---

## Error Taxonomy (mandatory)

Every error you create classifies into one of these:

| Class | Examples | Strategy |
|---|---|---|
| **Validation** | Bad input, schema mismatch | Return 4xx with field details; do not log as error |
| **Authentication** | Missing/expired/invalid token | 401, log at info |
| **Authorization** | Authenticated but not allowed | 403, log at warn (could be probing) |
| **NotFound** | Resource missing | 404, log at info |
| **Conflict** | Optimistic lock, duplicate key | 409, log at warn |
| **RateLimit** | Quota exceeded | 429 + `Retry-After`, log at info |
| **External** | Upstream API failed | Retry+backoff if idempotent; 502/503; log at error |
| **Programmer** | Null deref, type mismatch, switch missed | 500, log at error, alert, fix |

If the error doesn't fit, you have a new class — add it deliberately.

---

## Pattern 1 — Custom Error Classes (TS / Python / PHP)

### TypeScript
```ts
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly httpStatus: number,
    message: string,
    public readonly cause?: unknown,
    public readonly meta?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, fields?: Record<string, string[]>) {
    super('validation_error', 422, message, undefined, { fields });
  }
}
export class NotFoundError extends AppError {
  constructor(resource: string) { super('not_found', 404, `${resource} not found`); }
}
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') { super('unauthorized', 401, message); }
}
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') { super('forbidden', 403, message); }
}
export class ConflictError extends AppError {
  constructor(message: string) { super('conflict', 409, message); }
}
export class ExternalError extends AppError {
  constructor(service: string, cause: unknown) {
    super('external_error', 502, `Upstream ${service} failed`, cause);
  }
}
```

### Python
```python
class AppError(Exception):
    code: str = "error"
    http_status: int = 500
    def __init__(self, message: str, *, cause: Exception | None = None, meta: dict | None = None):
        super().__init__(message)
        self.cause, self.meta = cause, meta or {}

class ValidationError(AppError):  code, http_status = "validation_error", 422
class NotFoundError(AppError):    code, http_status = "not_found", 404
class UnauthorizedError(AppError):code, http_status = "unauthorized", 401
class ForbiddenError(AppError):   code, http_status = "forbidden", 403
class ConflictError(AppError):    code, http_status = "conflict", 409
class ExternalError(AppError):    code, http_status = "external_error", 502
```

### PHP
Use Laravel's `HttpException` family + custom domain exceptions. Override `Handler::register` to map domain exceptions to HTTP responses.

---

## Pattern 2 — Result Types (for internal layers)

Throwing across many layers is expensive (TypeScript) and opaque (it's not in the signature). For internal service code, use a Result.

### TypeScript
```ts
type Result<T, E = AppError> =
  | { ok: true;  data: T }
  | { ok: false; error: E };

const ok = <T>(data: T): Result<T> => ({ ok: true, data });
const err = <E extends AppError>(error: E): Result<never, E> => ({ ok: false, error });

// Service returns Result; caller handles both branches
async function findUser(id: string): Promise<Result<User>> {
  const user = await db.user.findById(id);
  if (!user) return err(new NotFoundError('user'));
  return ok(user);
}

// Caller (route handler) — throws to be caught by error middleware
const result = await findUser(id);
if (!result.ok) throw result.error;
return result.data;
```

### Python
```python
from dataclasses import dataclass
from typing import Generic, TypeVar
T = TypeVar("T"); E = TypeVar("E")

@dataclass(frozen=True)
class Ok(Generic[T]):  data: T
@dataclass(frozen=True)
class Err(Generic[E]): error: E

Result = Ok[T] | Err[E]
```

Or use `returns` library: `from returns.result import Result, Success, Failure`.

---

## Pattern 3 — Centralized HTTP Error Handler

### Express
```ts
// errors of type AppError → mapped; everything else → 500
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const requestId = res.getHeader('x-request-id');
  if (err instanceof AppError) {
    req.log.warn({ err, code: err.code, status: err.httpStatus }, err.message);
    return res.status(err.httpStatus).json({
      error: { code: err.code, message: err.message, requestId, ...err.meta },
    });
  }
  // Unknown — programmer error, never leak details
  req.log.error({ err }, 'Unhandled exception');
  res.status(500).json({ error: { code: 'internal_error', message: 'Internal Server Error', requestId } });
});
```

### Next.js — App Router
Use `error.tsx` + `global-error.tsx` for client-rendered errors, and a wrapper for Route Handlers:

```ts
// app/api/_handler.ts
export function safeHandler<T extends Request>(fn: (req: T) => Promise<Response>) {
  return async (req: T): Promise<Response> => {
    try { return await fn(req); }
    catch (e) {
      if (e instanceof AppError) {
        return Response.json({ error: { code: e.code, message: e.message, ...e.meta } }, { status: e.httpStatus });
      }
      logger.error({ err: e }, 'Unhandled');
      return Response.json({ error: { code: 'internal_error', message: 'Internal Server Error' } }, { status: 500 });
    }
  };
}
```

### FastAPI
```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

@app.exception_handler(AppError)
async def app_error_handler(req: Request, exc: AppError):
    return JSONResponse(
        {"error": {"code": exc.code, "message": str(exc), **exc.meta}},
        status_code=exc.http_status,
    )

@app.exception_handler(Exception)
async def unhandled_handler(req: Request, exc: Exception):
    log.exception("unhandled", request_id=req.headers.get("x-request-id"))
    return JSONResponse(
        {"error": {"code": "internal_error", "message": "Internal Server Error"}},
        status_code=500,
    )
```

---

## Pattern 4 — Retry with Backoff (External Calls)

```ts
// Idempotent operations only. Never retry payments without idempotency keys.
async function withRetry<T>(
  fn: () => Promise<T>,
  { tries = 3, baseMs = 200, factor = 2, jitter = 0.3 } = {},
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      if (i === tries - 1) break;
      const delay = baseMs * Math.pow(factor, i) * (1 + (Math.random() - 0.5) * 2 * jitter);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new ExternalError('upstream', lastErr);
}
```

For HTTP retries, use `axios-retry`, `got` (built-in), or `tenacity` (Python). Don't roll your own unless you must.

**Idempotency keys** for non-idempotent operations (POST that creates / charges):
```ts
await stripe.charges.create({ amount, customer }, { idempotencyKey: orderId });
```

---

## Pattern 5 — Circuit Breaker (External Outages)

When upstream is down, fail fast instead of piling up requests:

```ts
import CircuitBreaker from 'opossum';
const breaker = new CircuitBreaker(callUpstream, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
});
breaker.fallback(() => ({ data: cached, stale: true }));
```

Python: `pybreaker`. PHP: `ackintosh/ganesha`.

---

## Pattern 6 — Async / Promise Hygiene

```ts
// WRONG — unhandled rejection crashes the process (Node 15+)
somePromise();

// CORRECT — always handle, even if just to log
somePromise().catch(err => logger.error({ err }, 'background task failed'));

// Promise.all rejects on first failure — for partial success use allSettled
const results = await Promise.allSettled([fetchA(), fetchB(), fetchC()]);
const failures = results.filter(r => r.status === 'rejected');
if (failures.length > 0) logger.warn({ failures }, 'partial failure');
```

Catch handler at process level (defense in depth):
```ts
process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled rejection');
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});
```

---

## Anti-Patterns

| Anti-pattern | Why it's bad | Fix |
|---|---|---|
| `try { ... } catch {}` | Silent failure | Log + rethrow or recover deliberately |
| `catch (e) { console.log(e) }` | No structured context | Use logger; include `request_id`, `user_id` |
| `catch (e) { throw new Error(e.message) }` | Loses stack trace | `throw new AppError(..., e)` (preserve cause) |
| `if (err) return null` | Caller can't distinguish "no result" from "failed" | Result type |
| Returning `{ error: 'something' }` from a function | Convention drift, untyped | Result type or throw |
| Catching `Error` to coerce | Hides bugs | Catch specific classes |
| Generic 500 response with raw stack | Info disclosure | Log full, return generic message + requestId |
| Retrying non-idempotent calls | Double-charge / double-create | Idempotency keys |
| Retrying without backoff | DoS your own upstream | Exponential + jitter |

## API Error Response Shape (Standardize)

```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid input",
    "fields": {
      "email": ["must be a valid email"],
      "age": ["must be at least 13"]
    },
    "requestId": "req_abc123"
  }
}
```

Stable contract: client code can switch on `code`. Always include `requestId` so support can correlate with logs.

## Pre-Commit Checklist

- [ ] No empty `catch` blocks
- [ ] Every `catch` either logs+rethrows, recovers deliberately, or transforms to `AppError`
- [ ] Service-layer functions that can fail return `Result` or throw `AppError`
- [ ] HTTP layer has a single error mapper; routes do not stringify exceptions
- [ ] External calls have retry + backoff (if idempotent) or idempotency keys
- [ ] No raw stack traces in API responses
- [ ] Process-level `unhandledRejection` / `uncaughtException` handlers exist (Node)

## See Also

- `tool-resilience` — recovering from the AGENT's own tool failures (fetch bot-blocks, stale edits, timeouts); includes the Cloudflare 520 / HTTP 444 User-Agent recovery
- `observability` — what to log on errors
- `security-baseline` — A09 logging, A05 config (don't leak stack traces)
- Stack `api-security-*` — error mapping in framework handlers
