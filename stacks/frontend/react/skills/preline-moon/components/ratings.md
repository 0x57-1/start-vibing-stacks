---
component: ratings
label: Ratings
category: base-components
docs: https://preline.co/docs/components/ratings.html
examples: 6
js: none
tokens: [muted-foreground, foreground, layer, layer-line, layer-foreground, layer-hover, layer-focus, muted-hover, muted-focus]
---

# Ratings

A row of symbols (stars, hearts, emoji) or two thumb buttons used to display a score or collect one.

## When to use
- Displaying an existing score read-only (`static-example`) or collecting a 1-5 score in a form (`basic-usage`).
- Binary "was this helpful?" feedback — use `rate-with-thumb-buttons`, not a 5-star row.
- **Not** when the value must round-trip through a form without JS unless you use `basic-usage`: it is the only variant backed by real `<input type="radio">`. The button variants have no value and no name.
- For a score shown inside a card header or table cell, prefer `static-example` (plain `<svg>`s, zero inputs) over a disabled radio group.

## Anatomy

Reduced skeleton of the radio variant (classes verbatim from `examples/base-components/ratings/basic-usage.html`):

```html
<!-- flex-row-reverse is load-bearing: it makes ~ sibling fill work right-to-left -->
<div class="flex flex-row-reverse justify-end items-center">
  <!-- one input+label pair per star, value ascending in DOM order -->
  <input id="hs-ratings-readonly-1" type="radio" name="hs-ratings-readonly" value="1"
         class="peer -ms-5 size-5 bg-transparent border-0 text-transparent cursor-pointer appearance-none checked:bg-none focus:bg-none focus:ring-0 focus:ring-offset-0">
  <label for="hs-ratings-readonly-1"
         class="peer-checked:text-yellow-400 text-muted-foreground/50 pointer-events-none dark:peer-checked:text-yellow-600">
    <svg class="shrink-0 size-5" …>…star path…</svg>
  </label>
  <!-- …repeat for values 2..5… -->
</div>
```

Button variants are simpler — a flat `<div class="flex items-center">` of `<button type="button">`, filled ones coloured and the trailing one `text-muted-foreground/50 hover:text-…`.

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| `basic-usage` | Basic usage | `examples/base-components/ratings/basic-usage.html` | The only form-backed variant: 5 real radios (`name="hs-ratings-readonly"`, `value` 1-5), each immediately followed by its `<label>`. Wrapper is `flex flex-row-reverse justify-end items-center`; every label class is verbatim `peer-checked:text-yellow-400 text-muted-foreground/50 pointer-events-none dark:peer-checked:text-yellow-600`. |
| `button-example` | Star buttons | `examples/base-components/ratings/button-example.html` | 5 `<button type="button">`, filled class `size-5 inline-flex justify-center items-center text-2xl rounded-full text-yellow-400 disabled:opacity-50 disabled:pointer-events-none dark:text-yellow-500`; the trailing empty one swaps that colour pair for `text-muted-foreground/50 hover:text-yellow-400`. No name/value — you wire clicks yourself. |
| `custom-symbol-with-button` | Heart buttons | `examples/base-components/ratings/custom-symbol-with-button.html` | Same button shell, heart path instead of star, filled `text-red-500 disabled:opacity-50 disabled:pointer-events-none dark:text-red-500`, empty `text-muted-foreground/50 hover:text-red-500`. Proof the symbol is just the `<svg>` path. |
| `static-example` | Static rating | `examples/base-components/ratings/static-example.html` | No inputs, no buttons — five bare `<svg class="shrink-0 size-5 …">`, filled `text-yellow-400 dark:text-yellow-600`, empty `text-muted-foreground/50`. Read-only display. |
| `rate-with-emoji` | Emoji rating | `examples/base-components/ratings/rate-with-emoji.html` | 3 `size-10` round buttons whose content is a literal emoji character; interaction shown by fill, not colour: `hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus`. Wrapped in `text-center` with an `<h3 class="text-foreground">` prompt. |
| `rate-with-thumb-buttons` | Thumb feedback | `examples/base-components/ratings/rate-with-thumb-buttons.html` | Two labelled `bg-layer border border-layer-line text-layer-foreground shadow-2xs` buttons (Yes / No) with thumbs-up/down icons — a standard secondary-button pair, not a symbol row. |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `muted-foreground` | Unfilled symbol, always at 50% (`text-muted-foreground/50`) | `gray-500` | `neutral-500` |
| `foreground` | Prompt heading above the row (`<h3 class="text-foreground">`) | `gray-800` | `neutral-200` |
| `muted-hover` | Emoji button hover fill (`hover:bg-muted-hover`) | `gray-100` | `neutral-700` |
| `muted-focus` | Emoji button focus fill (`focus:bg-muted-focus`) | `gray-100` | `neutral-700` |
| `layer` | Thumb button resting fill | `white` | `neutral-800` |
| `layer-line` | Thumb button border | `gray-200` | `neutral-700` |
| `layer-foreground` | Thumb button label + icon colour | `gray-800` | `white` |
| `layer-hover` | Thumb button hover fill | `gray-50` | `neutral-700` |
| `layer-focus` | Thumb button focus fill | `gray-50` | `neutral-700` |

