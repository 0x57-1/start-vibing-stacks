# Preline 4.2.0 JS runtime reference

**What this answers:** which Preline module owns a component, the exact `data-hs-*` attribute or
class that auto-mounts it, what `HSStaticMethods.autoInit()` does and when to re-run it, each `HS*`
class's static/instance API, the CustomEvent names, and why a component silently dies after a
React/Inertia re-render. Read out of `$CLAUDE_PROJECT_DIR/.claude/skills/preline-moon/assets/js/preline/*.js`
(61 files, v4.2.0), not from upstream docs.

## 1. Which file to load

Under `assets/js/preline/`:

- `index.js` (= `preline.js`) — everything + `window.HSStaticMethods`. What `import 'preline'` resolves to.
- `non-auto.js` — same, minus the `window load` auto-mount.
- `<component>.js` — one component, self-mounting on `window load`.
- `<component>-non-auto.js` — one component, no auto-mount; you call `new HSX(el)`.
- `helper-clipboard.js` — binds ClipboardJS to `window.HS_CLIPBOARD_SELECTOR ?? '.js-clipboard'` +
  `data-clipboard-{text,target,success-text}`. Not an `HS*` class.
- `helper-apexcharts.js`, `utils.js`, `helper-shared.js` — chart/shared helpers, no components.

`index.js` sets `window.HSAccessibilityObserver`, `window.HSStaticMethods`, and all 27 `HS*` classes.

**Three ways to pull it in**, one per file in `examples/getting-started/index/` (verbatim):

```html
<!-- hs-installation-steps-add.js — classic script tag; auto-mounts everything on window load -->
<script src="./node_modules/preline/dist/preline.js"></script>
```
```html
<!-- hs-installation-steps-add-js-non-auto.html — named import, NO auto-mount; you construct -->
<script type="module">
  import { HSDropdown } from "./node_modules/preline/dist/non-auto.mjs";

  new HSDropdown(document.querySelector("#dropdown"));
</script>
```
```html
<!-- hs-installation-steps-add-js-plugin.html — default import of ONE plugin -->
<script type="module">
  import HSDropdown from "./node_modules/preline/dist/dropdown.mjs";

  new HSDropdown(document.querySelector("#dropdown"));
</script>
```

Note the import styles differ: `non-auto.mjs` exports the classes **named** (`import { HSDropdown }`),
a per-plugin `<component>.mjs` exports its class as **default** (`import HSDropdown`). Get that
backwards and you get `undefined`, not an error, until you call `new`.

The `.mjs` files are the ESM twins of the `dist/*.js` bundles; **only the `.js` set is mirrored
here** (`assets/js/preline/`), so read auto-mount behaviour off the `.js` file of the same name —
`<component>.js` self-mounts on `load`, `<component>-non-auto.js` does not.

## 2. Init model

Every module ends with `window.addEventListener("load", () => X.autoInit())` — **`load`, not
`DOMContentLoaded`**. Code running earlier sees no instances.

```js
window.HSStaticMethods.autoInit()                       // all 27 keys
window.HSStaticMethods.autoInit(['select','dropdown'])  // subset
window.HSStaticMethods.cleanCollection()                // empty every $hs*Collection array
window.HSStaticMethods.cleanCollection(['tabs'])
```

Each `autoInit()` does exactly three things: (1) prune its `window.$hs*Collection` of entries whose
`el` fails `document.contains()`; (2) `querySelectorAll(<mount selector>)`; (3) for each match **not
already in the collection**, `new HSX(el)`. Idempotent and additive — safe to call repeatedly, and
calling it after inserting DOM is the whole re-init story. It does **not** re-read options on an
already-mounted element; change the JSON and you must `destroy()` first.

**Opting out:** add class `--prevent-on-load-init` — every mount selector ends in
`:not(.--prevent-on-load-init)` — then construct by hand. Verbatim from
`examples/getting-started/preline-javascript/prevent-auto-init.html`:

```html
<script>
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-hs-select].--prevent-on-load-init').forEach((el) => new HSSelect(el));
  });
</script>
```

