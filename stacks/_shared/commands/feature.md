---
name: feature
description: Start a new feature with the full workflow (research → plan → implement → hygiene → test → security → quality → commit → CI verify → docs).
version: 1.3.0
---

# /feature — Start New Feature

Always read `.claude/config/active-project.json` first to know the active stack.

Execute in order — do not skip steps. Steps 6–7 have **VETO power** over commit.

| # | Step | Agent / Skill |
|---|---|---|
| 1 | **Research** (only for new tech / patterns) | `research-web` |
| 2 | **Plan** — break into tasks, create TODO list | (you, in plan mode) |
| 3 | **Implement** — follow stack patterns + strict types | (you) |
| 4 | **Dead-code hygiene** — delete unused legacy/inert paths from this change (no `// LEGACY` stubs) | `dead-code-hygiene` |
| 5 | **Test** — unit + e2e | `tester` |
| 6 | **Security** — adversarial audit | `security-auditor` (VETO) |
| 7 | **Quality** — typecheck → lint → test → build | `quality-gate` |
| 8 | **Commit + push** — gate-aware, diff-driven message | `commit-manager` |
| 9 | **Verify GitHub Actions** — `gh run list/watch` for the pushed SHA; report deploy/release if present | `commit-manager` Step 5.5 · `git-workflow` · memory `post-push-ci-verification` |
| 10 | **Map** — files + commits → domains | `documenter` |
| 11 | **Wisdom + Recent Changes** — record learnings, PREPEND new `### YYYY-MM-DD · branch · vX.Y.Z` entry to `CLAUDE.md` `## Recent Changes` (append-only LIFO, cap 10) | `domain-updater` |

If `security-auditor` returns CRITICAL/HIGH/MEDIUM, fix before re-running step 6. Steps 10–11 run AFTER push (and CI check) and never before.

**Multi-instance note:** `commit-manager` v3.2.0+ stages only THIS session's files via `scope.ts` when `.claude/state/` is present — peers' uncommitted files are never bundled into your commit. For a manual / interactive equivalent of Step 8, use `/commit-mine` (then still run Step 9 if you pushed).
