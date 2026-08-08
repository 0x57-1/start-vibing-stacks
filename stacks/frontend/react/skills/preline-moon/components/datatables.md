---
component: datatables
label: Datatables
category: third-party-plugins
docs: https://preline.co/docs/components/datatables.html
examples: 13
js: HSDataTable (+ HSSelect, HSDropdown)
tokens: [foreground, primary, primary-checked, primary-hover, primary-focus, table-line, line-1, line-2, line-3, muted-hover, muted-focus, muted-active, muted-foreground, muted-foreground-1, muted-foreground-2, layer, layer-line, layer-foreground, layer-hover, layer-focus, select, select-line, select-item-foreground, select-item-hover, select-item-focus, dropdown, dropdown-line, dropdown-divider, scrollbar-track, scrollbar-thumb, surface-1]
---

# Datatables

A sortable / searchable / paginated table built on the third-party **DataTables.net** (jQuery) library; `HSDataTable` wraps it and rewires every control to your own markup, addressed by `data-hs-datatable-*` attributes, so nothing DataTables renders itself is visible.

## When to use
- Client-side tables where the whole dataset is already in the DOM and the user needs sort + search + paging.
- Column visibility, column reorder, CSV/PDF/print export, fixed header, scrollable `tbody` — each is a DataTables extension plus a handful of Preline attributes.
- **Do not use** for server-paginated data unless you also configure DataTables' `ajax`/`serverSide` yourself; none of the 12 examples does, and the info counter assumes the full set is present.
- **Do not use** for a static list of rows with no interaction — that is `table` markup, no jQuery, no DataTables.
- **Do not use** for a two-column key/value panel — `description-lists` is the right shape.

## Anatomy

Reduced skeleton. The `data-hs-datatable` element is the **wrapper**, never the `<table>`; every control lives inside it and is found by attribute (classes verbatim from `examples/third-party-plugins/datatables/example.html` and `search-input.html`):

```html
<div class="flex flex-col" data-hs-datatable='{
  "pageLength": 10,
  "pagingOptions": { "pageBtnClasses": "min-w-10 flex justify-center items-center text-foreground hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus py-2.5 text-sm rounded-full disabled:opacity-50 disabled:pointer-events-none" }
}'>

  <!-- optional: search. Any number of them; all stay in sync -->
  <input type="text" class="… bg-layer border-layer-line …" data-hs-datatable-search>

  <div class="min-h-130 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb">
    <table class="min-w-full">                       <!-- found via wrapper.querySelector('table') -->
      <thead class="border-b border-table-line">
        <tr>
          <th scope="col" class="py-1 group text-start font-normal focus:outline-hidden">
            <div class="py-1 px-2.5 inline-flex items-center border border-transparent text-sm text-muted-foreground-1 rounded-md hover:border-line-2">
              Name
              <svg class="size-3.5 ms-1 -me-0.5 text-muted-foreground" …>
                <path class="hs-datatable-ordering-desc:text-primary" d="m7 15 5 5 5-5"></path>
                <path class="hs-datatable-ordering-asc:text-primary"  d="m7 9 5-5 5 5"></path>
              </svg>
            </div>
          </th>
          <th scope="col" class="… --exclude-from-ordering">Action</th>   <!-- opts this column out of sorting -->
        </tr>
      </thead>
      <tbody class="divide-y divide-table-line"> … </tbody>
    </table>
  </div>

  <!-- paging: ships with `hidden`; JS un-hides it when pages > 1 -->
  <div class="flex items-center space-x-1 mt-4 hidden" data-hs-datatable-paging>
    <button type="button" class="… text-foreground hover:bg-muted-hover focus:bg-muted-focus …" data-hs-datatable-paging-prev>«</button>
    <div class="flex items-center space-x-1 [&>.active]:bg-muted-active" data-hs-datatable-paging-pages></div>
    <button type="button" class="…" data-hs-datatable-paging-next>»</button>
  </div>
</div>
```

Optional counter block (verbatim from `multiple-controls.html`, whitespace collapsed):

