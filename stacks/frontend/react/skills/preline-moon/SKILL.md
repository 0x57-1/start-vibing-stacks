---
name: preline-moon
version: 1.0.2
description: >-
  SOURCE OF TRUTH for Preline UI under the moon theme — offline corpus of
  component schemes, 800+ examples, moon token tables, data-hs-* / HS* wiring.
  Skill preline-ui is only the short install/summary; always use THIS skill for
  markup and tokens. Invoke on hs-*, data-hs-*, theme-moon, data-theme/.dark,
  or any "what markup for modal/drawer/table" question.
---

# Preline `moon` — offline corpus (source of truth)

**Companion:** skill `preline-ui` = short install / `autoInit()` summary.
**This skill** = the full look-up corpus. Prefer this file’s tree over inventing
markup or fetching preline.co.

Everything here is mined to local disk from the Preline 4.2.0 docs plus the
pubweb-saas CSS fork (theme reference). **Never fetch the network for Preline
questions; the answer is in a file below.**

Shipped by `start-vibing-stacks` for React / React-Inertia frontends →
`.claude/skills/preline-moon/`. All paths below are relative to that root
(`$CLAUDE_PROJECT_DIR/.claude/skills/preline-moon/`).

## What is on disk

| Path | Contents |
|---|---|
| `INDEX.md` | 98 rows (87 with a scheme + 11 docs pages), grouped by the 10 docs categories, plus a **Find by intent** table. Grep this first. |
| `components/*.md` | **87** component schemes: frontmatter (`js:`, `tokens:`, `examples:`), *When to use*, a reduced **Anatomy** skeleton, a **Variants** table naming every example file, and a moon token table. |
| `examples/<category>/<component>/<slug>.html` | **822** verbatim doc examples across 10 category dirs (825 index entries; 3 are `.js`/`.css`-only). Plus **102** `.js` and **25** `.css` siblings where the doc had those tabs. |
| `reference/*.md` | 6 deep docs — see the pointer table at the bottom. |
| `reference/upstream-theme-generator/` | Upstream Preline theme-generator skill (`SKILL.md`, `docs/`, `scripts/`) for minting a brand-new theme. |
| `data/index.json` | 688 KB machine index: per component `sections`, `tokens` (with counts), `hs_attrs`, `hs_js`, and every example's slug/section/token list/file paths. Slice it, never `cat` it. |
| `data/moon-tokens.json` | The 175 moon tokens with the full `var()` chain. |
| `data/token-usage.json` | 108 tokens → how many example files use each. Use it to tell a common token from a rare one. |
| `data/palettes.json` | The 4 non-Tailwind oklch ramps (`preline-khaki/mauve/avocado/avocado-soft`) + per-theme mapping. |
| `data/docs-menu.json` | The docs sidebar tree (category → pages). |
| `reference/moon-token-table.md` | **175** tokens → utility, CSS var, light value, dark value. The single source for any colour claim. |
| `assets/css/project-moon.css`, `project-theme.css`, `variants.css` | The pubweb-saas fork actually in use. |
| `assets/css/themes/*.css` | Upstream 4.2.0 themes: `theme.css` (base/default) + 8 named themes incl. `moon.css`. |
| `assets/js/preline/*.js` | **61** runtime modules, v4.2.0 (`index.js` = `preline.js`, one file per component, `*-non-auto.js` variants, helpers). |

## Step 0 — the two strings that make moon exist

Nothing below renders in moon until `<html>` carries **both** switches. They are orthogonal:
`data-theme` picks the palette, `.dark` picks the mode.

```html
<html data-theme="theme-moon" class="dark">
```

**The value is `theme-moon`, not `moon`.** Every theme file is scoped
`:root[data-theme="theme-moon"]` / `[data-theme="theme-moon"].dark`
(`assets/css/themes/moon.css`, `assets/css/project-moon.css`). Writing `data-theme="moon"` matches
nothing, throws nothing, and silently serves the **default blue theme** — every colour in this skill
will be wrong and no tool will tell you. Same for the other eight: `theme-harvest`, `theme-soft`, …

