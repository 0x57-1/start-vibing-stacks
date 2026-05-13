---
name: feature
description: Start a new feature with the full workflow (research → plan → implement → test → security → quality → commit → docs).
version: 1.0.0
---

# /feature — Start New Feature

Always read `.claude/config/active-project.json` first to know the active stack.

Execute in order — do not skip steps. Steps 5–6 have **VETO power** over commit.

| # | Step | Agent / Skill |
|---|---|---|
| 1 | **Research** (only for new tech / patterns) | `research-web` |
| 2 | **Plan** — break into tasks, create TODO list | (you, in plan mode) |
| 3 | **Implement** — follow stack patterns + strict types | (you) |
| 4 | **Test** — unit + e2e | `tester` |
| 5 | **Security** — adversarial audit | `security-auditor` (VETO) |
| 6 | **Quality** — typecheck → lint → test → build | `quality-gate` |
| 7 | **Commit** — gate-aware, diff-driven message | `commit-manager` |
| 8 | **Map** — files + commits → domains | `documenter` |
| 9 | **Wisdom + Last Change** — record learnings, refresh `CLAUDE.md` | `domain-updater` |

If `security-auditor` returns CRITICAL/HIGH/MEDIUM, fix before re-running step 5. Steps 8–9 run AFTER push and never before.
