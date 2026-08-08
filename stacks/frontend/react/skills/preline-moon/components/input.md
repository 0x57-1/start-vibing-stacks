---
component: input
label: Input
category: basic-forms
docs: https://preline.co/docs/components/input.html
examples: 16
js: none
tokens: [layer, layer-line, foreground, muted-foreground-1, primary-focus, surface, line-2]
---

# Input

Single-line form control: the base `<input>` skin plus its label, sizing, shape, state and validation variants.

## When to use

- Any single-line value. `type=` drives semantics and the mobile keyboard, so keep it accurate (`email`, `password`, `text`).
- Need a prefix/suffix, an icon, a unit, a select or a submit button glued to the field? That is `input-group` — this component covers the naked control only.
- Multi-line prose goes to `textarea`.
- Purpose-built controls have their own components: pin entry, number stepper, password strength/toggle, file upload, combobox. Do not rebuild them from a bare input.

## Anatomy

```html
<!-- REDUCED SKELETON. Every class is verbatim from examples/basic-forms/input/label.html -->
<div class="max-w-sm w-full space-y-3">
  <!-- label carries the theme via text-foreground -->
  <label for="ID" class="block mb-2 text-sm font-medium text-foreground">Name</label>

  <!-- box   : bg-layer + border-layer-line + rounded-lg
       text  : text-foreground / placeholder:text-muted-foreground-1
       focus : focus:border-primary-focus focus:ring-primary-focus -->
  <input id="ID" type="text" class="py-2.5 sm:py-3 px-4 rounded-lg block w-full bg-layer border-layer-line sm:text-sm text-foreground placeholder:text-muted-foreground-1 focus:border-primary-focus focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none" placeholder="James">
</div>
```

