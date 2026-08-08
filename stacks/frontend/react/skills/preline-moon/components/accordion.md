---
component: accordion
label: Accordion
category: base-components
docs: https://preline.co/docs/components/accordion.html
examples: 9
js: HSAccordion
tokens: [foreground, muted-foreground-1, primary-active, layer, layer-line, layer-hover, layer-focus, layer-foreground, surface, surface-line, surface-hover, surface-focus, surface-foreground]
---

# Accordion

A group of toggleable disclosure panels whose open/closed state is an `active` class on each item, animated by JS writing an explicit pixel `height` on the content element.

## When to use

- FAQ lists, grouped settings, long forms split into optional sections.
- When more than one section may legitimately be open at once (`data-hs-accordion-always-open`) — that is what separates it from tabs.
- **Not** for one standalone show/hide — use `collapse` (no group bookkeeping, no sibling auto-close).
- **Not** for mutually exclusive *views* of the same region — use `tabs`; an accordion collapses to zero height and reflows the page on every click.
- **Not** as a tree/file explorer — that is the same class with `.hs-accordion-treeview-root` + `HSAccordion.treeView()`, a different markup contract.

## Anatomy

Reduced skeleton — every class/attribute appears in `examples/base-components/accordion/basic-usage-example.html`.

```html
<div class="hs-accordion-group">                          <!-- scope for auto-close -->
  <div class="hs-accordion active" id="heading-one">      <!-- `active` = open -->
    <button class="hs-accordion-toggle hs-accordion-active:text-primary-active
                   text-foreground hover:text-muted-foreground-1 focus:text-muted-foreground-1"
            aria-expanded="true" aria-controls="collapse-one">
      <svg class="hs-accordion-active:hidden block size-3.5">…</svg>   <!-- closed icon -->
      <svg class="hs-accordion-active:block hidden size-3.5">…</svg>   <!-- open icon -->
      Accordion #1
    </button>
    <div id="collapse-one"
         class="hs-accordion-content w-full overflow-hidden transition-[height] duration-300"
         role="region" aria-labelledby="heading-one">
      …                                                    <!-- add `hidden` here when closed -->
    </div>
  </div>
</div>
```

Three class names are contractual and queried by JS: `.hs-accordion` (the instance), `.hs-accordion-toggle` (first match inside), `.hs-accordion-content` (first match inside). `.hs-accordion-group` is found with `closest()`. `hs-accordion-active:*` is a Preline variant keyed on `.active` on the `.hs-accordion` ancestor.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Default | Default accordion | `examples/base-components/accordion/basic-usage-example.html` | Baseline. Plus/minus icons before the label, item #1 pre-opened (`active` + content without `hidden`). |
| Always open | Always open | `examples/base-components/accordion/always-open.html` | Adds `data-hs-accordion-always-open` to the group. Identical markup otherwise; opening an item no longer closes its siblings. |
| Nested | Nested | `examples/base-components/accordion/nested.html` | A second `<div class="hs-accordion-group ps-6">` lives inside item #1's `.hs-accordion-content`, with its own 3 items (`hs-basic-nested-sub-heading-{one,two,three}`) whose plus/minus icons are `size-3` on a `viewBox="0 0 16 16"`, against `size-3.5` / 24×24 outside. Inner group closes only inner siblings. |
| Without arrow | Without arrow | `examples/base-components/accordion/no-arrow.html` | Both indicator SVGs deleted; toggle is text only. |
| With arrow | With arrow indicator | `examples/base-components/accordion/with-arrow.html` | Plus/minus swapped for chevron-down / chevron-up, `size-4`, still leading the label. |
| Stretched title/arrow | Separated title and arrow | `examples/base-components/accordion/with-title-and-arrow-stretched.html` | Icons moved **after** the label and given `ms-auto`, pushing the chevron to the far end. |
| Bordered | Bordered | `examples/base-components/accordion/bordered.html` | Item gets `bg-layer border border-layer-line -mt-px first:rounded-t-lg last:rounded-b-lg`; toggle padding `py-4 px-5`; content body wrapped in `<div class="pb-4 px-5">`. |
| Bordered open content | Bordered open content | `examples/base-components/accordion/active-content-bordered.html` | Group becomes `flex flex-col gap-y-2`; item is `bg-layer border border-transparent rounded-xl` + `hs-accordion-active:border-layer-line` — the border only appears while open. Toggle is `justify-between`; item #2 is the pre-opened one. |
| Destroy / reinit | Destroy and reinitialize | `examples/base-components/accordion/destroy-and-reinitialize.html` + `examples/base-components/accordion/destroy-and-reinitialize.js` | Adds a `hs-accordion-to-destroy` marker class per item and two control buttons styled with `bg-layer/border-layer-line/hover:bg-layer-hover/focus:bg-layer-focus` and `bg-surface/border-surface-line/hover:bg-surface-hover/focus:bg-surface-focus`. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `foreground` (`text-foreground`) | Resting toggle label + body copy | `gray-800` | `neutral-200` |
| `muted-foreground-1` (`hover:` / `focus:text-…`) | Toggle label on hover and keyboard focus | `gray-600` | `neutral-400` |
| `primary-active` (`hs-accordion-active:text-primary-active`) | Toggle label while the item is open | `gray-900` | `neutral-300` |
| `layer` (`bg-layer`) | Item surface in the bordered variants | `white` | `neutral-800` |
| `layer-line` (`border-layer-line`) | Item border (always-on, or `hs-accordion-active:` only) | `gray-200` | `neutral-700` |
| `layer-foreground` (`text-layer-foreground`) | "Destroy" control button label | `gray-800` | `white` |
| `layer-hover` / `layer-focus` (`hover:bg-…` / `focus:bg-…`) | "Destroy" control button fill states | `gray-50` | `neutral-700` |
| `surface` (`bg-surface`) | "Reinitialize" control button fill | `gray-100` | `neutral-700` |
| `surface-foreground` (`text-surface-foreground`) | "Reinitialize" control button label | `gray-800` | `neutral-200` |
| `surface-line` (`border-surface-line`) | "Reinitialize" control button border | `transparent` | `transparent` |
| `surface-hover` / `surface-focus` | "Reinitialize" button fill states | `gray-200` | `neutral-600` |

