# Preline `moon` — semantic token reference

**What this answers:** which utility class to write for a given intent (`bg-layer`? `bg-surface`? `bg-muted`?), what colour it resolves to in light and dark under the `moon` theme, and how the CSS chain gets it there. Read this before hand-picking a Tailwind palette colour (`bg-gray-100`) in a Preline page — almost every such choice already has a semantic token, and the token is the one that survives dark mode without a `dark:` variant. For the resolved value of a single token, `reference/moon-token-table.md` is the lookup table; this file is the *why* and the *which*.

---

## 1. The chain — four layers

| # | Layer | Lives in | Example |
|---|---|---|---|
| 1 | Tailwind v4 palette | Tailwind's own `@theme` | `--color-gray-800: oklch(27.8% 0.033 256.848)` |
| 2 | Raw semantic token, base | `project-theme.css` → `:root` (L187), `.dark` (L436) | `--layer: var(--color-white)` / `.dark { --layer: var(--color-neutral-800) }` |
| 3 | Raw semantic token, moon override | `project-moon.css` → `:root[data-theme="theme-moon"]` (L5), `[data-theme="theme-moon"].dark` (L145) | `--primary: var(--color-primary-800)` / dark `var(--color-white)` |
| 4 | `--color-*` alias → utility class | `project-theme.css` → `@theme inline { … }` (L1–185) | `--color-layer: var(--layer)` ⇒ `bg-layer`, `text-layer`, `border-layer`, `ring-layer`, `fill-layer`, … |

**Worked example — `bg-primary` in dark:** `bg-primary` → `background-color: var(--primary)` (project-theme.css L30) → `var(--color-white)` (project-moon.css L177, dark block) → `#fff`.

### Why `inline` is load-bearing

`@theme inline` makes the utility emit the *raw* var reference — `bg-layer` compiles to `background-color: var(--layer)`, not `var(--color-layer)`. The colour re-resolves per element from whatever `--layer` is in scope, so re-declaring `--layer` inside `.dark` on `<html>` recolours every `bg-layer` with **zero `dark:` variants**.

Hence the 825 examples use `dark:` on colour utilities only **551 times out of 96,370 class tokens (0.57%)**, always on the primary ramp or a raw palette colour (`dark:hs-dragged:bg-primary-800` 84×, `dark:text-neutral-200` 44×, `dark:bg-primary-500/20` 28×), never on a semantic token. **If you are writing `dark:bg-…` on a semantic token, you picked the wrong token.**

### Theme variables that are NOT utilities

Names not starting with `--color-` mint **no class** — JS or an arbitrary-value bracket only. `--map-colors-*` (8, in `@theme inline`) feed the vector-map config; `--chart-colors-*` (63 declarations, `:root` only, never in `@theme`) feed ApexCharts options. Of the chart family only `--chart-primary` and `--chart-1..10` get `--color-*` aliases, so only those become `bg-chart-3`-style classes.

---

## 2. Which selector wins (dark-mode mechanics)

moon expects both hooks on one element: `<html class="dark" data-theme="theme-moon">`.

| Selector | Specificity | File |
|---|---|---|
| `:root` | (0,1,0) | project-theme.css L187 |
| `.dark` | (0,1,0), later in source ⇒ beats `:root` | project-theme.css L436 |
| `:root[data-theme="theme-moon"]` | **(0,2,0)** | project-moon.css L5 |
| `[data-theme="theme-moon"].dark` | **(0,2,0)**, later ⇒ beats the moon light block | project-moon.css L145 |

Resolution order in dark: **moon-dark → moon-light → `.dark` → `:root`**. Note the middle two — the moon *light* block out-specifies base `.dark`.

**The 3-token consequence.** Exactly three tokens are declared in the moon **light** block, never re-declared in moon **dark**, while base `.dark` does declare them: `--surface-3` (moon light `gray-400`, `.dark` `neutral-600`), `--surface-4` (`gray-500` / `neutral-500`), `--surface-5` (`gray-600` / `neutral-400`). `moon-token-table.md` prints the `.dark` value in its dark column; because the moon light selector out-specifies `.dark`, expect the light grey to persist instead. **Verify in a browser before relying on `bg-surface-3/-4/-5` in dark** — used only 26 / 51 / 13 times in all examples, so a different token is the cheap fix.

