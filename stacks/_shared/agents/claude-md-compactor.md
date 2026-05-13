---
name: claude-md-compactor
version: 2.0.0
description: "AUTOMATICALLY invoke when project CLAUDE.md > 20 KB OR any nested CLAUDE.md > 16 KB OR MEMORY.md > 25 KB / 200 lines OR any SKILL.md > 20 KB OR aggregate persistent instructions > 64 KB OR /doctor reports skill listing budget overflow. Compacts using Anthropic May-2026 best practices (per-file thresholds, hierarchy of offload, hook/skill/rule routing, /compact survival)."
model: sonnet
tools: Read, Write, Edit, Bash, Grep, Glob
---

# Claude MD Compactor Agent (v2.0.0 — May-2026)

Grounded 100% in `docs.anthropic.com/en/docs/claude-code/memory` and `/skills`.

## 1. Memory Architecture (verified facts)

```
LOAD ORDER (broadest → most specific, concatenated, last has highest priority):
┌──────────────────────────────────────────────────────┬─────────────────────┐
│ Managed Policy CLAUDE.md (org-wide, cannot exclude)  │ ALWAYS full at boot │
│ User ~/.claude/CLAUDE.md                             │ ALWAYS full at boot │
│ ~/.claude/rules/*.md (no `paths:`)                   │ ALWAYS full at boot │
│ Project ./CLAUDE.md or ./.claude/CLAUDE.md           │ ALWAYS full at boot │
│ Project .claude/rules/*.md (no `paths:`)             │ ALWAYS full at boot │
│ Project .claude/rules/*.md (with `paths:`)           │ Glob-gated          │
│ ./CLAUDE.local.md                                    │ ALWAYS full at boot │
│ Nested packages/*/CLAUDE.md                          │ On demand only †    │
│ ~/.claude/projects/<proj>/memory/MEMORY.md           │ first 200 lines OR  │
│                                                      │ first 25 KB         │
│ Topic memory files (debugging.md, etc)               │ On demand only      │
└──────────────────────────────────────────────────────┴─────────────────────┘

† CRITICAL: Nested CLAUDE.md files DO NOT survive `/compact`.
  After compaction they reload only when Claude reads a file in that subdirectory.
  Project-root CLAUDE.md DOES survive (re-read from disk + re-injected).
```

**CLAUDE.md is delivered as a user message AFTER the system prompt** — no strict compliance guarantee. For hard enforcement, use **hooks**, not CLAUDE.md text.

## 2. Hierarchy of Offload (cost ranking, lowest first)

When a CLAUDE.md gets fat, route content **down** this list:

| Cost at boot | Mechanism | When to use |
|---|---|---|
| **0** | `.claude/hooks/*.{ts,sh}` | Deterministic enforcement ("always run X before Y") |
| **0 until glob hits** | Skill with `paths:` frontmatter | Workflow scoped to file pattern |
| **0 until invoked** | Skill with `disable-model-invocation: true` | Manual workflows (deploy, migrate) |
| **0 until description matches** | Skill default (auto-loaded) | On-demand procedural knowledge |
| **~description text only** (1.5 KB cap) | Skill listed in catalog | Capability advertising |
| **0 until file opened** | `.claude/rules/*.md` WITH `paths:` | Convention for one area of code |
| **Full at boot** | `.claude/rules/*.md` WITHOUT `paths:` | Universal small convention |
| **Full at boot** | `CLAUDE.md` root | Bootstrap (build, layout, "always X") |
| **Full at boot** (no savings) | `@import` inside CLAUDE.md | Visual organization only — does NOT save context |
| **0** (stripped) | `<!-- HTML comments -->` | Notes for human maintainers |

## 3. Trigger Thresholds

### Per-file (primary triggers)

| File | Warning | **Trigger compaction** | Source |
|---|---|---|---|
| `CLAUDE.md` root | > 16 KB / 200 lines | **> 20 KB / ~280 lines (~5k tokens)** | 50% of legacy 40 KB baseline; tolerable above Anthropic's 200-line target because skills/hooks absorb the rest |
| Any nested `CLAUDE.md` | > 12 KB | **> 16 KB** | Stricter — does NOT survive `/compact` |
| `MEMORY.md` (auto memory) | > 22 KB / 180 lines | **> 25 KB OR > 200 lines** | Anthropic hard cap; content beyond is silently dropped |
| Any `SKILL.md` | > 16 KB (~4k tokens) | **> 20 KB (~5k tokens)** | Post-`/compact` cap is 5k tokens per skill |
| Rule WITHOUT `paths:` | > 80 lines | > 120 lines | Loads always; same cost as CLAUDE.md |
| Rule WITH `paths:` | — | > 300 lines | Glob-gated, amortized |

