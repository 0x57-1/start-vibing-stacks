---
version: 1.0.0
---

# Memory: Quality Gate Before Push (Test Veto)

> **ALWAYS LOAD** — Do not `git push` (or claim ready to ship) when the session’s
> stack tests last failed. Red PHPUnit / Vitest / pytest is a **hard veto**.

---

## Declared purpose

Agents commit and push with failing tests, then burn turns on CI/CDN while the
user pastes red output. This memory makes “tests red → no push” always-on.

---

## Protocol (before push)

1. Identify the project’s test command from `.claude/config/quality-gates.json`
   or stack defaults (`vendor/bin/phpunit`, `bun run test`, `pytest`, …).
2. If this session edited source under test paths (or any source when unsure),
   **run the test command** (or the focused suite covering the change).
3. **VETO push** if the run exits non-zero or prints `FAILURES!` / failed asserts.
4. Fix → re-run → only then push (commit-manager Step 3.5 / 5).

Skip re-run only when: docs-only commit, or user explicitly said skip tests.

---

## FORBIDDEN

| Shortcut | Why |
|----------|-----|
| “CI will catch it” | Local red usually means remote red + wasted deploy |
| Pushing with known failing test from the user’s paste | User already showed the failure |
| Claiming “tests pass” without a run this session after source edits | Lying |

---

## See also

- Agent `commit-manager` v3.4.0+ Step 3.5
- Skill `quality-gate`
- Memory `post-push-ci-verification` (remote CI after a green local push)
