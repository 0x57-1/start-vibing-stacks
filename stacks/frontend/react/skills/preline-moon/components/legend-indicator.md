---
component: legend-indicator
label: Legend Indicator
category: base-components
docs: https://preline.co/docs/components/legend-indicator.html
examples: 2
js: none
tokens: [foreground, surface-4, secondary, primary, plain]
---

# Legend Indicator

A small coloured dot paired with a text label, used to map a colour in a chart, map, calendar or status list back to its meaning.

## When to use
- Legends for `charts` / `datamaps`, calendar event types, and any surface where colour alone encodes a category.
- Prefer over `badge` when the label must sit in running text or a legend row: this is an unstyled `inline-flex` pair with no pill background, no padding and no border.
- Use `badge` instead when the item is a *status chip* that should read as a discrete object (background, radius, tighter type).
- Do NOT use it as a live status light — there is no animation, no `aria-live`, and no state attribute.

## Anatomy

Reduced skeleton (all classes appear verbatim in the example files):

```html
<!-- REDUCED SKELETON -->
<div class="inline-flex items-center">
  <span class="size-2 inline-block bg-surface-4 rounded-full me-2"></span>  <!-- dot: inline-block required -->
  <span class="text-foreground">Legend indicator</span>                     <!-- label -->
</div>
```

Swap only the `bg-*` utility to change the swatch. Everything else is fixed across all ten variants.

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| `example` | Default legend indicator | `examples/base-components/legend-indicator/example.html` | The single canonical pair: `bg-surface-4` dot + `text-foreground` label. 4 lines, nothing else. |
| `color-variations` | Legend color variants | `examples/base-components/legend-indicator/color-variations.html` | Ten sibling copies of the same block, differing **only** in the dot's `bg-*`: `secondary` ("Dark"), `surface-4` ("Gray"), `red-500`, `yellow-500`, `green-500`, `primary` ("Blue"), `indigo-500`, `purple-500`, `pink-500`, `plain` ("Light"). Ships as a bare fragment — no wrapper, no gap utility. |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `foreground` | Label text on every variant (`text-foreground`, 11 occurrences — the only text token) | `gray-800` | `neutral-200` |
| `surface-4` | Default / "Gray" swatch fill (`bg-surface-4`) | `gray-500` | `neutral-500` |
| `secondary` | The swatch the docs label "Dark" (`bg-secondary`) | `gray-900` | `white` |
| `primary` | The swatch the docs label "Blue" (`bg-primary`) | `gray-800` | `white` |
| `plain` | The swatch the docs label "Light" (`bg-plain`) | `white` | `neutral-800` |

The six remaining swatches are literal palette classes (`bg-red-500`, `bg-yellow-500`, `bg-green-500`, `bg-indigo-500`, `bg-purple-500`, `bg-pink-500`) and are therefore identical in both themes.

## Behaviour (JS)
Static markup only -- no Preline JS. `index.json` reports `hs_attrs: []` and `hs_js: []` for both examples.

## Gotchas
- **The doc colour names are lies under moon.** `bg-primary` — labelled "Blue" in the example — reads `--primary`, which resolves through `--color-primary-800` → `gray-800` in light, but in dark moon sets `--primary` straight to `white`; it does *not* go through `--color-primary-800`, which is `neutral-800` in dark. It is never blue on this theme. Same for "Dark"/"Light", which invert: `plain` is `white` in light mode and `neutral-800` in dark.
- **Two legend entries collide.** "Dark" (`secondary`) and "Blue" (`primary`) are `gray-900` vs `gray-800` in light, and **both exactly `white`** in dark. If you paste `color-variations.html` as a real legend, those two rows are visually indistinguishable in dark mode and near-identical in light. Pick one, or use literals.
- **The "Light" swatch is invisible on a light page.** `bg-plain` is `white` in light mode with no ring or border in the markup. Add a `border` yourself or drop the variant.
- **For an actual chart legend, use the `chart-*` tokens, not `primary`/`secondary`.** Note even those flip: `chart-1` is `gray-50`→`neutral-800`, `chart-4` is `gray-950`→`white`. `chart-5` (`slate-400`) and `chart-6` (`zinc-500`) are the only ones identical in both themes. Whatever you pick, the swatch class must be the same value the chart library paints the series with — nothing here reads from the chart config.
- **`inline-block` on the dot is load-bearing.** A bare `<span>` is inline and ignores `size-2`; without it the dot collapses to zero width and only the `me-2` gap survives.
- **`color-variations.html` is a fragment, not a component.** Ten root-level `<div>`s with no parent and no `gap`. Wrap them yourself (e.g. a `flex flex-wrap` container) — pasted raw they run together with no spacing between entries.
- **`me-2` is logical**, so the gap flips to the left of the dot under `dir="rtl"`. Do not swap it for `mr-2`.
- **Colour-only encoding.** The dot carries no text alternative; accessibility survives here only because the adjacent `<span>` label is the real signal. Never ship the dot without its label, and never rely on hue alone to separate two entries (see the `primary`/`secondary` collision above).

## Copy-paste base

`examples/base-components/legend-indicator/example.html`

```html
<div class="inline-flex items-center">
  <span class="size-2 inline-block bg-surface-4 rounded-full me-2"></span>
  <span class="text-foreground">Legend indicator</span>
</div>
```
