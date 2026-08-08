---
component: grid
label: Grid
category: layout-and-content
docs: https://preline.co/docs/components/grid.html
examples: 10
js: none
tokens: []
---

# Grid

Stock Tailwind CSS Grid utilities (`grid-cols-*`, `col-span-*`, `grid-flow-*`, `gap-*`) documented as the layout primitive every other Preline component composes on top of.

## When to use
- Any two-dimensional layout: card decks, dashboard tiles, form sections, `<dl>` term/definition pairs.
- Whenever a child must span more than one track (`col-span-2`) or be pinned to a specific line (`col-start-2`) — flexbox cannot do that.
- **Not** for a single row/column of items with unequal intrinsic widths sized by content — use flex utilities.
- **Not** for tabular data — use `table` (`examples/tables/tables/*.html`); a grid loses row/column semantics for screen readers.

## Anatomy

This is `equal-width.html` verbatim — the whole file:

```html
<!-- container declares the tracks + the gutter -->
<div class="grid grid-cols-12 gap-4">
  <!-- children declare how many tracks they occupy -->
  <div class="col-span-4">Column</div>
  <div class="col-span-4">Column</div>
  <div class="col-span-4">Column</div>
</div>
```

Two knobs only: the container owns `grid-cols-* / grid-rows-* / grid-flow-* / gap-*`; each child owns `col-span-* / col-start-* / col-end-* / row-span-* / row-start-* / row-end-*`.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| specifying-the-columns-in-a-grid | Specifying the columns in a grid | `examples/layout-and-content/grid/specifying-the-columns-in-a-grid.html` | `grid grid-cols-4 gap-4` — 4 equal tracks, items flow row-first |
| grid-column-start-end | Spanning Columns | `examples/layout-and-content/grid/grid-column-start-end.html` | `grid-cols-3` with two `col-span-2` children — irregular deck, auto-placement fills the holes |
| starting-and-ending-lines | Starting and ending lines | `examples/layout-and-content/grid/starting-and-ending-lines.html` | `grid-cols-6` + explicit lines: `col-start-2 col-span-4`, `col-start-1 col-end-3`, `col-end-7 col-span-2`, `col-start-1 col-end-7` |
| equal-width | Equal width | `examples/layout-and-content/grid/equal-width.html` | `grid-cols-12` + `col-span-4` ×3 — the 12-column system, thirds |
| specifying-the-rows-in-a-grid | Specifying the rows in a grid | `examples/layout-and-content/grid/specifying-the-rows-in-a-grid.html` | `grid-rows-4 grid-flow-col` — items flow **column-first**, 4 per column |
| spanning-rows | Spanning rows | `examples/layout-and-content/grid/spanning-rows.html` | `grid-rows-3 grid-flow-col` with `row-span-3`, `col-span-2`, `row-span-2 col-span-2` |
| starting-and-ending-lines-second | Starting and ending lines (rows) | `examples/layout-and-content/grid/starting-and-ending-lines-second.html` | Row analogue: `row-start-2 row-span-2`, `row-end-3 row-span-2`, `row-start-1 row-inset-e-4` (see Gotchas) |
| controlling-grid-element-placement | Controlling grid element placement | `examples/layout-and-content/grid/controlling-grid-element-placement.html` | `grid-flow-row-dense` — backfills earlier gaps left by wide items, so DOM order ≠ visual order |
| setting-the-gap-between-elements | Setting the gap between elements | `examples/layout-and-content/grid/setting-the-gap-between-elements.html` | `gap-4` — uniform gutter on both axes |
| changing-row-and-column-gaps-independently | Changing row and column gaps independently | `examples/layout-and-content/grid/changing-row-and-column-gaps-independently.html` | `gap-x-8 gap-y-4` — wider column gutter than row gutter |

## Theme tokens (moon)

_None._ Grid ships zero colour utilities — every example is layout-only, and `index.json` records `"tokens": {}` for this component. Colour comes from whatever you place inside the cells (`bg-layer`, `bg-card`, …).

## Behaviour (JS)

Static markup only -- no Preline JS.

## Gotchas

- **`row-inset-e-4` in `starting-and-ending-lines-second.html` is not a real class.** It is a doc-generator artifact for `row-end-4`: it occurs exactly **once** across all 825 mined examples, while the *same file* uses the valid `row-end-3`, and `col-end-3` / `col-end-7` appear normally in `starting-and-ending-lines.html`. Write `row-end-4`.
- **`inset-s-*` / `inset-e-*` are undefined in this project** (nothing in `resources/css/app.css`, `themes/theme.css`, or `node_modules/preline/variants.css` declares them), which is why anything the docs spell that way silently no-ops. Tailwind v4's logical insets are `start-*` / `end-*`.
- **Grid line numbers are 1-based and there are N+1 of them.** `grid-cols-6` has lines 1…7, so `col-end-7` means "to the trailing edge" — not "column 7". Off-by-one here silently drops the item onto an implicit track instead of erroring.
- **`grid-flow-col` inverts placement order.** `specifying-the-rows-in-a-grid.html` and `spanning-rows.html` both pair `grid-rows-N` with `grid-flow-col`; DOM order then reads top-to-bottom *then* left-to-right. Adding `grid-flow-col` to a row-first layout reshuffles everything.
- **`grid-flow-row-dense` breaks DOM ↔ visual order** (`controlling-grid-element-placement.html`). Tab order follows the DOM, the eye follows the paint — an a11y regression on interactive cells. Use it for image walls, not for forms or link lists.
- **`gap-*` never collapses like margins and is not part of the track size.** Six `col-span-4` children in `grid-cols-12 gap-4` tile exactly two rows; adding `p-4` to the container does not change that. `space-x-*` is **not** a substitute and is **not** inert here: Tailwind v4 compiles it to `:where(& > :not(:last-child)) { margin-inline-start/end: … }` (`node_modules/tailwindcss/dist/lib.js`), a sibling-margin rule with no `display` condition. Inside a grid it still emits those margins — they stack on top of `gap-*` and shift items **within** their tracks instead of resizing the tracks.
- **The literal `...` inside `class="..."` is doc placeholder text.** 5 of the 10 files ship it (`grid-column-start-end`, `starting-and-ending-lines`, `starting-and-ending-lines-second`, `spanning-rows`, `controlling-grid-element-placement`), and `specifying-the-columns-in-a-grid` / `specifying-the-rows-in-a-grid` elide children with an HTML comment. Only `equal-width`, `setting-the-gap-between-elements`, and `changing-row-and-column-gaps-independently` are copy-runnable as-is.
- **Responsive prefixes belong on the container's track count and on each child's span.** `examples/layout-and-content/typography/static-4.html` is the canonical pairing: `grid sm:grid-cols-3` + `sm:col-span-1` / `sm:col-span-2`. Setting `sm:grid-cols-3` without per-child spans leaves every child at width 1.

## Copy-paste base

`examples/layout-and-content/grid/equal-width.html`

```html
<div class="grid grid-cols-12 gap-4">
  <div class="col-span-4">Column</div>
  <div class="col-span-4">Column</div>
  <div class="col-span-4">Column</div>
</div>
```