| Need | Where |
|---|---|
| Dark tokens only apply with **both** `[data-theme="theme-moon"]` **and** `.dark` | `reference/theming.md` §3 |
| Runtime toggle (`HSThemeSwitch`, `localStorage`, anti-FOUC head script) | `reference/theming.md` §3 *Switching at runtime* |
| In **pubweb-saas** this is already done twice — `resources/views/app.blade.php:2` and `Context/ThemeContext.jsx:23-25`, dark by default, key `pw_theme`. Do not add a second theme key. | `reference/project-integration.md` §2 |

Tokens flip on their own. `dark:bg-neutral-800` next to `bg-card` is not a refinement, it is a bug.

**Fork specificity (CSS-first).** The pubweb-saas / `assets/css/project-moon.css`
selectors (`:root[data-theme="theme-moon"]`) are **(0,2,0)**. A bare `.dark`
block is **(0,1,0)** and **loses**. A custom property declared only in the light
theme block **stays light** after toggle. Patch **both** theme blocks +
`@theme inline` before any JSX token migrate. Skill `react-theme-apply`.

If the project has `docs/design/style-guide/`, that guide wins for recipes.
Grep vs guide: fix the **count** in the guide, not the token name.

## Lookup protocol

Four steps. Do not skip to writing markup.

**1 — Name it.** You know the intent, not the Preline name. Grep `INDEX.md`:

```bash
cd "$CLAUDE_PROJECT_DIR/.claude/skills/preline-moon"
grep -i 'drawer\|slide-over' INDEX.md
# | `offcanvas` | overlays | Edge-anchored sliding panel (drawer) | 5 | HSOverlay | `components/offcanvas.md` |
```

The row gives you the category, the example count, the `HS*` class to init, and the scheme path.
If nothing matches, read the **Find by intent** section at the bottom of `INDEX.md`.

**2 — Read the scheme.** It tells you which variant you want and names its file:

```bash
sed -n '1,60p' components/offcanvas.md      # frontmatter + When to use + Anatomy
grep -n 'examples/overlays/offcanvas' components/offcanvas.md   # the Variants table
```

**3 — `cat` the example and copy it verbatim.**

```bash
cat examples/overlays/offcanvas/example.html
cat examples/overlays/offcanvas/placement.html
```

Sibling `.js`/`.css` files exist for JS-driven variants — check before writing your own:

```bash
ls examples/overlays/offcanvas/
```

**4 — Check the colours you kept or changed** against the one authority:

```bash
grep -E '^\| `(primary|primary-foreground|overlay|overlay-line)`' reference/moon-token-table.md
```

**Other entry points**

```bash
# Which example uses a class I saw somewhere?
grep -rl 'hs-overlay-open:translate-x-0' examples/

# Which components use a token (before inventing a new colour)?
python3 -c "import json;d=json.load(open('data/index.json'))['components'];print([k for k,v in d.items() if 'overlay-line' in v['tokens']])"

# Full record for one component (sections, hs_attrs, every example)
python3 -c "import json;d=json.load(open('data/index.json'));print(json.dumps(d['components']['offcanvas'],indent=1))"

# What mounts a data-hs-* attribute
grep -n 'data-hs-overlay' reference/javascript.md
```

## Rules that prevent the expensive mistakes

1. **Copy, do not compose.** Every snippet you ship must come out of `examples/`. The schemes' Anatomy
   blocks are *reduced skeletons* for orientation — they drop classes on purpose. Hand-written Preline
   markup is how you get a component that renders but never mounts.
