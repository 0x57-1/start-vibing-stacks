---
name: fastify-api
version: 1.0.0
description: Fastify v5 API patterns with end-to-end Zod typing — fastify-type-provider-zod for request/response/OpenAPI inference, @fastify/swagger + @fastify/swagger-ui for the spec UI, error handling with problem+json, plugins/hooks lifecycle, auth, rate-limit, testing via fastify.inject(). Invoke when building or modifying a Fastify server, route, or plugin. For the universal API contract (status codes, problem+json, pagination, versioning), see openapi-design.
---

# Fastify — Type-Safe APIs with Zod + OpenAPI

**Invoke when adding a Fastify route, building a plugin, or wiring auth/middleware.**

> Fastify v5 + `fastify-type-provider-zod` is the 2025 pattern: one Zod schema per route doubles as **request validation**, **response validation**, **TypeScript inference**, and **OpenAPI 3.1 spec source**. Single source of truth, no duplication.

This skill covers Fastify-specific wiring. For the API design itself (URLs, status codes, error shape, pagination, versioning), see `openapi-design`. For DB security and access patterns, see `postgres-patterns` and `security-baseline`.

---

## 1. Project Structure

```
src/
├── server.ts                # bootstrap (Fastify instance + plugins)
├── plugins/                 # cross-cutting concerns (auth, db, rate-limit)
│   ├── auth.ts
│   ├── db.ts
│   └── error-handler.ts
├── routes/                  # one file per resource; auto-loaded via @fastify/autoload
│   ├── users/
│   │   ├── index.ts         # GET /users, POST /users
│   │   └── [id].ts          # GET/PATCH/DELETE /users/:id
│   └── orders/
│       └── index.ts
├── schemas/                 # shared Zod schemas (User, Pagination, Problem)
└── lib/                     # business logic (services, repositories)
```

Keep route handlers thin: schema + handler + 1–2 service calls. Business logic lives in `lib/`.

---

## 2. Bootstrap

```bash
bun add fastify zod fastify-type-provider-zod \
        @fastify/autoload @fastify/cors @fastify/helmet \
        @fastify/rate-limit @fastify/swagger @fastify/swagger-ui
bun add -D @types/node
```

```ts
// src/server.ts
import Fastify from 'fastify';
import autoLoad from '@fastify/autoload';
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { join } from 'node:path';

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env['LOG_LEVEL'] ?? 'info',
      redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
    },
    trustProxy: true,
    bodyLimit: 1_048_576, // 1 MiB
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'trace_id',
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(import('@fastify/helmet'));
  await app.register(import('@fastify/cors'), {
    origin: process.env['ALLOWED_ORIGINS']?.split(',') ?? false,
    credentials: true,
  });
  await app.register(import('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
  });

  await app.register(import('@fastify/swagger'), {
    openapi: {
      openapi: '3.1.0',
      info: { title: 'API', version: '1.0.0' },
      servers: [
        { url: 'http://localhost:3000', description: 'Local' },
        { url: 'https://api.example.com', description: 'Production' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
    transform: jsonSchemaTransform,
  });
  await app.register(import('@fastify/swagger-ui'), { routePrefix: '/docs' });

  await app.register(autoLoad, { dir: join(import.meta.dir, 'plugins') });
  await app.register(autoLoad, { dir: join(import.meta.dir, 'routes') });

  return app;
}

// src/index.ts
const app = await buildServer();
await app.ready();
app.swagger();   // generate spec
await app.listen({ port: Number(process.env['PORT'] ?? 3000), host: '0.0.0.0' });
```

`withTypeProvider<ZodTypeProvider>()` is the line that turns Fastify's request/reply into a fully Zod-typed instance. Without it, you get untyped `request.body` etc.

---

## 3. A Route, End-to-End

