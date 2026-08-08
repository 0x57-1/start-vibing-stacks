---
component: color-picker
label: Color Picker
category: basic-forms
docs: https://preline.co/docs/components/color-picker.html
examples: 1
js: none
tokens: [foreground, layer, layer-line]
---

# Color Picker

A native `<input type="color">` framed by Preline field tokens. The picker UI itself is the operating system's — Preline only styles the `w-14 h-10` (56×40 px) frame that opens it; the swatch pseudo-element inside is untouched.

## When to use
- One arbitrary colour, free choice, value submitted with the form (`#rrggbb`).
- Do **NOT** use for a fixed brand palette — the OS dialog invites off-palette values. Build a swatch grid with Dropdown (`assets/js/preline/dropdown.js`) + buttons instead.
- Do **NOT** use where the chosen colour needs alpha, HSL, or eyedropper-from-page. `type="color"` is opaque 24-bit hex only.
- Do not expect visual consistency across platforms — Windows, macOS, GTK and Android each render a different dialog.

## Anatomy

Reduced skeleton (every class below appears verbatim in `examples/basic-forms/color-picker/example.html`):

```html
<label for="hs-color-input"
       class="block mb-2 text-sm font-medium text-foreground">Color picker</label>   <!-- visible label -->

<input type="color" id="hs-color-input"
       class="p-1 h-10 w-14 block          <!-- p-1 is the visible frame gutter -->
              bg-layer                      <!-- frame fill, seen only in that 4px gutter -->
              border border-layer-line rounded-lg
              cursor-pointer
              disabled:opacity-50 disabled:pointer-events-none"
       value="#2563eb" title="Choose your color">
```

The swatch fills the box minus `p-1`; the only Preline-controlled pixels are that 1-unit gutter and the border.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Default color input | Default color input | `examples/basic-forms/color-picker/example.html` | The only example. Fixed `h-10 w-14`, `value="#2563eb"`, `title` tooltip, visible `<label>`. No size, disabled or inline-swatch variant exists upstream. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `text-foreground` | Label text above the input | `gray-800` | `neutral-200` |
| `bg-layer` | Frame fill behind the swatch, visible only as the `p-1` gutter | `white` | `neutral-800` |
| `border-layer-line` | Frame border | `gray-200` | `neutral-700` |

Only three tokens — everything else on screen is the browser's own swatch and dialog, which no theme token reaches.

## Behaviour (JS)

Static markup only -- no Preline JS. There is no `HSColorPicker`; `assets/js/preline/` has no colour module. The dialog is opened by the UA on click, and the element emits the standard `input` (live, while dragging) and `change` (on commit) events.

## Gotchas
- **The swatch is a pseudo-element Preline never touches.** `rounded-lg` rounds the *frame*; the inner swatch stays square in Chromium/WebKit. Rounding it needs your own arbitrary variant — e.g. `[&::-webkit-color-swatch]:rounded-md` plus `[&::-moz-color-swatch]:rounded-md`, neither of which is in the example.
- **`p-1` is not optional padding, it is the entire visual design.** Remove it and the swatch covers the box edge-to-edge, hiding `bg-layer` and clipping under the border.
- **No focus style at all.** The class list has zero `focus:` utilities, so the control depends on the UA outline. If you add `focus:outline-hidden` for consistency with the other Preline fields, you must add a ring back — `focus:ring-primary-focus` (`gray-900` light / `neutral-300` dark) matches the sibling inputs in `basic-forms`.
- **`value` must be 7-char hex.** `#fff` shorthand, named colours and `rgba()` are all coerced to `#000000` by the UA. The submitted value is always lowercase 7-char hex, never transparent.
- **`value="#2563eb"` is a literal, not a token.** It is Tailwind `blue-600` hard-coded and will not follow moon in dark mode. Do not read it as a theme default; set your own initial value server-side.
- **`cursor-pointer` survives `disabled`.** The example disables interaction with `disabled:opacity-50 disabled:pointer-events-none` but never resets the cursor; with `pointer-events-none` the cursor is moot in practice, but drop `cursor-pointer` if you switch to `aria-disabled` instead.
- **Fixed `h-10 w-14`** — the control does not grow with `w-full`; those two utilities must be replaced, not overridden by a wrapper.
- Unlike File Input in the same category, the label here is **visible** (`block mb-2 text-sm font-medium`), not `sr-only`. `title` renders a tooltip and is only the last-resort fallback in the accessible-name computation — keep the `<label for>`, which outranks it.

## Copy-paste base

`examples/basic-forms/color-picker/example.html`

```html
<label for="hs-color-input" class="block mb-2 text-sm font-medium text-foreground">Color picker</label>
<input type="color" class="p-1 h-10 w-14 block bg-layer border border-layer-line cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none" id="hs-color-input" value="#2563eb" title="Choose your color">
```