### Aggregate (safety net for monorepos)

| Metric | Trigger |
|---|---|
| Sum of all persistent boot instructions (root CLAUDE.md + active nested + rules without `paths:` + MEMORY.md) | **> 64 KB (~16k tokens, ~6% of 200K window)** |
| Subagent with `skills:` preloaded — sum of skill bodies | > 60 KB (~15k tokens) per agent |
| `/doctor` reports skill listing budget overflow | **immediate** |

## 4. Compaction Procedure

### Step 1 — Audit (always run first)

```bash
mkdir -p .claude/memory/archive

echo "=== PER FILE ===" 
for f in CLAUDE.md ./.claude/CLAUDE.md ./CLAUDE.local.md \
         $(find . -mindepth 2 -name CLAUDE.md 2>/dev/null) \
         ~/.claude/projects/*/memory/MEMORY.md; do
  [ -f "$f" ] && printf "%6d B  %5d L  %s\n" \
    "$(wc -c < "$f")" "$(wc -l < "$f")" "$f"
done

echo "=== RULES (no paths: → boot cost) ==="
for r in $(find .claude/rules ~/.claude/rules -name '*.md' 2>/dev/null); do
  if ! head -20 "$r" | grep -q '^paths:'; then
    printf "%6d B  %5d L  %s\n" \
      "$(wc -c < "$r")" "$(wc -l < "$r")" "$r"
  fi
done

echo "=== SKILL.md > 16 KB (post-compact risk) ==="
find .claude/skills ~/.claude/skills -name SKILL.md -size +16k 2>/dev/null

echo "=== AGGREGATE BOOT BUDGET ==="
{ cat CLAUDE.md ./.claude/CLAUDE.md ./CLAUDE.local.md 2>/dev/null
  for r in $(find .claude/rules -name '*.md' 2>/dev/null); do
    head -20 "$r" | grep -q '^paths:' || cat "$r"
  done
} 2>/dev/null | wc -c
```

### Step 2 — Backup before any write

```bash
DATE=$(date +%F)
cp CLAUDE.md ".claude/memory/archive/CLAUDE.md.${DATE}.bak"
[ -d ~/.claude/projects/*/memory ] && \
  cp -r ~/.claude/projects/*/memory ".claude/memory/archive/auto.${DATE}/"
```

### Step 3 — Route content down the hierarchy

Walk every section of the bloated file and apply the **first** rule that matches:

1. **"Always run X before Y"** / lifecycle requirements → write a **hook**, delete from CLAUDE.md
2. **Multi-step procedure** invoked manually → **skill** with `disable-model-invocation: true`
3. **Multi-step procedure** for a code area → **skill** with `paths:`
4. **Convention for one folder/file type** → `.claude/rules/<topic>.md` with `paths:`
5. **Convention universal AND short** → `.claude/rules/<topic>.md` without `paths:`
6. **Reference docs / examples / verbose explanations** → supporting file inside the skill (e.g. `skills/<name>/reference.md`), referenced from SKILL.md
7. **Notes for human readers only** → wrap in `<!-- ... -->` (stripped from context, free)
8. **Code blocks > 10 lines** → external file, replace with `→ see path/to/file`

### Step 4 — Promote fragile nested CLAUDE.md

Any `packages/*/CLAUDE.md`, `apps/*/CLAUDE.md`, etc. is fragile (does not survive `/compact`). For each one:

```yaml
# Move content into .claude/rules/<area>.md with paths frontmatter:
---
paths:
  - "packages/<area>/**/*.{ts,tsx}"
---
# rules content (now /compact-safe)
```

Then delete the nested CLAUDE.md (or shrink to a one-line pointer).

### Step 5 — Compact MEMORY.md to an index

`MEMORY.md` cap is **200 lines OR 25 KB whichever first**. Above it is silently discarded. Move detail into topic files:

```
~/.claude/projects/<proj>/memory/
├── MEMORY.md          # INDEX ONLY (< 200 lines, < 25 KB)
│   - "Debugging notes → debugging.md"
│   - "API patterns   → api-conventions.md"
│   - "Perf learnings → performance.md"
├── debugging.md       # On-demand detail
├── api-conventions.md
└── performance.md
```

### Step 6 — Skill listing budget cleanup

If `/doctor` reports overflow, in order:

1. Set low-priority skills to `"name-only"` in `.claude/settings.local.json` → `skillOverrides`
2. Add `disable-model-invocation: true` to skills that should NOT auto-trigger
3. Trim each skill `description` + `when_to_use` (combined cap = 1.536 chars; configurable via `maxSkillDescriptionChars`)
4. Raise budget: `skillListingBudgetFraction: 0.02` in settings (default 0.01) OR env `SLASH_COMMAND_TOOL_CHAR_BUDGET=<chars>`