```ts
// src/routes/users/index.ts
import { z } from 'zod';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ProblemSchema, ValidationProblemSchema } from '@/schemas/problem';

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  createdAt: z.string().datetime(),
});

const CreateUserSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  name: z.string().min(1).max(100).trim(),
});

const ListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const route: FastifyPluginAsyncZod = async (app) => {
  app.get('/users', {
    schema: {
      tags: ['Users'],
      summary: 'List users',
      operationId: 'listUsers',
      querystring: ListQuerySchema,
      response: {
        200: z.object({
          data: z.array(UserSchema),
          next_cursor: z.string().nullable(),
          has_more: z.boolean(),
        }),
        401: ProblemSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    onRequest: [app.requireAuth],   // declared in plugins/auth.ts
    handler: async (req) => {
      // req.query is fully typed: { cursor?: string; limit: number }
      const { cursor, limit } = req.query;
      return app.users.list({ cursor, limit });
    },
  });

  app.post('/users', {
    schema: {
      tags: ['Users'],
      summary: 'Create user',
      operationId: 'createUser',
      body: CreateUserSchema,
      response: {
        201: UserSchema,
        409: ProblemSchema,
        422: ValidationProblemSchema,
      },
    },
    handler: async (req, reply) => {
      const user = await app.users.create(req.body);
      return reply.code(201).header('location', `/users/${user.id}`).send(user);
    },
  });
};

export default route;
```

What you get for free:
- Request body / query / params validated by Zod **before** the handler runs (422 on failure)
- Response **also** validated (catches drift between code and contract — fail fast in dev)
- TypeScript types inferred — `req.query.limit` is `number`, `req.body.email` is `string`
- OpenAPI 3.1 spec generated from the same Zod schemas (`/docs` UI works)
- `operationId` becomes the SDK function name (see `openapi-design` §9)

---

## 4. Error Handling — `application/problem+json`

```ts
// src/plugins/error-handler.ts
import fp from 'fastify-plugin';
import { ZodError } from 'zod';

export default fp(async (app) => {
  app.setErrorHandler((err, req, reply) => {
    const traceId = req.id;

    // Zod validation failure (request side)
    if (err instanceof ZodError || err.code === 'FST_ERR_VALIDATION') {
      const zerr = (err as any).validation ?? err;
      return reply
        .code(422)
        .type('application/problem+json')
        .send({
          type: 'https://api.example.com/problems/validation-error',
          title: 'Validation failed',
          status: 422,
          detail: 'Request body did not pass schema validation.',
          instance: req.url,
          errors: (zerr.issues ?? zerr).map((i: any) => ({
            field: Array.isArray(i.path) ? i.path.join('.') : i.instancePath,
            code: i.code ?? 'invalid',
            message: i.message,
          })),
          trace_id: traceId,
        });
    }

    // Rate limit
    if (err.statusCode === 429) {
      return reply.code(429).type('application/problem+json').send({
        type: 'https://api.example.com/problems/rate-limited',
        title: 'Too many requests',
        status: 429,
        detail: err.message,
        instance: req.url,
        trace_id: traceId,
      });
    }

    // Known HTTP errors
    if (err.statusCode && err.statusCode < 500) {
      return reply.code(err.statusCode).type('application/problem+json').send({
        type: `https://api.example.com/problems/${err.code ?? 'error'}`,
        title: err.message,
        status: err.statusCode,
        detail: err.message,
        instance: req.url,
        trace_id: traceId,
      });
    }

    // 5xx — never leak internals
    req.log.error({ err, trace_id: traceId }, 'Unhandled error');
    return reply.code(500).type('application/problem+json').send({
      type: 'https://api.example.com/problems/internal',
      title: 'Internal Server Error',
      status: 500,
      detail: 'An unexpected error occurred. Reference the trace_id for support.',
      instance: req.url,
      trace_id: traceId,
    });
  });
});
```

The shape and rules for `Problem`/`ValidationProblem` come from `openapi-design` §3 — use the same schema in `schemas/problem.ts` and `$ref` it from every route's error responses.

```ts
// src/schemas/problem.ts
import { z } from 'zod';

export const ProblemSchema = z.object({
  type: z.string().url(),
  title: z.string(),
  status: z.number().int().min(100).max(599),
  detail: z.string().optional(),
  instance: z.string().optional(),
  trace_id: z.string().optional(),
});

