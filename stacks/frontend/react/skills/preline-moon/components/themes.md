---
component: themes
label: Themes
category: customization
docs: https://preline.co/docs/themes.html
examples: 14
js: none
tokens: []
---

# Themes

The `data-theme` mechanism: a CSS-only palette swap. A theme file redefines the raw `--token`
variables; the `@theme inline` block in `theme.css` maps those onto the `--color-*` names Tailwind
turns into utilities. No JavaScript is involved at any point.

Deep treatment lives in `reference/theming.md` (§2 the two-hop chain, §5 the nine themes, §7 adding
one, §9 fork divergences). This scheme is the file-by-file map of the 14 doc examples.

## When to use

- Shipping more than one brand palette, or scoping a palette to a subtree
  (`<div data-theme="theme-moon">` works — the light selector is deliberately doubled).
- Adding a brand colour: you want §*Customize tokens* (`static-7`…`static-10`), not a fork of
  `theme.css`.
- **Do not** use `data-theme` for light/dark. That is `.dark` + `dark:`, a separate and orthogonal
  switch — `dark-mode` owns it. A theme carries **both** its light and its dark block.
- **Do not** import a premade theme without `theme.css`. `theme.css` holds the `@theme inline`
  mapping and the four custom `oklch` ramps; a theme file alone maps nothing.

## Anatomy

Two files and one attribute. Verbatim from `examples/customization/themes/static-2.html`:

```css
@import "tailwindcss";

/* Activating the Harvest theme */
@import "./themes/theme.css";
@import "./themes/harvest.css";
```

Then, verbatim from `examples/customization/themes/static-3.html`:

```html
<html data-theme="theme-harvest">
  ...
</html>
```

The attribute value is `theme-<name>`, always prefixed. Import order matters: `theme.css` first —
it declares the mapping every theme file relies on.

## Variants

All paths below are under `examples/customization/themes/`. Every file is CSS or HTML **source to
put in your stylesheet**, not markup to paste in a page.

| Variant | Section | Example file | What it contains |
|---|---|---|---|
| Import all themes | Quick start | `static-1.html` | `@import "tailwindcss";` + `theme.css` + all eight named themes. The "import only what you need" comment is the point — each import is dead weight until some element carries its `data-theme` |
| Import one theme | Premade themes | `static-2.html` | The 2-line minimum: `theme.css` then `harvest.css` |
| Activate it | Premade themes | `static-3.html` | `<html data-theme="theme-harvest">` — the only HTML in this component |
| Mapping block | Full token reference | `static-4.html` (203 lines) | The complete `@theme inline { --color-X: var(--X); }` mapping, 175 entries |
| Light values | Full token reference | `static-5.html` (277 lines) | A full `:root { }` listing, 246 variables |
| Dark values | Full token reference | `static-6.html` (179 lines) | The matching `.dark { }` listing, 153 variables |
| Custom theme skeleton | Customize tokens | `static-7.html` | `theme.css` + `my-theme.css` — the recommended shape: never edit `theme.css` |
| Add a token | Customize tokens | `static-8.html` | `@theme inline { --color-my-brand: var(--my-brand); }` plus the commented-out form for *re-pointing* an existing mapping |
| Light overrides | Customize tokens | `static-9.html` | `:root { }` showing the three accepted value forms — `var(--color-blue-600)`, raw hex, raw `oklch()` — and a custom `--my-brand` |
| Dark overrides | Customize tokens | `static-10.html` | The `.dark { }` counterpart of `static-9`. Note it overrides **only** what changes; unlisted tokens keep their `:root` value |
| Font import | Custom Fonts (Google Fonts) | `static-11.html` | `@import url('…fonts.googleapis.com…')` placed **above** `@import "tailwindcss"` |
| Font token | Custom Fonts (Google Fonts) | `static-12.html` | `static-9` plus `--font-sans: "Inter", ui-sans-serif, …` — the font is a token like any other |
| Skill prompt | Requires a Skill to be set up | `static-13.html` | One line of prose: `Generate a soft rose theme using SKILL` |
| Skill prompt + dark | Requires a Skill to be set up | `static-14.html` | `Generate a soft rose theme with a matching dark mode using SKILL` |

`static-13` / `static-14` are prompts for Preline's own upstream theme-generator skill, mirrored at
`reference/upstream-theme-generator/`.

