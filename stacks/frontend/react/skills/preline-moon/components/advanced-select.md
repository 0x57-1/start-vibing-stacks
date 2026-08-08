---
component: advanced-select
label: Advanced Select
category: advanced-forms
docs: https://preline.co/docs/components/advanced-select.html
examples: 41
js: HSSelect
tokens: [layer, layer-line, layer-foreground, layer-hover, layer-focus, foreground, muted-foreground-1, primary, primary-focus, select, select-line, select-item-foreground, select-item-hover, select-item-focus, select-item-active, scrollbar-track, scrollbar-thumb, surface, surface-foreground, surface-hover, surface-focus, line-2]
---

# Advanced Select

Replaces a native `<select>` with generated markup — a styled toggle, a positioned dropdown, optional search, option templates, tags and remote data — while the original `<select>` stays in the DOM as the form value.

## When to use
- Any `<select>` that needs icons/avatars/descriptions per option, a search field, multi-select counters, or tag chips.
- When the field must **post a value**: the native `<select class="hidden">` is retained, so `name=` submits normally. (`combobox` has no form field.)
- NOT for free-text-plus-suggestions — that is `combobox`.
- NOT for 2-4 plain options: a native `<select>` with the standard input classes is smaller and needs no JS.
- NOT for a command palette (`searchbox`) or a menu of actions (`dropdown`).

## Anatomy
Reduced skeleton. **All theme classes live inside the JSON attribute as strings** — the generated wrapper/dropdown/options do not exist in your source.

```html
<!-- the ORIGINAL select stays; class="hidden" is required -->
<select id="…" data-hs-select='{
  "placeholder": "Select option...",
  "toggleTag":    "<button type=\"button\" aria-expanded=\"false\"></button>",
  "toggleClasses":"… bg-layer border border-layer-line text-layer-foreground hover:bg-layer-hover focus:bg-layer-focus",
  "dropdownClasses":"… bg-select border border-select-line … [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb",
  "optionClasses":"hs-selected:bg-select-item-active … text-select-item-foreground hover:bg-select-item-hover focus:bg-select-item-focus",
  "optionTemplate":"<div …><span data-title></span><span class=\"hidden hs-selected:block\">✓</span></div>",
  "extraMarkup":  "<div class=\"absolute top-1/2 inset-e-3 -translate-y-1/2\">▾</div>"
}' class="hidden">
  <option value="">Choose</option>
  <!-- per-option extras go in a second JSON attribute -->
  <option value="1" data-hs-select-option='{"description": "…", "icon": "<img …>"}'>Name</option>
</select>
```

