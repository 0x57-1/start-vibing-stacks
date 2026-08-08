---
component: buttons
label: Buttons
category: base-components
docs: https://preline.co/docs/components/buttons.html
examples: 17
js: none
tokens: [primary, primary-hover, primary-focus, primary-active, primary-line, primary-foreground, layer, layer-line, layer-hover, layer-focus, primary-100, primary-200, primary-600, primary-800, muted-foreground-1]
---

# Buttons

A class-string component (there is no `.btn` rule anywhere in the CSS): one `<button>` or `<a>` carrying padding, radius, a fill/border pair and the four state modifiers.

## When to use
- Any action the user triggers. Six shapes exist — solid, outline, ghost, soft, white, link — and `types.html` shows all six with identical geometry so they line up in a row.
- Reach for `white-color-variants` (`bg-layer border border-layer-line text-layer-foreground shadow-2xs`) on a `bg-card` panel where a solid button would be too loud; reach for `link-color-variants` when the action must not read as a control.
- Do NOT use a button for navigation between pages — every example here is `<button type="button">`. When the same control is a link, the identical class string moves onto an `<a href>`: `card/basic-usage.html` carries `py-2 px-3 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg bg-primary border border-primary-line text-primary-foreground …` on an anchor.
- Do NOT hand-roll a loading state: `loading.html` and `icon-with-fixed-sizing.html` already carry the canonical spinner span.

## Anatomy

Reduced skeleton. Every class below appears verbatim in the example files.

