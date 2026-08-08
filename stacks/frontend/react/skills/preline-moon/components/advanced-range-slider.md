---
component: advanced-range-slider
label: Advanced Range Slider
category: third-party-plugins
docs: https://preline.co/docs/components/advanced-range-slider.html
examples: 18
js: HSRangeSlider (+ HSOverlay in the modal example)
tokens: [primary, layer, surface, layer-line, layer-foreground, foreground, muted-foreground, line-4, primary-50, primary-500, primary-600, muted-foreground-1, primary-focus, primary-line, primary-foreground, primary-hover, layer-hover, layer-focus, surface-line, surface-foreground, surface-hover, surface-focus, overlay, overlay-line, overlay-header, overlay-footer, scrollbar-track, scrollbar-thumb]
---

# Advanced Range Slider

A single- or dual-handle numeric slider built on the third-party **noUiSlider** library; Preline supplies `HSRangeSlider`, which reads a `data-hs-range-slider` JSON blob, appends your Tailwind classes onto noUiSlider's own class names, and adds value formatters.

## When to use
- Bounded numeric input where the *range* is the point: price filters, budget caps, age brackets. Dual handle = `"start": [a, b]` + `"connect": true`.
- Any slider that must display a formatted value (currency, thousands separators) — the built-in `formatter` beats wiring `Intl` by hand.
- **Do not use** for an unbounded or precise number — that is `input-number` (`HSInputNumber`, stepper + text field). A slider cannot express "any integer".
- **Do not use** for on/off — that is `switch` / `checkbox`.
- Needs a vendored `nouislider.min.js` on the page. If you cannot ship it, a native `<input type="range">` gets no Preline styling at all.

## Anatomy

Reduced skeleton (every class appears in `examples/third-party-plugins/advanced-range-slider/basic-usage.html`). The element is **empty** — noUiSlider builds the whole DOM inside it from `cssClasses`:

```html
<div class="w-full">
  <label class="sr-only">Example range</label>          <!-- a11y: the div has no accessible name -->
  <div data-hs-range-slider='{
    "start": 50,                                        /* number = 1 handle; [a,b] = 2 handles */
    "connect": "lower",                                 /* "lower" fills 0→handle; true fills between handles */
    "range": { "min": 0, "max": 100 },
    "cssClasses": {
      "target":   "relative h-2 rounded-full bg-surface",              /* the rail */
      "base":     "size-full relative z-1",
      "origin":   "absolute top-0 inset-e-0 size-full origin-top-left rounded-full",
      "handle":   "absolute top-1/2 inset-e-0 size-4.5 bg-layer border-4 border-primary rounded-full cursor-pointer translate-x-2/4 -translate-y-2/4",
      "connects": "relative z-0 size-full rounded-full overflow-hidden",
      "connect":  "absolute top-0 inset-e-0 z-1 size-full origin-top-left bg-primary",  /* the fill */
      "touchArea":"absolute -inset-1"                                  /* enlarged hit target */
    }
  }'></div>
</div>
```

