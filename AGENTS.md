---
svs-version: 1.2.13
generated-by: start-vibing-stacks
targets: kimi, grok, cursor
---

# start-vibing-stacks — AGENTS.md

> Shared project instructions for **Kimi Code**, **Grok**, and tools that read `AGENTS.md`.
> Claude Code prefers `CLAUDE.md` + `.claude/memories/`. Keep both in sync via
> `npx start-vibing-stacks migrate --apply`.

## 30 Seconds Overview

CLI tool published to npm as `start-vibing-stacks`. Generates a complete `.claude/` setup (agents, skills, hooks, commands, configs) and `CLAUDE.md` for a target project, parametrized by stack (PHP / Node.js / Python). Auto-detects existing project standards (lint configs, lockfiles, env shapes) and either adapts to them or seeds defaults. Also ships a `migrate` subcommand that diffs installed skill versions against the bundled package and upgrades outdated ones.

Run via `npx start-vibing-stacks` — no install required.

## Stack

| Component | Technology |
|---|---|
| Runtime | Node.js ≥ 18 (also runs on Bun) |
| Language | TypeScript **strict mode** |
| Build | `tsc` → `dist/` (ESM) |
| Distribution | npm package; `bin: dist/index.js` |
| CLI deps | `chalk`, `inquirer`, `ora`, `semver` |
| Test | (none yet — manual `npx tsx src/index.ts` against fixture dirs) |
| Release | GitHub Actions: `auto-release.yml` (push to main with `package.json` bump → tag + release + `npm publish`) |

## Recent Changes (mirrored from CLAUDE.md)

### 2026-08-19 · main · v2.90.3
Grok finalize: no first Read of `svs-document`; `background: true`;
HEREDOC commit body; `--push` after C2 (not C1).

### 2026-08-19 · main · v2.90.2
Grok writer roles pin `low`. Child Reads `svs-document` (no Claude `skills:`).

### 2026-08-19 · main · v2.90.1
Grok spawn schema often omits `reasoning_effort` — do not pass it. Writer
roles pin `none`. Hook rewrites `general-purpose` → type.

### 2026-08-18 · main · v2.90.0
Grok-native documenter creates missing domains (template + Files + index).
Spawn custom type + `reasoning_effort: low`. Stop accepts C1 stamp after docs C2.

### 2026-08-18 · main · v2.89.0
Launch Grok menu: `--always-approve --trust` + folder-trust persist.
Grok spawn: child Reads agent md (short parent prompt; no paste / no overlays).
UPS **1.17**; `svs-finalize` **1.3.1**.

### 2026-08-18 · main · v2.88.1
After `migrate --apply`, launch-only menu when current (no Update first).
AGENTS.md generator = policy-pack **1.2.7** (stale-loop fix).

### 2026-08-18 · main · v2.88.0
`migrate --apply` installs MOP with `--with-memory-optimization` and opens the
launcher (TTY). `--no-launch` = update-and-exit.

### 2026-08-18 · main · v2.87.0
React theme apply: `react-theme-parity` **1.1**, skill `react-theme-apply`,
`check-theme-tokens.mjs`, UPS **1.16**, `svs-finalize` **1.2.2**.

### 2026-08-17 · main · v2.86.0
Memory + skill `owned-wordpress-plugin-ops`: owned-site plugin search/neutralize
(wp-cli / mu-plugin / crash-guard). UPS **1.15**. No nulled keys.

### 2026-08-14 · main · v2.85.0
Multi-instance main-only: `scope --push` refuses non-main; UPS live branch +
MAIN-ONLY nudge; memory `multi-instance-main-only`; commit-manager **3.5**.

### 2026-08-12 · main · v2.84.1
Drop `__pycache__` from vendored `remove-ai-marks`; gitignore Python bytecode.

### 2026-08-12 · main · v2.84.0
Skill `remove-ai-marks` + memory `remove-ai-watermarks`; UPS **1.13** — inspect/clean
Layer A watermarks on user-facing prose before done.

### 2026-08-10 · main · v2.83.0
`execute-ship-ops` **1.3** + UPS **1.12**: SAFE SHIP (push+deploy) vs ATTENTION
GATE (ask before commit); workflow auth until loop closes; full artifact inventory.

### 2026-08-09 · main · v2.82.0
Stop/UPS COMMIT-FIRST + finalize anti-thrash + CLAUDE.md soft 36k; test veto
before push; CDN/OAuth memories; commit-manager **3.4.0**.

### 2026-08-09 · main · v2.81.0
Ignore Claude scratchpads in filesTouched — fixes false finalize/plan-gate/Stop
on `/tmp/claude-*` and `~/.claude/*` edits.

### 2026-08-09 · main · v2.80.0
UPS **1.10.0** / Stop **1.9.0**: light STATUS CHECK; SHIP NOW on urgent push;
finalize soft-pass on status; memory `execute-ship-ops`; global UPS no-op template.

### 2026-08-08 · main · v2.79.0
Memory `verify-before-claim` + UPS **1.9.0**: block memory-only reviews; require fresh
Read/Grep evidence; MULTI-PART EXECUTE when `||` / “outra coisa” (no “which first?”).

### 2026-08-08 · main · v2.78.2
README refresh: Preline moon skill pair, Grok 1.0 trust/rehydrate, targets/skills table,
frontend defaults, migrate `frontendBaseSkillsDir`.

### 2026-08-08 · main · v2.78.1
`preline-ui` **2.2.0** = summary; `preline-moon` **1.0.1** = source of truth — explicit
cross-refs so agents load moon corpus for markup/tokens, not invent from overview.

### 2026-08-08 · main · v2.78.0
Ship `preline-moon` (offline Preline moon theme corpus) as default React frontend skill;
`preline-ui` **2.1.0**; migrate scans `frontendBaseSkillsDir`; Grok curated + inertia baseSkills.


<!-- SVS:POLICY-PACK:START -->
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
- Grok finalize: `spawn_subagent` type `documenter` / `domain-updater` (`capability_mode: all`, `background: true`, `isolation: none`). Do **not** pass `reasoning_effort`. Writer roles pin `low`. Short prompt; do **not** tell the child to Read `svs-document` / `AGENTS.md` first. HEREDOC commit body (`git show` must stand alone). Do **not** `--push` C1 before documenter; `--push` after C2 on main. Fallback: parent Reads the Grok-native agent. Do not restamp after a docs-only commit. Do not use `explore`/`plan` as documenter.

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
<!-- SVS:POLICY-PACK:END -->

## See also

- `CLAUDE.md` — full Claude Code project rules
- `.claude/memories/` — detailed always-on Claude memories (Read on demand from Kimi/Grok)
- `.claude/memories/multi-target-mcp-discovery.md` — find/migrate MCP → Kimi/Grok/Cursor
- `.claude/config/mcp-active.json` — Claude MCP source for `migrate --apply`
- `.claude/config/svs-manifest.json` — package/target freshness
- `.grok/skills/svs-dev-process/SKILL.md` — same process as a Grok-native skill
