---
component: confetti
label: Confetti Animation
category: third-party-plugins
docs: https://preline.co/docs/components/confetti.html
examples: 2
js: none (canvas-confetti -- Preline ships only the trigger button markup)
tokens: [primary, primary-line, primary-foreground, primary-hover, primary-focus]
---

# Confetti Animation

A celebratory particle burst drawn on a full-screen `<canvas>` by the third-party **canvas-confetti** library; Preline contributes only the trigger button's markup.

## When to use
- One-shot success moments the user *caused*: plan upgraded, onboarding finished, goal hit.
- **Do not use** as a status message — it says nothing and disappears. Pair it with, or replace it by, `toast-notifications` (Toastify) or an `alerts` block that states what happened.
- **Do not use** on a recurring or background event (every save, every poll). It paints over the whole viewport.
- Nothing here is themed except the button. If you only need the button, this component is `buttons` — there is no confetti-specific markup at all.

## Anatomy

Reduced skeleton (every class is verbatim from `examples/third-party-plugins/confetti/run-on-click.html`):

```html
<!-- The ONLY markup Preline supplies: a solid primary button. The canvas is created by the library. -->
<button id="hs-run-on-click-run-confetti" type="button"
        class="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg
               bg-primary border border-primary-line text-primary-foreground
               hover:bg-primary-hover focus:outline-hidden focus:bg-primary-focus
               disabled:opacity-50 disabled:pointer-events-none">Run Confetti</button>
```

```js
confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
```

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| Library tag | Installation | `examples/third-party-plugins/confetti/how-to-use-assets-library.html` | One `<script src="./assets/vendor/canvas-confetti/dist/confetti.browser.js">`. Exposes the global `confetti`. Not part of `preline.js`. |
| Trigger on click | Trigger on click | `examples/third-party-plugins/confetti/run-on-click.html` (+ `.js`) | The only functional example. Solid `bg-primary` button; a `load`-wrapped IIFE binds `click` and calls `confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })`. |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `primary` | Resting button fill (`bg-primary`) | `gray-800` | `white` |
| `primary-foreground` | Button label (`text-primary-foreground`) | `white` | `neutral-800` |
| `primary-line` | Button border — **transparent in both modes**; present so a solid and an outline button share one box model | `transparent` | `transparent` |
| `primary-hover` | Hover fill (`hover:bg-primary-hover`) | `gray-900` | `neutral-300` |
| `primary-focus` | Keyboard/`:focus` fill (`focus:bg-primary-focus`) | `gray-900` | `neutral-300` |

The particles are **not tokenised**. `confetti()` has its own `colors` option defaulting to the library's palette; no `--color-*` or `--chart-*` var feeds it.

## Behaviour (JS)
Static markup only — no Preline JS.

- Load `assets/vendor/canvas-confetti/dist/confetti.browser.js`; the global is `confetti`.
- `confetti(options)` is a plain function call and returns a `Promise` that resolves when the animation finishes. There is no instance, no `data-hs-*` attribute, no autoInit — `HSStaticMethods.autoInit()` never sees this component.
- Options used in the example: `particleCount: 100`, `spread: 70` (degrees), `origin: { y: 0.6 }` (0 = top of viewport, 1 = bottom; `0.6` fires from just below centre so the arc peaks on screen).
- The library injects and removes its own fixed, full-viewport `<canvas>`. You do not author one.

## Gotchas
- **Bind inside `window.addEventListener('load', …)`.** `run-on-click.js` does; the button is queried by id and a bare script above the markup gets `null` back from `querySelector`, so `runConfetti.addEventListener` throws `Cannot read properties of null`.
- **`origin.y` is inverted relative to CSS.** `y: 0` is the top edge. `origin: { y: 0.6 }` in the example means "lower-middle"; using `0` fires off the top and looks like nothing happened.
- **You do not control the canvas's stacking, and canvas-confetti is not in this repo.** The library creates its own fixed, full-viewport canvas with a `z-index` set in its own source (`assets/vendor/canvas-confetti/…`, not mined here) — there is no Preline token or class on it, so nothing in `reference/moon-token-table.md` or `assets/css/` will tell you where it lands. What *is* measurable locally is Preline's own layer numbers: overlay/modal examples use `z-80` (`examples/overlays/modal/*.html`), and the toast container in `toast-notifications` uses `z-90` (`examples/third-party-plugins/toast-notifications/basic.js:54`). Read the vendor file before assuming which wins; if the ordering matters, stop guessing and own the canvas with `confetti.create(canvasEl, { resize: true })`, where you set the `z-index` yourself.
- **Dark mode inverts the button hard under moon.** `bg-primary` goes `gray-800` → `white` and `text-primary-foreground` goes `white` → `neutral-800`. Do not add a literal `text-white`; it disappears in dark.
- `border border-primary-line` looks redundant — it is transparent in both modes — but removing it shrinks the button by 2px and breaks alignment against sibling outline buttons in the same row.
- **No reduced-motion guard.** Neither example checks `prefers-reduced-motion`. Full-screen particle motion is exactly what that media query exists for; gate the call yourself.
- `focus:outline-hidden` removes the default ring, and the only remaining focus signal is `focus:bg-primary-focus` — which under moon is the *same value* as `primary-hover` (`gray-900` / `neutral-300`). Keyboard users get no distinct focus state. Add a `focus:ring-*` if a11y is in scope.

## Copy-paste base

`examples/third-party-plugins/confetti/run-on-click.html`:

```html
<button id="hs-run-on-click-run-confetti" class="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg bg-primary border border-primary-line text-primary-foreground hover:bg-primary-hover focus:outline-hidden focus:bg-primary-focus disabled:opacity-50 disabled:pointer-events-none" type="button">Run Confetti</button>
```

`examples/third-party-plugins/confetti/run-on-click.js`:

```html
<script>
  window.addEventListener('load', () => {
    (function () {
      const runConfetti = document.querySelector('#hs-run-on-click-run-confetti');
      runConfetti.addEventListener('click', () => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: {
            y: 0.6
          }
        });
      });
    })();
  });
</script>
```
