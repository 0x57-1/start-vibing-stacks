---
component: links
label: Links
category: layout-and-content
docs: https://preline.co/docs/components/links.html
examples: 8
js: none
tokens: [primary, primary-hover, primary-focus, foreground, foreground-inverse, muted-foreground-1, inverse, line-8, line-5, line-inverse, layer, layer-line, layer-foreground, layer-hover, layer-focus]
---

# Links

Text-link recipes: colour, opacity, underline colour/offset, hover-vs-focus underline, and inline icon alignment — plus one dashed "pill link" that is actually a `<button>`.

## When to use
- Inline navigation inside prose or beside body copy.
- "Learn more →" / "← Back to home" affordances (`working-with-icons.html`).
- **Not** for a primary action — use `buttons` (`examples/base-components/buttons/*.html`); a link that submits or mutates should look and behave like a button.
- **Not** for nav items in a sidebar/navbar — those components ship their own active/hover token set.

## Anatomy

Reduced skeleton (classes copied from `working-with-icons.html` + `underline-offset.html`):

```html
<!-- plain themed link: colour token + underline as the affordance -->
<a class="text-primary underline underline-offset-2 decoration-primary hover:opacity-80 focus:outline-hidden focus:opacity-80" href="#">Label</a>

<!-- icon link: inline-flex + gap-x-1 is what aligns the glyph to the text baseline box -->
<a class="inline-flex items-center gap-x-1 text-sm text-primary decoration-2 hover:underline focus:outline-hidden focus:underline font-medium" href="#">
  Learn more
  <svg class="shrink-0 size-4" …></svg>
</a>
```

Two exclusive idioms in the corpus: **always-underlined + opacity on interaction** (`underline … hover:opacity-80`), or **underline-on-interaction** (`hover:underline focus:underline`). Pick one per link.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| link-opacity | Link opacity | `examples/layout-and-content/links/link-opacity.html` | 9 steps `opacity-90 … opacity-10` on `text-primary hover:text-primary-hover`; underline only on hover/focus |
| link-opacity-on-hover | Link opacity | `examples/layout-and-content/links/link-opacity-on-hover.html` | Same ladder plus a second `hover:opacity-*` — resting and hover opacity differ per row (some go darker, some lighter) |
| underline-color | Underline color | `examples/layout-and-content/links/underline-color.html` | Constant `text-primary`, `decoration-*` varies: `line-8`, `line-5`, `primary-hover`, `teal-500`, `red-500`, `yellow-500`, `line-inverse` |
| underline-offset | Underline offset | `examples/layout-and-content/links/underline-offset.html` | `underline-offset-{1,2,4,8}` with `decoration-primary` |
| hover-variants | Hover variants | `examples/layout-and-content/links/hover-variants.html` | No resting underline: `hover:underline hover:decoration-*` + `focus:underline focus:decoration-*` |
| colored-links | Colored links | `examples/layout-and-content/links/colored-links.html` | Text and decoration move together: `foreground`, `muted-foreground-1`, `primary`, `teal-500`, `red-500`, `yellow-500`, `foreground-inverse`+`line-inverse` |
| white | Pill sizes | `examples/layout-and-content/links/white.html` | Dashed pill in 3 paddings (`py-1.5 px-2` / `py-2 px-3` / `py-2.5 px-3`) on the `layer` token family — and it is a `<button>`, not an `<a>` |
| working-with-icons | Working with icons | `examples/layout-and-content/links/working-with-icons.html` | Leading chevron (`text-foreground hover:text-primary-hover focus:text-primary-focus`) and trailing chevron (`text-primary decoration-2 hover:underline`) |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `primary` (`text-primary`, `decoration-primary`) | Default link colour and matching underline | `gray-800` | `white` |
| `primary-hover` (`hover:text-primary-hover`) | Pointer-hover text colour; also used as an underline colour in `underline-color.html` | `gray-900` | `neutral-300` |
| `primary-focus` (`focus:text-primary-focus`) | Keyboard-focus text colour (icon link only) | `gray-900` | `neutral-300` |
| `foreground` (`text-foreground`, `decoration-foreground`) | Link that must read as body copy until hovered (back-link in `working-with-icons.html`; the "Dark underline" row of `colored-links.html`) | `gray-800` | `neutral-200` |
| `muted-foreground-1` (`text-muted-foreground-1`) | De-emphasised "secondary" link + its underline | `gray-600` | `neutral-400` |
| `foreground-inverse` (`text-foreground-inverse`) | Link text on a dark/photo surface | `white` | `white` |
| `inverse` (`focus:decoration-inverse`) | Appears once, in `hover-variants.html` — see Gotchas, it is almost certainly wrong | `gray-800` | `neutral-950` |
| `line-8` (`decoration-line-8`) | Strongest underline rule ("dark underline") | `gray-800` | `neutral-100` |
| `line-5` (`decoration-line-5`) | Mid-weight underline rule ("secondary underline") | `gray-500` | `neutral-400` |
| `line-inverse` (`decoration-line-inverse`) | Underline on a dark/photo surface | `white` | `white` |
| `layer` (`bg-layer`) | Pill resting fill | `white` | `neutral-800` |
| `layer-line` (`border-layer-line`) | Pill dashed border | `gray-200` | `neutral-700` |
| `layer-foreground` (`text-layer-foreground`) | Pill label + icon (`stroke="currentColor"`) | `gray-800` | `white` |
| `layer-hover` (`hover:bg-layer-hover`) | Pill hover fill | `gray-50` | `neutral-700` |
| `layer-focus` (`focus:bg-layer-focus`) | Pill keyboard-focus fill (same value as hover) | `gray-50` | `neutral-700` |

