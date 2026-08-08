---
component: range-slider
label: Range Slider
category: basic-forms
docs: https://preline.co/docs/components/range-slider.html
examples: 4
js: none
tokens: [layer, surface, primary]
---

# Range Slider

A native `<input type="range">` whose track and thumb are restyled through vendor pseudo-element variants (`[&::-webkit-slider-thumb]:*`, `[&::-moz-range-*]:*`) — no library and no component wrapper (the `<div class="w-full">` in every example is layout only; contrast advanced-range-slider, whose value readout is located through a `.hs-range-slider-wrapper` ancestor).

## When to use
- One number from a continuous or coarse-stepped span where the exact figure does not matter (volume, opacity, zoom).
- Prefer **input-number** (`advanced-forms`, `HSInputNumber`) or a plain `<input type="number">` when the user needs to read or type the precise value — this component renders no value label.
- Prefer **advanced-range-slider** (`third-party-plugins`, 18 examples, `data-hs-range-slider` + `HSRangeSlider`) for two-handle ranges, tooltips, pips, formatted output or a live value readout. It is noUiSlider-backed and shares nothing with this markup.
- Not usable for a range (min..max pair): a native `input[type=range]` has exactly one thumb.

## Anatomy

Reduced skeleton — every class below appears in `examples/basic-forms/range-slider/overview.html`.

```html
<label for="ID" class="sr-only">Example range</label>
<input type="range" id="ID" aria-orientation="horizontal"
       class="w-full bg-transparent cursor-pointer appearance-none      <!-- kills the UA widget -->
              disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden

              [&::-webkit-slider-runnable-track]:h-2                    <!-- WebKit track -->
              [&::-webkit-slider-runnable-track]:bg-surface
              [&::-webkit-slider-runnable-track]:rounded-full

              [&::-webkit-slider-thumb]:appearance-none                 <!-- WebKit thumb -->
              [&::-webkit-slider-thumb]:w-2.5
              [&::-webkit-slider-thumb]:h-2.5
              [&::-webkit-slider-thumb]:-mt-0.5
              [&::-webkit-slider-thumb]:bg-layer
              [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_var(--color-primary)]
              [&::-webkit-slider-thumb]:rounded-full

              [&::-moz-range-track]:h-2                                 <!-- Firefox track -->
              [&::-moz-range-track]:bg-surface
              [&::-moz-range-track]:rounded-full

              [&::-moz-range-thumb]:bg-layer                            <!-- Firefox thumb -->
              [&::-moz-range-thumb]:border-4
              [&::-moz-range-thumb]:border-primary
              [&::-moz-range-thumb]:rounded-full">
```

The full class string is **byte-identical in all four examples** — they differ only by the trailing attribute (`disabled`, `min`/`max`, `step`). Grep it, do not retype it.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Default | Default range slider | `examples/basic-forms/range-slider/overview.html` | No value attributes at all; browser defaults to `min=0 max=100 value=50` |
| Disabled | Disabled range slider | `examples/basic-forms/range-slider/disabled.html` | Adds `disabled`, activating `disabled:opacity-50 disabled:pointer-events-none` |
| Custom min/max | Custom min and max | `examples/basic-forms/range-slider/min-and-max.html` | Adds `min="0" max="5"` |
| Steps | Step intervals | `examples/basic-forms/range-slider/steps.html` | Adds `step="10"` |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `surface` (`bg-surface` on both track pseudo-elements) | The rail | `gray-100` | `neutral-700` |
| `layer` (`bg-layer` on both thumb pseudo-elements) | Thumb core (the small dot inside the ring) | `white` | `neutral-800` |
| `primary` | Thumb ring — WebKit via `shadow-[0_0_0_4px_var(--color-primary)]`, Firefox via `border-primary` | `gray-800` | `white` |

Net effect under moon: light = dark ring around a white dot on a pale rail; dark = white ring around a `neutral-800` dot on a `neutral-700` rail. The rail-vs-thumb contrast in dark mode is one step of neutral — verify it against your background before shipping.

## Behaviour (JS)

Static markup only -- no Preline JS.

