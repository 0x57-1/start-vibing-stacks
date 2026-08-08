---
component: drag-and-drop
label: Drag and Drop
category: third-party-plugins
docs: https://preline.co/docs/components/drag-and-drop.html
examples: 5
js: none (Sortable.js -- Preline ships only the hs-dragged variant)
tokens: [layer, layer-line, layer-foreground, muted-foreground-1, muted-foreground]
---

# Drag and Drop

Reorderable lists built on the third-party **Sortable.js** library; Preline supplies only the themed markup and a `hs-dragged:` variant.

## When to use
- Manual ordering the user owns: priority queues, column pickers, kanban-ish two-list moves.
- Moving items *between* two lists (`group` option) — one Sortable per `<ul>`, same options object.
- **Do not use** for a hierarchy that also needs expand/collapse, checkboxes or keyboard nav: `tree-view` (`HSTreeView`, `data-hs-tree-view`) already ships dragging plus a11y. The nested example here is a hand-rolled subset of that.
- **Do not use** for a static, non-reorderable list — that is `list-group` markup with no JS.

## Anatomy

Reduced skeleton (classes all appear in `examples/third-party-plugins/drag-and-drop/basic-usage-example.html`):

```html
<!-- container: Sortable is constructed on THIS element; children become items -->
<ul id="hs-basic-usage-example-sortable" class="max-w-xs flex flex-col">
  <!-- item: bg-layer + border-layer-line + text-layer-foreground carry the theme.
       -mt-px + first:rounded-t-lg + last:rounded-b-lg collapse the borders into one stack. -->
  <li class="inline-flex items-center gap-x-3 py-3 px-4 cursor-grab text-sm font-medium bg-layer border border-layer-line text-layer-foreground -mt-px first:rounded-t-lg first:mt-0 last:rounded-b-lg">
    <svg class="shrink-0 size-4">…</svg>          <!-- leading icon, inherits currentColor -->
    Newsletter
    <svg class="shrink-0 size-4 ms-auto text-muted-foreground">…</svg>  <!-- grip affordance -->
  </li>
</ul>
```

