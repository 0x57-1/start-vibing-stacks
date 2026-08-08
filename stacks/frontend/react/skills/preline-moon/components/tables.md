---
component: tables
label: Tables
category: tables
docs: https://preline.co/docs/components/tables.html
examples: 19
js: none
tokens: [foreground, primary, muted-foreground-1, primary-focus, primary-hover, table-line, primary-checked, scrollbar-track, scrollbar-thumb, line-3, muted-hover, layer, surface, muted]
---

# Tables

Static `<table>` markup styled with moon tokens: a horizontally scrollable wrapper, a token-ruled grid, and optional stripes, hover, borders, caption, footer, checkbox column, search bar and pagination bar.

## When to use

- Tabular data you render server-side or from React state, where sorting/filtering/paging is your own code (or absent).
- You want the visual shell only — every "interactive" example here (search input, pagination buttons, select-all checkbox) is inert markup.
- **Do NOT use** when you need real client-side sort/search/paging: use `datatables` instead (`data-hs-datatable`, `HSDataTable`, 13 examples) — it requires jQuery + DataTables.net on the page.
- **Do NOT use** for key/value detail panes or a list of records with one action each — `list-group` / `card` read better and do not need horizontal scroll.

## Anatomy

Reduced skeleton. Every class below appears verbatim in `examples/tables/tables/*.html`.

