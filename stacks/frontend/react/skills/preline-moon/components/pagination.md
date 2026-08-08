---
component: pagination
label: Pagination
category: navigations
docs: https://preline.co/docs/components/pagination.html
examples: 20
js: none
tokens: [foreground, muted-hover, muted-focus, line-2, surface-1, muted-foreground-1, muted-foreground, primary-hover, primary-focus, tooltip, tooltip-line, tooltip-foreground, layer, layer-line, layer-hover, layer-focus, dropdown, dropdown-line, primary, surface-focus]
---

# Pagination

A `<nav aria-label="Pagination">` holding prev / page-number / next `<button>`s; there is no plugin — you render the whole page window server-side and mark the current page yourself.

## When to use

- Page-windowed lists where the total page count is known (`paginate()` responses with `meta.last_page`).
- Compact variant (`mini-size`) when you only have "page N of M" and no page list.
- **Not** for infinite scroll / "load more" — nothing here maintains state, and there is no JS to hook.
- **Not** as a generic segmented control — that is `tabs` (`hs-tab-active:` variants + panel switching) or `button-group`.

## Anatomy

Reduced skeleton. Every class appears in `examples/navigations/pagination/example.html` and `bordered-group.html`.

```html
<nav class="flex items-center gap-x-1" aria-label="Pagination">     <!-- gap-x-1 = separated; -space-x-px = grouped -->
  <button type="button" class="min-h-9.5 min-w-9.5 py-2 px-2.5 inline-flex justify-center items-center gap-x-1.5
                 text-sm rounded-lg text-foreground hover:bg-muted-hover focus:bg-muted-focus
                 disabled:opacity-50 disabled:pointer-events-none" aria-label="Previous">…</button>

  <div class="flex items-center gap-x-1">                           <!-- page window; omitted in the grouped variant -->
    <button class="… bg-surface-1 text-foreground …" aria-current="page">1</button>   <!-- CURRENT: fill, no hover -->
    <button class="… text-foreground hover:bg-muted-hover focus:bg-muted-focus …">2</button>
  </div>

  <button type="button" class="… " aria-label="Next">…</button>
</nav>
```