```html
<div class="whitespace-nowrap text-sm text-muted-foreground-1" data-hs-datatable-info>
  Showing <span data-hs-datatable-info-from></span> to <span data-hs-datatable-info-to></span> of <span data-hs-datatable-info-length></span> users
</div>
```

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| Library tags | Heads Up! | `examples/third-party-plugins/datatables/how-to-use-assets-library.html` | `jquery.min.js` **then** `dataTables.min.js`. Both globals (`jQuery`, `DataTable`) are checked at load; either missing logs a console error and skips autoInit. |
| Default datatable | Default datatable | `examples/third-party-plugins/datatables/example.html` | Baseline: sortable head with the twin-arrow SVG, `divide-table-line` body, paging footer. No search, no page-size select. Action column is `--exclude-from-ordering`. |
| Scrollable tbody | Scrollable tbody | `examples/third-party-plugins/datatables/scrollable-table-body-tbody.html` (+ `.css`) | `"scrollY": "470px"`, `pageLength: 15`; footer gains `pt-4 border-t border-table-line`. Ships a CSS rule `.dt-scroll-body thead { display: none !important; }` — DataTables clones the header into the scroll body and it must be hidden. |
| Row selection | Row selection | `examples/third-party-plugins/datatables/selection.html` | `"selecting": true` + `rowSelectingOptions.selectAllSelector: "#hs-table-checkbox-all"`. Header and body checkboxes carry, verbatim: `shrink-0 size-4 bg-transparent border-line-3 rounded-sm shadow-2xs text-primary focus:ring-0 focus:ring-offset-0 checked:bg-primary-checked checked:border-primary-checked disabled:opacity-50 disabled:pointer-events-none`. |
| Table search | Table search | `examples/third-party-plugins/datatables/search-input.html` | Adds one `data-hs-datatable-search` input (`ps-9` with an absolutely-positioned magnifier) and a `language.zeroRecords` empty state (`text-muted-foreground-1` icon + `text-muted-foreground-2` copy). `<thead>` switches to `border-y`. |
| Table filters | Table filters | `examples/third-party-plugins/datatables/filter.html` (+ `.js`) | Header row = search + page-size `HSSelect` + an `hs-dropdown [--auto-close:inside]` holding min/max number inputs on `bg-dropdown border-dropdown-line`. Wrapper carries `--prevent-on-load-init` (the JS constructs it). One of the two examples whose `language.zeroRecords` is the illustrated SVG empty state (`fill-layer`, `stroke-line-1`, `fill-surface-1`) — `multiple-controls.html` is the other. JS registers `dataTable.search.fixed('range', fn)` and calls `dataTable.draw()` on input. |
| Column filters | Column filters | `examples/third-party-plugins/datatables/column-filter.html` (+ `.js`) | `"ordering": false`; the filters move **into** `<thead>` — a name `HSSelect` styled as a bare toggle, plus per-column dropdowns for age (two number inputs) and address (text). One `search.fixed` predicate ANDs all three. |
| Hidden columns | Hidden columns | `examples/third-party-plugins/datatables/hidden-columns.html` (+ `.js`) | A `multiple` `HSSelect` (`placeholder: "Hide Columns"`, `toggleCountText`) whose `change` handler runs `dataTable.columns().every(...)` → `column.visible(false)` for selected indices. Wrapper carries `--prevent-on-load-init`. |
| Fixed table header | Fixed table header | `examples/third-party-plugins/datatables/fixed-header.html` (+ `.js`) | Loads `dataTables.fixedHeader.min.js`; constructed in JS with `{fixedHeader:{header:true, headerOffset}}` (offset is breakpoint-dependent: 100 / 112 / 55). Extra scroll wrapper `min-w-full inline-block align-middle` + `overflow-hidden`. JS keeps two different nodes in sync: a `MutationObserver` sets `.dtfh-floatingparent` **width** from the scroll container, and the container's `scroll` handler sets `.fixedHeader-floating` `style.transform = translateX(-scrollLeft)`. |
| Combined controls | Combined controls | `examples/third-party-plugins/datatables/multiple-controls.html` | The kitchen sink: **two** search inputs, **two** page-size selects, **two** paging blocks and **two** info blocks (header and footer), all kept in sync by the wrapper. `rowSelectingOptions.individualSelector: ".hs-datatable-select-row"`. Same illustrated `zeroRecords` empty state as `filter.html` (`fill-layer`, `stroke-line-1`, `fill-surface-1`) — those two files are the only users of those three utilities. |
| Column Actions | Column Actions | `examples/third-party-plugins/datatables/column-actions.html` (+ `.js`) | Loads `dataTables.colReorder.min.js`, `"colReorder": true`. All 5 `<th>`s carry `data-hs-datatable-col-index` (`0`…`4`), but only the 3 data columns (Name / Age / Address) get the menu — each an `hs-dropdown` of 4 buttons: `data-hs-datatable-col-sorting="asc"` / `="desc"`, `data-hs-datatable-col-reorder="left"` / `="right"`. The checkbox and Action columns get an index and nothing else, which is what `moveColumn`'s `newPos >= 1 && newPos < headers.length - 1` guard protects. All columns are `--exclude-from-ordering` — sorting goes through the menu, not the header click. |
| Export actions | Export actions | `examples/third-party-plugins/datatables/export.html` (+ `.js`) | `layout.topStart.buttons: ["copy","csv","excel","pdf","print"]` is what makes DataTables *instantiate* the five Buttons; the visible `hs-dropdown` buttons carry `data-hs-datatable-action-type` and `export.js` proxies with `dataTable.button('.buttons-' + type).trigger()`. Needs 6 extra scripts: buttons + jszip + pdfmake + vfs_fonts + buttons.html5 + buttons.print. |
| Destroy and reinitialize | Destroy and reinitialize | `examples/third-party-plugins/datatables/destroy-and-reinitialize.html` (+ `.js`) | Export-style table **without** `--prevent-on-load-init` (it must auto-init first). Buttons call `HSDataTable.getInstance(el, true).element.destroy()` and `HSDataTable.autoInit()`. |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `foreground` | Cell text, page buttons, dropdown item labels | `gray-800` | `neutral-200` |
| `table-line` | Head rule (`border-b border-table-line`) and row dividers (`divide-table-line`) | `gray-200` | `neutral-700` |
| `muted-foreground-1` | Column headers, info counter, empty-state icon | `gray-600` | `neutral-400` |
| `muted-foreground` | The idle sort chevrons | `gray-500` | `neutral-500` |
| `muted-foreground-2` | Empty-state copy; column-action menu items | `gray-700` | `neutral-300` |
| `line-2` | Header hover outline (`hover:border-line-2` on a `border-transparent` chip) | `gray-200` | `neutral-700` |
| `line-3` | Checkbox border (`border-line-3`) | `gray-300` | `neutral-600` |
| `primary` | Active sort arrow (`hs-datatable-ordering-*:text-primary`), row action link, checkbox accent | `gray-800` | `white` |
| `primary-checked` | Checked checkbox fill + border | `gray-800` | `white` |
| `primary-hover` / `primary-focus` | Row action link hover / focus | `gray-900` | `neutral-300` |
| `muted-hover` / `muted-focus` | Hover / focus fill on page buttons and menu items | `gray-100` | `neutral-700` |
| `muted-active` | Current page pill (`[&>.active]:bg-muted-active`) | `gray-100` | `neutral-700` |
| `layer` / `layer-line` / `layer-foreground` | Search input and select/dropdown **toggles** | `white` / `gray-200` / `gray-800` | `neutral-800` / `neutral-700` / `white` |
| `layer-hover` / `layer-focus` | Hover / focus fill on those same toggles | `gray-50` | `neutral-700` |
| `select` / `select-line` | `HSSelect` panel fill / border | `white` / `transparent` | `neutral-900` / `transparent` |
| `select-item-foreground` / `select-item-hover` / `select-item-focus` | Options inside the `HSSelect` panel | `gray-800` / `gray-100` / `gray-100` | `neutral-200` / `neutral-800` / `neutral-800` |
| `dropdown` / `dropdown-line` / `dropdown-divider` | `hs-dropdown` panel fill / border / section rule | `white` / `transparent` / `gray-200` | `neutral-900` / `transparent` / `neutral-800` |
| `scrollbar-track` / `scrollbar-thumb` | Horizontal scrollbar on the table wrapper | `gray-100` / `gray-300` | `neutral-700` / `neutral-500` |
| `surface-1` / `line-1` | Illustration fills/strokes in the `filter.html` **and** `multiple-controls.html` empty states | `gray-200` / `gray-100` | `neutral-600` / `neutral-700` |