```html
<div class="min-w-full">                                  <!-- outer, no theme -->
  <div class="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-none
              [&::-webkit-scrollbar-track]:bg-scrollbar-track
              [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb">   <!-- scroll box; border/rounded/shadow go HERE -->
    <table class="min-w-full divide-y divide-table-line">  <!-- rule BETWEEN thead/tbody/tfoot -->
      <thead>                                              <!-- optional: bg-muted -->
        <tr>                                               <!-- optional: divide-x divide-table-line -->
          <th scope="col" class="px-6 py-3 text-start text-xs font-medium text-muted-foreground-1 uppercase">…</th>
      <tbody class="divide-y divide-table-line">           <!-- rule BETWEEN rows -->
        <tr>                                               <!-- optional: odd:bg-layer even:bg-surface hover:bg-muted-hover -->
          <td class="px-6 py-4 whitespace-nowrap text-sm text-foreground">…</td>
```

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Default table | Default table | `examples/tables/tables/example.html` | Baseline: `divide-y divide-table-line` on both `<table>` and `<tbody>`, no wrapper border. |
| Striped rows | Striped rows | `examples/tables/tables/striped-rows.html` | `<tbody>` loses `divide-y`; each `<tr>` gets `odd:bg-layer even:bg-surface`. |
| Hoverable rows | Hoverable rows | `examples/tables/tables/hoverable-rows.html` | `<tr class="hover:bg-muted-hover">`; `<tbody>` keeps `divide-y`. |
| Hoverable + striped | Hoverable rows | `examples/tables/tables/hoverable-rows-with-striped-variants.html` | `<tr class="odd:bg-layer even:bg-surface hover:bg-muted-hover">` — see Gotchas, hover is invisible on even rows. |
| Highlighted rows or cells | Highlighted rows or cells | `examples/tables/tables/highlighted-tables.html` | Per-`<td>` fills: `bg-primary-100 dark:bg-primary-500/20`, `bg-orange-100 dark:bg-orange-500/20`, `bg-red-100 dark:bg-red-500/20`. |
| Bordered table | Bordered tables | `examples/tables/tables/bordered-tables.html` | Scroll box gains `border border-table-line` (no rounding). |
| Without borders | Tables without borders | `examples/tables/tables/tables-without-borders.html` | `<table>` drops `divide-y divide-table-line`; only `<tbody>` keeps it, so no header rule. |
| Rounded corners | Rounded corners | `examples/tables/tables/rounded-tables.html` | Scroll box gains `border border-table-line rounded-lg`; `<table>` has no `divide-y`. |
| Vertically divided header | Vertically divided header | `examples/tables/tables/thead-vertically-divided.html` | Scroll box gains `border border-table-line rounded-lg`; `<tr class="divide-x divide-table-line">` on the head row only; body columns stay undivided. |
| Muted header | Muted header | `examples/tables/tables/header-in-stone-color.html` | `<thead class="bg-muted">` inside a `border border-table-line rounded-lg` box. |
| Table with shadow | Table with shadow | `examples/tables/tables/with-shadow.html` | Muted header + `shadow-xs` on the `border border-table-line rounded-lg` scroll box. |
| Without table header | Without table header | `examples/tables/tables/headless.html` | `<thead>` deleted entirely; `<tbody class="divide-y divide-table-line">` only, inside a `border border-table-line rounded-lg shadow-xs` scroll box. |
| Table footer | Table footer | `examples/tables/tables/table-foot.html` | Third row moves out of `<tbody>` into `<tfoot>`; the `<table>`-level `divide-y` is what rules it off from `<tbody>`. |
| Table captions | Table captions | `examples/tables/tables/captions.html` | `<caption class="py-2 text-start text-sm text-muted-foreground-2">` as first child of `<table>`. |
| Horizontal scrolling | Horizontal scrolling | `examples/tables/tables/overflow.html` | Same wrapper, 6 columns; overflow comes from `whitespace-nowrap` on every cell, not a min-width. |
| Selectable rows | Selectable rows | `examples/tables/tables/selection.html` | `border border-table-line rounded-lg` box + `<thead class="bg-muted">`; leading `py-3 ps-4` checkbox column: `border-line-3 … text-primary` + `checked:bg-primary-checked checked:border-primary-checked` + `<label class="sr-only">`. |
| Table with search | Table with search | `examples/tables/tables/search-input.html` | `selection.html` plus a `py-3 px-4 border-b border-table-line` strip holding a `bg-layer border-layer-line` input + inline search SVG; the checkbox `<th>` becomes `py-3 px-4 pe-0` and every checkbox id gains a `-search` infix. |
| Table with pagination | Table with pagination | `examples/tables/tables/with-pagination.html` | `search-input.html` plus a `py-1 px-4 border-t border-table-line` footer `<nav class="flex items-center space-x-1" aria-label="Pagination">` of `hover:bg-muted-hover focus:bg-muted-focus rounded-full` buttons. |
| Table layout with `<div>` | Table layout with `<div>` | `examples/tables/tables/table-layout-using-div-tag.html` | No `<table>`: `table border-collapse table-auto w-full divide-y divide-table-line` + `table-header-group` / `table-row-group divide-y divide-table-line bg-layer` / `table-row` / `table-cell`. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `foreground` | Body cell text (`text-foreground`), pagination button text | `gray-800` | `neutral-200` |
| `muted-foreground-1` | `<th>` uppercase label, search input placeholder | `gray-600` | `neutral-400` |
| `muted-foreground-2` | `<caption>` text | `gray-700` | `neutral-300` |
| `muted-foreground` | Search icon SVG | `gray-500` | `neutral-500` |
| `table-line` | Every rule: `divide-y`, `divide-x`, wrapper `border`, header `border-b`, footer `border-t` | `gray-200` | `neutral-700` |
| `muted` | `<thead>` fill (`bg-muted`) | `gray-50` | `neutral-800` |
| `layer` | Odd stripe, search input background, `table-row-group` fill in the div variant | `white` | `neutral-800` |
| `surface` | Even stripe | `gray-100` | `neutral-700` |
| `muted-hover` | Row hover fill, pagination button hover fill | `gray-100` | `neutral-700` |
| `muted-focus` | Pagination button focus fill | `gray-100` | `neutral-700` |
| `primary` | Row action text, checkbox accent (`text-primary`) | `gray-800` | `white` |
| `primary-hover` | Row action hover text | `gray-900` | `neutral-300` |
| `primary-focus` | Row action focus text; search input focus border + ring | `gray-900` | `neutral-300` |
| `primary-checked` | Checked checkbox fill and border | `gray-800` | `white` |
| `primary-100` | Highlighted cell fill, light only | `gray-100` | `neutral-100` |
| `primary-500` | Highlighted cell fill at `/20`, dark only | `gray-500` | `neutral-500` |
| `line-3` | Resting checkbox border (`border-line-3`) | `gray-300` | `neutral-600` |
| `layer-line` | Search input border | `gray-200` | `neutral-700` |
| `scrollbar-track` | Webkit horizontal scrollbar track | `gray-100` | `neutral-700` |
| `scrollbar-thumb` | Webkit horizontal scrollbar thumb | `gray-300` | `neutral-500` |

