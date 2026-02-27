# {{PROJECT_NAME}}

## Last Change

**Branch:** main
**Date:** {{DATE}}
**Summary:** Initial project setup with start-vibing-stacks

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