There is no border-**width** utility in this skin. The 1px border comes from `@tailwindcss/forms`; `border-layer-line` only recolours it. Without the plugin every input renders borderless. The one exception is the underline variant, which sets `border-b-2` explicitly (`underline-input.html`, `floating-label.html`, `disabled.html`).

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| `basic` | Default input | `examples/basic-forms/input/basic.html` | Baseline skin, no label, no placeholder. |
| `placeholder` | Input with placeholder | `examples/basic-forms/input/placeholder.html` | Adds `placeholder=`; colour from `placeholder:text-muted-foreground-1`. |
| `label` | Input with label | `examples/basic-forms/input/label.html` | `<label class="block mb-2 text-sm font-medium text-foreground">` above. |
| `hidden-label` | Hidden label input | `examples/basic-forms/input/hidden-label.html` | Same label with `class="sr-only"`. |
| `stone-input` | Stone style input | `examples/basic-forms/input/stone-input.html` | `bg-surface border-transparent` + `focus:bg-layer`, `peer` + `ps-11` leading icon. |
| `underline-input` | Underlined input | `examples/basic-forms/input/underline-input.html` | `bg-transparent border-b-2 border-b-line-2 border-{t,x}-transparent`, `focus:ring-0`, `pe-0 ps-8`. |
| `floating-label` | Floating label | `examples/basic-forms/input/floating-label.html` | 6 fields = 3 skins (layer / surface / underline) × email+password; `peer` + `focus:pt-6 focus:pb-2` + `not-placeholder-shown:*` + `autofill:pt-6`. |
| `floating-label-filled` | Filled floating label | `examples/basic-forms/input/floating-label-filled.html` | Same as above with `value=` preset, so the label starts floated via `peer-not-placeholder-shown:`. |
| `sizes` | Input sizes | `examples/basic-forms/input/sizes.html` | Padding only: `py-1.5 sm:py-2 px-3` / `py-2.5 sm:py-3 px-4` / `p-3.5 sm:p-5`. Text stays `sm:text-sm`. |
| `pilled-input` | Pill input | `examples/basic-forms/input/pilled-input.html` | `rounded-lg` → `rounded-full`. Sole difference from `placeholder`. |
| `readonly` | Read-only input | `examples/basic-forms/input/readonly.html` | `readonly` attribute; **no** style change. |
| `disabled` | Disabled input | `examples/basic-forms/input/disabled.html` | 6 fields: plain and `disabled readonly` in the base skin, then the stone-with-icon and underline-with-icon pairs, each also `disabled` / `disabled readonly`. Icon wrapper dims via `peer-disabled:opacity-50`. |
| `helper-text` | Input with helper text | `examples/basic-forms/input/helper-text.html` | `<p class="mt-2 text-sm text-muted-foreground-1">` + `aria-describedby`. |
| `inline-helper-text` | Input with inline helper text | `examples/basic-forms/input/inline-helper-text.html` | Row layout `sm:inline-flex sm:items-center … sm:space-x-3`; input capped at `max-w-xs`. |
| `corner-hint` | Input with corner hint | `examples/basic-forms/input/corner-hint.html` | Label row becomes `flex flex-wrap justify-between items-center gap-2` + trailing `<span>Optional</span>`. |
| `validation-states` | Validation states | `examples/basic-forms/input/validation-states.html` | `border-red-500` / `border-teal-500`, `focus:ring-red-500` / `focus:ring-teal-500`, absolute `inset-e-0 pe-3` status icon. Raw palette, **not** tokens. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` | Resting field fill (`bg-layer`); also the *focus* fill of the stone variant (`focus:bg-layer`) | `white` | `neutral-800` |
| `layer-line` | Field hairline (`border-layer-line`) | `gray-200` | `neutral-700` |
| `foreground` | Typed text, label text, floating label at rest (`text-foreground`) | `gray-800` | `neutral-200` |
| `muted-foreground-1` | Placeholder, helper text, corner hint, leading/trailing icon, floated label | `gray-600` | `neutral-400` |
| `primary-focus` | Focus border + focus ring (`focus:border-primary-focus focus:ring-primary-focus`) | `gray-900` | `neutral-300` |
| `surface` | Stone-variant resting fill (`bg-surface`) | `gray-100` | `neutral-700` |
| `line-2` | Underline-variant rule (`border-b-line-2`) | `gray-200` | `neutral-700` |

`line-2` is present in the markup of `underline-input.html`, `floating-label.html` and `disabled.html` but is missing from `data/index.json`'s token counter for this component — the counter does not recognise per-side `border-b-*` utilities (it drops `focus:border-b-primary-focus` for the same reason). Trust the markup.

## Behaviour (JS)

Static markup only -- no Preline JS.

`hs_attrs` and `hs_js` are both empty in `data/index.json`. Every behaviour here is CSS: `:focus`, `:disabled`, `:placeholder-shown`, `:autofill`, and Tailwind's `peer-*` sibling variants.

## Gotchas

- **Duplicate `id="input-base"` across eight examples.** `basic`, `placeholder`, `label`, `hidden-label`, `pilled-input`, `readonly`, `helper-text`, `corner-hint` all ship the same id; the four that have a label (`label`, `hidden-label`, `helper-text`, `corner-hint`) point `for="input-base"` at it, and `helper-text` also reuses `aria-describedby="input-base-helper-text"`. Paste two of them onto one page and every label and description binds to the first input. Rename on every copy.
- **The stone variant inverts under moon.** `bg-surface` → `focus:bg-layer` means the field gets *lighter* on focus in light mode (`gray-100` → `white`) and *darker* in dark mode (`neutral-700` → `neutral-800`). Check the focused state in both themes before shipping.
- **Floating label is placeholder-driven.** The mechanism is `peer-not-placeholder-shown:` / `peer-focus:`, so a non-empty `placeholder` attribute plus `placeholder:text-transparent` on the input are load-bearing. Remove either and the label sits permanently on top of the value. The `<label>` must stay **after** the `peer` input in the DOM — `peer-*` only matches later siblings.
- **The floating label needs both a padding shift and a transform.** Input side: `focus:pt-6 focus:pb-2 not-placeholder-shown:pt-6 not-placeholder-shown:pb-2 autofill:pt-6 autofill:pb-2`. Label side: `peer-focus:scale-90 peer-focus:translate-x-0.5 peer-focus:-translate-y-1.5` and the `peer-not-placeholder-shown:` triplet. Drop the `autofill:` pair and Chrome autofill overlaps the label.
- **Icon overlays need `peer` on the input.** The wrapper is `absolute inset-y-0 inset-s-0 flex items-center pointer-events-none ps-4 peer-disabled:opacity-50 peer-disabled:pointer-events-none`; without `peer` on the input the icon stays at full opacity on a disabled field.
- **Icon padding is manual.** `ps-11` for a `size-4` icon at `ps-4`, `ps-8` in the underline variant (icon at `ps-2`), `pe-3` for the validation icon. Change the ornament and you must retune the padding by hand — nothing links them.
- **Logical properties throughout.** `inset-s-0` / `inset-e-0` / `ps-*` / `pe-*`, not `left`/`right`/`pl`/`pr`. Keep them logical or you break RTL.
- **Validation colours are not themed.** `border-red-500`, `text-red-500`, `border-teal-500`, `text-teal-500` are literal palette values, identical in light and dark, and the validation examples also **drop** `disabled:opacity-50 disabled:pointer-events-none` from the class list.
- **`readonly` is visually indistinguishable from editable.** `readonly.html` adds no affordance whatsoever.
- **Sizes change padding only.** All three keep `sm:text-sm`; the large size uses `p-3.5 sm:p-5` (uniform padding) while the others split `py-*`/`px-*`.
- **The underline rule is one 2px edge sitting on the plugin's four.** `@tailwindcss/forms` gives the field a 1px border on all four sides. `border-b-2` raises only the bottom to 2px, `border-b-line-2` colours it, and `border-t-transparent border-x-transparent` hide the other three — those still occupy 1px of box each, which is why the field keeps its height. Add a plain `border` utility later and it sets `border-bottom-width` too; which of the two wins is decided by generated-CSS order, so the 2px rule is not safe next to it.

## Copy-paste base

`examples/basic-forms/input/label.html`

```html
<div class="max-w-sm w-full space-y-3">
  <label for="input-base" class="block mb-2 text-sm font-medium text-foreground">Name</label>
  <input id="input-base" type="text" class="py-2.5 sm:py-3 px-4 rounded-lg block w-full bg-layer border-layer-line sm:text-sm text-foreground placeholder:text-muted-foreground-1 focus:border-primary-focus focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none" placeholder="James"  >
</div>
```
