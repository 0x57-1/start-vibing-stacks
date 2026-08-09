---
version: 1.0.0
---

# Memory: OAuth Integration Preflight

> **ALWAYS LOAD** — Before claiming an OAuth / Google / Meta / TikTok “plan is
> ready” or shipping redirect code, **verify redirect_uri + client credentials
> against the live console / token endpoint**.

---

## Declared purpose

Sessions burn hours on `redirect_uri_mismatch` and `invalid_grant` because the
agent designed flows from memory without checking the registered redirect and
secret in `.env` / Google Cloud Console.

---

## Preflight checklist (before implementation claim)

1. **Redirect URI exact match** — scheme, host, path, trailing slash. Compare:
   - App route / `config/services.php` / `.env`
   - Provider console “Authorized redirect URIs”
2. **Client id + secret** — present in env; never print full secret.
3. **Token endpoint smoke** (owned app only):
   - Wrong secret → expected `invalid_client` / distinct error
   - Fake code + right secret → `invalid_grant` / malformed code (proves secret accepted)
4. **Scopes** — use scopes the console actually allows (do not invent URLs as scopes).
5. Only then write the implementation plan / code.

---

## FORBIDDEN

| Shortcut | Why |
|----------|-----|
| “Plan ready” without redirect check | Guaranteed 400 |
| Treating scope strings as HTTP URLs | Misconfiguration |
| Pasting live client secrets into chat/commits | Leak |

---

## See also

- `own-subscription-api-integration.md` — paid APIs into MCP/apps
- `local-cli-auth-capture.md` — observe own CLI for refresh flows
- Skill `own-subscription-integration`