**Moon has no accent hue here.** `primary` and `primary-checked` both resolve to `white` in dark, so a checked row checkbox is a solid white square and the sorted-column arrow is white — the affordance is a value flip, not a colour. Keep `text-primary` and `checked:bg-primary-checked checked:border-primary-checked` together; dropping either leaves the checked state indistinguishable.

Two places bypass the tokens. The export dropdown panel — identical in `export.html` and `destroy-and-reinitialize.html` — is `hs-dropdown-menu … bg-white rounded-xl shadow-xl dark:bg-neutral-900`, with no `bg-dropdown border-dropdown-line` (they do still use `dropdown-divider` on the section rule). And `column-filter.html`'s name select keeps `bg-select border-select-line` on the panel but swaps its `optionClasses` for `text-gray-800 … hover:bg-muted-hover … focus:bg-muted-focus` — note `text-gray-800` has **no** `dark:` pair, so those option labels stay dark-on-dark. Prefer the token forms from `filter.html` / `column-actions.html`.

## Behaviour (JS)
Source: `assets/js/preline/datatable.js` (`HSDataTable`, v4.2.0). Global: `window.HSDataTable`. Depends on `jQuery` + `DataTable`; `HSSelect` for page-size selects and `HSDropdown` for the menus.

| Attribute / class | Effect |
|---|---|
| `data-hs-datatable='{…}'` | On the **wrapper**. JSON options merged over `{searching:true, lengthChange:false, order:[], columnDefs:[…]}` then over constructor options. |
| `--prevent-on-load-init` | Excluded from `autoInit()` (`[data-hs-datatable]:not(.--prevent-on-load-init)`). |
| `--exclude-from-ordering` | On a `thead th/td` → pushed into `columnDefs` as `{targets: index, orderable: false}`. |
| `data-hs-datatable-search` | Any number of inputs; `input` (debounced) → `dataTable.search(v).draw()`. |
| `data-hs-datatable-page-entities` | `<select>`s of page sizes; `change` → `page.len(n).draw()` and syncs the other selects via `HSSelect.getInstance(el, true).element.setValue()`. |
| `data-hs-datatable-paging` | Container; gets `hidden` + `style.display:none` while `pages < 2`. |
| `data-hs-datatable-paging-prev` / `-next` | Click → `page('previous'\|'next').draw('page')`; gain `.disabled` + `disabled` at the ends. |
| `data-hs-datatable-paging-pages` | Filled by JS with `<button data-page="N">`; `pagingOptions.pageBtnClasses` applied per button; current gets `.active`. Window is 3 pages wide (`maxPagesToShow`), with `<span class="ellipsis">...</span>` fillers. |
| `data-hs-datatable-info` + `-info-from` / `-info-to` / `-info-length` | Refreshed on every `draw` from `dataTable.page.info()`. |
| `data-hs-datatable-action-type` | **Not read by the wrapper** — a convention `export.js` reads itself to pick the DataTables Buttons target. |
| `data-hs-datatable-col-index` / `-col-reorder` / `-col-sorting` | Also wrapper-agnostic; `column-actions.js` reads them and drives `colReorder.move()` / `order().draw()`. |