## 3. Master table — class → module → mount

For all 27, the module basename is also the `key` accepted by `autoInit([...])` /
`cleanCollection([...])`, and the collection is `window.$hs<Class minus HS>Collection` (`HSComboBox`
→ `$hsComboBoxCollection`). "Mount" is the literal `querySelectorAll` argument in that module's
`autoInit()`, minus the `:not(.--prevent-on-load-init)` suffix all of them carry.

| `HS*` class | module file (basename = the `key`) | Mount selector | Doc components |
|---|---|---|---|
| `HSAccordion` | `accordion.js` | `.hs-accordion` | accordion, sidebar, tree-view |
| `HSCarousel` | `carousel.js` | `[data-hs-carousel]` | carousel |
| `HSCollapse` | `collapse.js` | `.hs-collapse-toggle` | collapse, mega-menu, navbar, scrollspy (+1) |
| `HSComboBox` | `combobox.js` | `[data-hs-combo-box]` | combobox, searchbox |
| `HSCopyMarkup` | `copy-markup.js` | `[data-hs-copy-markup]` | copy-markup |
| `HSDataTable` | `datatable.js` | `[data-hs-datatable]` | datatables |
| `HSDatepicker` | `datepicker.js` | `.hs-datepicker` | advanced-datepicker |
| `HSDropdown` | `dropdown.js` | `.hs-dropdown` | dropdown, datatables |
| `HSFileUpload` | `file-upload.js` | `[data-hs-file-upload]` | file-upload |
| `HSInputNumber` | `input-number.js` | `[data-hs-input-number]` | input-number |
| `HSLayoutSplitter` | `layout-splitter.js` | `[data-hs-layout-splitter]` | layout-splitter, sidebar |
| `HSOverlay` | `overlay.js` | `.hs-overlay` | modal, offcanvas, mega-menu, sidebar, searchbox (+11) |
| `HSPinInput` | `pin-input.js` | `[data-hs-pin-input]` | pin-input |
| `HSRangeSlider` | `range-slider.js` | `[data-hs-range-slider]` | advanced-range-slider |
| `HSRemoveElement` | `remove-element.js` | `[data-hs-remove-element]` | alerts, badge, toasts |
| `HSScrollNav` | `scroll-nav.js` | `[data-hs-scroll-nav]` | navs, tabs |
| `HSScrollspy` | `scrollspy.js` | `[data-hs-scrollspy]` | scrollspy |
| `HSSelect` | `select.js` | `[data-hs-select]` | advanced-select, combobox, datatables, stepper (+2) |
| `HSStepper` | `stepper.js` | `[data-hs-stepper]` | stepper |
| `HSStrongPassword` | `strong-password.js` | `[data-hs-strong-password]` | strong-password |
| `HSTabs` | `tabs.js` | `[role="tablist"]:not(select)` | tabs, mega-menu, maps, stepper (+2) |
| `HSTextareaAutoHeight` | `textarea-auto-height.js` | `[data-hs-textarea-auto-height]` | textarea |
| `HSThemeSwitch` | `theme-switch.js` | `[data-hs-theme-switch]` **and** `[data-hs-theme-click-value]` | dark-mode |
| `HSToggleCount` | `toggle-count.js` | `[data-hs-toggle-count]` | toggle-count |
| `HSTogglePassword` | `toggle-password.js` | `[data-hs-toggle-password]` | toggle-password |
| `HSTooltip` | `tooltip.js` | `.hs-tooltip` | tooltip, popover |
| `HSTreeView` | `tree-view.js` | `[data-hs-tree-view]` | tree-view |

Six components mount on a **class** — `.hs-accordion`, `.hs-collapse-toggle`, `.hs-dropdown`,
`.hs-overlay`, `.hs-tooltip`, `.hs-datepicker` — and `HSTabs` mounts on `[role="tablist"]`. Grepping
for `data-hs-` alone misses all seven.