## Behaviour (JS)

Static markup only -- no Preline JS. Every state is a CSS variant (`hover:`, `focus:`, `disabled:`).

## Gotchas

- **Under moon there is no accent hue: `primary` = `gray-800` in light and `white` in dark** — identical to `foreground` in light mode (`gray-800`). A `text-primary` link is *the same colour as the paragraph around it*. Underline, weight, or an icon is the only thing that marks it as a link; a colour-only link is invisible. This is a moon property, not a Preline one.
- **`focus:outline-hidden` is on every single example.** It removes the browser focus ring, so the paired `focus:` style (`focus:underline`, `focus:opacity-80`, `focus:bg-layer-focus`) is load-bearing for keyboard a11y. Delete one and you ship an unfocusable-looking link.
- **`hover-variants.html` last row is inconsistent:** `hover:decoration-line-inverse` but `focus:decoration-inverse`. `line-inverse` is `white`/`white`; `inverse` is `gray-800`/`neutral-950`. Tabbing to that link flips its underline to near-black. Write `focus:decoration-line-inverse`.
- **`underline-color.html` paints the "Primary underline" with `decoration-primary-hover`, not `decoration-primary`** — while `colored-links.html` and `underline-offset.html` use `decoration-primary`. Both are valid tokens with different values (`gray-900` vs `gray-800` light; `neutral-300` vs `white` dark). Pick deliberately; a "primary" underline that is one step off the text reads as a rendering bug.
- **`text-primary` ≠ `text-primary-800`.** `resources/css/themes/theme.css` registers *both* the semantic token (`--color-primary: var(--primary)`) and a full palette scale (`--color-primary-50 … --color-primary-950`). Under moon, `--primary` resolves through `--color-primary-800 → --color-gray-800` in light and `--color-white` in dark — so `text-primary-800` is pinned to the palette and does **not** invert, while `text-primary` does.
- **`white.html` is misnamed twice.** Its slug says "white", its `section` says "Pill sizes", and its markup is three `<button type="button">` elements — no `<a>`, no `href`. Do not `cat` it expecting a link. If you need this shape as navigation, swap to `<a href>` and drop `disabled:opacity-50 disabled:pointer-events-none` (anchors cannot be disabled).
- **The two interaction systems are already stacked, and they compound.** Both `link-opacity*.html` files put the colour swap (`hover:text-primary-hover`) and the opacity ladder on the *same* anchor — the "different files" split is between those two and `underline-color` / `underline-offset` / `colored-links`, which use `hover:opacity-80` with no colour swap. Under moon the swap is nearly free (`primary` `gray-800` → `primary-hover` `gray-900`), so opacity carries the whole hover signal, and a link that rests at `opacity-40` and hovers to `opacity-60` never reaches full contrast at any point.
- **`link-opacity-on-hover.html` changes hover *direction* halfway down.** The first five rows fade (`opacity-90 hover:opacity-70`, `80→60`, `70→60`, `60→40`, `50→30`); the last four **gain** opacity (`40→60`, `30→50`, `20→40`, `10→30`). Higher `opacity-*` = more opaque, so the bottom rows get stronger on hover while the top rows get weaker. Copying a row without reading its pair ships whichever direction you happened to land on.
- **`decoration-2` sets underline thickness, not colour** — it appears with `hover:underline` in `link-opacity*.html` and `working-with-icons.html`. It has no effect until an `underline` is actually applied by some variant.
- **Icon links need `inline-flex items-center gap-x-1` on the anchor and `shrink-0 size-4` on the `<svg>`.** Without `shrink-0` the glyph squashes when the label wraps; the SVG inherits colour via `stroke="currentColor"`, so recolouring the link recolours the icon automatically.

## Copy-paste base

`examples/layout-and-content/links/working-with-icons.html`

```html
<p>
  <a class="inline-flex items-center gap-x-1 text-sm text-foreground hover:text-primary-hover focus:outline-hidden focus:text-primary-focus" href="#">
    <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    Back to home
  </a>
</p>

<p>
  <a class="inline-flex items-center gap-x-1 text-sm text-primary decoration-2 hover:underline focus:outline-hidden focus:underline font-medium" href="#">
    Learn more
    <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
  </a>
</p>
```
