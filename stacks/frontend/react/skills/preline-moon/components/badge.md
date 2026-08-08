---
component: badge
label: Badge
category: base-components
docs: https://preline.co/docs/components/badge.html
examples: 14
js: HSRemoveElement (dismissible variants only)
tokens: [primary-100, primary-800, primary-400, primary-500, primary-200, primary-900, primary, primary-foreground, secondary, secondary-foreground, surface-4, plain, inverse, surface, surface-foreground, surface-1, surface-2, muted, muted-foreground-1, layer, layer-line, layer-foreground, layer-hover, layer-focus, line-8, line-5, line-inverse, foreground, foreground-inverse]
---

# Badge

A small inline `<span>` pill carrying a status, category or count, optionally with a dot, icon, avatar, or a dismiss button wired to `HSRemoveElement`.

## When to use

- Short status/category labels inside tables, lists and headings; counters attached to a button.
- A dismissible chip in a filter/tag row (the `data-hs-remove-element` variant).
- NOT for a message the user must read — that is Toasts (`components/toasts.md`) or Alert; a badge has no `role="alert"` and no live region.
- NOT for an interactive filter toggle — a badge is a `<span>`; use a real `<button>` (see `with-button.html` for the badge-inside-button composition).

## Anatomy

Reduced skeleton (every class below is verbatim from `examples/base-components/badge/badge-with-indicator.html`):

```html
<!-- base pill: layout + shape + typography, then ONE fill/text token pair -->
<span class="inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium
             bg-primary-100 text-primary-800 dark:bg-primary-500/20 dark:text-primary-400">
  <!-- optional leading dot / icon / avatar -->
  <span class="size-1.5 inline-block rounded-full bg-primary-800 dark:bg-primary-400"></span>
  Badge
</span>
```

