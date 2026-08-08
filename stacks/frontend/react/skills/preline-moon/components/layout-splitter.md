---
component: layout-splitter
label: Layout Splitter
category: layout-and-content
docs: https://preline.co/docs/components/layout-splitter.html
examples: 6
js: HSLayoutSplitter
tokens: [foreground, line-2, layer, layer-line, muted-foreground, muted-hover, surface-1, layer-foreground, layer-hover, layer-focus, surface, surface-line, surface-foreground, surface-hover, surface-focus]
---

# Layout Splitter

Drag-resizable panel groups: flex children whose `flex-grow` is rewritten as the user drags an injected grip, IDE-style.

## When to use
- Editor / console / preview layouts where the user decides how space is split.
- Nested splits (a vertical stack whose middle row is itself split horizontally) — the plugin walks nested groups natively.
- NOT for a static sidebar + content shell: plain `flex` + a fixed `w-64` is cheaper and needs no JS.
- NOT for reordering or collapsing panes — there is no collapse API here, only min/pre-limit sizes.

## Anatomy
Reduced skeleton — every attribute and class appears verbatim in `examples/layout-and-content/layout-splitter/horizontal-direction.html`:

```html
<!-- 1. Root: holds the options JSON. Splitter grips are generated from these templates. -->
<div data-hs-layout-splitter='{
  "horizontalSplitterTemplate": "<div><span class=\"… bg-layer border border-layer-line text-muted-foreground rounded-md cursor-col-resize hover:bg-muted-hover\">…</span></div>",
  "horizontalSplitterClasses": "relative flex border-s border-line-2"
}'>
  <!-- 2. Group: a flex row (horizontal) or flex-col (vertical) with a fixed height -->
  <div class="flex border border-line-2 rounded-lg h-50" data-hs-layout-splitter-horizontal-group>
    <!-- 3. Item: value = starting percentage; inline style seeds flex-grow before JS runs -->
    <div class="overflow-hidden h-full" data-hs-layout-splitter-item="48.2" style="flex: 48.2 1 0px;">
      <div class="flex items-center justify-center h-full p-3 text-foreground">Left</div>
    </div>
    <div class="overflow-hidden h-full" data-hs-layout-splitter-item="30.0" style="flex: 30 1 0px;">…</div>
  </div>
</div>
```

