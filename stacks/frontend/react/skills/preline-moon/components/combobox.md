---
component: combobox
label: ComboBox
category: advanced-forms
docs: https://preline.co/docs/components/combobox.html
examples: 7
js: HSComboBox
tokens: [layer, layer-line, foreground, muted-foreground-1, primary, primary-focus, select, select-line, select-item-foreground, select-item-hover, select-item-focus, scrollbar-track, scrollbar-thumb]
---

# ComboBox

A free-text `<input>` that filters an attached list of options — from inline markup or a remote JSON endpoint — and writes the chosen label back into the input.

## When to use
- Autocomplete over a long or remote list: countries, users, SKUs, tags fetched from an API.
- When the user may type a value that is *not* in the list (the input keeps whatever was typed).
- NOT when you need a real form value — the combobox has **no hidden `<select>` / `<input name>`**; only the visible input carries text. Use `advanced-select` when the field must post a value.
- NOT for multi-select or tag chips — that is `advanced-select` with `"mode": "tags"`.
- NOT for a site-wide search palette — that is `searchbox`.

## Anatomy
Reduced skeleton — three required children of the wrapper; classes shown are the ones that carry the theme.

```html
<!-- wrapper = the instance; JSON options live on this attribute -->
<div class="relative" data-hs-combo-box>
  <div class="relative">
    <!-- the value carrier -->
    <input class="py-2.5 sm:py-3 ps-4 pe-9 block w-full bg-layer border-layer-line rounded-lg sm:text-sm
                  text-foreground placeholder:text-muted-foreground-1
                  focus:border-primary-focus focus:ring-primary-focus"
           type="text" role="combobox" aria-expanded="false" data-hs-combo-box-input>
    <!-- chevron; opens/closes -->
    <div class="absolute top-1/2 inset-e-3 -translate-y-1/2" aria-expanded="false" role="button" data-hs-combo-box-toggle>…</div>
  </div>
  <!-- panel; the inline style="display: none;" is toggled by the JS -->
  <div class="absolute z-50 w-full max-h-72 p-1 bg-select border border-select-line rounded-lg shadow-xl
              overflow-hidden overflow-y-auto [&::-webkit-scrollbar]:w-2
              [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb"
       style="display: none;" role="listbox" data-hs-combo-box-output>
    <!-- static item: search-text = what is matched, value = what lands in the input -->
    <div class="cursor-pointer py-2 px-4 w-full text-sm text-select-item-foreground hover:bg-select-item-hover
                rounded-lg focus:outline-hidden focus:bg-select-item-focus"
         role="option" tabindex="0" data-hs-combo-box-output-item
         data-hs-combo-box-item-stored-data='{"id": 1, "name": "Argentina"}'>
      <span data-hs-combo-box-search-text="Argentina" data-hs-combo-box-value>Argentina</span>
    </div>
  </div>
</div>
```

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| basic-usage | Basic combobox | examples/advanced-forms/combobox/basic-usage.html (+ .js) | six static `data-hs-combo-box-output-item` divs, each with `data-hs-combo-box-item-stored-data` JSON; demo button logs `element.getCurrentData()` |
| json-example | Remote JSON source | examples/advanced-forms/combobox/json-example.html | no static items; `apiUrl` (World Bank) + `apiQuery: "format=json"` + `apiDataPart: 1` + inline `outputItemTemplate` |
| json-example-based-on-api-pathes | Custom API paths | examples/advanced-forms/combobox/json-example-based-on-api-pathes.html (+ .js) | `apiSearchPath: "name"` + `apiSearchDefaultPath: "all"` (restcountries); template reads nested `name.common` via `data-hs-combo-box-output-item-field` |
| json-example-with-per-page-parameter | Remote JSON with query parameters | examples/advanced-forms/combobox/json-example-with-per-page-parameter.html (+ .js) | `apiQuery: "format=json&amp;per_page=10"` — the `&` is HTML-entity-encoded inside the attribute |
| minimum-search-length-and-limit-parameters | Minimum search length | examples/advanced-forms/combobox/minimum-search-length-and-limit-parameters.html (+ .js) | adds `minSearchLength: 3` to the per-page remote setup |
| close-button | Clear button | examples/advanced-forms/combobox/close-button.html | adds a `data-hs-combo-box-close` button inside `hidden hs-combo-box-active:flex absolute inset-y-0 inset-e-8`; input starts `value=""` |
| destroy-and-reinitialize | Destroy and reinitialize | examples/advanced-forms/combobox/destroy-and-reinitialize.html (+ .js) | static items + `id="hs-combobox-to-destroy"`; buttons call `element.destroy()` / `HSComboBox.autoInit()` |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` | input fill (`bg-layer`) | `white` | `neutral-800` |
| `layer-line` | input border (`border-layer-line`) | `gray-200` | `neutral-700` |
| `foreground` | typed text (`text-foreground`); also the check glyph in the static examples | `gray-800` | `neutral-200` |
| `muted-foreground-1` | placeholder, chevron, resting clear button | `gray-600` | `neutral-400` |
| `primary-focus` | input focus border + ring; hover/focus colour of the clear button | `gray-900` | `neutral-300` |
| `select` | dropdown panel fill (`bg-select`) | `white` | `neutral-900` |
| `select-line` | dropdown border (`border-select-line`) — transparent in both themes | `transparent` | `transparent` |
| `select-item-foreground` | option label (`text-select-item-foreground`) | `gray-800` | `neutral-200` |
| `select-item-hover` | option hover fill | `gray-100` | `neutral-800` |
| `select-item-focus` | option keyboard-focus fill | `gray-100` | `neutral-800` |
| `scrollbar-track` | panel scrollbar track | `gray-100` | `neutral-700` |
| `scrollbar-thumb` | panel scrollbar thumb | `gray-300` | `neutral-500` |
| `primary` | "selected" check glyph inside the remote `outputItemTemplate` | `gray-800` | `white` |
| `line-2` | rule above the "Log Selected" demo block | `gray-200` | `neutral-700` |
| `tooltip` / `tooltip-foreground` / `tooltip-line` | demo tooltip on the Log Selected button | `gray-900` / `white` / `transparent` | `white` / `neutral-800` / `transparent` |

`layer-foreground`, `layer-hover`, `layer-focus`, `surface*` on these pages belong to the demo Buttons, not to the combobox.

## Behaviour (JS)
Class `HSComboBox`, source `assets/js/preline/combobox.js` (v4.2.0).

| Attribute | Where | Effect |
|---|---|---|
| `data-hs-combo-box` | wrapper | marks the instance; value parsed as JSON options |
| `data-hs-combo-box-input` | the `<input>` | value carrier; initial `value` seeds `this.selected` / `this.value` |
| `data-hs-combo-box-toggle` | any node | click toggles open/closed |
| `data-hs-combo-box-close` | any node | click closes (used as the clear affordance) |
| `data-hs-combo-box-open` | any node | click opens |
| `data-hs-combo-box-output` | panel | the listbox container |
| `data-hs-combo-box-output-items-wrapper` | optional inner node | items are appended here instead of directly to the output |
| `data-hs-combo-box-output-item` | each row | one option |
| `data-hs-combo-box-search-text` | node inside a row | the text the filter matches (static items carry the text as the attribute value) |
| `data-hs-combo-box-value` | node inside a row | its `textContent` becomes the input value on select |
| `data-hs-combo-box-output-item-field` | node inside a template | dotted path into the API record, e.g. `"name.common"` |
| `data-hs-combo-box-item-stored-data` | a static row | JSON returned by `getCurrentData()` for that row |

Options, grouped (default in parentheses):

| Group | Keys |
|---|---|
| Remote | `apiUrl` (`null` — presence switches to JSON mode) · `apiQuery` (raw query string) · `apiDataPart` (index/key of the sub-array in the envelope) · `apiSearchQuery` (`null` — name of the query param that carries the term) · `apiSearchPath` / `apiSearchDefaultPath` (path search: `{apiUrl}/{path}/{term}`) · `apiHeaders` (`{}`) · `apiGroupField` (`null`) |
| Templates | `outputItemTemplate` (**hardcoded gray/blue Tailwind**) · `outputEmptyTemplate` (`"Nothing found..."`, hardcoded) · `outputLoaderTemplate` (blue-600 spinner, hardcoded) · `groupingTitleTemplate` · `tabsWrapperTemplate` |
| Filtering | `minSearchLength` (`0`) · `preventClientFiltering` (**`true` when `apiSearchQuery` or `apiSearchPath` is set**) · `keepOriginalOrder` (`false`) · `groupingType` (`null` \| `"default"` \| `"tabs"`) |
| Behaviour | `preventSelection` (`false`) · `preventVisibility` (`false` — panel stays mounted, filters the raw input value) · `preventAutoPosition` (`false`) · `isOpenOnFocus` (`false`) · `preserveSelectionOnEmpty` (`true`) · `viewport` (`null`) |

Init: `window.addEventListener('load', () => HSComboBox.autoInit())`; a document `scroll` listener calls `recalculateDirection()` on the open instance unless `preventAutoPosition`. Collection: `window.$hsComboBoxCollection`.

API: `HSComboBox.getInstance(target, isInstance?)` — `true` → `{id, element}`, the form all five doc `.js` files use · `HSComboBox.autoInit()` · `element.open()` / `close()` / `destroy()` / `recalculateDirection()` / `setCurrent()` · `element.getCurrentData()` returns the stored/API record for the current selection.

Event: `select.hs.combobox`, dispatched on the wrapper, `event.detail.payload = currentData`; also `instance.on('select', fn)`.

State classes: `has-value` on the wrapper while the input is non-empty (drives `hs-combo-box-active:`), `selected` on the chosen row (drives `hs-combo-box-selected:`).

## Gotchas
- **The default templates are NOT moon-themed.** `outputItemTemplate`, `outputEmptyTemplate` and `outputLoaderTemplate` fall back to literal `text-gray-800 hover:bg-gray-100 dark:bg-neutral-900 … text-blue-600` strings baked into `combobox.js`. Every remote example in the docs supplies its own `outputItemTemplate` for exactly this reason. If you use `apiUrl` without one, the rows ignore the theme *and* introduce blue accents moon never uses. There is no themed default for the empty/loader states at all — override them too, or the "Nothing found..." row renders un-tokenised.
- **`&` must be entity-encoded in `apiQuery`.** The options JSON lives inside an HTML attribute, so `json-example-with-per-page-parameter.html` writes `"format=json&amp;per_page=10"`. A bare `&` there is an HTML parse hazard, not a JSON one.
- **Keep `style="display: none;"` on the output div.** The JS toggles inline `display`; removing the attribute leaves the panel permanently open before first init.
- **No form value.** There is no hidden input. Read the value with `element.getCurrentData()` (or `select.hs.combobox`) and post it yourself, or switch to `advanced-select`.
- **`data-hs-combo-box-search-text` differs by mode.** Static rows carry the searchable string *as the attribute value* (`data-hs-combo-box-search-text="Argentina"`); template rows use it as a bare marker and take the text from `data-hs-combo-box-output-item-field`.
- **`preventClientFiltering` turns itself on and cannot be turned off from markup.** It defaults to `!!apiSearchQuery || !!apiSearchPath`, so either of those implicitly disables local filtering — the server must return the filtered set, or every keystroke shows the full page again. And unlike every other option it is read from the *constructor argument only*, never from the merged attribute JSON: `"preventClientFiltering": false` inside `data-hs-combo-box` is silently ignored. To override it you must construct manually — `new HSComboBox(el, { preventClientFiltering: false })`.
- **Panel and field use different surfaces under moon.** `layer` is `white`/`neutral-800`; `select` is `white`/`neutral-900`. In light both are white and only `shadow-xl` separates them — `select-line` is `transparent` in *both* themes, so `border border-select-line` contributes nothing visually. Do not swap it for `border-layer-line` without checking dark mode.
- **The clear button is only visible via `hs-combo-box-active:`.** `close-button.html` wraps it in `hidden hs-combo-box-active:flex`, which depends on the `has-value` class the JS adds. Rendering the button unconditionally shows an X over an empty field.
- **Re-init after dynamic render.** `autoInit()` only runs on `load`; React-mounted markup needs an explicit `HSComboBox.autoInit()` in a mount effect. `destroy()` removes the instance from the collection so `autoInit()` picks it up again.
- **Two upstream typos survive verbatim in the examples — fix them on paste.** Every one of the 7 files opens with `<!-- End Combobox -->` instead of `<!-- Combobox -->`. And the check-glyph SVG inside every `outputItemTemplate` string carries `xmlns=\"http:.w3.org/2000/svg\"` (4 of 7 files) — a malformed namespace. The chevron outside the template string uses the correct `http://www.w3.org/2000/svg`; copy that value over.
- **`role="combobox"` + `aria-expanded` on the input and `role="listbox"`/`role="option"` + `tabindex` on the rows are load-bearing** — the JS reads and updates `aria-expanded`, and keyboard navigation relies on the row `tabindex`.

