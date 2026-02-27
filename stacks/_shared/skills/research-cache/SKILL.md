# Research Cache — Best Practices Storage

**ALWAYS invoke BEFORE any web research.**

## Purpose

Caches research findings to avoid redundant searches and maintain institutional knowledge.

## Structure

```
.claude/skills/research-cache/
├── SKILL.md
└── cache/
    ├── php-uuid-performance.md
    ├── laravel-octane-memory.md
    └── [topic].md
```

## Before Searching

1. Check cache: `ls .claude/skills/research-cache/cache/`
2. Grep for topic: `grep -rl "topic" .claude/skills/research-cache/cache/`
3. If found and recent (<30 days) → USE CACHE
4. If not found → Research and CREATE cache entry

## Cache Entry Template

```markdown
# Research: {Topic}

**Date:** YYYY-MM-DD
**Stack:** PHP|Node.js|Universal
**Sources:** [list]
**Expires:** YYYY-MM-DD (30 days from research)

## Key Findings
1. Finding — Source: [URL]

## Recommendations
- Actionable recommendation

## Code Examples
\`\`\`php
// Example implementation
\`\`\`

## References
- [URL] — [Description]
```

## Rules

1. **CHECK CACHE FIRST** — avoid redundant searches
2. **CITE SOURCES** — every finding needs URL
3. **DATE ENTRIES** — for freshness checks
4. **STACK-SPECIFIC** — tag by stack for filtering
