---
component: file-input
label: File Input
category: basic-forms
docs: https://preline.co/docs/components/file-input.html
examples: 3
js: none
tokens: [primary-focus, muted-foreground-1, layer, layer-line, foreground, surface, primary, primary-foreground, primary-hover]
---

# File Input

A themed `<input type="file">`: the field itself is a normal Preline text-field surface, and the browser's own "Choose file" button is restyled through the Tailwind `file:` variant (`::file-selector-button`).

## When to use
- A single file field inside a normal form, submitted with the form. Styling only — no JS.
- Use the **button-style** variant when you want just an upload button with no field chrome (avatar / profile photo pickers).
- Do **NOT** use for drag-and-drop, previews, progress bars, multi-file queues or direct-to-S3 uploads — that is Preline's File Upload component (`assets/js/preline/file-upload.js`, `HSFileUpload`), a different component with real JS.
- Do not use it as a "styled button that opens a picker" without adding a focus style back (see Gotchas).

## Anatomy

Reduced skeleton (every class below appears verbatim in `examples/basic-forms/file-input/example.html`):

```html
<div class="max-w-sm w-full">                    <!-- width owner; input is block w-full -->
  <label for="file-input" class="sr-only">…</label>
  <input type="file" id="file-input"
    class="block w-full
           bg-layer border border-layer-line rounded-lg        <!-- field surface -->
           text-sm text-foreground                              <!-- chosen filename -->
           placeholder:text-muted-foreground-1
           focus:z-10 focus:outline-hidden
           focus:border-primary-focus focus:ring-1 focus:ring-primary-focus
           disabled:opacity-50 disabled:pointer-events-none
           file:bg-surface file:border-0                        <!-- ::file-selector-button -->
           file:me-4                                            <!-- logical gap, RTL-safe -->
           file:py-3 file:px-4">                                <!-- the ONLY vertical padding -->
</div>
```

The input has **no padding of its own**. Field height is produced entirely by `file:py-*` on the selector button.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Default file input | Default file input | `examples/basic-forms/file-input/example.html` | Baseline: `bg-layer` field + `file:bg-surface` button, `file:py-3 file:px-4`. |
| Sizes (small / medium / large) | File input sizes | `examples/basic-forms/file-input/sizes.html` | Same field, three buttons: `file:py-2` (sm), `file:py-3` (md), `file:py-3 sm:file:py-5` (lg). Only `file:py-*` moves; `file:px-4` is constant. |
| Button-style file input | Button-style file input | `examples/basic-forms/file-input/file-input-buttons.html` | Field chrome removed (no `bg-layer`, no border, no ring). Button becomes a solid pill: `file:rounded-lg file:font-semibold file:cursor-pointer file:bg-primary file:text-primary-foreground hover:file:bg-primary-hover`. Input text drops to `text-muted-foreground-1`. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `bg-layer` | Resting field surface (default + sizes) | `white` | `neutral-800` |
| `border-layer-line` | Field border | `gray-200` | `neutral-700` |
| `text-foreground` | Selected filename text in the field | `gray-800` | `neutral-200` |
| `placeholder:text-muted-foreground-1` / `text-muted-foreground-1` | "No file chosen" text; whole input text in the button variant | `gray-600` | `neutral-400` |
| `focus:border-primary-focus` + `focus:ring-primary-focus` | Focus border and 1px ring | `gray-900` | `neutral-300` |
| `file:bg-surface` | Selector-button fill, default/sizes variants | `gray-100` | `neutral-700` |
| `file:bg-primary` | Selector-button fill, button variant | `gray-800` | `white` |
| `file:text-primary-foreground` | Selector-button label, button variant | `white` | `neutral-800` |
| `hover:file:bg-primary-hover` | Selector-button hover fill, button variant | `gray-900` | `neutral-300` |

## Behaviour (JS)

Static markup only -- no Preline JS.

## Gotchas
- **`file:` targets `::file-selector-button`, not the input.** A plain `py-3` styles the field; `file:py-3` styles the button. The examples use only the latter, and Tailwind preflight zeroes `padding` on both `*` and `::file-selector-button`, so removing `file:py-*` collapses the whole control to text height — not to a UA default.
- **Variant order is not interchangeable.** `hover:file:bg-primary-hover` (hover anywhere on the input → restyle the button) is what `file-input-buttons.html` ships; `file:hover:` would require hovering the button itself. `file:disabled:opacity-50` is the reverse order and is correct as written — it scopes disabled state to the button.
- **"Large" and "medium" are identical below the `sm` breakpoint.** Large is `file:py-3 file:px-4 sm:file:py-5`; on mobile both render at `py-3`. Do not promise three visually distinct sizes on phones.
- **The button variant has no visible focus state.** It carries `focus:outline-hidden` with nothing put back (no `focus:ring-*`). If it is a primary control, add a ring, or keyboard users get no indicator.
- **`file:border-0` is redundant under Tailwind v4**, not load-bearing: preflight already ships `*, ::after, ::before, ::backdrop, ::file-selector-button { border: 0 solid }`, so the UA border is gone before the utility runs. It only earns its place if preflight is disabled. What *is* true is that the input's own `border border-layer-line` never reaches the pseudo-element — a button border must be `file:border-*`.
- **Moon inverts `primary`.** In the button variant the pill is `gray-800` bg / `white` text in light and flips to `white` bg / `neutral-800` text in dark. It is not "a dark button that stays dark".
- **`file:me-4` is logical margin-end.** Keep it; `mr-4` breaks RTL layouts. Preflight already restores `::file-selector-button { margin-inline-end: 4px }`, so dropping `file:me-4` gives you 4px, not 0.
- `disabled:pointer-events-none` on the button variant sits under `file:` (`file:disabled:pointer-events-none`), so the *input* still receives clicks when disabled — pair with the real `disabled` attribute, which the UA honours anyway.
- The label is `sr-only` in every variant; the button variant wraps the input in `<label>` with an `sr-only` `<span>` and has **no `id`/`for`**. If you add `id`, add matching `for`.

## Copy-paste base

`examples/basic-forms/file-input/example.html`

```html
<div class="max-w-sm w-full">
  <label for="file-input" class="sr-only">Choose file</label>
  <input type="file" name="file-input" id="file-input" class="block w-full bg-layer border border-layer-line rounded-lg text-sm text-foreground placeholder:text-muted-foreground-1 focus:z-10 focus:outline-hidden focus:border-primary-focus focus:ring-1 focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none
    file:bg-surface file:border-0
    file:me-4
    file:py-3 file:px-4">
</div>
```
