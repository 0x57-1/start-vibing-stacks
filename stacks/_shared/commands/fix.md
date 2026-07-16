---
name: fix
description: Fix a bug — reproduce, isolate, minimal fix, fix-induced dead-code hygiene, regression test, security check, commit, record wisdom.
version: 1.2.0
---

# /fix — Fix Bug

Always read `.claude/config/active-project.json` first.

| # | Step | Agent / Skill |
|---|---|---|
| 1 | **Reproduce** — read the error, reproduce locally, isolate the root cause (NOT the symptom) | (you) |
| 2 | **Failing test first** — write a regression test that proves the bug | `tester` |
| 3 | **Apply minimal fix** — do not refactor adjacent code in the same commit | (you) |
| 4 | **Dead-code hygiene (scoped)** — delete only code made unreachable by *this* fix (old branch, shim, duplicate). Broad cleanup → separate `refactor:` commit | `dead-code-hygiene` |
| 5 | **Verify** — re-run the regression test + the wider suite | `tester` |
| 6 | **Security** — only if the bug touched auth / input / secrets / SSRF surface | `security-auditor` (VETO) |
| 7 | **Quality gate** — typecheck → lint → test → build | `quality-gate` |
| 8 | **Commit** — `fix(scope): <subject>`, diff-driven body, per-instance scoped staging | `commit-manager` v3.0.0 |
| 9 | **Map** — files + commit → domain | `documenter` v3.0.0 |
| 10 | **Wisdom + Recent Changes entry** — append to domain `## Problems & Solutions` (symptom + root cause + fix + prevention + skill ref) AND PREPEND `### YYYY-MM-DD · branch · fix-tag` to `CLAUDE.md` `## Recent Changes` | `domain-updater` v3.0.0 |

`domain-updater` deduplicates by symptom/root-cause. If the same bug recurred, it appends a "Recurrence" note instead of a duplicate entry.

**Multi-instance note:** Step 8 stages only THIS session's files via `scope.ts` when `.claude/state/` is present (peers' uncommitted files are never bundled). For a manual / interactive Step 8 (no chain auto-trigger), use `/commit-mine` instead.
