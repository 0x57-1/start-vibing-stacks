---
component: switch
label: Switch
category: basic-forms
docs: https://preline.co/docs/components/switch.html
examples: 10
js: none
tokens: [primary-checked, surface-1, muted-foreground-1, switch, primary-100, primary-800, plain, foreground-inverse, tooltip, tooltip-line, tooltip-foreground]
---

# Switch

A CSS-only toggle: a visually hidden `<input type="checkbox" class="peer sr-only">` inside a `relative` `<label>`, with two absolutely positioned `<span>`s driven by `peer-checked:`.

## When to use
- A single binary setting that applies immediately (notifications on/off, dark mode). No Save button.
- Prefer **checkbox** (`examples/basic-forms/checkbox/`) when the value is submitted with a form and only takes effect on submit, or when the item is one of a list of independent selections.
- Prefer **radio** (`components/radio.md`) for a choice between two *named* alternatives — a switch has no label for its off state.
- Never use it for a destructive action; it has no confirmation step.

## Anatomy

Reduced skeleton — every class below appears in `examples/basic-forms/switch/example.html`.

```html
<label for="ID" class="relative inline-block w-11 h-6 cursor-pointer">   <!-- track box; sets the size -->
  <input type="checkbox" id="ID" class="peer sr-only">                   <!-- state source; NOT hidden -->

  <span class="absolute inset-0 bg-surface-1 rounded-full               <!-- track -->
               transition-colors duration-200 ease-in-out
               peer-checked:bg-primary-checked
               peer-disabled:opacity-50 peer-disabled:pointer-events-none"></span>

  <span class="absolute top-1/2 inset-s-0.5 -translate-y-1/2 size-5      <!-- knob -->
               bg-switch rounded-full shadow-sm
               transition-transform duration-200 ease-in-out
               peer-checked:translate-x-full"></span>
</label>
```

The knob travels by `translate-x-full` = **its own width**, so track width must equal `2 × knob + 2 × inset` or the knob over/undershoots. Observed pairs (from `sizes.html`):

| Track | Knob | Label |
|---|---|---|
| `w-9 h-5` | `size-4` | Extra small |
| `w-11 h-6` | `size-5` | Small (default) |
| `w-13 h-7` | `size-6` | Medium |
| `w-15 h-8` | `size-7` | Large |

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Default | Default switch | `examples/basic-forms/switch/example.html` | Bare `w-11 h-6` track + `size-5` knob, nothing else |
| With description | Switch with description | `examples/basic-forms/switch/with-description.html` | `flex items-center gap-x-3` wrapper + sibling `<label>` sharing the same `for`; third row shows Off/On labels flanking the track |
| Disabled | Disabled switch | `examples/basic-forms/switch/disabled.html` | `disabled` on the input; `peer-disabled:opacity-50 peer-disabled:pointer-events-none` on the **track span** only |
| Sizes | Switch sizes | `examples/basic-forms/switch/sizes.html` | Four track/knob pairs (table above) |
| With icons | Switch with icons | `examples/basic-forms/switch/with-icons.html` | Soft track (`primary-100` / `dark:primary-800`), `bg-plain` knob that turns `peer-checked:bg-primary-checked`. **Contains no icons — byte-identical to `soft-color-variants.html`** |
| Soft colors | Soft color variants | `examples/basic-forms/switch/soft-color-variants.html` | Same file as above, three sizes |
| Corner radius | Corner radius | `examples/basic-forms/switch/rounded.html` | Drops `rounded-full`: squared / `rounded-sm`+`rounded-xs` / `rounded-md`+`rounded-sm` / `rounded-lg`+`rounded-md`. Knob radius is always one step tighter than the track |
| Rounded with icons | Rounded with icons | `examples/basic-forms/switch/soft-color-variants-with-icons.html` | The real icon version: two extra icon spans (X left, check right) painted **after** the knob; insets scale `inset-s-0.5` → `inset-s-1` → `inset-s-1.5` per size |
| With tooltip | Switch with tooltip | `examples/basic-forms/switch/with-tooltip.html` | Adds `hs-tooltip` wrapper, `hs-tooltip-toggle` on the track label, `hs-tooltip-content` div with `role="tooltip"` |
| Validation | Validation states | `examples/basic-forms/switch/validation-states.html` | Track `peer-checked:bg-teal-600 dark:peer-checked:bg-teal-500` / `red-600`/`red-500` literals instead of `primary-checked` |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `surface-1` (`bg-surface-1`) | Track in the OFF state | `gray-200` | `neutral-600` |
| `primary-checked` (`peer-checked:bg-*`) | Track in the ON state; also the knob fill in the soft variants | `gray-800` | `white` |
| `switch` (`bg-switch`) | Knob, standard variants | `white` | `neutral-800` |
| `plain` (`bg-plain`) | Knob, soft variants (before it flips to `primary-checked`) | `white` | `neutral-800` |
| `primary-100` (`peer-checked:bg-*`) | Soft ON track, light mode only | `gray-100` | `neutral-100` |
| `primary-800` (`dark:peer-checked:bg-*`) | Soft ON track, dark mode only | `gray-800` | `neutral-800` |
| `muted-foreground-1` | Sibling text label; OFF-state icon colour | `gray-600` | `neutral-400` |
| `foreground-inverse` (`peer-checked:text-*`) | ON-state (right) icon, sitting on the dark knob | `white` | `white` |
| `tooltip` (`bg-tooltip`) | Tooltip bubble fill | `gray-900` | `white` |
| `tooltip-foreground` | Tooltip text | `white` | `neutral-800` |
| `tooltip-line` (`border-tooltip-line`) | Tooltip border | `transparent` | `transparent` |

