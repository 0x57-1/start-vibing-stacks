---
component: progress
label: Progress
category: base-components
docs: https://preline.co/docs/components/progress.html
examples: 15
js: none
tokens: [surface-1, primary, primary-foreground, foreground, foreground-inverse, surface-2, surface-4, secondary, secondary-foreground, plain, primary-400, primary-700, primary-50, primary-200, primary-600, primary-500, primary-900]
---

# Progress

A track element whose inner fill is sized by an inline `style="width: N%"` (or `height` when vertical), reporting completion of a task.

## When to use

- Determinate work with a known percentage: uploads, quotas, multi-step wizards, score gauges.
- Indeterminate/short-lived work ("saving…") — use the spinner markup from `examples/base-components/toasts/message-with-loading-indicator.html` instead; Progress has no indeterminate mode.
- A count of discrete stages with no percentage — use the Steps variant (`examples/base-components/progress/steps.html`), which encodes progress by how many segments are filled, not by width.
- A radial score/KPI — use `circular-progress` / `gauge-progress`; those are hand-written SVG, not the bar markup.

## Anatomy

Reduced skeleton (classes below all appear in `examples/base-components/progress/example.html`):

```html
<!-- track: owns role + aria + background + clipping -->
<div class="flex w-full h-1.5 bg-surface-1 rounded-full overflow-hidden"
     role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
  <!-- fill: width comes from inline style, never from a class -->
  <div class="flex flex-col justify-center rounded-full overflow-hidden bg-primary
              text-xs text-primary-foreground text-center whitespace-nowrap transition duration-500"
       style="width: 25%"></div>
</div>
```

Vertical inverts the axis only: `flex-col flex-nowrap justify-end w-2 h-32` on the track, `style="height: N%"` on the fill.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| `example` | Default progress | `examples/base-components/progress/example.html` | Baseline. `h-1.5`, `rounded-full` on both track and fill. |
| `height` | Height | `examples/base-components/progress/height.html` | Same markup at `h-1.5` / `h-4` / `h-6` (the three rows also differ in width/`aria-valuenow`, 25/50/75, but nothing structural). |
| `within-progress-bar` | Inside the bar | `examples/base-components/progress/within-progress-bar.html` | `h-4` and the percentage as text content of the fill; activates the otherwise inert `text-xs text-primary-foreground text-center`. |
| `label-at-the-end` | End label | `examples/base-components/progress/label-at-the-end.html` | Wraps track + `<div class="w-10 text-end">` in `flex items-center gap-x-3 whitespace-nowrap`. |
| `title-label` | With title | `examples/base-components/progress/title-label.html` | Adds `mb-2 flex justify-between items-center` header with `h3` + `span`, both `text-foreground`. |
| `floating-label` | Floating label | `examples/base-components/progress/floating-label.html` | Chip positioned by `ms-[calc(N%-20px)]`; uses the numeric primary ramp with explicit `dark:` overrides. |
| `color-variants` | Color variants | `examples/base-components/progress/color-variants.html` | Fill swaps to `bg-secondary` / `bg-surface-4` / `bg-teal-500` / `bg-red-500` / `bg-yellow-500` / `bg-plain`, label to `text-foreground-inverse`. |
| `multiple-bars` | Multiple bars | `examples/base-components/progress/multiple-bars.html` | Four fills laid side by side in one flex track (25% + 15% + 30% + 5% = 75% used); `role="progressbar"` moves off the track onto each fill; no `rounded-full` on fills; last band is `bg-orange-600 text-secondary-foreground`. |
| `no-radius` | Square ends | `examples/base-components/progress/no-radius.html` | `rounded-full` removed from track and fill. |
| `straight-bar` | Straight bar | `examples/base-components/progress/straight-bar.html` | `rounded-full` kept on the track, dropped on the fill — the leading edge is square, clipped by the track. |
| `vertical-progress` | Vertical bar | `examples/base-components/progress/vertical-progress.html` | `flex-col flex-nowrap justify-end w-2 h-32`; fill sized with `style="height: N%"`. |
| `steps` | Steps | `examples/base-components/progress/steps.html` | N sibling `w-full h-2.5` segments in `flex items-center gap-x-1`; filled = `bg-primary`, empty = `bg-surface-2`. No inline width anywhere. |
| `circular-progress` | Circular progress | `examples/base-components/progress/circular-progress.html` | SVG, two `r="16"` circles, `-rotate-90`, `stroke-dasharray="100"` + `stroke-dashoffset="100 − pct"`. |
| `gauge-progress` | Gauge progress | `examples/base-components/progress/gauge-progress.html` | SVG arc: `rotate-135` + track `stroke-dasharray="75 100"` (270°) or `rotate-180` + `"50 100"` (180°); value text centred over it. |
| `gauge-custom-progress` | Gauge progress | `examples/base-components/progress/gauge-custom-progress.html` | Same gauge geometry with hard-coded palette colours (`purple`/`green`/`orange`) and manual `dark:` pairs — no moon tokens at all. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `surface-1` | Track (unfilled) background | `gray-200` | `neutral-600` |
| `primary` | Default fill; circular/gauge arc stroke and value text | `gray-800` | `white` |
| `primary-foreground` | Label text sitting inside the fill | `white` | `neutral-800` |
| `foreground` | External title / end label; circular track uses `text-foreground/10` | `gray-800` | `neutral-200` |
| `foreground-inverse` | Label over a saturated or non-`primary` fill | `white` | `white` |
| `surface-2` | Unfilled segment in the Steps variant | `gray-300` | `neutral-500` |
| `surface-4` | "Gray" fill in Color variants | `gray-500` | `neutral-500` |
| `secondary` | "Dark" fill in Color variants and one Multiple-bars band | `gray-900` | `white` |
| `secondary-foreground` | Label on the orange band in Multiple bars | `white` | `neutral-800` |
| `plain` | "White" fill in Color variants | `white` | `neutral-800` |
| `primary-400` | First band in Multiple bars | `gray-400` | `neutral-400` |
| `primary-700` | Second band in Multiple bars | `gray-700` | `neutral-700` |
| `primary-50` | Floating-label chip background (light only) | `gray-50` | `zinc-50` |
| `primary-200` | Floating-label chip border (light only) | `gray-200` | `neutral-200` |
| `primary-600` | Floating-label chip text (light only) | `gray-600` | `neutral-600` |
| `primary-500` | Floating-label chip dark background, at `/20` | `gray-500` | `neutral-500` |
| `primary-900` | Floating-label chip dark border | `gray-900` | `neutral-900` |

