---
component: button-group
label: Button Group
category: base-components
docs: https://preline.co/docs/components/button-group.html
examples: 7
js: none
tokens: [layer, layer-line, layer-foreground, layer-hover, layer-focus, foreground, muted-hover, muted-focus]
---

# Button Group

A row (or column) of buttons whose adjacent borders are collapsed into one hairline, so a set of sibling actions reads as a single segmented control.

## When to use

- Mutually related actions or a segmented view switch (Years / Month / Date).
- A WYSIWYG-style icon toolbar — use the `toolbar` variant, which is a *different* mechanism (gap, no border collapse).
- **Do not** use for a single-choice bound to form state; there is no `aria-pressed`, no `role="group"` and no selected style in any example. Wire those yourself, or use `tabs`.
- **Do not** use for a menu of unrelated actions — use `dropdown`.

## Anatomy

Reduced skeleton. Every class appears in `examples/base-components/button-group/*.html`.

```html
<div class="inline-flex rounded-lg shadow-2xs">
  <!--      ^ shrink-wraps the row   ^ outer radius   ^ single shadow for the whole group -->
  <button type="button" class="py-3 px-4 -ms-px first:rounded-s-lg first:ms-0 last:rounded-e-lg inline-flex items-center gap-x-2 text-sm font-medium focus:z-10 bg-layer border border-layer-line text-layer-foreground shadow-2xs hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus disabled:opacity-50 disabled:pointer-events-none">
    <!--                          ^ pulls each button 1px toward the inline start so the two 1px borders overlap into one
                                         ^ only the ends get a radius
                                                                            ^ raises the focused button above its neighbours' borders -->
    Label
  </button>
  <!-- …repeat, identical class string on every child… -->
</div>
```

