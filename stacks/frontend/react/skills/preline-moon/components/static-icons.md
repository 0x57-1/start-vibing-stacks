---
component: static-icons
label: Styled Icons
category: base-components
docs: https://preline.co/docs/components/static-icons.html
examples: 8
js: none
tokens: [primary, primary-foreground, foreground, foreground-inverse, muted-foreground-1, surface, surface-foreground, layer, layer-line, layer-foreground, line-8, line-5, line-inverse, plain, inverse, secondary, secondary-foreground, primary-100, primary-200, primary-400, primary-500, primary-800, primary-900, surface-1, surface-2, surface-4, muted]
---

# Styled Icons

A decorative `<span>` chip that wraps a single SVG in a sized, coloured, rounded box — the leading glyph for feature blocks, list rows, empty states and stat cards.

## When to use

- A non-interactive glyph that needs a visible container (fill, ring, or halo).
- Leading slot of a card / list row / timeline node / alert.
- **Do not** use for anything clickable — a `<span>` has no focus ring, no `disabled:` handling and no keyboard affordance. Use `button` (icon variant) or `button-group` for toolbars.
- **Do not** use where the icon carries meaning without a text sibling — nothing in these examples exposes an accessible name (see Gotchas).

## Anatomy

Reduced skeleton. Every class below appears in `examples/base-components/static-icons/*.html`.

```html
<span class="inline-flex justify-center items-center size-11 rounded-full bg-primary text-primary-foreground">
  <!--        ^ centering        ^ box size ^ shape  ^ fill        ^ glyph colour (inherited by stroke="currentColor") -->
  <svg class="shrink-0 size-5" ... stroke="currentColor" ...>…</svg>
  <!--        ^ never let flex squash it  ^ glyph size, independent of box size -->
</span>
```

Two independent sizes: the box (`size-*` on the span) and the glyph (`size-*` on the svg). The SVG always carries `fill="none" stroke="currentColor"`, so the span's `text-*` token is what colours the drawing.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Icon styles | Icon styles | `examples/base-components/static-icons/types.html` | The 6 canonical treatments in one file: ghost (`text-primary`), solid (`bg-primary text-primary-foreground`), soft (`bg-primary-100 text-primary-800` + `dark:` pair), soft-outlined (`border-4 border-primary-100 bg-primary-200`), outline (`border border-primary text-primary`), layer (`bg-layer border border-layer-line text-layer-foreground shadow-2xs`) |
| Icon sizes | Icon sizes | `examples/base-components/static-icons/sizes.html` | Box only: `size-9.5` / `size-11` / `size-15.5`. Glyph stays `size-4` on the small one and `size-5` on both larger ones — the largest box does **not** scale its glyph |
| Solid variants | Solid variants | `examples/base-components/static-icons/solid-color-variants.html` | Filled chips: `bg-secondary text-secondary-foreground`, `bg-surface-4 text-foreground-inverse`, `bg-teal-500`/`bg-red-500`/`bg-yellow-500` + `text-foreground-inverse`, `bg-primary text-primary-foreground`, `bg-plain text-inverse` |
| Outline variants | Outline variants | `examples/base-components/static-icons/outline-color-variants.html` | `border` (1px) + no fill; border and text tokens are paired: `border-line-8 text-foreground`, `border-line-5 text-muted-foreground-1`, `border-primary text-primary`, `border-line-inverse text-foreground-inverse`, plus literal `border-teal-500`/`red-500`/`yellow-500` |
| Ghost variants | Ghost variants | `examples/base-components/static-icons/ghost-color-variants.html` | Text token only — no `bg-*`, no `border`: `text-foreground`, `text-muted-foreground-1`, `text-primary`, `text-foreground-inverse`, `text-teal-500`/`red-500`/`yellow-500` |
| Soft variants | Soft variants | `examples/base-components/static-icons/soft-color-variants.html` | Tinted fill: `bg-surface text-surface-foreground`, `bg-muted text-foreground`, `bg-plain/10 text-foreground-inverse`, and palette chips as `bg-X-100 text-X-800 dark:bg-X-500/20 dark:text-X-400` |
| Soft outlined variants | Soft outlined variants | `examples/base-components/static-icons/soft-outlined-color-variants.html` | Adds a `border-4` halo, and its direction differs by family: the token chips ring **darker** than the fill (`border-surface-2` gray-300 over `bg-surface-1` gray-200; `border-surface-2` over `bg-surface` gray-100), the palette chips ring **lighter** (`border-X-100 bg-X-200 text-X-800` + `dark:border-X-500/10 dark:bg-X-500/20 dark:text-X-400`). On-dark chip is `border-line-inverse/10 bg-plain/10 text-foreground-inverse` |
| Circular icons | Circular icons | `examples/base-components/static-icons/circular-icon.html` | Shape only: `rounded-lg` vs `rounded-full` on an otherwise identical `bg-primary text-primary-foreground` chip |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `primary` | solid fill / ghost + outline glyph colour | `gray-800` | `white` |
| `primary-foreground` | glyph on top of `bg-primary` | `white` | `neutral-800` |
| `foreground` | default glyph colour on the page background | `gray-800` | `neutral-200` |
| `foreground-inverse` | glyph on a saturated or dark fill | `white` | `white` |
| `muted-foreground-1` | de-emphasised glyph | `gray-600` | `neutral-400` |
| `surface` | soft resting fill | `gray-100` | `neutral-700` |
| `surface-1` | soft fill under a halo | `gray-200` | `neutral-600` |
| `surface-2` | the `border-4` halo ring | `gray-300` | `neutral-500` |
| `surface-4` | strong neutral solid fill | `gray-500` | `neutral-500` |
| `surface-foreground` | glyph on `surface` / `surface-1` | `gray-800` | `neutral-200` |
| `muted` | lightest soft fill | `gray-50` | `neutral-800` |
| `layer` | card-like chip fill (with border + shadow) | `white` | `neutral-800` |
| `layer-line` | border of the layer chip | `gray-200` | `neutral-700` |
| `layer-foreground` | glyph inside the layer chip | `gray-800` | `white` |
| `line-8` | high-contrast 1px outline | `gray-800` | `neutral-100` |
| `line-5` | mid-contrast 1px outline | `gray-500` | `neutral-400` |
| `line-inverse` | outline for the on-dark chip | `white` | `white` |
| `plain` | `bg-plain` solid, `bg-plain/10` soft | `white` | `neutral-800` |
| `inverse` | glyph on `bg-plain` | `gray-800` | `neutral-950` |
| `secondary` | alternate solid fill | `gray-900` | `white` |
| `secondary-foreground` | glyph on `bg-secondary` | `white` | `neutral-800` |
| `primary-100` | soft fill (light) / halo ring | `gray-100` | `neutral-100` |
| `primary-200` | soft-outlined fill | `gray-200` | `neutral-200` |
| `primary-400` | glyph in the `dark:` soft override | `gray-400` | `neutral-400` |
| `primary-500` | `/20` tint base in the `dark:` soft override | `gray-500` | `neutral-500` |
| `primary-800` | glyph on soft fill (light) | `gray-800` | `neutral-800` |
| `primary-900` | soft fill in `types.html`'s `dark:` override | `gray-900` | `neutral-900` |