`HSAccordion` has a second pass fired on `load` only when `.hs-accordion-treeview-root` exists:
`HSAccordion.treeView()`, binding `.hs-accordion-selectable` clicks and reading
`data-hs-accordion-options` (JSON) off the root. `HSStaticMethods.autoInit()` does **not** call it.

## 4. Exhaustive `data-hs-*` table

Channels: **J** = value is `JSON.parse`d into constructor options; **S** = value is a selector for
`querySelector`; **F** = plain string flag/enum; **M** = presence-only marker.

**Plain mount + JSON options (J)** — read by the same-named module in §3; value is the options
object, absent value = `{}`:
`data-hs-carousel` · `data-hs-combo-box` · `data-hs-copy-markup` · `data-hs-layout-splitter` ·
`data-hs-pin-input` · `data-hs-scroll-nav` · `data-hs-select` · `data-hs-stepper` ·
`data-hs-strong-password` · `data-hs-textarea-auto-height` · `data-hs-toggle-count` ·
`data-hs-toggle-password` · `data-hs-tree-view`

### Mount / option carriers with a caveat

| Attribute | Reads | Ch | Role |
|---|---|---|---|
| `data-hs-datatable` | `datatable.js` | J | mount + options; needs `window.jQuery` + `window.DataTable` |
| `data-hs-datepicker` | `datepicker.js` | J | options on `.hs-datepicker` (class is the mount); needs `window.VanillaCalendarPro` |
| `data-hs-file-upload` | `file-upload.js` | J | mount + options; needs `window._` + `window.Dropzone` |
| `data-hs-range-slider` | `range-slider.js` | J | mount + options; needs `window.noUiSlider` |
| `data-hs-input-number` | `input-number.js` | J | mount + options, default `{step:1}`; read via `el.dataset.hsInputNumber` |
| `data-hs-tabs` | `tabs.js` | J | options JSON on the `[role="tablist"]` (mount is the role, not this) |
| `data-hs-theme-switch` | `theme-switch.js` | J | mount, `change` type + options |
| `data-hs-theme-click-value` | `theme-switch.js` | F | second `HSThemeSwitch` mount, `click` type; value = theme to set |
| `data-hs-remove-element` | `remove-element.js` | S | mount; selector of the element to remove |
| `data-hs-scrollspy` | `scrollspy.js` | M | mount marker on the nav; value **not** read — sections come from the links' `href` |
| `data-hs-accordion-options` | `accordion.js` | J | JSON on `.hs-accordion-treeview-root`, `treeView()` only |
| `data-hs-overlay-options` | `overlay.js` | J | extra options merged onto an `.hs-overlay` |
| `data-hs-remove-element-options` | `remove-element.js` | J | extra options |
| `data-hs-scrollspy-options` | `scrollspy.js` | J | extra options (e.g. `ignoreScrollUp`) |

### Overlay / Collapse / Tabs / Dropdown / Scrollspy hooks

| Attribute | Reads | Ch | Role |
|---|---|---|---|
| `data-hs-overlay` | `overlay.js` | S | on a **trigger**: selector of the `.hs-overlay`. Overlay finds triggers via `[data-hs-overlay="#<its id>"]` |
| `data-hs-overlay-minifier` | `overlay.js` | S | trigger calling `minify()`, matched as `[data-hs-overlay-minifier="#<id>"]` (sidebar) |
| `data-hs-overlay-keyboard` | `overlay.js` | F | `"false"` disables Esc/backdrop close; default `true` |
| `data-hs-overlay-backdrop-container` | `overlay.js` | S | where to append the generated backdrop |
| `data-hs-overlay-backdrop-template` | `overlay.js` | M | stamped **by** Preline on the backdrop it creates — not authored |
| `data-hs-collapse` | `collapse.js` (`el.dataset.hsCollapse`), `textarea-auto-height.js` | S | on a `.hs-collapse-toggle`: selector of the content |
| `data-hs-tab` | `tabs.js`, `textarea-auto-height.js` | S | on a `[role="tab"]`: selector of its panel |
| `data-hs-tab-select` | `tabs.js` | S | on the tablist: selector of a `<select>` mirroring the tabs |
| `data-hs-tabs-vertical` | `tabs.js` | F | `"true"` switches the arrow-key axis (= `aria-orientation="vertical"`) |
| `data-hs-dropdown-toggle` | `dropdown.js` | M | keyboard-nav fallback for `.hs-dropdown-toggle` |
| `data-hs-dropdown-item` | `dropdown.js` | M | keyboard-nav fallback for `[role="menuitem"] / a / button` |
| `data-hs-dropdown-transition` | `dropdown.js` | M | element whose `transitionend` gates the close; falls back to the menu |
| `data-hs-scrollspy-scrollable-parent` | `scrollspy.js` | S | scroll container; default `document` |
| `data-hs-scrollspy-group` | `scrollspy.js` | M | wrapper of a nested nav; its first `[href]` also gets `.active` |
| `data-hs-appearance-onload-styles` | `theme-switch.js` | M | stamped on the injected `*{transition:unset}` tag — not authored |

