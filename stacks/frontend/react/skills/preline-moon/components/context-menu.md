---
component: context-menu
label: Context Menu
category: overlays
docs: https://preline.co/docs/components/context-menu.html
examples: 1
js: HSDropdown
tokens: [dropdown, dropdown-line, dropdown-divider, dropdown-item-foreground, dropdown-item-hover, dropdown-item-focus, layer, primary]
---

# Context Menu

A dropdown opened by right-click (or a 400 ms long-press on touch) and positioned at the pointer, replacing the browser's native menu for that region.

## When to use
- Per-row / per-object actions on a surface where a visible trigger button would be noise (message rows, canvas items, file tiles).
- NOT as the only path to an action — right-click is undiscoverable and unavailable to keyboard users. Mirror every item in a normal `dropdown` or a toolbar.
- NOT for a click-triggered menu: that is plain `dropdown` (default `[--trigger:click]`). This component *is* `.hs-dropdown` with `[--trigger:contextmenu]`; there is no separate CSS or JS module.
- NOT for hover-revealed content: use `tooltip` or `[--trigger:hover]` on a dropdown.

## Anatomy

Reduced skeleton — every class below appears verbatim in `examples/overlays/context-menu/default.html`.

```html
<!-- REDUCED SKELETON -->
<div class="hs-dropdown [--trigger:contextmenu] relative z-20">   <!-- root; --trigger is the whole feature -->
  <div class="hs-dropdown-toggle ... bg-layer border-2 border-dashed border-primary text-primary">
    Right click                                                   <!-- the right-clickable region -->
  </div>

  <div class="hs-dropdown-menu hidden min-w-60 bg-dropdown border border-dropdown-line shadow-xl rounded-lg mt-2" role="menu" aria-orientation="vertical">
    <div class="p-1 space-y-0.5 border-b border-dropdown-divider">        <!-- item group + divider -->
      <button type="button" class="w-full flex items-center gap-x-3 py-1.5 px-3 text-start rounded-lg text-[13px] text-dropdown-item-foreground hover:bg-dropdown-item-hover focus:outline-hidden focus:bg-dropdown-item-focus disabled:opacity-50 disabled:pointer-events-none">
        <svg class="shrink-0 size-3.5" ...></svg>
        Reply
      </button>
    </div>

    <div class="p-1 space-y-0.5 border-b border-dropdown-divider">        <!-- nested submenu -->
      <div class="hs-dropdown [--strategy:static] sm:[--strategy:absolute] [--adaptive:none] sm:[--trigger:hover] relative">
        <button type="button" class="hs-dropdown-toggle ..." role="menuitem" tabindex="-1">More</button>
        <div class="hs-dropdown-menu ... sm:bg-dropdown sm:border sm:border-dropdown-line sm:shadow-xl sm:rounded-lg" role="menu" aria-orientation="vertical">…</div>
      </div>
    </div>
  </div>
</div>
```

The menu must be a **direct** child of the root: the constructor uses `this.el.querySelector(':scope > .hs-dropdown-menu')`. The toggle is resolved the same way — `:scope > .hs-dropdown-toggle`, then `:scope > .hs-dropdown-toggle-wrapper > .hs-dropdown-toggle`, else `el.children[0]`, so a mis-nested toggle silently binds the first child instead. Groups are plain `div`s; the rule between them is `border-b border-dropdown-divider` on the group, not a separate element.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Default context menu | Default context menu | `examples/overlays/context-menu/default.html` | The only example. A dashed `border-primary` drop zone (`bg-layer`) as the right-click target, a 3-group menu (4 reply actions / 1 nested "More" submenu / 5 mailbox actions), and a nested `.hs-dropdown` whose submenu is `[--strategy:static]` + full-bleed below `sm`, `sm:[--strategy:absolute]` + `sm:[--trigger:hover]` + its own `sm:bg-dropdown` card above `sm`. Three submenu items carry `data-hs-overlay="#hs-pro-chhsh"` to open a modal. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `dropdown` | Menu panel fill (`bg-dropdown`, and `sm:bg-dropdown` on the submenu) | `white` | `neutral-900` |
| `dropdown-line` | Menu panel border (`border-dropdown-line`) | `transparent` | `transparent` |
| `dropdown-divider` | Rule between item groups (`border-b border-dropdown-divider`) | `gray-200` | `neutral-800` |
| `dropdown-item-foreground` | Item label + icon colour (`text-dropdown-item-foreground`) | `gray-800` | `neutral-200` |
| `dropdown-item-hover` | Item fill on pointer hover (`hover:bg-dropdown-item-hover`) | `gray-100` | `neutral-800` |
| `dropdown-item-focus` | Item fill on keyboard focus (`focus:bg-dropdown-item-focus`) | `gray-100` | `neutral-800` |
| `layer` | Fill of the right-click target region (`bg-layer`) | `white` | `neutral-800` |
| `primary` | Dashed outline + label of the target region (`border-primary text-primary`) | `gray-800` | `white` |