Four fill families swap only the last class group: **solid** (`bg-X` + a hand-picked contrast token — `text-secondary-foreground` / `text-primary-foreground` / `text-inverse` / `text-foreground-inverse`, not a mechanical `X-foreground`), **soft** (`bg-X-100 text-X-800` + `dark:` pair), **outline** (`border border-line-N` or `border-<palette>-500`, no fill), **white** (`bg-layer border border-layer-line text-layer-foreground shadow-2xs`).

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| `solid-color-variants` | Solid color variants | `examples/base-components/badge/solid-color-variants.html` | Saturated fill + inverse text: `bg-secondary`, `bg-surface-4`, `bg-teal-500`, `bg-primary`, `bg-red-500`, `bg-yellow-500`, `bg-plain text-inverse`. |
| `soft-color-variants` | Soft color variants | `examples/base-components/badge/soft-color-variants.html` | Tinted fill + dark text; palette entries carry `dark:bg-*-500/20 dark:text-*-400`. Last chip is `bg-plain/10 text-foreground-inverse`. |
| `outline-color-variants` | Outline color variants | `examples/base-components/badge/outline-color-variants.html` | No fill. Semantic rows pair a border token with a *different* text token — `border-line-8`→`text-foreground`, `border-line-5`→`text-muted-foreground-1`, `border-line-inverse`→`text-foreground-inverse`; only `border-primary`→`text-primary` and the raw palette rows (`border-teal-500 text-teal-500`, red, yellow) reuse one token. |
| `white-color-variants` | White color variants | `examples/base-components/badge/white-color-variants.html` | `bg-layer border border-layer-line text-layer-foreground shadow-2xs`, shown at `rounded-md` and `rounded-full`. |
| `rounded-badges` | Rounded badges | `examples/base-components/badge/rounded-badges.html` | `rounded-lg` instead of `rounded-full`. Single line, otherwise identical to the soft base. |
| `max-width` | Truncated badge | `examples/base-components/badge/max-width.html` | Swaps `inline-flex items-center gap-x-1.5` for `max-w-40 truncate whitespace-nowrap inline-block`; also `rounded-lg`, like `rounded-badges`. |
| `badge-with-indicator` | Badge with status dot | `examples/base-components/badge/badge-with-indicator.html` | Prepends a `size-1.5 rounded-full` dot using the badge's own text token as its fill. |
| `working-with-icons` | Badges with icons | `examples/base-components/badge/working-with-icons.html` | `py-1 px-2 gap-x-1` with a `shrink-0 size-3` inline SVG; largest file, many colour rows. |
| `badge-with-remove-button` | Dismissible badge | `examples/base-components/badge/badge-with-remove-button.html` | `ps-3 pe-2` + trailing `<button data-hs-remove-element="#dismiss-badge">`; button hover/focus use `primary-200` / `dark:primary-900`. |
| `badge-with-avatar` | Badge with avatar | `examples/base-components/badge/badge-with-avatar.html` | `<div>` chip, `bg-layer border border-layer-line rounded-full p-1.5`, `size-6 rounded-full` `<img>`; remove button uses `bg-surface-1 text-surface-foreground hover:bg-surface-2`. |
| `with-button` | Badge inside button | `examples/base-components/badge/with-button.html` | Badge nested in a `layer` button as a `py-0.5 px-1.5` counter (`bg-red-500 text-foreground-inverse`). |
| `positioned` | Positioned badge | `examples/base-components/badge/positioned.html` | Host button becomes `relative`; badge is `absolute top-0 inset-e-0 -translate-y-1/2 translate-x-1/2`. |
| `profile` | Dot badge | `examples/base-components/badge/profile.html` | Same positioning with no text: `size-3.5 rounded-full border-2 border-layer bg-teal-500` + `sr-only` label. |
| `ping` | Ping | `examples/base-components/badge/ping.html` | Two stacked spans — `animate-ping absolute ... bg-red-400 opacity-75 dark:bg-red-600` behind a solid `bg-red-500`. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `primary-100` | Soft badge fill (light only; dark uses `primary-500/20`) | `gray-100` | `neutral-100` |
| `primary-800` | Soft badge text and status dot (light only) | `gray-800` | `neutral-800` |
| `primary-400` | Soft badge text + dot in dark mode | `gray-400` | `neutral-400` |
| `primary-500` | Soft badge fill in dark mode, used at `/20` | `gray-500` | `neutral-500` |
| `primary-200` | Dismiss button hover/focus fill (light) | `gray-200` | `neutral-200` |
| `primary-900` | Dismiss button hover/focus fill (dark) | `gray-900` | `neutral-900` |
| `primary` | Solid brand fill; outline border+text | `gray-800` | `white` |
| `primary-foreground` | Text on the solid brand fill | `white` | `neutral-800` |
| `secondary` | Solid "dark" fill | `gray-900` | `white` |
| `secondary-foreground` | Text on the solid "dark" fill | `white` | `neutral-800` |
| `surface-4` | Solid "gray" fill | `gray-500` | `neutral-500` |
| `plain` | Solid "white" fill; soft variant uses it at `/10` | `white` | `neutral-800` |
| `inverse` | Text on the solid `plain` fill | `gray-800` | `neutral-950` |
| `surface` | Soft neutral fill | `gray-100` | `neutral-700` |
| `surface-foreground` | Text on the soft neutral fill; avatar remove icon | `gray-800` | `neutral-200` |
| `surface-1` | Avatar-chip remove button resting fill | `gray-200` | `neutral-600` |
| `surface-2` | Avatar-chip remove button hover fill | `gray-300` | `neutral-500` |
| `muted` | Softest fill (least contrast) | `gray-50` | `neutral-800` |
| `muted-foreground-1` | Text on `muted`; muted outline text | `gray-600` | `neutral-400` |
| `layer` | White-badge / host-button surface; `border-layer` ring on the dot badge | `white` | `neutral-800` |
| `layer-line` | White-badge / host-button border | `gray-200` | `neutral-700` |
| `layer-foreground` | White-badge / host-button text | `gray-800` | `white` |
| `layer-hover` | Host button hover fill | `gray-50` | `neutral-700` |
| `layer-focus` | Host button focus fill | `gray-50` | `neutral-700` |
| `line-8` | Strongest outline border | `gray-800` | `neutral-100` |
| `line-5` | Muted outline border | `gray-500` | `neutral-400` |
| `line-inverse` | Outline border for use on dark/photo backdrops | `white` | `white` |
| `foreground` | Text of the strongest outline badge | `gray-800` | `neutral-200` |
| `foreground-inverse` | Text on saturated fills and on `line-inverse` outline | `white` | `white` |

## Behaviour (JS)

Only the dismissible variants (`badge-with-remove-button.html`, `badge-with-avatar.html`) use JS. Source: `assets/js/preline/remove-element.js` (Preline 4.2.0).