## Copy-paste base
`examples/advanced-forms/combobox/json-example.html` — the minimal complete shape (input + toggle + output). For a fully static, offline list, copy `examples/advanced-forms/combobox/basic-usage.html` instead.

```html
<!-- End Combobox -->
<div class="relative" data-hs-combo-box='{
  "apiUrl": "https://api.worldbank.org/v2/country",
  "apiQuery": "format=json",
  "apiDataPart": 1,
  "outputItemTemplate": "<div class=\"cursor-pointer py-2 px-4 w-full text-sm text-select-item-foreground hover:bg-select-item-hover rounded-lg focus:outline-hidden focus:bg-select-item-focus\" data-hs-combo-box-output-item><div class=\"flex justify-between items-center w-full\"><div><div data-hs-combo-box-output-item-field=\"name\" data-hs-combo-box-search-text data-hs-combo-box-value></div></div><span class=\"hidden hs-combo-box-selected:block\"><svg class=\"shrink-0 size-3.5 text-primary\" xmlns=\"http:.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"20 6 9 17 4 12\"></polyline></svg></span></div></div>"
}'>
  <div class="relative">
    <input class="py-2.5 sm:py-3 ps-4 pe-9 block w-full bg-layer border-layer-line rounded-lg sm:text-sm text-foreground placeholder:text-muted-foreground-1 focus:border-primary-focus focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none" type="text" role="combobox" aria-expanded="false" value="Argentina" data-hs-combo-box-input>
    <div class="absolute top-1/2 inset-e-3 -translate-y-1/2" aria-expanded="false" role="button" data-hs-combo-box-toggle>
      <svg class="shrink-0 size-3.5 text-muted-foreground-1" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 15 5 5 5-5"></path><path d="m7 9 5-5 5 5"></path></svg>
    </div>
  </div>
  <div class="absolute z-50 w-full max-h-72 p-1 bg-select border border-select-line rounded-lg shadow-xl overflow-hidden overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb" style="display: none;" role="listbox" data-hs-combo-box-output></div>
</div>
<!-- End Combobox -->
```
