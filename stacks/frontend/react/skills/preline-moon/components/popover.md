---
component: popover
label: Popover
category: overlays
docs: https://preline.co/docs/components/popover.html
examples: 8
js: HSTooltip
tokens: [popover, popover-line, layer, layer-line, layer-foreground, layer-hover, layer-focus, foreground, muted-foreground-1, muted-foreground-2, surface, surface-1, line-2]
---

# Popover

A rich, non-blocking panel anchored to a trigger, built on the **tooltip** plugin: `.hs-tooltip` root + `.hs-tooltip-toggle` + `.hs-tooltip-content`, shown by adding `show` to the root.

## When to use
- Read-only or lightly interactive content next to a control: definitions, previews, profile cards, rating breakdowns.
- Use **Tooltip** (same plugin, `bg-tooltip`) for a one-line label — a popover is the same machinery with panel chrome and richer content.
- Use **Dropdown** when the panel is a list of actions: `HSTooltip` has no `role="menu"`, no arrow-key roving, no `--auto-close`.
- Use **Modal** when the content must be acknowledged; a popover closes on outside click and does not lock scroll.

## Anatomy
Reduced skeleton (classes verbatim from `examples/overlays/popover/four-directions.html` — that file is the one carrying `[--trigger:click] [--placement:top]`; `focus-event.html` is the same shape with `[--trigger:focus]` and no placement):

```html
<div class="hs-tooltip [--trigger:click] [--placement:top] inline-block">   <!-- root: instance + vars -->
  <button class="hs-tooltip-toggle … bg-layer border border-layer-line text-layer-foreground
                 hover:bg-layer-hover focus:bg-layer-focus">
    <svg …>…</svg>
    <span class="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible
                 opacity-0 transition-opacity inline-block absolute invisible z-10
                 py-3 px-4 bg-popover border border-popover-line text-sm rounded-lg shadow-md"
          role="tooltip">
      Popover on top
    </span>
  </button>
</div>
```

Rich variants swap the toggle for a `<div class="hs-tooltip-toggle" tabindex="0">` and the content for a `<div class="hs-tooltip-content … hidden">` panel — `hidden` is added only when the content is a block panel (see `with-content.html`, `user-popover-example.html`, `review-popover-example.html`).

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| Four placements | Popover placements | `examples/overlays/popover/four-directions.html` | Four roots in a 3-col grid, each `[--trigger:click]` + `[--placement:top\|left\|right\|bottom]` |
| Auto positioning | Automatic placement | `examples/overlays/popover/auto-positioning.html` | Identical grid with `[--placement:…]` **removed** → empty placement resolves to Floating UI `auto` |
| Focus trigger | Focus trigger | `examples/overlays/popover/focus-event.html` | `[--trigger:focus]`; smallest example (858 B) |
| Hover trigger | Hover trigger | `examples/overlays/popover/hover-event.html` | `[--trigger:hover]`; otherwise byte-identical to focus-event |
| Interactive content | Interactive content | `examples/overlays/popover/with-content.html` | Toggle is a `<div class="hs-tooltip-toggle" tabindex="0">`; content is a `hidden … max-w-xs bg-popover text-start rounded-lg` panel with an inline illustration `<svg>` and a `<dl>` of `text-foreground` / `text-muted-foreground-2` pairs (largest example, 13.7 KB) |
| Review summary | Review summary popover | `examples/overlays/popover/review-popover-example.html` | `[--trigger:click]`; toggle is `<div class="hs-tooltip-toggle block text-center" tabindex="0">` wrapping a link-style `<button class="… text-primary hover:text-primary-hover focus:text-primary-focus">`; panel is `hidden … max-w-xs w-full bg-popover … rounded-xl`; star row `text-yellow-400 dark:text-yellow-600`, progress bars on `bg-surface-1` |
| User profile | User profile popover | `examples/overlays/popover/user-popover-example.html` | Card trigger; `sm:[--placement:right]`; panel has header `border-b border-line-2`, `bg-secondary` PRO badge, `bg-surface rounded-b-xl` footer, and an `after:absolute after:-inset-s-4 after:w-4 after:h-full` hover bridge |
| Destroy / reinit | Destroy and reinitialize | `examples/overlays/popover/destroy-and-reinitialize.html` (+ `.js`) | Same 4-direction grid plus control buttons; JS loops `#hs-tooltip .hs-tooltip`, calls `HSTooltip.getInstance(el, true).element.destroy()`, then `HSTooltip.autoInit()` |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `popover` | Panel fill (`bg-popover`) | `white` | `neutral-900` |
| `popover-line` | Panel border (`border-popover-line`) | `gray-100` | `neutral-700` |
| `layer` | Trigger button resting fill | `white` | `neutral-800` |
| `layer-line` | Trigger button border | `gray-200` | `neutral-700` |
| `layer-foreground` | Trigger icon / label | `gray-800` | `white` |
| `layer-hover` / `layer-focus` | Trigger hover / focus fill | `gray-50` | `neutral-700` |
| `foreground` | Panel headings, `<dt>`, list rows | `gray-800` | `neutral-200` |
| `muted-foreground-1` | Sub-labels, footer link, icon tint (user card) | `gray-600` | `neutral-400` |
| `muted-foreground-2` | Body copy, `<dd>`, "How reviews work" link | `gray-700` | `neutral-300` |
| `line-2` | Header rule inside the user-card panel | `gray-200` | `neutral-700` |
| `surface` | Footer strip of the user-card panel | `gray-100` | `neutral-700` |
| `surface-1` | Progress-bar track (review popover) | `gray-200` | `neutral-600` |
| `secondary` | "PRO" badge fill | `gray-900` | `white` |
| `secondary-foreground` | "PRO" badge label | `white` | `neutral-800` |
| `primary` | Link-style trigger (review popover) | `gray-800` | `white` |
| `primary-hover` / `primary-focus` | Link trigger hover / focus | `gray-900` | `neutral-300` |
| `primary-line` | "Follow" button border | `transparent` | `transparent` |
| `primary-foreground` | "Follow" button label | `white` | `neutral-800` |