- **Row selection** is enabled by the presence of `rowSelectingOptions`. `selectAllSelector` (default `[data-hs-datatable-row-selecting-all]`) is resolved with `document.querySelector` — **not scoped to the wrapper**. `individualSelector` defaults to `[data-hs-datatable-row-selecting-individual]`.
- **Escape hatch:** `new HSDataTable(sel)` returns an object whose `.dataTable` is the raw DataTables API — `filter.js`, `hidden-columns.js`, `export.js` and `column-actions.js` all work through it (`search.fixed`, `columns().every`, `button().trigger`, `colReorder.move`).
- **Statics:** `HSDataTable.autoInit()`, `HSDataTable.getInstance(elOrSelector, true)` → `{id, element}`.
- **Ordering variants** `hs-datatable-ordering-asc:` / `hs-datatable-ordering-desc:` come from `assets/css/src/plugins/datatable/variants.css` (imported at `assets/css/variants.css:20`; that source file is not part of this offline mirror). They are applied to the two `<path>`s of the header chevron so the active direction picks up `text-primary`.

## Gotchas
- **`data-hs-datatable` goes on the wrapper `<div>`, not the `<table>`.** The constructor does `this.table = this.el.querySelector('table')`. Put it on the table and every control lookup returns an empty list and `this.table` is `null`.
- **A page-size select silently overrides `pageLength`.** `this.concatOptions.pageLength = parseInt(this.pageEntitiesList[0].value)` runs after the merge, so `"pageLength": 25` in JSON is discarded whenever a `data-hs-datatable-page-entities` select exists with `10` selected.
- **The info counter is not filter-aware.** `data-hs-datatable-info-length` is filled from `page.info().recordsTotal` (the unfiltered total), while the page buttons are built from `rows({search:'applied'}).count()`. After a search you get "Showing 1 to 3 of 40" with only one page — that is the shipped behaviour, not your bug.
- **`destroy()` leaks the search listener.** Handlers are added with `addEventListener('input', fn)` but removed with `removeEventListener('click', fn)`. After destroy + reinit the old debounced handler still fires into a dead DataTable. Re-create the input, or keep and reuse one instance.
- **Paging markup must ship with `hidden`.** The wrapper only *removes* `hidden` once `pages >= 2`; a footer without it flashes an empty pager on single-page tables.
- **`.ellipsis` is unstyled.** `buildPagingPage` injects `<span class="ellipsis">...</span>` with no Tailwind classes and `pageBtnClasses` does not apply to it. Add a rule if you paginate past 3 pages.
- **`selectAllSelector` is global.** Two datatables on one page whose select-all checkboxes share an id (or both fall back to the default attribute) will cross-wire. Give each a unique id, as every multi-control example does.
- **`scrollY` needs the extra CSS.** Without `.dt-scroll-body thead { display: none !important; }` DataTables' cloned header renders a second, ghost header row inside the scroll area.
- **Export needs six scripts, in order**, and the buttons must also be declared in `layout.topStart.buttons` — the visible dropdown only triggers what DataTables already registered. Omit the `layout` block and `dataTable.button('.buttons-csv')` throws.
- **Column reorder invalidates your indices.** `column-actions.js` re-stamps `data-hs-datatable-col-index` from `dataTable.column(i).index()` after every move; DOM position and DataTables column index diverge otherwise.
- **`--prevent-on-load-init` is required whenever JS constructs the instance**, and forbidden when JS only calls `getInstance` (the destroy/reinit example deliberately omits it so the first `autoInit()` registers the entry).
- **Re-init after dynamic render:** `autoInit()` prunes collection entries whose `el` left the document and skips ones still present, so a framework that replaces the wrapper is fine — but a framework that replaces only `<tbody>` leaves DataTables' cached row set stale. Call `dataTable.clear().rows.add(...).draw()` or destroy and rebuild.
- A11y: sort chevrons are decorative `<svg>` with no `aria-sort` on the `<th>`, and the pager buttons are generated without `aria-current`. The `«`/`»` glyphs are `aria-hidden` with `sr-only` text next to them — keep that pattern when restyling.

