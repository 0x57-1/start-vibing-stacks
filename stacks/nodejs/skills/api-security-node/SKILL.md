---
name: api-security-node
version: 2.0.0
description: "Node.js (Express / Fastify / Next.js Route Handlers / Server Actions) overlay on _shared/security-baseline v2 (OWASP Top 10:2025). Production hardening: helmet/CSP headers, strict CORS allowlist, rate limiting (express-rate-limit / @upstash/ratelimit), HttpOnly+Secure+SameSite cookies, JWT with pinned algorithms + jti via jose, CSRF double-submit, Zod .strict() against mass-assignment, magic-byte upload sniffing, Argon2id, SSRF guard for outbound fetches, and 2025-A03 (Software Supply Chain) + 2025-A10 (Exceptional Conditions) deltas."
---

# API Security — Node.js

**ALWAYS invoke when building API endpoints, auth flows, Server Actions, or Route Handlers.**

> Pair this with `security-baseline` for OWASP Top 10. This skill is stack-specific hardening.

## Layered Defense

```
Edge (CDN/WAF) → Rate Limit → CORS → Headers → Auth → Authz → Validate → Logic → Encode → Audit
```

---

## 1. Security Headers

### Express / Fastify
```ts
import helmet from 'helmet';
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'strict-dynamic'", (_, res) => `'nonce-${res.locals.nonce}'`],
      styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind needs inline; otherwise remove
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
}));
```

### Next.js — `next.config.ts`
```ts
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-Frame-Options', value: 'DENY' },
];
export default {
  async headers() { return [{ source: '/(.*)', headers: securityHeaders }]; },
};
```

CSP for Next.js is best done in middleware with per-request nonces (script-src `'strict-dynamic'`).

---

## 2. CORS — Strict Allowlist

```ts
import cors from 'cors';
const ALLOW = (process.env['CORS_ORIGINS'] ?? '').split(',').filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);          // server-to-server
    if (ALLOW.includes(origin)) return cb(null, true);
    return cb(new Error('CORS blocked'));
  },
  credentials: true,                              // required for cookies
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  maxAge: 600,
}));
```

**Never** use `origin: '*'` with `credentials: true` — browsers will reject and you'll silently break auth.

---

## 3. Rate Limiting

### Express — `express-rate-limit` + Redis
```ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

const authLimiter = rateLimit({
  store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
  windowMs: 15 * 60 * 1000,
  max: 5,                          // 5 attempts / 15 min / IP
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,    // only count failures on /login
});
app.post('/auth/login', authLimiter, loginHandler);
```

### Next.js — `@upstash/ratelimit`
```ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const limiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60s'),
  analytics: true,
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success } = await limiter.limit(ip);
  if (!success) return new Response('Too Many Requests', { status: 429 });
  // ...
}
```

**Limits to set:** auth (5/15min), password reset (3/hour), signup (3/hour/IP), generic write (60/min/user).

---

## 4. Cookies

```ts
res.cookie('session', token, {
  httpOnly: true,                         // JS cannot read
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'lax',                        // 'strict' if no cross-site flows
  path: '/',
  maxAge: 1000 * 60 * 60 * 24 * 7,        // 7d
  domain: process.env['COOKIE_DOMAIN'],   // e.g. .example.com
});
```

For sensitive ops, also set a CSRF token cookie (readable) + require it in `X-CSRF-Token` header.

---

## 5. JWT / Session Tokens

```ts
import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env['JWT_SECRET']);

// Issue access token (short-lived) + refresh token (rotated)
const accessToken = await new SignJWT({ sub: user.id, role: user.role })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('15m')
  .setJti(crypto.randomUUID())
  .sign(SECRET);

// Verify
const { payload } = await jwtVerify(token, SECRET, {
  algorithms: ['HS256'],   // pin algorithm — never accept 'none'
  clockTolerance: 5,
});
```

Rules:
- Access tokens: ≤ 15 min. Refresh tokens: rotate on use, store hash in DB, revocable.
- Pin algorithm. The `alg: 'none'` and key-confusion attacks are real.
- Include `jti` for revocation lists.

---

## 6. CSRF — Next.js Server Actions / Route Handlers

Server Actions: Next.js 14+ verifies origin automatically when called via form/`useFormState`. For Route Handlers and any cross-origin form, implement double-submit cookie:

```ts
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  if (!req.cookies.get('csrf-token')) {
    res.cookies.set('csrf-token', crypto.randomUUID(), {
      sameSite: 'lax', secure: true, path: '/',
    });
  }
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const cookie = req.cookies.get('csrf-token')?.value;
    const header = req.headers.get('x-csrf-token');
    if (!cookie || cookie !== header) {
      return new NextResponse('CSRF', { status: 403 });
    }
  }
  return res;
}
```

---

## 7. Input Validation Boundary (Zod)

```ts
import { z } from 'zod';

const Body = z.object({
  email: z.string().email().max(254),
  age: z.number().int().min(13).max(120),
}).strict();   // .strict() rejects unknown keys → blocks mass assignment

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ errors: parsed.error.flatten() }, { status: 422 });
  }
  // parsed.data is type-safe and clean
}
```

---

## 8. File Upload