2. **Semantic token, never raw palette.** Write `bg-card`, `text-muted-foreground`, `border-layer-line`.
   `@theme inline` makes `bg-layer` compile to `var(--layer)`, so redeclaring `--layer` under `.dark`
   recolours it with **zero `dark:` variants**. Across all 825 examples, colour `dark:` variants appear
   in 0.57% of class tokens and **never on a semantic token**. If you are writing `dark:bg-…` on one,
   you picked the wrong token.
   **The one carve-out is status colour** — see rule 14. Preline's own red/green/amber buttons and
   validation states use raw `red-500`/`teal-500`, and rules 1 and 2 pull in opposite directions
   there. Read 14 before you write a delete button.
3. **moon inverts `primary`.** `primary` is `gray-800` in light and **`white`** in dark;
   `primary-foreground` is `white` → `neutral-800`. So `bg-primary text-white` is invisible in dark.
   Always pair a surface with its `-foreground` token: `bg-primary text-primary-foreground`,
   `bg-secondary text-secondary-foreground`, `bg-tooltip text-tooltip-foreground`. Same trap for
   `secondary` and `tooltip`. Details: `reference/moon-theme.md` §3.
4. **moon changes the primary *family* between modes** (`gray` light → `neutral` dark). Any hardcoded
   `gray-*` sitting next to a `primary-*` utility drifts in dark mode.
5. **Re-init after any dynamic render.** Preline mounts on `window load` and keeps a hard reference in
   `window.$hs*Collection`. A React/Inertia re-render replaces the node → the component is dead with
   **no console error**. Call `window.HSStaticMethods.autoInit()` after the DOM is committed
   (`useEffect` with **no dependency array**, or a `setTimeout` after a navigate event). `autoInit()` is
   idempotent and additive. `reference/javascript.md` §8.
6. **`autoInit()` never re-reads options.** If a surviving node's `data-hs-*` JSON or `[--placement:*]`
   changed, `HSX.getInstance(el, true).element.destroy()` first, then re-init. 24 components ship an
   `examples/*/*/destroy-and-reinitialize.js` showing exactly this.
7. **Third-party globals must exist before `import('preline')`.** `index.js` builds its registry once at
   module evaluation: if `VanillaCalendarPro` / `noUiSlider` / `jQuery`+`DataTable` / `Dropzone` are not
   on `globalThis` at that moment, that component's factory stays `null` for the life of the page and
   `autoInit()` silently skips it forever.
8. **Overlays escape the React tree.** `HSOverlay` appends its backdrop to `document.body` and adds
   `hs-overlay-body-open` to `<body>`. Unmounting a modal/offcanvas subtree without `close()`/`destroy()`
   leaves a dead backdrop and a locked scroll.
9. **Structure is a selector contract.** `.hs-dropdown-menu` must be a *direct child* of `.hs-dropdown`;
   the toggle must be `:scope > .hs-dropdown-toggle`. Wrapping a Preline part in your own `<div>` breaks
   the mount silently. Check the scheme's Anatomy before reparenting anything.
10. **Some options are CSS custom properties, not attributes** — `[--auto-close:inside]`,
    `[--trigger:hover]`, `[--body-scroll:true]`, `[--placement:top]`, `[--gpu-acceleration:false]`. They
    look like Tailwind arbitrary values and are easy to "clean up" into nothing.
    `reference/javascript.md` §5 lists them.
11. **Focus feedback is a background, not a ring.** Preline buttons/fields carry
    `focus:outline-hidden focus:bg-*-focus`. Deleting `focus:bg-…` because "there's already an outline"
    removes the only focus indicator.
12. **Not every theme variable is a class.** Only names aliased to `--color-*` in `@theme inline` mint
    utilities. `--chart-colors-*` (63 declarations) and `--map-colors-*` are JS config, read via
    `varToColor` — `bg-chart-colors-3` does not exist.
13. **This corpus is 4.2.0; pubweb-saas has 4.1.3 installed.** Before using a component in that repo,
    read `reference/project-integration.md` §1 — and its §5, which lists the shared components already
    in `resources/js/Components/Common/` that you should reuse instead of rebuilding.
