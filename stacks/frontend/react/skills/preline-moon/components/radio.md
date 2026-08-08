---
component: radio
label: Radio
category: basic-forms
docs: https://preline.co/docs/components/radio.html
examples: 11
js: none
tokens: [primary-checked, line-3, primary, muted-foreground-1, layer, layer-line, primary-focus, muted-foreground-2, layer-foreground, foreground]
---

# Radio

A native `<input type="radio">` styled by `@tailwindcss/forms` plus moon token utilities; one choice out of a mutually exclusive set sharing a `name`.

## When to use
- Exactly one option must be picked from 2-7 visible, mutually exclusive choices.
- Prefer **checkbox** (`examples/basic-forms/checkbox/`) for independent on/off options — a radio group cannot be unset once any member is checked.
- Prefer **select** (`components/select.md`) past ~7 options, or **advanced-select** (`data-hs-select`, 41 examples) when the list needs search/multi/custom rows.
- Prefer **switch** (`components/switch.md`) for a single immediate-effect toggle; never emulate a switch with two radios.

## Anatomy

Reduced skeleton — every class below appears in `examples/basic-forms/radio/default.html`.

```html
<div class="flex items-center">                     <!-- row; use items-start when there is a description -->
  <input type="radio"
         name="GROUP"                               <!-- shared name = the group; REQUIRED -->
         id="OPT"
         class="shrink-0 size-4 bg-transparent
                border-line-3 rounded-full          <!-- resting ring -->
                text-primary                        <!-- accent for the forms-plugin dot -->
                checked:bg-primary-checked
                checked:border-primary-checked      <!-- checked fill + ring -->
                focus:ring-0 focus:ring-offset-0
                disabled:opacity-50 disabled:pointer-events-none">
  <label for="OPT" class="text-sm ms-3 text-muted-foreground-1">Label</label>
</div>
```

The full `class` attribute (the skeleton above plus `shadow-2xs`) is byte-identical in **8 of the 11** examples — grep it, do not retype it. The other three: `on-right.html` prefixes it with `shrink-0 ms-auto mt-0.5`, `disabled.html` swaps the `disabled:*` pair for bogus `radio:*` variants, `validation-states.html` swaps the tokens for `red-600`/`teal-600` literals.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Default | Default radio | `examples/basic-forms/radio/default.html` | Baseline row: `flex items-center` + `ms-3` label; second input carries `checked` |
| Disabled | Disabled | `examples/basic-forms/radio/disabled.html` | Wrapper gets `opacity-40`, input gets `disabled`. **Broken example — see Gotchas** |
| Inline group | Inline radio group | `examples/basic-forms/radio/inline-radio-group.html` | `flex gap-x-6` horizontal row; label is `text-muted-foreground-2` |
| Vertical group | Vertical radio group | `examples/basic-forms/radio/vertical-radio-group.html` | `flex flex-col gap-y-3`; label back to `text-muted-foreground-1` |
| With description | Radios with descriptions | `examples/basic-forms/radio/list-with-description.html` | `items-start` + `h-5 mt-1` optical shim; two-line label (`text-foreground` title + `text-muted-foreground-2` body) tied by `aria-describedby` |
| Radio cards | Radio cards | `examples/basic-forms/radio/radio-within-form-input.html` | Whole `<label>` becomes the hit target: `p-3 bg-layer border border-layer-line rounded-lg` in `grid sm:grid-cols-2` |
| Vertical radio cards | Vertical radio cards | `examples/basic-forms/radio/radio-components-within-form-input-vertically-grouped.html` | Same card, stacked via `space-y-3` + `max-w-xs` instead of a grid |
| Right-aligned | Right-aligned radio | `examples/basic-forms/radio/on-right.html` | Same card and `grid sm:grid-cols-2` as **Radio cards**, but the `<span>` comes first and the input last, pushed to the trailing edge by `ms-auto mt-0.5` |
| List group | Radio list group | `examples/basic-forms/radio/with-list-group.html` | `<ul>`/`<li>` with `-mt-px first:rounded-t-lg last:rounded-b-lg` collapsed borders, `text-layer-foreground` |
| Horizontal list group | Horizontal radio list group | `examples/basic-forms/radio/with-horizontal-list-group.html` | Same list, `flex-col sm:flex-row` + `sm:-ms-px sm:first:rounded-es-lg sm:last:rounded-se-lg` corner surgery |
| Validation | Validation states | `examples/basic-forms/radio/validation-states.html` | Literal `red-600`/`teal-600` swapped in for the primary tokens; `space-x-3` label wrapper |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `line-3` (`border-line-3`) | Resting ring of the unchecked circle | `gray-300` | `neutral-600` |
| `primary` (`text-primary`) | Accent colour the forms plugin uses for the dot | `gray-800` | `white` |
| `primary-checked` (`checked:bg-*`, `checked:border-*`) | Checked fill + ring | `gray-800` | `white` |
| `muted-foreground-1` | Default label text | `gray-600` | `neutral-400` |
| `muted-foreground-2` | Label text inside groups and list groups | `gray-700` | `neutral-300` |
| `foreground` | Bold title line in the description variant | `gray-800` | `neutral-200` |
| `layer` (`bg-layer`) | Card / list-item surface | `white` | `neutral-800` |
| `layer-line` (`border-layer-line`) | Card / list-item border | `gray-200` | `neutral-700` |
| `layer-foreground` | List-group item text | `gray-800` | `white` |
| `primary-focus` (`focus:border-*`, `focus:ring-*`) | Card focus outline | `gray-900` | `neutral-300` |