## Behaviour (JS)

Static markup only -- no Preline JS.

`hs_js` and `hs_attrs` are both empty in `data/index.json`. Percentages are written by you into the `style` attribute and into `aria-valuenow`; nothing in `assets/js/preline/` touches this component.

## Gotchas

- **The semantic `primary` inverts under moon; the numeric ramp does not.** `primary` is `gray-800` light → `white` dark, so `bg-primary` on `bg-surface-1` stays legible in both. But `primary-100` is `gray-100` light **and** `neutral-100` dark, `primary-800` is `gray-800` / `neutral-800`. Every numeric-ramp usage in these examples ships a hand-written dark pair — `floating-label.html` carries `dark:bg-primary-500/20 dark:border-primary-900 dark:text-primary-400`. Copy the numeric class without its `dark:` twin and you get dark-on-dark.
- **The width is an inline `style`, never a class.** Tailwind cannot JIT `w-[57%]` from a runtime value. Write `el.style.width = pct + '%'` and update `aria-valuenow` in the same statement — they are two independent sources of truth and drift silently.
- **`overflow-hidden` on the track is load-bearing.** `straight-bar.html` keeps `rounded-full` on the track and drops it from the fill; only the track's `overflow-hidden` clips the square fill to the pill shape. Remove it and the fill corner pokes out.
- **`role="progressbar"` moves.** Single-bar examples put `role` + all three `aria-value*` on the **track**. `multiple-bars.html` puts them on **each inner fill** and leaves the track role-less; `steps.html` has no track at all — each segment is a direct flex child carrying its own `role`. Pick one; a track and its child both claiming `progressbar` reads as two widgets.
- **The in-bar label classes are inert until you add text**, and one combination is invisible: `color-variants.html` pairs `bg-plain` (`white` light) with `text-foreground-inverse` (`white` in *both* modes). Adding a label to that bar produces white-on-white in light mode.
- **Vertical needs `justify-end`.** Drop it from `vertical-progress.html` and the fill grows from the top of the track instead of the bottom.
- **Gauge arithmetic:** the circle is `r="16"` (circumference ≈ 100.5), so `stroke-dasharray` values are already percentages. Circular: `stroke-dashoffset = 100 − pct`. Gauge: progress dash = `pct × arcFraction`, where the track's own dasharray sets the fraction — `"75 100"` with `rotate-135` is a 270° arc (score 50 → `37.5 100`), `"50 100"` with `rotate-180` is 180° (score 75 → `37.5 100`).
- **`inset-s-1/2` (used to centre the circular/gauge value text) is not defined in any file under `assets/css/`** and is not a Tailwind v4 core utility — core spells the logical inset-inline-start `start-*`. If your build does not generate it, only the `-translate-x-1/2` applies and the label sits half a width to the left. Verify, or use `start-1/2`.
- **Steps has no percentage at all.** In `steps.html` every segment is `w-full` inside a `flex gap-x-1`, so progress is the *count* of `bg-primary` segments; the `aria-valuenow="25"` on each is per-segment, not cumulative. Do not try to drive it with a width.

## Copy-paste base

`examples/base-components/progress/example.html`

```html
<!-- Progress -->
<div class="flex w-full h-1.5 bg-surface-1 rounded-full overflow-hidden" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
  <div class="flex flex-col justify-center rounded-full overflow-hidden bg-primary text-xs text-primary-foreground text-center whitespace-nowrap transition duration-500" style="width: 25%"></div>
</div>
<!-- End Progress -->
```