---

## 3. Naming trap: the utility is `-line`, the variable is `-border`

For per-component families the alias reads a `-border` variable but exposes a `-line` class — `--color-card-line: var(--card-border);` (project-theme.css L122). All 14: `navbar`, `navbar-1`, `navbar-2`, `sidebar`, `sidebar-1`, `sidebar-2`, `card`, `dropdown`, `select`, `overlay`, `popover`, `tooltip`, `table`, `footer` — class `border-X-line` (or `divide-table-line`), variable `--X-border`.

The four **generic** families are the exception — there the variable really is `-line` and setting it works: `--layer-line`, `--surface-line`, `--primary-line`, `--secondary-line` (plus `--border-line-1..8` behind `border-line-N`).

**`project-moon.css` gets this wrong.** In both its light and dark blocks it writes six variables nothing reads: `--card-line`, `--footer-line`, `--navbar-line`, `--popover-line`, `--sidebar-line`, `--table-line`. They are inert; nothing looks broken today only because the values it assigns happen to equal what `:root` / `.dark` already set on the `-border` names. **Editing any of those six lines changes nothing on screen** — edit `--card-border` etc. instead.

---

## 4. The families

Values are moon light / moon dark from `moon-token-table.md`; "uses" from `token-usage.json`.

### Generic — reach for these first

| Family | For | Light / dark | Uses |
|---|---|---|---|
| `background` | Page ground; the body already has it. `background-1`/`-2` are recessed grounds. | `white` / `neutral-900` | 1 |
| `foreground` | Body text on `background`/`layer`. **Most-used token in the system.** | `gray-800` / `neutral-200` | 3690 |
| `foreground-inverse` | Text on a saturated or dark solid. Fixed `white` both modes. | `white` / `white` | 150 |
| `inverse` | Text/icon that must invert against `plain`. | `gray-800` / `neutral-950` | 10 |
| `plain` | A ground that stays *light-ish* in dark. Mostly with an opacity modifier over imagery: `bg-plain/10`. | `white` / `neutral-800` | 39 |
| `border` + `line-1..8` | Hairlines, faint → strong. `line-2` is the default divider. | `line-2` `gray-200` / `neutral-700` | 451 |
| **`layer`** | **The resting panel.** Card bodies, input grounds, list rows, popouts — sits *on* the background, not filled. | `white` / `neutral-800` | 1041 |
| **`surface`** | **A filled block.** Badges, chips, initials-avatars, progress tracks, skeletons, segmented controls. | `gray-100` / `neutral-700` | 356 |
| **`muted`** | **Interaction fill + quiet text.** `hover:bg-muted-hover` = standard hover on a transparent control; `text-muted-foreground-1` = standard secondary text. | `gray-50` / `neutral-800`; `-foreground-1` `gray-600` / `neutral-400` | 1529 |
| `primary` | Action colour: solid buttons, focus rings, checked controls, links. **Inverts under moon — §8.** | `gray-800` / `white` | 1402 |
| `secondary` | Second solid button colour. moon does **not** override it. | `gray-900` / `white` | 27 |
| `destructive` | Danger. moon does **not** override it — identical in both modes. | `red-500` / `red-500` | **0** |

### Per-component — only inside that component's markup

One shape: base fill + `-line` + `-divider` + `-header` + `-footer` + `-inverse`. Use **only inside that component's markup** — `bg-dropdown` on a card is wrong even when the colours match today.

| Family | Scope | Extra members |
|---|---|---|
| `navbar` / `sidebar` | Bars and side nav. `-1`/`-2` are alternate tints, each a full sub-family. | `-nav-foreground`, `-nav-hover/-focus/-active`, `-nav-list-divider`. No `-header`/`-footer`. |
| `card` / `overlay` | Card chrome; modal + offcanvas panel. | full shape, nothing extra |
| `dropdown` / `select` | Menu / advanced-select surface and its rows. `-1` = alternate tint. | `-item-foreground`, `-item-hover/-focus/-active`. `select` has no `-divider/-header/-footer`. |
| `popover` | Popover panel. | `-line` only |
| `tooltip` | **Inverts:** `gray-900` / `white`, foreground `white` / `neutral-800`. | `-foreground`, `-line` |
| `chart` | ApexCharts series `chart-1..10` + `chart-primary`. Greys under moon, except `chart-5` slate / `-6` zinc / `-7` stone. | — |

