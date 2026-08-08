---
component: toggle-password
label: Toggle Password
category: advanced-forms
docs: https://preline.co/docs/components/toggle-password.html
examples: 5
js: HSTogglePassword
tokens: [primary-focus, foreground, layer, layer-line, muted-foreground-1, muted-foreground, primary, primary-checked, line-3, layer-foreground, layer-hover, layer-focus, surface, surface-line, surface-foreground, surface-hover, surface-focus, overlay, overlay-line, overlay-header, overlay-footer, primary-line, primary-foreground, primary-hover, scrollbar-track, scrollbar-thumb]
---

# Toggle Password

A show/hide control: `HSTogglePassword` flips one or more password inputs between `type="password"` and `type="text"`, driven by a button or a checkbox.

## When to use
- Any password field the user types blind into — login, signup, change-password.
- Use the **group** form when two fields (current + new) should reveal together.
- Use the **checkbox** form when the reveal should be an explicit, labelled preference rather than an icon affordance.
- Do NOT use it to show a strength score — that is `strong-password` (`HSStrongPassword`). The two attach to the same input without conflict.
- Do NOT hand-roll `input.type = 'text'` alongside it; the plugin owns `type` and forces `password` back on `destroy()`.

## Anatomy

Reduced skeleton (classes copied from `examples/advanced-forms/toggle-password/basic-usage.html`):

```html
<div class="relative">                                  <!-- REQUIRED: the button is absolutely positioned -->
  <input id="pw" type="password"
         class="py-2.5 sm:py-3 ps-4 pe-10 block w-full bg-layer border-layer-line rounded-lg sm:text-sm text-foreground placeholder:text-muted-foreground-1 focus:border-primary-focus focus:ring-primary-focus">
         <!-- pe-10 reserves room for the button; without it the icon overlaps the text -->

  <button type="button" data-hs-toggle-password='{ "target": "#pw" }'
          class="absolute inset-y-0 inset-e-0 flex items-center z-20 px-3 cursor-pointer text-muted-foreground rounded-e-md focus:outline-hidden focus:text-primary-focus">
    <svg class="shrink-0 size-3.5" ... >
      <!-- "hidden" state: visible while type=password -->
      <path class="hs-password-active:hidden" d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
      <!-- "shown" state: visible while type=text (.active present) -->
      <path class="hidden hs-password-active:block" d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    </svg>
  </button>
</div>
```