## Theme tokens (moon)

None of its own — `index.json` records `"tokens": {}`. This component *defines* tokens rather than
consuming them. For any concrete moon value use `reference/moon-token-table.md` (175 rows,
light + dark); for the `var()` chain use `data/moon-tokens.json`.

Moon's `data-theme` value is `theme-moon`, and its selectors in `assets/css/themes/moon.css` are:

```css
:root[data-theme="theme-moon"],
[data-theme="theme-moon"] { … }      /* line 9-10, light */
[data-theme="theme-moon"].dark { … } /* line 96, dark — requires BOTH */
```

## Behaviour (JS)

None. `index.json` lists no `hs_js` and no `hs_attrs` for this component. Nothing in
`assets/js/preline/` reads or writes `data-theme` — `HSThemeSwitch` only touches the
`light`/`dark`/`auto` classes. Switching theme at runtime is your own `setAttribute('data-theme', …)`,
and it needs no re-init because no component caches a colour.

## Gotchas

- **`static-4` / `static-5` / `static-6` are a documentation sample, not the shipped default theme.**
  Of the 232 variables `static-5.html` shares with the `:root` block of `assets/css/themes/theme.css`,
  **141 carry different values** — the doc uses a `stone` neutral where the shipped file uses `gray`
  (`--background-1` is `var(--color-stone-50)` in the doc, `var(--color-gray-50)` in `theme.css`).
  It matches no shipped theme file either. Treat it as a starting point to edit, never as a
  reference for "what the default currently is"; for that, read `assets/css/themes/theme.css`.
- **`static-4` uses the `--*-border` variable names, `assets/css/themes/theme.css` uses `--*-line`.**
  `static-4` has `--color-card-line: var(--card-border)`; `theme.css:204` has
  `--color-card-line: var(--card-line)`. Six variables are affected (`card`, `dropdown`, `footer`,
  `navbar`, `navbar-1`, `navbar-2`, plus the `sidebar`/`select`/`overlay`/`popover`/`tooltip`/`table`
  family in the full listing). The **utility name never changes** (`border-card-line` works either
  way) — only the raw variable the mapping reads. The project fork uses the `-border` spelling;
  `reference/theming.md` §9(a) has the full rename table. Mixing the two spellings silently loses
  every one of those borders.
- **A theme file alone maps nothing.** The `@theme inline` block lives only in `theme.css`
  (`static-4` is its listing). Import a theme without it and every `--color-*` utility is undefined.
- **The four custom ramps live in `theme.css`, not in the theme that uses them.**
  `preline-khaki`, `preline-mauve`, `preline-avocado`, `preline-avocado-soft` are raw `oklch()` in
  `theme.css`'s `@theme inline`; `harvest`, `bubblegum`, `cashmere` and `olive` reference them.
  `assets/css/project-theme.css` drops that block — those four themes cannot be dropped into this
  project as-is (`reference/theming.md` §9(b)). Machine-readable copy: `data/palettes.json`.
- **`.dark` overrides are additive, not a full set.** `static-10` redefines six variables; every
  other token keeps its `:root` value in dark. Copying a partial dark block from one theme onto a
  different `:root` inherits that `:root`'s light values for everything unlisted.
- **The font `@import` must precede `@import "tailwindcss"`.** `static-11` puts the Google Fonts URL
  on line 1. CSS requires `@import` before other rules; put it lower and the browser drops it.
- **`data-theme` and `.dark` are independent.** Neither implies the other, and a theme's dark block
  is scoped to *both* (`[data-theme="theme-moon"].dark`), so a `data-theme` subtree without `.dark`
  above it never gets the dark values.
- **Only `retro.css` and `theme.css` lack the empty `@theme theme-<name> inline { }` placeholder**
  that every other theme opens with; `retro.css` uses `@layer utilities` to re-point `.rounded` at
  `--radius-ui: 0`. Detail in `reference/theming.md` §5.

## Copy-paste base

`examples/customization/themes/static-2.html` + `static-3.html`, verbatim:

```css
@import "tailwindcss";

/* Activating the Harvest theme */
@import "./themes/theme.css";
@import "./themes/harvest.css";
```

```html
<html data-theme="theme-harvest">
  ...
</html>
```

For moon, swap the second import for `./themes/moon.css` and the attribute for `theme-moon`.