## Behaviour (JS)

Static markup only -- no Preline JS.

## Gotchas
- **`disabled.html` is wrong in three ways** and must not be copy-pasted: it uses `type="checkbox"` (not radio), invents the non-existent variants `radio:opacity-50 radio:pointer-events-none` (Tailwind emits nothing — the real prefix is `disabled:`), and fakes the dim with `opacity-40` on the wrapper. Take `default.html` and add the `disabled` attribute instead.
- **The checked dot is a background-image, not a token.** `@tailwindcss/forms` bakes `fill="white"` into a data-uri, and a data-uri cannot read a CSS variable. Under moon dark, `primary-checked` is `white`, so a white dot on a white fill would vanish. `assets/css/project-moon.css` re-declares it: `[data-theme="theme-moon"].dark input[type="radio"]:checked { background-image: ...fill='%23262626'... }`. **That rule lives only in the project fork.** Ship moon without it and every checked radio goes blank in dark mode.
- **`focus:ring-0 focus:ring-offset-0` is in the canonical string on purpose** — it suppresses the forms plugin's default blue ring. Drop it and you get a non-moon accent colour on focus.
- **Duplicate IDs across examples.** `inline-radio-group.html` and `vertical-radio-group.html` both use `hs-radio-group-1/2/3` (only their `name` differs: `hs-radio-group` vs `hs-radio-vertical-group`). That is the *only* id collision in the set — every other file's ids and `name` are unique. Paste those two on one page and both labels bind to the first input.
- `radio-within-form-input.html` puts `name="hs-radio-in-form"` **on the `<label>`** — invalid HTML, harmless, delete it.
- `on-right.html` has `shrink-0` twice in the class attribute.
- **The card variants put `focus:border-primary-focus` on the `<label>`, which never receives focus** — the input inside does. Visible focus on a radio card requires `focus-within:` (not present in any example) or the input's own ring.
- Descriptions need `aria-describedby` on the **input**, pointing at the body `<span>` id — see `list-with-description.html`. Wrapping text in the `<label>` alone makes screen readers read title+body as one run-on name.

## Copy-paste base

`examples/basic-forms/radio/default.html`

```html
<div class="max-w-sm w-full space-y-3">
  <div class="flex items-center">
    <input type="radio" name="hs-default-radio" class="shrink-0 size-4 bg-transparent border-line-3 rounded-full shadow-2xs text-primary focus:ring-0 focus:ring-offset-0 checked:bg-primary-checked checked:border-primary-checked disabled:opacity-50 disabled:pointer-events-none" id="hs-default-radio">
    <label for="hs-default-radio" class="text-sm ms-3 text-muted-foreground-1">Default radio</label>
  </div>

  <div class="flex items-center">
    <input type="radio" name="hs-default-radio" class="shrink-0 size-4 bg-transparent border-line-3 rounded-full shadow-2xs text-primary focus:ring-0 focus:ring-offset-0 checked:bg-primary-checked checked:border-primary-checked disabled:opacity-50 disabled:pointer-events-none" id="hs-checked-radio" checked>
    <label for="hs-checked-radio" class="text-sm ms-3 text-muted-foreground-1">Checked radio</label>
  </div>
</div>
```
