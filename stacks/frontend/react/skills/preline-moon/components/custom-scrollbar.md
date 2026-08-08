---
component: custom-scrollbar
label: Custom Scrollbar
category: layout-and-content
docs: https://preline.co/docs/components/custom-scrollbar.html
examples: 2
js: none
tokens: []
---

# Custom Scrollbar

Styles the native WebKit scrollbar of an `overflow-*` container with Tailwind arbitrary-variant selectors (`[&::-webkit-scrollbar]:*`), replacing the OS scrollbar with a thin themed one.

## When to use

- Any bounded scroll region inside the UI shell. 162 example files style a scrollbar; the biggest consumers are `advanced-forms/advanced-select` (45 files), `tables/tables` (19), `basic-forms/textarea` (15), `third-party-plugins/datatables` (12), `navigations/sidebar` (10). Vertical form `[&::-webkit-scrollbar]:w-2` = 179 occurrences in 131 files; horizontal `[&::-webkit-scrollbar]:h-2` = 40 occurrences in 40 files.
- **Only when the container actually scrolls.** These are pure pseudo-element rules; they do nothing without `overflow-y-auto`/`overflow-x-auto` plus a height/width cap (`max-h-*`, `h-*`).
- **Not for the document scrollbar** — put it on the inner container, not `<body>`.
- **Do not follow this doc page's colours.** Use the semantic pair (`bg-scrollbar-track` / `bg-scrollbar-thumb`) — see Theme tokens below. The doc examples are the outlier, not the standard.

## Anatomy

```html
<!-- REDUCED SKELETON. Classes copied from examples/base-components/card/scrollable-body.html line 3,
     which is the same element minus its p-4 padding and my-1.5 me-1.5 margins. -->
<div class="h-80 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb">
  ...
</div>
```

| # | Part | Class | Note |
|---|---|---|---|
| 1 | size cap + overflow | `h-80 overflow-y-auto` | REQUIRED — without a cap nothing overflows, no scrollbar is created, and none of the rules below fire. `max-h-72` is the library's usual cap. |
| 2 | bar thickness | `[&::-webkit-scrollbar]:w-2` | `h-2` instead, for a horizontal bar |
| 3 | groove | `[&::-webkit-scrollbar-track]:bg-scrollbar-track` | |
| 4 | draggable handle | `[&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb` | plus `[&::-webkit-scrollbar-thumb]:rounded-none`, the house default |

Three pseudo-elements, four separate arbitrary variants, all on one element. No wrapper, no data attribute, no Preline class. Note the doc page's own examples use `bg-stone-*` here instead of the tokens — see Theme tokens.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| `basic-usage` | Basic usage | `examples/layout-and-content/custom-scrollbar/basic-usage.html` | Square bar. `max-h-100 overflow-y-auto` + `[&::-webkit-scrollbar]:w-2` + track/thumb fills. Ships **hardcoded** `bg-stone-100`/`bg-stone-300` with a `dark:` pair of `bg-neutral-700`/`bg-neutral-500` instead of the theme tokens. |
| `rounded-corners` | Rounded corners | `examples/layout-and-content/custom-scrollbar/rounded-corners.html` | Same as above plus `[&::-webkit-scrollbar-track]:rounded-full` and `[&::-webkit-scrollbar-thumb]:rounded-full`. These two classes appear **exactly once each** in the whole library — this page. Everywhere else uses `[&::-webkit-scrollbar-thumb]:rounded-none` (216 occurrences). |

## Theme tokens (moon)

Both example files report `tokens: []` in `index.json` — **they use raw palette colours and skip the theme entirely**, which is why this file's frontmatter also says `tokens: []`. The tokens below are the ones the rest of the library uses for this exact job (191 occurrences of the `bg-scrollbar-track` + `bg-scrollbar-thumb` pair across 143 files). Values copied from `reference/moon-token-table.md`.

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `scrollbar-track` | groove behind the handle (`bg-scrollbar-track`) | `gray-100` | `neutral-700` |
| `scrollbar-thumb` | draggable handle (`bg-scrollbar-thumb`) | `gray-300` | `neutral-500` |
| `scrollbar-track-inverse` | groove on an inverse surface — **defined, never used** | `transparent` | `neutral-500` |
| `scrollbar-thumb-inverse` | handle on an inverse surface — **defined, never used** | `white` | `neutral-700` |

`bg-scrollbar-track-inverse` / `bg-scrollbar-thumb-inverse` are valid utilities (the `--color-*` mapping exists) but appear **0 times** in the 825 examples — the only hits for the names are theme dumps under `examples/customization/themes/static-*.html`. There is no worked example to copy; the light values (`transparent` track, `white` thumb) only read as a scrollbar when the surface behind them is dark.

