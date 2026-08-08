---
component: collapse
label: Collapse
category: base-components
docs: https://preline.co/docs/components/collapse.html
examples: 3
js: HSCollapse
tokens: [primary, primary-hover, primary-focus, primary-line, primary-foreground, muted-foreground-1, layer, layer-line, layer-foreground, surface]
---

# Collapse

A toggle button bound by selector to an arbitrary content block, which `HSCollapse` shows and hides by animating an inline `height` between `0` and `scrollHeight`.

## When to use
- One button revealing one block: "read more", "show older", advanced settings, a filter drawer inline in the page.
- The toggle and the content are **not** required to be siblings — the binding is a CSS selector, so the content can live anywhere in the document.
- **Not** for a set of mutually-exclusive panels with headers — use `accordion` (`HSAccordion`), which manages the group.
- **Not** for anything that overlays the page — use `overlay` or `dropdown`.
- The same primitive powers the collapsable `timeline`; see `components/timeline.md`.

## Anatomy

```html
<!-- REDUCED SKELETON — every class/attribute below appears verbatim in the example files -->
<button type="button"
        class="hs-collapse-toggle …"          <!-- autoInit selector; the `open` class lands here too -->
        id="hs-collapse"                       <!-- content's aria-labelledby target; keys the collection -->
        aria-expanded="false"                  <!-- load-bearing, see Behaviour -->
        aria-controls="hs-collapse-heading"    <!-- bare id, NO hash -->
        data-hs-collapse="#hs-collapse-heading"><!-- selector string, WITH hash -->
  Collapse
  <svg class="hs-collapse-open:rotate-180 shrink-0 size-4">…</svg>
</button>

<div id="hs-collapse-heading"
     class="hs-collapse hidden w-full overflow-hidden transition-[height] duration-300"
     aria-labelledby="hs-collapse"
     role="region">
  <div class="mt-5">…</div>
</div>
```

`hidden` + `overflow-hidden` + `transition-[height]` on the content are all required for the animation; the JS writes `style.height` directly.

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| `example` | Default collapse | `examples/base-components/collapse/example.html` | Solid button toggle: `bg-primary border-primary-line text-primary-foreground hover:bg-primary-hover focus:bg-primary-focus`, chevron with `hs-collapse-open:rotate-180`. |
| `show-hide` | Read more toggle | `examples/base-components/collapse/show-hide.html` | Link-style toggle (`text-primary hover:text-primary-hover focus:text-primary-focus`), reversible label via two spans: `span.hs-collapse-open:hidden` ("Read more") + `span.hs-collapse-open:block.hidden` ("Read less"). Toggle sits *after* the content. |
| `destroy-and-reinitialize` | Destroy and reinitialize | `examples/base-components/collapse/destroy-and-reinitialize.html` + `.js` | Same markup as `example` plus two control buttons (`bg-layer`, `bg-surface`) wired in the sidecar JS to `HSCollapse.getInstance(el, true).element.destroy()` and `HSCollapse.autoInit()`. |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `primary` | Solid toggle resting fill; link-toggle text | `gray-800` | `white` |
| `primary-hover` | Solid toggle hover fill; link-toggle hover text | `gray-900` | `neutral-300` |
| `primary-focus` | Solid toggle focus fill; link-toggle focus text | `gray-900` | `neutral-300` |
| `primary-line` | Solid toggle border | `transparent` | `transparent` |
| `primary-foreground` | Solid toggle label + chevron | `white` | `neutral-800` |
| `muted-foreground-1` | Collapse body copy | `gray-600` | `neutral-400` |
| `layer` / `layer-line` / `layer-foreground` | "Destroy collapse" control button (fill / border / label) | `white` / `gray-200` / `gray-800` | `neutral-800` / `neutral-700` / `white` |
| `layer-hover` / `layer-focus` | Same button, hover + focus fill | `gray-50` | `neutral-700` |
| `surface` / `surface-line` / `surface-foreground` | "Reinitialize collapse" control button (fill / border / label) | `gray-100` / `transparent` / `gray-800` | `neutral-700` / `transparent` / `neutral-200` |
| `surface-hover` / `surface-focus` | Same button, hover + focus fill | `gray-200` | `neutral-600` |

## Behaviour (JS)

Class `HSCollapse` — source of truth `assets/js/preline/collapse.js` (v4.2.0); non-auto build at `assets/js/preline/collapse-non-auto.js`.

**Attributes**

| Attribute / class | Effect |
|---|---|
| `data-hs-collapse="<selector>"` | Read in the constructor as `this.contentId`, resolved with `document.querySelector`. If it resolves to nothing, `init()` is never called — no listener, no error, silently inert. |
| `.hs-collapse-toggle` | The `autoInit()` query selector. Without it the element is never picked up. |
| `.--prevent-on-load-init` | Excluded from `autoInit()` (`:not(.--prevent-on-load-init)`). |
| `aria-expanded` | Synced to `"true"`/`"false"` on init and on every show/hide — **only if the attribute already exists** (`this.el.ariaExpanded` must be truthy). Ship `aria-expanded="false"`. |
| `.hs-collapse` / `role="region"` / `aria-labelledby` | Markup convention on the content; the JS itself keys off `open` and `hidden`, not `.hs-collapse`. |

