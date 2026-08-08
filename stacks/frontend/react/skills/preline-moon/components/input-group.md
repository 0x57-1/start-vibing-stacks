---
component: input-group
label: Input Group
category: basic-forms
docs: https://preline.co/docs/components/input-group.html
examples: 14
js: none
tokens: [layer, layer-line, muted, muted-foreground-1, muted-foreground, foreground, primary, primary-line, primary-foreground, primary-hover, primary-focus]
---

# Input Group

An `input` joined to add-ons — text prefixes, icons, selects, checkboxes or buttons — either as flex siblings that occupy width, or as absolutely positioned ornaments floating over the field.

## When to use

- The value needs a fixed prefix/suffix (`http://`, `$`, `USD`), a unit selector, or an inline submit/search button.
- A purely decorative icon inside a single field is also here (`loading-icon`, `trailing-icon`) — that is the overlay family, not a real add-on.
- If nothing is attached to the field, use `input` instead; this component adds radius/border/z-index bookkeeping you do not want for free.
- A searchable list of options is `combobox`; a numeric stepper is `input-number`. Do not fake either with a button add-on.

## Anatomy

Two structurally different families. Pick one; they do not mix on the same edge.

**A. Real add-on — flex siblings, add-on occupies width**

```html
<!-- REDUCED SKELETON. Classes verbatim from examples/basic-forms/input-group/add-on.html -->
<div class="flex rounded-lg">
  <!-- add-on: bg-muted + border-layer-line, border-e-0 collapses the shared edge, rounded-s-md -->
  <div class="px-4 inline-flex items-center min-w-fit rounded-s-md border border-e-0 border-layer-line bg-muted">
    <span class="text-sm text-muted-foreground-1">http://</span>
  </div>
  <!-- input: only the outer corner is rounded; focus:z-10 lifts the ring over the add-on border -->
  <input type="text" class="py-2.5 sm:py-3 px-4 pe-11 block w-full bg-layer border-layer-line rounded-e-lg sm:text-sm text-foreground placeholder:text-muted-foreground-1 focus:z-10 focus:border-primary-focus focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none">
</div>
```

**B. Inline ornament — absolute overlay, input pays with padding**

