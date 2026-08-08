---
component: charts
label: Charts
category: third-party-plugins
docs: https://preline.co/docs/components/charts.html
examples: 18
js: none
tokens: [chart-primary, chart-5, chart-6, chart-9, muted-foreground-2, foreground, line-2, muted]
---

# Charts

ApexCharts rendered through Preline's `buildChart()` helper, which merges a shared config with a light-mode and a dark-mode override and re-renders whenever the page theme changes. The HTML contribution is a bare mount `<div>` plus an optional hand-written legend.

## When to use
- Any real series plot: area / line / bar / horizontal bar / donut / pie / bubble / candlestick.
- Sparklines inside a table row or list item (`chart.sparkline.enabled`) — see `small-sized-sparklines`.
- **Do not use** for a single ratio or percentage bar — that is `progress` markup, no JS, no 200 KB dependency.
- **Do not use** for a trend badge next to a number — a `legend-indicator` swatch plus text is cheaper.
- The chart's own legend is disabled in every example (`legend: {show: false}`); the visible legend is plain markup you write. That is deliberate — ApexCharts' legend does not read the theme tokens.

## Anatomy

Reduced skeleton. The mount div is empty and needs a stable `id`; the legend is separate markup (classes verbatim from `examples/third-party-plugins/charts/multiple-area-chart.html`):

```html
<!-- Legend Indicator: hand-written, one row per series, colour must match the JS `colors` array -->
<div class="flex justify-center sm:justify-end items-center gap-x-4 mb-3 sm:mb-6">
  <div class="inline-flex items-center">
    <span class="size-2.5 inline-block bg-chart-primary rounded-xs me-2"></span>
    <span class="text-[13px] text-muted-foreground-2">Income</span>
  </div>
  <div class="inline-flex items-center">
    <span class="size-2.5 inline-block bg-chart-5 rounded-xs me-2"></span>
    <span class="text-[13px] text-muted-foreground-2">Outcome</span>
  </div>
</div>
<!-- End Legend Indicator -->

<div id="hs-multiple-area-charts"></div>   <!-- mount point; height comes from chart.height in JS -->
```

