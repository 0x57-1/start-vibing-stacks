---
name: security-baseline
version: 2.3.0
description: "Universal OWASP Top 10 baseline with stack-aware examples. Covers BOTH OWASP 2021 (numbering kept stable for security-auditor §A01–§A10 cross-references) AND OWASP 2025 deltas (Software Supply Chain Failures new at A03, Mishandling Exceptional Conditions new at A10, SSRF demoted into Broken Access Control). A07 includes phishing-resistant Passkeys/WebAuthn (FIDO2). Named CVEs live in companion cve-watchlist.md (Read on lockfile hit only — do not inline in agents). Invoke before designing or reviewing any feature that touches user data, auth, persistence, supply chain, or external IO."
---

# Security Baseline — OWASP Top 10 (2021 + 2025 deltas)

**ALWAYS invoke when designing auth, APIs, persistence, file uploads, supply-chain integrations, or any user-input flow.**

> Threat model first. Then code. Defense in depth: every layer assumes the previous one failed.

## OWASP Top 10 — 2021 vs 2025 (released Nov 2025)

OWASP Top 10:2025 was published at OWASP Global AppSec DC in November 2025. Material changes:

| 2021 | 2025 | Status |
|---|---|---|
| A01 Broken Access Control | A01 Broken Access Control | Same #1; **SSRF folded in here** |
| A02 Cryptographic Failures | A04 Cryptographic Failures | Demoted |
| A03 Injection | A05 Injection | Demoted |
| A04 Insecure Design | A06 Insecure Design | Demoted |
| A05 Security Misconfiguration | **A02 Security Misconfiguration** | Promoted (most observed) |
| A06 Vulnerable Components | (covered by 2025-A03) | Subsumed |
| A07 Authentication Failures | A07 Authentication Failures | Same |
| A08 Software & Data Integrity | A08 Software or Data Integrity Failures | Same |
| A09 Security Logging Failures | A09 Security Logging and Alerting Failures | Same |
| A10 SSRF | (folded into A01) | **Removed as a top-10 category — STILL DANGEROUS, see A01** |
| — | **A03 Software Supply Chain Failures** | **NEW** (was A06 Vulnerable Components, expanded) |
| — | **A10 Mishandling of Exceptional Conditions** | **NEW** (error handling that fails open / leaks state) |

**This skill keeps the §A01–§A10 anchors using the 2021 numbering** because cross-references in `security-auditor` v2.0.0, `api-security-*` skills, and stack overlays already cite them. The 2025 deltas are documented inline (see §A03+, §A06, §A10 sections).

---

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

## A06 — Vulnerable Components  *(2025: subsumed into the new A03 — Software Supply Chain Failures)*

- Run `npm audit` / `pip-audit` / `composer audit` in CI.
- Pin lockfiles. Use Dependabot/Renovate.
- See `supply-chain` notes in `secrets-management` skill and the **A03+ (2025) Software Supply Chain Failures** section below.

---

## A03+ (2025 only) — Software Supply Chain Failures *(NEW in 2025)*

Expanded from 2021's A06. Treats the **build, dependency, and distribution pipeline** as part of the threat surface.

| Threat | Mitigation |
|---|---|
| Malicious dependency (typosquat, dependency confusion) | Lock to private registries first; pin by hash where possible (npm `--integrity`, pip hashes) |
| Compromised maintainer / token | Require 2FA on maintainer accounts; mandatory provenance for first-party publishes |
| Build pipeline injection | Pin GitHub Actions by SHA, not tag; least-privilege `permissions:`; OIDC for cloud auth |
| Unsigned artifacts | Sign releases (Sigstore / cosign); verify signatures at deploy |
| `postinstall` script abuse | `npm config set ignore-scripts true` for CI installs; allowlist trusted packages |
| Lockfile drift | Fail CI when lockfile changes without manual review |

```yaml
# Pin GitHub Actions by SHA
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11   # v4.1.1
- uses: actions/setup-node@1d0ff469b7ec7b3cb9d8673fde0c81c44821de2a # v4.2.0

# Provenance + ignore scripts
permissions:
  id-token: write              # OIDC for npm publish provenance
  contents: read
- run: npm ci --ignore-scripts
- run: npm publish --provenance --access public
```

See `secrets-management` (OIDC federation), `ci-pipelines` (pinning + provenance), and `secrets-management` (28M secrets leaked on GitHub in 2025 — supply chain hygiene matters).

---

## A07 — Authentication Failures

- Lockout after N failed attempts (with exponential backoff or CAPTCHA, **not** permanent — DoS risk).
- Require MFA for admin/sensitive actions.
- Rotate session token on login, logout, password change, privilege change.
- Password reset tokens: single-use, expire ≤ 1h, sent to email of record.

### Passkeys / WebAuthn (FIDO2) — preferred in 2026

Passkeys are **phishing-resistant** (bound to the origin, no shared secret to steal or replay) and are now the recommended primary/step-up factor. Prefer them over TOTP/SMS where the client supports them.

- Use a maintained library — don't hand-roll CBOR/attestation parsing:
  - **Node**: `@simplewebauthn/server` (+ `@simplewebauthn/browser`)
  - **Python**: `py_webauthn`
  - **PHP**: `web-auth/webauthn-lib`
