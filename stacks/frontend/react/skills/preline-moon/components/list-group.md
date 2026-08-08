---
component: list-group
label: List Group
category: base-components
docs: https://preline.co/docs/components/list-group.html
examples: 11
js: none
tokens: [layer, layer-line, layer-foreground, primary, primary-hover, primary-focus, primary-foreground, surface, foreground, line-2, muted-foreground, muted-foreground-1]
---

# List Group

A vertical (or `sm:` horizontal) stack of flush-joined rows sharing one border box — used for short, uniform item lists where a table would be overkill.

## When to use

- Short, homogeneous lists: settings, counts, file lists, invoice line items.
- When each row is a whole tap target (link/button rows) rather than a grid of columns.
- **Not** for tabular/sortable/scrollable data — use `ScrollTable` / the table component; a list group has no header, no column alignment, no virtualisation.
- **Not** for a menu attached to a trigger — use `dropdown`.
- **Not** on mobile inside `flex-col` cards (project rule: compact lists with dividers beat cards) — the `flush` variant is exactly that list.

## Anatomy

Reduced skeleton — every class below appears in `examples/base-components/list-group/example.html`.

```html
<!-- container: sets width + stacking direction, carries NO theme -->
<ul class="max-w-xs w-full flex flex-col">
  <!-- row: carries the whole theme + the border-collapse + corner rounding -->
  <li class="inline-flex items-center gap-x-2 py-3 px-4 text-sm font-medium
             bg-layer border border-layer-line text-layer-foreground
             -mt-px first:rounded-t-lg first:mt-0 last:rounded-b-lg">
    Newsletter
  </li>
</ul>
```