`assets/js/preline/range-slider.js` exists but belongs to the sibling **advanced-range-slider** component. For reference, if you migrate there: `HSRangeSlider.autoInit()` runs on `window` `load` over `[data-hs-range-slider]:not(.--prevent-on-load-init)`; it **requires a global `noUiSlider`** (`isAvailable()` guards it and logs `"HSRangeSlider: noUiSlider is not available, please add it to the page."`); instances live in `window.$hsRangeSliderCollection`; API is `HSRangeSlider.getInstance(el, true)`, `.destroy()`; options come from the JSON in the attribute merged with the constructor argument; a live readout needs `.hs-range-slider-wrapper` + `.hs-range-slider-current-value`. None of that applies to the native markup on this page.

## Gotchas
- **`appearance-none` is needed twice** — once on the input (to drop the UA widget) and again on `::-webkit-slider-thumb`. Omit the second and WebKit keeps its own thumb, ignoring every colour class.
- **The two engines use different mechanisms for the same ring.** WebKit gets a 4px `box-shadow`; Firefox gets `border-4`. They are not interchangeable: `border-4` on the WebKit thumb would shrink the 10px core to 2px, and a box-shadow on the Firefox thumb sits outside the layout box and clips against the track. Change the thumb size and you must retune both.
- **`-mt-0.5` is WebKit-only and required.** WebKit aligns the thumb to the *top* of `::-webkit-slider-runnable-track`; Firefox centres `::-moz-range-thumb` itself. Copying `-mt-0.5` onto the Moz thumb pushes it off the rail.
- **`shadow-[0_0_0_4px_var(--color-primary)]` bypasses the utility layer.** It reads the `@theme` bridge variable directly — `--color-primary: var(--primary)` is defined in `assets/css/themes/theme.css` (and `assets/css/project-theme.css`), **not** in `moon.css`. Load moon without the base theme layer and the ring silently renders with an invalid colour. Also: Tailwind only emits the class if this literal string is in a scanned file — building the string at runtime produces nothing.
- **No fill/progress on the left of the thumb.** Native range inputs give you a uniform rail; the "filled up to value" look needs a JS-updated gradient or advanced-range-slider.
- **All four examples share `id="basic-range-slider-usage"`** and the same `for` on their labels. Paste two on one page and the labels bind to the first input.
- `focus:outline-hidden` removes the focus ring and nothing replaces it — the control is keyboard-operable (arrow keys) but invisibly focused. Add a visible focus style.
- `aria-orientation="horizontal"` is already the implicit default; it is decoration, not a fix. What is actually missing is `aria-valuetext` whenever the numeric value is not self-explanatory.
- No `value` attribute anywhere: the thumb starts at the midpoint of `min`/`max`. In `min-and-max.html` (`min=0 max=5`) that is `2.5`, and with no `step` the browser snaps to `3`.

## Copy-paste base

`examples/basic-forms/range-slider/overview.html`

```html
<div class="w-full">
  <label for="basic-range-slider-usage" class="sr-only">Example range</label>
  <input type="range" class="w-full bg-transparent cursor-pointer appearance-none disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden
    [&::-webkit-slider-thumb]:w-2.5
    [&::-webkit-slider-thumb]:h-2.5
    [&::-webkit-slider-thumb]:-mt-0.5
    [&::-webkit-slider-thumb]:appearance-none
    [&::-webkit-slider-thumb]:bg-layer
    [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_var(--color-primary)]
    [&::-webkit-slider-thumb]:rounded-full
    [&::-webkit-slider-thumb]:transition-all
    [&::-webkit-slider-thumb]:duration-150
    [&::-webkit-slider-thumb]:ease-in-out

    [&::-moz-range-thumb]:w-2.5
    [&::-moz-range-thumb]:h-2.5
    [&::-moz-range-thumb]:appearance-none
    [&::-moz-range-thumb]:bg-layer
    [&::-moz-range-thumb]:border-4
    [&::-moz-range-thumb]:border-primary
    [&::-moz-range-thumb]:rounded-full
    [&::-moz-range-thumb]:transition-all
    [&::-moz-range-thumb]:duration-150
    [&::-moz-range-thumb]:ease-in-out

    [&::-webkit-slider-runnable-track]:w-full
    [&::-webkit-slider-runnable-track]:h-2
    [&::-webkit-slider-runnable-track]:bg-surface
    [&::-webkit-slider-runnable-track]:rounded-full

    [&::-moz-range-track]:w-full
    [&::-moz-range-track]:h-2
    [&::-moz-range-track]:bg-surface
    [&::-moz-range-track]:rounded-full" id="basic-range-slider-usage" aria-orientation="horizontal"   >
</div>
```
