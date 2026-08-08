---
component: checkbox
label: Checkbox
category: basic-forms
docs: https://preline.co/docs/components/checkbox.html
examples: 11
js: none
tokens: [primary-checked, line-3, primary, muted-foreground-1, muted-foreground-2, layer, layer-line, layer-foreground, primary-focus, foreground]
---

# Checkbox

Native `<input type="checkbox">` restyled by `@tailwindcss/forms` plus Preline's token classes, in row, description, card and list-group layouts.

## When to use

- Independent boolean choices, zero or more selected. Mutually exclusive choices are `radio` (identical markup except `rounded-full` instead of `rounded-sm`).
- An on/off setting that applies immediately, with no Save step, reads better as `switch`.
- A parent "select all" needs the `indeterminate` state — settable from JS only, see Behaviour.
- Card and list-group variants exist here; do not rebuild them from `card` + a bare checkbox, the border-collapse rules differ.

## Anatomy

```html
<!-- REDUCED SKELETON. Every class is verbatim from examples/basic-forms/checkbox/default.html -->
<div class="flex items-center">
  <!-- box    : bg-transparent + border-line-3 + rounded-sm, size-4, shrink-0
       fill   : checked:bg-primary-checked checked:border-primary-checked
       glyph  : text-primary  (the forms plugin paints the mark with currentColor)
       focus  : focus:ring-0 focus:ring-offset-0  -- the plugin ring is deliberately OFF -->
  <input type="checkbox" id="ID" class="shrink-0 size-4 bg-transparent border-line-3 rounded-sm shadow-2xs text-primary focus:ring-0 focus:ring-offset-0 checked:bg-primary-checked checked:border-primary-checked disabled:opacity-50 disabled:pointer-events-none">
  <label for="ID" class="text-sm ms-3 text-muted-foreground-1">Default checkbox</label>
</div>
```

That exact class string is byte-identical in 8 of the 11 examples (25 inputs). Three deviate: `indeterminate.html` drops `bg-transparent`, `on-right.html` prepends `shrink-0 ms-auto mt-0.5`, `validation-states.html` swaps the colours. Treat the string as one unit and vary the wrapper.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| `default` | Default checkbox | `examples/basic-forms/checkbox/default.html` | Baseline `flex items-center` row, unchecked + `checked`. |
| `indeterminate` | Indeterminate | `examples/basic-forms/checkbox/indeterminate.html` (+ `.js`) | Drops `bg-transparent`; a plain inline script sets `el.indeterminate = true` on two inputs. |
| `disabled` | Disabled | `examples/basic-forms/checkbox/disabled.html` | Wrapper is `flex opacity-40` (no `items-center`) plus `disabled` on the input. |
| `checkbox-group` | Checkbox group options | `examples/basic-forms/checkbox/checkbox-group.html` | Three `flex gap-x-6` rows: unchecked, all-checked, all-disabled (`opacity-40` per item). |
| `list-with-description` | Checkboxes with descriptions | `examples/basic-forms/checkbox/list-with-description.html` | `relative flex items-start` + `flex items-center h-5 mt-1` box holder; label holds a `text-foreground font-semibold` title over a `text-muted-foreground-2` description wired by `aria-describedby`. |
| `checkbox-within-form-input` | Checkbox cards | `examples/basic-forms/checkbox/checkbox-within-form-input.html` | `grid sm:grid-cols-2 gap-2`; the whole `<label>` becomes the card: `p-3 bg-layer border border-layer-line rounded-lg`. |
| `checkbox-within-form-input-vertically-grouped` | Vertical checkbox cards | `examples/basic-forms/checkbox/checkbox-within-form-input-vertically-grouped.html` | Same card, stacked via `max-w-sm w-full space-y-3` + `max-w-xs` per card. |
| `on-right` | Right-aligned checkbox | `examples/basic-forms/checkbox/on-right.html` | Card with label text first and the input pushed over by `ms-auto mt-0.5`. |
| `with-list-group` | Checkbox list group | `examples/basic-forms/checkbox/with-list-group.html` | `<ul>` of `bg-layer border border-layer-line text-layer-foreground -mt-px first:rounded-t-lg first:mt-0 last:rounded-b-lg`. |
| `with-horizontal-list-group` | Horizontal checkbox list group | `examples/basic-forms/checkbox/with-horizontal-list-group.html` | Same list, `flex-col sm:flex-row` with the `sm:-ms-px sm:first:rounded-se-none sm:first:rounded-es-lg sm:last:rounded-es-none sm:last:rounded-se-lg` radius swap. |
| `validation-states` | Validation states | `examples/basic-forms/checkbox/validation-states.html` | `text-red-600 checked:bg-red-600 checked:border-red-600` / teal equivalents, label `text-red-500` / `text-teal-500`. Raw palette, **not** tokens. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `line-3` | Unchecked box border (`border-line-3`) — the only thing visible at rest, since the fill is `bg-transparent` | `gray-300` | `neutral-600` |
| `primary-checked` | Checked box fill **and** border (`checked:bg-primary-checked checked:border-primary-checked`) | `gray-800` | `white` |
| `primary` | `text-primary` = `currentColor`, which `@tailwindcss/forms` uses as the checked background before Preline overrides it | `gray-800` | `white` |
| `muted-foreground-1` | Plain row label text | `gray-600` | `neutral-400` |
| `muted-foreground-2` | Label text in description lists and list groups — one step brighter | `gray-700` | `neutral-300` |
| `foreground` | Bold title in `list-with-description` | `gray-800` | `neutral-200` |
| `layer` | Card / list-item fill (`bg-layer`) | `white` | `neutral-800` |
| `layer-line` | Card / list-item hairline (`border-layer-line`) | `gray-200` | `neutral-700` |
| `layer-foreground` | List-group item text colour (`text-layer-foreground`) | `gray-800` | `white` |
| `primary-focus` | Declared on the card `<label>` as `focus:border-primary-focus focus:ring-primary-focus` — never fires, see Gotchas | `gray-900` | `neutral-300` |