The group needs an explicit height (`h-50`, `h-150`) — flex percentages have nothing to divide otherwise. Items need `overflow-hidden` so content cannot force a pane wider than its share.

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| Horizontal | Horizontal direction | `examples/layout-and-content/layout-splitter/horizontal-direction.html` | one `data-hs-layout-splitter-horizontal-group` in a `flex h-50`; grip is `w-4 h-6 cursor-col-resize`, track `border-s border-line-2` |
| Vertical | Vertical direction | `examples/layout-and-content/layout-splitter/vertical-direction.html` | `data-hs-layout-splitter-vertical-group` in `flex flex-col h-150`; grip `w-6 h-4 cursor-row-resize`, track `border-t border-line-2`. **Grip template here is hardcoded `bg-white … dark:bg-neutral-800`, not tokens** |
| Nested | Mixed directions | `examples/layout-and-content/layout-splitter/mixed-direction.html` | a vertical group whose middle item hosts a `data-hs-layout-splitter-horizontal-group`; both templates declared on the same root |
| Manual grips | Manually added splitters | `examples/layout-and-content/layout-splitter/manually-added-splitters.html` | options reduce to `{"isSplittersAddedManually": true}`; you author `<div class="hs-layout-splitter-control relative flex border-t border-line-2">` between items yourself |
| Min sizes | Minimum sizes | `examples/layout-and-content/layout-splitter/limit-size.html` | item value becomes JSON `{"dynamicSize": 30.0, "minSize": 10.0}`; one pane adds `hs-prev-limit-reached:bg-surface-1` |
| Destroy / re-init | Destroy and Reinitialize | `examples/layout-and-content/layout-splitter/destroy-and-reinitialize.html` (+ `.js`) | root gets `id="hs-layout-splitter-to-destroy"`; two buttons call `HSLayoutSplitter.getInstance(el, true).element.destroy()` and `HSLayoutSplitter.autoInit()` |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `foreground` | pane content text (`text-foreground` on every pane body) | `gray-800` | `neutral-200` |
| `line-2` | group outline (`border border-line-2`) and the splitter track (`border-s` / `border-t border-line-2`) | `gray-200` | `neutral-700` |
| `layer` | grip handle fill (`bg-layer`) | `white` | `neutral-800` |
| `layer-line` | grip handle border (`border-layer-line`) | `gray-200` | `neutral-700` |
| `muted-foreground` | grip dots icon (`text-muted-foreground`) | `gray-500` | `neutral-500` |
| `muted-hover` | grip fill on hover (`hover:bg-muted-hover`) | `gray-100` | `neutral-700` |
| `surface-1` | limit-reached pane tint (`hs-prev-limit-reached:bg-surface-1`, `limit-size.html` only) | `gray-200` | `neutral-600` |
| `layer-foreground` / `layer-hover` / `layer-focus` | "Destroy" button in `destroy-and-reinitialize.html` (on `bg-layer border-layer-line`) | `gray-800` / `gray-50` / `gray-50` | `white` / `neutral-700` / `neutral-700` |
| `surface` / `surface-line` / `surface-foreground` / `surface-hover` / `surface-focus` | "Reinitialize" button in the same file | `gray-100` / `transparent` / `gray-800` / `gray-200` / `gray-200` | `neutral-700` / `transparent` / `neutral-200` / `neutral-600` / `neutral-600` |

## Behaviour (JS)
Class `HSLayoutSplitter`, exposed as `window.HSLayoutSplitter` by `assets/js/preline/layout-splitter.js` (v4.2.0). Non-auto build: `assets/js/preline/layout-splitter-non-auto.js`.

**Init path.** The module registers `window.addEventListener('load', () => HSLayoutSplitter.autoInit())`. `autoInit()` queries `[data-hs-layout-splitter]:not(.--prevent-on-load-init)`, skips elements already in `window.$hsLayoutSplitterCollection`, and constructs the rest. It also prunes collection entries whose `el` is no longer `document.contains(...)`, so calling it again after a dynamic render is safe and idempotent.

**Attributes.**

| Attribute | On | Meaning |
|---|---|---|
| `data-hs-layout-splitter` | root | JSON options object (below). Presence alone is enough. |
| `data-hs-layout-splitter-horizontal-group` | group | children split left/right; grips get `horizontalSplitterTemplate` + `horizontalSplitterClasses` |
| `data-hs-layout-splitter-vertical-group` | group | children split top/bottom; grips get `verticalSplitterTemplate` + `verticalSplitterClasses` |
| `data-hs-layout-splitter-item` | pane | either a bare number string (`"48.2"` = `dynamicSize`) or JSON `{"dynamicSize":…, "minSize":…}`. Source also reads `preLimitSize`. |

**Options** (keys read from the root JSON): `horizontalSplitterTemplate`, `verticalSplitterTemplate` (HTML string, default `"<div></div>"`, inserted `afterend` of each item but the last), `horizontalSplitterClasses`, `verticalSplitterClasses` (applied to the generated control, which the module then also tags with `hs-layout-splitter-control`), `isSplittersAddedManually` (boolean — skip generation; `buildControl()` instead adopts **positionally**, taking `nextItem.previousElementSibling` and only resetting `style.display`, and adds no class for you).

**Statics.** `HSLayoutSplitter.autoInit()`; `HSLayoutSplitter.getInstance(target, isInstance)` — `target` is an element or selector string; with `isInstance` truthy it returns the collection record `{ id, element }` (hence `const { element } = …; element.destroy()`), otherwise it returns the raw `el`, or `null` if unknown; `HSLayoutSplitter.on(eventName, target, callback)` binds a callback onto the instance found in the collection.

