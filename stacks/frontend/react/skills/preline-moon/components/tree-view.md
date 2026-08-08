---
component: tree-view
label: Tree View
category: base-components
docs: https://preline.co/docs/components/tree-view.html
examples: 8
js: HSTreeView, HSAccordion
tokens: [foreground, muted-active, muted-hover, muted-focus, muted-foreground-1, muted-foreground-2, line-2, line-3, primary, primary-checked, primary-100, primary-800]
---

# Tree View

A nested, collapsible file-explorer list built on `HSAccordion` for expand/collapse, with an optional `HSTreeView` layer on top that adds selection, item paths, checkbox control and drag-reorder.

## When to use

- Hierarchical navigation where branches expand in place: file browsers, category pickers, org charts, nested settings.
- You need the selected node's **path** (`"assets/css/main"`) — `HSTreeView` computes it for you.
- **Do not** use for a flat expandable list — use `accordion` alone.
- **Do not** use for a sidebar nav with routes — the selection model here is DOM-class based (`.selected`), not URL-based.

## Anatomy

Two mutually exclusive wirings ship in these 8 files. Pick one; do not mix.

**A — accordion-only tree** (`basic-usage-example`, `close-currently-opened`, `customize-example`). Reduced skeleton:

```html
<div class="hs-accordion-treeview-root" role="tree" aria-orientation="vertical">
  <!--      ^ REQUIRED: HSAccordion.treeView() only runs if this class exists in the DOM at load -->
  <div class="hs-accordion-group" role="group" data-hs-accordion-always-open>
    <!--      ^ sibling scope         ^ omit this attribute → opening a branch closes its open sibling -->
    <div class="hs-accordion active" role="treeitem" aria-expanded="true" id="…-heading-one">
      <div class="hs-accordion-heading py-0.5 flex items-center gap-x-0.5 w-full">
        <button class="hs-accordion-toggle size-6 … hover:bg-muted-hover focus:bg-muted-focus" aria-expanded="true" aria-controls="…-collapse-one">…</button>
        <div class="grow hs-accordion-selectable hs-accordion-selected:bg-muted-active px-1.5 rounded-md cursor-pointer">…label…</div>
        <!--            ^ click target for selection   ^ variant that paints the selected row -->
      </div>
      <div id="…-collapse-one" class="hs-accordion-content w-full overflow-hidden transition-[height] duration-300" role="group" aria-labelledby="…-heading-one">
        <div class="hs-accordion-group ps-7 relative before:absolute before:top-0 before:inset-s-3 before:-ms-px before:h-full before:border-s before:border-line-2" role="group" data-hs-accordion-always-open>
          <!--                        ^ indent  ^ the vertical guide is a ::before, not a border on the box -->
```

**B — `HSTreeView` tree** (`multiple-selection`, `draggable`, `draggable-and-auto-collapse-one-level-group`, `checkbox`, `destroy-and-reinitialize`). Same accordion scaffold for expand/collapse, but:

```html
<div id="hs-tree-view" role="tree" aria-orientation="vertical" data-hs-tree-view>
  <!--  ^ id required (getInstance looks it up)                    ^ init hook; JSON value = options -->
  <div class="hs-accordion active" role="treeitem" … data-hs-tree-view-item='{ "value": "assets", "isDir": true }'>
    <!--                                              ^ per-item options; "value" builds the path -->
    <div class="hs-accordion-heading … hs-tree-view-selected:bg-muted-active">
      <!--                              ^ DIFFERENT variant than wiring A -->
```

Leaves carry `data-hs-tree-view-item` with `"isDir": false` and no accordion at all.

## Variants

