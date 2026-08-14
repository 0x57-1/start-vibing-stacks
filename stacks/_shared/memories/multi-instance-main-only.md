---
version: 1.0.0
---

# Memory: Multi-Instance Main-Only Ship

> **ALWAYS LOAD** — Multiple agent sessions in the **same project cwd share one
> git HEAD**. Session A’s `git checkout -b feature/x` moves Session B onto that
> branch too. Deploy/push from the “deploy session” then ships the **wrong
> branch**. Default policy: **work and ship on `main` (or `master`)**.

---

## Declared purpose

File locks (`scope.ts` / PreToolUse) do **not** isolate branches. Stop already
requires `main` at finalize; SAFE SHIP and `scope --push` must also refuse
non-main so a peer’s feature branch cannot steal a production deploy.

---

## Default workflow (same cwd, ≥1 session)

| Do | Don’t |
|----|--------|
| Commit on `main` with scoped `scope.ts commit` | `git checkout -b` while peers share this cwd |
| Push `origin main` → watch CI → deploy/republish (versioned ship on main) | `git push` while HEAD is a feature branch |
| Coordinate file ownership via `/svs-peers` | Assume “my session” still has its old branch |

**Deploy = artifacts from commits on `main`**, not from ephemeral feature branches.

---

## When you need a long feature branch

Use a **separate git worktree** (separate cwd → separate HEAD):

```bash
git worktree add ../proj-feature feature/x
# open the other Claude/Kimi/Grok session IN that worktree
```

Same-folder multi-instance + divergent branches = unsupported; expect Stop/ship blocks.

---

## Hard gates (SVS ≥ 2.85)

| Gate | Behavior |
|------|----------|
| `scope commit … --push` | Exit 2 unless HEAD is `main`/`master` (override: `--allow-non-main-push`) |
| UPS peers active | Injects SHARED CWD = ONE HEAD — no `checkout -b` |
| UPS off main | Injects MAIN-ONLY SHIP — no push/deploy until `git checkout main` |
| Stop | Still blocks finalize off `main` |
| SAFE SHIP | Requires main; off main = ATTENTION GATE |

---

## Recovery if a peer already created a branch

1. `git branch --show-current` — confirm HEAD.
2. If your work belongs on main: stash or commit scoped on the feature branch, then `git checkout main` and merge/cherry-pick **only your** commits if needed.
3. Never `git push` until on main (unless user explicitly wants a feature PR with `--allow-non-main-push`).
4. Notify peer via `/svs-peers` that shared HEAD moved.

---

## FORBIDDEN

| Shortcut | Why |
|----------|-----|
| “I’ll just push — Stop will fix later” | Deploy already fired on wrong branch |
| Creating `feature/*` “for safety” with peers in same cwd | Moves everyone’s HEAD |
| Trusting session JSON `gitBranch` without `git branch --show-current` | Field used to go stale (fixed: UPS refreshes live HEAD) |

---

## See also

- Skill `multi-instance-coordination` — file collision bus
- Memory `execute-ship-ops` — SAFE SHIP / ATTENTION
- `scope.ts` **1.4+** — `--push` main gate
- Stop-validator — end on main