## Copy-paste base

`examples/third-party-plugins/datatables/example.html` — the smallest correct table, reduced to one header cell and one body row (elided rows are identical but for their text; head/paging markup is verbatim):

```html
<!-- Table -->
<div class="flex flex-col" data-hs-datatable='{
  "pageLength": 10,
  "pagingOptions": {
    "pageBtnClasses": "min-w-10 flex justify-center items-center text-foreground hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus py-2.5 text-sm rounded-full disabled:opacity-50 disabled:pointer-events-none"
  }
}'>
  <div class="min-h-130 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb">
    <table class="min-w-full">
      <thead class="border-b border-table-line">
        <tr>
          <th scope="col" class="py-1 group text-start font-normal focus:outline-hidden">
            <div class="py-1 px-2.5 inline-flex items-center border border-transparent text-sm text-muted-foreground-1 rounded-md hover:border-line-2">
              Name
              <svg class="size-3.5 ms-1 -me-0.5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path class="hs-datatable-ordering-desc:text-primary" d="m7 15 5 5 5-5"></path><path class="hs-datatable-ordering-asc:text-primary" d="m7 9 5-5 5 5"></path></svg>
            </div>
          </th>

          <th scope="col" class="py-2 px-3 text-end font-normal text-sm text-muted-foreground-1 --exclude-from-ordering">Action</th>
        </tr>
      </thead>

      <tbody class="divide-y divide-table-line">
        <tr>
          <td class="p-3 whitespace-nowrap text-sm font-medium text-foreground">Christina Bersh</td>
          <td class="p-3 whitespace-nowrap text-end text-sm font-medium">
            <button type="button" class="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg text-primary hover:text-primary-hover focus:outline-hidden focus:text-primary-focus disabled:opacity-50 disabled:pointer-events-none">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div class="flex items-center space-x-1 mt-4 hidden" data-hs-datatable-paging>
    <button type="button" class="p-2.5 min-w-10 inline-flex justify-center items-center gap-x-2 text-sm rounded-full text-foreground hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus disabled:opacity-50 disabled:pointer-events-none" data-hs-datatable-paging-prev>
      <span aria-hidden="true">«</span>
      <span class="sr-only">Previous</span>
    </button>
    <div class="flex items-center space-x-1 [&>.active]:bg-muted-active" data-hs-datatable-paging-pages></div>
    <button type="button" class="p-2.5 min-w-10 inline-flex justify-center items-center gap-x-2 text-sm rounded-full text-foreground hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus disabled:opacity-50 disabled:pointer-events-none" data-hs-datatable-paging-next>
      <span class="sr-only">Next</span>
      <span aria-hidden="true">»</span>
    </button>
  </div>
  <!-- End Footer -->
</div>
<!-- End Table -->
```
