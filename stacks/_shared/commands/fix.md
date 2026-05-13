---
name: fix
description: Fix a bug — reproduce, isolate, minimal fix, regression test, security check, commit, record wisdom.
version: 1.0.0
---

# /fix — Fix Bug

Always read `.claude/config/active-project.json` first.

| # | Step | Agent / Skill |
|---|---|---|
| 1 | **Reproduce** — read the error, reproduce locally, isolate the root cause (NOT the symptom) | (you) |
| 2 | **Failing test first** — write a regression test that proves the bug | `tester` |
| 3 | **Apply minimal fix** — do not refactor adjacent code in the same commit | (you) |
| 4 | **Verify** — re-run the regression test + the wider suite | `tester` |
| 5 | **Security** — only if the bug touched auth / input / secrets / SSRF surface | `security-auditor` (VETO) |
| 6 | **Quality gate** — typecheck → lint → test → build | `quality-gate` |
| 7 | **Commit** — `fix(scope): <subject>`, diff-driven body | `commit-manager` |
| 8 | **Map** — files + commit → domain | `documenter` |
| 9 | **Wisdom** — append to domain `## Problems & Solutions` (symptom + root cause + fix + prevention + skill ref) | `domain-updater` |

`domain-updater` deduplicates by symptom/root-cause. If the same bug recurred, it appends a "Recurrence" note instead of a duplicate entry.