Mechanism: every row draws a full border; `-mt-px` pulls each row up by exactly the 1px border so adjacent borders overlap into one line, and `first:mt-0` cancels it on the first row. Only the first/last rows are rounded, so the stack reads as one box.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Default | Default list group | `examples/base-components/list-group/example.html` | Baseline `ul`/`li`, `bg-layer` + `border-layer-line` + `text-layer-foreground`, `-mt-px` collapse. |
| Icons | List items with icons | `examples/base-components/list-group/icons.html` | Prepends `<svg class="shrink-0 size-4">`; `gap-x-2` on the row spaces it. Nothing else changes. |
| Links | Linked items | `examples/base-components/list-group/links.html` | `ul/li` → `div/a`, `gap-x-3.5`, adds `focus:z-10 focus:outline-hidden focus:ring-2 focus:ring-primary`. Active row `text-primary`; normal row `text-layer-foreground hover:text-primary-hover`; "disabled" row `text-muted-foreground cursor-not-allowed`. |
| Buttons | Button items | `examples/base-components/list-group/buttons.html` | Same as links with `<button type="button">` and `disabled:opacity-50 disabled:pointer-events-none` + a real `disabled` attribute. |
| Striped | Striped rows | `examples/base-components/list-group/striped.html` | Adds `odd:bg-surface` alongside `bg-layer` on every row. |
| Flush | Flush list group | `examples/base-components/list-group/flush.html` | Drops `bg-layer`/`border`/rounding entirely; `divide-y divide-line-2` moves to the `ul`, text becomes `text-foreground`. |
| No gutters | Without horizontal padding | `examples/base-components/list-group/no-gutters.html` | `flush` minus `px-4` (note the resulting double space in `py-3  text-sm`). |
| Horizontal | Horizontal layout | `examples/base-components/list-group/horizontal.html` | Container `sm:flex-row`; rows add `sm:-ms-px sm:mt-0 sm:first:rounded-se-none sm:first:rounded-es-lg sm:last:rounded-es-none sm:last:rounded-se-lg`. Vertical collapse still applies below `sm`. |
| Badges | List items with badges | `examples/base-components/list-group/badges.html` | Adds `<span class="ms-auto ... rounded-full bg-primary text-primary-foreground">`; `ms-auto` pushes it to the row end. |
| Invoice | Invoice summary | `examples/base-components/list-group/invoice.html` | Row wraps `<div class="flex items-center justify-between w-full">` for label/value; total row swaps `bg-layer`→`bg-surface` and adds `font-semibold`. |
| Download list | Download list | `examples/base-components/list-group/list-group-examples.html` | Border collapse moves to the container as `-space-y-px` (rows have no `-mt-px`); `p-3`; row action is a `<button>` in `text-muted-foreground-1 hover:text-primary-hover focus:text-primary-focus`; filename truncates via `me-3 flex-1 w-0 truncate`. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` (`bg-layer`) | Resting row surface | `white` | `neutral-800` |
| `layer-line` (`border-layer-line`) | The collapsed 1px row border | `gray-200` | `neutral-700` |
| `layer-foreground` (`text-layer-foreground`) | Row text **on `bg-layer`** | `gray-800` | `white` |
| `surface` (`odd:bg-surface`, invoice total) | Alternate / emphasis row fill | `gray-100` | `neutral-700` |
| `foreground` (`text-foreground`) | Row text in `flush`/`no-gutters` (no layer behind it) | `gray-800` | `neutral-200` |
| `line-2` (`divide-line-2`) | Divider in `flush`/`no-gutters` | `gray-200` | `neutral-700` |
| `primary` (`text-primary`, `focus:ring-primary`) | Active row text + focus ring | `gray-800` | `white` |
| `primary-hover` (`hover:text-primary-hover`) | Row text on hover | `gray-900` | `neutral-300` |
| `primary-focus` (`focus:text-primary-focus`) | Row action text on keyboard focus | `gray-900` | `neutral-300` |
| `primary-foreground` (`text-primary-foreground`) | Badge text on `bg-primary` | `white` | `neutral-800` |
| `muted-foreground` (`text-muted-foreground`) | Disabled link row | `gray-500` | `neutral-500` |
| `muted-foreground-1` (`text-muted-foreground-1`) | Resting row-action button | `gray-600` | `neutral-400` |

## Behaviour (JS)

Static markup only -- no Preline JS.

## Gotchas

- **Two mutually exclusive collapse mechanisms.** Rows use `-mt-px first:mt-0`; `list-group-examples.html` instead puts `-space-y-px` on the `<ul>` and omits `-mt-px`. Applying both pulls rows up 2px and clips the borders. Pick one.
- **`first:`/`last:` are structural.** Wrapping rows in a conditional `<template>`/`<div>`, or rendering an empty node first, moves `first:rounded-t-lg first:mt-0` onto the wrong element — you get an unrounded top and a 1px gap. In React, render the array directly as siblings.
- **Striping inverts under moon.** `layer` is `white`/`neutral-800`; `surface` is `gray-100`/`neutral-700`. So `odd:bg-surface` rows are **darker** than the base in light and **lighter** than the base in dark. Fine, but do not hardcode a "darker stripe" assumption.
- **`layer-foreground` ≠ `foreground` in dark.** `layer-foreground` is `white` (dark) because it is paired with `bg-layer`. `flush`/`no-gutters` have no layer behind them and correctly use `text-foreground` (`neutral-200`). Copying `text-layer-foreground` into a flush list gives pure-white text straight on the page background.
- **The "disabled" link is not disabled.** `links.html` gives the third `<a>` only `cursor-not-allowed` + `text-muted-foreground` — it keeps `href="#"`, stays focusable and still navigates. Only `buttons.html` really blocks (real `disabled` attribute + `disabled:pointer-events-none`). For a non-interactive row use a `<button disabled>` or drop the `href`.
- **`focus:z-10` is load-bearing**, not decoration: without it the focus ring on a middle row is painted under the next row's border and half of it disappears.
- **Horizontal keeps the vertical rules.** `horizontal.html` still carries `-mt-px first:rounded-t-lg last:rounded-b-lg` for the sub-`sm` stack; removing them to "clean up" breaks the mobile layout, not the desktop one.
- `bg-primary` badge + `text-primary-foreground` flips completely under moon dark (`white` fill, `neutral-800` text). It is a monochrome badge in both modes — it will not read as a colour-coded status.

## Copy-paste base

`examples/base-components/list-group/example.html`

```html
<!-- List Group -->
<ul class="max-w-xs w-full flex flex-col">
  <li class="inline-flex items-center gap-x-2 py-3 px-4 text-sm font-medium bg-layer border border-layer-line text-layer-foreground -mt-px first:rounded-t-lg first:mt-0 last:rounded-b-lg">
    Newsletter 
  </li>
  <li class="inline-flex items-center gap-x-2 py-3 px-4 text-sm font-medium bg-layer border border-layer-line text-layer-foreground -mt-px first:rounded-t-lg first:mt-0 last:rounded-b-lg">
    Downloads 
  </li>
  <li class="inline-flex items-center gap-x-2 py-3 px-4 text-sm font-medium bg-layer border border-layer-line text-layer-foreground -mt-px first:rounded-t-lg first:mt-0 last:rounded-b-lg">
    Team Account 
  </li>
</ul>
<!-- End List Group -->
```
