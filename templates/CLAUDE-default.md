# {{PROJECT_NAME}}

## Recent Changes

<!-- APPEND-ONLY LIFO. Each Claude instance PREPENDS a new `### YYYY-MM-DD · branch · vX.Y.Z` heading
     + 1-4 lines below it. Drop only the OLDEST entry when count > 10. NEVER edit a peer's entry.
     `domain-updater` v3.0.0+ does this automatically post-commit.
     Compactor (`claude-md-compactor.md §5-§6`) enforces the cap, not the prepend. -->

### {{DATE}} · main · v0.1.0
Initial project setup with start-vibing-stacks.

## 30 Seconds Overview

{{PROJECT_NAME}} is a {{STACK}} project using {{FRAMEWORK}} framework.

## Stack

| Component | Technology |
|-----------|------------|
| Stack | {{STACK}} |
| Framework | {{FRAMEWORK}} |
| Database | {{DATABASE}} |

## Architecture

```
project/
├── src/           # Source code
├── tests/         # Tests
├── public/        # Public assets
├── .claude/       # AI agent configuration
│   ├── agents/    # Specialized agents
│   ├── skills/    # Knowledge base
│   ├── hooks/     # Validation hooks
│   └── config/    # Project configuration
└── CLAUDE.md      # This file
```

## Critical Rules

- Follow stack-specific patterns in `.claude/skills/`
- Run quality gates before every commit
- Document all changes in domain files
- Use conventional commits

## FORBIDDEN

| Action | Reason |
|--------|--------|
| Skip tests | Quality gate will block |
| Direct commits to main | Use feature branches |
| Ignore type errors | PHPStan/TypeScript must pass |
| Hardcode secrets | Use environment variables |

## Quality Gates

Read `.claude/config/active-project.json` for stack-specific commands.