Three structural switches: `gap-x-1` vs `-space-x-px` on the `<nav>` (separated vs joined pills), the presence of the inner `<div class="flex items-center gap-x-1">` (grouped variants drop it so `first:rounded-s-lg last:rounded-e-lg` can reach every child), and `justify-center` / `justify-end` on the `<nav>` for alignment.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Default | Default pagination | `examples/navigations/pagination/example.html` | Baseline. Chevrons carry `hidden` — text-only Previous/Next. `aria-current="page"` on "1" but **no** active fill. |
| With icons | Pagination with icons | `examples/navigations/pagination/working-with-icons.html` | Byte-identical to `example.html` minus `hidden` on the two chevron SVGs. |
| Disabled + active | Disabled and active states | `examples/navigations/pagination/disabled-and-active-state.html` | Prev gets the `disabled` attribute; the current page swaps `hover:bg-muted-hover focus:bg-muted-focus` for `bg-surface-1`. |
| Bordered | Bordered pagination | `examples/navigations/pagination/bordered.html` | Every button gets `border border-transparent`; current page uses `border border-line-2` instead of a fill. Labels become `sr-only`. |
| Bordered group | Bordered group pagination | `examples/navigations/pagination/bordered-group.html` | `<nav>` becomes `-space-x-px`, inner `<div>` removed, each button `border border-line-2 first:rounded-s-lg last:rounded-e-lg`; current adds `bg-surface-1`. Labels `hidden sm:block`. |
| Compact | Compact pagination | `examples/navigations/pagination/mini-size.html` | Page window replaced by three `<span>`s: boxed current, then `of` and total in `text-muted-foreground-1`. No page buttons at all. |
| With tooltip | Pagination with tooltip | `examples/navigations/pagination/working-with-tooltip.html` | Inserts `<div class="hs-tooltip inline-block">` holding a `•••` button that swaps to a chevron on `group-hover`, plus `hs-tooltip-content` on `bg-tooltip`. 3 navs (basic/bordered/grouped). Needs the tooltip plugin. |
| Page jumper | Page jumper | `examples/navigations/pagination/jumper.html` | Wraps nav + a `Go to [number input] page` block in `grid justify-center sm:flex sm:justify-between`. Input is `bg-layer border-layer-line focus:border-primary-focus focus:ring-primary-focus` with both webkit spinners suppressed. |
| With dropdown | Pagination with dropdown | `examples/navigations/pagination/more-with-dropdown.html` | Same wrapper, but the right side is an `hs-dropdown` with `[--placement:top-left]`, `bg-dropdown border-dropdown-line`, and a `text-primary` check on the selected page-size row. Needs the dropdown plugin. |
| Full width | Full-width pagination | `examples/navigations/pagination/stretched.html` | `<nav>` becomes `flex justify-between items-center gap-x-1`, pushing prev/next to the edges. Labels `hidden sm:block` + `aria-hidden="true"`. |
| Centered | Centered pagination | `examples/navigations/pagination/alignment.html` | Adds `justify-center` to the `<nav>` in all 4 styles. |
| Right aligned | Right-aligned pagination | `examples/navigations/pagination/alignment-with-justify-end.html` | Same file shape with `justify-end`. |
| Sizes — default | Default sizes | `examples/navigations/pagination/sizes-basic.html` | Three sizes off `min-h-8/min-w-8 py-1 px-2 text-xs rounded-md`, `min-h-9.5 … text-sm rounded-lg`, `min-h-11.5 py-3 px-4 rounded-lg` (icons `size-3.5` → `size-4` → `size-5`). Uses `focus:bg-surface-focus` on the current page. |
| Sizes — bordered | Bordered sizes | `examples/navigations/pagination/sizes-bordered.html` | Same three sizes applied to the `border border-line-2` style. |
| Sizes — bordered group | Bordered group sizes | `examples/navigations/pagination/sizes-bordered-group.html` | Same three sizes on the `-space-x-px` joined style; adds the intermediate `min-h-7.5 / min-h-9 / min-h-11` steps. All 3 `<nav>`s are `flex justify-end items-center -space-x-px` — this file and `shape-bordered-group.html` are the only two whose size demos are right-aligned; the other six sizes/shape files all use `flex items-center gap-x-1`. |
| Sizes — compact | Compact sizes | `examples/navigations/pagination/sizes-mini-size.html` | Three sizes of the "1 of 3" compact form. |
| Rounded — default | Default rounded sizes | `examples/navigations/pagination/shape-basic.html` | `sizes-basic` with every `rounded-lg` / `rounded-md` on the page buttons swapped for `rounded-full`. |
| Rounded — bordered | Bordered rounded sizes | `examples/navigations/pagination/shape-bordered.html` | `sizes-bordered` with `rounded-full`. |
| Rounded — bordered group | Bordered group rounded sizes | `examples/navigations/pagination/shape-bordered-group.html` | `sizes-bordered-group` with `first:rounded-s-full last:rounded-e-full`. |
| Rounded — compact | Compact rounded sizes | `examples/navigations/pagination/shape-mini.html` | Compact form with `rounded-full`. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `foreground` (`text-foreground`) | Every page number and prev/next label | `gray-800` | `neutral-200` |
| `muted-hover` (`hover:bg-muted-hover`) | Hover fill on non-current pages | `gray-100` | `neutral-700` |
| `muted-focus` (`focus:bg-muted-focus`) | Keyboard-focus fill (same colour as hover) | `gray-100` | `neutral-700` |
| `surface-1` (`bg-surface-1`) | Current-page fill (`aria-current="page"`) | `gray-200` | `neutral-600` |
| `surface-focus` (`focus:bg-surface-focus`) | Focus fill on the current page in the size demos | `gray-200` | `neutral-600` |
| `line-2` (`border-line-2`) | Cell border in bordered / grouped / compact variants | `gray-200` | `neutral-700` |
| `muted-foreground-1` (`text-muted-foreground-1`) | The `of` / total in the compact form; jumper input placeholder | `gray-600` | `neutral-400` |
| `muted-foreground` (`text-muted-foreground`) | Resting colour of the `•••` overflow button | `gray-500` | `neutral-500` |
| `primary-hover` (`hover:text-primary-hover`) | `•••` button on hover | `gray-900` | `neutral-300` |
| `primary-focus` (`focus:text-primary-focus`, `focus:border-`/`focus:ring-`) | `•••` focus colour; jumper input focus ring | `gray-900` | `neutral-300` |
| `layer` (`bg-layer`) | Jumper number-input surface | `white` | `neutral-800` |
| `layer-line` (`border-layer-line`) | Jumper input border | `gray-200` | `neutral-700` |
| `layer-hover` / `layer-focus` (`hover:bg-` / `focus:bg-`) | Page-size dropdown trigger fill states | `gray-50` | `neutral-700` |
| `dropdown` (`bg-dropdown`) | Page-size menu surface | `white` | `neutral-900` |
| `dropdown-line` (`border-dropdown-line`) | Page-size menu border — **transparent in both modes** | `transparent` | `transparent` |
| `primary` (`text-primary`) | Check icon on the selected page-size row | `gray-800` | `white` |
| `tooltip` (`bg-tooltip`) | Tooltip bubble surface — inverts vs the page | `gray-900` | `white` |
| `tooltip-foreground` (`text-tooltip-foreground`) | Tooltip text | `white` | `neutral-800` |
| `tooltip-line` (`border-tooltip-line`) | Tooltip border — transparent in both modes | `transparent` | `transparent` |

## Behaviour (JS)

Static markup only — no Preline JS. `index.json` reports zero `hs_js` and zero `data-hs-*` on this component (grep confirms: no `data-hs-` attribute in any of the 20 files). Nine examples embed *other* plugins via classes: `working-with-tooltip`, `jumper`, `more-with-dropdown`, `sizes-basic`, `sizes-bordered`, `sizes-bordered-group`, `shape-basic`, `shape-bordered`, `shape-bordered-group` all carry `hs-tooltip` / `hs-tooltip-toggle` / `hs-tooltip-content` and need `HSTooltip`; the same set minus `working-with-tooltip` and `jumper` (7 files) also carries `hs-dropdown` / `hs-dropdown-menu` and needs `HSDropdown`. Everything else — which page is current, which arrows are disabled, how many numbers to render — is yours to emit per request.