The whole mechanism is three utilities: a negative margin (`-ms-px` horizontal, `-mt-px` vertical), `first:`/`last:` radius, and `focus:z-10`. Every button carries the *same* class string — there is no `.first`/`.last` markup difference.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Default button group | Default button group | `examples/base-components/button-group/example.html` | The canonical horizontal group; `py-3 px-4`. Class string is byte-identical to `medium.html` |
| Small | Small | `examples/base-components/button-group/small.html` | Padding only: `py-2 px-3` |
| Medium | Medium | `examples/base-components/button-group/medium.html` | Padding only: `py-3 px-4` (the default) |
| Large | Large | `examples/base-components/button-group/large.html` | Padding only: `py-3 px-4 sm:p-5` — large is responsive, small and medium are not |
| Responsive stack | Responsive stack | `examples/base-components/button-group/button-group-break.html` | Wrapper `flex flex-col sm:inline-flex sm:flex-row rounded-lg shadow-2xs`; buttons carry BOTH offsets unconditionally (`-mt-px -ms-px`) and cancel each at `sm:` separately — `sm:mt-0` (vertical, all children) and `sm:first:ms-0` (horizontal, first child only). Radius is column-shaped by default (`first:rounded-t-md last:rounded-b-md`) and re-cut into a row at `sm:` (`sm:first:rounded-s-md sm:last:rounded-e-md` + the corner kills `sm:first:rounded-se-none sm:last:rounded-es-none`) |
| Vertical stack | Vertical stack | `examples/base-components/button-group/vertical.html` | Wrapper `max-w-xs flex flex-col rounded-lg shadow-2xs`; offset flips to `-mt-px first:mt-0`, radius to `first:rounded-t-md last:rounded-b-md` |
| Button toolbar | Button toolbar | `examples/base-components/button-group/toolbar.html` | **Not a collapsed group.** Wrapper `flex align-middle gap-x-0.5 p-2`; 9 separate `size-8 … rounded-full border border-transparent` icon buttons using `text-foreground hover:bg-muted-hover focus:bg-muted-focus`. Carries Quill classes (`ql-bold`, `ql-italic`, `ql-list` with `value="ordered"`/`"bullet"`, …) |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` | resting fill of every segment (6 of 7 examples) | `white` | `neutral-800` |
| `layer-line` | the collapsed 1px divider / outer border | `gray-200` | `neutral-700` |
| `layer-foreground` | segment label colour | `gray-800` | `white` |
| `layer-hover` | hover fill | `gray-50` | `neutral-700` |
| `layer-focus` | keyboard/click focus fill | `gray-50` | `neutral-700` |
| `foreground` | icon colour in the toolbar variant | `gray-800` | `neutral-200` |
| `muted-hover` | toolbar button hover fill | `gray-100` | `neutral-700` |
| `muted-focus` | toolbar button focus fill | `gray-100` | `neutral-700` |

## Behaviour (JS)

Static markup only -- no Preline JS. `index.json` reports empty `hs_attrs` and `hs_js` for all 7 examples. The toolbar's `ql-*` classes are hooks for Quill, which the doc page pairs it with — they do nothing on their own.

## Gotchas

- **`focus:z-10` is not cosmetic.** With `-ms-px`, the next sibling's border paints over the focused button's edge; drop `focus:z-10` and the focus fill looks clipped on one side. Keep it on every child.
- **`layer-hover` and `layer-focus` resolve to the same colour under moon** (`gray-50` light / `neutral-700` dark). Hover and focus are visually indistinguishable here — if you need them to differ, that is a project-level override, not a Preline knob.
- **Radius mismatch in Preline's own vertical markup.** `vertical.html` and `button-group-break.html` put `rounded-lg` on the wrapper but `rounded-t-md` / `rounded-b-md` on the buttons; the horizontal files correctly pair `rounded-lg` with `rounded-s-lg`/`rounded-e-lg`. The vertical group's corners are visibly smaller than the wrapper's. Change the buttons to `-lg` if you want them flush.
- **Logical properties, not physical.** `-ms-px`, `first:rounded-s-lg`, `last:rounded-e-lg`, `sm:first:rounded-se-none` are all direction-aware — they flip automatically under `dir="rtl"`. Do not "simplify" them to `-ml-px`/`rounded-l-lg`, that breaks RTL silently.
- **`shadow-2xs` is on both the wrapper and every button.** That is intentional in all 6 collapsed examples; removing it from the children flattens the segment edges.
- **No selected state exists.** Nothing in these files marks an active segment. A segmented control needs your own `aria-pressed` + fill; there is no `hs-*` variant for it here.
- **The toolbar variant shares no classes with the other six.** Copying `toolbar.html` and expecting border collapse gets you spaced pills — it uses `gap-x-0.5` and `border-transparent` deliberately.
- **Responsive stack needs all four offset utilities.** `-mt-px -ms-px` are applied unconditionally; each is cancelled by its own `sm:` counterpart — `sm:mt-0` on every child (kills the vertical pull on the desktop row) and `sm:first:ms-0` on the first child only (the direct analogue of the unconditional `first:ms-0` in the horizontal files). Dropping `-mt-px` breaks the mobile column; dropping `sm:mt-0` leaves a 1px vertical pull on the desktop row; dropping `sm:first:ms-0` pulls the whole row 1px past the wrapper's inline-start edge.

## Copy-paste base

`examples/base-components/button-group/example.html` (complete file, verbatim):

```html
<!-- Button Group -->
<div class="inline-flex rounded-lg shadow-2xs">
  <button type="button" class="py-3 px-4 -ms-px first:rounded-s-lg first:ms-0 last:rounded-e-lg inline-flex items-center gap-x-2 text-sm font-medium focus:z-10 bg-layer border border-layer-line text-layer-foreground shadow-2xs hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus disabled:opacity-50 disabled:pointer-events-none">
    Years
  </button>
  <button type="button" class="py-3 px-4 -ms-px first:rounded-s-lg first:ms-0 last:rounded-e-lg inline-flex items-center gap-x-2 text-sm font-medium focus:z-10 bg-layer border border-layer-line text-layer-foreground shadow-2xs hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus disabled:opacity-50 disabled:pointer-events-none">
    Month
  </button>
  <button type="button" class="py-3 px-4 -ms-px first:rounded-s-lg first:ms-0 last:rounded-e-lg inline-flex items-center gap-x-2 text-sm font-medium focus:z-10 bg-layer border border-layer-line text-layer-foreground shadow-2xs hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus disabled:opacity-50 disabled:pointer-events-none">
    Date
  </button>
</div>
<!-- End Button Group -->
```