All paths below are under `examples/base-components/tree-view/`.

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Default tree view | Default tree view | `…/basic-usage-example.html` | Wiring A. 3× `hs-accordion-group` all with `data-hs-accordion-always-open`, so branches stay open independently. 19 `hs-accordion-selectable` rows, glyphs `text-muted-foreground-1`, `+`/`−` toggle (`hs-accordion-active:hidden` on the vertical stroke) |
| Close sibling branches | Close sibling branches | `…/close-currently-opened.html` | Wiring A with `data-hs-accordion-always-open` removed from all 3 groups → opening a branch collapses its open sibling. Not otherwise identical to `basic-usage-example.html`: those same 3 group wrappers also lose `role="group"` (11 → 8 in the file), the id prefix changes to `hs-close-currently-opened-tree-*`, and the SVGs are pretty-printed across several lines. Only the always-open attribute is behavioural |
| Custom tree styling | Custom tree styling | `…/customize-example.html` | Wiring A with a rotating chevron (`hs-accordion-active:rotate-90 transition duration-300 size-2.5 text-muted-foreground-2`) instead of `+`/`−`, and a different glyph set. Icons are dropped from the **nested branch** rows (heading is just `<div class="flex items-center gap-x-3"><div class="grow">…`), while the top branch and every leaf keep one. 22 selectable rows |
| Multi-select tree | Multi-select tree | `…/multiple-selection.html` | Wiring B, bare `data-hs-tree-view` (defaults, `controlBy: "button"`). 21 items. Adds disabled items — a leaf (`px-2 hs-tree-view-selected:bg-muted-active hs-tree-view-disabled:opacity-50 disabled`, line 119) and a branch (`hs-accordion hs-tree-view-disabled:opacity-50 disabled`, line 414) whose toggle carries `hs-tree-view-disabled:pointer-events-none` + the `disabled` attribute. No drag, and no `hs-accordion-group` anywhere |
| Draggable tree | Draggable tree | `…/draggable.html` + `.js` | Wiring B + `data-hs-nested-draggable` on 9 containers + `hs-dragged:bg-primary-100 dark:hs-dragged:bg-primary-800 hs-dragged:rounded` and a `nested-N` class per branch (`nested-1`…`nested-4`). Keeps 3 `hs-accordion-group` wrappers. Root id `hs-tree-view-nested`. ⚠️ its `.js` is a mining artifact — see Gotchas |
| Draggable with one-level auto-collapse | Draggable with one-level auto-collapse | `…/draggable-and-auto-collapse-one-level-group.html` + `.js` | Byte-identical to `draggable.html` except the root id (`hs-tree-view-nested-alt`) and all 19 glyphs moving `text-muted-foreground-1` → `-2` (20 changed lines total). The auto-collapse needs BOTH halves: the `onEnd` sibling-hide block in the `.js` **and** the `hs-accordion-group` wrappers in the markup, which its predicate requires (see Gotchas) |
| Tree with checkboxes | Tree with checkboxes | `…/checkbox.html` + `.js` | Wiring B, root id `hs-tree-view-checkbox`, options `{"controlBy": "checkbox", "autoSelectChildren": true}`. Label becomes `<label class="flex items-center"><input type="checkbox" … value="assets"><span class="ms-3">assets</span></label>`; input styled `bg-transparent border-line-3 rounded-sm shadow-2xs text-primary … checked:bg-primary-checked checked:border-primary-checked`. **Input `value` must equal the item's `"value"`**. Also fully drag-wired (9 `data-hs-nested-draggable`, `nested-2-1`…`nested-2-4`, `hs-dragged:` pair) but with **zero** `hs-accordion-group` — no file/folder glyphs at all, hence no `muted-foreground-*` |
| Destroy and reinitialize | Destroy and reinitialize | `…/destroy-and-reinitialize.html` + `.js` | Wiring B, root id `hs-tree-view-to-destroy`, drag containers present (9, `nested-1`…`nested-4`) but **without** the `hs-accordion-group` class the two draggable files carry. The `.js` tears down `HSTreeView` + every `HSAccordion`, then re-runs both `autoInit()`s |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `foreground` | node label text and the `+`/`−` toggle glyph | `gray-800` | `neutral-200` |
| `muted-active` | **selected row fill** (both `hs-accordion-selected:` and `hs-tree-view-selected:`) | `gray-100` | `neutral-700` |
| `muted-hover` | toggle button hover fill | `gray-100` | `neutral-700` |
| `muted-focus` | toggle button focus fill | `gray-100` | `neutral-700` |
| `muted-foreground-1` | folder/file glyphs in `basic`, `close-currently-opened`, `customize`, `draggable`, `destroy` | `gray-600` | `neutral-400` |
| `muted-foreground-2` | glyphs in `multiple-selection` + `auto-collapse`; the `customize` chevron | `gray-700` | `neutral-300` |
| `line-2` | the `before:border-s` vertical indent guide at every level | `gray-200` | `neutral-700` |
| `line-3` | checkbox border (unchecked) | `gray-300` | `neutral-600` |
| `primary` | checkbox tick colour (`text-primary`) | `gray-800` | `white` |
| `primary-checked` | checked checkbox fill and border | `gray-800` | `white` |
| `primary-100` | drag ghost fill, light mode (`hs-dragged:bg-primary-100`) | `gray-100` | `neutral-100` |
| `primary-800` | drag ghost fill, dark mode (`dark:hs-dragged:bg-primary-800`) | `gray-800` | `neutral-800` |