Template slots consumed by `optionTemplate` / `toggleTag` / `tagsItemTemplate`: `data-title`, `data-description`, `data-icon`, `data-remove`.

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| basic-usage | Default advanced select | examples/advanced-forms/advanced-select/basic-usage.html | the canonical 7-key config: `placeholder`, `toggleTag`, `toggleClasses`, `dropdownClasses`, `optionClasses`, `optionTemplate`, `extraMarkup` |
| optgroup | Grouped options | examples/advanced-forms/advanced-select/optgroup.html | adds `optgroupTag: "<div></div>"` + `optgroupClasses: "py-2 px-4 w-full text-xs font-semibold text-primary uppercase"`; native `<optgroup>` in the markup |
| fixed-position | Fixed-position dropdown | examples/advanced-forms/advanced-select/fixed-position.html | adds `"dropdownVerticalFixedPlacement": "bottom"` — never flips up |
| placeholder | Placeholder with icon | examples/advanced-forms/advanced-select/placeholder.html | `placeholder` is an HTML string (`<span class="inline-flex items-center"><svg …/> Filter</span>`) |
| allow-empty-option | Allow empty selection | examples/advanced-forms/advanced-select/allow-empty-option.html | `"optionAllowEmptyOption": true` — `<option value="">` becomes selectable instead of being the placeholder |
| multiple | Multiple selection | examples/advanced-forms/advanced-select/multiple.html | `multiple` on the `<select>`; `optionClasses` drops `hs-selected:bg-select-item-active` |
| multiple-optgroup | Multiple selection with optgroups | examples/advanced-forms/advanced-select/multiple-optgroup.html | `multiple` + `optgroupTag`/`optgroupClasses` |
| multiple-with-option-template | Multiple selection with option templates | examples/advanced-forms/advanced-select/multiple-with-option-template.html | richer `optionTemplate` with `data-icon` + `hs-selected:font-semibold`; per-option `data-hs-select-option='{"icon": …}'` |
| multiple-with-counter | Multiple selection with counter | examples/advanced-forms/advanced-select/multiple-with-counter.html | adds `"toggleCountText": "selected"` |
| multiple-with-conditional-counter | Multiple selection with conditional counter | examples/advanced-forms/advanced-select/multiple-with-conditional-counter.html (+ .js) | `toggleCountText: "+"`, `toggleCountTextPlacement: "prefix-no-space"`, `toggleCountTextMinItems: 3`, `toggleCountTextMode: "nItemsAndCount"`, `toggleSeparators.betweenItemsAndCounter: "&"`; Clear button |
| multiple-with-counter-and-option-template | Counter with option templates | examples/advanced-forms/advanced-select/multiple-with-counter-and-option-template.html | `toggleCountText` + icon-bearing `optionTemplate` |
| search-inside-dropdown | Searchable dropdown | examples/advanced-forms/advanced-select/search-inside-dropdown.html | `"hasSearch": true` + `searchWrapperClasses: "bg-select p-2 -mx-1 sticky top-0"` + themed `searchClasses` + `searchPlaceholder` |
| minimum-search-length | Minimum search length | examples/advanced-forms/advanced-select/minimum-search-length.html | search config + `"minSearchLength": 3` |
| search-limit | Search result limit | examples/advanced-forms/advanced-select/search-limit.html | search config + `"searchLimit": 5` |
| scroll-to-selected | Scroll to selected option | examples/advanced-forms/advanced-select/scroll-to-selected.html | search config + `"scrollToSelected": true` |
| search-match-mode | Search match mode | examples/advanced-forms/advanced-select/search-match-mode.html | `"searchMatchMode": "hybrid"` |
| search-both-value-and-description | Search labels and descriptions | examples/advanced-forms/advanced-select/search-both-value-and-description.html | `"isSearchDirectMatch": false` + per-option `description` |
| tags | Tag-style selection | examples/advanced-forms/advanced-select/tags.html | `"mode": "tags"` + `wrapperClasses` + `tagsItemTemplate` (with `data-remove`) + `tagsInputId` + `tagsInputClasses`; **no `toggleTag`/`toggleClasses`** |
| tags-disabled | Disabled tag selection | examples/advanced-forms/advanced-select/tags-disabled.html | same tags config, `disabled` on the `<select>` |
| custom-template-with-icons | Option template with icons | examples/advanced-forms/advanced-select/custom-template-with-icons.html | `toggleTag` itself carries `data-icon` + `data-title`; inline SVG icons per option |
| custom-template-with-avatars | Option template with avatars | examples/advanced-forms/advanced-select/custom-template-with-avatars.html | per-option `icon` is an `<img class="shrink-0 size-5 rounded-full">`; `optionTemplate` and `toggleTag` both carry `data-icon` + `data-title` (no `data-description` here — that is `search-both-value-and-description`, `tags*` and the `remote-data*` set) |
| custom-template-with-colored-square-indicators | Option template with color indicators | examples/advanced-forms/advanced-select/custom-template-with-colored-square-indicators.html | **no `icon` key at all**: the square is an empty `<div … size-4 rounded-sm data-color-theme>` in the `optionTemplate`, painted per option by `"additionalClasses": [["[data-color-theme] ", ["bg-blue-500"]]]`; plus `"scrollToSelected": true` |
| sizing | Advanced select sizes | examples/advanced-forms/advanced-select/sizing.html | three selects differing only in `toggleClasses` padding: `py-2 px-3 pe-9` / `py-3 ps-4 pe-9 gap-x-2` / `sm:p-5 p-4 pe-9` |
| disabled | Disabled advanced select | examples/advanced-forms/advanced-select/disabled.html (+ .js) | `disabled` on the `<select>`; the demo toggles the attribute live (a MutationObserver picks it up) |
| modal-example | Inside a modal | examples/advanced-forms/advanced-select/modal-example.html | standard config nested in an `hs-overlay` dialog — no dropdown option needed |
| modal-example-with-overflow-hidden | Inside overflow-hidden containers | examples/advanced-forms/advanced-select/modal-example-with-overflow-hidden.html | adds `"dropdownScope": "window"` so the panel escapes the clipping ancestor; tags mode |
| validation-states | Validation states | examples/advanced-forms/advanced-select/validation-states.html | `toggleClasses` swaps to `border-red-500 focus:border-red-500 focus:ring-red-500`; `extraMarkup` becomes an **array** of strings |
| dynamic-validation-states | Dynamic validation styling | examples/advanced-forms/advanced-select/dynamic-validation-states.html (+ .js) | `extraMarkup` array with `hs-error:block` / `hs-success:flex` icons; JS toggles `.error` / `.success` on an ancestor wrapper |
| add-remove-options | Add or remove options | examples/advanced-forms/advanced-select/add-remove-options.html (+ .js) | `select.addOption({title, val, selected, options:{icon}})` and `select.removeOption("4")` |
| add-remove-options-multiple | Add or remove options in multiple mode | examples/advanced-forms/advanced-select/add-remove-options-multiple.html (+ .js) | same API against a `multiple` select; array forms of both calls |
| set-single-value-using-setter | Set a single value programmatically | examples/advanced-forms/advanced-select/set-single-value-using-setter.html (+ .js) | `select.setValue('2')`; `setValue('')` resets |
| set-multiple-value-using-setter | Set multiple values programmatically | examples/advanced-forms/advanced-select/set-multiple-value-using-setter.html (+ .js) | `setValue` with an array on a `multiple` select |
| remote-data | Remote data source | examples/advanced-forms/advanced-select/remote-data.html | `apiUrl` + `apiQuery` + `apiDataPart` + `apiSearchQueryKey` + `apiFieldsMap {id,val,title,description,icon}` + `apiIconTag` + `isSelectedOptionOnTop: true` |
| remote-data-multiple | Remote data source (multiple) | examples/advanced-forms/advanced-select/remote-data-multiple.html | remote config + `multiple` + `"isSearchDirectMatch": false` |
| remote-data-tags | Remote data tags | examples/advanced-forms/advanced-select/remote-data-tags.html | remote config + `"mode": "tags"` + `wrapperClasses`/`tagsItemTemplate`/`tagsInputClasses` |
| multiple-with-option-template-remote-data | Option templates with remote data | examples/advanced-forms/advanced-select/multiple-with-option-template-remote-data.html | remote config + `toggleCountText` |
| multiple-with-conditional-counter-remote-data | Conditional counter with remote data | examples/advanced-forms/advanced-select/multiple-with-conditional-counter-remote-data.html (+ .js) | remote config + the full conditional-counter option set |
| custom-template-with-avatars-remote-data | Avatar template with remote data | examples/advanced-forms/advanced-select/custom-template-with-avatars-remote-data.html | remote config + `apiIconTag` + avatar `optionTemplate` |
| preselected-values | Preselected values | examples/advanced-forms/advanced-select/preselected-values.html | `"apiSelectedValues": ["bulbasaur", "ivysaur", "venusaur"]` in tags mode |
| infinite-scroll | Infinite scroll | examples/advanced-forms/advanced-select/infinite-scroll.html | `"apiLoadMore": {"perPage": 20, "scrollThreshold": 100}` + `optionAllowEmptyOption` + tags mode |
| destroy-reinitialize-select | Destroy and reinitialize | examples/advanced-forms/advanced-select/destroy-reinitialize-select.html (+ .js) | `select.destroy()` then **`new HSSelect(selectEl)`** (not `autoInit()`) |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` | toggle fill, tag-chip fill (`toggleClasses` / `wrapperClasses` / `tagsItemTemplate`) | `white` | `neutral-800` |
| `layer-line` | toggle + tag-chip border; search field border | `gray-200` | `neutral-700` |
| `layer-foreground` | toggle label | `gray-800` | `white` |
| `layer-hover` | toggle hover fill | `gray-50` | `neutral-700` |
| `layer-focus` | toggle focus fill | `gray-50` | `neutral-700` |
| `foreground` | option title in custom templates, tag label, search input text | `gray-800` | `neutral-200` |
| `muted-foreground-1` | chevron (`extraMarkup`), `data-description`, search placeholder | `gray-600` | `neutral-400` |
| `primary` | "selected" check glyph; `optgroupClasses` label | `gray-800` | `white` |
| `primary-focus` | focus border + ring on the tags wrapper and search field | `gray-900` | `neutral-300` |
| `select` | dropdown panel fill; sticky search wrapper | `white` | `neutral-900` |
| `select-line` | dropdown border — transparent in both themes | `transparent` | `transparent` |
| `select-item-foreground` | option label | `gray-800` | `neutral-200` |
| `select-item-hover` | option hover fill | `gray-100` | `neutral-800` |
| `select-item-focus` | option keyboard-focus fill | `gray-100` | `neutral-800` |
| `select-item-active` | **selected** option fill (`hs-selected:bg-select-item-active`) — never in `multiple` dropdown mode, see gotcha | `gray-100` | `neutral-800` |
| `scrollbar-track` | dropdown scrollbar track | `gray-100` | `neutral-700` |
| `scrollbar-thumb` | dropdown scrollbar thumb | `gray-300` | `neutral-500` |
| `surface` | "remove tag" circle in `tagsItemTemplate` | `gray-100` | `neutral-700` |
| `surface-foreground` | that circle's glyph | `gray-800` | `neutral-200` |
| `surface-hover` / `surface-focus` | that circle's hover / focus fill | `gray-200` | `neutral-600` |
| `line-2` | hairline ring around a remote avatar (`border border-line-2`) — only `remote-data-tags` (chip) and `custom-template-with-avatars-remote-data` (`toggleTag`); `index.json` also lists it for `multiple-with-conditional-counter-remote-data`, which does not use it | `gray-200` | `neutral-700` |

Modal examples add `overlay` (`white`/`neutral-800`), `overlay-line` (`transparent`/`transparent`), `overlay-header` + `overlay-footer` (`gray-200`/`neutral-700`) and `primary-line`/`primary-foreground`/`primary-hover` — Modal and Button tokens, not select tokens.

## Behaviour (JS)
Class `HSSelect`, source `assets/js/preline/select.js` (v4.2.0). Everything is configured through the `data-hs-select` JSON; there is no non-JS mode.

| Attribute | Where | Effect |
|---|---|---|
| `data-hs-select` | the `<select>` | marks the instance; value parsed as JSON options |
| `data-hs-select-option` | an `<option>` | per-option JSON. Keys used across the 41 examples: `icon` (raw HTML string, 19 files) · `description` (7 files) · `additionalClasses` (1 file) — `[[selector, [classes…]], …]`, applied to a node inside the rendered `optionTemplate` |

Options, grouped (default in parentheses):

| Group | Keys |
|---|---|
| Structure | `placeholder` (`"Select..."`, plain text or HTML) · `mode` (`"default"` \| `"tags"`) · `toggleTag` / `toggleClasses` · `optionTag` / `optionClasses` / `optionTemplate` · `optgroupTag` / `optgroupClasses` · `extraMarkup` (string **or array of strings**) · `optionAllowEmptyOption` (`false`) · `isSelectedOptionOnTop` (`false`) |
| Dropdown | `dropdownTag` / `dropdownClasses` / `dropdownDirectionClasses` · `dropdownScope` (`"parent"` \| `"window"`) · `dropdownVerticalFixedPlacement` (`null` \| `"top"` \| `"bottom"`) · `dropdownSpace` (`10`) |
| Tags mode | `wrapperClasses` · `tagsItemTemplate` · `tagsInputId` · `tagsInputClasses` · `isAddTagOnEnter` (`true`) |
| Search | `hasSearch` (`false`) · `searchWrapperClasses` (**`"bg-white p-2 sticky top-0"` — un-themed**) · `searchClasses` (**gray-200/blue-500/`dark:` string — un-themed**) · `searchNoResultClasses` (**`"px-4 text-sm text-gray-800 dark:text-neutral-200"` — un-themed**) · `searchPlaceholder` (`"Search..."`) · `searchNoResultText` (`"No results found"`) · `minSearchLength` (`0`) · `searchLimit` (`Infinity`) · `isSearchDirectMatch` (`true`) · `searchMatchMode` (`"substring"` when direct-match, else `"chars-sequence"`; docs use `"hybrid"`) · `preventSearchFocus` · `preventSearchInsideDescription` · `scrollToSelected` (`false`) |
| Counter (multiple) | `toggleCountText` (`null`) · `toggleCountTextPlacement` (`"postfix"` \| `"prefix-no-space"`) · `toggleCountTextMinItems` (`1`) · `toggleCountTextMode` (`"countAfterLimit"` \| `"nItemsAndCount"`) · `toggleSeparators` (`{items: ", ", betweenItemsAndCounter: "and"}`) |
| Remote | `apiUrl` · `apiQuery` · `apiOptions` · `apiSearchQueryKey` · `apiDataPart` · `apiFieldsMap` · `apiIconTag` · `apiSelectedValues` · `apiTotalPath` · `apiPageStart` · `apiLoadMore` (`true` → `{perPage: 10, scrollThreshold: 100}`) |

API: `HSSelect.getInstance(target, isInstance?)` — **without** `true` it returns the instance directly, which is the form 7 of the 9 doc `.js` files use; `multiple-with-conditional-counter.js` and `multiple-with-conditional-counter-remote-data.js` pass `true` and then call `select.element.setValue([])` · `HSSelect.autoInit()` (scans `[data-hs-select]:not(.--prevent-on-load-init)` on `load`) · `new HSSelect(el, options)` (the documented re-init after `destroy()`) · `element.setValue(val)` (string, or array in `multiple`/tags; `''` clears) · `element.addOption({title, val, selected?, options:{icon, description}})`, also an array · `element.removeOption(val)`, also an array · `open()` / `close()` / `toggleFn()` / `destroy()` / `recalculateDirection()` · `element.value`.

Events dispatched on the original `<select>`: `change.hs.select` and `load.hs.select` (also `instance.on('change'…)`).

A `MutationObserver` on the `<select>` watches the `disabled` attribute and calls `setDisabledState()`, so toggling `disabled` from outside works live (that is what `disabled.html` demonstrates). A document `scroll` handler re-runs `recalculateDirection()` on the open instance.

## Gotchas
- **Every theme class is a JSON string, so Tailwind must still see it.** In the docs these live inside an HTML attribute, which Tailwind scans as raw text. If you build the config in JS/JSX, keep them as **literals** — any interpolation (`` `bg-${x}` ``) is invisible to the scanner and the utilities are never emitted.
- **`class="hidden"` on the `<select>` is mandatory.** `buildWrapper()` creates `div.hs-select.relative`, does `el.before(wrapper)` and then `wrapper.append(el)` — the original `<select>` is *moved inside* the generated wrapper and nothing ever hides it. Without `hidden` the native control renders next to the generated toggle.
- **Search defaults are un-themed.** `searchWrapperClasses` defaults to `"bg-white p-2 sticky top-0"` and `searchClasses` to a `gray-200 / focus:border-blue-500 / dark:bg-neutral-900` string baked into `select.js`. Any `hasSearch: true` select must override both (docs use `"bg-select p-2 -mx-1 sticky top-0"`). `searchNoResultClasses` has the same problem and **no doc example overrides it** — the "No results found" row ships un-tokenised.
- **`extraMarkup` may be a string or an array** — `buildExtraMarkup()` branches on `Array.isArray`, appending each entry to the wrapper. `validation-states.html` has two selects with a **2-entry** array each (state icon + chevron); `dynamic-validation-states.html` has one select with a **3-entry** array (`hs-error:block` icon, `hs-success:flex` icon, chevron). Every entry that lacks the `--prevent-click` class gets a click handler calling `toggleFn()`, so the chevron opens/closes the dropdown.
- **Validation is class-driven, not token-driven.** `hs-error:` / `hs-success:` respond to `.error` / `.success` on an **ancestor** wrapper (`#validation-target`), and the colours are raw `red-500` / `teal-500`, not `destructive`.
- **`select-item-active` is dropped by every `multiple` dropdown, kept by most tags examples.** All 12 files with a plain `multiple` `<select>` (every `multiple*.html`, plus `add-remove-options-multiple`, `remote-data-multiple`, `search-match-mode`, `set-multiple-value-using-setter`) omit `hs-selected:bg-select-item-active` from `optionClasses` — with it every chosen row stays filled and hover becomes unreadable. Tags mode is inconsistent upstream: `tags.html` omits it, but `tags-disabled.html`, `infinite-scroll.html` and `modal-example-with-overflow-hidden.html` keep it (the chips already show the selection, so the filled rows are redundant). Copy `tags.html` if you want the clean version.
- **Tags mode ignores `toggleTag`/`toggleClasses`** and reads `wrapperClasses` / `tagsItemTemplate` / `tagsInputId` / `tagsInputClasses` instead. Mixing both sets gives no error and no effect for the unused half.
- **Inside `overflow-hidden` you need `"dropdownScope": "window"`.** A plain `hs-overlay` modal needs nothing; the overflow-hidden example sets it. Without it the panel is clipped with no visible error.
- **`destroy()` removes the whole generated wrapper.** It moves the `<select>` back to `el.parentElement.parentElement`, re-adds `hidden`, then `querySelector('.hs-select').remove()` — toggle, dropdown *and* `extraMarkup` all go, and the instance leaves `$hsSelectCollection`. The doc re-inits with `new HSSelect(el)`; `HSSelect.autoInit()` also works, since the `<select>` is back in the document and no longer in the collection. Do not copy the chevron bookkeeping in `destroy-reinitialize-select.js` (`selectToggleIcon.style.display = 'none' / ''`): that reference is captured once at `load`, so after the first `destroy()` it points at a detached node and the writes do nothing — `new HSSelect(el)` rebuilds `extraMarkup` by itself.
- **`getInstance` arity is inconsistent even inside this component's own docs.** 7 of the 9 doc `.js` files call `HSSelect.getInstance(el)` / `getInstance('#id')` with no second arg and use the result directly; the two conditional-counter files pass `true` and reach through `.element`. PIN input / input number / combobox always pass `true`. Both forms are valid — the wrong one for your call site hands you `{id, element}`, an object with no `.addOption` / `.setValue`.
- **`optionAllowEmptyOption` changes what the placeholder is.** `setOptions()` filters `option` elements with `this.optionAllowEmptyOption || (t.value && t.value !== "")`. Without it the first `<option value="">` is dropped from the list and the prompt comes from `placeholder`; with it that option becomes a real selectable row, so the prompt must come from `placeholder` — `allow-empty-option.html` sets no `placeholder` key at all and therefore falls back to the built-in `"Select..."`.
- **`select` vs `layer` under moon.** The panel is `select` (`white`/`neutral-900`), the toggle is `layer` (`white`/`neutral-800`) — in dark the panel is *darker* than the control; in light both are white and only `shadow-xl` separates them, since `select-line` is `transparent` in both themes.
- **Remote mode without `apiFieldsMap` throws.** It defaults to `null`, and `setRemoteData()` dereferences it unguarded (`t[this.apiFieldsMap.id]`), as do `getItemByValue()` and the toggle-title path — so the first response is a `TypeError`, not empty rows. Every remote example ships one; the minimum is `{"id": …, "title": …}` (`val` falls back to `title`). `apiDataPart` picks the sub-array inside an envelope response, and `apiFieldsMap.page`/`.offset`/`.limit` are what `apiLoadMore` uses to build the paging query.

