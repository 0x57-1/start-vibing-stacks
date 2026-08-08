---
component: toasts
label: Toasts
category: base-components
docs: https://preline.co/docs/components/toasts.html
examples: 12
js: HSRemoveElement (dismiss only; the dynamic demo uses third-party Toastify-js)
tokens: [layer, layer-line, layer-foreground, muted-foreground-2, muted-foreground-1, muted-foreground, primary, primary-foreground, primary-line, primary-hover, primary-focus, secondary, secondary-foreground, surface-4, foreground-inverse, surface, surface-foreground, surface-1, muted, line-2, foreground, primary-100, primary-200, primary-800, primary-500, primary-900, primary-400]
---

# Toasts

A self-contained `role="alert"` card — surface, icon, message, optional actions — positioned by you and dismissed either by `HSRemoveElement` or by whatever library injects it.

## When to use

- Transient feedback about something that already happened: "Your email has been sent", "Uploading 3 files", a permission prompt with two actions.
- Persistent, in-flow messaging that belongs to the page — use Alert instead; a toast floats and is expected to disappear.
- A status word attached to a row or heading — use Badge (`components/badge.md`).
- Dynamically pushed toasts from JS: Preline ships **no** toast manager. `js-behavior` wires the third-party Toastify-js. In this repo the SPA standard is Sonner; treat these files as the visual spec, not the delivery mechanism.

## Anatomy

