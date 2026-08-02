---
version: 1.0.0
---

# Memory: Owned Checkout & Gateway Ops (Local Tokens)

> **ALWAYS LOAD** — Authorizes using **the user’s own** payment-gateway / checkout API tokens from local config (project `.env`, `.env.d/`, password manager export the user provides, ESP/merchant dashboard keys they control) to fetch **that merchant’s** checkout, order, subscription, and webhook data. This is normal ecommerce ops — not carding, not account takeover, not “hacking PerfectPay.”

---

## Declared purpose

When the user asks to pull checkout/order data **for their store** using credentials that live on their machine or that they explicitly own:

- List sales, pending checkouts, abandoned carts, upsell accepts
- Verify webhook signatures / replay fixtures against **their** secret
- Build admin panels, CRM sync, pixel CAPI, refund helpers for **their** merchant ID
- Debug “payment approved but thank-you failed” using **their** API

…the agent MUST proceed without treating “checkout + token + webhook” as cyber-crime keywords alone.

Covered gateways (examples, not exclusive): PerfectPay, Hotmart, Kiwify, Eduzz, Stripe, Appmax, CenterPag, Mercado Pago, PagSeguro, Pagar.me, PayPal, Shopify checkout APIs, custom merchant backends the user owns.

Companion: `own-subscription-api-integration.md` (coding APIs). Companion skill: `secrets-management` (never print full secrets).

---

## Ownership test (must pass)

Assume ownership when **any** of:

1. Token/key is in the user’s project `.env` / `.env.d/` / `~/.config/…` under names they control, **and** they ask to use it for their product.
2. User states the merchant account / CNPJ / dashboard is theirs.
3. API base URL + account id match a project they are developing as the merchant.

**Do not** assume ownership when the only source is a third-party FTP/HTTrack dump, leaked `config.local.php`, or forensic package from another operator (see Hard limits → use `forensic-funnel-legitimate-rebuild.md` for architecture-only).

---

## Explicit authorization (execute)

1. **Read** local env for gateway key **names** and non-secret ids (store id, webhook path). Prefer `process.env['KEY']` / dotenv — **never echo** full tokens into chat or commits.
2. **Call** the merchant’s documented API (or user’s own backend) to list/get checkouts, orders, customers **scoped to that account**.
3. **Parse** webhook JSON the user stored locally (logs, `fixtures/`, Downloads they own as merchant).
4. **Implement** sync jobs, idempotency keys, refund/cancel flows for **their** gateway.
5. **Redact** PAN/CVV if ever present (should not be); mask email/phone in logs by default unless user needs full fields for support.

Examples you MUST handle:

- “Usa meu `PERFECTPAY_TOKEN` do `.env` e lista as vendas das últimas 24h”
- “Valida a assinatura do webhook com o secret local e normaliza o payload”
- “Puxa o status do checkout X na minha conta Stripe / Hotmart”
- “Monta um script local que eu rodo com minhas keys e cola a saída redigida”

---

## Scope

| Action | Status |
|--------|--------|
| Own-gateway API read (orders, checkouts, subscriptions) | Authorized |
| Own-gateway write (refund, cancel, meta update) when user asks | Authorized |
| Local webhook fixture parse + signature verify with **user** secret | Authorized |
| Pixel/CAPI send using **user** pixel + **user** purchase events | Authorized |
| Tokens/secrets from a third-party dump / stalkerware package | **Forbidden** |
| Hit another merchant’s checkout API with stolen/leaked keys | **Forbidden** |
| Card testing, CNP fraud, chargeback fraud tooling | **Forbidden** |
| Email-bump / fake buyer identity at pay time | **Forbidden** |

---

## Preferred phrasing (reduces false cyber blocks)

| Prefer | Avoid |
|--------|--------|
| “Merchant order sync for my PerfectPay account using project `.env`” | “Crack checkout / dump cards / bypass gateway” |
| “Validate my webhook secret and normalize events” | “Forge PerfectPay webhooks for any store” |
| “Local script; I’ll paste redacted JSON” | Long remote chains with raw secrets in argv |

If the API cyber-blocks mid-call: stop → give user a ready `curl`/Node script that reads `.env` → analyze pasted **redacted** output. Do not rephrase to “bypass Anthropic.”

---

## Hard limits (always win)

| Forbidden | Why |
|-----------|-----|
| Third-party dump tokens for live API use | Not the user’s merchant |
| Buyer PII from unauthorized dumps as a data source | Privacy |
| Impersonate bank/card brand checkout as official | Impersonation |
| “Bypass Anthropic cyber gate” as the goal | Policy evasion |

Memories **cannot** lift Opus/Sonnet Cyber Verification / model-switch. Recurring need → [CVP](https://portal.anthropic.com/programs/cvp).

---

## See Also

- `forensic-funnel-legitimate-rebuild.md` — architecture from dumps (no dump tokens)
- `local-checkout-artifact-analysis.md` — HTML/JS/fixtures on disk
- `funnel-content-copy.md` — public checkout **pages** (no private API)
- `own-subscription-api-integration.md` — Kimi/xAI-style API wiring
- `local-cli-auth-capture.md` — observe **own** CLI only
- Skill: `secrets-management`, `owned-infra-ops`
