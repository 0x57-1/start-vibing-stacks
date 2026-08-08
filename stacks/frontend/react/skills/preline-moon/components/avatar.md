---
component: avatar
label: Avatar
category: base-components
docs: https://preline.co/docs/components/avatar.html
examples: 15
js: none — displaying-a-tooltip borrows HSTooltip
tokens: [layer, surface, surface-3, surface-4, foreground-inverse, layer-line, layer-foreground, muted-foreground, foreground, muted-foreground-1]
---

# Avatar

A fixed-size square or circle holding a photo, an initials chip, a generic person glyph or a brand mark, optionally badged with a status dot.

## When to use
- Identity next to a name: list rows, comment headers, member tables, the `media.html` object pattern.
- Fall back down the ladder when data is missing: photo → initials (`placeholder-initials.html`) → glyph (`placeholder-icon.html`). Photo and initials share the ladder `size-8 / 9.5 / 11 / 15.5`; the glyph's smallest step is `size-6`, so pin the size yourself rather than copying its first chip into a row.
- Use the status dot only when presence is real state. `bg-surface-3` is the "offline/unknown" fill and it is the only status colour that is themed.
- Do NOT use an avatar as a button; wrap it (`displaying-a-tooltip.html` wraps it in an `<a>`) rather than styling it as a control.

## Anatomy

Reduced skeleton. Every class below appears verbatim in the example files.