## Behaviour (JS)

Static markup only -- no Preline JS.

## Gotchas

- **The `primary-N` ramp does not invert under moon.** `primary-100` is `gray-100` in light and `neutral-100` in dark — still a *light* colour. `primary-800` is `gray-800` / `neutral-800` — still dark. So `bg-primary-100 text-primary-800` renders the same light-on-dark-text chip in dark mode and disappears against a dark page. That is exactly why every soft example carries an explicit `dark:` pair. Copy it or the chip breaks: `types.html` uses `dark:bg-primary-900 dark:text-primary-400`, `soft-color-variants.html` uses `dark:bg-primary-500/20 dark:text-primary-400`. Two different dark treatments ship for the same "soft" idea — pick one per project and stay consistent.
- **`foreground-inverse` is `white` in BOTH modes.** It is only correct on a saturated or dark fill (`bg-red-500`, `bg-surface-4`, `bg-plain/10`). Put it on a light chip and the glyph vanishes in light mode with no warning.
- **`primary` / `primary-foreground` DO invert** (`gray-800`↔`white`, `white`↔`neutral-800`), so `bg-primary text-primary-foreground` is the one solid pair that needs no `dark:` variant. Do not "fix" it by adding one.
- **No accessible name anywhere.** Not one of the 8 files has `aria-hidden`, `role="img"`, `<title>` or an `sr-only` label. If the glyph is decorative next to visible text, add `aria-hidden="true"` to the `<svg>`; if it is the only content, it needs a name. (Contrast with `file-uploading-progress-form`, whose status icons all pair with `<span class="sr-only">`.)
- **`shrink-0` on the SVG is load-bearing** — the wrapper is `inline-flex`, so without it a long-name sibling in a shared flex row squashes the glyph into an ellipse.
- **Box size and glyph size are independent and Preline's own file is inconsistent**: `sizes.html` gives `size-15.5` (largest box) the same `size-5` glyph as `size-11`. If you want proportional scaling you must set the inner `size-*` yourself.
- `size-9.5` / `size-15.5` rely on Tailwind 4's dynamic spacing scale. They will not resolve under a Tailwind 3 config.
- Palette accents (`teal-500`, `red-500`, `yellow-500`) are raw Tailwind colours, not tokens — they are identical across all Preline themes and will not follow a theme swap.

## Copy-paste base

`examples/base-components/static-icons/circular-icon.html` (first block, verbatim):

```html
<!-- Icon -->
<span class="inline-flex justify-center items-center size-11 rounded-lg bg-primary text-primary-foreground">
  <svg class="shrink-0 size-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
</span>
<!-- End Icon -->
```