## Behaviour (JS)

Static markup only -- no Preline JS.

`hs_attrs` and `hs_js` are empty in `data/index.json`; there is no `HSCheckbox` module in `assets/js/preline/`. The one script that ships is not a Preline plugin:

`examples/basic-forms/checkbox/indeterminate.js` — the whole file, `<script>` tag included:

```html
<script>
  document.getElementById('hs-indeterminate-checkbox').indeterminate = true;
  document.getElementById('hs-indeterminate-disabled-checkbox').indeterminate = true;
</script>
```

`indeterminate` is an IDL property with no HTML attribute — it cannot be expressed in markup, and it is cleared by the browser as soon as the user clicks the box. A "select all" header must re-derive and re-apply it after every change.

## Gotchas

- **Dark mode would render a white mark on a white box without a fork-level CSS rule.** `--primary-checked` is `white` in moon dark, so the checked box is white; `@tailwindcss/forms` draws the tick as a `background-image` data-URI with `fill='white'` baked in, and a data-URI cannot read a CSS variable. `assets/css/project-moon.css:297-307` re-declares the image with `fill='%23262626'` for `[data-theme="theme-moon"].dark` — three rules, covering `input[type=checkbox]:checked`, `input[type=radio]:checked` and `input[type=checkbox]:indeterminate`. If you port these examples to a project without that block, dark-mode checkboxes look empty when checked. There is intentionally no light-mode counterpart: there the box is dark and the plugin's white mark is already right.
- **There is no focus indicator.** `focus:ring-0 focus:ring-offset-0` kills the forms-plugin ring on every example and nothing replaces it — keyboard users get only the UA outline, if any. Add one deliberately.
- **Card variants put focus styles on a non-focusable element.** In `checkbox-within-form-input.html`, `checkbox-within-form-input-vertically-grouped.html` and `on-right.html`, `focus:border-primary-focus focus:ring-primary-focus` sit on the `<label>`. Labels never receive focus, so those classes are dead; combined with the point above, a checkbox card has no focus affordance at all. Use `focus-within:` on the label if you want one.
- **Disabled dims twice.** The wrapper carries `opacity-40` and the input carries `disabled:opacity-50` — the box lands near 0.2 effective opacity. Drop the wrapper class if that is too faint.
- **`bg-transparent` is missing from `indeterminate.html`.** Every other example carries `shrink-0 size-4 bg-transparent border-line-3 …`; `indeterminate.html` omits `bg-transparent`, so the unchecked box falls back to the plugin's own background. Add it when copying.
- **`on-right.html` repeats `shrink-0` twice** in one class attribute (lines 4 and 9: `shrink-0 ms-auto mt-0.5 shrink-0 size-4 …`). Harmless, but do not read it as two different utilities.
- **Label token is not one value.** `text-muted-foreground-1` (gray-600 / neutral-400) on plain rows and cards, `text-muted-foreground-2` (gray-700 / neutral-300) in `list-with-description` and both list groups. Mixing them in one screen produces two different label greys.
- **Descriptions must be wired, not just placed.** `list-with-description.html` pairs `aria-describedby="…-description"` on the input with a matching `id` on the description `<span>`; without it screen readers announce only the title.
- **List groups collapse borders with `-mt-px`.** `first:rounded-t-lg first:mt-0 last:rounded-b-lg` is what keeps the stack looking like one box; the horizontal version additionally needs the full `sm:first:rounded-se-none sm:first:rounded-es-lg sm:last:rounded-es-none sm:last:rounded-se-lg` set, not just `sm:flex-row`.
- **Validation colours are not themed.** `checked:bg-red-600`, `text-red-500`, `checked:bg-teal-600`, `text-teal-500` are literal palette values, identical in both modes. Also note the upstream example marks the *error* checkbox `disabled` — almost certainly not what you want.
- **`radio` is this markup with two edits.** `rounded-sm` → `rounded-full` and `type="radio"` (see `examples/basic-forms/input-group/checkbox-and-radios.html:18`). Everything else, including the dark-mode data-URI fix, is shared.

## Copy-paste base

`examples/basic-forms/checkbox/default.html`

```html
<div class="max-w-sm w-full space-y-3">
  <div class="flex items-center">
    <input type="checkbox" class="shrink-0 size-4 bg-transparent border-line-3 rounded-sm shadow-2xs text-primary focus:ring-0 focus:ring-offset-0 checked:bg-primary-checked checked:border-primary-checked disabled:opacity-50 disabled:pointer-events-none" id="hs-default-checkbox">
    <label for="hs-default-checkbox" class="text-sm ms-3 text-muted-foreground-1">Default checkbox</label>
  </div>

  <div class="flex items-center">
    <input type="checkbox" class="shrink-0 size-4 bg-transparent border-line-3 rounded-sm shadow-2xs text-primary focus:ring-0 focus:ring-offset-0 checked:bg-primary-checked checked:border-primary-checked disabled:opacity-50 disabled:pointer-events-none" id="hs-checked-checkbox" checked>
    <label for="hs-checked-checkbox" class="text-sm ms-3 text-muted-foreground-1">Checked checkbox</label>
  </div>
</div>
```