```html
<button type="button" class="
  py-3 px-4                                   <!-- size: py-2 px-3 | py-3 px-4 | p-4 sm:p-5 -->
  inline-flex items-center gap-x-2            <!-- gap-x-2 is the icon gutter -->
  text-sm font-medium rounded-lg              <!-- rounded-full for the pill -->
  bg-primary border border-primary-line       <!-- fill + TRANSPARENT border (box parity) -->
  text-primary-foreground
  hover:bg-primary-hover
  focus:outline-hidden focus:bg-primary-focus <!-- outline-hidden kills the ring: focus:bg IS the feedback -->
  active:bg-primary-active
  disabled:opacity-50 disabled:pointer-events-none
">
  Label
</button>
```

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| `types` | Types | `examples/base-components/buttons/types.html` | The six shapes side by side: solid / outline / ghost / soft / white / link |
| `sizes` | Sizes | `examples/base-components/buttons/sizes.html` | Padding only: `py-2 px-3`, `py-3 px-4`, `p-4 sm:p-5` |
| `solid-color-variants` | Solid color variants | `examples/base-components/buttons/solid-color-variants.html` | 7 fills (`secondary`, `surface-4`, teal-500, `primary`, red-500, yellow-500, `plain`). Only the three semantic fills get a `*-line` border token (`border-secondary-line`, `border-surface-line`, `border-primary-line`); the raw-hue and `plain` buttons use `border-transparent` |
| `outline-color-variants` | Outline color variants | `examples/base-components/buttons/outline-color-variants.html` | No fill; hover/focus swap BOTH `border-*` and `text-*` |
| `ghost-color-variants` | Ghost color variants | `examples/base-components/buttons/ghost-color-variants.html` | `border-transparent`; hover paints a tint fill, text darkens |
| `soft-color-variants` | Soft color variants | `examples/base-components/buttons/soft-color-variants.html` | Resting tint `bg-*-100` + `text-*-800`, hover `bg-*-200` |
| `white-color-variants` | White color variants | `examples/base-components/buttons/white-color-variants.html` | Fixed `bg-layer border border-layer-line` + `shadow-2xs hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus`; only `text-*` differs across the row (6 buttons, no inverse) |
| `link-color-variants` | Link color variants | `examples/base-components/buttons/link-color-variants.html` | 4 buttons, no padding, no fill, `font-semibold`; the first three hover/focus to `primary-hover`/`primary-focus`, the fourth is the on-dark chip (`text-foreground-inverse hover:text-foreground-inverse/80`) |
| `pilled-button` | Pill button | `examples/base-components/buttons/pilled-button.html` | `rounded-full` instead of `rounded-lg` |
| `block-button` | Full-width button | `examples/base-components/buttons/block-button.html` | Adds `w-full` + `justify-center` |
| `icon` | Buttons with icons | `examples/base-components/buttons/icon.html` | Label + trailing `<svg class="shrink-0 size-4">`, spaced by `gap-x-2` |
| `icon-with-fixed-sizing` | Icon-only buttons | `examples/base-components/buttons/icon-with-fixed-sizing.html` | `flex justify-center items-center size-11`; second button holds a spinner instead of an icon |
| `icon-in-all-button-sizes` | Icon-only button sizes | `examples/base-components/buttons/icon-in-all-button-sizes.html` | Ladder `size-9.5`/`size-11`/`size-15.5` with `size-3`/`size-4`/`size-5` glyphs |
| `loading` | Loading | `examples/base-components/buttons/loading.html` | `animate-spin … border-3 border-current border-t-transparent rounded-[999px] text-primary-foreground` span, `role="status" aria-label="loading"` |
| `disabled` | Disabled | `examples/base-components/buttons/disabled.html` | Same six shapes + the `disabled` attribute; styling is `disabled:opacity-50 disabled:pointer-events-none` |
| `active` | Active | `examples/base-components/buttons/active.html` | Same six shapes + `active:bg-primary-active` / `active:bg-layer-active` / `active:text-primary-active` |
| `button-example` | Reaction buttons | `examples/base-components/buttons/button-example.html` | Segmented pill: `inline-flex bg-layer border border-layer-line rounded-full p-0.5` wrapping two `size-8` round icon buttons with `focus:z-10` |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `primary` | Solid fill; outline/link resting text | `gray-800` | `white` |
| `primary-hover` | Solid hover fill; outline/link hover text+border | `gray-900` | `neutral-300` |
| `primary-focus` | Solid focus fill; outline/link focus text+border | `gray-900` | `neutral-300` |
| `primary-active` | Pressed state (only in `active.html`) | `gray-900` | `neutral-300` |
| `primary-line` | Transparent border on solid buttons — keeps box size equal to outline | `transparent` | `transparent` |
| `primary-foreground` | Label on a solid primary button; loading spinner colour | `white` | `neutral-800` |
| `primary-100` | Ghost hover fill / soft resting fill | `gray-100` | `neutral-100` |
| `primary-200` | Soft hover + focus fill | `gray-200` | `neutral-200` |
| `primary-400` | Dark-mode ghost/soft text (`dark:text-primary-400`) | `gray-400` | `neutral-400` |
| `primary-500` | Dark-mode ghost text + `dark:bg-primary-500/20` tint base | `gray-500` | `neutral-500` |
| `primary-600` | Ghost resting text (light mode) | `gray-600` | `neutral-600` |
| `primary-800` | Soft/ghost resting label in light mode (`text-primary-800`); `/30` alpha also serves as a dark fill — resting in `soft-color-variants.html` (`dark:bg-primary-800/30`), focus-only in `types.html`/`disabled.html`/`active.html` (`dark:focus:bg-primary-800/30`) | `gray-800` | `neutral-800` |
| `layer` | White-variant fill; reaction-pill track | `white` | `neutral-800` |
| `layer-line` | White-variant + outline-type border | `gray-200` | `neutral-700` |
| `layer-hover` | White-variant hover fill | `gray-50` | `neutral-700` |
| `layer-focus` | White-variant focus fill | `gray-50` | `neutral-700` |
| `layer-active` | White-variant pressed fill | `gray-50` | `neutral-700` |
| `layer-foreground` | White-variant label | `gray-800` | `white` |
| `muted-foreground-1` | Secondary/quiet label on outline, ghost, white, link | `gray-600` | `neutral-400` |
| `muted-hover` | Ghost neutral hover fill | `gray-100` | `neutral-700` |
| `muted-focus` | Ghost neutral focus fill | `gray-100` | `neutral-700` |
| `foreground` | Ghost/outline/link default label | `gray-800` | `neutral-200` |
| `foreground-inverse` | Label for on-photo / on-dark variants — white in BOTH modes | `white` | `white` |
| `secondary` | Second solid fill | `gray-900` | `white` |
| `secondary-hover` | Its hover fill | `gray-800` | `neutral-100` |
| `secondary-line` | Its (transparent) border | `transparent` | `transparent` |
| `secondary-foreground` | Its label | `white` | `neutral-800` |
| `surface` | Soft-variant neutral fill | `gray-100` | `neutral-700` |
| `surface-hover` | Soft-variant neutral hover | `gray-200` | `neutral-600` |
| `surface-foreground` | Soft-variant neutral label | `gray-800` | `neutral-200` |
| `surface-4` | Grey solid fill | `gray-500` | `neutral-500` |
| `surface-5` | Its hover fill | `gray-600` | `neutral-400` |
| `surface-line` | Its (transparent) border | `transparent` | `transparent` |
| `line-5` | Quiet outline border | `gray-500` | `neutral-400` |
| `line-8` | Strong outline border | `gray-800` | `neutral-100` |
| `line-inverse` | On-dark outline border — white in BOTH modes | `white` | `white` |
| `plain` | `bg-plain` solid + `bg-plain/10` ghost/soft tint | `white` | `neutral-800` |
| `inverse` | Label on `bg-plain` | `gray-800` | `neutral-950` |

