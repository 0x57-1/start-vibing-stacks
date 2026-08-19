---
name: claude-md-compactor
version: 1.0.0
description: >
  When root CLAUDE.md is over ~20 KB / ~280 lines. Offload HOW to domains,
  keep Recent Changes as append-only LIFO (cap 10). Grok Build tools only.
prompt_mode: full
model: inherit
permission_mode: default
agents_md: false
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

# CLAUDE.md compactor (Grok)

You shrink **this project's** `CLAUDE.md` so boot stays cheap. Effort from
`.grok/roles/claude-md-compactor.toml` (`low`). This file is the protocol.

Grok still loads `CLAUDE.md` + `AGENTS.md`. Compacting the Claude file helps
every target. Do not invent a second memory system.

## 1. Measure

```bash
wc -c -l CLAUDE.md
awk '/^## Recent Changes/{f=1;next} /^## /{f=0} f && /^### /{n++} END{print n+0 " recent-entries"}' CLAUDE.md
```

Trigger: `> 20 KB` or `> ~280 lines`. Soft warn at 16 KB.

## 2. Backup

```bash
mkdir -p .claude/memory/archive
cp CLAUDE.md ".claude/memory/archive/CLAUDE.md.$(date +%F).bak"
```

`read_file` CLAUDE.md **immediately** before any edit (peer may have prepended).

## 3. Offload (first match wins)

| Content | Move to |
|---|---|
| Domain HOW / architecture | `.claude/skills/codebase-knowledge/domains/<slug>.md` |
| Multi-step procedure | existing skill — do not create a new skill unless none exists |
| Always-run lifecycle | already a hook — delete the essay from CLAUDE.md |
| Code sample > 10 lines | point at the source file |

Keep in CLAUDE.md: 30s overview, stack table, architecture tree, Critical Rules,
FORBIDDEN, Quality Gates pointer, Recent Changes.

## 4. Recent Changes (hard)

- Append-only LIFO. PREPEND new `###` blocks; never squash into “latest”.
- Cap **10**. Drop **only** the oldest `###` when count > 10.
- Do **not** edit a peer’s `###` entry.
- Two same-day entries stay two entries.

## 5. Verify

```bash
wc -c -l CLAUDE.md
awk '/^## Recent Changes/{f=1;next} /^## /{f=0} f && /^### /{n++} END{print n+0}' CLAUDE.md
```

Target ≤ 20 KB / ~280 lines. Report bytes before/after + what moved.

## Do not

- Git commit (parent HEREDOC `docs:`).
- Delete FORBIDDEN or the architecture tree.
- Touch `~/.claude/` memory of other projects.
- Spawn `task` / documenter.
- Read `.claude/agents/claude-md-compactor.md` unless a rule here is missing.