## Gotchas

- **`jusify-center` (missing `t`) is in the shipped markup** of 8 of the 20 files: `alignment.html`, `alignment-with-justify-end.html`, `jumper.html`, `more-with-dropdown.html`, `shape-basic.html`, `sizes-basic.html`, `stretched.html`, `working-with-tooltip.html` (2 occurrences each except `shape-basic` / `sizes-basic`, which have 6). It is not a Tailwind class and generates nothing; the buttons still centre because `min-w-*` + the icon/label pair happen to fill the box. Fix it to `justify-center` when you copy, or drop it.
- **The default example has no visible active state.** `example.html` puts `aria-current="page"` on "1" but leaves the full hover/focus class set on it — screen readers announce the current page, sighted users see nothing. The active fill (`bg-surface-1`, or `border-line-2` in the bordered style) only appears from `disabled-and-active-state.html` onward. Always merge that class swap in.
- **The current page must also lose its hover classes.** In every correct variant the active button is `bg-surface-1 … focus:outline-hidden` with no `hover:bg-muted-hover` / `focus:bg-muted-focus` — leave them on and hovering the current page repaints it `gray-100`/`neutral-700`, i.e. *lighter* than its own active fill in light mode.
- **`hover` and `focus` are the same colour under moon** (`muted-hover` = `muted-focus` = `gray-100`/`neutral-700`). Keyboard focus is invisible next to a mouse hover, and `focus:outline-hidden` removes the native ring. If keyboard navigation matters, add your own ring.
- **`example.html` ships the chevrons with `hidden`.** If you copy the default and wonder where the arrows went, that is why — `working-with-icons.html` is the same file with `hidden` removed.
- **Grouped variants delete the inner wrapper on purpose.** `first:rounded-s-lg last:rounded-e-lg` resolve against the `<nav>`'s children; keep the `<div class="flex items-center gap-x-1">` around the numbers and only the wrapper is first/last, so the rounding lands on the wrong elements and `-space-x-px` no longer collapses the borders.
- **`border-dropdown-line` and `border-tooltip-line` are `transparent` in both moon modes.** The dropdown menu is separated from the page by `shadow-md` alone, and the tooltip by its inverted `bg-tooltip`. Don't expect a hairline.
- **`disabled:pointer-events-none` needs the real `disabled` attribute**, not a class — `disabled-and-active-state.html` sets the attribute on the Prev `<button>`. On an `<a>` these utilities do nothing; use `<button>` as every example does, or switch to `pointer-events-none opacity-50` the way `navs/with-ul-list.html` does for links.
- **`min-h-9.5` / `min-w-9.5` / `min-h-11.5` are Tailwind v4 arbitrary-step spacing.** They only compile under the v4 spacing scale that this theme assumes; on a v3 build they silently drop and the touch target collapses to the padding.

## Copy-paste base

`examples/navigations/pagination/working-with-icons.html` (smallest canonical prev / pages / next; add `bg-surface-1` to the current page — see Gotchas)

```html
<!-- Pagination -->
<nav class="flex items-center gap-x-1" aria-label="Pagination">
  <button type="button" class="min-h-9.5 min-w-9.5 py-2 px-2.5 inline-flex justify-center items-center gap-x-1.5 text-sm rounded-lg text-foreground hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus disabled:opacity-50 disabled:pointer-events-none" aria-label="Previous">
    <svg aria-hidden="true" class="shrink-0 size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    <span>Previous</span>
  </button>
  <div class="flex items-center gap-x-1">
    <button type="button" class="min-h-9.5 min-w-9.5 flex justify-center items-center text-foreground hover:bg-muted-hover py-2 px-3 text-sm rounded-lg focus:outline-hidden focus:bg-muted-focus disabled:opacity-50 disabled:pointer-events-none" aria-current="page">1</button>
    <button type="button" class="min-h-9.5 min-w-9.5 flex justify-center items-center text-foreground hover:bg-muted-hover py-2 px-3 text-sm rounded-lg focus:outline-hidden focus:bg-muted-focus disabled:opacity-50 disabled:pointer-events-none">2</button>
    <button type="button" class="min-h-9.5 min-w-9.5 flex justify-center items-center text-foreground hover:bg-muted-hover py-2 px-3 text-sm rounded-lg focus:outline-hidden focus:bg-muted-focus disabled:opacity-50 disabled:pointer-events-none">3</button>
  </div>
  <button type="button" class="min-h-9.5 min-w-9.5 py-2 px-2.5 inline-flex justify-center items-center gap-x-1.5 text-sm rounded-lg text-foreground hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus disabled:opacity-50 disabled:pointer-events-none" aria-label="Next">
    <span>Next</span>
    <svg aria-hidden="true" class="shrink-0 size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
  </button>
</nav>
<!-- End Pagination -->
```