| Attribute | On | Effect |
|---|---|---|
| `data-hs-remove-element="<css selector>"` | the **trigger** (the X button) | Selector of the element to remove — the badge root, not the button. |
| `data-hs-remove-element-options='{"removeTargetAnimationClass":"..."}'` | the trigger | Overrides the class added before removal. Default `"hs-removing"`. |

Mechanism (`remove()`): adds `removeTargetAnimationClass` to the target → `afterTransition(target, cb)` → `setTimeout(() => target.remove())`. `afterTransition` reads the computed style and calls back **immediately** when `transition-property` is `none` or `transition-duration` is `0`.

Init: `window.addEventListener('load', () => HSRemoveElement.autoInit())`. `autoInit()` scans `[data-hs-remove-element]:not(.--prevent-on-load-init)` and skips elements already in `window.$hsRemoveElementCollection`. Global is `window.HSRemoveElement`.

API: `new HSRemoveElement(el, options)` · `HSRemoveElement.autoInit()` · `HSRemoveElement.getInstance(elOrSelector, isInstance?)` · instance `.remove()` · instance `.destroy()`.

## Gotchas

- **`HSRemoveElement.getInstance(el)` returns the DOM element, not the instance.** Source: `return n ? (t ? n : n.element.el) : null` — you must pass `true` to get the collection record `{id, element}` and then reach `.element`. (`HSCarousel.getInstance` has the *opposite* shape: bare call returns the instance. Do not generalise between the two.)
- **The doc example hard-codes `id="dismiss-badge"` and targets `#dismiss-badge`.** `document.querySelector` returns the first match, so rendering a list from that snippet gives every X button the power to remove only the *first* badge. Worse, `badge-with-remove-button.html` and `badge-with-avatar.html` use the **same** `dismiss-badge` id — put both on one page and the avatar chip's X deletes the pill badge. Mint a unique id per badge and interpolate it into both places.
- **The dismissible badge has no exit animation and the toast does.** `badge-with-remove-button.html` carries no `transition` and no `hs-removing:` utilities, so `afterTransition` fires synchronously and the badge vanishes. To animate, copy the triplet from `examples/base-components/toasts/dismiss-button.html`: `hs-removing:translate-x-5 hs-removing:opacity-0 transition duration-300` on the badge root. The `hs-removing:` variant is registered via `@import './src/plugins/remove-element/variants.css'` in `assets/css/variants.css`.
- **`autoInit()` runs once, on `window` `load`.** Badges rendered later (React, Axios response, dynamic filter row) are dead until you call `HSStaticMethods.autoInit()` or `new HSRemoveElement(button)` after mount.
- **The numeric `primary-*` ramp does not invert under moon.** `primary-100` is `gray-100` light **and** `neutral-100` dark; `primary-800` is `gray-800` / `neutral-800`. Every soft badge in these files therefore ships `dark:bg-primary-500/20 dark:text-primary-400` by hand. Drop the `dark:` pair and the badge is dark-on-dark. Only the semantic aliases (`primary`, `primary-foreground`, `layer*`, `surface*`) flip on their own.
- **`text-foreground-inverse` is `white` in both modes** — correct over `bg-red-500`, wrong over anything light. Note that the solid *white* badge deliberately uses `text-inverse` (`gray-800` / `neutral-950`) instead, and the soft last chip uses `bg-plain/10 text-foreground-inverse`, which is designed for a dark or photographic backdrop and is invisible on the default page background.
- **`truncate` needs `inline-block`.** `max-width.html` replaces the base `inline-flex items-center gap-x-1.5` with `truncate whitespace-nowrap inline-block`; keeping `inline-flex` makes `truncate` a no-op. You cannot have truncation and a leading dot/icon in the same span.
- **The dot badge's `border-2 border-layer` is a knockout ring, not decoration.** It fakes a gap between the dot and the host button by painting the button's own surface token. Change the host background and that border token must change with it.
- **Positioned/ping badges use `inset-e-0`**, a logical-inset utility that is not defined in any file under `assets/css/` and is not Tailwind v4 core (core spells it `end-*`). Verify it resolves in your build, otherwise only the `translate-x-1/2` applies and the badge lands at the button's left edge.

## Copy-paste base

`examples/base-components/badge/rounded-badges.html`

```html
<span class="inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-500/20 dark:text-primary-400">Badge</span>
```
