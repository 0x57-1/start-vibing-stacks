---
component: card
label: Cards
category: base-components
docs: https://preline.co/docs/components/card.html
examples: 23
js: none — panel-actions borrows HSTooltip
tokens: [card, card-line, foreground, muted-foreground-1, primary, primary-hover, primary-focus, surface, card-header, card-divider, card-footer, layer]
---

# Cards

A bordered, elevated container that groups a title, body copy and one action; the base surface every dashboard panel in this design system is built on.

## When to use
- Any self-contained block of content on a page background: stats panel, form section, empty state, list container.
- Use `card-group.html` (border/shadow on the WRAPPER) when several cards must share one outline and equal heights — not three separate cards in a flex row.
- Do NOT use a card for a floating layer: dropdowns, popovers and modals have their own token families (`dropdown-*`, `popover-*`, `overlay-*`) that a card's `card-*` tokens will not track.
- Do NOT nest a card inside a card. `card` and `layer` resolve to the same colour under moon (see Gotchas) so the inner one is invisible except for its border.

## Anatomy

Reduced skeleton. Every class below appears verbatim in the example files.

```html
<!-- root: carries surface + border + radius + elevation -->
<div class="flex flex-col bg-card border border-card-line shadow-2xs rounded-xl">

  <!-- optional header strip: bg-surface + bottom rule + matching top radius -->
  <div class="bg-surface border-b border-card-line rounded-t-xl py-3 px-4">…</div>

  <!-- body: padding is the ONLY size knob (p-3 | p-4 | p-4 sm:p-6) -->
  <div class="p-4">
    <h3 class="font-semibold text-foreground">…</h3>
    <p class="mt-1 text-muted-foreground-1">…</p>
  </div>

  <!-- optional footer strip: mirror of the header -->
  <div class="bg-surface border-t border-card-line rounded-b-xl py-3 px-4">…</div>
</div>
```

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| `basic-usage` | Default card | `examples/base-components/card/basic-usage.html` | Top image + body + solid primary `<a>` button |
| `content-types` | Body | `examples/base-components/card/content-types.html` | Body only: root + one `p-4` div + one `<p>` |
| `simple-card` | Simple card | `examples/base-components/card/simple-card.html` | Adds a `mt-1 text-xs font-medium uppercase text-muted-foreground-1` subtitle + the chevron "Card link" anchor (`text-primary decoration-2 hover:text-primary-hover hover:underline`) |
| `header-and-footer` | Header and footer | `examples/base-components/card/header-and-footer.html` | Prepends `bg-surface border-b border-card-line rounded-t-xl py-3 px-4` strip |
| `simple-footer-with-a-card` | Footer only | `examples/base-components/card/simple-footer-with-a-card.html` | Same strip appended with `border-t` + `rounded-b-xl` |
| `small-card-size` | Small | `examples/base-components/card/small-card-size.html` | Body padding `p-3` |
| `default-card-size` | Default | `examples/base-components/card/default-card-size.html` | Body padding `p-4` |
| `large-card-size` | Large | `examples/base-components/card/large-card-size.html` | Body padding `p-4 sm:p-6` |
| `navigation` | Navigation | `examples/base-components/card/navigation.html` | `bg-surface` header holds a `<nav>`; active tab is `bg-layer border border-line-2 border-b-transparent` |
| `navigation-with-select-on-mobile` | Navigation with select on mobile | `examples/base-components/card/navigation-with-select-on-mobile.html` | `<select>` under `sm:hidden`, tab row under `hidden sm:block` with `divide-x divide-card-divider`; active tab uses `border-b-2 border-b-primary` |
| `image-placeholder` | Top image | `examples/base-components/card/image-placeholder.html` | `<img class="w-full h-auto rounded-t-xl">` before the body |
| `image-placeholder-bottom` | Bottom image | `examples/base-components/card/image-placeholder-bottom.html` | Same image after the body with `rounded-b-xl` |
| `image-overlays` | Image overlays | `examples/base-components/card/image-overlays.html` | Root becomes `relative`, image `rounded-xl`, body `absolute top-0 inset-s-0 inset-e-0` |
| `image-scaling-animation-on-hover` | Image scaling animation on hover | `examples/base-components/card/image-scaling-animation-on-hover.html` | Root `<a class="flex flex-col group bg-card … overflow-hidden hover:shadow-lg focus:outline-hidden focus:shadow-lg transition">`, img `group-hover:scale-105 group-focus:scale-105 transition-transform duration-500 ease-in-out` inside a `relative pt-[50%] sm:pt-[60%] lg:pt-[80%]` box |
| `transition-on-hover` | Transition on hover | `examples/base-components/card/transition-on-hover.html` | Root is `<a>` with `hover:shadow-lg focus:outline-hidden focus:shadow-lg transition` |
| `horizontal` | Horizontal | `examples/base-components/card/horizontal.html` | Root `sm:flex`; image column adds `sm:rounded-s-xl` + `sm:rounded-se-none` on a `pt-[40%]` aspect box |
| `card-group` | Card group | `examples/base-components/card/card-group.html` | Border/shadow/radius move to the wrapper (`grid border border-card-line rounded-xl shadow-2xs divide-y overflow-hidden sm:flex sm:divide-y-0 sm:divide-x divide-card-divider`); children are `flex flex-col flex-1 bg-card`; footers use `border-t border-card-footer` |
| `top-bordered-card` | Top bordered card | `examples/base-components/card/top-bordered-card.html` | Adds `border-t-4 border-t-primary` accent |
| `panel-actions` | Panel actions | `examples/base-components/card/panel-actions.html` | Header `py-3 px-4 flex justify-between items-center border-b border-card-header rounded-t-xl` + three `hs-tooltip` icon buttons, each `hs-tooltip-toggle size-8 … rounded-full text-muted-foreground-1` with `hover:bg-muted-hover` and `focus:bg-muted-focus` |
| `with-avatar` | With alert | `examples/base-components/card/with-avatar.html` | Header `border-card-header` plus an alert strip `bg-surface border-b border-card-divider` between header and body |
| `centered-body-content` | Centered body content | `examples/base-components/card/centered-body-content.html` | `min-h-60` root + body `flex flex-auto flex-col justify-center items-center` |
| `empty-states` | Empty state | `examples/base-components/card/empty-states.html` | Centred `size-10 text-muted-foreground-1` icon + `text-sm text-foreground` message |
| `scrollable-body` | Scrollable body | `examples/base-components/card/scrollable-body.html` | Body `h-80 overflow-y-auto` + `[&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb` |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `card` | Root resting surface (`bg-card`) | `white` | `neutral-800` |
| `card-line` | Root outline + header/footer rule (`border-card-line`) | `gray-200` | `neutral-700` |
| `card-header` | Rule under a header that has NO fill (`border-card-header`) | `gray-200` | `neutral-700` |
| `card-divider` | Rule between stacked bands / between grouped cards | `gray-200` | `neutral-700` |
| `card-footer` | Rule above a footer inside a card group | `gray-200` | `neutral-700` |
| `surface` | Filled header / footer / alert strip (`bg-surface`) | `gray-100` | `neutral-700` |
| `layer` | Raised child inside the card: active tab, nav cell | `white` | `neutral-800` |
| `layer-hover` | Nav cell hover fill | `gray-50` | `neutral-700` |
| `layer-focus` | Nav cell focus fill | `gray-50` | `neutral-700` |
| `line-2` | Tab-row baseline + mobile `<select>` border | `gray-200` | `neutral-700` |
| `foreground` | Card title, alert text | `gray-800` | `neutral-200` |
| `muted-foreground-1` | Body copy, timestamps, inactive tabs, empty-state icon | `gray-600` | `neutral-400` |
| `primary` | Top accent bar, active tab underline, link colour | `gray-800` | `white` |
| `primary-hover` | Link/button hover | `gray-900` | `neutral-300` |
| `primary-focus` | Link/button focus | `gray-900` | `neutral-300` |
| `primary-line` | Transparent border on the solid CTA (box-size parity) | `transparent` | `transparent` |
| `primary-foreground` | Label on the solid CTA | `white` | `neutral-800` |
| `muted-hover` | Panel-action icon button hover fill | `gray-100` | `neutral-700` |
| `muted-focus` | Panel-action icon button focus fill | `gray-100` | `neutral-700` |
| `tooltip` | Panel-action tooltip fill | `gray-900` | `white` |
| `tooltip-line` | Tooltip border | `transparent` | `transparent` |
| `tooltip-foreground` | Tooltip label | `white` | `neutral-800` |
| `scrollbar-track` | Scrollable body track | `gray-100` | `neutral-700` |
| `scrollbar-thumb` | Scrollable body thumb | `gray-300` | `neutral-500` |

