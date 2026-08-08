---
component: copy-markup
label: Copy Markup
category: advanced-forms
docs: https://preline.co/docs/components/copy-markup.html
examples: 5
js: HSCopyMarkup
tokens: [layer, layer-line, layer-foreground, layer-hover, layer-focus, primary-focus, muted-foreground-1, foreground, primary, select, select-line, select-item-foreground, select-item-hover, select-item-focus, scrollbar-track, scrollbar-thumb, surface, surface-line, surface-foreground, surface-hover, surface-focus, overlay, overlay-line, overlay-header, overlay-footer, primary-line, primary-foreground, primary-hover]
---

# Copy Markup

A repeater: one button clones a template node into a wrapper on click, up to `limit`, with optional per-clone delete triggers.

## When to use
- Repeating form rows the user adds themselves — extra addresses, extra phone numbers, extra survey options.
- When the count is bounded and small; `limit` is the only backpressure and the button just gets `disabled`.
- Do NOT use to render a list you already have data for — clone-on-click has no data binding, no keys, and no ordering. Render server-side or in your framework instead.
- Do NOT use it for anything holding a JS component instance unless you re-init on the `copy` event (see Gotchas) — cloning copies markup, never listeners.

## Anatomy

Reduced skeleton (classes copied from `examples/advanced-forms/copy-markup/basic-usage.html` and `destroy-and-reinitialize.html`):

