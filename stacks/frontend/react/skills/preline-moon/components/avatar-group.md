---
component: avatar-group
label: Avatar Group
category: base-components
docs: https://preline.co/docs/components/avatar-group.html
examples: 5
js: none — with-tooltip borrows HSTooltip, with-dropdown borrows HSDropdown
tokens: [layer, layer-line, layer-foreground, layer-hover, layer-focus, primary, tooltip, tooltip-line, tooltip-foreground, dropdown, dropdown-line, dropdown-item-foreground, dropdown-item-hover, dropdown-item-focus]
---

# Avatar Group

A facepile — several round avatars overlapped (or gridded), optionally ending in a `N+` counter that reveals the rest.

## When to use
- Showing *who* is on a project / thread / call in one line, where identity matters more than the individual person.
- Cap at 4-5 faces plus a `N+` chip; past that use `grid` (an 8-cell block) or a real list.
- Not for a single user — that is the `avatar` component; nothing here applies to one face.
- Not when each person needs an action (remove, change role) — that is a list with avatars, not a facepile.

## Anatomy

Reduced skeleton (classes verbatim from `examples/base-components/avatar-group/with-dropdown.html`):

```html
<!-- -space-x-2 = the overlap; DOM order = paint order, so the LAST child sits on top -->
<div class="flex -space-x-2">
  <!-- ring-2 ring-layer fakes the cut-out gap; it is a ring, not a border, so size math is untouched -->
  <img class="inline-block size-11 rounded-full ring-2 ring-layer" src="…" alt="Avatar">
  <img class="inline-block size-11 rounded-full ring-2 ring-layer" src="…" alt="Avatar">

  <!-- optional overflow chip: same size-11 rounded-full box, button + dropdown instead of img -->
  <div class="hs-dropdown [--placement:top-left] relative inline-flex">
    <button id="…" class="hs-dropdown-toggle inline-flex items-center justify-center size-11 rounded-full bg-layer border border-layer-line text-layer-foreground font-medium text-sm shadow-2xs hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
      <span class="font-medium">4+</span>
    </button>
    <div class="hs-dropdown-menu … hidden …" role="menu" aria-orientation="vertical" aria-labelledby="…">…</div>
  </div>
</div>
```

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| `stack` | Overlapping stack | `examples/base-components/avatar-group/stack.html` | Four `flex -space-x-2` rows demonstrating the size scale only: `size-8`, `size-9.5`, `size-11`, `size-15.5`. Ring stays `ring-2 ring-layer` at every size. Largest file (3.5 KB) but the least new markup. |
| `grid` | Grid layout | `examples/base-components/avatar-group/grid.html` | `grid grid-cols-3 gap-4` instead of the overlap — no `-space-x-2`, so `ring-2 ring-layer` is now decorative. Ends with a `9+` chip as a `<span class="inline-flex … size-11 rounded-full bg-layer border border-layer-line">` (non-interactive, no dropdown). |
| `bordered-color` | Custom border color | `examples/base-components/avatar-group/bordered-color.html` | Only change: `ring-layer` → `ring-primary`. Smallest file (1.1 KB). |
| `with-tooltip` | Avatar group with tooltips | `examples/base-components/avatar-group/with-tooltip.html` | Each avatar is wrapped in `<div class="hs-tooltip inline-block">`; the `<img>` gains `hs-tooltip-toggle relative … hover:z-10` and a sibling `<span class="hs-tooltip-content … bg-tooltip border border-tooltip-line text-xs text-tooltip-foreground rounded-lg" role="tooltip">`. Requires `HSTooltip`. |
| `with-dropdown` | Avatar group with dropdown | `examples/base-components/avatar-group/with-dropdown.html` | Four avatars then a `4+` `hs-dropdown-toggle` button opening `hs-dropdown-menu` (`bg-dropdown border border-dropdown-line shadow-md rounded-lg p-1`) with four `flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-dropdown-item-foreground hover:bg-dropdown-item-hover focus:outline-hidden focus:bg-dropdown-item-focus` links. Requires `HSDropdown`. |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` | The ring drawn between overlapping avatars (`ring-layer`) and the `N+` chip fill | `white` | `neutral-800` |
| `layer-line` | `N+` chip border | `gray-200` | `neutral-700` |
| `layer-foreground` | `N+` chip label | `gray-800` | `white` |
| `layer-hover` | `N+` button hover fill (dropdown variant) | `gray-50` | `neutral-700` |
| `layer-focus` | `N+` button focus fill (dropdown variant) | `gray-50` | `neutral-700` |
| `primary` | Alternate avatar ring in `bordered-color` (`ring-primary`) | `gray-800` | `white` |
| `tooltip` | Tooltip bubble fill | `gray-900` | `white` |
| `tooltip-foreground` | Tooltip label | `white` | `neutral-800` |
| `tooltip-line` | Tooltip border | `transparent` | `transparent` |
| `dropdown` | Overflow menu panel fill | `white` | `neutral-900` |
| `dropdown-line` | Overflow menu panel border | `transparent` | `transparent` |
| `dropdown-item-foreground` | Menu link label | `gray-800` | `neutral-200` |
| `dropdown-item-hover` | Menu link hover fill | `gray-100` | `neutral-800` |
| `dropdown-item-focus` | Menu link focus fill | `gray-100` | `neutral-800` |

## Behaviour (JS)

There is **no `HSAvatarGroup`** — `index.json` reports `hs_js: []` and `hs_attrs: []` for all five examples, and `assets/js/preline/` has no avatar module. `stack`, `grid` and `bordered-color` are static markup only.

Two examples borrow other components' plugins:

| Example | Plugin | Module | autoInit selector |
|---|---|---|---|
| `with-tooltip` | `HSTooltip` | `assets/js/preline/tooltip.js` | `.hs-tooltip:not(.--prevent-on-load-init)` |
| `with-dropdown` | `HSDropdown` | `assets/js/preline/dropdown.js` | `.hs-dropdown:not(.--prevent-on-load-init)` |

Both autoInit on a **class**, not a `data-hs-*` attribute, and both prune their global collections (`window.$hsTooltipCollection`, `window.$hsDropdownCollection`) against `document.contains(el)` on each run. Placement for the menu is set inline via the CSS custom property `[--placement:top-left]` on the `.hs-dropdown` wrapper — Preline's `POSITIONS` map in `dropdown.js` rewrites `top-left` to `top-start` and feeds it to **Floating UI** (`computePosition`), not Popper. See `components/dropdown.md` / `components/tooltip.md` for the full APIs.

## Gotchas
- **`ring-layer` only looks right on a `layer`-coloured background.** The ring is a fake cut-out: it is painted in the *panel* colour (`white` light / `neutral-800` dark), so a facepile dropped on `bg-background`, `bg-surface` or a coloured hero shows a halo of the wrong colour around every face. Match the ring to whatever is actually behind it.
- **Overlap direction is DOM order.** `-space-x-2` pulls each child 8 px onto the one before it, and without any `z-index` later siblings paint on top — so every avatar is clipped by 8 px by its immediate successor and only the *last* one is fully visible. This is the reverse of what most designs mock up; reverse the array, don't fight it with `z-index` per item.
- **`hover:z-10` on the tooltip variant is load-bearing.** Without it the next avatar in the stack paints over the hovered one and clips its tooltip trigger. It comes with `relative` on the same `<img>` — `z-index` does nothing on a `static` element.
- **`tooltip-line` and `dropdown-line` are `transparent` in BOTH moon modes.** `border border-tooltip-line` and `border border-dropdown-line` paint nothing; separation comes from `bg-tooltip` contrast and `shadow-md`. Don't add a visible border "back" unless you intend a design change.
- **moon inverts the tooltip.** `tooltip` = `gray-900` light but `white` dark; `tooltip-foreground` = `white` light but `neutral-800` dark. A hardcoded `text-white` inside the bubble is invisible in dark mode.
- **`ring-primary` under moon is not a brand colour.** `primary` resolves to `gray-800` (light) / `white` (dark) — in dark mode `ring-primary` and `ring-layer` are near-opposites, so `bordered-color` reads as a heavy white outline, not a subtle accent.
- **The `N+` chip must match the avatar box exactly** — `size-11 rounded-full` in both `grid` and `with-dropdown`. Change the avatar size and the chip does not follow; there is no shared class.
- **The dropdown chip is inside the `flex -space-x-2` container**, so its wrapper needs `relative inline-flex` (it has it) or the absolutely-positioned menu anchors to the wrong box.
- **`alt="Avatar"` on every image is not an accessible name.** Five identical alts read as five identical items; the `N+` button's `aria-label="Dropdown"` is equally generic. Substitute real names.
- **Re-init after dynamic render**: adding avatars in a SPA does not register new `.hs-tooltip` / `.hs-dropdown` nodes — call `HSTooltip.autoInit()` / `HSDropdown.autoInit()` after the render.

## Copy-paste base

Verbatim from `examples/base-components/avatar-group/bordered-color.html` (smallest correct example — a four-face stack; swap `ring-primary` for `ring-layer` for the default look):

```html
<!-- Avatar Group -->
<div class="flex -space-x-2">
  <img class="inline-block size-11 rounded-full ring-2 ring-primary" src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80" alt="Avatar">
  <img class="inline-block size-11 rounded-full ring-2 ring-primary" src="https://images.unsplash.com/photo-1531927557220-a9e23c1e4794?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80" alt="Avatar">
  <img class="inline-block size-11 rounded-full ring-2 ring-primary" src="https://images.unsplash.com/photo-1541101767792-f9b2b1c4f127?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&&auto=format&fit=facearea&facepad=3&w=300&h=300&q=80" alt="Avatar">
  <img class="inline-block size-11 rounded-full ring-2 ring-primary" src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80" alt="Avatar">
</div>
<!-- End Avatar Group -->
```
