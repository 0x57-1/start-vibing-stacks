# Docs Tracker — Automatic Documentation System

**ALWAYS invoke AFTER implementation completes.**

## Execution Flow

```
1. DETECT CHANGES → git diff --name-status
        ↓
2. CLASSIFY → A=Added, M=Modified, D=Deleted
        ↓
3. CHECK EXISTING DOCS → codebase-knowledge/domains/
        ↓
4. CREATE/UPDATE/REMOVE as needed
        ↓
5. UPDATE CLAUDE.md "Last Change" section
```

## What to Document

| Change Type | Action |
|---|---|
| New file | Create domain entry if new domain |
| Modified file | Update domain "Last Update" + "Recent Commits" |
| Deleted file | Remove from domain "Files" table |
| New connection | Add to "Connections" in BOTH domains |
| Bug fix | Add to "Problems & Solutions" |

## Detection Commands

```bash
# What changed?
git diff --name-status HEAD~1

# What's staged?
git diff --name-only --cached

# What's unstaged?
git diff --name-only

# What's untracked?
git ls-files --others --exclude-standard
```

## Rules

1. **RUN AFTER EVERY IMPLEMENTATION** — no exceptions
2. **DETECT VIA GIT** — don't guess, use git diff
3. **UPDATE DOMAINS** — not just CLAUDE.md
4. **BIDIRECTIONAL** — if A↔B connection, update both
5. **INCLUDE COMMIT HASH** — traceability