## Behaviour (JS)

Static markup only -- no Preline JS. One exception inside an example: `panel-actions.html` wraps each icon button in `hs-tooltip` / `hs-tooltip-toggle` / `hs-tooltip-content`, which is driven by `HSTooltip` (`assets/js/preline/tooltip.js`). `HSTooltip.autoInit()` runs on `window.load` and registers every `.hs-tooltip:not(.--prevent-on-load-init)` into `window.$hsTooltipCollection`.

Driving it by hand — the two shapes that actually exist:

| Call | Returns / does |
|---|---|
| `HSTooltip.show(target)` / `HSTooltip.hide(target)` | statics; `target` is an element, a selector string, or an instance |
| `HSTooltip.getInstance(el)` | the tooltip's **root element**, not the instance |
| `HSTooltip.getInstance(el, true)` | the collection record `{ id, element }` — the instance is `.element`, so it is `HSTooltip.getInstance(el, true).element.show()` |
| `HSTooltip.on('show', target, cb)` | registers a callback on the instance |

Instance methods are `show()` / `hide()` / `destroy()`. Options are read off CSS custom properties on the `.hs-tooltip` root — `--trigger` (default `hover`), `--placement` (default `top`), `--strategy`, `--prevent-popper` (default `false`), `--scope` (default `parent`) — not from `data-*`. It toggles a `show` class on the root, which is what the `hs-tooltip-shown:` variant keys off, and dispatches `show.hs.tooltip` / `hide.hs.tooltip`.