Plus four small ones: `table` (one token, `table-line` `gray-200` / `neutral-700` — always `divide-y divide-table-line`), `footer` (`-line`, `-inverse`), `scrollbar` (`-track`, `-thumb`, `-inverse` of each, driven through `[&::-webkit-scrollbar-*]` variants), `switch` (toggle knob, `white` / `neutral-800`). And `map`, which is **not** a class family at all — `var(--map-colors-*)` only.

---

## 5. Decision table — intent → class

| I need… | Write |
|---|---|
| Body text | `text-foreground` |
| Secondary / helper / placeholder text | `text-muted-foreground-1` (`-2` = stronger, bare `muted-foreground` = weakest) |
| Text on a coloured solid | `text-primary-foreground`, or `text-foreground-inverse` on any other saturated fill |
| A resting panel, card body, list row | `bg-layer border border-layer-line` |
| An input ground + its focus ring | `bg-layer border-layer-line text-foreground placeholder:text-muted-foreground-1 focus:border-primary-focus focus:ring-primary-focus` |
| A filled chip / badge / track | `bg-surface text-surface-foreground` (stronger: `bg-surface-1`) |
| A hover fill on a transparent control | `hover:bg-muted-hover focus:bg-muted-focus` |
| A hover fill on an element that is already `bg-layer` | `hover:bg-layer-hover focus:bg-layer-focus` |
| Selected / current row | `bg-muted-active` (e.g. `hs-tree-view-selected:bg-muted-active`) |
| Primary button | `bg-primary border border-primary-line text-primary-foreground hover:bg-primary-hover focus:bg-primary-focus` |
| Outline button | `border border-line-8 text-foreground hover:border-primary-hover hover:text-primary-hover focus:border-primary-focus focus:text-primary-focus` |
| Ghost button | `border border-transparent text-foreground hover:bg-muted-hover focus:bg-muted-focus` |
| A link | `text-primary hover:text-primary-hover focus:text-primary-focus` |
| A hairline | `border-line-2` (heavier: `border-line-3`, `border-line-8`); between table rows `divide-y divide-table-line` |
| Checkbox / radio checked state | `checked:bg-primary-checked checked:border-primary-checked` |
| Dropdown panel / row | `bg-dropdown border-dropdown-line` / `text-dropdown-item-foreground hover:bg-dropdown-item-hover` |

**layer vs surface vs muted:** `layer` = it rests on the page and is *not* filled; `surface` = it *is* a fill; `muted` = the fill appears only on interaction, or the text is deliberately quiet.

---

## 6. Suffix convention

| Suffix | Meaning | Paired with |
|---|---|---|
| *(none)* | Resting colour of the family | `bg-`, `text-` |
| `-foreground` | Content sitting **on** that family's fill | `text-` |
| `-line` | That family's border/hairline (⚠ variable is `-border` for per-component families — §3) | `border-`, `divide-` |
| `-hover` / `-focus` | The matching CSS state; `-focus` is also what `ring-` uses | `hover:bg-`, `hover:text-`, `hover:border-`, `focus:bg-`, `focus:ring-`, `focus:border-` |
| `-active` | Pressed / current / selected — Preline drives it through its own variants | `hs-tab-active:`, `hs-carousel-active:`, `hs-tree-view-selected:`, `hs-accordion-selected:` |
| `-checked` | `checked:` on real inputs (exists only on `primary`) | `checked:bg-primary-checked` |
| `-divider`, `-header`, `-footer` | Internal rules *inside* a component: between menu groups / under a header / above a footer | `divide-`, `border-` |
| `-inverse` | Same role, opposite ground | `bg-card-inverse`, `text-foreground-inverse` |

Suffixed tokens are **not** decorative aliases: `hover:bg-primary` and `hover:bg-primary-hover` resolve differently (`gray-800` vs `gray-900` in light). Always use the suffixed token for a state.

## 7. Numeric ramps