```js
// buildChart(selector, sharedFn(mode), lightOverridesFn, darkOverridesFn)
buildChart('#hs-multiple-area-charts', (mode) => ({ /* series, axes, tooltip … */ }),
  () => ({ colors: [varToColor('--chart-colors-primary-hex'), varToColor('--chart-colors-chart-5-hex')] }),
  () => ({ colors: [varToColor('--chart-colors-primary-hex-inverse'), varToColor('--chart-colors-chart-5-hex-inverse')] }));
```

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| Stylesheet | Installation | `examples/third-party-plugins/charts/how-to-use-assets.html` | `<link rel="stylesheet" href="./assets/vendor/apexcharts/dist/apexcharts.css">`. |
| Library tags | Installation | `examples/third-party-plugins/charts/how-to-use-assets-library.html` | `lodash.min.js` **then** `apexcharts.min.js`. lodash is not optional — `buildChart` calls `window._.merge`. |
| Helper tags | Installation | `examples/third-party-plugins/charts/how-to-use-assets-helper.html` | `helper-apexcharts.js` (defines `buildChart`, `buildTooltip*`, `buildHeatmapTooltip`, `fullBarHoverEffect`, `cssVarToValue`). `helper-shared.js` (defines `varToColor`) is present but **commented out** in this snippet — ship it anyway: all 15 chart JS files call `varToColor`. |
| Single-series area chart | Single-series area chart | `examples/third-party-plugins/charts/single-area-chart.html` (+ `.js`) | Markup is one line: `<div id="hs-single-area-chart"></div>`. JS: `type:'area'`, vertical gradient fill, custom `buildTooltip` with `hasTextLabel`, plus a `responsive` breakpoint at 568 px. |
| Multi-series area chart | Multi-series area chart | `examples/third-party-plugins/charts/multiple-area-chart.html` (+ `.js`) | Adds the two-swatch legend (`chart-primary`, `chart-5`) above the mount. Two `colors` entries in each mode override. |
| Synced area chart tooltips | Synced area chart tooltips | `examples/third-party-plugins/charts/multiple-area-chart-compare-two-tooltip.html` (+ `.js`) | Same markup; JS swaps `buildTooltip` for `buildTooltipCompareTwo`, which prints both series in one card. |
| Synced area chart tooltips (alt) | Synced area chart tooltips (alt) | `examples/third-party-plugins/charts/multiple-area-chart-compare-two-tooltip-alternative.html` (+ `.js`) | `buildTooltipCompareTwoAlt` — same data, different tooltip layout. |
| Smoothed area chart | Smoothed area chart | `examples/third-party-plugins/charts/curved-area-charts.html` (+ `.js`) | Legend identical to multi-area; `stroke.curve: 'smooth'` is the only real delta. |
| Single-series bar chart | Single-series bar chart | `examples/third-party-plugins/charts/single-bar-chart.html` (+ `.js`) | Bare mount div. `type:'bar'`; a two-colour array on a one-series chart — light `[--chart-colors-primary, --chart-colors-chart-10]`, dark `[--chart-colors-primary-inverse, --chart-colors-primary]` (the two modes do not mirror each other). |
| Multi-series bar chart | Multi-series bar chart | `examples/third-party-plugins/charts/multiple-bar-charts.html` (+ `.js`) | Legend swatches are the utilities `bg-chart-primary` + `bg-chart-9`; the plotted colours are the CSS vars `--chart-colors-primary` + `--chart-colors-chart-10`. The swatch key and the plotted key are **not** the same — see the legend gotcha. |
| Single-series line chart | Single-series line chart | `examples/third-party-plugins/charts/single-line-chart.html` (+ `.js`) | Bare mount div, `type:'line'`. |
| Multi-series line chart | Multi-series line chart | `examples/third-party-plugins/charts/multiple-line-charts.html` (+ `.js`) | Three-swatch legend: `chart-primary`, `chart-6`, `chart-9`. |
| Smoothed line chart | Smoothed line chart | `examples/third-party-plugins/charts/curved-line-charts.html` (+ `.js`) | Same three-swatch legend, `stroke.curve` smoothed. |
| Horizontal bar chart | Horizontal bar chart | `examples/third-party-plugins/charts/horizontal-bar-chart.html` (+ `.js`) | Markup is 41 bytes — mount div only, no legend. `plotOptions.bar.horizontal`. |
| Doughnut chart | Doughnut chart | `examples/third-party-plugins/charts/doughnut-chart.html` (+ `.js`) | Legend moves **below** (`mt-3 sm:mt-6`) inside a `flex flex-col justify-center items-center`. `type:'donut'`, `donut.size:'76%'`, `stroke.colors: varToColor('--chart-colors-background')` to punch the gap. Tooltip is `buildTooltipForDonut`. |
| Pie chart | Pie chart | `examples/third-party-plugins/charts/pie-chart.html` (+ `.js`) | Doughnut layout wrapped in `p-4` + `h-75`. |
| Bubble chart | Bubble chart | `examples/third-party-plugins/charts/bubble-chart.html` (+ `.js`) | `h-85` wrapper, legend below with **no** top margin (the donut/pie legend has `mt-3 sm:mt-6`). JS: `dataLabels.style.colors` from `--chart-colors-foreground[-inverse]`, `markers.strokeColors` from `--chart-colors-background[-inverse]`. |
| Compact sparklines | Compact sparklines | `examples/third-party-plugins/charts/small-sized-sparklines.html` (+ `.js`) | The only example with substantial markup: a list group of `<li class="py-3 px-4 text-sm border border-line-2 text-foreground -mt-px first:rounded-t-lg first:mt-0 last:rounded-b-lg">` (header row adds `font-semibold bg-muted`), each row a `grid grid-cols-2` holding one mount. Five charts in one file with **different** `chart.width`/`height`: area 100×30, bar 100×50, pie 30×30, line 100×30, candlestick 100×50. |

## Theme tokens (moon)
Two separate colour systems are in play. **Tailwind utility tokens** style the markup you write (legend swatches, list rows). **`--chart-colors-*` CSS variables** are read at runtime by `varToColor()` and handed to ApexCharts as hex — they are *not* Tailwind utilities and never appear in a `class` attribute.

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `chart-primary` | First-series legend swatch (`bg-chart-primary`) in every multi-series example | `gray-800` | `neutral-200` |
| `chart-5` | Second-series swatch on the **area** charts | `slate-400` | `slate-400` |
| `chart-6` | Second-series swatch on the **line**, donut, pie and bubble charts | `zinc-500` | `zinc-500` |
| `chart-9` | Second swatch on bar charts, third on line/donut/pie/bubble | `gray-200` | `neutral-500` |
| `muted-foreground-2` | Legend label text (`text-[13px] text-muted-foreground-2`) | `gray-700` | `neutral-300` |
| `foreground` | Row text in the sparklines list | `gray-800` | `neutral-200` |
| `line-2` | Row borders in the sparklines list (`border-line-2`) | `gray-200` | `neutral-700` |
| `muted` | Header row fill in the sparklines list (`bg-muted`) | `gray-50` | `neutral-800` |