The filled symbol colours (`yellow-400` / `yellow-600` / `red-500`) are **raw Tailwind palette, not moon tokens** — they are identical under every theme.

## Behaviour (JS)

Static markup only -- no Preline JS. `index.json` reports `hs_attrs: []` and `hs_js: []` for all six examples; the radio variant is pure CSS (`peer` + `peer-checked:`), the rest are inert buttons you must handle yourself.

## Gotchas
- **`flex-row-reverse` is the whole mechanism.** `peer-checked:` compiles to a *general sibling* (`~`) selector, so it can only reach elements that come **after** the checked input in the DOM: checking input 3 colours labels 3, 4 and 5. `flex-row-reverse` paints DOM order right-to-left, so label 5 is leftmost and those three land as the leftmost three stars. Swap to plain `flex-row` and a 3-star rating fills stars 3-5 on the right instead of 1-3 on the left.
- **`-ms-5` on the input is what makes the star clickable.** The 20 px radio is pulled back over its own 20 px label; the label carries `pointer-events-none` so every click lands on the input. Drop `-ms-5` and each star gets a 20 px *invisible* dead gap beside it — the input never covers the star, and `pointer-events-none` on the label leaves the star itself unclickable. It is invisible rather than a native radio because the input already carries `bg-transparent border-0 text-transparent cursor-pointer appearance-none`.
- **The radio group is named `hs-ratings-readonly` and the ids are `hs-ratings-readonly-N`.** These are page-global. Rendering two rating rows on one page without renaming makes them one mutually-exclusive group and breaks every `for=`/`id=` pair.
- **`checked:bg-none focus:bg-none focus:ring-0 focus:ring-offset-0` are neutralising a Tailwind Forms plugin**, not decoration. Remove them and the checked radio paints its default SVG background dot over the star.
- **Filled stars are hardcoded yellow with an inconsistent dark value across variants**: `dark:text-yellow-600` in `basic-usage` and `static-example`, `dark:text-yellow-500` in `button-example`. Pick one before mixing the two on the same screen.
- **`text-muted-foreground/50` — the slash is an opacity modifier on the token**, not a separate token. Under moon `muted-foreground` is `gray-500` / `neutral-500`, so the empty state is a 50%-opacity mid grey in *both* modes; on a `bg-surface` panel it nearly vanishes. Raise to `/70` rather than swapping the token.
- **There is no accessible name anywhere.** No `aria-label`, no `<legend>`, no `role="radiogroup"`; the button variants are five identical unlabelled buttons. Add `aria-label="Rate N out of 5"` per control — nothing in these files does it for you.
- **`rate-with-thumb-buttons` is a button pair, not a rating widget.** It shares nothing with the other five except the doc page; copy it from the `button` component's token set mentally (`layer*`), not from the star row.

## Copy-paste base

Verbatim and complete, from `examples/base-components/ratings/static-example.html` — the smallest correct example: 5 stars, 3 filled, read-only.

```html
<!-- Rating -->
<div class="flex items-center">
  <svg class="shrink-0 size-5 text-yellow-400 dark:text-yellow-600" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
  </svg>
  <svg class="shrink-0 size-5 text-yellow-400 dark:text-yellow-600" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
  </svg>
  <svg class="shrink-0 size-5 text-yellow-400 dark:text-yellow-600" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
  </svg>
  <svg class="shrink-0 size-5 text-muted-foreground/50" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
  </svg>
  <svg class="shrink-0 size-5 text-muted-foreground/50" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
  </svg>
</div>
<!-- End Rating -->
```