**Instance methods** (from the module): `destroy()`, `updateHorizontalSplitter()`, `updateVerticalSplitter()`, `updateSingleSplitter(el)`, `setSplitterItemSize(el, size)`, `updateSplitterItemParam(el, value)`, `getSplitterItemSingleParam(el, name)`, `getSplitterItemParsedParam(el)`, `getData(el)` (returns `{el, dynamicSize, dynamicFlexSize, minSize, minFlexSize, preLimitSize, preLimitFlexSize, static}`), `updateFlexValues([{id, breakpoints}])` (picks a value per `window.innerWidth`, then re-normalises the group to 100%).

**Events.** Each fires twice — once through the instance callback registry (`fireEvent(name, payload)`, reachable via `HSLayoutSplitter.on(name, …)`) and once as a bubbling `CustomEvent` on the root element with the payload under `event.detail.payload`:

| Instance name | DOM event name | Fires when |
|---|---|---|
| `drag` | `drag.hs.layoutSplitter` | every pointermove while a grip is held |
| `onPrevLimit` | `onPrevLimit.hs.layoutSplitter` | the previous pane hit its `minSize` |
| `onNextLimit` | `onNextLimit.hs.layoutSplitter` | the next pane hit its `minSize` |
| `onPrevPreLimit` | `onPrevPreLimit.hs.layoutSplitter` | previous pane reached its `preLimitSize` threshold |
| `onNextPreLimit` | `onNextPreLimit.hs.layoutSplitter` | next pane reached its `preLimitSize` threshold |

Payload: `prev` / `next` (elements), `previousSize` / `previousFlexSize` / `previousMinSize` / `previousMinFlexSize` / `previousPreLimitSize` / `previousPreLimitFlexSize` plus the `next*` mirrors, and `static: { prev: {minSize, preLimitSize}, next: {minSize, preLimitSize} }`.

**Drag mechanics.** `pointerdown` on a control adds `dragging` to the control **and to both neighbouring `[data-hs-layout-splitter-item]`s**, and sets `document.body.style.userSelect = 'none'`; a single document-level `pointermove` handler locates `.hs-layout-splitter-control.dragging`, computes sizes, and writes `el.style.flex = "<pct> 1 0"` on both neighbours while updating their `data-hs-layout-splitter-item` value. The `document` `pointermove` + `pointerup` pair is installed in `init()` behind the static `isListenersInitialized` guard and removed by `destroy()` once `window.$hsLayoutSplitterCollection` is empty; `ensureGlobalHandlers()` is a different thing — it seeds the collection array and installs a one-time **window** `pointerup` that strips the `dragging` classes, and that one is never removed.