## Behaviour (JS)

Static markup only -- no Preline JS. `hs_js` and `hs_attrs` are empty for this component in `data/index.json`; the loading spinner is pure CSS (`animate-spin`) and `disabled` is the native attribute.

## Gotchas
- **The semantic `primary` INVERTS under moon, the numeric scale does not.** `primary` goes `gray-800` → `white` and `primary-foreground` goes `white` → `neutral-800`, so a solid button is dark-on-light in light mode and light-on-dark in dark mode. But `primary-600` is `gray-600` light / `neutral-600` dark — i.e. still dark. That is why the **primary ghost** button (and only that one) carries `dark:text-primary-500 dark:hover:bg-primary-500/20 dark:hover:text-primary-400` — it appears in exactly four files: `types.html`, `ghost-color-variants.html`, `disabled.html`, `active.html`. Strip those `dark:` classes as "redundant" and the ghost label becomes `neutral-600` text on a `neutral-800` card: invisible. The two neutral ghosts (`text-foreground`, `text-muted-foreground-1`) carry no `dark:` classes at all because those tokens already flip; the soft primary uses a different set again (`dark:text-primary-400 dark:bg-primary-800/30` in `soft-color-variants.html`, `dark:bg-primary-500/20 dark:text-primary-400` in `types.html` — upstream disagrees with itself here).
- **`hover`, `focus` and `active` are the same colour.** `primary-hover`, `primary-focus` and `primary-active` all resolve to `gray-900` / `neutral-300`; likewise `layer-hover` = `layer-focus` = `layer-active` = `gray-50` / `neutral-700`. `types.html` uses `focus:bg-primary-focus` and `sizes.html` uses `focus:bg-primary-hover` — under moon those render identically. The distinction is theme portability only, so still write the semantically correct one.
- **`border border-primary-line` is a transparent border, and it is load-bearing.** It exists so a solid button occupies the same box as an outline button in the same row. Delete it and the solid button shrinks by 2px and the row breaks alignment.
- **`focus:outline-hidden` (Tailwind v4 spelling, not `outline-none`) removes the browser ring.** The `focus:bg-*` / `focus:border-*` / `focus:text-*` class that follows it IS the keyboard focus indicator. Removing that class leaves the button with no visible focus at all.
- **The last chip in each colour row is for dark/photo backgrounds, not for the page.** `text-foreground-inverse` and `border-line-inverse` are `white` in BOTH modes; on the default light background they are white-on-white.
- **The `bg-plain` + `text-inverse` pairing (solid-color-variants, last button — `bg-plain border border-transparent text-inverse`) is a dark-mode contrast trap**: `plain` is `neutral-800` in dark and `inverse` is `neutral-950` — near-black label on a near-black fill.
- **`icon-with-fixed-sizing.html`'s first button carries both `py-3 px-4` and `size-11`.** Fixed size plus padding; the second button in the same file drops the padding. Copy the second one.
- **Upstream inconsistencies to not canonise**: in `ghost-color-variants.html` the primary button repeats `focus:outline-hidden focus:bg-primary-100` twice; in `outline-color-variants.html` the yellow button is missing `hover:text-yellow-400` that every one of its siblings has. `types.html` and `disabled.html` also contain a stray double space before `disabled:opacity-50`.
- **`white-color-variants.html` has six buttons, not seven** — unlike every other colour row it has no inverse entry.
- **The loading spinner inherits its colour from the button.** It is `border-3 border-current border-t-transparent`, so it is coloured by `text-primary-foreground` inside a solid button and `text-primary` inside a white one. Setting `border-*` instead of `text-*` destroys the transparent-top gap that makes it read as spinning.

## Copy-paste base

The "Default" button, verbatim from `examples/base-components/buttons/sizes.html`:

```html
<button type="button" class="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg bg-primary border border-primary-line text-primary-foreground hover:bg-primary-hover focus:outline-hidden focus:bg-primary-hover disabled:opacity-50 disabled:pointer-events-none">
  Default
</button>
```
