---
name: codebase-knowledge
version: 1.0.0
---

# Codebase Knowledge — Domain Mapping System

**ALWAYS invoke BEFORE implementing any feature.**

## Purpose

Maps files by domain, tracks connections, caches architecture decisions.

## Domain Files Location

```
.claude/skills/codebase-knowledge/domains/
├── authentication.md
├── api.md
├── database.md
├── ui-components.md
└── [domain-name].md
```

## Domain File Template

```markdown
# {Domain Name}

## Last Update
- **Date:** YYYY-MM-DD
- **Commit:** abc123
- **Summary:** What changed

## Files
| File | Purpose |
|------|---------|
| `path/file.ext` | Description |

## Connections
| Domain | How They Connect |
|--------|-----------------|
| auth | Validates tokens before API calls |

## Recent Commits
| Hash | Date | Description |
|------|------|-------------|
| abc123 | YYYY-MM-DD | feat: description |

## Attention Points
- Important gotcha or consideration

## Problems & Solutions
### Problem Title
**Problem:** What went wrong
**Solution:** How it was fixed
**Prevention:** How to avoid in future
```

## Workflow

1. **Before coding** → Read relevant domain files
2. **During coding** → Note connections and gotchas
3. **After coding** → documenter + domain-updater agents update these files

## Rules

1. **CHECK BEFORE IMPLEMENTING** — always read affected domains first
2. **BIDIRECTIONAL CONNECTIONS** — if A connects to B, update both
3. **INCLUDE COMMIT HASHES** — traceability
4. **RECORD PROBLEMS** — future sessions benefit from lessons learned
