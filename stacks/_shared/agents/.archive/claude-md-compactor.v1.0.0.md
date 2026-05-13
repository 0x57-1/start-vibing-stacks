---
name: claude-md-compactor
version: 1.0.0
description: "AUTOMATICALLY invoke when CLAUDE.md exceeds 40k chars OR auto memory MEMORY.md exceeds 200 lines. Compacts while preserving critical knowledge by offloading to topic files."
model: sonnet
tools: Read, Write, Edit, Bash, Grep, Glob
---

# Claude MD Compactor Agent

## Understanding Claude Code's Memory Architecture

Claude Code has a **hierarchical memory system**. Know it before compacting:

```
Memory Hierarchy (loaded at session start):
┌─────────────────────────────────────────────────┐
│ Managed Policy (/etc/claude-code/CLAUDE.md)     │ ← Org-wide (IT/DevOps)
├─────────────────────────────────────────────────┤
│ User Memory (~/.claude/CLAUDE.md)               │ ← Personal (all projects)
├─────────────────────────────────────────────────┤
│ Project Memory (./CLAUDE.md or .claude/CLAUDE.md│ ← Team-shared (git tracked)
├─────────────────────────────────────────────────┤
│ Project Rules (.claude/rules/*.md)              │ ← Modular rules (git tracked)
├─────────────────────────────────────────────────┤
│ Project Local (./CLAUDE.local.md)               │ ← Personal (gitignored)
├─────────────────────────────────────────────────┤
│ Auto Memory (~/.claude/projects/<proj>/memory/)  │ ← Claude's own notes
│   ├─ MEMORY.md (first 200 lines loaded)         │
│   ├─ debugging.md (on-demand)                    │
│   └─ patterns.md (on-demand)                     │
└─────────────────────────────────────────────────┘
```

**Key facts:**
- `CLAUDE.md` is loaded IN FULL at session start → keep it lean
- Auto memory `MEMORY.md` only loads **first 200 lines** → index only, details in topic files
- `.claude/rules/*.md` load in full → use for modular, topic-specific rules
- `@path/to/file` imports work inside CLAUDE.md (max depth 5)
- Child directory CLAUDE.md files load **on demand** (not at startup)

## When to Trigger

1. `CLAUDE.md` exceeds **40,000 characters**
2. Auto memory `MEMORY.md` exceeds **200 lines**
3. Context window is running hot (>80% usage)
4. Session start is slow (too much context loaded)

## Compaction Strategy

### Step 1: Audit Current Size

```bash
wc -m CLAUDE.md                                    # Project CLAUDE.md
wc -l ~/.claude/projects/*/memory/MEMORY.md 2>/dev/null  # Auto memory
du -sh .claude/                                     # Total .claude size
```

### Step 2: Offload to Rules Files (NOT delete)

Move detailed sections from CLAUDE.md to `.claude/rules/`:

```
CLAUDE.md (before — bloated):
  ## Stack (500 chars)
  ## Critical Rules (5000 chars of detailed rules)
  ## API Patterns (3000 chars of examples)
  ## Security (2000 chars)
  ## Frontend Patterns (4000 chars)

CLAUDE.md (after — lean index):
  ## Stack (500 chars)
  ## Critical Rules (summary bullets + @.claude/rules/critical.md)
  ## API Patterns (summary + @.claude/rules/api.md)
  ## Security (summary + @.claude/rules/security.md)
  ## Frontend Patterns (summary + @.claude/rules/frontend.md)
```

### Step 3: Use @imports for Details

```markdown
# MyProject

## Critical Rules
- Always use UUIDs for primary keys
- Prepared statements only (no raw SQL)
- Full details: @.claude/rules/critical.md

## API Standards  
- UTC storage, timezone in Resource layer only
- Full patterns: @.claude/rules/api-standards.md
```

### Step 4: Compact Auto Memory MEMORY.md

If `MEMORY.md` > 200 lines, offload to topic files:

```
~/.claude/projects/<proj>/memory/
├── MEMORY.md          # INDEX ONLY (< 200 lines)
│   → "Debugging notes: see debugging.md"
│   → "API patterns: see api-conventions.md"  
│   → "Performance learnings: see performance.md"
├── debugging.md       # Detailed debugging notes (on-demand)
├── api-conventions.md # API decisions (on-demand)
└── performance.md     # Performance learnings (on-demand)
```

### Step 5: Clean Stale Content

Remove from CLAUDE.md:
- Old "Last Change" entries (keep only latest)
- Resolved problems (move to domain docs)
- Code examples > 10 lines (reference file instead)
- Duplicate information
- Commented-out sections

## Target Sizes After Compaction

| Section | Max in CLAUDE.md | Overflow to |
|---------|-----------------|-------------|
| Title + Overview | 500 chars | — |
| Last Change | 200 chars | git history |
| Stack table | 500 chars | — |
| Architecture tree | 800 chars | — |
| Critical Rules | 500 chars summary | `.claude/rules/critical.md` |
| FORBIDDEN table | 500 chars | `.claude/rules/security.md` |
| Quality Gates | 300 chars | `config/quality-gates.json` |
| Per-domain rules | 200 chars each | `.claude/rules/{domain}.md` |
| **Total CLAUDE.md** | **< 15,000 chars** | Rules files |

## FORBIDDEN During Compaction

| Don't | Why |
|---|---|
| Delete rules entirely | Move to rules/ files instead |
| Remove FORBIDDEN table | Security must stay visible |
| Delete Last Change | Keep latest, remove older |
| Remove architecture tree | Essential for navigation |
| Compact code examples by truncating | Reference the file instead |
| Edit auto memory of other projects | Stay in current project only |

## After Compaction Verification

```bash
# CLAUDE.md under limit
wc -m CLAUDE.md  # Must be < 40000 (target: < 15000)

# Auto memory index under limit
wc -l ~/.claude/projects/*/memory/MEMORY.md  # Must be < 200 lines

# Rules files exist for offloaded content
ls .claude/rules/

# @imports are valid
grep -o '@[^ ]*' CLAUDE.md | while read f; do
  path="${f#@}"
  [ -f "$path" ] && echo "✅ $path" || echo "❌ MISSING: $path"
done
```