The theme lives in exactly three of those keys: `target` → `bg-surface` (rail), `connect` → `bg-primary` (fill), `handle` → `bg-layer border-primary` (knob). Everything else is geometry.

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| Library tag | Installation | `examples/third-party-plugins/advanced-range-slider/how-to-use-assets-library.html` | One `<script src="./assets/vendor/nouislider/dist/nouislider.min.js">`. noUiSlider is **not** bundled in `preline.js`. |
| Basic slider | Basic slider | `examples/third-party-plugins/advanced-range-slider/basic-usage.html` | The canonical 7-key `cssClasses` block. `start: 50`, `connect: "lower"`. |
| Gradient track | Gradient track | `examples/third-party-plugins/advanced-range-slider/gradient-filled-track.html` | Only `connect` changes: `absolute top-0 inset-e-0 z-1 size-full bg-linear-to-r from-primary-50 to-primary-600 origin-top-left dark:from-primary-500/20 dark:to-primary-500`. The only example in the whole component with hand-written `dark:` classes — everywhere else the token inverts by itself. |
| Disabled slider | Disabled slider | `examples/third-party-plugins/advanced-range-slider/disabled.html` | `"disabled": true` plus three `hs-range-slider-disabled:` classes — `pointer-events-none` on `target`, `border-primary/50` on `handle`, `opacity-50` on `connects`. |
| Stepped values | Stepped values | `examples/third-party-plugins/advanced-range-slider/steps.html` | `"step": 1` over `range 0–5`, `"start": 3`. `cssClasses` block identical to basic. |
| Tooltip values | Tooltip values | `examples/third-party-plugins/advanced-range-slider/tooltip.html` | `"tooltips": true` + `"formatter": "integer"` and an 8th class key `tooltip`: `bg-layer border border-layer-line text-sm text-layer-foreground py-1 px-2 rounded-lg mb-3 absolute bottom-full inset-s-2/4 -translate-x-2/4`. |
| Range slider | Range slider | `examples/third-party-plugins/advanced-range-slider/range.html` | `"start": [25, 75]`, `"connect": true`. Two handles from the one `handle` class. |
| Range with tooltips | Range with tooltips | `examples/third-party-plugins/advanced-range-slider/range-with-tooltip.html` | Dual handle + the `tooltip` class key. Two tooltips, one per handle. |
| Slider pips | Slider pips | `examples/third-party-plugins/advanced-range-slider/pips.html` | Dual handle (`start: [140,300]`, `range 0–500`) + tooltips. `pips: {mode:"values", values:[0,125,250,375,500], density:20}` adds 3 class keys — `pips: "relative w-full h-10 mt-1"`, `value: "absolute top-4 -translate-x-2/4 text-sm text-muted-foreground"`, `marker: "absolute h-4 border-s border-line-4"`. `target` gains `mb-10` to reserve room. |
| Automatic pips | Automatic pips | `examples/third-party-plugins/advanced-range-slider/pips-auto-values.html` | `pips: {mode:"count", values:5}` + `formatter: {type:"integer", prefix:"$"}`; `marker` drops its `h-4` (`"absolute border-s border-line-4"`) and splits into `markerNormal: "h-2"` / `markerLarge: "h-4"`. |
| Output to HTML element | Output to HTML element | `examples/third-party-plugins/advanced-range-slider/pass-value-to-html-element.html` (+ `.js`) | Adds `--prevent-on-load-init` + an `id`, and a `<span class="text-primary">` sink. JS: `new HSRangeSlider(el)` then `range.noUiSlider.on('update', () => target.innerText = inst.formattedValue)`. |
| Range output to HTML elements | Range output to HTML elements | `examples/third-party-plugins/advanced-range-slider/pass-values-to-html-elements.html` (+ `.js`) | Two sinks; `formattedValue` is an **array** for dual handles — `[0]` / `[1]`. No tooltips here. |
| Formatted values | Formatted values | `examples/third-party-plugins/advanced-range-slider/thousands-separators-and-decimal-points.html` (+ `.js`) | `formatter: {prefix:"USD ", type:"thousandsSeparatorAndDecimalPoints"}` over `0–10,000,000`. Sinks widened to `min-w-36`. |
| Output to input | Output to input | `examples/third-party-plugins/advanced-range-slider/pass-value-to-input.html` (+ `.js`) | Sink is a themed `<input class="bg-layer border-layer-line … focus:border-primary-focus">`; two-way — `target.addEventListener('input', _.debounce(evt => inst.el.noUiSlider.set(evt.target.value)), 200)`. Requires **lodash**. |
| Range output to inputs | Range output to inputs | `examples/third-party-plugins/advanced-range-slider/pass-values-to-inputs.html` (+ `.js`) | Two labelled `type="number"` inputs in a `basis-1/2` pair; each `set()` call must pass the **whole** pair (`[evt.target.value, max.value]`). |
| Range with charts | Range with charts | `examples/third-party-plugins/advanced-range-slider/range-with-charts.html` (+ `.js`) | Slider drives an ApexCharts sparkline pair (background + clipped foreground in an `absolute … overflow-hidden` wrapper). `handle` gains `z-2` to sit above the chart. Pulls in lodash, apexcharts, `helper-shared.js`, `helper-apexcharts.js`. |
| Modal example | Modal example | `examples/third-party-plugins/advanced-range-slider/range-with-charts-in-modal.html` (+ `.js`) | Same chart slider inside an `hs-overlay` dialog (`bg-overlay`, `border-overlay-line`, `border-overlay-header/footer`, scrollbar tokens). Adds `HSOverlay` + `data-hs-overlay`. |
| Destroy and reinitialize | Destroy and reinitialize | `examples/third-party-plugins/advanced-range-slider/destroy-and-reinitialize.html` (+ `.js`) | No `--prevent-on-load-init` (it must auto-init first). Two buttons: `HSRangeSlider.getInstance(el, true).element.destroy()` and `HSRangeSlider.autoInit()`. |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `surface` | Rail / unfilled track (`bg-surface` on `target`) | `gray-100` | `neutral-700` |
| `primary` | Filled portion (`bg-primary` on `connect`) **and** the handle ring (`border-primary`) | `gray-800` | `white` |
| `layer` | Handle disc fill (`bg-layer` on `handle`); tooltip background | `white` | `neutral-800` |
| `layer-line` | Tooltip border (`border-layer-line`) | `gray-200` | `neutral-700` |
| `layer-foreground` | Tooltip text (`text-layer-foreground`) | `gray-800` | `white` |
| `foreground` | Sink labels / value readouts outside the slider | `gray-800` | `neutral-200` |
| `muted-foreground` | Pip value labels (`text-muted-foreground` on `value`) | `gray-500` | `neutral-500` |
| `line-4` | Pip tick marks (`border-line-4` on `marker`) | `gray-400` | `neutral-500` |
| `primary-50` | Gradient-track start, light only | `gray-50` | `zinc-50` |
| `primary-600` | Gradient-track end, light only | `gray-600` | `neutral-600` |
| `primary-500` | Gradient-track start (`/20`) and end in dark | `gray-500` | `neutral-500` |
| `muted-foreground-1` | Placeholder in the paired inputs | `gray-600` | `neutral-400` |
| `primary-focus` | Focus ring/border on the paired inputs | `gray-900` | `neutral-300` |

