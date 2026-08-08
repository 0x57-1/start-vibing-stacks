---
component: toast-notifications
label: Toast Notifications
category: third-party-plugins
docs: https://preline.co/docs/components/toast-notifications.html
examples: 2
js: none (Toastify JS -- Preline ships only the hs-toastify-on variant)
tokens: [layer, layer-line, layer-foreground, muted-foreground-2, primary, primary-line, primary-foreground, primary-hover, primary-focus]
---

# Toast Notifications

Transient, JS-triggered notifications stacked and auto-dismissed by the third-party **Toastify JS** library; Preline supplies the themed container `className`, the toast body markup, and the `hs-toastify-on:` Tailwind variant that drives the enter/exit transition.

## When to use
- Confirming an async result the user triggered but is not waiting on: "Your email has been sent", "Saved".
- **Do not use** when the toast must persist or sit in document flow — that is `toasts` (`base-components/toasts`, 12 examples): the same visual language as static markup, no third-party library, dismissal handled by Preline's own `data-hs-remove-element`.
- **Do not use** for anything the user must act on or that must not be missed. It auto-dismisses in 3s and has no focus management; use `overlay`/modal or an inline `alerts` block.
- **Do not use** for validation errors on a form — the project rule is inline 422 binding under the field.

## Anatomy

Reduced skeleton. Note the split: **the trigger is the only HTML file**; the toast body lives in a JS template string.

`examples/third-party-plugins/toast-notifications/basic.html` — trigger:

```html
<!-- Solid primary button. Nothing toast-specific; this is the `buttons` recipe. -->
<button id="hs-new-toast" type="button" class="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg bg-primary border border-primary-line text-primary-foreground hover:bg-primary-hover disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-primary-focus">
  Call toast
</button>
```

The container Preline hands to Toastify via `className` (from `basic.js`) — this is where the theme lives:

