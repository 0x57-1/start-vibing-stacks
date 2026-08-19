---
name: domain-updater
version: 1.2.0
description: >
  AFTER documenter — PREPEND one CLAUDE.md Recent Changes entry. Record
  wisdom (Symptom / Cause / Fix) when the parent gave a gotcha. Load
  skill svs-document first. Tool-first. No HOW rewrites.
prompt_mode: full
model: inherit
permission_mode: default
agents_md: true
tools:
  - read_file
  - grep_search
  - list_dir
  - bash
  - search_replace
disallowedTools:
  - web_search
  - web_fetch
  - task
---

# Domain-updater (Grok)

You record **why** this session mattered. Documenter already mapped files.
Do **not** re-Read this file. Effort comes from `.grok/roles/domain-updater.toml` (`low`).

## 0. Load the write skill (mandatory)

`read_file` `.grok/skills/svs-document/SKILL.md` — Recent Changes + wisdom
sections. Then execute.

## 1. Confirm documenter ran

`jq -r '.last_commit' .claude/skills/codebase-knowledge/_index.json`
If missing, stop.

## 2. PREPEND Recent Changes

`read_file` the first ~80 lines of root `CLAUDE.md` **now** (peer may have written).
PREPEND one block under `## Recent Changes`:

```markdown
### YYYY-MM-DD · <branch> · <slug>
<1–3 lines. WHY, not a file list. No bullets.>
```

Cap 10 — drop only the oldest. Do not edit a peer's entry.
If `## Last Change` still exists, replace that block (do not stack).

## 3. Wisdom (only if the parent named a gotcha)

Grep the domain file first (no duplicates). Append one Problems & Solutions
entry (shape in `svs-document`). Optional: one Attention Point if new.
Live domain ≤ 8 KB / ≤ 5 P&S / ≤ 10 attention — overflow → `<slug>.archive.md`.

## 4. Return

New heading + files written.

## Do not

- Git commit (parent: `scope.ts commit "docs: …"`).
- Rewrite Campaigns HOW / architecture.
- Archive census / invent domains (documenter creates files).
- Spawn a restamp documenter.
- Read `.claude/agents/domain-updater.md` unless `svs-document` is missing a rule.