## Behaviour (JS)

Source of truth: `assets/js/preline/tree-view.js` and `assets/js/preline/accordion.js` (both Preline 4.2.0).

**Two engines.** `HSAccordion` runs expand/collapse for *both* wirings, plus selection for wiring A only:
- `window` `load` → `HSAccordion.autoInit()`, then **`if (document.querySelectorAll('.hs-accordion-treeview-root').length) HSAccordion.treeView()`**.
- `treeView()` reads `data-hs-accordion-options` off each root, then binds click on every `.hs-accordion-selectable` inside it. The handler `stopPropagation()`s and calls the static `HSAccordion.toggleSelected(entry, el)` (`entry.el` is the `.hs-accordion-treeview-root`), which branches: if the clicked row **already** has `.selected` it just removes it (click-to-deselect); otherwise it clears `.selected` from every selectable in that root and adds it to the clicked one → single selection. There is no multi-select in wiring A, modifier key or not.
- `data-hs-accordion-always-open` on an `.hs-accordion-group` keeps siblings open; without it, opening one closes the currently open sibling.

`HSTreeView` (`window.HSTreeView`, collection `window.$hsTreeViewCollection`):

| Surface | Detail |
|---|---|
| Init | `window` `load` → `HSTreeView.autoInit()`, which selects `[data-hs-tree-view]:not(.--prevent-on-load-init)` and skips elements already in the collection. Manual: `new HSTreeView(el, options)` |
| Root options | JSON in `data-hs-tree-view`, merged under the constructor's 2nd arg: `controlBy` (`"button"` default \| `"checkbox"`), `autoSelectChildren` (default `false`), `isIndeterminate` — **always `true`, not configurable** (`opts?.isIndeterminate \|\| true`, so `false` reads back as `true`) |
| Item options | JSON in `data-hs-tree-view-item`: `value` (path segment), `isDir`, `id` (falls back to the element id, else auto `tree-view-item-{group}-{index}`), `isSelected` (default `false`) |
| Selection class | `.selected` added/removed on the `[data-hs-tree-view-item]` element. Items carrying `.disabled` are skipped by both click and `selectChildren` |
| Multi-select | `elementClick` calls `unselectItem(item)` **unless** `e.metaKey \|\| e.shiftKey` — so multi-select is Cmd/Meta-click or Shift-click, not a config flag |
| Checkbox mode | Binds `change` on `input[value="<item.value>"]` inside the item. `controlChange` always calls `selectItem` first; then, **only with `autoSelectChildren` AND the item's `"isDir": true`**, `selectChildren` (sets `.selected` + `checked` on every non-disabled descendant), then `toggleParent` (walks ancestors, setting `checked` and, since `isIndeterminate` is forced on, `indeterminate` for partial selections). Without `autoSelectChildren` it is `selectItem` alone — no cascade |
| Path | `getPath(el)` walks `closest('[data-hs-tree-view-item]')` upward collecting `value`, reverses, joins with `/` |
| Instance methods | `getItem(id)`, `getSelectedItems()`, `selectItem(el, item)`, `unselectItem(item?)`, `selectChildren`, `toggleParent`, `update()`, `destroy()` |
| Statics | `HSTreeView.autoInit()`, `getInstance(target, isInstance)`, `findInCollection(target)`, `on(evtName, target, cb)` |
| Events | Instance callback via `.on('click', cb)`; **plus** a bubbling DOM event `click.hs.treeView` dispatched on the root with `detail.payload = { el, data }` |