**Init** — module `collapse.js` registers `window.addEventListener('load', () => HSCollapse.autoInit())`. `autoInit()` creates `window.$hsCollapseCollection` if absent, prunes entries whose element left the document, then constructs an instance for each matching toggle **not already in the collection** — so it is safe to call repeatedly. Manual: `new HSCollapse(el, options, events)`.

**State machine** — `show()` adds `open` to the toggle *and* the content, removes `hidden`, sets `height:0`, then on the next tick sets `height:scrollHeight` and clears it after the transition. `hide()` reverses and re-adds `hidden`. Both early-`return false` when `animationInProcess` is true or the state already matches. `hide()` also strips `.block` from any `.hs-mega-menu-content` inside the content.

**Static API** — `HSCollapse.autoInit()`, `.getInstance(target, isInstance = false)` (`true` → `{ id, element }`, `false` → the toggle element), `.findInCollection(target)`, `.show(target)`, `.hide(target)`, `.on(evt, target, callback)`. `target` may be an element or a selector string.

**Instance API** — `show()`, `hide()`, `destroy()`, `on(evt, callback)`.

**Events** — instance callbacks `beforeOpen`, `open`, `hide`. Each also dispatches a bubbling `CustomEvent` on the toggle element: `beforeOpen.hs.collapse`, `open.hs.collapse`, `hide.hs.collapse`, with `detail.payload` set to the toggle.

## Gotchas
- **No bundle here assigns `window.HSCollapse`.** `grep -l 'window\.HSCollapse=' assets/js/preline/*.js` returns nothing. `assets/js/preline/collapse.js` assigns the class to **`window.HSAccordion`** (a build-side copy/paste in the standalone bundle), and `preline.js` only exposes it as a module export (`Object.defineProperty(t,"HSCollapse",…)`) while its own textarea-auto-height code calls `window.HSCollapse.getInstance(...)`. The doc snippet `destroy-and-reinitialize.js` uses the bare global `HSCollapse` — that only works if you assign the global yourself after importing (`import { HSCollapse } from 'preline'; window.HSCollapse = HSCollapse;`).
- **Auto-init fires once, on `window` `load`.** Anything rendered later — a React/Inertia page swap, an HTMX fragment, a modal body — is never bound. Call `HSCollapse.autoInit()` (or `HSStaticMethods.autoInit()`) after mount. It is idempotent: existing instances are skipped, detached ones pruned.
- **`hs-collapse-open:*` is not part of the theme.** It comes from `@import './src/plugins/collapse/variants.css'` in `assets/css/variants.css`; grepping `collapse` in `assets/css/themes/moon.css` and `assets/css/project-moon.css` returns zero hits. Import the theme alone and every `hs-collapse-open:rotate-180` / `:hidden` / `:block` utility is dead CSS while the JS still works — a collapse that opens but whose chevron never turns.
- **`destroy()` only unbinds.** It removes the click listener, nulls `this.content` and drops the collection entry. The `open` class on the toggle and content, the `hidden` class and any inline `height` are left exactly as they were — destroying while open leaves it open.
- **`border-primary-line` draws nothing under moon** (`transparent` in both modes). It exists to keep the solid toggle the same box size as the outline/ghost button variants. Deleting `border border-primary-line` shrinks the button by 2px and misaligns it next to its siblings.
- **The hash placement is asymmetric**: `data-hs-collapse="#hs-collapse-heading"` (selector, with `#`) vs `aria-controls="hs-collapse-heading"` (id, no `#`). Copying one into the other breaks either the binding or the a11y relationship.
- **Give every toggle a unique `id`.** The collection entry is keyed `(el.id) || collection.length + 1`, so duplicate ids make `getInstance` / `findInCollection` ambiguous.
- Dropping `transition-[height] duration-300` does not break the component — `afterTransition` detects `transition-property: none` or a zero duration and invokes the callback synchronously. It just snaps instead of animating.
- `show-hide.html` places the toggle **after** the content in DOM order. That is fine (the binding is a selector) but it means tab order reaches the revealed text before the control that reveals it.

## Copy-paste base

`examples/base-components/collapse/example.html`, verbatim and complete.

```html
<!-- Collapse -->
<button type="button" class="hs-collapse-toggle py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg bg-primary border border-primary-line text-primary-foreground hover:bg-primary-hover focus:outline-hidden focus:bg-primary-focus disabled:opacity-50 disabled:pointer-events-none" id="hs-collapse" aria-expanded="false" aria-controls="hs-collapse-heading" data-hs-collapse="#hs-collapse-heading">
  Collapse
  <svg class="hs-collapse-open:rotate-180 shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
</button>
<div id="hs-collapse-heading" class="hs-collapse hidden w-full overflow-hidden transition-[height] duration-300" aria-labelledby="hs-collapse" role="region">
  <div class="mt-5">
    <p class="text-muted-foreground-1">
      This is a collapse body. It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions.
    </p>
  </div>
</div>
<!-- End Collapse -->
```
