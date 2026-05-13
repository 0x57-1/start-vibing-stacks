---
name: docs-tracker
version: 2.0.0
description: "File → domain mapping rules and changelog templates consumed by `documenter` v2.0.0. Detects modified files via `git diff-tree`, classifies them via `.claude/config/domain-mapping.json`, and emits the actions documenter must apply (Edit known anchors, never Write over existing files; bidirectional connections; cap commit log at 20)."
---

# Docs Tracker — File → Domain Mapping Rules (v2.0.0)

**ALWAYS invoke AFTER `commit-manager` succeeds (so the commit hash is real).**

This skill is the **rule set** consumed by `documenter` v2.0.0. It does not write files itself — it tells documenter what to do with each changed file.

## Detection (one git call, not many)

```bash
# Files in the LAST commit (after commit-manager pushed)
git diff-tree --no-commit-id --name-status -r HEAD
```

Status codes: `A` = added, `M` = modified, `D` = deleted, `R` = renamed, `C` = copied. Treat `R` and `C` as `M` for mapping purposes plus a "renamed from" note in the destination domain.

## File → Domain mapping

Source of truth: `.claude/config/domain-mapping.json` (shipped with this CLI; project may override). A path may map to ≥1 domain. Unmatched paths → `general`.

Skip the entire pass if every changed path matches one of:

| Skip pattern | Reason |
|---|---|
| `.claude/**` | meta — does not belong to any product domain |
| `docs/**` | docs commit — no code drift |
| `.github/**` | CI — handled by `infrastructure` domain only if pattern is added |
| `CHANGELOG*`, `*.md` (root only) | release docs |
| `package.json`, `composer.json`, `pyproject.toml` (deps only — not scripts) | bumps tracked elsewhere |

## Action matrix (applied by `documenter`)

| Git status | Domain file state | Action |
|---|---|---|
| `A` | exists | `Edit`: append row to `## Files`, prepend row to `## Recent Commits`, increment `files_count` in frontmatter |
| `A` | missing | `Write`: create from `TEMPLATE.md`, fill TL;DR, add the file row, add the commit row |
| `M` | exists | `Edit`: prepend row to `## Recent Commits`; if file's role description changed, update its row in `## Files` |
| `M` | missing | unusual — investigate; usually means mapping rule was added but file existed before. Treat as `A` |
| `D` | exists | `Edit`: strike-through (`~~path~~`) row in `## Files`, decrement `files_count`. Prune at the next pass |
| `R src→dst` | exists | `Edit`: replace `src` row with `dst` row, add note `(renamed from src in <short-sha>)` to Attention Points |

## Bidirectional connections (mandatory)

When a session adds `auth → api` to `auth.md`, **also** add `api ← auth` to `api.md`. The two edits must succeed atomically — if the second fails, roll back the first. The `security-auditor` flags dangling links as a MEDIUM finding.

## Cap and archive (size guard)

After any edit, check the live file:

```bash
[ "$(wc -c < domains/<slug>.md)" -gt 8192 ] && trigger_archive
```

When triggered, move the **oldest 5 rows** of `## Recent Commits` (and oldest 2 Problems & Solutions, oldest 3 Attention Points) into `<slug>.archive.md`. Live file must stay ≤ 8 KB.

## Index regeneration (after every pass)

```bash
# Regenerate _index.json from frontmatter of every domain file
for f in .claude/skills/codebase-knowledge/domains/*.md; do
  # parse YAML frontmatter, compute summary_sha = sha256(TL;DR block), emit one record
done | jq -s '{schema_version:1, generated_at:(now|todate), domain_count:length, domains:.}' \
     > .claude/skills/codebase-knowledge/_index.json

# Then derive _INDEX.md from _index.json
```

`_index.json` is the source of truth — `_INDEX.md` is human-readable derivative.

## Pre-commit hook (CI integration)

A repository can add this check to fail builds when documenter forgot to run:

```bash
HEAD_SHA=$(git rev-parse --short HEAD)
LAST_INDEXED=$(jq -r '.domains | map(.last_commit) | unique[]' \
  .claude/skills/codebase-knowledge/_index.json)
echo "$LAST_INDEXED" | grep -qx "$HEAD_SHA" || {
  echo "ERROR: _index.json is stale. Run documenter before pushing."
  exit 1
}
```

## Rules

1. **AFTER `commit-manager`** — never before; the hash must be real.
2. **DETECT VIA GIT** — `git diff-tree -r HEAD`, never guess from session memory.
3. **EDIT KNOWN ANCHORS** — `documenter` uses `Edit` / `StrReplace` on existing domain files; never `Write` over them.
4. **BIDIRECTIONAL** — both ends of every connection updated atomically.
5. **CAP AT 8 KB / 20 commits / 10 attention / 5 P&S** — archive overflow into `<slug>.archive.md`.
6. **REGENERATE `_index.json` EVERY PASS** — derived; never hand-edited.
7. **SKIP META PATHS** — `.claude/**`, `docs/**`, `.github/**` do not get domain entries.

## See Also

- `documenter` v2.0.0 — applies the actions defined here
- `codebase-knowledge` v2.0.0 — reads what documenter wrote
- `domain-updater` v2.0.0 — appends session wisdom AFTER documenter
- `.claude/config/domain-mapping.json` — pattern → domain rules
