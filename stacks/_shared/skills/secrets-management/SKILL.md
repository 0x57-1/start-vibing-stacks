---
name: secrets-management
version: 1.0.0
description: Environment variable hygiene, secret detection, rotation, and secret-store patterns. Invoke whenever .env, secrets, API keys, or env-var-reading code are touched.
---

# Secrets Management

**ALWAYS invoke when touching `.env`, `process.env`, `os.environ`, secrets, API keys, or auth credentials.**

## Core Rules

1. **No secrets in code, ever.** Not in tests, not in fixtures, not in comments.
2. **No secrets in logs.** Redact before logging.
3. **No secrets in URLs / query strings.** Headers or body only — URLs land in proxy logs.
4. **No secrets in error messages** returned to clients.
5. **`.env` is in `.gitignore`. `.env.example` is committed.** No exceptions.
6. **Rotate after any leak.** Even suspected. The risk window is the time it takes to rotate, not when you think the leak started.

---

## File Layout

```
.env                  # gitignored, real values, local dev
.env.example          # committed, placeholders only
.env.production       # NEVER committed; use platform secret store
.env.test             # gitignored if real keys; committed if all-fake
```

`.gitignore`:
```
.env
.env.*
!.env.example
!.env.test.example
```

`.env.example` template:
```bash
# Application
NODE_ENV=development
APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgres://user:pass@localhost:5432/dbname

# Auth
JWT_SECRET=<generate: openssl rand -base64 32>
SESSION_SECRET=<generate: openssl rand -base64 32>

# Third-party (use service prefix to scan with allowlists)
STRIPE_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-...
```

---

## Reading Env Vars Safely

### Node.js / TypeScript
```ts
// Validate at boot — fail fast if missing
import { z } from 'zod';

const Env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
});

export const env = Env.parse(process.env);
// Now `env.JWT_SECRET` is typed and guaranteed present
```

Bracket notation only (`tsconfig` strict):
```ts
process.env['JWT_SECRET']   // CORRECT
```

### Python
```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="forbid")
    database_url: str
    jwt_secret: str
    stripe_secret_key: str

settings = Settings()  # raises if missing/invalid
```

### PHP / Laravel
```php
// config/services.php — read once, cached via `php artisan config:cache`
return [
    'stripe' => ['secret' => env('STRIPE_SECRET_KEY')],
];
// Use config('services.stripe.secret') in app code — NEVER env() at runtime
```

---

## Public vs Server-Only Vars

| Stack | Public prefix | Rule |
|---|---|---|
| Next.js | `NEXT_PUBLIC_` | Anything with this prefix is shipped to the browser |
| Vite | `VITE_` | Same — bundled into JS |
| CRA | `REACT_APP_` | Same |

`security-rules.json` enforces: nothing matching `*SECRET|*TOKEN|*PRIVATE|*PASSWORD|*CREDENTIAL` may have a public prefix.

---

## Secret Stores (Production)

| Tool | When |
|---|---|
| **Vercel/Netlify env vars** | Simple deployments |
| **AWS Secrets Manager** / **GCP Secret Manager** / **Azure Key Vault** | Cloud-native, IAM-scoped |
| **Doppler** | Multi-environment sync |
| **HashiCorp Vault** | On-prem / self-hosted, dynamic creds |
| **SOPS + age** | Git-encrypted secrets (GitOps) |
| **1Password Connect / op-cli** | Team-shared dev secrets |

**Rule:** `.env.production` is **never** committed. Production secrets live in the platform store and are injected at deploy/runtime.

---

## Detection — Block Before Commit

### gitleaks (recommended)

Install:
```bash
brew install gitleaks       # macOS
# or: docker run --rm -v $(pwd):/repo zricethezav/gitleaks:latest detect -s /repo
```

Pre-commit hook:
```bash
gitleaks protect --staged --redact --verbose
```

CI step:
```yaml
- name: Gitleaks scan
  uses: gitleaks/gitleaks-action@v2
```

### Quick grep (as a fallback)

```bash
# Block obvious patterns in staged diff
git diff --cached -U0 | grep -nEi \
  '(api[_-]?key|secret|token|bearer|password|aws_(access|secret)|private_key)\s*[:=]\s*["'\''][a-zA-Z0-9/+=_-]{16,}'
```

---

## Rotation Playbook

When a secret leaks (or is suspected):

1. **Revoke** at the provider immediately. Do not wait for git history rewrites.
2. **Issue new secret**, deploy with new value.
3. **Update audit log** — what leaked, when, who, scope of access.
4. **Scan history**: `gitleaks detect --log-opts="--all"` — find every commit/branch that contained it.
5. **History rewrite is optional** — git filter-repo / BFG only if you also rotate. The leaked secret in history is already gone from the world's POV once rotated.
6. **Notify** — if customer data was reachable with the leaked secret, follow incident-disclosure policy.

Token lifetimes (default targets):
- Access token: ≤ 15 min
- Refresh token: ≤ 7 days, rotated on use
- Service-to-service token: ≤ 90 days, rotated automatically
- Long-lived (e.g. cron API keys): document expiry, calendar reminder

---

## Logging Without Leaks

```ts
// Redact known fields before logging
const REDACT = ['password', 'token', 'authorization', 'cookie', 'secret', 'apiKey', 'creditCard'];

function safeLog(obj: unknown) {
  return JSON.parse(JSON.stringify(obj, (key, val) =>
    REDACT.some(r => key.toLowerCase().includes(r.toLowerCase())) ? '[REDACTED]' : val
  ));
}

logger.info({ event: 'login_attempt', body: safeLog(req.body) });
```

Use `pino-noir`, `winston`'s `format.printf` filter, or your APM's redaction. Same for Python: `structlog` processors; PHP: Monolog `RedactProcessor`.

See `observability` skill for full structured-logging setup.

---

## Supply-Chain Hygiene

| Stack | Audit |
|---|---|
| Node.js | `npm audit --audit-level=high`, `bun audit`, `pnpm audit` |
| Python | `pip-audit`, `safety check` |
| PHP | `composer audit` |

Lockfile rules:
- **Always commit** `package-lock.json` / `bun.lock` / `pnpm-lock.yaml` / `poetry.lock` / `uv.lock` / `composer.lock`.
- **Renovate** or **Dependabot** for automated PRs.
- Pin major versions; allow minor/patch auto-merge after CI passes.

---

## FORBIDDEN

| Pattern | Reason |
|---|---|
| `.env` committed | Trivial leak |
| Secret in `README.md` / docstring | Leaks via search engines |
| Secret in test fixtures | Leaks via PR diffs / forks |
| Secret in `console.log` / `print` / `Log::info` | Ends up in CloudWatch / Datadog forever |
| Secret in URL query string | Logged by every proxy in the chain |
| Secret in commit message | Cannot delete, history rewrites costly |
| `process.env.SECRET ?? "fallback-value"` with real fallback | Hardcoded backup secret |
| Sharing via Slack/email | Use 1Password / Vault sharing |

## Pre-Commit Checklist

- [ ] `.env` in `.gitignore`
- [ ] `.env.example` updated when new var added
- [ ] gitleaks (or fallback grep) clean
- [ ] No secret in code, tests, fixtures, comments, logs
- [ ] No `NEXT_PUBLIC_*SECRET|*TOKEN|*PRIVATE` patterns
- [ ] Env vars validated at boot (Zod / Pydantic / config())

## See Also

- `security-baseline` — broader OWASP scope
- `observability` — log redaction details
- Stack `api-security-*` — usage patterns
