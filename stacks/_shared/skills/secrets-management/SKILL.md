---
name: secrets-management
version: 2.1.3
description: "Environment variable hygiene, OIDC federation for CI/CD (2026 default — replaces long-lived static secrets), secret detection (gitleaks 3-layer: pre-commit + CI + GitHub push protection), rotation, and secret-store patterns. Invoke whenever .env, secrets, API keys, env-var-reading code, or CI cloud-deploy credentials are touched."
---

# Secrets Management

**ALWAYS invoke when touching `.env`, `process.env`, `os.environ`, secrets, API keys, auth credentials, or CI workflows that authenticate to cloud providers.**

> 2026 reality check: **28.65 million** new hardcoded secrets were added to public GitHub repositories in 2025 (+34% YoY, source: Snyk State of Secrets). The threat model is "an attacker is already scanning every commit you push, in real time."

## Core Rules

1. **No secrets in code, ever.** Not in tests, not in fixtures, not in comments.
2. **No secrets in logs.** Redact before logging.
3. **No secrets in URLs / query strings.** Headers or body only — URLs land in proxy logs.
4. **No secrets in error messages** returned to clients.
5. **`.env` is in `.gitignore`. `.env.example` is committed.** No exceptions.
6. **Rotate after any leak.** Even suspected. The risk window is the time it takes to rotate, not when you think the leak started.
7. **Prefer OIDC federation over static cloud creds in CI.** A leaked OIDC trust policy needs branch-+-repo match to be exploited; a leaked AWS access key works from anywhere until rotated.

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

## `.env.d/` Directory Pattern (Multi-Work / Multi-Session)

For projects with multiple worktrees, parallel Claude sessions, or complex environment matrices, use the `.env.d/` directory pattern instead of a single `.env` file.

### Recommended Layout
```
.env.d/
  local/
    01-app.env
    10-db.env
    20-auth.env
    30-third-party.env
  staging/
    01-app.env
    ...
  production/
    01-app.env
    ...
  shared/
    99-common.env
```

### Rules
- **Load order:** Files are sourced alphabetically (`01-` before `10-` before `99-`).
- **Session isolation:** Each Claude session should only touch files inside its own worktree's `.env.d/local/`.
- **Never commit real secrets:** Only commit `.env.d/*/ *.example` or `.env.d/*/.gitkeep`.
- **JSON / PEM / SSH keys:** Place in `.env.d/local/secrets/` (gitignored) and reference via absolute path in the `.env` files.

```bash
# .env.d/local/30-secrets.env
PRIVATE_KEY_PATH=/absolute/path/to/.env.d/local/secrets/service-account.json
SSH_KEY_PATH=/absolute/path/to/.env.d/local/secrets/id_ed25519
```

### `.gitignore` for `.env.d/`
```gitignore
.env.d/
!**/.gitkeep
!**/*.example
```

---

## Secret Files (JSON, PEM, SSH Keys) — Multi-Session Safe Handling

When a secret must live in a file (service account JSON, SSH private key, certificate bundle, etc.):

1. **Store in `.env.d/<env>/secrets/`** (never in repo root or `src/`).
2. **Reference by absolute path** in the corresponding `.env.d/<env>/*.env` file.
3. **Never read the file content into a variable** unless you immediately redact it from logs/memory.
4. **Claude sessions must never cross worktree boundaries** — the `pre-tool-use.ts` hook already enforces this via `filesTouched` tracking.

### Example (Node.js)
```ts
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync(process.env['GOOGLE_APPLICATION_CREDENTIALS']!, 'utf8')
);
```

### Example (Python)
```python
from pathlib import Path
import json

key_path = Path(os.environ["PRIVATE_KEY_PATH"])
service_account = json.loads(key_path.read_text())
```

### Multi-Session Coordination Note
The coordination layer (`_state.ts`, `pre-tool-use.ts`, `stop-validator.ts`) treats `.env.d/` files the same as any other file. If two sessions attempt to edit the same secret file within 5 minutes, the second session is blocked. This is intentional — secrets must be edited serially.

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
| **HashiCorp Vault** | On-prem / self-hosted, dynamic creds (auto-revoked) |
| **SOPS + age** | Git-encrypted secrets (GitOps) — `age` recommended over PGP for new repos (no keyring management, single-line keys) |
| **1Password Connect / op-cli** | Team-shared dev secrets |