Defined in `assets/css/project-moon.css` (`--scrollbar-track`/`--scrollbar-thumb`, lines 127-128 light / 274-275 dark); the `*-inverse` pair falls through to `assets/css/project-theme.css` (lines 350-351 / 584-585). `project-theme.css` lines 162-165 map each `--scrollbar-*` to `--color-scrollbar-*`, which is what makes `bg-scrollbar-thumb` a real Tailwind utility.

**Light diverges.** The doc's `stone-100`/`stone-300` are warm; moon's tokens are `gray-100`/`gray-300`, cool. Dark happens to match exactly (`neutral-700`/`neutral-500`), so a dark-mode-only review will not catch this.

## Behaviour (JS)

Static markup only -- no Preline JS.

## Gotchas

- **The doc page is stale — do not copy it.** Use `[&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb` and **delete the `dark:` variants**: the token already flips. Copying the doc gives you a hardcoded warm scrollbar that ignores every theme and re-introduces two `dark:` classes the design system exists to remove.
- **WebKit/Blink only.** `::-webkit-scrollbar` is unsupported in Firefox, and there is **no** `scrollbar-width` / `scrollbar-color` fallback anywhere in this library (grep for both across `assets/css/` and `examples/` returns nothing). Firefox users get the OS scrollbar. If Firefox parity matters, add `scrollbar-width`/`scrollbar-color` yourself — it is net-new.
- **Styling `::-webkit-scrollbar` at all opts out of the native scrollbar.** Setting `[&::-webkit-scrollbar]:w-2` without a thumb colour yields an *invisible* scrollbar — the region still scrolls with no visible affordance. The `w-2`/`h-2` and the thumb fill are a package; never ship one without the other.
- **`w-2` vs `h-2` is the axis, and mismatching it is a silent no-op.** Vertical scroll (`overflow-y-auto`) needs `[&::-webkit-scrollbar]:w-2`; horizontal (`overflow-x-auto`, the tables pattern) needs `[&::-webkit-scrollbar]:h-2`. The wrong one leaves the bar at its default thickness with your colours applied.
- **The overflow container needs a size cap.** `overflow-y-auto` with no `max-h-*`/`h-*` never overflows, so no scrollbar is ever created and none of these rules fire. The doc uses `max-h-100` (Tailwind v4 dynamic spacing, 100 × 0.25rem = 25rem); `max-h-72` is the library's most common choice (121 occurrences).
- **House default is square, not round.** `rounded-none` on the thumb outnumbers `rounded-full` 216 to 1. Rounded corners are a documented option nothing else in the system uses — matching neighbouring components means square.
- **Arbitrary variants are literal strings to Tailwind's scanner.** They must appear whole in a scanned file; you cannot build `[&::-webkit-scrollbar-thumb]:bg-` + a variable at runtime. When the string lives in a JS options object, that file must be on the Tailwind content path or the classes are never generated. `dropdownClasses` is where this happens: it is an **HSSelect** option (`data-hs-select`, `assets/js/preline/select.js`; `assets/js/preline/datepicker.js` bundles the same code for its month/year selects) and it carries the full scrollbar string — `examples/advanced-forms/advanced-select/disabled.js` line 65. Combobox has no `*Classes` option at all; the `dropdownClasses` string inside `examples/advanced-forms/combobox/basic-usage.js` line 63 belongs to a `<select data-hs-select>` theme switcher in the demo chrome, not to the combobox.
- **Padding-based inset trick.** Scrollable card bodies inset the bar with margin on the scroll container rather than scrollbar padding: `p-4 my-1.5 me-1.5 h-80 overflow-y-auto ...` (`examples/base-components/card/scrollable-body.html`). There is no scrollbar-gutter usage in the library.

## Copy-paste base

Two theme-correct house patterns, both verbatim. Horizontal — `examples/tables/tables/overflow.html` line 3:

```html
<div class="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb">
```

Vertical — `examples/base-components/card/scrollable-body.html` line 3 (the `my-1.5 me-1.5` is the inset trick from Gotchas; drop it if you do not want it):

```html
<div class="p-4 my-1.5 me-1.5 h-80 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb">
```

For reference, the component's own `examples/layout-and-content/custom-scrollbar/basic-usage.html` verbatim — correct structure, **wrong colours under moon**:

```html
<div class="max-h-100 overflow-y-auto
  [&::-webkit-scrollbar]:w-2
  [&::-webkit-scrollbar-track]:bg-stone-100
  [&::-webkit-scrollbar-thumb]:bg-stone-300
  dark:[&::-webkit-scrollbar-track]:bg-neutral-700
  dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
  ...
</div>
```