The complete set of runtime variables referenced by the 15 example JS files — no more, no less:

| Variable | Which example JS reads it, and for what |
|---|---|
| `-primary-hex`, `-primary-hex-inverse` | `colors[0]` on the 5 **area** charts. Area charts use the `-hex` form *only*; nothing else does. |
| `-primary`, `-primary-inverse` | `colors[0]` on the 10 non-area charts (donut reads `-primary-inverse` in **both** modes) |
| `-chart-5-hex`, `-chart-5-hex-inverse` | `colors[1]` on the 4 multi-series area charts. There is no plain `--chart-colors-chart-5` anywhere in the examples. |
| `-chart-6`, `-chart-6-inverse` | line charts, donut, pie, bubble, sparkline pie |
| `-chart-9`, `-chart-9-inverse` | donut, pie, bubble, sparkline pie |
| `-chart-10`, `-chart-10-inverse` | 2nd series on the bar and line charts (**no legend swatch uses the matching utility** — see the legend gotcha) |
| `-foreground`, `-foreground-inverse` | `dataLabels.style.colors` — bubble and pie only |
| `-background`, `-background-inverse` | `stroke.colors` (donut, pie), `markers.strokeColors` (bubble), sparklines |
| `-xaxis-labels`, `-yaxis-labels` (+ `-inverse`) | `xaxis/yaxis.labels.style.colors` — all 12 cartesian charts |
| `-labels` | the `responsive` breakpoint block only, in 7 files. **No `-labels-inverse` is ever read**, so that block does not invert. |
| `-grid-border`, `-grid-border-inverse` | `grid.borderColor` — all 12 cartesian charts |
| `-bar-ranges`, `-bar-ranges-inverse` | `small-sized-sparklines` only (the bar sparkline's range colour) |
| `-candlestick-{upward,downward}` | `small-sized-sparklines` light override |
| `-candlestick-{upward,downward}-dark` | `small-sized-sparklines` dark override — **these are not defined by any stylesheet in this mirror** (see gotchas) |

**Only part of that set is re-themed by moon.** `assets/css/themes/moon.css` defines exactly 38 `--chart-colors-*`: `primary` and `chart-1…7` (each with `-hex`, `-inverse`, `-hex-inverse` siblings), `foreground[-inverse]`, and `candlestick-{upward,downward}[-inverse]` (candlestick has **no** `-hex` variant anywhere; moon points it at `primary-800` = `gray-800`/`neutral-800` and `primary-200` = `gray-200`/`neutral-200`, and upward and downward get the *same* value, so candle direction is not encoded by colour). It does **not** define `chart-8/9/10`, `background`, `labels`, `xaxis-labels`, `yaxis-labels`, `grid-border` or `bar-ranges` — those fall through to the base `assets/css/themes/theme.css` (`grid-border` = `gray-200` / `neutral-700`, x/y axis labels = `gray-400` / `neutral-400`, `background` = `white` / `neutral-800`). So axis chrome is theme-neutral by design; series colour is what moon controls. Note the *project* fork `assets/css/project-moon.css` narrows this further — it defines only `--chart-colors-{primary,foreground}[-inverse]`.

Two of the CSS variables above name a colour that also exists as a Tailwind token, with the **same** resolved value: `--chart-colors-chart-10` ↔ utility `chart-10` (`gray-300` / `neutral-700`) and `--chart-colors-chart-9` ↔ `chart-9`. Only `chart-9` is actually used as a utility (a legend swatch); `chart-10` never appears in any `class` attribute.

## Behaviour (JS)
No Preline component class, no `data-hs-*` attribute, no autoInit. Everything is `buildChart` from `assets/js/preline/helper-apexcharts.js` plus `varToColor` from `helper-shared.js`.

```js
buildChart(selector, sharedOptionsFn, lightOptionsFn, darkOptionsFn) // → ApexCharts instance | false
```

- **Mode resolution:** reads `dark` / `light` / `default` off `<html>`'s class list; falls back to `localStorage.getItem('hs_theme')`; `'auto'` consults `window.matchMedia('(prefers-color-scheme: dark)')`.
- **Merge:** `window._.merge(sharedFn(mode), lightOrDarkOverrides)`. `sharedFn` receives the mode string so a custom tooltip can branch on it. The 3rd/4th arguments may be a function or a plain object.
- **Live re-theming:** listens on `window` for `on-hs-appearance-change`, `on-hs-color-theme-change`, `on-hs-font-change`, `on-hs-brand-change`, `on-hs-clipboard-init-progress`, and (when the chart sits in one) on the closest `[role="tabpanel"]`. Each fires `chart.updateOptions(...)` then dispatches a `resize` event.
- **`varToColor('--var', el?)`** reads the *computed* value off `document.documentElement`, parses it as oklch, clamps the chroma and returns a hex string. Values already starting with `#` or `rgba` pass through untouched.
- **Tooltip builders:** `buildTooltip`, `buildTooltipCompareTwo`, `buildTooltipCompareTwoAlt`, `buildTooltipForDonut`, `buildHeatmapTooltip`. Options seen in the examples: `{title, mode, valuePrefix, valuePostfix, hasTextLabel, invertGroup, wrapperExtClasses, markerExtClasses, valueExtClasses}`.
- **Variant available for the tooltip shell:** `hs-apexcharts-tooltip-dark` (`assets/css/variants.css`), matching `&.dark` — that is why every builder prefixes its wrapper with `mode === 'dark' ? 'dark ' : ''`.

## Gotchas
- **`buildChart` returns `false` if the selector misses.** No throw, no console message — a mistyped `id` produces a silently blank area. Check the return value when charts render conditionally.
- **The tooltip does not use theme tokens.** `buildTooltip`'s default `wrapperClasses` / `titleClasses` / `valueClasses` are hard-coded raw Tailwind (`bg-white border-gray-200 text-gray-800 … dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400`). Under moon the tooltip is white / neutral-800 regardless of the palette. To re-theme it you must pass `wrapperExtClasses` etc., or write `tooltip.custom` yourself.
- **The legend is not wired to the chart.** Swatch colour is a Tailwind token, series colour is a CSS variable read in JS. `multiple-bar-charts` already drifts: the legend shows `bg-chart-9` while the plot uses `--chart-colors-chart-10`. Change one, change the other by hand.
- **lodash is a hard dependency.** `window._.merge` is called unguarded inside `buildChart`; without lodash every chart throws on the first render.
- **Load order matters:** lodash → apexcharts → `helper-shared.js` → `helper-apexcharts.js` → your `buildChart` call, and the call itself must sit inside `window.addEventListener('load', …)` (all 15 chart scripts do).
- **`chart.height` is set in JS, not CSS.** The mount `<div>` has no height class; a wrapper like `h-75` / `h-85` (pie, bubble) only centres the result. Setting a Tailwind height on the mount fights ApexCharts' inline style.
- **Charts inside a hidden container render at zero width.** The helper only re-measures on the theme events and its own `resize` dispatch. If a chart lives in a closed accordion/tab/modal, dispatch `window.dispatchEvent(new Event('resize'))` after it becomes visible — the `[role="tabpanel"]` listener covers tabs only.
- **Re-render kills nothing automatically.** `buildChart` gives you the ApexCharts instance; on unmount call `chart.destroy()` yourself, otherwise the theme listeners keep firing `updateOptions` on a detached node.
- **Donut/pie need `stroke.colors`.** Both set it from `--chart-colors-background[-inverse]` so the gap between slices matches the card behind it. Drop it and the light-mode gap stays white on a dark card.
- **The candlestick sparkline's dark colours are dead.** `small-sized-sparklines.js` reads `--chart-colors-candlestick-upward-dark` / `-downward-dark`, but every stylesheet here (`themes/theme.css`, `themes/moon.css`, `project-theme.css`) defines only `…-upward-inverse` / `…-downward-inverse`. `getPropertyValue` on an undefined variable returns `''`, which `varToColor` hands straight to the oklch parser. Fix the *call site* to `-inverse`, or add the `-dark` aliases; do not "fix" it by renaming the CSS, which would break every other theme.
- A11y: the mount div is an unlabelled `<div>` and the SVG carries no accessible name. Provide a caption or `aria-label` alongside; the visible legend text is the only thing a screen reader gets today.

## Copy-paste base

`examples/third-party-plugins/charts/multiple-area-chart.html` (smallest example that shows both the mount and the themed legend, verbatim):

```html
<!-- Legend Indicator -->
<div class="flex justify-center sm:justify-end items-center gap-x-4 mb-3 sm:mb-6">
  <div class="inline-flex items-center">
    <span class="size-2.5 inline-block bg-chart-primary rounded-xs me-2"></span>
    <span class="text-[13px] text-muted-foreground-2">
      Income
    </span>
  </div>
  <div class="inline-flex items-center">
    <span class="size-2.5 inline-block bg-chart-5 rounded-xs me-2"></span>
    <span class="text-[13px] text-muted-foreground-2">
      Outcome
    </span>
  </div>
</div>
<!-- End Legend Indicator -->

<div id="hs-multiple-area-charts"></div>
```

Mount-only form, `examples/third-party-plugins/charts/single-line-chart.html`:

```html
<div id="hs-single-line-chart"></div>
```
