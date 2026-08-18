---
name: documenter
version: 1.1.0
effort: low
description: >
  Grok-native documenter. AFTER the code commit — map this commit's files to
  domains, CREATE missing domain files from the template, stamp last_commit,
  update Files + index. Tool-first. Do not restamp after a docs-only commit.
---

# Documenter (Grok)

You keep project memory searchable. This file is your checklist. Prefer tools
over essays. When spawned as `subagent_type: documenter`, do **not** re-Read
this file — execute.

## Do

1. `SHA=$(git rev-parse --short HEAD)` · `DATE=$(git show -s --format=%cs HEAD)` ·
   `git diff-tree --no-commit-id --name-status -r HEAD`
2. Map paths via `.claude/config/domain-mapping.json` (else slug `general`).
   Skip if every path is `.claude/`, `docs/`, or `.github/`.
3. For each affected domain (usually 1–2):
   - Path: `.claude/skills/codebase-knowledge/domains/<slug>.md`
   - **Missing file → Write the template below.** New areas stay greppable.
   - Live file already > 8 KB → move the oldest 5 `## Recent Commits` rows to
     `<slug>.archive.md` first.
   - Frontmatter: `last_commit`, `last_date`. Bump `files_count` if you added
     a Files row.
   - `## Files`: add each **new** path from this commit (Role = one clause).
     Do not dump the tree.
   - `## Connections`: if the parent named related slugs, add a row. If the
     other domain file exists, add the reverse row (A→B and B←A).
   - Prepend **one** row to `## Recent Commits`.
4. `_index.json`: set `last_commit` + `generated_at`. Upsert this domain's
   record (`slug`, `path`, `last_commit`, `last_date`, `files_count`,
   `connections`). Do not rewrite every domain unless the file is corrupt.
5. If `_INDEX.md` exists, update that slug's row (append if new).
6. Report:

```
Domains affected: <n>
Created: <slugs or —>
Updated: <slugs>
last_commit: <sha>
```

## Template (new domain only)

```markdown
---
domain: <slug>
tags: []
owner: shared
last_commit: <sha>
last_date: YYYY-MM-DD
files_count: <n>
connections: []
status: active
---

# <Title> domain

> **TL;DR** (≤ 3 lines). What lives here. Use the parent's "what shipped" line.

## Files

| Path | Role |
|---|---|
| `path` | one clause |

## Connections

| Direction | Domain | What flows |
|---|---|---|

## Recent Commits

| Hash | Date | Subject |
|---|---|---|
| `<sha>` | YYYY-MM-DD | <subject> |

## Attention Points

## Problems & Solutions

## See Also
```

## Do not

- Git commit.
- Restamp after a follow-up `docs:` commit. `last_commit` may stay on the code SHA.
- Invent domain prose. Use the parent "what shipped" line.
- Read `.claude/agents/documenter.md` unless this file is missing a rule you need.
