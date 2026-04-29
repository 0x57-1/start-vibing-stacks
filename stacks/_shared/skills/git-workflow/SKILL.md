---
name: git-workflow
version: 1.0.0
---

# Git Workflow

## Branch Naming

```
feature/short-description
fix/bug-description
refactor/what-changed
chore/maintenance-task
```

## Commit Format (Conventional)

```
type(scope): description

Body explaining what and why.

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Flow

1. Create branch from main: `git checkout -b feature/name`
2. Work, commit incrementally
3. When done: merge to main, delete branch
4. Push main to remote

## Rules

- NEVER force push main
- ALWAYS conventional commits
- ALWAYS end on main branch
- ONE feature per branch