- **Verify server-side on every ceremony**: the `challenge` (single-use, from your session), `origin`, and `rpId`. Reject mismatches.
- Store the credential's **public key + signCount**; reject or flag if `signCount` goes backwards (cloned authenticator).
- Support **discoverable credentials (resident keys)** for usernameless login; allow multiple passkeys per user + a recovery path.
- Treat passkeys as MFA-equivalent for step-up (user verification = biometric/PIN).

```ts
// Node — @simplewebauthn/server (verification step, abridged)
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
const verification = await verifyAuthenticationResponse({
  response,                                  // from client
  expectedChallenge: session.challenge,      // single-use, server-issued
  expectedOrigin: process.env['ORIGIN']!,    // e.g. https://app.example.com
  expectedRPID: process.env['RP_ID']!,       // e.g. app.example.com
  credential: { id: cred.id, publicKey: cred.publicKey, counter: cred.signCount },
  requireUserVerification: true,
});
if (!verification.verified) throw new Error('auth failed');
await saveSignCount(cred.id, verification.authenticationInfo.newCounter); // detect clones
```

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

## A10 — Server-Side Request Forgery (SSRF)  *(2025: folded into A01 — Broken Access Control)*

OWASP 2025 removed SSRF as a standalone category and treats it as a sub-class of A01. **The risk did not decrease** — apply the same controls. The numbering here is preserved so cross-references in `security-auditor` and per-stack overlays keep working.

- Allowlist outbound destinations when fetching user-supplied URLs.
- Block private IP ranges (10/8, 172.16/12, 192.168/16, 169.254/16, ::1, fc00::/7).
- Resolve DNS yourself and check the IP — defeats DNS rebinding.
- Cloud metadata endpoints (`169.254.169.254`, `metadata.google.internal`) — **always block**, regardless of allowlist.

```ts
import { isIP } from 'net';
const PRIVATE = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|169\.254\.|::1|fc|fd)/i;
const url = new URL(userUrl);
const ip = await dns.lookup(url.hostname);
if (PRIVATE.test(ip.address)) throw new ForbiddenError('Private IP not allowed');
```

---

## A10+ (2025 only) — Mishandling of Exceptional Conditions *(NEW in 2025)*

Errors that **fail open**, leak internals, or leave the system in an inconsistent state. Distinct from A09 (which is about *whether* you logged it) — this is about *how the code reacts*.

| Anti-pattern | Why dangerous | Fix |
|---|---|---|
| `try { ... } catch (e) { /* ignore */ }` | Swallows security-relevant failures (e.g. authz check threw) | Log + rethrow, OR explicit comment why it's safe to ignore |
| Auth check inside `try`, success path outside | If auth throws, code may continue as if authenticated | Authz **fails closed**: throw → caller treats as denied |
| 500 with full stack trace to client | Leaks file paths, library versions, ORM internals | Generic message to client; full trace to logger only |
| Webhook handler returns 500 on parse error | Provider retries forever; floods queue | Validate signature first; on parse error log + return 200 (idempotently dropped) |
| Partial write on transaction failure | Money charged but order not created | Wrap multi-step writes in a transaction; on error, rollback all |
| Default-allow on missing config (`if (!config.requireMfa) skip`) | Misconfiguration → security off | Default-deny: missing config = block |

```ts
// WRONG — fail open
try {
  await assertCanAccess(user, resource);
} catch (e) {
  console.log(e);
  // ...code continues, request succeeds
}

// CORRECT — fail closed
try {
  await assertCanAccess(user, resource);
} catch (e) {
  logger.warn({ event: 'authz.error', err: e, userId: user.id, resourceId: resource.id });
  throw e;             // caller maps to 403
}
```

See `error-handling` skill for full taxonomy and Result-type patterns.

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

- [ ] All routes have authn + authz checks (§A01)
- [ ] User ID derived from session, never from body (§A01)
- [ ] All inputs validated by schema (§A03)
- [ ] No secrets in code (see `secrets-management`) (§A02 + 2025-A03)
- [ ] No raw SQL / Mongo operators from user input (§A03)
- [ ] Security headers set on responses (§A05)
- [ ] Rate limit on auth + write endpoints (§A07)
- [ ] PII not in logs (see `observability`) (§A09)
- [ ] Webhook signatures verified before parsing (§A08)
- [ ] CI pins GitHub Actions by SHA + uses OIDC for cloud auth (2025-A03)
- [ ] No silent `catch` blocks; authz failures rethrow (2025-A10)
- [ ] Cloud metadata endpoints blocked in any URL-fetching code (§A10)

## See Also

- `cve-watchlist.md` (this folder) — named 2025–2026 CVEs (React2Shell, Next PPR,
  Passport, Symfony, Shai-Hulud). Agents Read **only** on lockfile / worm hit.
- `secrets-management` — env hygiene, gitleaks, OIDC federation
- `observability` — log redaction, PII handling
- `error-handling` — fail-closed patterns (2025-A10)
- `ci-pipelines` — pinning + provenance (2025-A03)
- `ai-llm-security` — OWASP Top 10 for LLM Apps (prompt injection, tool/agent authority) if the app calls an LLM
- `api-security-node` / `api-security-python` / PHP `api-security` — stack-specific hardening
- Stack overlays consume the §A01–§A10 anchors above. **Do not renumber.**
