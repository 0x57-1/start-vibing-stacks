---
name: research
description: Research best practices using research-web (MCP-first) with cache lookup before any web call.
version: 1.0.0
---

# /research — Research Best Practices

Always read `.claude/config/active-project.json` first to know the active stack.

| # | Step | Tool / Skill |
|---|---|---|
| 1 | **Cache lookup** — check `.claude/skills/research-cache/cache/<topic>.md` first. If fresh (≤ 30 days), use it and skip steps 2–5 | `research-cache` |
| 2 | **MCP probe** — detect `mcp__web-scraper__*` availability (one-shot per session) | `research-web` |
| 3 | **Search** — Tier 1: `unified_search` (Brave + Vertex AI + Grok, dedupe + scoring). Tier 2 fallback: built-in `WebSearch` | `research-web` |
| 4 | **Source ranking** — official docs > engineering blogs > GitHub issues > Stack Overflow. Reject anything > 18 months old without re-validation | (you) |
| 5 | **Deep read** — Tier 1: `scrape_url` (stealth + proxy). Tier 2 fallback: built-in `WebFetch` | `research-web` |
| 6 | **Document** — write `.claude/skills/research-cache/cache/<topic>.md` with: date · expiry (now + 30 days) · sources · TL;DR · actionable rules | `research-cache` |
| 7 | **Promote** — if any rule applies project-wide, propose adding it to `CLAUDE.md` (do NOT auto-edit; surface the proposal) | (you) |

Each cache entry has frontmatter `expires_on:` so a future session can detect stale notes without re-reading the body.
