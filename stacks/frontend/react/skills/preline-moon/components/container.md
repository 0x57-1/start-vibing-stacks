---
component: container
label: Container
category: layout-and-content
docs: https://preline.co/docs/components/container.html
examples: 6
js: none
tokens: []
---

# Container

Core Tailwind utility that caps an element's `max-width` at each breakpoint so page content stops growing on wide screens.

## When to use
- Wrapping page/section content that must line up with the rest of the site's gutters.
- You want a hard max-width that steps at breakpoints. If you want a *single* fixed cap, use `max-w-7xl mx-auto` instead — one utility, no breakpoint stepping.
- NOT a Preline component: it carries no theme tokens and no JS. If you need a themed panel with a background/border, use `card` or `bg-layer border border-layer-line`.
- Do not use it for a full-bleed hero. Put `container` on an inner div and leave the outer section fluid.

## Anatomy
Reduced skeleton — every class below appears verbatim in `examples/layout-and-content/container/static-2.html`:

```html
<div class="container mx-auto px-4">   <!-- container = breakpoint max-widths; mx-auto = centering; px-* = gutter -->
  <!-- page content -->
</div>
```

`container` supplies **only** the max-width. Centering (`mx-auto`) and horizontal padding (`px-*`) are separate utilities — which is exactly why the doc has "Centering by default" and "Adding horizontal padding" customization sections that redefine the utility.

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| Centered | Using the container | `examples/layout-and-content/container/static-1.html` | `container mx-auto` — max-width + manual centering, no gutter |
| Centered + gutter | Using the container | `examples/layout-and-content/container/static-2.html` | adds `px-4`, so content never touches the viewport edge on small screens |
| Breakpoint-gated | Responsive variants | `examples/layout-and-content/container/static-3.html` | `md:container md:mx-auto` — fluid full-width below `md`, capped from `md` up |
| Center by default (CSS) | Centering by default | `examples/layout-and-content/container/static-4.html` | `@utility container { margin-inline: auto }` — bakes centering in so `mx-auto` is no longer needed |
| Fixed gutter (CSS) | Adding horizontal padding | `examples/layout-and-content/container/static-5.html` | `@utility container { padding-inline: 2rem }` — one gutter at all sizes |
| Responsive gutter (CSS) | Adding horizontal padding | `examples/layout-and-content/container/static-6.html` | `--container-padding` re-declared per `@media (min-width: var(--breakpoint-*))`, then consumed by `@utility container` |

## Theme tokens (moon)
None. `container` sets `max-width` only — it emits no color, so nothing in `reference/moon-token-table.md` applies. `index.json` lists `"tokens": {}` for this component. Colour comes from whatever you put inside it.

## Behaviour (JS)
Static markup only -- no Preline JS.

## Gotchas
- **Three of the six "examples" are CSS, not HTML**, despite the `.html` extension: `static-4.html`, `static-5.html` and `static-6.html` contain `@utility container { … }` blocks. Do not paste them into a template — they belong in the stylesheet next to your Preline imports.
- **`container` does not center and has no padding on its own.** Shipping `<div class="container">` alone leaves content flush left with zero gutter. Every HTML example in this component pairs it with `mx-auto`.
- The `@utility container` overrides in `static-4/5/6` are **global** — they change every `container` in the app, including Preline-supplied markup you paste later. Prefer `mx-auto px-4` at the call site unless you deliberately want the project-wide default.
- `static-6.html` reads `var(--breakpoint-sm)` etc. inside `@media (min-width: …)`. Those `--breakpoint-*` vars must exist in the theme layer; the fork in `assets/css/project-moon.css` defines colour tokens only, so breakpoint vars come from the Tailwind theme, not from moon.
- `md:container` only turns the utility on from `md` up — it does **not** change which breakpoint's max-width is used. Below `md` the element is fluid.
- Nesting a `container` inside another `container` compounds gutters (`px-4` twice). Use one per page shell.

## Copy-paste base
`examples/layout-and-content/container/static-2.html`

```html
<div class="container mx-auto px-4">
<!-- ... -->
</div>
```