export const ValidationProblemSchema = ProblemSchema.extend({
  errors: z.array(
    z.object({
      field: z.string(),
      code: z.string(),
      message: z.string(),
    })
  ),
});
```

---

## 5. Auth — `decorate` + `onRequest` hook

```ts
// src/plugins/auth.ts
import fp from 'fastify-plugin';
import { jwtVerify } from 'jose';

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string; email: string };
  }
  interface FastifyInstance {
    requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(async (app) => {
  const secret = new TextEncoder().encode(process.env['JWT_SECRET']!);

  app.decorate('requireAuth', async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return reply.code(401).type('application/problem+json').send({
        type: 'https://api.example.com/problems/unauthorized',
        title: 'Unauthorized',
        status: 401,
        instance: req.url,
        trace_id: req.id,
      });
    }
    try {
      const { payload } = await jwtVerify(auth.slice(7), secret, {
        algorithms: ['HS256'],
      });
      req.user = { id: payload.sub!, email: payload['email'] as string };
    } catch {
      return reply.code(401).type('application/problem+json').send({
        type: 'https://api.example.com/problems/invalid-token',
        title: 'Invalid token',
        status: 401,
        instance: req.url,
        trace_id: req.id,
      });
    }
  });
});
```

**Always** derive user IDs from `req.user.id` (set by the verified JWT), never from `req.body.userId` / `req.params.userId` for ownership checks. See `security-baseline` §A01.

For session cookies (first-party browser): `@fastify/cookie` + `@fastify/session` + a server-side store (Redis). Mark cookies `httpOnly`, `secure`, `sameSite: 'lax'` (or `strict`).

---

## 6. Rate Limiting per Route

```ts
app.post('/auth/login', {
  config: {
    rateLimit: { max: 5, timeWindow: '1 minute' },   // tighter than global
  },
  schema: { /* ... */ },
  handler: async (req, reply) => { /* ... */ },
});
```

Apply tighter limits to: login, signup, password reset, 2FA verification, anything that triggers an outbound email/SMS. The global limit catches the rest.

---

## 7. Database Plugin (Postgres example, ORM-agnostic)

```ts
// src/plugins/db.ts
import fp from 'fastify-plugin';
import postgres from 'postgres';

declare module 'fastify' {
  interface FastifyInstance {
    db: ReturnType<typeof postgres>;
  }
}

export default fp(async (app) => {
  const sql = postgres(process.env['DATABASE_URL']!, {
    ssl: 'verify-full',
    max: 10,                          // per-process pool size
    idle_timeout: 30,
    connect_timeout: 10,
    types: { /* ... */ },
    onnotice: () => {},               // silence NOTICE-level
  });

  app.decorate('db', sql);
  app.addHook('onClose', async () => sql.end({ timeout: 5 }));
});
```

For all things Postgres (role separation, RLS, statement_timeout, pool sizing), see `postgres-patterns`. The Fastify side just needs a clean `decorate` + `onClose` shutdown.

---

## 8. Lifecycle Hooks (when to use which)

| Hook | When |
|---|---|
| `onRequest` | Before body parsing — auth, request-id |
| `preParsing` | Mutate the incoming stream (rare) |
| `preValidation` | Mutate body before Zod runs |
| `preHandler` | After validation, before handler — fine-grained authz |
| `preSerialization` | Mutate response before serialization |
| `onSend` | Mutate the serialized payload — set headers |
| `onResponse` | After response sent — metrics, audit |
| `onError` | Log error |
| `onTimeout` | Log slow request |

Rule: do auth in `onRequest`, validation in route schema (Fastify runs it automatically), business in `handler`. Anything else should justify itself.

---

## 9. Testing — `app.inject()` (no socket)

```ts
// tests/users.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '@/server';

