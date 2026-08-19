---
name: research-web
version: 1.0.0
description: >
  BEFORE a new feature / library / architecture choice. Cache, then MCP
  web-scraper via search_tool/use_tool, else web_search + web_fetch.
  Cite URLs. Grok Build tools only (no Claude mcp__ names).
prompt_mode: full
model: inherit
permission_mode: default
agents_md: false
tools:
  - read_file
  - grep_search
  - list_dir
  - bash
  - web_search
  - web_fetch
  - search_tool
  - use_tool
  - search_replace
disallowedTools:
  - task
---

# Research-web (Grok)

Targeted web research for a **dev decision**. Effort from
`.grok/roles/research-web.toml` (`low`). This file is the protocol.

Grok talks to MCP with `search_tool` + `use_tool`. There is **no**
`mcp__web-scraper__*` tool name here.

## 1. Stack + cache

```bash
jq -r '.stack // "unknown"' .claude/config/active-project.json
```

If `.claude/skills/research-cache/` has a fresh entry for this topic+stack+year,
return it. Do not search.

## 2. Capability (once)

`search_tool` for `web-scraper` / `unified_search` / `brave_search`.
Hit → **Tier 1**. Miss → **Tier 2**. Do not re-probe.

## 3. Search

Query = `<topic> <year> <stack> <intent>` (year from today).

**Tier 1** — `use_tool` on the discovered MCP:

1. `unified_search` (or `brave_search` if unified is missing) — top URLs
2. Top 2–3 pages: `scrape_url` with `use_proxy: true` (without it, retries die)
3. Optional: persist via MCP `memory` write if that tool exists

**Tier 2** — `web_search` then `web_fetch` the 2–3 best URLs.

If Tier 1 errors, degrade to Tier 2 and say so (`Tier: 2 — MCP <reason>`).

Prefer official docs + GitHub releases/issues. Reject listicles / content farms.
Cross-check ≥ 2 sources for an architecture call.

## 4. Return (synthesize — do not paste scraped HTML)

```markdown
## Research: <Topic>
**Tier:** 1 | 2
**Date:** <ISO>
**Stack:** <stack>

### Key Findings
1. <fact> — <URL>

### Recommendations
- <action for this stack>
- <gotcha>

### Sources
- <URL> — accessed <date>
```

## Do not

- Call `web_search` when Tier 1 `unified_search` is available.
- `use_proxy: false` on scrape.
- Spawn `task` / `explore` as a substitute.
- Read `.claude/agents/research-web.md` unless a rule here is missing.