- Cap size at the proxy AND in the handler.
- Validate MIME by **magic bytes** (`file-type` package), not by extension or `Content-Type`.
- Store outside webroot. Serve via signed URLs.
- Never use the user-supplied filename on disk — generate a UUID.

```ts
import { fileTypeFromBuffer } from 'file-type';
const ft = await fileTypeFromBuffer(buf);
if (!ft || !['image/jpeg', 'image/png', 'image/webp'].includes(ft.mime)) {
  throw new BadRequestError('Invalid file type');
}
```

---

## 9. Password Hashing

```ts
import { hash, verify } from '@node-rs/argon2';
const hashed = await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
const ok = await verify(hashed, attempt);   // constant-time
```

Never use `bcryptjs` (pure JS, slow); prefer native `bcrypt` or `argon2`. Argon2id is the modern default.

---

## 11. Outbound Calls — SSRF Guard

Any time you fetch a URL the user (or an LLM) controls — preview cards, webhooks, image proxies, agent tools — validate the destination. SSRF was folded into A01 in the 2025 list but is still a top real-world exploit (cloud metadata theft).

```ts
import { lookup } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';

const BLOCKED_RANGES = ['private', 'loopback', 'linkLocal', 'uniqueLocal', 'reserved'];

async function assertSafeUrl(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('SSRF: scheme');
  if (process.env['NODE_ENV'] === 'production' && url.protocol !== 'https:') {
    throw new Error('SSRF: https required');
  }
  // Resolve and reject private / link-local (169.254.169.254 = cloud metadata) targets
  const { address } = await lookup(url.hostname);
  const range = ipaddr.parse(address).range();
  if (BLOCKED_RANGES.includes(range)) throw new Error(`SSRF: blocked (${range})`);
  return url;
}

// Use it, and disable redirects (a 30x can redirect to a private host post-check)
const safe = await assertSafeUrl(userUrl);
const res = await fetch(safe, { redirect: 'error', signal: AbortSignal.timeout(5000) });
```

- **Allowlist hosts** when you can (`ALLOWED_HOSTS.has(url.hostname)`) — stronger than a denylist.
- **Disable/pin redirects** — a 30x can bounce to a private host *after* your check (TOCTOU).
- On Next.js `next/image`, restrict `remotePatterns` to known hosts.

---

## 12. OWASP 2025 Deltas — Node.js Specifics

### §A03 — Software Supply Chain Failures (NEW in 2025)

```jsonc
// package.json — pin ranges tight; commit the lockfile; ignore install scripts by default
{
  "dependencies": { "hono": "4.6.x", "zod": "3.23.x" }
}
```

```bash
# CI: verify lockfile integrity + audit + published provenance
npm ci                              # fails if package-lock drifted (or: bun install --frozen-lockfile)
npm audit --audit-level=high        # or: bun audit --audit-level=high
npm audit signatures                # verifies registry provenance/signatures (npm 9.5+)
npm config set ignore-scripts true  # blocks malicious postinstall (xz-style supply-chain)
```

- Publish first-party packages with **`npm publish --provenance`** (SLSA attestation via OIDC — see `ci-pipelines`).
- Pin GitHub Actions by **commit SHA**, not tag — see `secrets-management`.

### §A10 — Mishandling Exceptional Conditions (NEW in 2025)

```ts
// WRONG — swallows programmer bugs and fails open
try { return await getUser(id); } catch { return null; }

// CORRECT — catch the expected class, let the rest surface (fail closed)
try {
  return await getUser(id);
} catch (e) {
  if (e instanceof NotFoundError) return null;
  logger.error({ err: e }, 'getUser failed');
  throw e;                          // don't mask; the error mapper returns a safe 500
}
```

- Never `catch {}` around authz/crypto/payment paths — a swallowed error can fail *open*.
- Return generic messages to clients; full detail to logs only (A09). See `error-handling`.

---

## Server Action / Route Handler Checklist

- [ ] `auth()` called first; reject if no session for protected routes
- [ ] User ID from session, **never** from body
- [ ] Zod schema with `.strict()`
- [ ] Authz check (RBAC/ABAC) on the resource
- [ ] Rate limit applied
- [ ] No `console.log(req.body)` (PII leak — see `observability`)
- [ ] Errors return generic message; details to logs only

## FORBIDDEN

| Anti-pattern | Reason |
|---|---|
| `cors({ origin: '*', credentials: true })` | Browsers reject; you're disabling auth |
| `jwt.verify(token)` without `algorithms` | `alg: none` and key confusion attacks |
| Storing JWT in `localStorage` | XSS exfiltration trivial — use HttpOnly cookies |
| `app.use(express.json({ limit: '50mb' }))` everywhere | DoS — set per-route |
| `req.body.userId` for ownership | A01 violation — use session |
| Logging `req.body` or `req.headers` | Logs passwords, cookies, tokens |
| `bcrypt.compare(a, b)` with non-string | Type coercion bugs leak info |

## See Also

- `security-baseline` — OWASP Top 10 (2021 + 2025 deltas)
- `ai-llm-security` — if the API calls an LLM/agent (prompt injection, output handling, SSRF via tools)
- `secrets-management` — env vars, rotation, supply-chain audit
- `zod-validation` — schema patterns
- `observability` — structured logs without PII