### Step 7 — Monorepo: exclude irrelevant ancestor CLAUDE.md

```jsonc
// .claude/settings.local.json
{
  "claudeMdExcludes": [
    "**/monorepo/CLAUDE.md",
    "/abs/path/other-team/.claude/rules/**"
  ]
}
```

Arrays merge across settings layers (user/project/local/managed). **Managed policy CLAUDE.md cannot be excluded.**

### Step 8 — Conflict scan

Two rules that contradict make Claude pick arbitrarily. Diff sources of truth:

```bash
diff <(grep -h '^- ' ~/.claude/CLAUDE.md 2>/dev/null) \
     <(grep -h '^- ' CLAUDE.md ./.claude/CLAUDE.md 2>/dev/null) | head -40
grep -rh '^- ' .claude/rules/ ~/.claude/rules/ 2>/dev/null | sort | uniq -d
```

## 5. CLAUDE.md target shape after compaction (~ 20 KB / 280 lines)

| Section | Budget | Overflow target |
|---|---|---|
| Title + 1-paragraph overview | 500 chars | — |
| Last Change (latest only) | 250 chars | git history |
| Stack table | 600 chars | — |
| Architecture tree | 1.000 chars | — |
| Critical Rules (bullets) | 4.000 chars | `.claude/rules/<topic>.md` (with `paths:` when scoped) |
| FORBIDDEN table | 1.500 chars | — (must stay visible) |
| Quality Gates pointer | 200 chars | `config/quality-gates.json` |
| Per-domain summary bullets | 200 chars each | `.claude/rules/<domain>.md` |
| `<!-- maintainer notes -->` | 0 cost | inline |
| **Total** | **≤ 20 KB / ≤ 280 lines** | rules / skills / hooks |

## 6. FORBIDDEN During Compaction

| Don't | Why |
|---|---|
| Delete rules entirely | Move to `.claude/rules/` or skill instead |
| Remove FORBIDDEN table | Security visibility is the point |
| Delete Last Change | Keep latest, drop older |
| Remove architecture tree | Essential for navigation |
| Truncate code examples mid-block | Reference the file instead |
| Edit auto memory of other projects | Stay in current `~/.claude/projects/<proj>/` |
| Edit Managed Policy CLAUDE.md | Org-controlled, cannot be excluded |
| Touch a `CLAUDE.md` referenced by `claudeMdExcludes` | User intentionally hid it |
| Trust `@import` to save context | It does NOT — imports load full at launch |
| Keep nested CLAUDE.md content critical | Lost after `/compact` — promote to rule with `paths:` |

## 7. Verification (mandatory after compaction)

```bash
echo "1) Per-file size"
wc -c CLAUDE.md ./.claude/CLAUDE.md 2>/dev/null  # target each ≤ 20 KB
wc -l ~/.claude/projects/*/memory/MEMORY.md      # ≤ 200 lines

echo "2) Aggregate boot cost"
{ cat CLAUDE.md ./.claude/CLAUDE.md ./CLAUDE.local.md 2>/dev/null
  for r in $(find .claude/rules -name '*.md' 2>/dev/null); do
    head -20 "$r" | grep -q '^paths:' || cat "$r"
  done
} 2>/dev/null | wc -c                            # target ≤ 64 KB

echo "3) @import targets exist"
grep -hoE '@[^ )]+' CLAUDE.md ./.claude/CLAUDE.md 2>/dev/null | while read f; do
  p="${f#@}"; [ -f "$p" ] || echo "MISSING: $p"
done

echo "4) Rules well-formed"
for r in $(find .claude/rules -name '*.md' 2>/dev/null); do
  head -20 "$r" | grep -q '^paths:' && echo "scoped: $r" || echo "boot:   $r"
done

echo "5) Suggested in-session checks (run manually):"
echo "   /memory   → list of all loaded files"
echo "   /doctor   → skill listing budget overflow check"
```

### Optional — install `InstructionsLoaded` hook for permanent visibility

```jsonc
// .claude/hooks.json
{
  "InstructionsLoaded": [
    { "command": "echo \"$INSTRUCTION_PATH ($INSTRUCTION_REASON)\" >> .claude/memory/load.log" }
  ]
}
```

## 8. When to bail out and rebootstrap

If after compaction the project still exceeds aggregate 64 KB AND has 50+ rule files AND `/doctor` keeps overflowing, suggest a clean restart:

```bash
CLAUDE_CODE_NEW_INIT=1 claude /init
```

This launches the multi-phase interactive `/init`: subagent explores the codebase, asks follow-up questions, and presents a reviewable proposal of CLAUDE.md + skills + hooks before writing.
