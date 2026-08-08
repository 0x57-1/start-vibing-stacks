---
component: tooltip
label: Tooltip
category: overlays
docs: https://preline.co/docs/components/tooltip.html
examples: 3
js: HSTooltip
tokens: [tooltip, tooltip-line, tooltip-foreground, muted, line-2, muted-foreground-2, primary, primary-50, primary-200, primary-500, primary-900, layer, layer-line, layer-foreground, layer-hover, layer-focus, surface, surface-line, surface-foreground, surface-hover, surface-focus]
---

# Tooltip

A small Floating-UI-positioned label that appears on hover/focus of a trigger and disappears on leave/blur.

## When to use
- Naming an icon-only control, or restating a truncated label. Text only, no interactive content inside.
- NOT for content the user must read or act on — the tooltip closes on `mouseleave`/`blur` and cannot be hovered into. Use `dropdown` (click menu) or `popover` for interactive/persistent floating content.
- NOT for right-click surfaces — use `context-menu` (`.hs-dropdown [--trigger:contextmenu]`).
- Only one tooltip is visible document-wide: `_show()` calls `hideOtherTooltips()`, which hides every other entry in `window.$hsTooltipCollection`.

## Anatomy

Reduced skeleton — every class below appears verbatim in `examples/overlays/tooltip/example.html`.

```html
<!-- REDUCED SKELETON -->
<div class="hs-tooltip [--placement:top] inline-block">        <!-- component root; JS reads --placement/--trigger here -->
  <button type="button" class="hs-tooltip-toggle ...">        <!-- trigger; optional (falls back to the root) -->
    <svg class="shrink-0 size-4" ...></svg>
    <span class="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible z-10 py-1 px-2 bg-tooltip border border-tooltip-line text-xs font-medium text-tooltip-foreground rounded-md shadow-2xs" role="tooltip">
      Tooltip on top
    </span>
  </button>
</div>
```

Three class hooks are load-bearing: `.hs-tooltip` (root, queried by `autoInit()`), `.hs-tooltip-toggle` (trigger), `.hs-tooltip-content` (floating box). The theme lives entirely on the content span: `bg-tooltip border-tooltip-line text-tooltip-foreground`.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Four fixed placements | Tooltip placements | `examples/overlays/tooltip/example.html` | Four independent `.hs-tooltip` roots in a 3-col grid, one per `[--placement:top]` / `[--placement:left]` / `[--placement:right]` / `[--placement:bottom]`. Markup is otherwise identical across all four. |
| Automatic placement | Automatic placement | `examples/overlays/tooltip/auto-positioning.html` | Byte-for-byte the same file with every `[--placement:…]` replaced by `[--placement:auto]`. `auto` resolves to base `top` with fallbacks `['bottom','left','right']` chosen by Floating UI `flip()`. |
| Destroy / reinitialize | Destroy and reinitialize | `examples/overlays/tooltip/destroy-and-reinitialize.html` + `.js` | Same four placement tooltips plus two control buttons (`#hs-destroy-tooltip` on `bg-layer`, `#hs-auto-init-tooltip` on `bg-surface`) driving `element.destroy()` and `HSTooltip.autoInit()`. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `tooltip` | Floating box fill (`bg-tooltip`) | `gray-900` | `white` |
| `tooltip-foreground` | Tooltip label text (`text-tooltip-foreground`) | `white` | `neutral-800` |
| `tooltip-line` | Tooltip box border (`border-tooltip-line`) | `transparent` | `transparent` |
| `muted` | Resting fill of the icon trigger (`bg-muted`) | `gray-50` | `neutral-800` |
| `line-2` | Resting border of the icon trigger (`border-line-2`) | `gray-200` | `neutral-700` |
| `muted-foreground-2` | Trigger icon colour (`text-muted-foreground-2`) | `gray-700` | `neutral-300` |
| `primary` | Trigger icon on hover/focus (`hover:text-primary`) | `gray-800` | `white` |
| `primary-50` | Trigger hover/focus fill, light only (`hover:bg-primary-50`) | `gray-50` | `zinc-50` |
| `primary-200` | Trigger hover/focus border, light only (`hover:border-primary-200`) | `gray-200` | `neutral-200` |
| `primary-500` | Trigger hover/focus fill in dark, at 20% (`dark:hover:bg-primary-500/20`) | `gray-500` | `neutral-500` |
| `primary-900` | Trigger hover/focus border in dark (`dark:hover:border-primary-900`) | `gray-900` | `neutral-900` |
| `layer` / `layer-line` / `layer-foreground` / `layer-hover` / `layer-focus` | "Destroy tooltip" button only | `white` / `gray-200` / `gray-800` / `gray-50` / `gray-50` | `neutral-800` / `neutral-700` / `white` / `neutral-700` / `neutral-700` |
| `surface` / `surface-line` / `surface-foreground` / `surface-hover` / `surface-focus` | "Reinitialize tooltip" button only | `gray-100` / `transparent` / `gray-800` / `gray-200` / `gray-200` | `neutral-700` / `transparent` / `neutral-200` / `neutral-600` / `neutral-600` |

`tooltip` and `tooltip-foreground` **invert** between light and dark (dark box on light page, light box on dark page). Do not hard-code `bg-gray-900 text-white`.

## Behaviour (JS)

Class `HSTooltip` (`assets/js/preline/tooltip.js`, Preline 4.2.0). Registered as `window.HSTooltip` and auto-initialised on `window load`:

```js
window.addEventListener('load', () => { HSTooltip.autoInit(); });
```

`autoInit()` prunes detached elements from `window.$hsTooltipCollection`, then constructs one instance per `.hs-tooltip:not(.--prevent-on-load-init)` that is not already registered — so it is idempotent and safe to call again after a dynamic render.