## Behaviour (JS)

Class `HSAccordion` (`assets/js/preline/accordion.js`, v4.2.0), exposed as `window.HSAccordion`.

**Init.** On `window` `load` the module runs `HSAccordion.autoInit()`, which instantiates every `.hs-accordion:not(.--prevent-on-load-init)`; it also calls `HSAccordion.treeView()` if any `.hs-accordion-treeview-root` exists. `autoInit()` is idempotent — it first drops collection entries whose element left the DOM, then skips elements already collected. Instances live in `window.$hsAccordionCollection` as `{id, element}` (`id` = the element's `id`, else a counter).

**Attributes / CSS-property options.**

| Attribute | On | Effect |
|---|---|---|
| `data-hs-accordion-always-open` | `.hs-accordion-group` | Sets `isAlwaysOpened`; `show()` stops closing the open sibling. |
| `--keep-one-open` (CSS custom property, read from computed style, `"true"`) | `.hs-accordion-group` | Clicking the currently-open item returns `false` — the group can never be fully collapsed. |
| `--stop-propagation` (CSS custom property, `"true"`) | `.hs-accordion-toggle` | Calls `e.stopPropagation()` in the click handler. |
| `data-hs-accordion-options` (JSON) | `.hs-accordion-treeview-root` | Tree-view mode only. |

**Open/close mechanism.** `show()` adds `active`, sets `content.style.display='block'` and `height:0`, then on the next tick writes `height: <scrollHeight>px`; after the transition it clears the inline height. `hide()` reverses it and ends at `display:none`. So the content element **must** keep `overflow-hidden` and a height transition, or it snaps.

**Static API:** `autoInit()`, `getInstance(target, isInstance=false)` (pass `true` to get `{id, element}` — the docs example then calls `element.destroy()`), `show(target)`, `hide(target)`, `findInCollection(target)`, `on(evt, target, cb)`, `treeView()`, `toggleSelected(collectionItem, el)`.
**Instance methods:** `show()`, `hide()`, `update()` (re-resolves the group + `isAlwaysOpened`), `destroy()`.
**Events** — both a callback (`on('open', …)`) and a bubbling DOM `CustomEvent` on the item: `beforeOpen.hs.accordion`, `open.hs.accordion`, `beforeClose.hs.accordion`, `close.hs.accordion`.

## Gotchas

- **`autoInit()` only runs on `window` `load`.** Anything rendered later (React route change, `api.get()` result, modal body) is dead markup until you call `HSAccordion.autoInit()` yourself. It is safe to call repeatedly.
- **Two sources of truth for the initial state, and both must agree.** Open = `active` on `.hs-accordion` **and** the content div *without* `hidden`. Closed = neither. Setting `active` while leaving `hidden` on the content renders collapsed but reports open, so the first click calls `hide()` and appears to do nothing — the user needs two clicks.
- **`aria-expanded` is only maintained if it already exists.** The JS does `if (toggle.ariaExpanded) toggle.ariaExpanded = 'true'` — an absent attribute stays absent forever. Ship `aria-expanded="false"` on every closed toggle (the string `"false"` is truthy, so it updates fine).
- **Sibling auto-close uses `:scope > .hs-accordion.active`** — direct children only. Wrapping each item in a layout `<div>` inside the group silently turns the whole group into "always open" without the attribute.
- **`getInstance(el)` without the second argument returns the DOM element, not the instance.** `getInstance(el, true).element.destroy()` is the working form; `getInstance(el).destroy()` throws.
- **`active` is a bare class name.** Any app CSS or router that also toggles `.active` on these nodes will drive the accordion; there is no `hs-` prefix protecting it.
- **Open state is *weaker* in dark under moon.** Resting label is `foreground` (`gray-800` / `neutral-200`), open label is `primary-active` (`gray-900` / `neutral-300`). In light, open gets darker = more contrast on white; in dark, `neutral-300` is dimmer than `neutral-200`, so the open item de-emphasises. Hover (`muted-foreground-1`) also *lowers* contrast in both modes — do not add a "brighter on hover" assumption.
- **`border-surface-line` is `transparent` in both moon modes** (`reference/moon-token-table.md`). The reinit button in `destroy-and-reinitialize.html` reserves the 1px but paints nothing; if you need a visible edge use `border-layer-line`.
- `active-content-bordered.html` relies on `border border-transparent` being present while closed — drop it and the item shifts 2px when it opens.

## Copy-paste base

`examples/base-components/accordion/no-arrow.html` (smallest correct instance; first item pre-opened)

```html
<!-- Accordion Group -->
<div class="hs-accordion-group" >
  <div class=" hs-accordion active" id="hs-basic-heading-one">
    <button class="hs-accordion-toggle hs-accordion-active:text-primary-active py-3 inline-flex items-center gap-x-3 w-full font-semibold text-start text-foreground hover:text-muted-foreground-1 focus:outline-hidden focus:text-muted-foreground-1 rounded-lg disabled:opacity-50 disabled:pointer-events-none" aria-expanded="true" aria-controls="hs-basic-collapse-one">
      Accordion #1
    </button>
    <div id="hs-basic-collapse-one" class="hs-accordion-content w-full overflow-hidden transition-[height] duration-300" role="region" aria-labelledby="hs-basic-heading-one">
      <p class="text-foreground">
        <em>This is the first item's accordion body.</em> It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions.
      </p>
    </div>
  </div>

  <div class=" hs-accordion" id="hs-basic-heading-two">
    <button class="hs-accordion-toggle hs-accordion-active:text-primary-active py-3 inline-flex items-center gap-x-3 w-full font-semibold text-start text-foreground hover:text-muted-foreground-1 focus:outline-hidden focus:text-muted-foreground-1 rounded-lg disabled:opacity-50 disabled:pointer-events-none" aria-expanded="false" aria-controls="hs-basic-collapse-two">
      Accordion #2
    </button>
    <div id="hs-basic-collapse-two" class="hs-accordion-content hidden w-full overflow-hidden transition-[height] duration-300" role="region" aria-labelledby="hs-basic-heading-two">
      <p class="text-foreground">
        <em>This is the second item's accordion body.</em> It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions.
      </p>
    </div>
  </div>

  <div class=" hs-accordion" id="hs-basic-heading-three">
    <button class="hs-accordion-toggle hs-accordion-active:text-primary-active py-3 inline-flex items-center gap-x-3 w-full font-semibold text-start text-foreground hover:text-muted-foreground-1 focus:outline-hidden focus:text-muted-foreground-1 rounded-lg disabled:opacity-50 disabled:pointer-events-none" aria-expanded="false" aria-controls="hs-basic-collapse-three"> 
      Accordion #3
    </button>
    <div id="hs-basic-collapse-three" class="hs-accordion-content hidden w-full overflow-hidden transition-[height] duration-300" role="region" aria-labelledby="hs-basic-heading-three">
      <p class="text-foreground">
        <em>This is the third item's accordion body.</em> It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions.
      </p>
    </div>
  </div>
</div>
<!-- End Accordion Group -->
```
