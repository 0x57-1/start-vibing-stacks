---
component: select
label: Select
category: basic-forms
docs: https://preline.co/docs/components/select.html
examples: 9
js: none
tokens: [primary-focus, foreground, layer, layer-line, muted-foreground-1, surface]
---

# Select

A native `<select>` element carrying moon token utilities; the OS draws the dropdown and the chevron.

## When to use
- One value out of a longer list (~7+ options) where the option text alone is enough.
- Prefer **radio** (`components/radio.md`) below ~7 options so every choice stays visible.
- Prefer **advanced-select** (`advanced-forms`, 41 examples, `data-hs-select` + `HSSelect`) when you need search, multi-select, tags, avatars/icons in rows, or any custom option rendering — a native `<option>` can hold text only.
- Prefer **combobox** (`advanced-forms`, `HSComboBox`) when the user may type a value that is not in the list.

## Anatomy

Reduced skeleton — every class below appears in `examples/basic-forms/select/example.html`.

```html
<select class="py-3 px-4 pe-9                       <!-- pe-9 reserves the native chevron gutter -->
               block w-full
               bg-layer border-layer-line           <!-- outlined style -->
               rounded-lg text-sm text-foreground
               focus:border-primary-focus focus:ring-primary-focus
               disabled:opacity-50 disabled:pointer-events-none">
  <option selected>Open this select menu</option>
  <option>1</option>
</select>
```

Two mutually exclusive surface styles:

| Style | Classes | Files |
|---|---|---|
| Outlined | `bg-layer border-layer-line` | `example.html`, `sizes.html`, `label.html`, `hidden-label.html`, `pilled-select.html`, first block of `disabled.html` and `floating-label.html` |
| Filled | `bg-surface border-transparent` | `stone-input.html`, second block of `disabled.html` and `floating-label.html` |

`validation-states.html` is neither: it keeps `bg-layer` and replaces the border with the literal `border-red-500` / `border-teal-500`.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Default | Default select | `examples/basic-forms/select/example.html` | Outlined baseline, `py-3 px-4 pe-9 rounded-lg` |
| Filled | Filled select | `examples/basic-forms/select/stone-input.html` | `bg-surface border-transparent` instead of `bg-layer border-layer-line` |
| Floating label | Floating label | `examples/basic-forms/select/floating-label.html` | `peer` + `relative` wrapper, `p-4` base, `focus:pt-6 focus:pb-2` / `not-placeholder-shown:pt-6` padding shift, absolutely positioned label with `peer-focus:text-xs peer-focus:-translate-y-1.5 peer-focus:text-muted-foreground-1`. Shown in both surface styles |
| Sizes | Select sizes | `examples/basic-forms/select/sizes.html` | Padding only: `py-2 px-3` / `py-3 px-4` / `sm:p-5 p-4`. `text-sm` never changes |
| Pill | Pill select | `examples/basic-forms/select/pilled-select.html` | `rounded-full` instead of `rounded-lg`; everything else identical to default |
| Disabled | Disabled select | `examples/basic-forms/select/disabled.html` | `disabled` attribute activating `disabled:opacity-50 disabled:pointer-events-none`; both surface styles |
| With label | Select with label | `examples/basic-forms/select/label.html` | Sibling `<label for>` with `block mb-2 text-sm font-medium text-foreground` |
| Hidden label | Visually hidden label | `examples/basic-forms/select/hidden-label.html` | Same label with `sr-only` — keeps the accessible name without visible text |
| Validation | Validation states | `examples/basic-forms/select/validation-states.html` | `border-red-500`/`border-teal-500` + matching `focus:` literals, `pe-16` to clear the status icon, absolutely positioned SVG in `inset-y-0 inset-e-0 ... pe-8`, helper `<p>` below |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` (`bg-layer`) | Resting surface, outlined style | `white` | `neutral-800` |
| `layer-line` (`border-layer-line`) | Border, outlined style | `gray-200` | `neutral-700` |
| `surface` (`bg-surface`) | Resting surface, filled style (paired with `border-transparent`) | `gray-100` | `neutral-700` |
| `foreground` (`text-foreground`) | Selected value text; the visible `<label>`; base class on the floating label, where it is always overridden (see Gotchas) | `gray-800` | `neutral-200` |
| `primary-focus` (`focus:border-*`, `focus:ring-*`) | Focus border and ring | `gray-900` | `neutral-300` |
| `muted-foreground-1` (`peer-focus:text-*`, `peer-not-placeholder-shown:text-*`) | Floating label in its raised state — which on a `<select>` means always | `gray-600` | `neutral-400` |

## Behaviour (JS)

Static markup only -- no Preline JS.

The Preline runtime does ship `assets/js/preline/select.js` (`HSSelect`, attribute `data-hs-select`, autoInit on `window` load), but it powers the **advanced-select** component, not this one. Adding `data-hs-select` here replaces the native element with a generated Preline widget and every class in this file stops applying.

## Gotchas
- **`pe-9` is load-bearing.** It is the gutter for the native chevron the browser paints on the trailing edge. Drop it, or set `px-4` after it, and long option text runs under the arrow. Validation needs `pe-16` because the status icon sits inside that gutter too.
- **The floating label is permanently raised on a `<select>`.** `:placeholder-shown` matches only `<input>`/`<textarea>`, so `:not(:placeholder-shown)` is *always* true here — `not-placeholder-shown:pt-6 not-placeholder-shown:pb-2` and `peer-not-placeholder-shown:-translate-y-1.5` apply from first paint. That is why the pattern works with zero JS, and also why there is no "empty" resting state: do not expect the label to drop back down.
- **You cannot style `<option>` with moon tokens.** The popup list is drawn by the OS; `bg-layer`/`text-foreground` on the `<select>` do not reach the options. On some platforms the options render with the OS light palette even in dark mode. If that matters, move to advanced-select.
- **Outlined and filled are not additive.** Filled uses `border-transparent`; if you keep `border-layer-line` and add `bg-surface` you get a bordered grey box that matches neither example.
- **Validation swaps the border and focus tokens only** — `border-red-500` / `focus:border-red-500` / `focus:ring-red-500` (and the teal pair) are literal Tailwind colours, identical in light and dark; the surface stays `bg-layer` and the value text stays `text-foreground`. Do not swap in `destructive` expecting the same rendering.
- The validation icon wrapper needs `pointer-events-none`, otherwise it swallows clicks that should open the dropdown.
- `pilled-select.html` and `example.html` differ by exactly one class (`rounded-full` vs `rounded-lg`) — do not treat pill as a separate component.
- Only `label.html`, `hidden-label.html` and `validation-states.html` give the `<select>` an `id`. Every other example has no accessible name at all; add `<label for>` or `aria-label` before shipping.

## Copy-paste base

`examples/basic-forms/select/example.html`

```html
<select class="py-3 px-4 pe-9 block w-full bg-layer border-layer-line rounded-lg text-sm text-foreground focus:border-primary-focus focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none">
  <option selected>Open this select menu</option>
  <option>1</option>
  <option>2</option>
  <option>3</option>
</select>
```