```
hs-toastify-on:opacity-100 opacity-0   <- enter/exit: variant matches .toastify.on
fixed -top-20 sm:-top-37.5             <- parked off-screen; Toastify animates it in
inset-e-0 sm:inset-e-5 z-90            <- logical end-inset, above overlays
transition-all duration-300 w-80
bg-layer text-sm text-layer-foreground <- surface + text
border border-layer-line rounded-xl shadow-lg
[&>.toast-close]:hidden                <- hide Toastify's own X; a themed one is proxied
```

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| Library tag | Installation | `examples/third-party-plugins/toast-notifications/how-to-use-assets-library.html` | One `<script src="./assets/vendor/toastify-js/src/toastify.js">`. Exposes the global `Toastify`. Not bundled in `preline.js`. |
| Triggered notifications | James mentioned you in a comment | `examples/third-party-plugins/toast-notifications/basic.html` (+ `.js`) | The only functional example. One button; `basic.js` defines **two** bodies and alternates `i % 3 ? toastMarkup1 : toastMarkup2` — so `toastMarkup2` (the plain one) appears on every third click, starting with the first. |
| — `toastMarkup1` (rich) | *(inside `basic.js`)* | `examples/third-party-plugins/toast-notifications/basic.js` (lines 15-38) | Avatar + `<h3>` title + body + a `text-primary` "Mark as read" text button. Ships its **own** wrapper, verbatim `class="max-w-xs relative bg-layer border border-layer-line rounded-xl shadow-lg"` with `role="alert" tabindex="-1" aria-labelledby="hs-toast-avatar-label"`. Close button is absolutely positioned (`absolute top-3 inset-e-3`). |
| — `toastMarkup2` (plain) | *(inside `basic.js`)* | `examples/third-party-plugins/toast-notifications/basic.js` (lines 39-49) | Bare `<div class="flex gap-x-3 p-4">` content, no chrome wrapper — relies entirely on the container `className`. Close button sits in flow inside a `ms-auto` div. No `role="alert"`. |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` | Toast surface (`bg-layer`) — on the Toastify container **and** again on `toastMarkup1`'s wrapper | `white` | `neutral-800` |
| `layer-line` | Toast border (`border-layer-line`), same double application | `gray-200` | `neutral-700` |
| `layer-foreground` | Body/title text and the close-icon `currentColor` (`text-layer-foreground`) | `gray-800` | `white` |
| `muted-foreground-2` | Secondary line under the title in `toastMarkup1` ("Nice work! Keep it up!") | `gray-700` | `neutral-300` |
| `primary` | The inline "Mark as read" text button (`text-primary`) | `gray-800` | `white` |
| `primary-foreground` | Trigger button label (`text-primary-foreground`) | `white` | `neutral-800` |
| `primary-line` | Trigger button border — transparent in both modes, kept for box-model parity | `transparent` | `transparent` |
| `primary-hover` | Trigger button hover fill | `gray-900` | `neutral-300` |
| `primary-focus` | Trigger button `:focus` fill | `gray-900` | `neutral-300` |

Note `muted-foreground-2` (`gray-700`) is the *darkest* of the three muted steps in light mode and the *lightest* in dark — it is deliberately close to `layer-foreground`, i.e. de-emphasis without a real drop in contrast.

## Behaviour (JS)
Static markup only — no Preline JS component. Toastify is the runtime; Preline contributes one CSS variant.

- Load `assets/vendor/toastify-js/src/toastify.js`; the global is `Toastify`. No `data-hs-*`, no autoInit.
- Call shape used in `basic.js`:
  ```js
  Toastify({
    text: toastMarkup1,   // an HTML string
    className: "…",       // the themed container classes (see Anatomy)
    duration: 3000,       // ms before auto-dismiss
    close: true,          // renders Toastify's own .toast-close element
    escapeMarkup: false   // REQUIRED for `text` to be parsed as HTML
  }).showToast();
  ```
- **The `hs-toastify-on` variant** (`assets/css/variants.css:64`) is what animates the toast in:
  ```css
  @custom-variant hs-toastify-on {
    &.toastify.on { @slot; }
    .toastify.on & { @slot; }
  }
  ```
  Toastify adds `.on` to its `.toastify` root when the toast is shown. The container carries `opacity-0` at rest and `hs-toastify-on:opacity-100`, with `transition-all duration-300` doing the work. The second selector arm (`.toastify.on &`) lets *descendants* react to the same state.
- **Custom close proxy.** `close: true` renders Toastify's `.toast-close`, which `[&>.toast-close]:hidden` then hides. The visible X calls a page-level global:
  ```js
  function tostifyCustomClose(el) {
    const parent = el.closest('.toastify');
    const close = parent.querySelector('.toast-close');
    close.click();
  }
  ```
  It forwards the click to the hidden real button so Toastify runs its own teardown.

## Gotchas
- **The function name is misspelled in the shipped example: `tostifyCustomClose`** (no `a` after `t-o`). Both `onclick=` handlers reference that exact spelling. Rename in *three* places or not at all — a partial rename gives a silently dead close button.
- **`escapeMarkup: false` is an XSS hole if any part of `text` comes from user data.** The example interpolates only static strings. If you build the toast from an API payload, escape every field yourself; there is no built-in sanitiser.
- **`toastMarkup1` double-chromes the toast.** The Toastify container already has `bg-layer border border-layer-line rounded-xl shadow-lg`, and `toastMarkup1`'s outer `<div>` repeats all four — two borders, two shadows, `max-w-xs` (20rem) inside `w-80` (20rem) so the inner border is clipped tight. `toastMarkup2` correctly ships bare content. Prefer the `toastMarkup2` pattern and let the container own the chrome.
- **`aria-labelledby="hs-toast-avatar-label"` collides on stack.** `toastMarkup1` hardcodes `id="hs-toast-avatar-label"` on its `<h3>`, and the `i % 3` rotation makes clicks **2 and 3 both render `toastMarkup1`** — fire them inside the 3s `duration` and two live nodes share the id, so both toasts label themselves from the first one. (`data/index.json` shows the same collision in the docs page itself: `hs-toast-avatar-label` is listed twice in `sections`.) Suffix the id per toast.
- **`role="alert"` is on `toastMarkup1` only.** `toastMarkup2` has none, so screen readers never announce the plain variant. Add it.
- **`z-90` outranks Preline overlays.** The `.hs-overlay` root in `examples/overlays/modal/*.html` is `z-80`; this container is `z-90`, so toasts paint over an open modal. That is usually right — but check it is what you want before raising either.
- **Preline only owns the opacity half of the animation.** `opacity-0` + `hs-toastify-on:opacity-100` + `transition-all duration-300` is the whole of what these classes do on enter/exit. The vertical placement — `-top-20` (`-5rem`) and `sm:-top-37.5` (`-9.375rem`), i.e. parked above the viewport at rest — is a resting offset that Toastify repositions when it shows the toast, and Toastify's source is **not** mined into this skill (`assets/vendor/toastify-js/src/toastify.js`). Do not hand-tune `top` in `className` without reading that file; you are fighting an inline style you cannot see from here.
- **`inset-e-*` is logical (end), not `right`.** Under RTL the toast moves to the left edge automatically. Do not "fix" it to `right-5`.
- **Inline `onclick=` breaks under a strict CSP.** `tostifyCustomClose` is invoked from the markup string (`onclick="tostifyCustomClose(this)"` in both bodies); a `script-src` without `unsafe-inline` disables the close button with no console error from Toastify. Replace it with one delegated listener — `document.addEventListener('click', e => { const b = e.target.closest('[data-close-toast]'); if (b) b.closest('.toastify').querySelector('.toast-close').click(); })` — and swap the attribute for `data-close-toast`.
- **`basic.js` passes exactly five options — `text`, `className`, `duration`, `close`, `escapeMarkup` — everything else is Toastify's default**, and the vendor file (`assets/vendor/toastify-js/src/toastify.js`) is *not* mined into this skill, so the defaults are not knowable from here. Do not reason about gravity, position, `stopOnFocus`, `offset` or `oldestFirst` from this example; read the vendor source. The one number you can act on: `duration: 3000` is 3s for a toast whose rich variant carries an action button ("Mark as read") — raise it for anything actionable.
- **Dark mode inverts the trigger hard under moon**: `bg-primary` `gray-800` → `white`, `text-primary-foreground` `white` → `neutral-800`. Never hardcode `text-white` on it. Same for the `text-primary` "Mark as read" link — it is `white` in dark, on a `neutral-800` surface.

## Copy-paste base

`examples/third-party-plugins/toast-notifications/basic.html` (the entire HTML surface):

```html
<button id="hs-new-toast" type="button" class="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg bg-primary border border-primary-line text-primary-foreground hover:bg-primary-hover disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-primary-focus">
  Call toast
</button>
```

Init — reduced from `examples/third-party-plugins/toast-notifications/basic.js`, keeping the plain `toastMarkup2` body verbatim (read that file for the rich avatar variant):

```html
<script src="../../assets/vendor/toastify-js/src/toastify.js"></script>
<script>
  function tostifyCustomClose(el) {
    const parent = el.closest('.toastify');
    const close = parent.querySelector('.toast-close');

    close.click();
  }

  window.addEventListener('load', () => {
    (function() {
      const callToast = document.querySelector("#hs-new-toast");
      const toastMarkup2 = `
        <div class="flex gap-x-3 p-4">
          <p class="text-sm text-layer-foreground">Your email has been sent</p>
          <div class="ms-auto">
            <button onclick="tostifyCustomClose(this)" type="button" class="inline-flex shrink-0 justify-center items-center size-5 rounded-lg text-layer-foreground opacity-50 hover:opacity-100 focus:outline-hidden focus:opacity-100" aria-label="Close">
              <span class="sr-only">Close</span>
              <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
            </button>
          </div>
        </div>
      `;

      callToast.addEventListener("click", () => {
        Toastify({
          text: toastMarkup2,
          className: "hs-toastify-on:opacity-100 opacity-0 fixed -top-20 sm:-top-37.5 inset-e-0 sm:inset-e-5 z-90 transition-all duration-300 w-80 bg-layer text-sm text-layer-foreground border border-layer-line rounded-xl shadow-lg [&>.toast-close]:hidden",
          duration: 3000,
          close: true,
          escapeMarkup: false
        }).showToast();
      });
    })();
  });
</script>
```
