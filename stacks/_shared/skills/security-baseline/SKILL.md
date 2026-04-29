---
name: security-baseline
version: 1.0.0
description: Universal OWASP Top 10 baseline with stack-aware examples. Invoke before designing or reviewing any feature that touches user data, auth, persistence, or external IO.
---

# Security Baseline — OWASP Top 10 (2021)

**ALWAYS invoke when designing auth, APIs, persistence, file uploads, or any user-input flow.**

> Threat model first. Then code. Defense in depth: every layer assumes the previous one failed.

## Core Principles

1. **Trust no input** — validate at every boundary (HTTP, queue, file, env, IPC).
2. **Least privilege** — minimum scopes, minimum table access, minimum filesystem rights.
3. **Fail closed** — on error, deny. Never default to "allow on exception".
4. **Defense in depth** — auth + authz + input validation + output encoding + audit log.
5. **No security by obscurity** — assume attacker has source code.

---

## A01 — Broken Access Control

| Anti-pattern | Fix |
|---|---|
| User ID from request body/query | Always derive from session/JWT |
| Unscoped `Model.findById(id)` | Scope by owner: `where userId == session.userId` |
| Role check in frontend only | Re-check on server |
| IDOR (sequential IDs leak existence) | Use UUIDs **and** authz check |

### Node.js (Next.js / Express)
```ts
// WRONG — uses body userId
const userId = req.body.userId;
const orders = await Order.find({ userId });

// CORRECT — derives from session
const session = await auth();
if (!session) throw new UnauthorizedError();
const orders = await Order.find({ userId: session.user.id });
```

### Python (FastAPI)
```python
# CORRECT — Depends() resolves authenticated user
@app.get("/orders")
async def list_orders(user: User = Depends(current_user)):
    return await Order.filter(user_id=user.id).all()
```

### PHP (Laravel)
```php
// CORRECT — Policy + scoped query
$orders = $request->user()->orders()->get();
$this->authorize('view', $order);
```

---

## A02 — Cryptographic Failures

- **Never** use MD5/SHA1 for passwords. Use bcrypt/argon2/scrypt.
- **TLS everywhere**. HSTS header in production.
- **Cookies**: `HttpOnly`, `Secure`, `SameSite=Strict|Lax`.
- **Secrets** never in code, never in logs, never in URLs.
- **JWT**: short expiry (15m access, 7d refresh), rotate refresh tokens, signed with strong secret.

```ts
// Node.js password hashing
import { hash, verify } from '@node-rs/argon2';
const hashed = await hash(password, { memoryCost: 19456, timeCost: 2 });
const ok = await verify(hashed, attempt);
```

---

## A03 — Injection

| Type | Fix |
|---|---|
| SQL | Parameterized queries / ORM with bindings |
| NoSQL | Sanitize operators (`$where`, `$regex`) — never accept raw object from user |
| Command | `execFile` with array args, never `exec` with string |
| LDAP/XPath/Template | Library-specific escapers |
| Header injection | Strip `\r\n` from any user-controlled header value |

```ts
// WRONG — Mongo operator injection
User.findOne({ email: req.body.email });
// If body is { email: { $ne: null } } → returns first user

// CORRECT — coerce to string/Zod parse first
const { email } = z.object({ email: z.string().email() }).parse(req.body);
User.findOne({ email });
```

---

## A04 — Insecure Design

- Threat-model **before** coding new flows. Document threats in `domain.md`.
- Anti-automation: rate limit, CAPTCHA on signup/login/password reset.
- Business logic limits: max items per cart, max API calls per minute, max file size.

---

## A05 — Security Misconfiguration

- Disable directory listings, default accounts, sample apps.
- Set security headers: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- Error messages: generic to clients, detailed in server logs only.
- `NODE_ENV=production` / `APP_DEBUG=false` in prod — verify in CI.

---

## A06 — Vulnerable Components

- Run `npm audit` / `pip-audit` / `composer audit` in CI.
- Pin lockfiles. Use Dependabot/Renovate.
- See `supply-chain` notes in `secrets-management` skill.

---

## A07 — Authentication Failures

- Lockout after N failed attempts (with exponential backoff or CAPTCHA, **not** permanent — DoS risk).
- Require MFA for admin/sensitive actions.
- Rotate session token on login, logout, password change, privilege change.
- Password reset tokens: single-use, expire ≤ 1h, sent to email of record.

---

## A08 — Software & Data Integrity

- Verify signatures on dependencies where possible (Sigstore, npm provenance).
- Sign artifacts in CI/CD.
- Validate webhook signatures (Stripe, GitHub, etc.) **before** parsing body.

```ts
// Stripe webhook — verify FIRST
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(rawBody, sig, secret);
```

---

## A09 — Security Logging Failures

- Log: auth events, authz denials, validation failures, admin actions, payment events.
- Never log: passwords, tokens, full PAN, full SSN, raw cookies, secrets.
- Use correlation IDs to trace a request across services. See `observability` skill.

---

## A10 — Server-Side Request Forgery (SSRF)

- Allowlist outbound destinations when fetching user-supplied URLs.
- Block private IP ranges (10/8, 172.16/12, 192.168/16, 169.254/16, ::1, fc00::/7).
- Resolve DNS yourself and check the IP — defeats DNS rebinding.

```ts
import { isIP } from 'net';
const PRIVATE = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|169\.254\.|::1|fc|fd)/i;
const url = new URL(userUrl);
const ip = await dns.lookup(url.hostname);
if (PRIVATE.test(ip.address)) throw new ForbiddenError('Private IP not allowed');
```

---

## Mandatory Boundary Validation

Every external input MUST be validated by a schema:

| Stack | Library |
|---|---|
| Node.js | Zod (`zod-validation` skill) |
| Python | Pydantic (`pydantic-validation` skill) |
| PHP | FormRequest + rules |

No exceptions for "trusted" sources. Internal services drift, queues replay malformed payloads, env files are edited by hand.

---

## Pre-Commit Security Checklist

- [ ] All routes have authn + authz checks
- [ ] User ID derived from session, never from body
- [ ] All inputs validated by schema
- [ ] No secrets in code (see `secrets-management`)
- [ ] No raw SQL / Mongo operators from user input
- [ ] Security headers set on responses
- [ ] Rate limit on auth + write endpoints
- [ ] PII not in logs (see `observability`)
- [ ] Webhook signatures verified before parsing

## See Also

- `secrets-management` — env hygiene, gitleaks
- `observability` — log redaction
- `api-security-node` / `api-security-python` / PHP `api-security` — stack-specific hardening
