---
name: commit-mine
description: Commit ONLY this Claude session's edited files (multi-instance safe). Replaces raw `git add . && git commit` to prevent your commit from bundling a peer session's uncommitted changes.
version: 1.0.0
---

# /commit-mine — Per-Instance Commit

**Why this exists:** when two or more Claude sessions run in the same repo, `git add .` /
`git add -A` / `git add -u` pick up files modified by peer sessions and bundle them into
your commit. The peer then loses attribution and the commit becomes impossible to revert
cleanly. This command stages and commits ONLY the files your session actually edited.

**Source of truth:** `.claude/state/sessions/<your-id>.json#filesTouched`, maintained by
`post-tool-use.ts` (one entry per successful Edit / Write / MultiEdit / NotebookEdit).

| # | Step | Tool |
|---|---|---|
| 1 | **Inspect scope** — list SAFE / CONFLICTED / NOT-YOURS / STAGED | `npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" status` |
| 2 | **Resolve conflicts** if any (peer touched same file in last 5 min) | `npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/peers.ts" notify <id> "msg"` |
| 3 | **Stage** — `git reset` then `git add` only this session's dirty files | `npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" stage` |
| 4 | **Review** — confirm the staged diff is what you expect | `git diff --cached --stat` and (optionally) `git diff --cached` |
| 5 | **Commit** — conventional message (`feat`, `fix`, `docs`, etc.) + diff-driven body | `git commit -m "<message>"` OR delegate to `commit-manager` agent |
| 6 | **Push** (optional) | `git push` |

## Shortcut (single command)

If steps 1–5 are routine and you already know what you edited:

```bash
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" commit "<message>" [--push]
```

This runs stage + commit (+ optional push) atomically. It will REFUSE to proceed if a
peer touched any of your files in the last 5 min unless you pass `--include-conflicted`.

## Forbidden patterns (NEVER do these in a multi-instance project)

| Command | Why forbidden |
|---|---|
| `git add .` | Pulls in every dirty file in the worktree, including a peer's |
| `git add -A` | Same — adds all tracked AND untracked |
| `git add -u` | Adds every tracked modification, including a peer's |
| `git commit -am "..."` | Implicit `-a` = `git add -u`, same problem |

If you intentionally want to commit a peer's file (e.g. you're closing their session for them
because they crashed), use `scope stage --include-conflicted` and document WHY in the commit body.

## Exit codes (when scripting around it)

| Code | Meaning |
|---|---|
| `0` | Staged / committed cleanly |
| `1` | Argument or state error (no session, no dirty files in scope, git failed) |
| `2` | Conflict refusal — peer touched a file in the last 5 min; pass `--include-conflicted` or coordinate |

## What gets staged, precisely

```
session.filesTouched   ∩   git status (dirty + untracked)   \   peer-touched-in-last-5min
```

Files in `filesTouched` that are no longer dirty (you reverted the change) are skipped.
Files dirty in the worktree but never touched by your session (a peer's edits, or your own
manual edits not via Claude tools) are skipped — they appear in `status` under NOT-YOURS.

## Where this fits in the broader workflow

- `/fix` step 7 ("Commit") and `/feature` workflows that previously implied `git add .`
  should now route through `/commit-mine` whenever `peers.ts list` shows ≥ 1 peer.
- The `commit-manager` agent (if used) MUST call `scope stage` before any `git commit`
  in a multi-instance project.
- See `CLAUDE.md` NRY: "Instance N's commit bundling instance M's uncommitted files".