| Ramp | Direction | Notes |
|---|---|---|
| `primary-50` … `primary-950` (11) | lightest → darkest; in dark the palette switches gray → neutral, direction unchanged | Escape hatch when `primary` is too heavy: `bg-primary-100 dark:bg-primary-800` |
| `line-1` … `line-8` (8) | faint → strong | `line-2` is the de-facto default (451 uses); `line-1`/`-6`/`-7` near-dead (6/4/2) |
| `surface-1` … `surface-5` (5, on top of bare `surface`) | stronger fill | `surface-3/-4/-5` carry the §2 dark-mode caveat |
| `muted-foreground`, `-1`, `-2` (3) | **quiet → loud**, opposite of what the numbers suggest: `gray-500`, `gray-600`, `gray-700` | `-1` is the standard secondary text (1529 uses) |

Two number sets are **not** ramps: `chart-1` … `chart-10` is an unordered categorical set, and `navbar-1`/`-2`, `sidebar-1`/`-2`, `dropdown-1`, `select-1` are alternate *grounds*, each with its own full sub-family (`navbar-2` is `gray-100` in light while `navbar` is `white`).

---

## 8. `--primary` inverts in dark under moon — and what that breaks

moon is monochromatic. In light, primary is the **darkest** thing on the page; in dark it is the **lightest**: `primary` `gray-800` → **`white`**, `primary-foreground` `white` → **`neutral-800`**, `primary-checked` `gray-800` → **`white`**, `primary-hover`/`-focus`/`-active` `gray-900` → `neutral-300`.

In the base (non-moon) theme primary is blue and stays mid-blue in both modes (`primary-600` → `primary-500`) with `--primary-foreground: white` in **both**. Under moon the foreground flips too. Consequences:

1. **Anything hard-coding white content on primary breaks in dark.** Live casualty: `@tailwindcss/forms` paints the checkbox tick as a `background-image` data-URI with `fill="white"` baked in, and a data-URI cannot read a CSS variable — in dark the box turns white and the tick vanishes. `project-moon.css` L286–307 patches it, re-declaring the data-URI with `fill='%23262626'` (= `neutral-800` = `--primary-foreground`) for `[data-theme="theme-moon"].dark input[type="checkbox"]:checked`, `:indeterminate` and `input[type="radio"]:checked`. Any new control whose mark is an image needs the same override — better, draw it with `fill-current`/`stroke-current` so it follows `text-primary-foreground`.
2. **`text-primary` links go near-white in dark** — fine on `bg-background`, invisible on `bg-plain` or a light image overlay. A `bg-primary` button in dark is a white slab, so its border must be `border-primary-line` (transparent both modes); a grey border reads as a seam.
3. **Never substitute a ramp step for the action colour.** `bg-primary-800` is `gray-800` light / `neutral-800` dark — it does *not* invert, so the button silently stops being primary in dark.
4. `secondary` inverts too (`gray-900` → `white`), and `tooltip` (`gray-900` → `white`, foreground `white` → `neutral-800`). `destructive` does **not** — `red-500` in both.

---

## 9. Usage reality — 175 tokens, 108 used, 67 never used

Counts from `data/token-usage.json` (token occurrences) and a grep over `examples/**/*.html` (exact class strings).

**The workhorses.** Ten tokens carry most of the system — token (uses) → most common class string (its own count):

`foreground` (3690) → `text-foreground` (3149) · `primary-focus` (1950) → `focus:text-primary-focus` (823), `focus:border-primary-focus` (564), `focus:ring-primary-focus` (268) · `muted-foreground-1` (1529) → `text-muted-foreground-1` (921), `placeholder:text-muted-foreground-1` (262) · `primary-hover` (1517) → `hover:text-primary-hover` (918) · `primary` (1402) → `text-primary` (766), `bg-primary` (232) · `layer` (1041) → `bg-layer` (755) · `layer-line` (871) → `border-layer-line` (697) · `muted-hover` (572) → `hover:bg-muted-hover` (495) · `primary-checked` (568) → `checked:bg-primary-checked` + `checked:border-primary-checked` (248 each) · `line-2` (451) → `border-line-2` (308)

**Near-unused (≤ 5).** In the theme, unproven in the doc set — if you use one you are the first, so eyeball both modes: `layer-active`, `dropdown-header`, `dropdown-footer`, `background`, `navbar-inverse`, `primary-700` (1 each) · `card-header`, `primary-950`, `sidebar-divider`, `line-7` (2) · `card-divider`, `surface-active` (3) · `chart-5`, `overlay-divider`, `line-6` (4) · `chart-6` (5)