## Gotchas
- **The grip template is a JSON-encoded HTML string.** Every inner quote is escaped (`class=\"…\"`). Editing it by hand breaks the whole attribute and the root silently fails to init — nothing throws, the panes just do not resize. Change classes in the template string, not on a rendered node.
- **`vertical-direction.html` is not themed.** Its `verticalSplitterTemplate` hardcodes raw palette classes — `bg-white border border-gray-200 text-gray-400 … hover:bg-gray-100 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-600 dark:hover:bg-neutral-900` — instead of the `bg-layer` / `border-layer-line` / `text-muted-foreground` / `hover:bg-muted-hover` used by every other example, so that one grip ignores the moon theme. Copy the grip from `limit-size.html` or `mixed-direction.html` if you want moon tokens.
- **Init is bound to `window load`, not `DOMContentLoaded`.** Anything rendered by a router or an Axios response after load will not be picked up — call `HSLayoutSplitter.autoInit()` after the render (it skips already-registered roots), which is exactly what the re-init button in `destroy-and-reinitialize.js` does.
- **`destroy()` does not remove manual grips, it hides them** (`style.display = 'none'` when `isSplittersAddedManually`, `.remove()` otherwise). It also clears `style.flex` on every item, so panes snap back to equal widths, and drops document listeners once the collection is empty.
- **The inline `style="flex: 48.2 1 0px"` is load-bearing before JS runs.** Without it the panes render equal and visibly jump when the plugin initialises. Keep the inline style in sync with the `data-hs-layout-splitter-item` value.
- **`hs-prev-limit-reached:` is a Preline plugin variant, not a Tailwind one, and nothing in the vendored runtime toggles it.** The string occurs exactly once in this skill (`limit-size.html`), and `layout-splitter.js` only ever adds two classes: `dragging` and `hs-layout-splitter-control`. The variant is expected from `@import './src/plugins/layout-splitter/variants.css'` (line 18 of `assets/css/variants.css`), which is **not** vendored here — so its selector and its trigger cannot be confirmed offline. Treat the limit tint as unverified: check it in the running app before depending on it, and never as the only signal of a limit (use the `onPrevLimit` event).
- **Manual mode: position selects the grip, the class is what makes the drag resolve.** `buildControl()` adopts `nextItem.previousElementSibling`, so the grip must sit immediately before the next pane regardless of its classes — but the document-level move/up handlers find the active grip with `document.querySelector('.hs-layout-splitter-control.dragging')`, and in manual mode the module never adds that class. So `hs-layout-splitter-control` is mandatory on your wrapper. The theme classes (`relative flex border-t border-line-2`) are yours; the hook class is not optional.
- Grip count is items minus one per group. In manual mode you must place them yourself between every pair, including inside nested groups (`manually-added-splitters.html` has four).
- Add `--prevent-on-load-init` to the root to opt a splitter out of `autoInit` and construct it yourself.
- `.dragging` is looked up document-wide with a single `querySelector`, so two simultaneous pointer drags (multi-touch) resolve to whichever control matches first. Treat it as single-drag.
- Nested groups must sit **inside** a `data-hs-layout-splitter-item`, not beside one (`mixed-direction.html`): the outer item is the flex child, the inner group is its content.

## Copy-paste base
`examples/layout-and-content/layout-splitter/horizontal-direction.html`

```html
<div data-hs-layout-splitter='{
  "horizontalSplitterTemplate": "<div><span class=\"absolute top-1/2 inset-s-1/2 -translate-x-1/2 -translate-y-1/2 block w-4 h-6 flex justify-center items-center bg-layer border border-layer-line text-muted-foreground rounded-md cursor-col-resize hover:bg-muted-hover\"><svg class=\"shrink-0 size-3.5\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"9\" cy=\"12\" r=\"1\"/><circle cx=\"9\" cy=\"5\" r=\"1\"/><circle cx=\"9\" cy=\"19\" r=\"1\"/><circle cx=\"15\" cy=\"12\" r=\"1\"/><circle cx=\"15\" cy=\"5\" r=\"1\"/><circle cx=\"15\" cy=\"19\" r=\"1\"/></svg></span></div>",
  "horizontalSplitterClasses": "relative flex border-s border-line-2"
}'>
  <div class="flex border border-line-2 rounded-lg h-50" data-hs-layout-splitter-horizontal-group>
    <div class="overflow-hidden h-full" data-hs-layout-splitter-item="48.2" style="flex: 48.2 1 0px;">
      <div class="flex items-center justify-center h-full p-3 text-foreground">Left</div>
    </div>
    <div class="overflow-hidden h-full" data-hs-layout-splitter-item="30.0" style="flex: 30 1 0px;">
      <div class="flex items-center justify-center h-full p-3 text-foreground">Center</div>
    </div>
    <div class="overflow-hidden h-full" data-hs-layout-splitter-item="21.8" style="flex: 21.8 1 0px;">
      <div class="flex items-center justify-center h-full p-3 text-foreground">Right</div>
    </div>
  </div>
</div>
```