```html
<!-- wrapper: clones are appended here; its existing children are counted at init -->
<div id="wrap" class="space-y-3">
  <!-- template: cloned at INIT, its id is stripped from the clone -->
  <div id="tpl">
    <div class="relative">
      <input type="text" class="py-2.5 sm:py-3 ps-4 pe-8 block w-full bg-layer border-layer-line rounded-lg sm:text-sm text-foreground placeholder:text-muted-foreground-1 focus:border-primary-focus focus:ring-primary-focus">
      <!-- optional per-clone delete trigger, must live INSIDE the cloned node -->
      <span class="inline-flex absolute top-[15px] inset-e-2.5 text-red-400 cursor-pointer" data-hs-copy-markup-delete-item>...</span>
    </div>
  </div>
</div>

<!-- the trigger. disabled:* classes are load-bearing: `limit` works by setting [disabled] -->
<button type="button" data-hs-copy-markup='{
    "targetSelector": "#tpl",
    "wrapperSelector": "#wrap",
    "limit": 3
  }' class="py-1.5 px-2 inline-flex items-center gap-x-1 text-xs font-medium rounded-full bg-layer border border-dashed border-layer-line text-layer-foreground hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus disabled:opacity-50 disabled:pointer-events-none">
  Add
</button>
```

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Input repeater | Duplicate input field | `examples/advanced-forms/copy-markup/basic-usage.html` | Baseline. Template lives inside the wrapper, so the first row counts against `limit: 3` (2 clicks left). No delete trigger. |
| Select repeater | Duplicate select field | `examples/advanced-forms/copy-markup/select.html` (+ `.js`) | Template is a `[data-hs-select]` block. Sibling JS re-instantiates the clone: `const copyContent = HSCopyMarkup.getInstance('#hs-copy-select-content');` then, guarded by `if (copyContent)`, `copyContent.on('copy', (el) => { const select = el.querySelector('[data-hs-select]'); new HSSelect(select); });`. |
| Hidden template | Hidden template markup | `examples/advanced-forms/copy-markup/predefined-markup.html` | Wrapper starts **empty**; template lives in a separate `class="hidden"` host and is addressed with a child selector `"#hs-predefined-markup-content-for-copy > *"`. Count starts at 0, so all 3 clicks are available. |
| Inside a modal | Modal example | `examples/advanced-forms/copy-markup/modal-example.html` (+ `.js`) | Same select repeater nested in an `hs-overlay` dialog (`bg-overlay`, `border-overlay-header`/`-footer`). Init still happens on `window load` while the modal is hidden. |
| Destroy / reinit | Destroy and reinitialize | `examples/advanced-forms/copy-markup/destroy-and-reinitialize.html` (+ `.js`) | Adds `data-hs-copy-markup-delete-item` inside the template and two buttons calling `HSCopyMarkup.getInstance(el, true)` → `element.destroy()` and `HSCopyMarkup.autoInit()`. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` | Cloned input fill, and the add button's own fill | `white` | `neutral-800` |
| `layer-line` | Input border and the add button's `border-dashed` | `gray-200` | `neutral-700` |
| `layer-foreground` | Add-button label | `gray-800` | `white` |
| `layer-hover` | Add-button hover fill (darkens in light, **lightens** in dark) | `gray-50` | `neutral-700` |
| `layer-focus` | Add-button focus fill | `gray-50` | `neutral-700` |
| `foreground` | Text typed into the cloned inputs | `gray-800` | `neutral-200` |
| `muted-foreground-1` | Cloned input placeholder; chevron in the select variant | `gray-600` | `neutral-400` |
| `primary-focus` | Cloned input focus border + ring | `gray-900` | `neutral-300` |
| `primary` | Check icon in the cloned select's `optionTemplate` | `gray-800` | `white` |
| `select` | Cloned select's dropdown fill | `white` | `neutral-900` |
| `select-line` | Cloned select's dropdown border — transparent both modes | `transparent` | `transparent` |
| `select-item-foreground` | Cloned select option text | `gray-800` | `neutral-200` |
| `select-item-hover` / `select-item-focus` | Cloned select option hover/focus fill | `gray-100` | `neutral-800` |
| `scrollbar-track` | Dropdown / modal body scrollbar track | `gray-100` | `neutral-700` |
| `scrollbar-thumb` | Dropdown / modal body scrollbar thumb | `gray-300` | `neutral-500` |
| `overlay` | Modal panel fill | `white` | `neutral-800` |
| `overlay-line` | Modal panel border — transparent both modes | `transparent` | `transparent` |
| `overlay-header` / `overlay-footer` | Modal header/footer rules | `gray-200` | `neutral-700` |
| `primary` / `primary-foreground` / `primary-hover` / `primary-line` | Modal "Open modal" and "Save changes" buttons | `gray-800` / `white` / `gray-900` / `transparent` | `white` / `neutral-800` / `neutral-300` / `transparent` |
| `surface` / `surface-line` / `surface-foreground` / `surface-hover` / `surface-focus` | Modal close button, "Reinitialize" button | `gray-100` / `transparent` / `gray-800` / `gray-200` / `gray-200` | `neutral-700` / `transparent` / `neutral-200` / `neutral-600` / `neutral-600` |

## Behaviour (JS)

Class `HSCopyMarkup` (`assets/js/preline/copy-markup.js`). The select variants additionally construct `HSSelect`.

Init: `HSCopyMarkup.autoInit()` on `window load`; skips `.--prevent-on-load-init` and already-registered elements. Manual: `new HSCopyMarkup(el, options)`.

| Attribute | Purpose |
|---|---|
| `data-hs-copy-markup` | The trigger button + JSON options |
| `data-hs-copy-markup-delete-item` | Inside a cloned node: click removes that clone and re-enables the button |

Options (all default `null`): `targetSelector` — selector or element for the template; `wrapperSelector` — selector or element clones are appended to; `limit` — max number of counted items.

Lifecycle:
1. `init()` → `setTarget()` clones `targetSelector` **once** and calls `removeAttribute("id")` on that clone → `setWrapper()` → `addPredefinedItems()` → binds `click` on the button.
2. `addPredefinedItems()` walks `wrapper.children`, skips any with the class `[--ignore-for-count]`, and registers the rest as items (attaching their delete handlers). It routes them through the same `addToItems()` as a clone, which `wrapper.append()`s each one — so any `[--ignore-for-count]` child ends up before the counted ones regardless of authored order. If the count already meets `limit`, the button gets `[disabled]` immediately.
3. `copy()` returns `false` when `limit && items.length >= limit`; otherwise clones the frozen `this.target`, appends to the wrapper (or, with no wrapper, `this.el.before(clone)`), re-checks the limit and sets `[disabled]`.
4. `delete(item)` splices it out, `item.remove()`, and removes `[disabled]` when back under the limit.

Events: `instance.on('copy', clone)` / `instance.on('delete', item)`, plus DOM `CustomEvent`s **`copy.hs.copyMarkup`** and **`delete.hs.copyMarkup`** — both dispatched **on the clone**, never on the trigger. `copy` is dispatched after `addToItems()` has appended the clone, so it bubbles to the wrapper; `delete` is dispatched **after `item.remove()`**, on a detached node, so it bubbles nowhere.
Statics: `HSCopyMarkup.getInstance(target, isInstance)` (returns the instance; `true` returns `{id, element}`) · `autoInit()`.

## Gotchas

- **The template is frozen at init.** `setTarget()` clones `targetSelector` once, during `init()`. Editing the original node afterwards (typing into it, or a framework re-render) does not change what later clicks produce. If you need a live template, `destroy()` + `autoInit()`.
- **Clones lose their `id`** (`removeAttribute("id")` on the stored template). Any `<label for=...>`, `aria-controls`, or `aria-labelledby` pointing at the template's id is dangling in every clone — and if the id lived on an inner node instead, every clone carries a duplicate id.
- **Cloning copies markup, not JS.** A cloned `[data-hs-select]` / `[data-hs-combo-box]` / anything Preline is inert. The fix is in both select examples: subscribe to `copy` and construct the child plugin inside the handler — `copyContent.on('copy', (el) => { const select = el.querySelector('[data-hs-select]'); new HSSelect(select); });`. There is no automatic re-init.
- **Where you put the template decides the starting count.** `basic-usage` keeps it inside the wrapper, so `addPredefinedItems()` counts it and `limit: 3` yields only 2 more clicks. `predefined-markup` keeps an empty wrapper plus a separate `hidden` host and targets `"#... > *"`, so all 3 clicks are available. Opt a pre-existing child out of the count with the class `[--ignore-for-count]`.
- **`limit` is enforced by setting `[disabled]` on the button** — the `disabled:opacity-50 disabled:pointer-events-none` classes on the trigger are the only user-visible feedback. Drop them and the button looks clickable but does nothing.
- **`destroy()` leaks all but the last delete listener.** `addToItems()` overwrites the single field `this.onDeleteItemButtonClickListener` per item, and `destroy()` removes that one closure from every `[data-hs-copy-markup-delete-item]` — so earlier clones keep a live handler that calls into a torn-down instance.
- **`destroy()` is not idempotent.** It nulls `this.wrapper` after reading it; a second call throws on `this.wrapper.querySelectorAll`. It also leaves every clone in the DOM, so a following `autoInit()` re-counts them via `addPredefinedItems()` — the count survives the round trip, which is what the destroy/reinit example relies on.
- **`copy` bubbles, `delete` does not.** Both fire on the clone, not the button (`dispatch("copy.hs.copyMarkup", clone, clone)`), but `delete(item)` runs `item.remove()` *before* dispatching, so the node is already detached and no wrapper-level listener ever sees it. A delegated `copy` listener on the wrapper works; for `delete` use `instance.on('delete', cb)`.
- **Moon inverts the hover direction.** `layer` is `white` → `neutral-800` while `layer-hover`/`layer-focus` are `gray-50` → `neutral-700`: hovering the add button darkens it in light mode and lightens it in dark mode. Do not hand-pick a hover shade; use the token.
- **Inside a modal, init still happens at `window load`** while the dialog is hidden. That is fine for `HSCopyMarkup` (it does no measurement), but a child plugin constructed in the `copy` handler measures a visible node, so keep the construction in the event handler rather than at load time.
- `wrapperSelector` is optional: with no wrapper, clones are inserted with `this.el.before(clone)` — i.e. directly before the trigger button. All five examples supply a wrapper.

## Copy-paste base

`examples/advanced-forms/copy-markup/basic-usage.html`

```html
<div class="max-w-xs w-full">
  <!-- Input Group -->
  <div id="hs-wrapper-for-copy" class="space-y-3">
    <input id="hs-content-for-copy" type="text" class="py-2.5 sm:py-3 px-4 block w-full bg-layer border-layer-line rounded-lg sm:text-sm text-foreground placeholder:text-muted-foreground-1 focus:border-primary-focus focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none" placeholder="Enter Name">
  </div>

  <p class="mt-3 text-end">
    <button type="button" data-hs-copy-markup='{
        "targetSelector": "#hs-content-for-copy",
        "wrapperSelector": "#hs-wrapper-for-copy",
        "limit": 3
      }' class="py-1.5 px-2 inline-flex items-center gap-x-1 text-xs font-medium rounded-full bg-layer border border-dashed border-layer-line text-layer-foreground hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus disabled:opacity-50 disabled:pointer-events-none">
      <svg class="shrink-0 size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
      Add Name
    </button>
  </p>
  <!-- End Input Group -->
</div>
```