`dropdown-line` is `transparent` in **both** modes — the panel is separated by `shadow-xl`, not by a visible border. Removing the shadow leaves an edgeless panel. `dropdown-item-hover` and `dropdown-item-focus` resolve to the same colour under moon (`gray-100` / `neutral-800`), so a focused item looks exactly like a hovered one — and `focus:outline-hidden` on every item removes the native ring on top of that, so there is **no** keyboard-only affordance at all. Add your own `focus-visible:` treatment if keyboard users must see where they are.

## Behaviour (JS)

Class `HSDropdown` (`assets/js/preline/dropdown.js`, Preline 4.2.0), exposed as `window.HSDropdown` and auto-initialised via `HSDropdown.autoInit()`. There is no `HSContextMenu`. `data/index.json` lists `hs_js: []` for this page because the doc page shipped no JS tab — the runtime is still HSDropdown.

Config comes from CSS custom properties on the root (`getClassProperty` / `getComputedStyle`), not from `data-hs-*`. The one `data-hs-*` the example carries — `data-hs-overlay` on three submenu items, the sole entry in this page's `hs_attrs` — belongs to `HSOverlay`, not to the menu:

| Property | Default | Effect |
|---|---|---|
| `--trigger` | `click` | `contextmenu` is what makes this a context menu (see below). Also `hover`, `click`. |
| `--strategy` | `fixed` | Floating UI strategy. `open()` skips `setupFloatingUI()` entirely when it reads `static`, so the nested submenu flows inline on mobile and is Floating-UI-positioned only from `sm` (`absolute`). |
| `--adaptive` | `adaptive` | `adaptive` clamps the computed `x` into the viewport width. With `--strategy:absolute` + `--adaptive:none` the handler writes only `{position:absolute, margin:0}` and **no** `transform`, so the submenu keeps the place its own classes give it (`top-0 inset-e-full sm:me-3!`). |
| `--auto-close` | `true` | `inside` / `outside` / `false` control which outside-click closes the menu. |
| `--placement` | `bottom-start` | Mapped through `POSITIONS`. |
| `--offset` | `10` | px, fed to Floating UI `offset()`. |
| `--flip` | `true` | Adds the `flip()` middleware. |

`buildToggle()` branches on `eventMode === 'contextmenu'` and binds `contextmenu`, plus `touchstart` (`{passive:false}`), `touchend`, `touchmove`. `handleTouchStart` starts a **400 ms** timer that synthesises a `MouseEvent('contextmenu')` at the touch coordinates — that is the "press and hold" path.

`toggleContextMenu(e)` calls `e.preventDefault()` (suppressing the native browser menu) then `onContextMenuHandler(e)`, which:
1. builds a **virtual reference** `{ getBoundingClientRect: () => new DOMRect(e.clientX, e.clientY, 0, 0) }` so the menu anchors at the pointer, not the toggle;
2. calls `HSDropdown.closeCurrentlyOpened()`;
3. if already open → `close()` and restores `document.body.style.overflow` / `paddingRight`;
   else → sets `document.body.style.overflow = 'hidden'` and `paddingRight = getScrollbarSize()px`, then `open(virtualRef)`.

