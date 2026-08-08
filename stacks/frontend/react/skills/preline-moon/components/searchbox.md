---
component: searchbox
label: SearchBox
category: advanced-forms
docs: https://preline.co/docs/components/searchbox.html
examples: 7
js: HSComboBox
tokens: [select-item-hover, select-item-focus, select-item-foreground, select, select-line, layer, layer-line, layer-hover, layer-focus, foreground, muted-foreground, muted-foreground-1, muted-foreground-2, primary, primary-focus, primary-foreground, overlay, overlay-line, overlay-divider, scrollbar-track, scrollbar-thumb, surface-1]
---

# SearchBox

A `HSComboBox` wired as a search/command palette: a text input plus a results panel populated either from a remote JSON URL or from static child markup, filtered as you type.

## When to use
- Typeahead over a list you fetch (`apiUrl`) or that is already in the DOM (static `[data-hs-combo-box-output-item]` children).
- Command palette / global search opened by a keyboard shortcut — use the modal form (`preventVisibility: true` + `HSOverlay`).
- Do NOT use for a bounded set of choices bound to a form field: that is `select` (`HSSelect`, `data-hs-select`), which owns a real `<select>` and submits a value. SearchBox writes plain text into an `<input>`.
- Do NOT use when the click target should navigate — that still works, but you must set `preventSelection: true` (see Gotchas).

## Anatomy

Reduced skeleton (classes copied from `examples/advanced-forms/searchbox/json-example-in-dropdown.html`):

```html
<!-- root: holds the JSON config; gets .active / .has-value from JS -->
<div class="relative" data-hs-combo-box='{ "apiUrl": "...", "groupingType": "default", "isOpenOnFocus": true }'>
  <div class="relative">
    <!-- query field: REQUIRED, exactly one per root -->
    <input class="py-2.5 py-3 ps-10 pe-4 block w-full bg-layer border-layer-line rounded-lg sm:text-sm text-foreground placeholder:text-muted-foreground-1 focus:border-primary-focus focus:ring-primary-focus"
           type="text" role="combobox" aria-expanded="false" data-hs-combo-box-input>
  </div>

  <!-- results panel. DROPDOWN form ships inline style="display: none;" -->
  <div class="absolute z-50 w-full bg-select border border-select-line rounded-lg shadow-xl p-2"
       style="display: none;" data-hs-combo-box-output>
    <!-- optional scroll container; when omitted, items append into [data-hs-combo-box-output] -->
    <div class="max-h-72 overflow-y-auto [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb"
         data-hs-combo-box-output-items-wrapper></div>
  </div>
</div>
```

