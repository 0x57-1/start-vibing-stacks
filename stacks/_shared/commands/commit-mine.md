---
name: commit-mine
description: Commit ONLY this Claude session's edited files (multi-instance safe). Replaces raw `git add . && git commit` to prevent your commit from bundling a peer session's uncommitted changes. After --push, verify GitHub Actions for the SHA.
version: 1.2.0
---

# /commit-mine — Per-Instance Commit

**Why this exists:** when two or more Claude sessions run in the same repo, `git add .` /
`git add -A` / `git add -u` pick up files modified by peer sessions and bundle them into
your commit. The peer then loses attribution and the commit becomes impossible to revert
cleanly. This command stages and commits ONLY the files your session actually edited.

**Source of truth:** `.claude/state/sessions/<your-id>.json#filesTouched`, maintained by
`post-tool-use.ts` (one entry per successful Edit / Write / MultiEdit / NotebookEdit).

**Recommended (single atomic command):**

```bash
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" commit "<message>" [--push]
```

This commits ONLY your session's files via `git commit -o -- <files>` — it commits
exactly your paths regardless of what a peer has staged, so it can never bundle their
work, and it never runs a global `git reset`. It REFUSES if a peer touched any of your
files in the last 5 min unless you pass `--include-conflicted`.

**Step-by-step (when you want to review first):**

| # | Step | Tool |
|---|---|---|
| 1 | **Inspect scope** — list SAFE / CONFLICTED / NOT-YOURS / STAGED | `npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" status` |
| 2 | **Resolve conflicts** if any (peer touched same file in last 5 min) | `npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/peers.ts" notify <id> "msg"` |
| 3 | **Review** the diff of your files | `npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" diff` |
| 4 | **Commit** — atomic, only your files | `npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" commit "<message>"` |
| 5 | **Push** (optional) | add `--push` to step 4, or `git push` |
| 6 | **Verify GitHub Actions** (required if you pushed) | `gh run list --commit $(git rev-parse HEAD)` then `gh run watch` — see `git-workflow` § Post-push CI |

> `scope stage` still exists for manual index inspection, but it is best-effort in a
> shared worktree (a peer's staged files can linger). Prefer `scope commit` — it is the
> only path that is atomic against a concurrent peer.

> After `--push`, do **not** stop at “pushed”. Confirm Actions (and deploy/release jobs if any) before claiming success. Memory: `post-push-ci-verification.md`.

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
- The `commit-manager` agent (if used) MUST commit via `scope commit` (never `git add -A`)
  in a multi-instance project.
- See `CLAUDE.md` NRY: "Instance N's commit bundling instance M's uncommitted files".
