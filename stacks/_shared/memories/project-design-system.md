---
version: 1.0.0
---

# Memory: Project design-system (Claude / Grok / Kimi)

> **ALWAYS LOAD** on frontend or layout work. The project skill
> `.claude/skills/design-system/SKILL.md` is the standard. Do not invent a
> second look. Do not delete that skill.

## Order

1. Frontend/layout in this repo? If no, ignore this memory.
2. Read existing `design-system` (Claude + Grok copies) and in-repo guides
   (`docs/design/**`, `uiStyles.js`, `DESIGN.md`).
3. If the skill is missing — create it from those sources (skill
   `project-ui-standard`). Mirror to `.grok/skills/design-system/` if absent.
   Kimi already sees `.claude/skills`.
4. Preline only when `package.json` has `preline` or
   `.claude/config/project-ui.json#prelineMoon`. Markup corpus is
   **`$HOME/.claude/skills/preline-moon`** (5.0), not a copy inside the repo.
5. Append decisions in the same commit as the UI change.

## Hard limits

- Never overwrite or `rm` `design-system` on migrate / `--force`.
- Never symlink the global Preline tree into `.claude/skills` or `.grok/skills`.
- Never prefer a leftover project 4.2.0 dump over the global capture.
