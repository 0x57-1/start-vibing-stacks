---
name: preline-moon
version: 2.1.0
description: >-
  Pointer to the Preline moon offline corpus (5.0 markup, 4.2 runtime). The npm
  package does NOT ship the ~100 MB capture. Prefer ~/.claude/skills/preline-moon
  then INDEX.md / TEMPLATES.md / PRO-BLOCKS.md. Invoke on hs-*, data-hs-*,
  theme-moon, data-theme/.dark, or any "what markup for modal/drawer/table"
  question. Companion: preline-ui (install). Project decisions live in
  design-system — read that first.
---

# Preline `moon` — corpus pointer

**Companion:** `preline-ui` = install / `autoInit()`. **`design-system`** =
what THIS project decided. **This skill** = where the vendor tree lives.

The npm tarball does **not** ship examples, templates, or pro-blocks. Read the
operator capture. `migrate` must never copy the dump into the project and must
**never** write through a symlink into `~/.claude/skills`.

## Resolve the live tree (first hit wins)

**Global wins over a stale project dump.** A leftover 4.2.0 copy in the repo
is not the SoT.

1. `$HOME/.claude/skills/preline-moon/` — if it has `INDEX.md` plus `examples/`
   or `data/index.json` (operator 5.x capture)
2. `$CLAUDE_PROJECT_DIR/.claude/skills/preline-moon/` — same test (rare local
   capture). A folder with only `SKILL.md` + `INDEX.md` is a **pointer**, not
   a corpus — keep walking
3. Stop. Do **not** fetch preline.co. Do not invent markup. Ask the operator
   for the capture. Do not `ln -s` the global tree into `.grok/skills/` or
   `.claude/skills/`

```bash
GLOB="$HOME/.claude/skills/preline-moon"
PROJ="$CLAUDE_PROJECT_DIR/.claude/skills/preline-moon"
if [ -f "$GLOB/INDEX.md" ] && { [ -d "$GLOB/examples" ] || [ -f "$GLOB/data/index.json" ]; }; then
  CORPUS="$GLOB"
elif [ -f "$PROJ/INDEX.md" ] && { [ -d "$PROJ/examples" ] || [ -f "$PROJ/data/index.json" ]; }; then
  CORPUS="$PROJ"
else
  echo "NO_CORPUS"
fi
```

Grok: keep this **pointer** under `.grok/skills/preline-moon/`. Read `$CORPUS`.
Do not mirror the 100 MB tree. `compat.claude.skills` stays **false**.

## What the 5.0 capture contains (once `$CORPUS` is set)

Markup is **Preline 5.0**; bundled `assets/js/preline/` + `assets/css/themes/`
are often **4.2.0** on purpose (apps pinned to `preline@^4.2.0`). Read
`$CORPUS/reference/upgrade-4.2-to-5.0.md` before bumping or copying `window.HS*`.

| You are building | Open |
|---|---|
| One widget (modal, select, table) | `INDEX.md` → `components/*.md` → `examples/` |
| A page or section (hero, shell, checkout) | `TEMPLATES.md` → `templates/_schemes/` → **line range** — never `cat` a whole template |
| A finished fragment to paste | `PRO-BLOCKS.md` → `pro-blocks/_routers/` → `cat` the block |

5.0 renamed hundreds of docs anchors; filenames stayed 4.2.0. Translate with
`$CORPUS/data/example-anchor-map-5.0.json`. Colour claims:
`reference/moon-token-table.md`.

## Lookup

```bash
cd "$CORPUS"
grep -i '<intent>' INDEX.md
```

Then the named scheme → the Variants file. Copy, do not compose.

## Step 0 — the two strings that make moon exist

```html
<html data-theme="theme-moon" class="dark">
```

The value is `theme-moon`, not `moon`. Pro templates ship
`data-theme="theme-default"` — kept verbatim they render the **default blue**
theme. Fork specificity: `:root[data-theme="theme-moon"]` is **(0,2,0)**; a
bare `.dark` **loses**. Patch both theme blocks + `@theme inline` before JSX.
Skill `react-theme-apply`. Project substitutions (size, focus, recipes) live
in **`design-system`**.

## Do not

| Action | Why |
|---|---|
| Symlink global corpus → project `.claude` or `.grok/skills` | `copySkillTree` follows the link |
| Prefer a project 4.2.0 dump over `~/.claude/skills` | Stale SoT — global first |
| Ship or commit the 100 MB tree in an app repo | Pointer + global |
| Fetch preline.co when `$CORPUS` exists | Offline capture wins |
| Skip `design-system` and paste corpus classes raw | Project density / focus / tokens win |

## See Also

- `design-system` — this project's decisions (Read first)
- `project-ui-standard` — when to create that skill; when Preline is in play
- `preline-ui` — install, CSS order, `autoInit()`
- `react-theme-apply` + memory `react-theme-parity`