### Child hooks by owning module (`querySelector`/`All`; presence-only unless noted)

| Module | Attributes |
|---|---|
| `combobox.js` | `data-hs-combo-box-input` · `-output` · `-output-item` · `-output-item-field` · `-output-item-attr` · `-output-items-wrapper` · `-output-item-hide-if-empty` · `-value` · `-search-text` · `-toggle` · `-open` · `-close` · `-group-title` (value = group name) · `-item-stored-data` |
| `input-number.js` | `data-hs-input-number-input` · `-increment` · `-decrement` |
| `pin-input.js` | `data-hs-pin-input-item` |
| `stepper.js` | `data-hs-stepper-nav-item` · `-content-item` · `-back-btn` · `-next-btn` · `-skip-btn` · `-complete-step-btn` · `-finish-btn` · `-reset-btn` |
| `strong-password.js` | `data-hs-strong-password-hints-rule-text` · `-hints-weakness-text` |
| `toggle-password.js` | `data-hs-toggle-password-group` |
| `tree-view.js` | `data-hs-tree-view-item` (JSON per item) |
| `layout-splitter.js` | `data-hs-layout-splitter-item` · `-horizontal-group` · `-vertical-group` |
| `copy-markup.js` | `data-hs-copy-markup-delete-item` |
| `accordion.js` | `data-hs-accordion-always-open` (on `.hs-accordion-group`; siblings stay open) |
| `select.js`, `datepicker.js` | `data-hs-select-option` (JSON per `<option>`) · `data-hs-select-dropdown` (click-guard marker) |
| `datatable.js` | `data-hs-datatable-search` · `-page-entities` · `-info` · `-info-from` · `-info-to` · `-info-length` · `-paging` · `-paging-prev` · `-paging-next` · `-paging-pages` · `-row-selecting-all` · `-row-selecting-individual` |
| `file-upload.js` | `data-hs-file-upload-trigger` · `-pseudo-trigger` · `-clear` · `-remove` · `-reload` · `-preview` · `-previews` · `-file-name` · `-file-size` · `-file-ext` · `-file-icon` · `-progress-bar` · `-progress-bar-pane` · `-progress-bar-value` |

### In the examples but read by NO module in 4.2.0

| Attribute | Real mechanism |
|---|---|
| `data-hs-overlay-close` (modal), `data-hs-overlay-close-on-resize` (mega-menu) | none — the button already has `data-hs-overlay="#id"`, which toggles |
| `data-hs-dropdown-auto-close` (dropdown) | the class `[--auto-close:inside]` on the same element |
| `data-hs-transition` (dropdown) | `data-hs-dropdown-transition` |
| `data-hs-file-upload-file-error`, `-file-success` | not queried by `file-upload.js` |
| `data-hs-datatable-action-type`, `-col-index`, `-col-reorder`, `-col-sorting` | DataTables.net config, not Preline |
| `data-hs-editor-{bold,italic,underline,strike,link,ol,ul,blockquote,code,field}` | no editor module exists; the doc page wires Quill |
| `data-hs-nested-draggable` (tree-view) | drag lib in the example, not the module |
| `data-hs-associated-tab`, `data-hs-clipboard-options`, `data-hs-component-color-theme`, `data-hs-component-dark-mode{,-option,-value}`, `data-hs-theming-jsx`, `data-hs-theming-utility{,-dark-classes}` | preline.co docs-site chrome — never copy |