```html
<!-- REDUCED SKELETON. Classes verbatim from examples/basic-forms/input-group/inline-add-on.html -->
<div class="relative">
  <!-- ps-16 is hand-tuned to clear the "http://" below. Nothing links the two. -->
  <input type="text" class="py-2.5 sm:py-3 px-4 ps-16 block w-full bg-layer border-layer-line rounded-lg sm:text-sm text-foreground placeholder:text-muted-foreground-1 focus:z-10 focus:border-primary-focus focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none" placeholder="www.example.com">
  <div class="absolute inset-y-0 inset-s-0 flex items-center pointer-events-none z-20 ps-4">
    <span class="text-sm text-muted-foreground-1">http://</span>
  </div>
</div>
```

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| `sizes` | Input group sizes | `examples/basic-forms/input-group/sizes.html` | Family A at 3 paddings (`py-1.5 sm:py-2 px-3` / `py-2.5 sm:py-3 px-4` / `py-3 px-4 sm:p-5`); the add-on `<span>` keeps `px-4` and stretches. |
| `multiple-inputs` | Grouped inputs | `examples/basic-forms/input-group/multiple-inputs.html` | `sm:flex` — stacks on mobile with `-mt-px first:rounded-t-lg last:rounded-b-lg`, joins horizontally at `sm:` with `sm:-ms-px sm:first:rounded-s-lg …`. |
| `loading-icon` | Leading icon | `examples/basic-forms/input-group/loading-icon.html` | Family B; `ps-11` + `absolute inset-s-0 … z-20 ps-4`, icon `text-muted-foreground`. |
| `trailing-icon` | Trailing icon | `examples/basic-forms/input-group/trailing-icon.html` | Mirror of the above: `pe-11` + `inset-e-0 … pe-4`. |
| `leading-and-trailing-icon` | Leading and trailing icons | `examples/basic-forms/input-group/leading-and-trailing-icon.html` | Both overlays; `ps-9 pe-16` for a `$` … `USD` pair, both `text-muted-foreground-1`. |
| `add-on` | Text add-on | `examples/basic-forms/input-group/add-on.html` | Family A minimum: one leading `bg-muted` block, `border-e-0`, input `rounded-e-lg`. |
| `inline-add-on` | Inline text add-on | `examples/basic-forms/input-group/inline-add-on.html` | Family B minimum: same `http://` prefix as an overlay instead, `ps-16`. |
| `multiple-add-on` | Multiple add-ons | `examples/basic-forms/input-group/multiple-add-on.html` | Two stacked add-ons per side; only the outermost gets `rounded-s-md`/`rounded-e-md`, input gets `rounded-lg rounded-s-none` (or `rounded-e-none`). |
| `trailing-button-add-ons` | Trailing button add-ons | `examples/basic-forms/input-group/trailing-button-add-ons.html` | 5 rows. Input takes `border-e-transparent rounded-s-lg`; button is `bg-primary border-primary-line rounded-e-md`, icon-only variant is `size-11.5`. |
| `leading-button-add-ons` | Leading button add-ons | `examples/basic-forms/input-group/leading-button-add-ons.html` | Mirror: `border-s-transparent rounded-e-lg` on the input, `rounded-s-md` on the button; the multi-button row uses `-me-px` and `z-1`. |
| `inline-leading-select` | Leading inline select | `examples/basic-forms/input-group/inline-leading-select.html` | Overlay wrapper **without** `pointer-events-none`/`z-20` so the `<select>` stays clickable; `ps-20` + `ps-px`; select is `bg-transparent border-transparent`. |
| `inline-leading-add-on-and-trailing-select` | Leading add-on with trailing select | `examples/basic-forms/input-group/inline-leading-add-on-and-trailing-select.html` | Non-interactive `$` overlay (`pointer-events-none z-20 ps-4`) + interactive trailing select (`pe-px`, no pointer-events-none); `ps-9 pe-20`. |
| `checkbox-and-radios` | Checkbox and radio add-ons | `examples/basic-forms/input-group/checkbox-and-radios.html` | Family A with a `checkbox` / `radio` inside the `bg-muted` add-on; radio differs only by `rounded-full` vs `rounded-sm`; label is `sr-only`. |
| `search-box-with-loading` | Search input with loading | `examples/basic-forms/input-group/search-box-with-loading.html` | 5 rows combining families: `animate-spin … border-3 border-current border-t-transparent rounded-[999px]`, `text-primary` standalone vs `text-primary-foreground` inside a primary button. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` | Input fill (`bg-layer`) and the secondary middle button in multi-button rows | `white` | `neutral-800` |
| `layer-line` | Shared hairline on input **and** add-on (`border-layer-line`) | `gray-200` | `neutral-700` |
| `muted` | Add-on block fill (`bg-muted`) — the visual cue that a segment is not editable | `gray-50` | `neutral-800` |
| `muted-foreground-1` | Add-on text, placeholder, `$`/`USD` units, select colour | `gray-600` | `neutral-400` |
| `muted-foreground` | Icon glyphs only (`text-muted-foreground`) — the overlay icons in `loading-icon` / `trailing-icon` / both button-add-on files / `search-box-with-loading`, plus the direction arrows inside the `multiple-inputs` add-on. One step dimmer than add-on text | `gray-500` | `neutral-500` |
| `foreground` | Field label and the add-on's own `text-foreground` base | `gray-800` | `neutral-200` |
| `primary` | Attached action button fill (`bg-primary`) | `gray-800` | `white` |
| `primary-foreground` | Button label/icon and the in-button spinner | `white` | `neutral-800` |
| `primary-hover` | Button hover fill | `gray-900` | `neutral-300` |
| `primary-focus` | Input focus border + ring, and button `focus:bg-primary-focus` | `gray-900` | `neutral-300` |
| `primary-line` | Button border (`border border-primary-line`) — **transparent in both modes**, present for box-size parity | `transparent` | `transparent` |
| `primary-checked` | Checked fill of the checkbox/radio add-on | `gray-800` | `white` |
| `line-3` | Checkbox/radio border in the add-on (`border-line-3`) | `gray-300` | `neutral-600` |
| `layer-foreground` / `layer-hover` / `layer-focus` | Secondary middle button in the multi-button rows | `gray-800` / `gray-50` / `gray-50` | `white` / `neutral-700` / `neutral-700` |

## Behaviour (JS)

Static markup only -- no Preline JS.

`hs_attrs` and `hs_js` are both empty in `data/index.json`. The spinner in `search-box-with-loading.html` is CSS `animate-spin` on static markup; nothing toggles it. `role="status"` + `aria-label="loading"` + an `sr-only` "Loading..." are the announced state.

## Gotchas

- **`focus:z-10` on the input is load-bearing.** Segments overlap by a hairline; without the lift, the focus ring is clipped by the neighbouring add-on's border. Note the two multi-button rows instead give the input a static `z-1` and drop `focus:z-10` — copying one row's z-index scheme into another row breaks the ring.
- **Overlay `z-index` is not uniform — check the row you copy.** Most overlay wrappers are `z-20`, above the focused input's `focus:z-10`, so the ornament survives the ring: `inline-add-on`, `loading-icon`, `trailing-icon`, `leading-and-trailing-icon`, `trailing-button-add-ons` (line 29), `leading-button-add-ons` (line 30), `inline-leading-add-on-and-trailing-select` (line 5). `search-box-with-loading.html` breaks it twice — line 6 has no `z-*` at all, line 56 uses `z-10`, tying the focused input so generated-CSS order decides. `inline-leading-select.html` omits it deliberately, see the next point.
- **`pointer-events-none` is the switch between decorative and interactive.** Icon and unit overlays have it; the `<select>` overlays in `inline-leading-select.html` and `inline-leading-add-on-and-trailing-select.html` deliberately omit it *and* omit `z-20`. Add `pointer-events-none` to a select overlay and the control becomes unclickable with no visible error.
- **Padding compensation is hand-tuned and unlinked.** Observed values: `ps-9` for `$`, `ps-11` for a `size-4` icon at `ps-4`, `ps-16` for `http://`, `ps-20` for a country `<select>`, `pe-16` for `USD`, `pe-20` for a currency `<select>`. Change the ornament's content or padding and you must retune by hand.
- **Radii do not match across segments.** Add-ons and buttons use `rounded-s-md` / `rounded-e-md`; inputs use `rounded-s-lg` / `rounded-e-lg`. That is upstream's markup, not a transcription error — the outer corners of a group are subtly mismatched. Normalise deliberately if it matters.
- **Two ways to collapse the shared edge, and they are not interchangeable.** Text add-ons use `border-e-0` / `border-s-0` on the *add-on*. Button add-ons instead use `border-e-transparent` / `border-s-transparent` on the *input*, keeping its box width so the button lands flush.
- **`border border-primary-line` on the button is not decoration.** `primary-line` is `transparent` in both light and dark; the border exists purely to add the 1px the input's own border also spends. Delete it and the button is 2px shorter than the field.
- **`size-11.5` icon-only buttons are pinned to the default input height** (`py-2.5 sm:py-3` + 2 borders). Change the input size and this hardcoded square no longer matches.
- **Conflicting text-colour utilities in three places.** `checkbox-and-radios.html` lines 4 and 16 and `search-box-with-loading.html` line 29 carry `text-sm text-foreground text-muted-foreground-1` on one element. Both colour utilities are generated, same specificity, so CSS source order decides — not attribute order. Remove `text-foreground` if you want the intent to be readable.
- **Stray no-op class.** `multiple-inputs.html` line 20 contains a bare `sm` inside the class list (`border-layer-line sm -mt-px`). It compiles to nothing; do not go hunting for it.
- **`multiple-inputs` is the only responsive-shape variant.** It is `sm:flex` (column below `sm`), so its radius rules are duplicated for both axes. The other 13 examples are `flex`/`relative` at all widths.
- **Labels: `sr-only` is used liberally** (`multiple-add-on`, both button-add-on files, both select variants). If you keep the group but drop the visible label, keep the `sr-only` one — the field otherwise has no accessible name.

## Copy-paste base

`examples/basic-forms/input-group/add-on.html`

```html
<div class="max-w-sm w-full">
  <label for="hs-input-with-add-on-url" class="block mb-2 text-sm text-foreground font-medium">Website URL</label>
  <div class="flex rounded-lg">
    <div class="px-4 inline-flex items-center min-w-fit rounded-s-md border border-e-0 border-layer-line bg-muted">
      <span class="text-sm text-muted-foreground-1">http://</span>
    </div>
    <input type="text" name="hs-input-with-add-on-url" id="hs-input-with-add-on-url" class="py-2.5 sm:py-3 px-4 pe-11 block w-full bg-layer border-layer-line rounded-e-lg sm:text-sm text-foreground placeholder:text-muted-foreground-1 focus:z-10 focus:border-primary-focus focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none" placeholder="www.example.com">
  </div>
</div>
```