Statics: `HSDropdown.autoInit()`, `.open(target, openedViaKeyboard = false)`, `.close(target)`, `.closeCurrentlyOpened(el = null, animated = true)`, `.getInstance(target, isCollectionItem)`, `.findInCollection(target)`. Events dispatched on the root: `open.hs.dropdown`, `close.hs.dropdown`. Keyboard set: `Escape`, `ArrowUp/Down/Left/Right`, `Home`, `End`, `Enter`.

## Gotchas
- **Opening a context menu locks page scroll, and `close()` does not unlock it.** `onContextMenuHandler` writes `document.body.style.overflow = 'hidden'` plus a scrollbar-width `paddingRight`. Exactly two paths clear them: a **second right-click** on the same toggle (the `close()` branch inside `onContextMenuHandler`), and `HSDropdown.closeCurrentlyOpened()`, which the global `window` click handler runs on any outside click — and there only for entries whose **class list literally contains** `[--trigger:contextmenu]` (it reads `getClassPropertyAlt`, which regexes the class string, not computed style). The instance `close()` and `HSDropdown.close(el)` touch neither `overflow` nor `paddingRight`. So unmounting the root while the menu is open leaves the page frozen — call `HSDropdown.closeCurrentlyOpened()` before unmounting, not `HSDropdown.close(el)`.
- **`[--trigger:contextmenu]` swallows the native menu on that region**, so no Copy/Inspect for users there. Scope the toggle tightly; do not put it on a page-level wrapper.
- **`.hs-dropdown-menu` must be a direct child** (`:scope > .hs-dropdown-menu`). Wrapping it in a positioning div gives a silently dead menu — the instance is created, nothing opens.
- **Keep `hidden` in the menu's base classes.** `open()` removes it, `close()`/`forceClearState()` re-add it; without it the menu paints on load.
- **`relative z-20` on the root is load-bearing in the example.** The menu is Floating-UI-positioned but still stacks against siblings; the nested submenu relies on its own `relative` + `z-10`.
- **The nested submenu is a second `.hs-dropdown` with `sm:[--trigger:hover]`** — below `sm` it has *no* trigger override, so it inherits the default `click`. Its `before:absolute before:-inset-e-5 before:w-5` pseudo-element is the invisible hover bridge; deleting it makes the submenu unreachable by mouse on desktop.
- **`data-hs-overlay="#hs-pro-chhsh"` on three submenu items targets a modal that is not in this file.** Copy the example as-is and those buttons do nothing — supply the overlay or strip the attribute.
- **No `role="menuitem"` on the top-level buttons.** Only the submenu toggle carries `role="menuitem" tabindex="-1"` in the example; the containers declare `role="menu" aria-orientation="vertical"`. Add `role="menuitem"` yourself if you need the full menu semantics.
- **Re-run `HSDropdown.autoInit()` after a dynamic render**; it prunes detached collection entries and skips already-registered roots.

## Copy-paste base

`examples/overlays/context-menu/default.html` (root + toggle + the first item group, truncated after its first button; every line verbatim):

```html
<div class="hs-dropdown [--trigger:contextmenu] relative z-20">
  <div class="hs-dropdown-toggle py-3 px-4 w-full h-37.5 flex justify-center items-center text-sm font-medium rounded-lg bg-layer border-2 border-dashed border-primary text-primary shadow-2xs">
    <span class="lg:block hidden">Right click</span>
    <span class="lg:hidden">Press and hold</span>
  </div>

  <div class="hs-dropdown-menu hidden min-w-60 bg-dropdown border border-dropdown-line shadow-xl rounded-lg mt-2" role="menu" aria-orientation="vertical">
    <div class="p-1 space-y-0.5 border-b border-dropdown-divider">
      <button type="button" class="w-full flex items-center gap-x-3 py-1.5 px-3 text-start rounded-lg text-[13px] text-dropdown-item-foreground hover:bg-dropdown-item-hover focus:outline-hidden focus:bg-dropdown-item-focus disabled:opacity-50 disabled:pointer-events-none">
        <svg class="shrink-0 size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
        Reply
      </button>
    </div>
  </div>
</div>
```

The group's trailing `border-b border-dropdown-divider` is the rule to the *next* group. The file's last group (`Mark as unread` … `Report spam`) is plain `p-1 space-y-0.5` — drop the border when this is the only/last group.