## 5. Options that are CSS custom properties, not attributes

`HSOverlay`, `HSDropdown`, `HSTooltip`, `HSScrollspy` and `HSAccordion` read most config with
`getClassProperty(el, '--name', default)` → `getComputedStyle().getPropertyValue()`. In markup that is
a Tailwind arbitrary property on the same element.

`overlay.js` reads `--auto-close` `--auto-close-equality-type` `--auto-hide` `--body-scroll`
`--close-when-click-inside` `--has-autofocus` `--has-dynamic-z-index` `--is-layout-affect` `--opened`
`--overlay-backdrop` `--overlay-scroll-behavior` `--tab-accessibility-limited`
`--toggle-classes-immediately`; `dropdown.js` reads `--auto-close` `--autofocus-on-keyboard-only`
`--has-autofocus` `--trigger`; `accordion.js` reads `--stop-propagation` (toggle) and
`--keep-one-open` (group).

Values present in the examples:

```
[--placement:{top,bottom,left,right,top-left,top-right,bottom-left,bottom-right,auto}]
[--trigger:{click,hover,focus,contextmenu}]   [--auto-close:{false,inside,outside,sm,lg}]
[--strategy:{absolute,fixed,static}]          [--scope:window]  [--opened:lg]
[--adaptive:{adaptive,none}]  [--gpu-acceleration:false]  [--body-scroll:true]
[--overlay-backdrop:{false,static}]  [--overlay-scroll-behavior:inside-viewport]
[--is-layout-affect:true]  [--is-collapse:{true,false}]  [--is-toggle-tooltip:false]
[--scrollspy-offset:{70,220}]
```

Read through `getComputedStyle` **at construction time only** — toggling a `[--placement:*]` class
from React changes nothing until you `destroy()` + `autoInit()`.

## 6. Static + instance API

`getInstance(target, isRaw)` exists on all 27 classes. `target` is an element or a selector string.
With `isRaw = true` it returns `{ id, element }`; with a falsy second argument it returns **the
element**, not the instance — so `getInstance(el).open()` is always a bug. `HSOverlay.getInstance` has
an extra hop: if the target itself carries `data-hs-overlay` it resolves that selector first, so you
may pass either the trigger or the overlay.

All 27 classes have an instance `destroy()`: it removes listeners and splices the element out of
`window.$hs*Collection`, which is what lets a later `autoInit()` re-create it.

| Class | Statics beyond `autoInit`/`getInstance` | Instance methods beyond `destroy()` |
|---|---|---|
| `HSAccordion` | `show` `hide` `on` `findInCollection` `treeView` `toggleSelected` | `show()` `hide()` `update()` |
| `HSCollapse` | `show` `hide` `on` `findInCollection` | `show()` `hide()` |
| `HSOverlay` | `open` `close` `minify` `setOpened` `on` `findInCollection` | `open()` `close()` `minify(flag)` `isOpened()` `updateToggles()` |
| `HSDropdown` | `open` `close` `closeCurrentlyOpened` `on` `findInCollection` `ensureGlobalHandlers` | `open()` `close()` `isOpened()` `forceClearState()` |
| `HSTooltip` | `show` `hide` `on` `findInCollection` | `show()` `hide()` |
| `HSSelect` | `open` `close` `closeCurrentlyOpened` `findInCollection` `ensureGlobalHandlers` | `setValue(v)` `hasValue(v)` `setDisabledState(b)` `addSelectOption()` `removeSelectOption()` `clearSelections()` |
| `HSComboBox` | `close` `closeCurrentlyOpened` `ensureGlobalHandlers` | `open()` `close()` `setValue(v)` `getCurrentData()` `setCurrent()` |
| `HSDatepicker` | `open` `close` `closeCurrentlyOpened` `findInCollection` `ensureGlobalHandlers` | `getCurrentState()` `formatDate(d,fmt)` |
| `HSTabs` | `open` `on` | `open(target)` |
| `HSLayoutSplitter` | `on` `findInCollection` `ensureGlobalHandlers` | `getData()` `setSplitterItemSize()` `updateFlexValues()` |
| `HSTreeView` | `on` `findInCollection` | `getSelectedItems()` `selectItem()` `unselectItem()` `update()` |
| `HSRangeSlider` | `isAvailable` — false when `window.noUiSlider` is absent | `setDisabled(b)` |
| `HSCarousel` | — | `goTo(i)` `goToPrev()` `goToNext()` `recalculateWidth()` |
| `HSScrollspy` | — | `scrollTo()` `update()` |
| `HSScrollNav` | — | `goTo()` `centerElement()` `getCurrentState()` |
| `HSTogglePassword` | — | `show()` `hide()` |
| `HSInputNumber` | — | `changeValue()` |
| `HSCopyMarkup` `HSDataTable` `HSFileUpload` `HSPinInput` `HSRemoveElement` `HSStepper` `HSStrongPassword` `HSTextareaAutoHeight` `HSThemeSwitch` `HSToggleCount` | — | `destroy()` only |