## Behaviour (JS)

Static markup only -- no Preline JS. `index.json` reports `hs_js: []` and `hs_attrs: []` for all 19 examples.

The `id="hs-table-checkbox-all"` / `id="hs-table-search"` names look like Preline hooks and are not — nothing in `assets/js/preline/` queries them. Select-all, the search box and the pagination buttons are dead until you wire them.

For real behaviour, switch to the `datatables` component: wrapper attribute `data-hs-datatable` (JSON options), children `data-hs-datatable-search`, `-page-entities`, `-paging`, `-paging-pages`, `-paging-prev`, `-paging-next`, `-info` (+ `-info-from` / `-info-to` / `-info-length`), `-row-selecting-all`, `-row-selecting-individual`. `HSDataTable.autoInit()` runs on `window load` over `[data-hs-datatable]:not(.--prevent-on-load-init)` and **logs an error and does nothing if `jQuery` or `DataTable` is undefined** (`assets/js/preline/datatable.js`). Instance access: `HSDataTable.getInstance(elOrSelector, true)`; teardown: `.destroy()`.

## Gotchas

- **Two independent `divide-y divide-table-line`.** On `<table>` it rules thead↔tbody↔tfoot; on `<tbody>` it rules row↔row. `tables-without-borders.html` and `rounded-tables.html` drop only the `<table>` one, so the header rule disappears and row rules stay. Delete the wrong one and a different line vanishes.
- **Stripes and row rules are mutually exclusive in the doc set.** `striped-rows.html` has a bare `<tbody>`. Keeping `divide-y` too paints a `table-line` border on top of every stripe boundary.
- **Hover is a no-op on even striped rows under moon:** `muted-hover` and `surface` are the *same* colour in both schemes (`gray-100` / `neutral-700`), so in `hoverable-rows-with-striped-variants.html` only odd rows react.
- **Stripe contrast collapses in dark:** `layer`=`neutral-800` vs `surface`=`neutral-700` are adjacent, where light is `white` vs `gray-100`. Don't rely on stripes alone to separate rows in dark.
- **Highlighted cells are the only place a hand-written `dark:` is required.** `bg-primary-100` is `gray-100` light but `neutral-100` dark — a near-white cell under `neutral-200` text. Always copy both halves: `bg-primary-100 dark:bg-primary-500/20`.
- **`rounded-lg` only clips because `overflow-x-auto` sits on the same element.** Move the rounding to `<table>`, or drop the overflow, and `bg-muted` on `<thead>` squares off the top corners.
- **Scrollbar styling is webkit-only and horizontal-only.** `[&::-webkit-scrollbar]:h-2` sets height, not width — add `w-2` if the wrapper also scrolls vertically. Firefox ignores `scrollbar-track` / `scrollbar-thumb` entirely.
- **Overflow comes from `whitespace-nowrap` on every `<td>`, not from a width.** `overflow.html` sets no `min-w-*` past `min-w-full`; drop `whitespace-nowrap` on a column and it wraps instead of forcing scroll.
- **`table-line` is indistinguishable from card/panel borders under moon** (`gray-200` / `neutral-700`, same as `border`, `layer-line`, `card-line`) — a bordered table inside a bordered card draws a double hairline.
- **In the project fork the `table-line` utility does NOT read `--table-line`.** `assets/css/project-theme.css:157` maps `--color-table-line: var(--table-border)`, and `--table-border` is only ever set in that file's base blocks — `:root` line 343 (`--color-gray-200`) and `.dark` line 578 (`--color-neutral-700`). `assets/css/project-moon.css` still declares `--table-line` at line 124 / 269 inside `[data-theme="theme-moon"]`, but nothing reads it, so those two lines are inert. Values happen to coincide, so there is no visual bug today — but re-tinting the table rule for moon means setting `--table-border`, not `--table-line`. Upstream is the other way round: `assets/css/themes/theme.css:245` maps `--color-table-line: var(--table-line)`, and `themes/moon.css` never overrides it (falls through to `theme.css` 449/710, same `gray-200` / `neutral-700`).
- **The search strip and the pagination footer sit INSIDE `overflow-x-auto`**, as siblings of `<table>` (`search-input.html` lines 4-14, `with-pagination.html` lines 109-125). A wide table scrolls the search box and the pager off-screen with it. Move them outside the scroll box if you want them pinned.
- **`scope="col"` and `<label class="sr-only">` are load-bearing** — the checkbox column has no visible header text and no visible label.
- **The `<div>` layout variant swaps `min-w-full` for `border-collapse table-auto w-full`** on the element that replaces `<table>`, carries `divide-y divide-table-line` on *both* that element and `table-row-group`, and puts the body fill on `table-row-group` (`bg-layer`) instead of per-row.
- **`overflow.html` ships mismatched columns.** Headers read Name / Title / Age / Email / Address / Action, but every body row is Name / Title / *email* / *age* / Address / Action — the email lands under the "Age" header. Copy the markup, then fix the order or the headers.
- **Nothing to re-init on dynamic render** — but if you swap in `data-hs-datatable`, `autoInit()` fires only on `window load`, so call `new HSDataTable(el)` yourself after a client-side render.