## Behaviour (JS)

Static markup only -- no Preline JS. State is `:checked` on the peer input; motion is `transition-colors` on the track and `transition-transform` on the knob.

`with-tooltip.html` is the exception: its `hs-tooltip` / `hs-tooltip-toggle` / `hs-tooltip-content` classes are consumed by `HSTooltip` (`assets/js/preline/tooltip.js`), which self-registers on `window` load. The switch itself still needs no JS.

## Gotchas
- **`sr-only`, never `hidden`.** The input must stay focusable and in the a11y tree; `hidden`/`display:none` kills keyboard toggling and every `peer-checked:` rule with it.
- **`peer` only reaches *following siblings*.** Both spans must come after the input inside the same `<label>`. Wrapping either span in a div breaks every `peer-*` rule silently.
- **`primary-100` / `primary-800` do NOT invert under moon** — `primary-100` is `gray-100` light and `neutral-100` dark (still light), `primary-800` is dark in both. That is exactly why the soft variants hand-write `dark:peer-checked:bg-primary-800`. Contrast with `primary-checked`, which flips `gray-800` → `white` on its own and needs no `dark:` prefix. Do not "clean up" that `dark:`.
- **`peer-disabled:` sits on the track span only** in every example — the knob keeps full opacity while disabled. Add it to the knob too if you want the whole control dimmed.
- **`with-icons.html` has no icons.** It is a byte-for-byte duplicate of `soft-color-variants.html` (verified with `diff`). The icon markup is in `soft-color-variants-with-icons.html`.
- **Icon spans must be last in the DOM.** They are absolutely positioned with no `z-index`; painting order is what puts them on top of the knob. Move them above the knob span and they disappear underneath it.
- **Duplicate IDs.** `rounded.html` and `sizes.html` both use `hs-xs-switch`/`hs-sm-switch`/`hs-md-switch`/`hs-lg-switch`; `with-icons.html` and `soft-color-variants.html` both use `hs-small-switch-soft` etc. Paste two on one page and clicking one toggles the other.
- **No switch ARIA in any example** — the only `role` in the whole set is `role="tooltip"` in `with-tooltip.html`. The control announces as a plain checkbox. If you need switch semantics, add `role="switch"` plus `aria-checked` to the input and keep them in sync — nothing in the markup does that for you.
- The `<label>` carries the size; the knob's `size-*` is separate. Change one without the other and `translate-x-full` lands the knob in the wrong place.

## Copy-paste base

`examples/basic-forms/switch/example.html`

```html
<label for="hs-basic-usage" class="relative inline-block w-11 h-6 cursor-pointer">
  <input type="checkbox" id="hs-basic-usage" class="peer sr-only">
  <span class="absolute inset-0 bg-surface-1 rounded-full transition-colors duration-200 ease-in-out peer-checked:bg-primary-checked peer-disabled:opacity-50 peer-disabled:pointer-events-none"></span>
  <span class="absolute top-1/2 inset-s-0.5 -translate-y-1/2 size-5 bg-switch rounded-full shadow-sm transition-transform duration-200 ease-in-out peer-checked:translate-x-full"></span>
</label>
```