## 7. Event model

**A. Bubbling `CustomEvent`s** on the component element, payload in `event.detail.payload`:

- `HSAccordion` — `beforeOpen.hs.accordion` `open.hs.accordion` `beforeClose.hs.accordion` `close.hs.accordion`
- `HSCollapse` — `beforeOpen.hs.collapse` `open.hs.collapse` `hide.hs.collapse`
- `HSOverlay` — `open.hs.overlay` `close.hs.overlay` `toggleClicked.hs.overlay` `toggleMinifierClicked.hs.overlay`
- `HSDropdown` — `open.hs.dropdown` `close.hs.dropdown` · `HSTooltip` — `show.hs.tooltip` `hide.hs.tooltip`
- `HSTabs` — `change.hs.tab` · `HSComboBox` — `select.hs.combobox` · `HSTreeView` — `click.hs.treeView`
- `HSSelect` — `change.hs.select` `load.hs.select`
- `HSDatepicker` — `change.hs.datepicker` (+ `change.hs.select` / `load.hs.select` from its inner selects)
- `HSStepper` — `active` `back` `next` `beforeNext` `skip` `complete` `finish` `beforeFinish` `reset`, all `.hs.stepper`
- `HSLayoutSplitter` — `drag` `onPrevLimit` `onPrevPreLimit` `onNextLimit` `onNextPreLimit`, all `.hs.layoutSplitter`
- `HSScrollspy` — `beforeScroll.hs.scrollspy` `afterScroll.hs.scrollspy`
- `HSInputNumber` — `change.hs.inputNumber` · `HSPinInput` — `completed.hs.pinInput`
- `HSStrongPassword` — `change.hs.strongPassword` · `HSCopyMarkup` — `copy.hs.copyMarkup` `delete.hs.copyMarkup`
- `HSTogglePassword` — `toggle.hs.toggle-select` *(sic — inconsistent in 4.2.0)*

Nothing is dispatched by `HSCarousel`, `HSDataTable`, `HSFileUpload`, `HSRangeSlider`,
`HSRemoveElement`, `HSScrollNav`, `HSTextareaAutoHeight`, `HSThemeSwitch`, `HSToggleCount`.

**B. Per-instance callbacks** — same name minus the `.hs.*` suffix (`open`, `close`, `change`,
`select`, `completed`, `drag`, …):

```js
const { element } = HSComboBox.getInstance('#my-combobox', true);
element.on('select', (payload) => { /* ... */ });

HSTabs.on('change', '#my-tablist', (payload) => { /* ... */ });
```

Callbacks live on the instance, so **`destroy()` drops them** and a later `autoInit()` yields a fresh
instance with none. Re-register after every re-init, or listen for the bubbling event on an ancestor.

## 8. The re-init trap (SPA / React / Inertia)

