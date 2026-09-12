---
name: preline-moon
version: 2.0.0
description: >-
  Pointer to the Preline moon offline corpus (schemes, examples, tokens,
  data-hs-* / HS* wiring). The npm package does NOT ship the capture. Resolve
  the live tree (project or ~/.claude/skills) then INDEX.md → components →
  examples. Invoke on hs-*, data-hs-*, theme-moon, data-theme/.dark, or any
  "what markup for modal/drawer/table" question. Companion: preline-ui (install only).
---

# Preline `moon` — corpus pointer

**Companion:** `preline-ui` = install / `autoInit()`. **This skill** = where
the look-up tree lives. Do not invent markup or fetch preline.co when a
capture is on disk.

SVS **does not ship** the 4.2.0/5.0 example dump in the npm tarball. A local
capture (project or user-global) is the source of truth. `migrate --apply`
must **not** refill a missing project copy from an old bundled dump, and must
**never** write through a symlink into `~/.claude/skills`.

## Resolve the live tree (first hit wins)

1. `$CLAUDE_PROJECT_DIR/.claude/skills/preline-moon/` — if it has `INDEX.md`
   plus `examples/` or `data/index.json`
2. `$HOME/.claude/skills/preline-moon/` — same test (operator 5.x capture)
3. Stop. Do **not** download preline.co. Ask the operator to install/capture
   the corpus (5.0+). Do not `ln -s` the global tree into `.grok/skills/` or
   `.claude/skills/` — `migrate` copy follows the link and can smash the capture.

```bash
PROJ="$CLAUDE_PROJECT_DIR/.claude/skills/preline-moon"
GLOB="$HOME/.claude/skills/preline-moon"
if [ -f "$PROJ/INDEX.md" ] && { [ -d "$PROJ/examples" ] || [ -f "$PROJ/data/index.json" ]; }; then
  CORPUS="$PROJ"
elif [ -f "$GLOB/INDEX.md" ] && { [ -d "$GLOB/examples" ] || [ -f "$GLOB/data/index.json" ]; }; then
  CORPUS="$GLOB"
else
  echo "NO_CORPUS"
fi
```

Grok: keep this pointer under `.grok/skills/preline-moon/` (thin). Read
`$CORPUS`, do not mirror the 100 MB tree into `.grok/skills/`.

## Lookup (once `$CORPUS` is set)

```bash
cd "$CORPUS"
grep -i '<intent>' INDEX.md
```

Then the named `components/<slug>.md` → `examples/<path>` from the Variants
table. Colour claims go through `reference/moon-token-table.md` when that
file exists in `$CORPUS`.

## Step 0 — the two strings that make moon exist

Nothing moon-renders until `<html>` has **both** switches (`data-theme` =
palette, `.dark` = mode):

```html
<html data-theme="theme-moon" class="dark">
```

The value is `theme-moon`, not `moon`. `data-theme="moon"` matches nothing
and silently serves the default blue theme.

Fork specificity: `:root[data-theme="theme-moon"]` is **(0,2,0)**. A bare
`.dark` block **loses**. Patch **both** theme blocks + `@theme inline`
before any JSX token migrate. Skill `react-theme-apply`.

## Do not

| Action | Why |
|---|---|
| Symlink global corpus → `.grok/skills/preline-moon` or project `.claude/skills/` | `copySkillTree` / `copySkillBundle` follow the link |
| Register the name only in `.svs-managed.json` | Next migrate prunes names not on `GROK_CURATED_SKILL_NAMES` |
| Treat this pointer folder as the example dump | Examples live in `$CORPUS` |
| Fetch preline.co when `$CORPUS` exists | Offline capture wins |

## See Also

- `preline-ui` — install, CSS order, `autoInit()`
- `react-theme-apply` + memory `react-theme-parity`
- `tailwind-patterns` — Tailwind 4.3 `@theme`
