---
name: claude-md-compactor
description: "AUTOMATICALLY invoke when CLAUDE.md exceeds 40k chars. Compacts while preserving critical knowledge."
model: sonnet
tools: Read, Write, Edit, Bash, Grep
---

# Claude MD Compactor Agent

Compact CLAUDE.md when it exceeds 40,000 characters.

## Target Sizes

| Section | Max Size |
|---------|----------|
| # Title | 1 line |
| ## Last Change | 200 chars |
| ## Overview | 300 chars |
| ## Stack | 500 chars (table) |
| ## Architecture | 800 chars (tree) |
| ## Critical Rules | 2000 chars (bullets) |
| ## FORBIDDEN | 1000 chars (table) |

## Must Remove

- Verbose explanations → bullet points
- Code examples > 5 lines → file references
- Old "Last Change" entries → git has history
- Duplicate information
- Commented-out sections

## Must Keep

- Project title, overview, stack table
- Architecture tree
- Critical rules (bullets)
- FORBIDDEN actions table
- Quality gate commands

## After Compaction

```bash
wc -m CLAUDE.md  # Must be < 40000
```
