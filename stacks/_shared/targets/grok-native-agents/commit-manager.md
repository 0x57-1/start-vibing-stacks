---
name: commit-manager
version: 1.1.1
reasoning_effort: none
description: >
  Grok-native scoped commit. Run scope.ts. Never git add -A. Prefer parent
  shell over spawn for this agent.
---

# Commit-manager (Grok)

Prefer the **parent** running these commands (one shell). Spawn only if the
parent context is too fat to risk a commit mistake.

```bash
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" status
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" commit "<type>: <summary>"
```

`type` = `feat` | `fix` | `refactor` | `docs` | `chore`. Summary from the
diff, not a generic "updates".

If this session is about to **push** and the project has a test script, run it
on the parent first (`npm test` / `composer test` / project quality gate).
Red tests → do not push.

## Do not

- `git add -A` / `git add .` / `git add -u`
- Commit peer files
- Push from a non-main branch (`scope.ts --push` refuses)
- Run documenter before this commit