**Rule:** `.env.production` is **never** committed. Production secrets live in the platform store and are injected at deploy/runtime.

### 2026 reference architecture (defense in depth)

1. **Short-lived credentials via OIDC** for CI/CD → no static cloud secrets
2. **Encrypted secrets in Git via SOPS+age** for app config that must travel with code
3. **Dynamic secrets via Vault** for DB/API tokens generated on-demand and auto-revoked

---

## OIDC Federation — CI/CD Without Static Cloud Secrets *(2026 default)*

GitHub Actions presents a JWT to the cloud's STS; cloud returns a short-lived (≤ 1h) credential. **No long-lived `AWS_SECRET_ACCESS_KEY` in repo secrets.**

### AWS — IAM Role + Trust Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
      },
      "StringLike": {
        "token.actions.githubusercontent.com:sub": "repo:my-org/my-repo:ref:refs/heads/main"
      }
    }
  }]
}
```

```yaml
permissions:
  id-token: write              # MANDATORY for OIDC
  contents: read
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::ACCOUNT_ID:role/gha-deployer
          aws-region: us-east-1
      - run: aws s3 sync ./dist s3://my-bucket
```

### GCP — Workload Identity Federation
```yaml
- uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: 'projects/.../providers/github'
    service_account: 'gha-deployer@my-project.iam.gserviceaccount.com'
```

### npm publish — provenance via OIDC (no `NPM_TOKEN`)
```yaml
permissions:
  id-token: write
  contents: read
- run: npm publish --provenance --access public
```

**Anti-pattern:** storing `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` as repo secrets. If you can use OIDC, you must.

---

## Detection — Three-Layer Defense *(2026 standard)*

A single layer is insufficient. Deploy **all three** so a bypass at one layer is caught at the next.

### Layer 1 — Local pre-commit hook (developer machine)

Catches before the secret ever leaves the laptop.

```bash
brew install gitleaks       # macOS
# or: docker run --rm -v $(pwd):/repo zricethezav/gitleaks:latest detect -s /repo
```

`.git/hooks/pre-commit` (or via `pre-commit` framework):
```bash
gitleaks protect --staged --redact --verbose
```

Gitleaks ships rules for **150+ credential patterns** (AWS, GCP, GitHub, Stripe, OpenAI, Anthropic, Slack, JWT, private keys, etc.).

### Layer 2 — CI scan on every PR (server-side)

Blocks PRs that slipped past Layer 1.

```yaml
- name: Gitleaks scan
  uses: gitleaks/gitleaks-action@v2
  env:
    GITLEAKS_LICENSE: ${{ secrets.GITLEAKS_LICENSE }}   # only needed for org accounts
```

### Layer 3 — GitHub Push Protection (platform-side)

Enable in **Settings → Code security → Secret scanning → Push protection**. GitHub's own scanner blocks the `git push` itself for known provider patterns. Free for public repos; **GitHub Advanced Security** for private.

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
- [ ] gitleaks (Layer 1) clean
- [ ] No secret in code, tests, fixtures, comments, logs
- [ ] No `NEXT_PUBLIC_*SECRET|*TOKEN|*PRIVATE` patterns
- [ ] Env vars validated at boot (Zod / Pydantic / config())
- [ ] CI workflows that touch cloud use **OIDC**, not static keys
- [ ] GitHub Push Protection enabled on the repo

## See Also

- `security-baseline` — broader OWASP scope (2025-A03 Software Supply Chain Failures)
- `observability` — log redaction details
- `ci-pipelines` — OIDC patterns + workflow permissions
- `owned-infra-ops` — SSH/backup/deploy on user-owned hosts (keys, not passwords; cyber false-positive hygiene)
- `own-subscription-integration` — wire user’s paid OAuth/APIs into MCP; never print tokens; local CLI auth capture
- `security-assessment-ops` — defensive source/API review; redact secrets in findings
- Stack `api-security-*` — usage patterns
- `memory-optimization` — when this skill grows beyond ~200 lines, run MOP to keep it actionable

## Memory Optimization Trigger

If this skill accumulates:
- 3+ duplicate rotation playbooks across stacks
- 5+ generic "rotate after leak" paragraphs
- Repeated OIDC examples that differ only by cloud provider

→ Suggest running:
```bash
npx start-vibing-stacks memory optimize --dry-run
```