describe('POST /users', () => {
  let app: Awaited<ReturnType<typeof buildServer>>;

  beforeAll(async () => { app = await buildServer(); await app.ready(); });
  afterAll(async () => { await app.close(); });

  it('rejects missing email with 422', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { name: 'Alice' },
    });
    expect(res.statusCode).toBe(422);
    expect(res.json().type).toMatch(/validation-error/);
    expect(res.json().errors).toContainEqual(
      expect.objectContaining({ field: 'email', code: 'invalid_type' })
    );
  });

  it('creates a user and returns 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { email: 'alice@example.com', name: 'Alice' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.headers.location).toMatch(/^\/users\//);
  });
});
```

`inject` runs the full Fastify pipeline (plugins, hooks, validation, handler, serialization) without opening a socket. Faster and more deterministic than supertest.

For integration tests against a real database, spin up Postgres in Docker (Testcontainers) — see `playwright-automation` and the Docker patterns skill.

---

## 10. Logging — pino with redaction

Fastify uses pino by default. Configure redaction at boot to never log secrets:

```ts
const app = Fastify({
  logger: {
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["x-api-key"]',
        '*.password',
        '*.token',
        '*.secret',
        '*.apiKey',
      ],
      remove: true,
    },
  },
});
```

Production: ship logs to your APM (Datadog, Grafana, Better Stack) via stdout — pino is JSON-by-default, every log aggregator parses it.

---

## 11. Dev / Build / Run

```jsonc
// package.json
{
  "scripts": {
    "dev": "bun --hot src/index.ts",
    "build": "bun build ./src/index.ts --outdir ./dist --target bun",
    "start": "NODE_ENV=production bun ./dist/index.js",
    "test": "bun test",
    "typecheck": "tsc --noEmit",
    "spec:export": "bun src/scripts/dump-openapi.ts > openapi.json"
  }
}
```

The `spec:export` script calls `app.swagger()` and writes `openapi.json` to disk — commit it; CI fails the build if the regenerated spec differs from the committed file. That's how you keep code and spec in sync.

```ts
// src/scripts/dump-openapi.ts
import { buildServer } from '@/server';
const app = await buildServer();
await app.ready();
process.stdout.write(JSON.stringify(app.swagger(), null, 2));
process.exit(0);
```

---

## 12. Production Hardening

| Concern | Setting |
|---|---|
| Body size | `bodyLimit: 1_048_576` (1 MiB), tighter for JSON-only endpoints |
| Trust proxy | `trustProxy: true` only behind a real proxy you control (sets `req.ip` from `X-Forwarded-For`) |
| CORS | Allowlist origins, never `origin: '*'` with credentials |
| HSTS | `@fastify/helmet` defaults are sane; review CSP for your front-end |
| TLS termination | At the proxy (Caddy, Nginx, ALB), not in Fastify |
| Graceful shutdown | `app.close()` on SIGTERM; drain in-flight, close DB pool |
| Health endpoints | `/healthz` (liveness, no DB) + `/readyz` (readiness, ping DB). Exempt from auth + rate-limit. |

```ts
// graceful shutdown
['SIGINT', 'SIGTERM'].forEach((sig) => {
  process.once(sig, async () => {
    app.log.info({ sig }, 'Shutting down');
    await app.close();
    process.exit(0);
  });
});
```

---

## FORBIDDEN

| Pattern | Reason |
|---|---|
| `JSON.stringify` your own response, ignoring response schema | Loses Zod validation, OpenAPI spec drifts |
| Logic in `routes/` files | Move to `lib/services/` — handlers stay thin and testable |
| Auth check inside the handler | Use `onRequest` hook; cleaner, runs before validation |
| Returning raw error objects (`{ error: err.message }`) | Use problem+json — see `openapi-design` §3 |
| `app.use(...)` Express-style middleware | Fastify uses plugins/hooks — different lifecycle, faster |
| Skipping response validation in dev | Catch contract drift early; opt out only on hot paths in prod via `serializerCompiler` config |
| Same Zod schema redefined per route | Move to `schemas/`, import — one source of truth |
| Hand-edited `openapi.json` | Generate from code; commit the artifact |
| `setRouteValidator` overrides | Use the type provider; overriding kills inference |
| Forgetting `await app.ready()` before `app.swagger()` | Spec is empty if routes haven't registered |

---

## See Also

- `openapi-design` — what the spec should look like (URLs, status codes, problem+json, pagination, versioning, deprecation)
- `zod-validation` — schema patterns, transforms, env validation
- `security-baseline` — A01 authz, A02 crypto, A07 auth
- `api-security-node` — Node-specific hardening (helmet defaults, CORS gotchas, JWT pitfalls)
- `postgres-patterns` — DB role separation, RLS, statement_timeout, pool sizing
- `typescript-strict` — TS config that lets the type provider's inference actually help you