**Never used at all (67).** Clusters, and what to do about them:

| Cluster | Read as |
|---|---|
| `navbar-1-*`, `navbar-2-*`, `sidebar-1-*`, `sidebar-2-*` (~20) | Docs only demo the base sub-family — copy it and swap the prefix. |
| `destructive`, `-foreground`, `-hover`, `-focus` | Every danger button in the examples is raw palette (`bg-red-500 hover:bg-red-600`). The token resolves to the same colours — prefer it in new code. |
| `chart-1/-2/-3/-4/-7/-8/-10` | Charts are configured in JS from `--chart-colors-*`, not classes. |
| `{card,dropdown,select,overlay,footer,sidebar}-inverse`, `scrollbar-*-inverse` | Only `navbar-inverse` (1) and `foreground-inverse` (150) appear anywhere. |
| `navbar-nav-hover`, `-focus`, `-active`, `-divider`, `-list-divider` | Only `navbar-nav-foreground` (72) is exercised, but the sidebar equivalents *are* (132 each) — mirror the sidebar pattern. |
| `background-1`, `background-2`, `border`, `dropdown-1`, `select-1`, `dropdown-item-active`, `footer`, `footer-line`, `primary-300`, `secondary-active` | — |

The bare `--border` token having **zero** uses is the notable one: examples always name a ramp step (`border-line-2`) or a component line (`border-layer-line`, `border-card-line`). Do the same.

---

## 10. Verbatim recipes

Copied unmodified from `examples/`; `cat` the path for the full file.

**Solid primary button** — `examples/base-components/buttons/solid-color-variants.html`

```html
<button type="button" class="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg bg-primary border border-primary-line text-primary-foreground hover:bg-primary-hover focus:outline-hidden focus:bg-primary-hover disabled:opacity-50 disabled:pointer-events-none">
  Button
</button>
```

Secondary swaps only the colour block (`bg-secondary border-secondary-line text-secondary-foreground hover:bg-secondary-hover`); outline and ghost are in §5.

**Text input** — the `layer` + `primary-focus` pattern (`bg-layer border-layer-line` appears 248×); this exact string: `basic-forms/textarea/autoheight.html`

```html
class="py-2 px-3 sm:py-3 sm:px-4 block w-full bg-layer border-layer-line rounded-lg sm:text-sm text-foreground placeholder:text-muted-foreground-1 focus:border-primary-focus focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none"
```

**Custom scrollbar** — 12 copies

```html
class="min-h-130 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb"
```

Verbatim one-liners: card shell `<div class="flex flex-col bg-card border border-card-line shadow-2xs rounded-xl">` · table body `<tbody class="divide-y divide-table-line">` (29×) · avatar `class="inline-block size-11 rounded-full ring-2 ring-layer"` (14×, the ring matches the panel behind it).

**Opacity modifiers work on tokens** — `bg-plain/10`, `bg-primary-500/20`, `bg-plain/90` all appear verbatim.

---

## 11. Checklist before you commit a Preline page

- [ ] No `dark:` on a semantic-token colour utility, and no raw palette colour where a token exists — §1, §5.
- [ ] State variants use the suffixed token (`hover:bg-muted-hover`), never the resting one (`hover:bg-muted`).
- [ ] Action colour is `primary`, not `primary-800`; component chrome uses its own `-line` class — §8.3.
- [ ] Any checked/selected mark drawn as SVG or background-image follows `currentColor` — §8.1.
- [ ] Theme-file edits target the `-border` variable, not `-line`, for the 14 per-component families — §3.

## Files

`reference/moon-token-table.md` — 175 tokens → utility, CSS var, light, dark · `data/moon-tokens.json` — same machine-readable, with oklch, full `var()` chain, `overridden_by_moon` · `data/token-usage.json` — token → count · `assets/css/project-theme.css` — `@theme inline` L1–185, `:root` L187, `.dark` L436 · `assets/css/project-moon.css` — moon light L5, moon dark L145, forms checkmark patch L286–307 · `assets/css/themes/*.css` — upstream Preline 4.2.0 themes, incl. the unforked `moon.css`.