**Drag** is Sortable.js, not Preline. `checkbox.js` and `draggable-and-auto-collapse-one-level-group.js` are byte-identical to each other: on `load` they walk `document.querySelectorAll('[data-hs-nested-draggable]')` and construct one `Sortable` per element, merging the element's own JSON on top of the defaults —

```js
const data = el.getAttribute('data-hs-nested-draggable');
const dataOptions = data ? JSON.parse(data) : {};
const sortable = new Sortable(el, _.merge(options, dataOptions));
```

— with `group: 'nested'`, `animation: 150`, `fallbackOnBody: true`, `swapThreshold: 0.65`, `ghostClass: 'dragged'`. `onEnd` does two things: if the moved node has `.hs-accordion`, `HSAccordion.getInstance(item, true).element.update()` and then a pass over `window.$hsAccordionCollection` hiding any *other* open accordion in the same group (this is the "one-level auto-collapse"); if it has `data-hs-tree-view-item`, `HSTreeView.getInstance(item.closest('[data-hs-tree-view]'), true).element.update()` to recompute paths. Requires `lodash` (`_.merge`) and `Sortable` on the page — both are `<script src>`-ed at the top of those two `.js` files.

## Gotchas

- **The two selection variants are not interchangeable.** Wiring A paints with `hs-accordion-selected:bg-muted-active` and needs `hs-accordion-selectable` + a `.hs-accordion-treeview-root` ancestor. Wiring B paints with `hs-tree-view-selected:bg-muted-active` and needs `data-hs-tree-view-item`. Grep confirms zero overlap: the 3 wiring-A files have 19–22 `hs-accordion-selected:` and 0 `hs-tree-view-selected:`; the 5 wiring-B files have 29 and 0 respectively. Use the wrong variant and clicking silently does nothing visible.
- **`hs-accordion-treeview-root` is a hard gate.** `HSAccordion.treeView()` returns `false` immediately if no element carries that class, and the load handler does not even call it. Rendered a wiring-A tree after `load` (React/Vue/Inertia)? You must call `HSAccordion.treeView()` yourself — `HSAccordion.autoInit()` alone gives you expand/collapse with dead selection.
- **`HSTreeView.autoInit()` also only runs at `load`.** Dynamically-rendered wiring-B trees need an explicit `HSTreeView.autoInit()` (it is idempotent — it filters out elements already in `$hsTreeViewCollection` and drops detached ones).
- **After a drag you must call `update()`.** `getPath()` reads live DOM ancestry, but `items[].path` is cached at init. Skip `update()` and `getSelectedItems()[n].path` reports the pre-drag location — wrong, with no error.
- **Checkbox `value` is the join key.** `controlByCheckbox` does `el.querySelector('input[value="' + item.value + '"]')`. If the input's `value` attribute drifts from the item JSON's `"value"`, the listener is never bound and the checkbox is inert. It is also the path segment, so it does double duty.
- **Multi-select needs a modifier key** (Cmd/Meta or Shift). There is no `multiple: true` option. `multiple-selection.html` looks like plain click-to-multi-select but is not.
- **Under moon, selected / hover / focus are the SAME colour.** `muted-active`, `muted-hover` and `muted-focus` all resolve to `gray-100` (light) / `neutral-700` (dark). A selected row and a hovered row are indistinguishable. If that matters, override at project level — no Preline knob changes it.
- **`primary-100` / `primary-800` do not invert under moon** (`gray-100`→`neutral-100`, `gray-800`→`neutral-800`), which is exactly why the drag ghost ships as an explicit pair `hs-dragged:bg-primary-100 dark:hs-dragged:bg-primary-800`. Do not collapse it to one class.
- **`hs-dragged` = `.dragged`**, defined in `assets/css/variants.css` (`@custom-variant hs-dragged { &.dragged { @slot; } }`). It matches Sortable's `ghostClass: 'dragged'` — change one and you must change the other.
- **The indent guide is a `::before`, not a border.** `before:absolute before:top-0 before:inset-s-3 before:-ms-px before:h-full before:border-s before:border-line-2` on the group requires `relative` on the same element. Copy the pair or the line escapes to the nearest positioned ancestor.
- **`aria-expanded` is duplicated** on the `.hs-accordion` container *and* its `.hs-accordion-toggle`; `aria-controls` / `aria-labelledby` cross-reference the collapse id and heading id. All ids in the shipped examples are prefixed per example — dedupe them or two trees on one page will cross-wire.
- **The one-level auto-collapse is gated on `hs-accordion-group` in the MARKUP.** Its `onEnd` predicate is `el.element.el.closest('.hs-accordion-group') && …` before `el.element.hide()`. `draggable.html` / `draggable-and-auto-collapse-one-level-group.html` carry 3 such wrappers; `checkbox.html` and `destroy-and-reinitialize.html` carry **zero** — so those two run the identical drag JS and never collapse a sibling. Ship the JS without the wrapper class and the feature is silently absent.
- **Collapsed branches carry `hidden`** on `.hs-accordion-content` and drop `active` from `.hs-accordion` — in `multiple-selection.html`, `<div class="hs-accordion" role="treeitem" aria-expanded="false" …>` at line 135 with its `hs-accordion-content hidden` at line 159. Initial state is markup, not JS.
- Mining artifacts in this skill, verified by reading the files: **`draggable.js` does not contain the drag code** — it holds an `HSLayoutSplitter` destroy snippet (the JS tabs are shifted; the real Sortable wiring is in `draggable-and-auto-collapse-one-level-group.js` and `checkbox.js`, which are identical to each other). And **`destroy-and-reinitialize.html` does not contain the `#hs-destroy-tree-view` / `#hs-auto-init-tree-view` buttons** its `.js` queries — only the tree was captured. `index.json` also lists `HSLayoutSplitter` under this component's `hs_js` for that reason; it is not a real dependency.

## Copy-paste base

Root + one leaf, verbatim from `examples/base-components/tree-view/multiple-selection.html` (root open tag from line 2, leaf block from lines 440–454). The full file is 461 lines — cat it for the nested branches.

```html
<!-- Tree Root -->
<div id="hs-tree-view" role="tree" aria-orientation="vertical" data-hs-tree-view>
        <!-- 1st Level Item -->
        <div class="hs-tree-view-selected:bg-muted-active px-2 rounded-md cursor-pointer" role="treeitem" data-hs-tree-view-item='{
          "value": "index.html",
          "isDir": false
        }'>
          <div class="flex items-center gap-x-3">
            <svg class="shrink-0 size-4 text-muted-foreground-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
            <div class="grow">
              <span class="text-sm text-foreground">
                index.html
              </span>
            </div>
          </div>
        </div>
        <!-- End 1st Level Item -->
</div>
<!-- End Tree Root -->
```