**Moon inverts the slider.** In dark, `primary` is `white`, so the *filled* track is white and the handle is a `neutral-800` disc with a white ring. There is no hue anywhere: `primary-50 → gray-50`, `primary-600 → gray-600`. The "gradient track" variant is a grey ramp under moon, not a colour ramp.

Chrome around the slider — only in `range-with-charts-in-modal.html` and `destroy-and-reinitialize.html`, none of it touches the slider itself:

| Token (utility) | Role | Light | Dark |
|---|---|---|---|
| `overlay` / `overlay-line` / `overlay-header` / `overlay-footer` | Modal panel fill / border / header rule / footer rule | `white` / `transparent` / `gray-200` / `gray-200` | `neutral-800` / `transparent` / `neutral-700` / `neutral-700` |
| `scrollbar-track` / `scrollbar-thumb` | Modal body scrollbar | `gray-100` / `gray-300` | `neutral-700` / `neutral-500` |
| `primary` / `primary-line` / `primary-foreground` / `primary-hover` | "Open modal" + "Save changes" CTAs | `gray-800` / `transparent` / `white` / `gray-900` | `white` / `transparent` / `neutral-800` / `neutral-300` |
| `layer` / `layer-line` / `layer-foreground` / `layer-hover` / `layer-focus` | Modal "Close" and "Destroy slider" buttons | `white` / `gray-200` / `gray-800` / `gray-50` / `gray-50` | `neutral-800` / `neutral-700` / `white` / `neutral-700` / `neutral-700` |
| `surface` / `surface-line` / `surface-foreground` / `surface-hover` / `surface-focus` | Modal header ✕ and "Reinitialize slider" button | `gray-100` / `transparent` / `gray-800` / `gray-200` / `gray-200` | `neutral-700` / `transparent` / `neutral-200` / `neutral-600` / `neutral-600` |

## Behaviour (JS)
Source: `assets/js/preline/range-slider.js` (`HSRangeSlider`, v4.2.0). Global: `window.HSRangeSlider`. `autoInit()` runs on `window load`.

| Attribute / class | Effect |
|---|---|
| `data-hs-range-slider='{…}'` | JSON options, `JSON.parse`d in the constructor. Merged as `{...jsonOptions, ...jsOptions}`. |
| `--prevent-on-load-init` | Excluded from `autoInit()` (selector is `[data-hs-range-slider]:not(.--prevent-on-load-init)`), so you can `new HSRangeSlider(el)` yourself. |
| `.hs-range-slider-wrapper` | Ancestor lookup (`el.closest(...)`) that scopes the auto-updating value sinks below. |
| `.hs-range-slider-current-value` | Elements inside that wrapper are auto-filled on every `update` — `.value` for inputs, `textContent` otherwise. |