## Copy-paste base
`examples/advanced-forms/advanced-select/basic-usage.html`

```html
<!-- Select -->
<select id="hs-basic-usage-example" data-hs-select='{
  "placeholder": "Select option...",
  "toggleTag": "<button type=\"button\" aria-expanded=\"false\"></button>",
  "toggleClasses": "hs-select-disabled:pointer-events-none hs-select-disabled:opacity-50 relative py-3 ps-4 pe-9 flex text-nowrap w-full cursor-pointer bg-layer border border-layer-line text-layer-foreground rounded-lg text-start text-sm hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus",
  "dropdownClasses": "mt-2 z-50 w-full max-h-72 p-1 space-y-0.5 bg-select border border-select-line rounded-lg shadow-xl overflow-hidden overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb",
  "optionClasses": "hs-selected:bg-select-item-active py-2 px-4 w-full text-sm text-select-item-foreground cursor-pointer hover:bg-select-item-hover rounded-lg focus:outline-hidden focus:bg-select-item-focus hs-select-disabled:pointer-events-none hs-select-disabled:opacity-50",
  "optionTemplate": "<div class=\"flex justify-between items-center w-full\"><span data-title></span><span class=\"hidden hs-selected:block\"><svg class=\"shrink-0 size-3.5 text-primary\" xmlns=\"http:.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"20 6 9 17 4 12\"/></svg></span></div>",
  "extraMarkup": "<div class=\"absolute top-1/2 inset-e-3 -translate-y-1/2\"><svg class=\"shrink-0 size-3.5 text-muted-foreground-1\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m7 15 5 5 5-5\"/><path d=\"m7 9 5-5 5 5\"/></svg></div>"
}' class="hidden">
  <option value="">Choose</option>
  <option>Name</option>
  <option disabled>Disabled</option>
  <option>Description</option>
  <option>User ID</option>
</select>
<!-- End Select -->
```