## Copy-paste base

`examples/tables/tables/example.html`

```html
<!-- Table -->
<div class="min-w-full">
  <div class="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb">
    <table class="min-w-full divide-y divide-table-line">
      <thead>
        <tr>
          <th scope="col" class="px-6 py-3 text-start text-xs font-medium text-muted-foreground-1 uppercase">Name</th>
          <th scope="col" class="px-6 py-3 text-start text-xs font-medium text-muted-foreground-1 uppercase">Age</th>
          <th scope="col" class="px-6 py-3 text-start text-xs font-medium text-muted-foreground-1 uppercase">Address</th>
          <th scope="col" class="px-6 py-3 text-end text-xs font-medium text-muted-foreground-1 uppercase">Action</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-table-line">
        <tr>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">John Brown</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-foreground">45</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-foreground">New York No. 1 Lake Park</td>
          <td class="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
            <button type="button" class="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg text-primary hover:text-primary-hover focus:outline-hidden focus:text-primary-focus disabled:opacity-50 disabled:pointer-events-none">Delete</button>
          </td>
        </tr>

        <tr>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">Jim Green</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-foreground">27</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-foreground">London No. 1 Lake Park</td>
          <td class="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
            <button type="button" class="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg text-primary hover:text-primary-hover focus:outline-hidden focus:text-primary-focus disabled:opacity-50 disabled:pointer-events-none">Delete</button>
          </td>
        </tr>

        <tr>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">Joe Black</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-foreground">31</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-foreground">Sidney No. 1 Lake Park</td>
          <td class="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
            <button type="button" class="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg text-primary hover:text-primary-hover focus:outline-hidden focus:text-primary-focus disabled:opacity-50 disabled:pointer-events-none">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
<!-- End Table -->
```