- **Options.** `start`, `range: {min,max}`, `connect` (`"lower"` \| `true`), `step`, `tooltips`, `pips`, `disabled`, `formatter`, `cssClasses`, plus `wrapper`, `currentValue`, `icons.handle` (HTML injected into `.noUi-handle`). Anything else falls through to noUiSlider.
- **`processClasses` concatenates, it does not replace:** each key becomes `` `${noUiSlider.cssClasses[key]} ${yours}` ``. The stock `noUi-target`, `noUi-handle`, … class names survive, so noUiSlider's own stylesheet still applies underneath your utilities.
- **Formatters.** `"integer"` → `Math.round`; `"thousandsSeparatorAndDecimalPoints"` → `Intl.NumberFormat('en-US', {min/maxFractionDigits: 2})`; object form `{type, prefix, postfix}` wraps the value. When `tooltips: true` and a formatter exists, `concatOptions.tooltips` is replaced by the format object so tooltips print formatted.
- **`instance.formattedValue`** — getter. Scalar for one handle, **array** for two.
- **Raw noUiSlider API stays reachable:** `el.noUiSlider.on('update' | 'change' | …)`, `el.noUiSlider.set(value)`. Every example listens through it, not through Preline.
- **Statics.** `HSRangeSlider.autoInit()`; `HSRangeSlider.getInstance(elOrSelector, true)` → `{id, element}` (pass `true`, or you get the raw DOM node back); `HSRangeSlider.isAvailable()`.
- **`instance.destroy()`** calls `el.noUiSlider.destroy()`, nulls the format and drops the entry from `window.$hsRangeSliderCollection`.
- Missing library → constructor throws `HSRangeSlider: noUiSlider is not available, please add it to the page.`

## Gotchas
- **`cssClasses` is mandatory in practice.** Omit it and you get noUiSlider's unstyled default skin — no `bg-surface`, no `bg-primary`, nothing themed. All 17 markup examples repeat the same 7-key block; copy it, then change only `target`/`connect`/`handle`. The only in-place edits across the set: `target` gains `mb-10` in the two pips examples, and `handle` gains `z-2` in the two chart examples.
- **The 8th key `tooltip` only exists when `tooltips: true`.** Adding the class without the option silently does nothing; adding the option without the class gives an unstyled native tooltip.
- **`formattedValue` shape flips with handle count.** `pass-value-to-html-element.js` assigns it directly; `pass-values-to-html-elements.js` indexes `[0]`/`[1]`. Switching `start: 50` → `start: [25,75]` turns your readout into `"25,75"` with no error.
- **The two-way input examples need lodash.** `_.debounce` is called unqualified. Also note the misplaced paren in the doc example: `_.debounce((evt) => …), 200)` passes `200` to `addEventListener`, not to `debounce` — copy `pass-values-to-inputs.js`, which brackets it correctly.
- **Re-init after dynamic render.** `autoInit()` skips elements already in `window.$hsRangeSliderCollection` and prunes entries whose `el` left the document — but a framework that *replaces* the node leaves the old noUiSlider DOM behind. `destroy()` the instance before unmounting, then `autoInit()`.
- **`--prevent-on-load-init` means *you* must construct it.** Nothing registers the element until either `autoInit()` matches it or you call `new HSRangeSlider(el)` — every `--prevent-on-load-init` example does the latter, which is what makes `getInstance` work there. `destroy-and-reinitialize.html` deliberately omits the class for the opposite reason: its "Reinitialize" button calls `HSRangeSlider.autoInit()`, whose selector is `[data-hs-range-slider]:not(.--prevent-on-load-init)` — with the class present that button would be a no-op.
- **`disabled: true` also sets the DOM `disabled` attribute and a `.disabled` class** (`setDisabled()`), which is what the `hs-range-slider-disabled:` variant hooks. Setting only the CSS classes does not disable interaction.
- **Sliders inside a hidden container measure 0.** The modal example initialises the chart+slider while the overlay is closed; that is why it re-runs layout on open. If you render a slider inside a `hidden` panel, re-init (or call `noUiSlider.updateOptions`) once it is visible.
- A11y: the wrapper `<div>` carries no role or name — every example ships a `<label class="sr-only">`. Keep it. noUiSlider puts `aria-valuenow`/`role="slider"` on the handles itself.

## Copy-paste base

`examples/third-party-plugins/advanced-range-slider/basic-usage.html` (smallest complete slider, verbatim):

```html
<!-- Range Slider -->
<div class="w-full">
  <label class="sr-only">Example range</label>
  <div data-hs-range-slider='{
    "start": 50,
    "connect": "lower",
    "range": {
      "min": 0,
      "max": 100
    },
    "cssClasses": {
      "target": "relative h-2 rounded-full bg-surface",
      "base": "size-full relative z-1",
      "origin": "absolute top-0 inset-e-0 size-full origin-top-left rounded-full",
      "handle": "absolute top-1/2 inset-e-0 size-4.5 bg-layer border-4 border-primary rounded-full cursor-pointer translate-x-2/4 -translate-y-2/4",
      "connects": "relative z-0 size-full rounded-full overflow-hidden",
      "connect": "absolute top-0 inset-e-0 z-1 size-full origin-top-left bg-primary",
      "touchArea": "absolute -inset-1"
    }
  }'></div>
</div>
<!-- End Range Slider -->
```