```js
new Sortable(document.querySelector('#hs-basic-usage-example-sortable'), {
  animation: 150,
  dragClass: 'rounded-none!',
});
```

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| Library tag | Installation | `examples/third-party-plugins/drag-and-drop/how-to-use-assets-library.html` | One `<script src="./assets/vendor/sortablejs/Sortable.min.js">`. Nothing else; Sortable is **not** bundled in `preline.js`. |
| Default sortable list | Default sortable list | `examples/third-party-plugins/drag-and-drop/basic-usage-example.html` (+ `.js`) | Single `<ul>`, whole `<li>` draggable (`cursor-grab` on the item). Trailing grip icon is `text-muted-foreground`. Init runs immediately in an IIFE, no `load` wait. |
| Shared lists | Shared lists | `examples/third-party-plugins/drag-and-drop/shared.html` (+ `.js`) | Two `<ul>`s in `grid grid-cols-1 md:grid-cols-2 gap-5`; one shared `options` object with `group: 'shared'` passed to **two** `new Sortable(...)` calls, so items cross lists. Grip icon switches to `text-muted-foreground-1` (see the token note below — that is darker in light, *lighter* in dark). |
| Drag handle | Drag handle | `examples/third-party-plugins/drag-and-drop/handle.html` (+ `.js`) | `cursor-grab` moves off the `<li>` onto a **leading** icon marked `.hs-handle`; `handle: '.hs-handle'` restricts the grab area. Item text is now selectable. |
| Nested sortable lists | Nested sortable lists | `examples/third-party-plugins/drag-and-drop/nested.html` (+ `.js`) | Rows are `<div>` cards (`p-3 … rounded-lg`, not a border-collapsed stack). `querySelectorAll("#hs-nested-sortable .nested-sortable")` matches **4** elements (the root `.nested-sortable` plus the 3 `ps-5 space-y-1 nested-sortable` child containers — the `#hs-nested-sortable` div itself is excluded by the descendant combinator) and the loop constructs one Sortable per match with `group: 'nested'`, `fallbackOnBody: true`, `swapThreshold: 0.65`. **No `dragClass` here** — this is the one example that omits it. Indentation is `ps-5` on the child container. |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` | Resting fill of every row (`bg-layer`) | `white` | `neutral-800` |
| `layer-line` | Row border; with `-mt-px` becomes the shared divider (`border-layer-line`) | `gray-200` | `neutral-700` |
| `layer-foreground` | Row label + leading icon `currentColor` (`text-layer-foreground`) | `gray-800` | `white` |
| `muted-foreground-1` | Grip / handle icon in `shared`, `handle`, `nested` | `gray-600` | `neutral-400` |
| `muted-foreground` | Grip icon in `basic-usage-example` only | `gray-500` | `neutral-500` |

**The two grip tokens do not rank the same way in both modes.** Light: `muted-foreground` `gray-500` → `muted-foreground-1` `gray-600` is one step *darker*. Dark: `muted-foreground` `neutral-500` → `muted-foreground-1` `neutral-400` is one step *lighter*. So "the shared/handle/nested grip is stronger than the basic one" holds in both modes, but not by moving in the same direction — never reason about these two from the light values alone.

There is **no hover/active token** on these rows: `grep -o "hover:[a-z0-9:/.-]*" examples/third-party-plugins/drag-and-drop/*.html` returns nothing. Drag feedback is purely Sortable's own classes.

## Behaviour (JS)
Static markup only — no Preline JS. Sortable.js is the whole runtime.

- Load `assets/vendor/sortablejs/Sortable.min.js`; the global is `Sortable`.
- Construct per container: `new Sortable(el, options)`. There is no `data-hs-*` attribute and no autoInit — Preline's `HSStaticMethods.autoInit()` will not touch these lists.
- Options used across the examples: `animation: 150` (all), `dragClass: 'rounded-none!'` (basic/shared/handle), `handle: '.hs-handle'` (handle), `group: 'shared' | 'nested'` (shared/nested), `fallbackOnBody: true` + `swapThreshold: 0.65` (nested).
- Preline ships a Tailwind variant for the drag state in `assets/css/variants.css:57` (comment header: `/* Sortable.js */`):
  ```css
  @custom-variant hs-dragged {
    &.dragged {
      @slot;
    }
  }
  ```
  so `hs-dragged:*` applies only while an element literally carries the class `dragged`. **These five examples never produce that class** — they pass `dragClass: 'rounded-none!'`, so the variant is dead here.
- **`hs-dragged:` is wired through `ghostClass`, not `dragClass`.** The files that actually use the variant are the `tree-view` examples, and they opt in explicitly: `examples/base-components/tree-view/checkbox.js:14` and `examples/base-components/tree-view/draggable-and-auto-collapse-one-level-group.js:14` both pass `ghostClass: 'dragged'` to Sortable. `examples/base-components/tree-view/draggable.html` then styles it with `hs-dragged:bg-primary-100`, `hs-dragged:bg-primary-800`, `hs-dragged:rounded`. If you want `hs-dragged:` on a plain list here, add `ghostClass: 'dragged'` — swapping the string into `dragClass` styles the wrong element (Sortable's `dragClass` = the element under the cursor, `ghostClass` = the drop placeholder).

## Gotchas
- **Init timing differs between examples and it matters.** `basic-usage-example.js` runs a bare IIFE; `handle.js`, `shared.js` and `nested.js` all wrap it in `window.addEventListener('load', …)`. Copy the `load` form — a bare IIFE placed above the markup gets `null` from `querySelector`, and `new Sortable(null, …)` throws, killing the rest of that script block. It is loud, not silent, but it takes the following statements with it.
- **`dragClass: 'rounded-none!'` needs the `!`.** `first:rounded-t-lg` compiles to `.first\:rounded-t-lg:first-child` — specificity (0,2,0) against plain `.rounded-none` (0,1,0) — so it wins on its own. Without the Tailwind v4 `!` important suffix the dragged element keeps its rounded end-cap and looks wrong mid-list.
- **Shared lists must share one options object**, but each list still needs its own `new Sortable`. Constructing on the wrapping `grid` div instead makes the two `<ul>`s themselves draggable.
- **`group` is what enables cross-list drops** — omit it and `shared`/`nested` degrade to independent lists with no error.
- **`dark:bg-transparent` is on every wrapper in `nested.html`, not just the item wrappers** — 20 occurrences: the 17 `.nested-1` (×5) / `.nested-2` (×8) / `.nested-3` (×4) divs *and* the 3 inner `ps-5 space-y-1 nested-sortable` containers. The one wrapper without it is the root `.nested-sortable space-y-1`. None carries a light-mode background class, so the utility only ever cancels an inherited dark fill. Copy it verbatim rather than pruning it as redundant; it is the only background declaration in the file besides `bg-layer` on the cards.
- **Reordering the DOM does not persist anything.** No example wires `onEnd`; you must add `onEnd: evt => …` yourself and post `evt.oldIndex`/`evt.newIndex`.
- **Re-render kills the instance.** If a framework replaces the `<ul>`'s children the Sortable instance still points at the old container; destroy (`sortable.destroy()`) and re-construct after any dynamic re-render.
- A11y: the grip is a decorative `<svg>` with no `aria-label` and the rows are not focusable. Pointer-only. If keyboard reorder is a requirement, use `tree-view` instead.

## Copy-paste base

`examples/third-party-plugins/drag-and-drop/handle.html` (smallest complete list; trimmed to one `<li>` — the second and third are identical but for the label):

```html
<!-- Drag and Drop -->
<ul id="hs-handle-sortable" class="max-w-xs flex flex-col">
  <li class="inline-flex items-center gap-x-3 py-3 px-4 text-sm font-medium bg-layer border border-layer-line text-layer-foreground -mt-px first:rounded-t-lg first:mt-0 last:rounded-b-lg">
    <svg class="hs-handle cursor-grab shrink-0 size-4 text-muted-foreground-1" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/></svg>
    Newsletter
  </li>
</ul>
<!-- End Drag and Drop -->
```

`examples/third-party-plugins/drag-and-drop/handle.js`:

```html
<script>
  window.addEventListener('load', () => {
    (function () {
      const sortable = document.querySelector("#hs-handle-sortable");

      new Sortable(sortable, {
        animation: 150,
        handle: '.hs-handle',
        dragClass: 'rounded-none!'
      });
    })();
  });
</script>
```
