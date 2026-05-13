---
name: research-cache
version: 2.0.0
description: "Caches web research findings under `.claude/skills/research-cache/cache/` to avoid redundant searches. Each entry has YAML frontmatter (`expires_on`, `sources`, `tier`, `engines`) so a session can grep-filter fresh entries without reading the body. Consumed by `research-web` v2.0.0 BEFORE any MCP / WebSearch call."
---

# Research Cache — Best-Practices Storage (v2.0.0)

**ALWAYS invoke BEFORE any web research.** This skill is the **read AND write** side of `research-web` v2.0.0.

## Layout

```
.claude/skills/research-cache/
├── SKILL.md
└── cache/
    ├── _index.json                    # auto-derived, optional (one record per cache entry)
    └── <topic-slug>.md                # one file per topic. ≤ 8 KB. Pruned at expires_on.
```

## Cache entry frontmatter (token-efficient lookup)

Every cache entry MUST start with this frontmatter so a `grep` over `cache/*.md` filters fresh entries without parsing bodies:

```yaml
---
topic: <kebab-case>
stack: php | nodejs | python | universal | frontend
researched_on: YYYY-MM-DD
expires_on: YYYY-MM-DD            # researched_on + 30 days (60 for stable specs, 14 for moving libraries)
tier: 1 | 2                       # 1 = MCP web-scraper used; 2 = built-in WebSearch fallback
engines: [brave, vertex, grok]    # which engines contributed (Tier 1 only)
sources_count: <int>
confidence: high | medium | low   # high = 3+ official-doc sources agree; low = single blog post
---
```

## Read protocol (lookup BEFORE searching)

```bash
TOPIC="<kebab-case>"
TODAY=$(date +%F)

# 1. Direct hit?
F=".claude/skills/research-cache/cache/${TOPIC}.md"
if [ -f "$F" ]; then
  EXPIRES=$(awk -F': ' '/^expires_on:/{print $2; exit}' "$F")
  [ "$EXPIRES" \> "$TODAY" ] && echo "FRESH cache hit: $F" && exit 0
  echo "STALE: $F (expired $EXPIRES); will refresh"
fi

# 2. Fuzzy hit? (alias / synonym)
grep -l "topic:.*${TOPIC%%-*}" .claude/skills/research-cache/cache/*.md 2>/dev/null
```

If FRESH → use the cache, do NOT re-search.
If STALE or MISSING → research, then write a new entry (overwrite or create).

## Write protocol (after research)

Always overwrite — never append. Stale data is worse than missing data.

### Body template

```markdown
---
topic: <kebab-case>
stack: <one-of>
researched_on: 2026-05-13
expires_on: 2026-06-12
tier: 1
engines: [brave, vertex, grok]
sources_count: 5
confidence: high
---

# Research: <Topic Title>

> **TL;DR** (≤ 3 lines). The actionable answer in 30 seconds.

## Findings (cited)

| # | Finding | Source | Date | Tier |
|---|---|---|---|---|
| 1 | <one-line> | https://docs.example.com/foo | 2026-04-12 | official |
| 2 | <one-line> | https://eng-blog.example.com/bar | 2026-03-30 | engineering |

## Recommendations

- <actionable rule, ready to drop into a skill or CLAUDE.md>
- <do this, not that>

## Anti-patterns

- <something to avoid + why>

## Code reference (optional)

- File / line / commit pointing at where this rule should be applied — NOT inline code dumps.

## Open questions

- <thing the research did NOT answer; flag for next round>
```

## Expiry policy (cost vs freshness)

| Topic kind | TTL | Example |
|---|---|---|
| Specification (W3C, RFC, OpenAPI) | 60 days | WCAG 2.2 conformance |
| Stable framework (Laravel, Django, Express) | 30 days | Laravel 12 sessions |
| Fast-moving library (any minor < 1.0, anything pre-release) | 14 days | shadcn registries, AI SDKs |
| Security advisory | 7 days | CVE feeds, OWASP draft |

After `expires_on`, the entry is read-only history — `research-web` will refresh it on the next lookup.

## Source ranking (recorded in each finding row)

1. **official** — vendor docs, RFCs, W3C, MDN
2. **engineering** — engineering blogs of the project (vercel.com/blog, fastify.io/blog)
3. **community** — high-signal: Stack Overflow with 50+ votes, GitHub issues with maintainer response
4. **opinion** — random blog post — accepted only if it confirms an official-doc claim, never as primary

## Rules

1. **CHECK CACHE FIRST** — frontmatter `expires_on` lookup is one `awk`. Cheaper than any web call.
2. **OVERWRITE, NEVER APPEND** — stale information is worse than missing.
3. **CITE EVERY FINDING** — URL + date + tier. No bare claims.
4. **TTL BY TOPIC KIND** — see table above. A spec lasts longer than a pre-release library.
5. **CONFIDENCE EXPLICIT** — `high` requires ≥ 3 official-doc sources agreeing; `low` is single source.
6. **NO INLINE CODE DUMPS** — link to file/line; the model can `Read` when it needs the bytes.
7. **NO PII / SECRETS / CUSTOMER DATA** — never quote env values, tokens, internal hostnames.
8. **PROMOTE WHAT'S UNIVERSAL** — if a rule applies project-wide, surface it for inclusion in `CLAUDE.md` (do not auto-edit).

## See Also

- `research-web` v2.0.0 — MCP-first researcher; reads/writes this cache
- `claude-md-compactor` v2.0.0 — receives promoted rules; enforces 20 KB CLAUDE.md budget
- `mcp-web-scraper` skill — the MCP server providing Tier 1 search/scrape capability