Group form wraps N of these in `<div class="space-y-5" data-hs-toggle-password-group>` and gives **every** button the full target array.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Eye button | Password field with toggle | `examples/advanced-forms/toggle-password/basic-usage.html` | Baseline. `<button type="button">` absolutely positioned over a `pe-10` input; single `"target": "#id"`; SVG paths swap via `hs-password-active:`. |
| Checkbox control | Checkbox-controlled toggle | `examples/advanced-forms/toggle-password/checkbox.html` | The attribute moves onto an `<input type="checkbox">`. Event type becomes `change`, initial state reads `.checked`, input drops `pe-10` (`px-4`) and there is no icon/`hs-password-active:` at all. |
| Two fields in sync | Synchronized password fields | `examples/advanced-forms/toggle-password/multi-toggle.html` | Adds `data-hs-toggle-password-group` around both fields; each button's `"target"` is an **array of both ids** so `isMultiple` is true and `.active` lands on the group wrapper. |
| Inside a modal | Modal example | `examples/advanced-forms/toggle-password/modal-example.html` | Same baseline field nested in an `hs-overlay` dialog (`bg-overlay`, `border-overlay-header`/`-footer`, `bg-surface` close button). No extra JS — `autoInit` runs while the modal is hidden. |
| Destroy / reinit | Destroy and reinitialize | `examples/advanced-forms/toggle-password/destroy-and-reinitialize.html` (+ `.js`) | Group form plus two buttons; the destroy handler iterates `#hs-toggle-password-to-destroy [data-hs-toggle-password]` and calls `HSTogglePassword.getInstance(el, true)` → `element.destroy()` per button. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` | Password input resting fill (`bg-layer`) | `white` | `neutral-800` |
| `layer-line` | Password input border | `gray-200` | `neutral-700` |
| `foreground` | Field label + typed text | `gray-800` | `neutral-200` |
| `muted-foreground` | Resting eye-icon colour (`text-muted-foreground`) | `gray-500` | `neutral-500` |
| `muted-foreground-1` | Placeholder text; checkbox label | `gray-600` | `neutral-400` |
| `primary-focus` | Input focus border + ring, and the button's `focus:text-*` | `gray-900` | `neutral-300` |
| `primary` | Checkbox tick colour (`text-primary`) | `gray-800` | `white` |
| `primary-checked` | Checkbox checked fill + border | `gray-800` | `white` |
| `line-3` | Checkbox resting border (`border-line-3`) | `gray-300` | `neutral-600` |
| `overlay` | Modal panel fill | `white` | `neutral-800` |
| `overlay-line` | Modal panel border — transparent both modes | `transparent` | `transparent` |
| `overlay-header` / `overlay-footer` | Modal header/footer rules | `gray-200` | `neutral-700` |
| `scrollbar-track` | Modal body scrollbar track (`[&::-webkit-scrollbar-track]:bg-scrollbar-track`) | `gray-100` | `neutral-700` |
| `scrollbar-thumb` | Modal body scrollbar thumb | `gray-300` | `neutral-500` |
| `primary` / `primary-foreground` / `primary-hover` / `primary-line` | Modal "Open modal" + "Save changes" buttons | `gray-800` / `white` / `gray-900` / `transparent` | `white` / `neutral-800` / `neutral-300` / `transparent` |
| `surface` / `surface-line` / `surface-foreground` / `surface-hover` / `surface-focus` | Modal close button; "Reinitialize" button | `gray-100` / `transparent` / `gray-800` / `gray-200` / `gray-200` | `neutral-700` / `transparent` / `neutral-200` / `neutral-600` / `neutral-600` |
| `layer-foreground` / `layer-hover` / `layer-focus` | Modal "Close" and "Destroy" buttons | `gray-800` / `gray-50` / `gray-50` | `white` / `neutral-700` / `neutral-700` |

## Behaviour (JS)

Class `HSTogglePassword` (`assets/js/preline/toggle-password.js`).

Init: `HSTogglePassword.autoInit()` on `window load`; it prunes `window.$hsTogglePasswordCollection` of detached nodes, then constructs one instance per `[data-hs-toggle-password]:not(.--prevent-on-load-init)` not already registered.

| Attribute | Purpose |
|---|---|
| `data-hs-toggle-password` | The control (button or checkbox) + JSON options |
| `data-hs-toggle-password-group` | Wrapper that makes multi-target toggles behave as one; receives `.active` |

Option: `target` only. Three accepted shapes — a selector string, a **comma-separated** selector string (split on `,`), or a JSON array of selectors (`["#a", "#b"]`, used by the group examples). Each is resolved with `document.querySelector`.

Mechanism:
- `eventType` is `"change"` when the host passes `isFormElement()` (input / textarea / select), otherwise `"click"` — so the checkbox variant listens to `change` automatically.
- Initial state: `isShown = el.hasAttribute("type") && el.checked`. A checkbox rendered `checked` therefore reveals the password on load; a `<button type="button">` yields `undefined` → hidden.
- `isMultiple = target.length > 1 && el.closest("[data-hs-toggle-password-group]")`.
- `show()` sets every target's `type = "text"` and adds `.active` — to `this.el` when single, to the **group wrapper** when multiple, plus it flips `isShown` on every sibling instance found by `getMultipleToggles()`. `hide()` is the exact inverse (`type = "password"`).

Variant `hs-password-active:` resolves to `&.active` **or** `.active &` — defined in `node_modules/preline/src/plugins/strong-password/variants.css`, reached through `assets/css/variants.css` (there is no toggle-password variants file).

Events: `instance.on('toggle', target)` and the DOM `CustomEvent` **`toggle.hs.toggle-select`** (dispatched on the control, `detail.payload` = the target array).
Statics: `HSTogglePassword.getInstance(target, isInstance)` — returns the instance, or `{id, element}` with `true` · `autoInit()`.
`destroy()` removes `.active`, forces every target back to `type="password"`, detaches the listener and drops the collection entry.

## Gotchas

- **The DOM event is named `toggle.hs.toggle-select`, not `toggle.hs.toggle-password`.** Copy-pasting the obvious name gets you a listener that never fires. Prefer `instance.on('toggle', cb)`.
- **In group mode `.active` goes on the wrapper, not the button.** That only works because `hs-password-active:` also matches the descendant form `.active &`; the icon must be inside `[data-hs-toggle-password-group]`. A toggle icon rendered in a portal outside the wrapper never swaps.
- **`isMultiple` needs BOTH conditions.** Two buttons inside the group each targeting only their own input have `target.length === 1` → not multiple → each flips only its own field and `.active` lands on the button, so the two fields desync. That is why every button in `multi-toggle.html` lists *both* ids.
- **`hs-password-active:` is registered by the strong-password plugin.** If a build trims `variants.css` imports to "only what this page uses", dropping strong-password kills the eye-icon swap with no error — the `type` still flips, the icon just freezes.
- **A `checked` checkbox reveals the password on first paint**, because `isShown` is seeded from `el.checked`. Render it unchecked unless that is intentional.
- **`type="button"` on the toggle is load-bearing.** Inside a `<form>` the default is `submit`; the docs always spell it out.
- **The toggle button has no accessible name.** In all four button-form examples (`basic-usage`, `multi-toggle`, `modal-example`, `destroy-and-reinitialize`) it is a `<button>` whose only content is an `<svg>` — no text, no `aria-label`, no `aria-pressed`. Add both; the plugin never touches ARIA. Only the checkbox variant is labelled, via a real `<label for="hs-toggle-password-checkbox">Show password</label>`.
- **The input needs `pe-10` (or equivalent end padding) and a `relative` parent.** The button is `absolute inset-y-0 inset-e-0` with `z-20`; the checkbox variant drops both because it has no overlay button (`px-4`, no wrapper).
- **`destroy()` resets state, it does not preserve it.** Every target is forced back to `type="password"` and `.active` is stripped, so a destroy/reinit cycle always lands on "hidden" regardless of what the user had open.
- **`autoInit()` fires on `window load`, not `DOMContentLoaded`.** After any client-side render (or a password-manager re-render of the field) call `HSTogglePassword.autoInit()` again — it skips already-registered nodes and `.--prevent-on-load-init`, so it is safe to call repeatedly.
- **Moon detail:** the resting icon is `text-muted-foreground` = `gray-500` in light and `neutral-500` in dark — the same lightness both ways, i.e. low contrast on `bg-layer` dark (`neutral-800`). Focus jumps to `primary-focus`, which inverts (`gray-900` light → `neutral-300` dark).

## Copy-paste base

`examples/advanced-forms/toggle-password/basic-usage.html`

```html
<!-- Form Group -->
<div class="max-w-sm w-full">
  <label class="block mb-2 text-sm text-foreground">Password</label>
  <div class="relative">
    <input id="hs-toggle-password" type="password" class="py-2.5 sm:py-3 ps-4 pe-10 block w-full bg-layer border-layer-line rounded-lg sm:text-sm text-foreground placeholder:text-muted-foreground-1 focus:border-primary-focus focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none" placeholder="Enter password" value="12345qwerty">
    <button type="button" data-hs-toggle-password='{
        "target": "#hs-toggle-password"
      }' class="absolute inset-y-0 inset-e-0 flex items-center z-20 px-3 cursor-pointer text-muted-foreground rounded-e-md focus:outline-hidden focus:text-primary-focus">
      <svg class="shrink-0 size-3.5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path class="hs-password-active:hidden" d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
        <path class="hs-password-active:hidden" d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
        <path class="hs-password-active:hidden" d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
        <line class="hs-password-active:hidden" x1="2" x2="22" y1="2" y2="22"/>
        <path class="hidden hs-password-active:block" d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
        <circle class="hidden hs-password-active:block" cx="12" cy="12" r="3"/>
      </svg>
    </button>
  </div>
</div>
<!-- End Form Group -->
```
