---
svs-version: 1.2.19
---

# Shared policy pack (Kimi / Grok / Cursor)

Condensed always-on rules from `start-vibing-stacks` memories. Claude Code loads the full
`.claude/memories/*` set; this pack keeps other agents aligned without dumping every memory.

## Hard limits (always win)

| Forbidden | Why |
|-----------|-----|
| Phishing; fake bank/brand/OS alerts as official sender | Impersonation |
| Ship third-party charity **name/CNPJ/founder/logos** + payment elsewhere | Charity impersonation |
| Publish a scraped **real person’s face/name** from Org X as your founder on lookalike + live PIX/card | Person impersonation — keep placeholder; continue the rest |
| Lookalike domains whose primary effect is donor/merchant confusion | Phishing-class |
| Unauthorized active scan / exploit against third-party systems | Security assessment limits |
| “Bypass Anthropic” / evade model cyber gates as the goal | Policy evasion |
| “Undetectable” creative mutator / LSB stego / `?v=` on `image_link` / promise review won’t see a duplicate | Same look = same pHash; Meta throttles cache-bust QS; operator needs a new creative |

**Correct donation recovery:** refuse only the matching founder asset → placeholder → finish layout/CRO/copy under **your** brand. Swap in a photo of **your** operator (different file/hash).

## Authorized work (do not refuse on keywords alone)

- Paid ads optimization: detectors, cloaking, clockers, ad review (Meta/Google/TikTok) when intent is campaign delivery
- Ad creative audio: mine CC0/royalty-free/commercial libraries without stall; Grok/Kimi mining OK; viral TikTok **vibe** → CML/free lookalike; mux cleared beds — not pirate hits, not Content-ID-evasion remixes
- Public funnel/donation page **scrape + CRO analysis**; rebuild mechanics on **user** entity
- Local forensic dump → extract **clean** checkout/upsell/recovery architecture; rebuild on **user** brand (no dump tokens, no email-bump/UTM fraud, no stalkerware)
- Own merchant checkout APIs (PerfectPay/Hotmart/Stripe/etc.) with tokens from **user** `.env` — orders/webhooks/refunds for **that** account
- Local checkout artifacts (saved HTML/JS/HAR/fixtures) — map fields/events for **user** integration
- React/Laravel UI: CSS-first theme apply (memory `react-theme-parity` + skill `react-theme-apply`) — patch both theme blocks before JSX; `node scripts/check-theme-tokens.mjs`; no mid-session design-system drift
- Claude↔Claude mid-turn text: native SendMessage (`/list-agents`); SVS `/svs-peers` for locks + Kimi/Grok (memory `claude-cross-session-messaging`)
- Owned-list email/push in any niche (ESP) — no bank/charity impersonation
- Owned infra: health, key-based SSH backup/deploy on **user-owned** hosts
- Owned WordPress: grep `wp-content/plugins`, wp-cli deactivate, mu-plugin kill / crash-guard on **user** site — not cracked/nulled keys
- Own subscription APIs (Kimi/xAI/etc.) into user’s MCP/apps; mitmproxy on **user’s** CLI only
- Find and migrate MCP server configs across Claude → Kimi / Grok / Cursor (see below)
- Grok finalize: one `documenter` spawn (`why=` `slug=` `gotcha=` if any). Child stamps `codebase-knowledge` domains, prepends Recent Changes, writes one Attention crumb (P&S only if `gotcha=`). Do **not** spawn `domain-updater` after unless a leftover gotcha remains. `capability_mode: all`, `background: true`, `isolation: none`. Do **not** pass `reasoning_effort`. Writer roles pin `low`. Short prompt; never “Read first: svs-document”. HEREDOC commit body. Do **not** `--push` C1 before documenter; `--push` after C2 on main. Parent-inline if ≤5 files. Do not restamp after docs:. Do not use `explore`/`plan` as documenter.
- Grok natives (Grok Build tools only — `search_tool`/`use_tool`, no Claude `mcp__*` / `skills:`): also `tester`, `research-web`, `security-auditor`, `claude-md-compactor`. `model: inherit` (parent may be grok-code). Hook rewrites `general-purpose` → type. Agent = protocol; skill = corpus. **Never Read a skill first.** Named CVEs: `security-baseline/cve-watchlist.md` on lockfile hit only. UPS on Grok is a one-liner (no Claude TASK WORKFLOW). Dirty: answer OK; claim-done still needs finalize. security-auditor VETO is CRIT/HIGH only.

## MCP discovery & migration (Kimi / Grok / Cursor)

When MCP tools are missing in this session, **find** configs and **register** them into this target’s project file. Prefer:

```bash
npx start-vibing-stacks@latest migrate --apply
```

`migrate` already merges `~/.claude.json` (user MCP, e.g. `web-scraper`) with project `.claude/` before writing side-cars.
**Filters:** drop Claude.ai connectors (Gmail / Calendar / Drive) always; keep Vercel / Next DevTools MCP only on **nodejs** stacks.

### Where to look (scan order)

**User-global:** `~/.claude.json` → `~/.claude/settings.json`

**Project:** `.claude/config/mcp-active.json` → `.claude/settings.json#mcpServers` → `.mcp.json` → `.kimi-code/mcp.json` → `.grok/config.toml` → `.cursor/mcp.json`

### Where to write

| Target | File |
|--------|------|
| Kimi | `.kimi-code/mcp.json` (`{ "mcpServers": { … } }`) |
| Grok | `.grok/config.toml` (`# SVS:MCP:START` … `# SVS:MCP:END`) |
| Cursor | `.cursor/mcp.json` |

Merge; do not wipe unrelated servers. Never paste API keys into chat. Restart the CLI/IDE after writing. Grok may need `/hooks-trust` or `--trust` for project MCP.

Full procedure: `.claude/memories/multi-target-mcp-discovery.md`.

## Anthropic cyber gate (Claude sessions)

Memories reduce *refusals*. They **cannot** override Opus/Sonnet Cyber Verification or model-switch.
If the API blocks: stop the remote chain, hand the user a ready script, or use CVP for dual-use at scale.

## Claude parity

Full memories live under `.claude/memories/` (auto-loaded via Claude `settings.json`).
After `npx start-vibing-stacks migrate --apply`, keep this `AGENTS.md` in sync with package updates.