Preline mounts once on `window load` and holds a hard reference to the DOM node in
`window.$hs*Collection`. A client-side render swaps that node: the collection entry points at a
detached element, the new element is never mounted, and the component is dead with **no console
error**. Fix: re-run `autoInit()` after the new DOM is committed. This repo, `resources/js/app.jsx`:

```js
const initPreline = async () => {
    await import('preline');
    if (window.HSStaticMethods) {
        window.HSStaticMethods.autoInit();
    }
};

initPreline();
router.on('navigate', () => {
    setTimeout(initPreline, 100);
});
```

1. **The `setTimeout` is load-bearing.** `autoInit()` is a synchronous `querySelectorAll`. In the same
   tick as the navigation event it runs before React commits, finds nothing, mounts nothing. The React
   equivalent is `useEffect(() => { HSStaticMethods.autoInit() })` with **no dependency array** — it
   must run after every commit, not once.

2. **Third-party-backed components are resolved at import time and never re-checked.** `index.js`
   builds its `COLLECTIONS` registry once, at module evaluation:
   `{key:"datepicker", fn: void 0 !== globalThis.VanillaCalendarPro ? Datepicker : null}`, likewise
   `range-slider` (`noUiSlider`), `datatable` (`jQuery` **and** `DataTable`), `file-upload` (`_` **and**
   `Dropzone`). If those globals are absent when `preline` is imported, `fn` stays `null` for the life
   of the page and `autoInit()` silently skips that component forever — so assign them *before*
   `await import('preline')`, as `app.jsx` does.

3. **`autoInit()` never re-reads options.** For a node that survived the render with the same identity
   but changed `data-hs-select='{...}'` or `[--placement:*]`, call
   `getInstance(el, true).element.destroy()` first. Verbatim,
   `examples/base-components/accordion/destroy-and-reinitialize.js`:

   ```js
   destroy.addEventListener('click', () => {
     accordions.forEach((el) => {
       const {element} = HSAccordion.getInstance(el, true);

       element.destroy();
     });
   });

   autoInit.addEventListener('click', () => {
     HSAccordion.autoInit();
   });
   ```

   The same file exists for 20+ components at `examples/*/*/destroy-and-reinitialize.js`.

4. **Overlays escape the React tree.** `HSOverlay` appends its backdrop to `document.body` (or to
   `data-hs-overlay-backdrop-container`) and adds `hs-overlay-body-open` to `<body>`. Unmounting the
   modal's subtree without `close()`/`destroy()` leaves the backdrop and the scroll lock behind.

Narrower re-init — verbatim from
`examples/getting-started/preline-javascript/static-method-auto-init.html`:

```js
    window.HSStaticMethods.autoInit(['select']);
```

## 9. Known 4.2.0 quirks

| Quirk | Consequence |
|---|---|
| `collapse.js` ends with `window.HSAccordion = HSCollapse` (its own banner says `HSCollapse`) | Loading the **standalone** collapse module clobbers `window.HSAccordion`. Not an issue with `index.js`. |
| `HSScrollNav.autoInit()` prunes `$hsRemoveElementCollection`, not `$hsScrollNavCollection` | Detached scroll-nav instances are never pruned, and `autoInit(['scroll-nav'])` on a page where `remove-element` never initialised throws `TypeError`. Full `autoInit()` is safe only because `remove-element` precedes `scroll-nav` in `COLLECTIONS`. |
| `HSAccordion.treeView()` is not part of `autoInit()` | After an SPA render, `.hs-accordion-treeview-root` selection handlers are gone. Call it yourself. |
| `HSTogglePassword` dispatches `toggle.hs.toggle-select` | Listeners following the `<name>.hs.<component>` convention miss it. |
| `HSTabs` mounts on `[role="tablist"]` | Any list carrying that role gets mounted and arrow-key handled, intended or not. |
| `datepicker.js` bundles a full `HSSelect` (172 KB standalone) | It builds month/year selects with `new HSSelect(...)` directly; it does **not** export `window.HSSelect` nor auto-mount page-level `[data-hs-select]`. |
