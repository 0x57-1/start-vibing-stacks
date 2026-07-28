---
name: decision-records
version: 1.0.0
description: >
  Architecture Decision Records (ADRs) for durable "why we chose X". Use before
  architectural work, after rejecting an alternative, or when domain Problems &
  Solutions would lose the rationale. Grep docs/decisions/ — not embeddings.
  Complements codebase-knowledge (topology) and CLAUDE.md (rules in force).
---

# Decision records (ADRs)

## Ownership

| Layer | Answers |
|-------|---------|
| `CLAUDE.md` | Rules in force **now** |
| `codebase-knowledge/domains/` | Where code lives / connections |
| `docs/decisions/` | **Why** we chose X; what we rejected |
| `.claude/brain/` | In-flight task (hours–days) |

Never restate a CLAUDE.md rule inside an ADR. If a decision produces a rule, put the rule in CLAUDE.md and link the ADR.

## Layout

```
docs/decisions/
  _index.md
  NNNN-<slug>.md
```

Copy `stacks/_shared/skills/decision-records/TEMPLATE.md` (or project copy under the skill) when creating a new ADR. IDs are zero-padded decimals; never reuse.

## When to write

- An invariant or stack choice changed
- An alternative was explicitly rejected
- Cross-session agents keep re-litigating the same choice

## When to read

After `_index.json` domain filter, before large refactors: skim `docs/decisions/_index.md` for matching `domains:`.

## Status

`proposed` | `accepted` | `superseded` — superseded rows stay on disk; filter them out of the active index table.

## See Also

- `codebase-knowledge` — domain topology
- Agent `knowledge-rag-eval` — why we do not ship Obsidian/embeddings in core
- Agent `long-session-consistency` — brain vs decisions vs state