## Behaviour (JS)
Class `HSTooltip` (`assets/js/preline/tooltip.js`, v4.2.0). Auto-inits on `window` `load`; registry `window.$hsTooltipCollection`. There is **no** `HSPopover` — popover and tooltip are one plugin.

**Lookup:** `toggle = el.querySelector('.hs-tooltip-toggle') || el`, `content = el.querySelector('.hs-tooltip-content')`. If `content` is missing, `init()` never runs.

**State class:** the root gets `show`; `hs-tooltip-shown:*` is the CSS variant for it. Block panels additionally get `hidden` removed/added.

**CSS-variable options** (on `.hs-tooltip`, breakpoint-able — `user-popover-example.html` uses `sm:[--placement:right]`):

| Var | Default | Effect |
|---|---|---|
| `--trigger` | `hover` | `hover` \| `focus` \| `click` |
| `--placement` | `top` | `POSITIONS` map: `top/bottom/left/right`, `*-left`→`-start`, `*-right`→`-end`, `auto`/`auto-start`/`auto-end`. Empty value ⇒ `auto` |
| `--strategy` | *(unset)* | `fixed` \| `absolute` |
| `--scope` | `parent` | `window` positions against the viewport |
| `--prevent-popper` | `false` | `true` disables Floating UI entirely — you position it yourself |

There are **no `data-hs-*` attributes** for this plugin — `tooltip.js` contains zero `data-hs-*` strings, so every option is a CSS variable. The one exception to "everything is a variable" is `--prevent-on-load-init`, which is a bare **class** token: `autoInit()` selects `.hs-tooltip:not(.--prevent-on-load-init)`, so write `class="hs-tooltip --prevent-on-load-init"`, not `[--prevent-on-load-init:true]`.

**Static API:** `HSTooltip.autoInit()`, `.getInstance(elOrSelector, asObject?)`, `.show(target)`, `.hide(target)`, `.on(event, target, cb)`.
**Instance:** `show()`, `hide()`, `destroy()`.
**Events:** `show.hs.tooltip`, `hide.hs.tooltip`.

Note the asymmetry: `HSTooltip.getInstance(el)` (no second arg) returns `element.el` — the **DOM node**, not the instance. Use `getInstance(el, true)` and destructure `{element}` as `destroy-and-reinitialize.js` does.

## Gotchas
- **`text-popover-foreground` does not exist under this theme.** Every example ships `text-sm text-popover-foreground` on the panel, but no `--popover-foreground` / `--color-popover-foreground` is defined in `assets/css/project-moon.css`, `assets/css/project-theme.css`, or `assets/css/themes/*.css` — the utility is never generated and the text just inherits. If you need explicit panel text colour, use `text-foreground` (as `with-content.html` and the two card examples do for their headings).
- The panel is a `<span>` **inside the `<button>`** in the four simple examples. That nests interactive content inside a button — fine for a static string, invalid the moment you add a link or another button. The card examples avoid it by using a `<div class="hs-tooltip-toggle" tabindex="0">` wrapper instead; copy that shape for anything interactive.
- `invisible` + `opacity-0` (simple variant) vs `hidden` + `invisible` + `opacity-0` (panel variant) are not interchangeable: `hs-tooltip-shown:visible` only undoes `invisible`. A panel that starts `hidden` also needs the JS to remove `hidden` — that only happens for `.hs-tooltip-content`, so the class must be on the same element.
- Default `--trigger` is **`hover`**, not click. Every rich example overrides it to `[--trigger:click]`, because a hover-triggered panel with links is unreachable by pointer without a bridge.
- The hover bridge in `user-popover-example.html` is `after:absolute after:top-0 after:-inset-s-4 after:w-4 after:h-full` on the content — a 1rem invisible strip on the start side so the pointer can cross the gap. Delete it and the `[--trigger:hover]` card closes mid-travel.
- `z-10` on the content is low. Inside a card that sets its own stacking context, or against a `z-80` overlay, the popover disappears behind. Raise it locally rather than assuming.
- `border-popover-line` is one of the few overlay borders that is **not** transparent under moon (`gray-100` / `neutral-700`) — unlike `dropdown-line`, `overlay-line` and `surface-line`. Do not copy a dropdown's border class here expecting the same result, or vice versa.
- The star / progress colours in `review-popover-example.html` (`text-yellow-400 dark:text-yellow-600`, `bg-yellow-400 dark:bg-yellow-600`) are raw Tailwind with a `dark:` variant, not moon tokens; they will not follow a theme swap.
- Re-run `HSTooltip.autoInit()` after any SPA re-render. Destroying requires iterating the roots yourself — there is no bulk `destroyAll`.

## Copy-paste base
`examples/overlays/popover/focus-event.html`

```html
<div class="hs-tooltip [--trigger:focus] inline-block">
  <button type="button" class="hs-tooltip-toggle size-10 inline-flex justify-center items-center gap-2 rounded-lg bg-layer border border-layer-line text-layer-foreground hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus">
    <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
    <span class="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible z-10 py-3 px-4 bg-popover border border-popover-line text-sm text-popover-foreground rounded-lg shadow-md" role="tooltip">
      Popover on top
    </span>
  </button>
</div>
```