Per-item hooks live inside `outputItemTemplate` (JSON mode) or on the static children (HTML mode) — see the attribute table under Behaviour.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Dropdown, remote JSON | Dropdown searchbox | `examples/advanced-forms/searchbox/json-example-in-dropdown.html` | Baseline. `apiUrl` + `apiGroupField` + `groupingType:"default"` + `isOpenOnFocus:true`; panel is absolute with inline `display:none`. |
| Clear selection on empty | Clear selection on empty | `examples/advanced-forms/searchbox/json-example-preserve-selection-on-empty.html` | Baseline plus `"preserveSelectionOnEmpty": false` — emptying the input drops `selected`/`value`/`currentData` instead of restoring the last pick on close. (Only other delta: the panel is `w-full p-1 bg-select …` instead of `w-full bg-select … p-2`.) |
| Modal + shortcut | Modal search with K shortcut | `examples/advanced-forms/searchbox/json-example-using-modal-popup-with-shortcut-call.html` (+ `.js`) | `preventVisibility:true`, no `isOpenOnFocus`, panel has NO `display:none` and NO items-wrapper; wrapped in `hs-overlay` with a hidden `data-hs-overlay` trigger. Sibling JS binds `evt.code === "Slash"`. |
| Tab filters, dropdown | Dropdown with tab filters | `examples/advanced-forms/searchbox/json-example-with-tab-filter-in-dropdown.html` | `groupingType:"tabs"` turns `groupingTitleTemplate` into `<button>` tabs and adds `tabsWrapperTemplate`; tabs style through `hs-combo-box-tab-active:`. Live API (`fakestoreapi.com`). |
| Tab filters, modal + shortcut | Modal tab-filter search with \ shortcut | `examples/advanced-forms/searchbox/json-example-with-tab-filter-using-modal-popup-with-shortcut-call.html` (+ `.js`) | Tabs inside the overlay; `tabsWrapperTemplate` border switches to `border-overlay-divider`. Sibling JS binds `evt.code === "Backslash"`. |
| HTML data, dropdown | Dropdown with HTML data | `examples/advanced-forms/searchbox/html-example-in-dropdown.html` | No `apiUrl`, no `outputItemTemplate`. Rows are hand-written `[data-hs-combo-box-output-item]` children, each carrying its own group JSON — 3 rows `'{"group": {"name": "recent", "title": "Recent"}}'` and 3 rows `'{"group": {"name": "people", "title": "People"}}'`, plus an explicit `tabindex`. Each row wraps an `<a href>`, so `preventSelection:true`. |
| HTML data, modal + shortcut | Modal search with : shortcut | `examples/advanced-forms/searchbox/html-example-using-modal-popup-with-shortcut-call.html` (+ `.js`) | Same static rows inside the overlay; `preventVisibility` + `preventSelection` + `isOpenOnFocus`. Sibling JS binds `evt.code === "Semicolon" && evt.shiftKey`. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` | Input resting fill (`bg-layer`) | `white` | `neutral-800` |
| `layer-line` | Input border (`border-layer-line`); resting tab border | `gray-200` | `neutral-700` |
| `layer-hover` | Tab `<button>` hover fill (`groupingTitleTemplate`, tab-filter files only) | `gray-50` | `neutral-700` |
| `layer-focus` | Tab `<button>` focus fill (same template) | `gray-50` | `neutral-700` |
| `foreground` | Typed query text, static row labels | `gray-800` | `neutral-200` |
| `muted-foreground` | Magnifier icon, secondary row text | `gray-500` | `neutral-500` |
| `muted-foreground-1` | Placeholder, group heading text | `gray-600` | `neutral-400` |
| `muted-foreground-2` | Row leading icons, resting tab label | `gray-700` | `neutral-300` |
| `primary-focus` | Input focus border + ring | `gray-900` | `neutral-300` |
| `primary` | Selected-row check icon; active tab fill | `gray-800` | `white` |
| `primary-foreground` | Active tab label on `bg-primary` | `white` | `neutral-800` |
| `select` | Dropdown panel fill (`bg-select`) | `white` | `neutral-900` |
| `select-line` | Dropdown panel border — **transparent both modes** | `transparent` | `transparent` |
| `select-item-hover` | Row hover fill | `gray-100` | `neutral-800` |
| `select-item-focus` | Row keyboard-focus fill | `gray-100` | `neutral-800` |
| `select-item-foreground` | Row text inside templates | `gray-800` | `neutral-200` |
| `overlay` | Modal panel fill (`bg-overlay`) | `white` | `neutral-800` |
| `overlay-line` | Modal panel border — **transparent both modes** | `transparent` | `transparent` |
| `overlay-divider` | Rule under the modal search field / tab strip | `gray-200` | `neutral-700` |
| `surface-1` | Avatar placeholder disc in the JSON item template | `gray-200` | `neutral-600` |
| `scrollbar-track` | Results scrollbar track | `gray-100` | `neutral-700` |
| `scrollbar-thumb` | Results scrollbar thumb | `gray-300` | `neutral-500` |

## Behaviour (JS)

Class `HSComboBox` (`assets/js/preline/combobox.js`). Modal variants additionally drive `HSOverlay`.

Init: `HSComboBox.autoInit()` runs on `window load`; it skips nodes already in `window.$hsComboBoxCollection` and any `[data-hs-combo-box].--prevent-on-load-init`. Manual: `new HSComboBox(el, options)`.

Attributes — all read from the DOM, config is the JSON in `data-hs-combo-box`:

| Attribute | Purpose |
|---|---|
| `data-hs-combo-box` | Root + JSON options |
| `data-hs-combo-box-input` | The query `<input>` (required) |
| `data-hs-combo-box-output` | Results panel (required) |
| `data-hs-combo-box-output-items-wrapper` | Optional inner scroll container items are appended to |
| `data-hs-combo-box-output-item` | One result row |
| `data-hs-combo-box-value` | Element read on pick: a **click** writes its `textContent` to the input, the keyboard writes its `data-hs-combo-box-search-text` **attribute** (see Gotchas) |
| `data-hs-combo-box-search-text` | Node the client filter matches — by **attribute value**, not text: `getAttribute("data-hs-combo-box-search-text").toLowerCase().includes(query)` (`isTextExistsAny`). In JSON mode the plugin writes that attribute for you from `data-hs-combo-box-output-item-field`; in HTML mode you author it |
| `data-hs-combo-box-output-item-field` | JSON field name(s) to render into this node |
| `data-hs-combo-box-output-item-attr` | `[{"valueFrom":<field>,"attr":<html attr>}]` |
| `data-hs-combo-box-toggle` / `-open` / `-close` | Optional external open/close buttons (unused by all 7 examples) |

Options with constructor defaults: `apiUrl` (null) · `apiGroupField` · `apiDataPart` · `apiQuery` · `apiSearchQuery` · `apiSearchPath` · `apiSearchDefaultPath` · `apiHeaders` (`{}`) · `outputItemTemplate` · `outputEmptyTemplate` ("Nothing found...") · `outputLoaderTemplate` · `groupingType` (null \| `"default"` \| `"tabs"`) · `groupingTitleTemplate` · `tabsWrapperTemplate` · `preventVisibility` (false) · `preventSelection` (false) · `preventAutoPosition` (false) · `preventClientFiltering` (**`!!apiSearchQuery || !!apiSearchPath`**) · `isOpenOnFocus` (false) · `keepOriginalOrder` (false) · `preserveSelectionOnEmpty` (**true**) · `minSearchLength` (0) · `viewport` (null).

State classes on the root: `.active` while open, `.has-value` while the input is non-empty; `.selected` on the picked row. Variants `hs-combo-box-active:`, `hs-combo-box-has-value:`, `hs-combo-box-selected:`, `hs-combo-box-tab-active:` come from `node_modules/preline/src/plugins/combobox/variants.css`, imported via `assets/css/variants.css`.

Methods: `open(value?)` · `close(value?, data?)` · `setCurrent()` (marks this instance keyboard-current; every shortcut `.js` calls it right after `overlay.element.open()`) · `setSelectedByValue(values)` · `getCurrentData()` · `recalculateDirection()` · `destroy()`.
Statics: `HSComboBox.getInstance(target, isInstance)` (instance, or `{id, element}` with `true`) · `autoInit()` · `close(target)` · `closeCurrentlyOpened(target)`.
Events: `instance.on('select', data)` and the DOM `CustomEvent` **`select.hs.combobox`** on the root.
Keys handled internally: `ArrowUp/Down/Left/Right`, `Home`, `End`, `Enter`, `Escape`, `Tab`.

## Gotchas

- **`destroy()` throws on every doc-shaped searchbox.** `destroy()` calls `this.toggle.removeEventListener(...)` with no null guard while `build()` guards with `this.toggle && this.buildToggle()`. No example includes `[data-hs-combo-box-toggle]`, so `this.toggle` is `null` → `TypeError`. Add a hidden `data-hs-combo-box-toggle` element, or never call `destroy()`.
- **Dropdown and modal forms are opposites and not interchangeable.** Dropdown: panel carries inline `style="display: none;"` and JS toggles it. Modal: `preventVisibility: true` makes `open()` set `.active` and **return before touching `output.style.display`** — so the panel must have NO inline `display:none` or it stays invisible forever.
- **`data-hs-combo-box-output-items-wrapper` is optional and its absence is meaningful.** `json-example-using-modal-popup-with-shortcut-call.html` has none: rendered rows append straight into `[data-hs-combo-box-output]`, so the scroll/height classes must live on the output itself (`h-80 p-2 overflow-y-auto` there).
- **Both `groupingType:"tabs"` templates are broken upstream.** In the two tab-filter files the `<span class="hidden hs-combo-box-selected:block">` sits AFTER the closing `</div>` of `[data-hs-combo-box-output-item]` and is followed by a stray `</img></div>` — the selected check can never render. Copy the item template from `json-example-in-dropdown.html` instead.
- **`hs-combo-box-tab-active:` is self-only.** Its variant is `&.active` with no descendant form, unlike `hs-combo-box-selected:` (`&.selected` **or** `.selected &`). Putting `hs-combo-box-tab-active:` on a child of the tab `<button>` silently does nothing — that is why the whole `<button>` carries the classes in `groupingTitleTemplate`.
- **Under moon the panel has no border.** `select-line` and `overlay-line` both resolve to `transparent` in light AND dark. `border border-select-line` is a spacing device; the visible edge is `shadow-xl` (dropdown) / `shadow-2xs` (modal). Remove the shadow and the panel bleeds into the page. Same trap inside `tabsWrapperTemplate`: the dropdown tab strip separates with `border-b border-select-line` (invisible), the modal one with `border-b border-overlay-divider` (`gray-200` / `neutral-700`, visible) — only the modal actually shows a rule under the tabs.
- **`preventSelection: true` removes the row click handler entirely**, not just the highlight (`this.preventSelection || item.addEventListener("click", …)`). Required whenever rows wrap `<a href>` (both HTML-data examples): the handler never calls `preventDefault`, so without the flag the anchor still navigates *and* `close(<row textContent>, storedData)` fires alongside it — the row text lands in the input and `select.hs.combobox` reports a pick the user never made.
- **The input handler is `debounce`d at the util default of 200 ms.** Tests and shortcut flows must wait; typing then immediately asserting on the DOM reads stale rows.
- **Click and keyboard fill the input from different sources.** A row click writes `[data-hs-combo-box-value]`'s `textContent`; `ArrowUp/Down` (`setHighlighted`) and `Enter` (`onEnter`) write that same node's **`data-hs-combo-box-search-text` attribute**. The two tab-filter templates put both attributes on one `<div …-field="title" …-search-text …-value>`, so both paths agree. The baseline `json-example-in-dropdown.html` template does **not** — `data-hs-combo-box-value` sits on the name div and `data-hs-combo-box-search-text` on a separate `class="hidden"` div — so arrow-key navigation there does not preview the row text. Put both attributes on the same node.
- **The shortcut key is not configurable via `data-hs-combo-box`** — it lives in the sibling `.js` as a raw `keydown` on `window` (`Slash`, `Backslash`, `Semicolon`+shift). All three bail when the overlay root already has `.open`, then call `overlay.element.open()` followed by `combobox.element.setCurrent()`. The two JSON files resolve `HSOverlay.getInstance(…, true)` / `HSComboBox.getInstance(…, true)` **inside** the handler; `html-example-using-modal-popup-with-shortcut-call.js` resolves both once at `window load` and closes over them.
- **A document-level click closes any open instance** (`closeCurrentlyOpened`) unless the click target is inside `[data-hs-combo-box].active`. Custom panels rendered in a portal outside the root will close on their own click.
- After dynamically rendering a searchbox, call `HSComboBox.autoInit()`; it filters `window.$hsComboBoxCollection` down to nodes still in the document first, so stale entries do not block re-registration.

## Copy-paste base

`examples/advanced-forms/searchbox/json-example-in-dropdown.html`

```html
<div class="max-w-sm">
  <!-- SearchBox -->
  <div class="relative" data-hs-combo-box='{
    "groupingType": "default",
    "isOpenOnFocus": true,
    "apiUrl": "../../assets/data/searchbox.json",
    "apiGroupField": "category",
    "outputItemTemplate": "<div data-hs-combo-box-output-item class=\"rounded-lg hover:bg-select-item-hover focus:outline-hidden focus:bg-select-item-focus\"><span class=\"flex items-center cursor-pointer py-2 px-4 w-full text-sm text-select-item-foreground rounded-lg\"><div class=\"flex items-center w-full\"><div class=\"flex items-center justify-center rounded-full bg-surface-1 size-6 overflow-hidden me-2.5\"><img class=\"shrink-0\" data-hs-combo-box-output-item-attr='[{\"valueFrom\": \"image\", \"attr\": \"src\"}, {\"valueFrom\": \"name\", \"attr\": \"alt\"}]' /></div><div data-hs-combo-box-output-item-field=\"name\" data-hs-combo-box-value></div><div class=\"hidden\" data-hs-combo-box-output-item-field='[\"name\", \"category\"]' data-hs-combo-box-search-text></div></div><span class=\"hidden hs-combo-box-selected:block\"><svg class=\"shrink-0 size-3.5 text-primary\" xmlns=\"http:.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"20 6 9 17 4 12\"></polyline></svg></span></span></div>",
    "groupingTitleTemplate": "<div class=\"text-xs uppercase text-muted-foreground-1 m-3 mb-1\"></div>"
  }'>
    <div class="relative">
      <div class="absolute inset-y-0 inset-s-0 flex items-center pointer-events-none z-20 ps-3.5">
        <svg class="shrink-0 size-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.3-4.3"></path>
        </svg>
      </div>
      <input class="py-2.5 py-3 ps-10 pe-4 block w-full bg-layer border-layer-line rounded-lg sm:text-sm text-foreground placeholder:text-muted-foreground-1 focus:border-primary-focus focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none" type="text" role="combobox" aria-expanded="false" placeholder="Type a name" value="" data-hs-combo-box-input>
    </div>

    <!-- SearchBox Dropdown -->
    <div class="absolute z-50 w-full bg-select border border-select-line rounded-lg shadow-xl p-2" style="display: none;" data-hs-combo-box-output>
      <div class="max-h-72 rounded-b-lg overflow-hidden overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb" data-hs-combo-box-output-items-wrapper></div>
    </div>
    <!-- End SearchBox Dropdown -->
  </div>
  <!-- End SearchBox -->
</div>
```