14. **`destructive` is a real token that no example uses.** `grep -rl 'bg-destructive' examples/`
    returns **zero files**. The token exists and compiles — `destructive` `red-500`, `destructive-hover`
    and `destructive-focus` `red-600`, `destructive-foreground` `white`, **identical in light and
    dark** — but Preline's own danger button is raw palette:
    `bg-red-500 border border-transparent text-foreground-inverse hover:bg-red-600 focus:bg-red-600`
    (`examples/base-components/buttons/solid-color-variants.html`). Both render the same pixels today.
    Pick `destructive` for new work (one place to retint) and keep the `-foreground` pairing; just do
    not expect to find it by grepping `examples/`, and do not swap it into a *validation* border —
    `components/select.md` §Gotchas explains why those stay literal `red-500`/`teal-500`.
15. **Every overlay example is `z-80`; the repo's own `Modal` is `z-[70]`.** So a
    `@/Components/Common/Modal` confirm dialog opened from inside a Preline `offcanvas`/`modal`
    (both `z-80`) renders **behind the drawer**, looking like the modal never opened. Full ladder in
    `reference/project-integration.md` §5a. Pick one family per stack, or raise the inner one
    explicitly — Preline will not do it for you unless you set `--has-dynamic-z-index:true`.
16. **A component that needs a third-party global is only usable where that global is wired.**
    In pubweb-saas all five are (`resources/js/app.jsx:13-26`, before `await import('preline')`):
    jQuery + DataTables.net, noUiSlider, Dropzone, VanillaCalendarPro. Table in `INDEX.md`
    *Third-party globals*. Elsewhere, check first — rule 7 explains the silent-skip failure mode.

## Reference files — when to open which

| File | Open it when |
|---|---|
| `reference/moon-token-table.md` | You need the resolved light/dark value of a token. Flat lookup table, 175 rows. Any colour claim must match it. |
| `reference/tokens.md` | You are choosing *between* tokens (`layer` vs `surface` vs `muted` vs `card`), or need the four-layer var chain and why `@theme inline` matters. |
| `reference/moon-theme.md` | You are touching a colour under moon: the `primary` inversion, the full palette by family, the checkbox/radio checkmark data-uri, and every delta between the pubweb-saas fork and upstream `moon.css`. |
| `reference/theming.md` | CSS import order, `data-theme` vs `.dark` (orthogonal), `@source` and `variants.css` purge survival, the nine themes compared, adding a tenth, custom fonts. |
| `reference/javascript.md` | Anything behavioural: which module owns a component, the exhaustive `data-hs-*` table, the `HS*` static/instance API, CustomEvent names, the re-init trap, 4.2.0 quirks. |
| `reference/project-integration.md` | **Open this before your first line of JSX in pubweb-saas, not after.** It holds the three facts that decide whether your markup works there: §2 the exact `data-theme="theme-moon"` + `.dark` wiring already in place, §5 the ~25 shared React components (`Modal`, `ScrollTable`, `EmptyState`, `ToggleSwitch`, `StatusBadge`, `MultiSelect`…) you must reuse instead of pasting Preline markup, §5a the z-index ladder, §5b which third-party globals are wired. Plus §1 version delta, §3 `autoInit()`, §6 the `CLAUDE.md` rules constraining a `.jsx` edit, §7 what the repo does *not* have. |
| `reference/upstream-theme-generator/` | You are creating a brand-new theme rather than using one of the nine. |

## See Also

- **`preline-ui`** — short summary only (install, CSS order, `autoInit()`). Defer all component/token look-ups back here.
- `react-theme-apply` + memory `react-theme-parity` — CSS-first apply + token guard
- `tailwind-patterns` — Tailwind v4 `@theme` / Oxide
- `react-standards` / `inertia-react` — React / Inertia component conventions