Configuration is read from **CSS custom properties** on the root (`getClassProperty(this.el, '--x')`), i.e. the `[--x:value]` arbitrary-property utilities. There are no `data-hs-*` attributes on this component (`hs_attrs` is empty in `data/index.json`).

| Property | Default | Effect |
|---|---|---|
| `--placement` | `top` | Mapped through `POSITIONS` (`top-left` → `top-start`, `bottom-right` → `bottom-end`, …). `auto` / empty → base `top`, fallbacks `['bottom','left','right']`. |
| `--trigger` | `hover` | `hover` binds `mouseenter`/`mouseleave`; `click` binds `click` and a capture-phase `click`+`blur` to dismiss. `focus`/`blur` on the toggle are bound in **both** modes. |
| `--strategy` | `fixed` | Passed to `computePosition` and written to `content.style.position`. |
| `--scope` | `parent` | `window` moves `.hs-tooltip-content` to `document.body` on first show and toggles a `show` class on the content too. |
| `--prevent-popper` | `false` | Any value other than the string `false` skips `buildFloatingUI()` entirely — no `computePosition`, no `autoUpdate`; you position the content yourself. |

Positioning: `computePosition(toggle, content, { placement, strategy, middleware: [offset(5), flip({fallbackPlacements})] })`, then `applyTooltipPosition()` writes inline `position/left/top` and sets `data-placement="<resolved>"` on the content. `autoUpdate()` keeps it pinned while shown and is torn down in `hide()`.

Visibility: `_show()` removes `hidden` from the content (a no-op on first show — the examples' span never carries `hidden`) and adds `show` to the **root** `.hs-tooltip` inside a `setTimeout`, so the opacity transition has a frame to run; `hide()` removes `show` and re-adds `hidden` on the content after `afterTransition`. The `hs-tooltip-shown:*` Tailwind variant keys off that `show` class (variant plugin is imported at `assets/css/variants.css:4` → `./src/plugins/tooltip/variants.css`, not vendored in this skill).

Instance methods: `show()`, `hide()`, `destroy()`.
Statics: `HSTooltip.autoInit()`, `HSTooltip.show(target)`, `HSTooltip.hide(target)`, `HSTooltip.getInstance(target, isCollectionItem = false)`, `HSTooltip.findInCollection(target)`, `HSTooltip.on(evtName, target, cb)`.
Events dispatched on the root element: `show.hs.tooltip`, `hide.hs.tooltip` (bubbling `CustomEvent`, payload in `detail.payload`). Instance callbacks: `.on('show', fn)` / `.on('hide', fn)`.

## Gotchas
- **`getInstance(el, true)` returns the collection wrapper, not the instance.** That is why `examples/overlays/tooltip/destroy-and-reinitialize.js` writes `const {element} = HSTooltip.getInstance(el, true); element.destroy();`. Calling `.destroy()` on the result of `getInstance(el)` (second arg omitted/false) fails — that form returns `n.element.el`, a DOM node.
- **`id="hs-tooltip"` in the examples is the grid wrapper, not the component.** The components are the four inner `.hs-tooltip` divs; the destroy script selects `#hs-tooltip .hs-tooltip`. Copying the id onto a single tooltip and then reusing that selector silently matches nothing.
- **The content span is nested *inside* the `<button>`** in all three examples. Keep it that way or move it — either works — but it must stay a descendant of `.hs-tooltip`, since the constructor does `this.el.querySelector('.hs-tooltip-content')`.
- **No `aria-describedby` is wired up.** `role="tooltip"` alone does not announce the label; add `aria-describedby` on the trigger pointing at an `id` on the content if the trigger has no accessible name.
- **Content must keep `absolute` + `invisible` + `opacity-0` in its base classes.** The content span in all three examples has **no** `hidden` class: until the first `hide()` runs, `invisible opacity-0` is the *only* thing keeping it off-screen, and the reveal is carried by the `hs-tooltip-shown:` variants. Floating UI overwrites `position` inline once built, so `absolute` is what holds the box out of flow before init. Drop `invisible`/`opacity-0` and the tooltip paints at 0,0 on load.
- **Programmatic `show()` steals focus** — it calls `this.toggle.focus()` and sets `toggle.style.outline = 'none'` (restored on hide). Do not call it from a scroll or timer handler.
- **After a React/SPA re-render call `HSTooltip.autoInit()` again**; instances hold references to removed nodes otherwise. `autoInit()` self-prunes detached entries, so repeated calls do not leak.
- `--prevent-popper` compares against the literal string `false`. Writing `[--prevent-popper:0]` or `[--prevent-popper:no]` **disables** Floating UI, which is the opposite of what those values read like.

## Copy-paste base

`examples/overlays/tooltip/example.html` (first of the four blocks, verbatim):

```html
<div class="hs-tooltip [--placement:top] inline-block">
  <button type="button" class="hs-tooltip-toggle size-10 inline-flex justify-center items-center gap-2 rounded-full bg-muted border border-line-2 text-muted-foreground-2 hover:bg-primary-50 hover:border-primary-200 hover:text-primary focus:outline-hidden focus:bg-primary-50 focus:border-primary-200 focus:text-primary dark:hover:bg-primary-500/20 dark:hover:border-primary-900 dark:focus:bg-primary-500/20 dark:focus:border-primary-900">
    <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
    <span class="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible z-10 py-1 px-2 bg-tooltip border border-tooltip-line text-xs font-medium text-tooltip-foreground rounded-md shadow-2xs" role="tooltip">
      Tooltip on top
    </span>
  </button>
</div>
```