```html
<!-- Bare avatar: size ladder is size-8 | size-9.5 | size-11 | size-15.5 -->
<img class="inline-block size-11 rounded-full" src="…" alt="Avatar">

<!-- With status: the wrapper must be relative inline-block -->
<div class="relative inline-block">
  <img class="inline-block size-11 rounded-full" src="…" alt="Avatar">
  <!-- ring-2 ring-layer fakes a cut-out in the avatar edge -->
  <span class="absolute bottom-0 inset-e-0 block size-3 rounded-full ring-2 ring-layer bg-teal-400"></span>
</div>

<!-- Initials chip: centring needs inline-flex, not inline-block -->
<span class="inline-flex items-center justify-center size-11 rounded-full font-semibold bg-surface-4 text-foreground-inverse">
  AC
</span>
```

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| `circular-avatars` | Circular avatars | `examples/base-components/avatar/circular-avatars.html` | `rounded-full`, ladder `size-8/9.5/11/15.5`, no wrapper |
| `rounded-avatars` | Rounded avatars | `examples/base-components/avatar/rounded-avatars.html` | Same ladder with `rounded-lg` |
| `circular-avatars-with-top-status` | Circular avatars with top status | `examples/base-components/avatar/circular-avatars-with-top-status.html` | `absolute top-0 inset-e-0` dot, **no translate** (circle keeps it on the edge) |
| `rounded-avatars-with-top-status` | Rounded avatars with top status | `examples/base-components/avatar/rounded-avatars-with-top-status.html` | Adds `transform -translate-y-1/2 translate-x-1/2` to clear the square corner |
| `circular-avatars-with-bottom-status` | Circular avatars with bottom status | `examples/base-components/avatar/circular-avatars-with-bottom-status.html` | `absolute bottom-0 inset-e-0`, no translate |
| `rounded-avatars-with-bottom-status` | Rounded avatars with bottom status | `examples/base-components/avatar/rounded-avatars-with-bottom-status.html` | Adds `transform translate-y-1/2 translate-x-1/2` |
| `avatar-with-brand-icons` | Avatars with brand icons | `examples/base-components/avatar/avatar-with-brand-icons.html` | Badge is `absolute bottom-0 inset-e-0 block p-2 rounded-full transform translate-y-1/2 translate-x-1/2 bg-layer` holding a `shrink-0 size-5` SVG — note the translate is applied on BOTH the `rounded-lg` and the `rounded-full` avatar here, unlike the status dot. First icon is themed via `class="fill-foreground"` on its paths, second keeps Slack's literal `fill="#E01E5A"` / `#36C5F0` / `#2EB67D` / `#ECB22E` |
| `placeholder-icon` | Placeholder icon | `examples/base-components/avatar/placeholder-icon.html` | `inline-block size-6 bg-surface rounded-full overflow-hidden` + `size-full text-muted-foreground` glyph whose backing `<rect>` carries `class="fill-layer"`. Ladder is `6 / 9.5 / 11 / 15.5` — the one file that does NOT start at `size-8` |
| `placeholder-initials` | Placeholder initials | `examples/base-components/avatar/placeholder-initials.html` | `bg-surface-4 text-foreground-inverse`; type scales `text-xs` → `text-sm` → (default) → `text-lg` with the ladder |
| `color-variants` | Solid color variants | `examples/base-components/avatar/color-variants.html` | 7 solid chips: `secondary`, `surface-4`, green-500, `primary`, red-500, yellow-500, `plain` |
| `soft-color-variants` | Soft color variants | `examples/base-components/avatar/soft-color-variants.html` | Tinted chips; brand hues carry `dark:bg-*-500/20 dark:text-*-400`, the semantic ones (`surface`, `muted`) do not |
| `outline-color-variants` | Outline color variants | `examples/base-components/avatar/outline-color-variants.html` | `border` + matching `text-*`, no fill; uses `line-8`, `line-5`, `line-inverse` |
| `white-color-variants` | White color variants | `examples/base-components/avatar/white-color-variants.html` | `bg-layer border border-layer-line text-layer-foreground shadow-2xs` across the whole ladder |
| `displaying-a-tooltip` | Avatar with tooltip | `examples/base-components/avatar/displaying-a-tooltip.html` | `hs-tooltip` wrapper → `hs-tooltip-toggle` anchor holding img + status dot + `hs-tooltip-content` |
| `media` | Media object | `examples/base-components/avatar/media.html` | `flex items-center gap-3`, `shrink-0` on the img, `grow` text block with `text-foreground` name + `text-muted-foreground-1` email |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` | Status-dot ring (`ring-layer`) and the brand-icon puck fill; also the glyph's backing `fill-layer` | `white` | `neutral-800` |
| `surface` | Placeholder-glyph chip fill; soft neutral chip | `gray-100` | `neutral-700` |
| `surface-3` | The "offline/unknown" status dot — the only themed status colour | `gray-400` | `neutral-600` |
| `surface-4` | Initials chip fill; grey solid chip | `gray-500` | `neutral-500` |
| `surface-foreground` | Label on the soft neutral chip | `gray-800` | `neutral-200` |
| `muted` | Second soft chip fill | `gray-50` | `neutral-800` |
| `muted-foreground` | Placeholder person glyph stroke/fill | `gray-500` | `neutral-500` |
| `muted-foreground-1` | Media-object secondary line; quiet outline/soft chip text | `gray-600` | `neutral-400` |
| `foreground` | Media-object name; themed brand-icon path (`fill-foreground`); strong outline chip text | `gray-800` | `neutral-200` |
| `foreground-inverse` | Initials on a coloured chip — white in BOTH modes | `white` | `white` |
| `layer-line` | White-variant chip border | `gray-200` | `neutral-700` |
| `layer-foreground` | White-variant chip label | `gray-800` | `white` |
| `primary` | Primary solid + outline chip | `gray-800` | `white` |
| `primary-foreground` | Label on the primary solid chip | `white` | `neutral-800` |
| `primary-100` | Soft primary chip fill (light mode) | `gray-100` | `neutral-100` |
| `primary-800` | Soft primary chip label (light mode) | `gray-800` | `neutral-800` |
| `primary-500` | Its dark-mode fill tint (`dark:bg-primary-500/20`) | `gray-500` | `neutral-500` |
| `primary-400` | Its dark-mode label (`dark:text-primary-400`) | `gray-400` | `neutral-400` |
| `secondary` | Second solid chip fill | `gray-900` | `white` |
| `secondary-foreground` | Its label | `white` | `neutral-800` |
| `plain` | `bg-plain` solid chip and `bg-plain/10` soft chip | `white` | `neutral-800` |
| `inverse` | Label on the `bg-plain` chip | `gray-800` | `neutral-950` |
| `line-8` | Strong outline chip border | `gray-800` | `neutral-100` |
| `line-5` | Quiet outline chip border | `gray-500` | `neutral-400` |
| `line-inverse` | On-dark outline chip border — white in BOTH modes | `white` | `white` |
| `tooltip` | Tooltip fill | `gray-900` | `white` |
| `tooltip-line` | Tooltip border | `transparent` | `transparent` |
| `tooltip-foreground` | Tooltip label | `white` | `neutral-800` |

## Behaviour (JS)

Static markup only -- no Preline JS. One exception inside an example: `displaying-a-tooltip.html` uses `hs-tooltip` / `hs-tooltip-toggle` / `hs-tooltip-content`, driven by `HSTooltip` (`assets/js/preline/tooltip.js`). `HSTooltip.autoInit()` runs on `window.load` and registers every `.hs-tooltip:not(.--prevent-on-load-init)` into `window.$hsTooltipCollection`.

Driving it by hand — the two shapes that actually exist:

| Call | Returns / does |
|---|---|
| `HSTooltip.show(target)` / `HSTooltip.hide(target)` | statics; `target` is an element, a selector string, or an instance |
| `HSTooltip.getInstance(el)` | the tooltip's **root element**, not the instance |
| `HSTooltip.getInstance(el, true)` | the collection record `{ id, element }` — the instance is `.element`, so it is `HSTooltip.getInstance(el, true).element.show()` |
| `HSTooltip.on('show', target, cb)` | registers a callback on the instance |

Instance methods are `show()` / `hide()` / `destroy()`. Configuration is read from CSS custom properties on the `.hs-tooltip` root — `--trigger` (default `hover`), `--placement` (default `top`), `--strategy`, `--prevent-popper` (default `false`), `--scope` (default `parent`) — never from `data-*`. It toggles a `show` class on the root (what `hs-tooltip-shown:` keys off) and dispatches `show.hs.tooltip` / `hide.hs.tooltip`. If no `.hs-tooltip-toggle` child exists the root element becomes the toggle.

## Gotchas
- **The status dot's offset depends on the SHAPE, and getting it wrong is silent.** On a circle (`rounded-full`) the dot sits flush with no transform. On a rounded square (`rounded-lg`) it needs `transform translate-y-1/2 translate-x-1/2` (bottom) or `transform -translate-y-1/2 translate-x-1/2` (top) to clear the corner. Copy the circular markup onto a `rounded-lg` avatar and the dot lands on the person's face.
- **`ring-2 ring-layer` fakes a cut-out, it does not create one.** `layer` is `white` / `neutral-800` — the same value as `card`. On a `bg-card` panel the ring is invisible and the effect works; drop the same avatar on a `bg-surface` strip (`gray-100` / `neutral-700`) and the ring reads as a bright halo.
- **`layer` and `card` are the same colour under moon**, so the brand-icon puck (`bg-layer`) has no edge of its own against a card. Its separation comes from the `p-2` gap plus the avatar underneath it.
- **Status colours are raw Tailwind except one.** `bg-red-400`, `bg-teal-400`, `bg-yellow-400` are literal; only "offline" uses a token (`bg-surface-3`). Do not unify them into tokens — the semantic set does not have an "away"/"busy" pair.
- **`text-foreground-inverse` is white in BOTH light and dark.** It is correct on `bg-surface-4` (initials) and on the coloured solid chips, but the trailing chip of `soft-color-variants.html` (`bg-plain/10 text-foreground-inverse`) and of `outline-color-variants.html` (`border-line-inverse text-foreground-inverse`) are on-dark/on-photo variants: on the default light page they are white on white.
- **`bg-plain text-inverse`** (last chip of `color-variants.html`) is `neutral-800` fill with `neutral-950` initials in dark mode — effectively unreadable.
- **`soft-color-variants.html` splits its dark handling.** Brand hues need explicit `dark:bg-teal-500/20 dark:text-teal-400`; `bg-surface` / `bg-muted` need none because those tokens already flip. Adding `dark:` overrides to the semantic ones double-flips them.
- **The placeholder glyph is coloured twice.** `text-muted-foreground` on the `<svg>` drives `fill="currentColor"` for the person shapes, while the backing `<rect>` overrides its own `fill="currentColor"` with `class="fill-layer"`. Change only the `text-*` and the disc stays `layer`-coloured.
- **`inset-e-0` is not stock Tailwind v4** (stock spells it `end-0`) and is not defined anywhere under `assets/css/` in this skill — it comes from Preline's utility layer. Every status-dot example depends on it.
- **`size-9.5` and `size-15.5` are fractional Tailwind v4 spacing steps.** The ladder is `8 / 9.5 / 11 / 15.5` in eight files (`circular-avatars`, `rounded-avatars`, the four status files, `placeholder-initials`, `white-color-variants`) — but **`placeholder-icon.html` is `6 / 9.5 / 11 / 15.5`**. Drop the glyph fallback next to a photo at the smallest step and it renders two spacing steps short, silently. The colour-variant files and `media.html` pin a single size and ignore the ladder entirely.
- **Centring needs `inline-flex items-center justify-center`.** Photo avatars use `inline-block`; initials chips that keep `inline-block` render the letters top-left.
- **`shrink-0` on the image in `media.html` is load-bearing** — inside a flex row a long name squashes the avatar into an ellipse without it.

## Copy-paste base

`examples/base-components/avatar/media.html`

```html
<!-- Avatar -->
  <div class="flex items-center gap-3">
    <img class="inline-block shrink-0 size-15.5 rounded-full" src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80" alt="Avatar">
    <div class="grow">
      <h3 class="font-semibold text-foreground">Mark Wanner</h3>
      <p class="text-sm font-medium text-muted-foreground-1">mark@gmail.com</p>
    </div>
  </div>
  <!-- End Avatar -->
```
