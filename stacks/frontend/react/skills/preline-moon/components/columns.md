---
component: columns
label: Columns
category: layout-and-content
docs: https://preline.co/docs/components/columns.html
examples: 3
js: none
tokens: []
---

# Columns

CSS multi-column layout (`column-count` / `column-width`) via Tailwind's `columns-*` utilities, for flowing a stream of images or text into newspaper-style columns.

## When to use

- Content where **reading order is top-to-bottom within a column** and the item count is unknown/variable: image walls, long prose split into columns, masonry-ish galleries.
- **Do NOT use for grids.** Multicol fills column 1 to the bottom, then column 2. If you want row-major left-to-right order (cards, product tiles, dashboards), use `grid grid-cols-3` instead — reaching for `columns-3` there silently shuffles the reading order.
- **Do NOT use for equal-height cells or any item that must align across columns.** Multicol has no row concept; nothing lines up horizontally.
- Prefer `columns-3xs` (width-driven) over a `sm:/md:/lg:` ladder of counts — the browser derives the count from the container and you write one class.

## Anatomy

```html
<!-- REDUCED SKELETON: examples/layout-and-content/columns/setting-the-column-gap.html
     with the trailing " ..." class placeholders stripped. -->
<div class="gap-8 columns-3">              <!-- gutter + column count (or columns-3xs = column width) -->
  <img class="w-full aspect-[16/9]" src="..." />   <!-- w-full is REQUIRED: fill the column box -->
  <img class="w-full aspect-square" src="..." />
</div>
```

There is no wrapper, no data attribute and no Preline class. The parent carries the entire layout; children only need to be block-level and full-width.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| `basic-usage` | Adding based on column count | `examples/layout-and-content/columns/basic-usage.html` | `columns-3` — fixed **column count**; column width is derived from the container. Count is a maximum: a narrow container renders fewer. |
| `adding-based-on-column-width` | Adding based on column width | `examples/layout-and-content/columns/adding-based-on-column-width.html` | `columns-3xs` — fixed **column width** (named size from Tailwind's container scale); the **count** is derived and reflows on resize. Inherently responsive, no breakpoints. |
| `setting-the-column-gap` | Setting the column gap | `examples/layout-and-content/columns/setting-the-column-gap.html` | Adds `gap-8` to `columns-3`. On a multicol box `gap-*` resolves to `column-gap`. This is the only example that sets a gutter. |

The doc page also has a `Basic usage` `<h2>` with no example attached — the `basic-usage.html` file is filed under *Adding based on column count*. Don't hunt for a fourth file.

## Theme tokens (moon)

**None.** `index.json` reports `tokens: {}` for the component and `tokens: []` for each of the three examples. `columns-*`, `gap-*`, `w-full` and `aspect-*` are pure geometry utilities — they emit no colour, so nothing here changes between moon light and moon dark.

Colour arrives from whatever you put *inside* the container. If those are cards, they carry their own tokens (`bg-card`, `border-card-line`, `text-foreground`); see `components/card.md`.

## Behaviour (JS)

Static markup only -- no Preline JS.

## Gotchas

- **`w-full` on children is load-bearing.** Every doc example puts `w-full` on the `<img>`. A replaced element at intrinsic width does not shrink to the column box, so without it wide images overflow the column and blow out the gutter.
- **Reading order is column-major.** Items 1..n fill the first column top-to-bottom before the second starts. Anything numbered, ranked, or read left-to-right is wrong in `columns-*`. This is the single most expensive mistake with this component.
- **No default gutter you can rely on.** Tailwind's `columns-*` sets only `column-count`/`column-width`; with no `gap-*` the browser uses `column-gap: normal`, which is font-size relative (~1em), so the gutter drifts with the text size of the container. Set `gap-*` explicitly — 2 of the 3 examples omit it and look inconsistent side by side.
- **Items split across column breaks.** A card, `<figure>` or paragraph can be cut in half at the bottom of a column. Nothing in this library guards against it: `break-inside` appears **zero** times across all 825 examples. If an item must stay whole, add `break-inside-avoid` yourself — it is not part of any Preline example.
- **`columns-3` is a ceiling, not a promise.** The browser drops to 2 or 1 when the container is too narrow. Do not build a design that requires exactly three columns to be legible; use `columns-3xs` if the width per column is what actually matters.
- **`gap-y-*` does nothing here.** Multicol has no rows, so only the `column-gap` half of `gap` applies. Vertical spacing between stacked items comes from the items' own margins.
- **Not the same as masonry.** It looks like masonry because column heights balance, but the ordering is column-major, not the shortest-column-next placement masonry implies.
- **Nothing else in the library uses multicol.** Across all 825 examples the utilities appear only on this doc page: `columns-3` 2×, `columns-3xs` 1×. There is no house pattern to imitate and no shipped component that flows content into columns. (The other `columns-*` grep hits — `hs-table-hidden-columns-checkbox-1`, `#hs-datatable-with-hidden-columns-select` in `examples/third-party-plugins/datatables/` — are element ids, not Tailwind utilities.)

## Copy-paste base

`examples/layout-and-content/columns/setting-the-column-gap.html` — the only variant with an explicit gutter, so it is the correct starting point:

```html
<div class="gap-8 columns-3 ...">
  <img class="w-full aspect-[16/9] ..." src="..." />
  <img class="w-full aspect-square ..." src="..." />
  <!-- ... -->
</div>
```