## Gotchas
- **`card` and `layer` are the SAME colour under moon** (`white` / `neutral-800`). The "raised" active tab in `navigation.html` has zero fill contrast against the body — the separation comes entirely from the `bg-surface` header strip behind it plus `border-b-transparent`. Do not "improve" it by dropping the header fill.
- **Five border tokens collapse to one pair.** `card-line`, `card-header`, `card-divider`, `card-footer` and `line-2` are all `gray-200` / `neutral-700`. They cost nothing to get right today and are the only thing that survives a theme swap — do not normalise them to `border-card-line`.
- **In dark mode `card-line` (`neutral-700`) equals `surface` (`neutral-700`).** The header strip in `header-and-footer.html` loses its bottom rule in dark: the rule and the fill are the same colour. If you need a visible seam in dark, the fill has to change, not the border.
- **`card-group.html` moves border + shadow + radius to the wrapper.** Pasting a normal card (which carries `border border-card-line shadow-2xs rounded-xl`) into that grid double-borders every cell.
- **`horizontal.html` ships a conflicting utility pair**: `sm:max-w-60 … sm:max-w-20` on the same element. Two values for one property — stylesheet source order decides the winner, not the order in the `class` attribute. Pick one before you reuse it.
- **`inset-s-*` / `inset-e-*` are not stock Tailwind v4** (stock spells them `start-*` / `end-*`) and are not defined anywhere under `assets/css/` in this skill. They come from Preline's own utility layer. Exactly three card examples depend on them: `image-overlays.html` (`absolute top-0 inset-s-0 inset-e-0`), `horizontal.html` and `image-scaling-animation-on-hover.html` (both `absolute top-0 inset-s-0` on the image).
- **`image-overlays.html` has no scrim.** The copy is plain `text-foreground` / `text-muted-foreground-1` laid straight over the photo. Legibility is entirely the image's problem.
- **Radius is per-child, not clipped.** A top image needs `rounded-t-xl`, a bottom image `rounded-b-xl`, the header `rounded-t-xl`, the footer `rounded-b-xl`. Four files also carry `overflow-hidden` — `card-group.html` (wrapper), `image-scaling-animation-on-hover.html` (root + image box), `horizontal.html` (image column) and `navigation-with-select-on-mobile.html` (each nav cell) — but that clip is in addition to the per-child radius, never a replacement for it.
- The body padding is padded with stray whitespace by the doc generator: `class="p-4  "` (basic-usage, content-types, simple-card, header-and-footer, simple-footer-with-a-card, default-card-size), `class=" p-3 "` (small-card-size), `class="  p-4 sm:p-6"` (large-card-size, image-placeholder, image-placeholder-bottom). Harmless to render, but grep for the bare utility (`p-4`), never for `class="p-4"`.

## Copy-paste base

`examples/base-components/card/content-types.html`

```html
<!-- Card -->
<div class="flex flex-col bg-card border border-card-line shadow-2xs rounded-xl">
  <div class="p-4  ">
    <p class="mt-1 text-muted-foreground-1">
      Some quick example text to build on the card title and make up the bulk of the card's content.
    </p>
  </div>
</div>
<!-- End Card -->
```