Reduced skeleton (root/close button verbatim from `examples/base-components/toasts/dismiss-button.html`; the `flex gap-x-3 p-4` shell, `h3` and body `div` from `with-icons.html`; the `shrink-0 size-4 text-primary mt-0.5` icon from `example.html` — `with-icons.html`'s own icon is the neutral `shrink-0 size-5 text-muted-foreground-2 mt-1`):

```html
<!-- root: a11y contract + surface + the hs-removing exit animation -->
<div id="hs-toast-x"
     class="hs-removing:translate-x-5 hs-removing:opacity-0 transition duration-300
            max-w-xs w-full bg-layer border border-layer-line rounded-xl shadow-lg"
     role="alert" tabindex="-1" aria-labelledby="hs-toast-x-label">
  <div class="flex gap-x-3 p-4">
    <svg class="shrink-0 size-4 text-primary mt-0.5">…</svg>   <!-- optional; colour = severity -->
    <div class="grow">
      <h3 id="hs-toast-x-label" class="text-layer-foreground font-semibold">Title</h3>
      <div class="mt-1 text-sm text-muted-foreground-2">Body copy.</div>
    </div>
    <!-- close button: the data attribute points at the TOAST id, not at itself -->
    <button type="button" aria-label="Close" data-hs-remove-element="#hs-toast-x">…</button>
  </div>
</div>
```

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| `example` | Default toast | `examples/base-components/toasts/example.html` | Four severities; only the icon colour changes (`text-primary` / `text-teal-500` / `text-red-500` / `text-yellow-500`). Surface is always `layer`. |
| `condensed` | Condensed toast | `examples/base-components/toasts/condensed.html` | Single-line `flex p-4` with an `ms-auto flex items-center space-x-3` action group: a `text-primary … hover:underline` "Undo" `<button>` and a `text-muted-foreground` close `<button>` (neither wired to JS). |
| `solid-color-variants` | Solid variants | `examples/base-components/toasts/solid-color-variants.html` | Saturated surfaces, **no border**: `bg-secondary`, `bg-surface-4`, `bg-teal-500`, `bg-primary`, `bg-red-500`, `bg-yellow-500`; `rounded-xl shadow-lg`. |
| `soft-color-variants` | Soft variants | `examples/base-components/toasts/soft-color-variants.html` | Tinted surfaces with `border border-line-2` (or a palette border) and `rounded-lg` — a different radius from every other variant. |
| `message-with-loading-indicator` | Toast with loading indicator | `examples/base-components/toasts/message-with-loading-indicator.html` | Replaces the icon with `animate-spin … border-3 border-current border-t-transparent text-primary` + `role="status"`. |
| `with-icons` | App notifications | `examples/base-components/toasts/with-icons.html` | Title + body + two `text-primary` text actions, **both** carrying `data-hs-remove-element` so either dismisses. |
| `stack` | App notifications | `examples/base-components/toasts/stack.html` | Several independent toasts, each with its own id and its own `data-hs-remove-element` target. No stacking logic — just siblings. |
| `avatar` | James mentioned you… | `examples/base-components/toasts/avatar.html` | `relative` root; `size-8 rounded-full` `<img>`; close button absolutely placed at `top-3 inset-e-3`; body gets `pe-4` to clear it. |
| `progress` | Uploading 3 files | `examples/base-components/toasts/progress.html` | Embeds the Progress component (`bg-surface-1` track, `bg-primary` fill, inline `style="width: 57%"`) plus a `muted-foreground-1` status line. |
| `placement` | Placement | `examples/base-components/toasts/placement.html` | Seven wrapper `<div class="absolute …">` positions around the toast card; the card markup is unchanged. |
| `dismiss-button` | Dismissible toast | `examples/base-components/toasts/dismiss-button.html` | Minimal dismissible toast: the `hs-removing:` pair + one close button. Smallest complete JS-wired example. |
| `js-behavior` | James mentioned you… | `examples/base-components/toasts/js-behavior.html` (+ `.js`) | A `primary` trigger button; the `.js` loads Toastify-js and injects toast markup with `escapeMarkup:false`, `duration:3000`, `[&>.toast-close]:hidden` and a `hs-toastify-on:opacity-100` reveal. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` | Default toast surface | `white` | `neutral-800` |
| `layer-line` | Default toast border | `gray-200` | `neutral-700` |
| `layer-foreground` | Title text and close-icon colour | `gray-800` | `white` |
| `muted-foreground-2` | Body copy under the title; neutral leading icon | `gray-700` | `neutral-300` |
| `muted-foreground-1` | Progress status line ("57% · 5 seconds left"); close icon on the soft `muted` toast | `gray-600` | `neutral-400` |
| `muted-foreground` | Close button in the condensed toast | `gray-500` | `neutral-500` |
| `primary` | Text action links, spinner, info icon, progress fill | `gray-800` | `white` |
| `primary-foreground` | Text on the solid `primary` toast; progress fill label | `white` | `neutral-800` |
| `primary-line` / `primary-hover` / `primary-focus` | Border / hover / focus of the `js-behavior` trigger button | `transparent` / `gray-900` / `gray-900` | `transparent` / `neutral-300` / `neutral-300` |
| `secondary` | Solid "dark" toast surface | `gray-900` | `white` |
| `secondary-foreground` | Text and close icon on the solid "dark" toast | `white` | `neutral-800` |
| `surface-4` | Solid "gray" toast surface | `gray-500` | `neutral-500` |
| `foreground-inverse` | Text on the saturated solid toasts | `white` | `white` |
| `surface` | Soft neutral toast surface; progress icon chip | `gray-100` | `neutral-700` |
| `surface-foreground` | Text on the soft neutral surface / icon chip | `gray-800` | `neutral-200` |
| `surface-1` | Progress track inside the progress toast | `gray-200` | `neutral-600` |
| `muted` | Softest toast surface | `gray-50` | `neutral-800` |
| `line-2` | Border of the neutral soft toasts | `gray-200` | `neutral-700` |
| `foreground` | Close icon on the soft `surface` toast only (the `muted` one uses `muted-foreground-1`) | `gray-800` | `neutral-200` |
| `primary-100` / `primary-200` / `primary-800` | Soft brand toast fill / border / text (light only) | `gray-100` / `gray-200` / `gray-800` | `neutral-100` / `neutral-200` / `neutral-800` |
| `primary-500` / `primary-900` / `primary-400` | Soft brand toast fill (`/20`) / border / text in dark mode | `gray-500` / `gray-900` / `gray-400` | `neutral-500` / `neutral-900` / `neutral-400` |

## Behaviour (JS)

Dismissal only, via `HSRemoveElement` — source `assets/js/preline/remove-element.js` (Preline 4.2.0). There is no `HSToast`.

| Attribute | On | Effect |
|---|---|---|
| `data-hs-remove-element="<css selector>"` | any trigger inside (or outside) the toast | Selector of the element to remove — the toast root. |
| `data-hs-remove-element-options='{"removeTargetAnimationClass":"…"}'` | the trigger | Overrides the pre-removal class. Default `"hs-removing"`. |

Mechanism: click → add `hs-removing` to the target → `afterTransition(target, cb)` → `setTimeout(() => target.remove())`. `afterTransition` fires the callback **immediately** when the computed `transition-property` is `none` or the duration is `0`.

Init: `window.addEventListener('load', () => HSRemoveElement.autoInit())`; `autoInit()` scans `[data-hs-remove-element]:not(.--prevent-on-load-init)`. Global `window.HSRemoveElement`, collection `window.$hsRemoveElementCollection`. API: `new HSRemoveElement(el, opts)` · `.remove()` · `.destroy()` · `HSRemoveElement.getInstance(elOrSelector, isInstance?)`.

`js-behavior.js` is **not** Preline: its first line is `<script src="../../assets/vendor/toastify-js/src/toastify.js"></script>` (a path on the Preline doc site — that vendor file is **not** mirrored into this skill's `assets/`), then it calls `Toastify({...}).showToast()`. The `hs-toastify-on:` variant it uses is a Preline custom variant declared in `assets/css/variants.css` as `@custom-variant hs-toastify-on { &.toastify.on { … } }` — it styles Toastify's own state class, nothing more.

## Gotchas

- **`hs-removing:translate-x-5 hs-removing:opacity-0 transition duration-300` on the root is what makes dismissal animate**, and it is missing from `example.html`, `condensed.html`, `solid-color-variants.html` and `soft-color-variants.html`. Without a transition, `afterTransition` calls back synchronously and the toast pops out of existence. The variant itself is registered by `@import './src/plugins/remove-element/variants.css'` in `assets/css/variants.css`.
- **`condensed.html`'s close button is decorative.** It has `aria-label="Close"` and no `data-hs-remove-element` — clicking it does nothing. Same for the close buttons in both colour-variant files. Only `dismiss-button`, `with-icons`, `stack`, `avatar` and `progress` are actually wired.
- **The dismiss target is an id, and the doc ids repeat.** `#dismiss-toast`, `#hs-toast-avatar`, `#hs-toast-with-icons` are hard-coded, and `document.querySelector` takes the first match — render the same snippet twice and every close button kills the first toast. `stack.html` is the correct pattern: a distinct id per toast.
- **`aria-labelledby` points at an id that must also be unique.** `hs-toast-avatar-label` appears in both `avatar.html` and the `js-behavior.js` template; with both on the page, screen readers resolve the wrong label. Mint ids per instance.
- **Placement is your CSS, not a feature.** `placement.html` is seven `absolute` wrapper divs; the offset parent must be `relative` (or the toast anchors to the viewport/nearest positioned ancestor, usually not what you meant). There is no toast container, no stacking order, no max-visible cap — build those yourself.
- **Solid and soft families disagree on radius and border.** Solid: `rounded-xl shadow-lg`, no border. Soft: `rounded-lg`, `border border-line-2`. Default/`layer`: `rounded-xl` + border + shadow. Mixing a soft palette into the default shell gives a mismatched corner radius against the rest of the toast stack.
- **Soft colours need their `dark:` pairs** — the numeric `primary-*` ramp does not invert under moon (`primary-100` is `gray-100` light **and** `neutral-100` dark). Also note `soft-color-variants.html` repeats `dark:text-red-400 dark:text-red-400` on the red toast; harmless duplication, not a signal.
- **`autoInit()` runs once on `window` `load`.** Any toast you render after that — the whole point of a toast — needs `HSStaticMethods.autoInit()` or `new HSRemoveElement(closeBtn)` after insertion, otherwise the X is inert.
- **`HSRemoveElement.getInstance(el)` returns the DOM element, not the instance** (`return n ? (t ? n : n.element.el) : null`). Pass `true` and read `.element` to get the object with `.remove()`.
- **Toastify's `escapeMarkup:false`** in `js-behavior.js` renders the string as HTML. Never interpolate user or API text into that template — it is an injection sink. Prefer building a DOM node, or the project's Sonner setup.

## Copy-paste base

`examples/base-components/toasts/dismiss-button.html`

```html
<!-- Toast -->
<div id="dismiss-toast" class="hs-removing:translate-x-5 hs-removing:opacity-0 transition duration-300 max-w-xs w-full bg-layer border border-layer-line rounded-xl shadow-lg" role="alert" tabindex="-1" aria-labelledby="hs-toast-dismiss-button-label">
  <div class="flex p-4">
    <p id="hs-toast-dismiss-button-label" class="text-sm text-layer-foreground">
      Your email has been sent
    </p>

    <div class="ms-auto">
      <button type="button" class="inline-flex shrink-0 justify-center items-center size-5 rounded-lg text-layer-foreground opacity-50 hover:opacity-100 focus:outline-hidden focus:opacity-100" aria-label="Close" data-hs-remove-element="#dismiss-toast">
        <span class="sr-only">Close</span>
        <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
  </div>
</div>
<!-- End Toast -->
```
