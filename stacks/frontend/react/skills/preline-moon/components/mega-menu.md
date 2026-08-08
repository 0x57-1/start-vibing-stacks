---
component: mega-menu
label: Mega Menu
category: navigations
docs: https://preline.co/docs/components/mega-menu.html
examples: 7
js: HSDropdown
tokens: [dropdown, dropdown-line, dropdown-item-foreground, dropdown-item-hover, dropdown-item-focus, navbar, navbar-line, navbar-nav-foreground, primary-active, primary-hover, primary-focus, foreground, layer, layer-line, layer-foreground, layer-hover, layer-focus, muted-foreground-1, line-2, select, select-line, select-item-active, select-item-foreground, select-item-hover, select-item-focus, overlay, overlay-header, scrollbar-track, scrollbar-thumb]
---

# Mega Menu

A navbar item whose `hs-dropdown-menu` is a multi-column grid of links instead of a single list — a floating panel above `sm`, an in-flow accordion below it.

## When to use
- A navigation entry with 6+ destinations that group into 2–3 labelled columns.
- Anywhere `navbar`'s single-column `with-dropdown` would need scrolling.
- **Not** for 1–5 flat links — use `navbar` (`with-dropdown`). The `columns` example includes a 1-column case, but that is just a dropdown.
- **Not** for a filterable catalogue — put `tabs` inside it (`tabs-as-inner-menu`) or send the user to a real page.
- The whole component sits inside the standard `navbar` collapse shell, so read `components/navbar.md` first.

## Anatomy

```html
<!-- REDUCED SKELETON — every class/attribute below appears verbatim in the example files -->
<header class="… z-50 w-full py-3 bg-navbar border-b border-navbar-line">   <!-- note z-50 -->
  <nav class="max-w-340 w-full mx-auto px-4 md:px-6 lg:px-8">
    <div class="relative sm:flex sm:items-center">                          <!-- `relative` anchors the panel -->
      <div class="flex items-center justify-between"> …brand + hs-collapse-toggle… </div>

      <div id="hs-navbar-basic-usage" class="hidden hs-collapse overflow-hidden transition-all duration-300 basis-full grow sm:block" role="region">
        <div class="flex flex-col gap-y-3 sm:gap-y-0 mt-5 sm:flex-row sm:items-center sm:justify-end sm:mt-0 sm:ps-5">

          <div class="hs-dropdown [--strategy:static] sm:[--strategy:absolute] [--adaptive:none] [--is-collapse:true] sm:[--is-collapse:false]">
            <button id="hs-mega-menu" type="button"
                    class="hs-dropdown-toggle sm:p-2 flex items-center w-full text-sm text-navbar-nav-foreground hover:text-primary-hover focus:outline-hidden focus:text-primary-focus"
                    aria-haspopup="menu" aria-expanded="false" aria-label="Mega Menu">
              Mega Menu
              <svg class="hs-dropdown-open:-rotate-180 sm:hs-dropdown-open:rotate-0 ms-auto sm:ms-2 shrink-0 size-4">…</svg>
            </button>

            <div class="hs-dropdown-menu sm:transition-[opacity,margin] sm:ease-in-out sm:duration-150 hs-dropdown-open:opacity-100 opacity-0 w-full hidden z-10 top-full inset-s-0 min-w-60 sm:bg-dropdown sm:border sm:border-dropdown-line sm:shadow-md rounded-lg py-2 sm:px-2"
                 role="menu" aria-orientation="vertical" aria-labelledby="hs-mega-menu">
              <div class="sm:grid sm:grid-cols-3">                          <!-- the only thing that makes it "mega" -->
                <div class="flex flex-col"> …<a class="… text-dropdown-item-foreground hover:bg-dropdown-item-hover focus:bg-dropdown-item-focus">…</a>… </div>
                <div class="flex flex-col"> … </div>
                <div class="flex flex-col"> … </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </nav>
</header>
```

There is **no `hs-mega-menu` class** in Preline 4.2.0 — `hs-mega-menu` appears only as the button's `id` / `aria-labelledby`. The component is `hs-dropdown` plus a `sm:grid` and the `sm:`-gated panel chrome.

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| `example` | Default mega menu | `examples/navigations/mega-menu/example.html` | Baseline: click-triggered, `sm:grid-cols-3`, panel `w-full min-w-60 top-full inset-s-0`, no top margin. |
| `hover-event` | Hover-triggered mega menu | `examples/navigations/mega-menu/hover-event.html` | One-class diff from `example`: adds `sm:[--trigger:hover]` to the `hs-dropdown` root. Click still works below `sm`. |
| `slide-up-animation` | Slide up animation | `examples/navigations/mega-menu/slide-up-animation.html` | Adds `sm:[--trigger:hover] [--auto-close:false]` and `sm:mt-3` on the panel. The "slide" is the `mt` collapsing under `sm:transition-[opacity,margin]` — no keyframes involved. |
| `auto-close-behavior` | Auto-close behavior | `examples/navigations/mega-menu/auto-close-behavior.html` | Adds `[--auto-close:false]` (click-outside no longer closes it) and `sm:mt-3`. Otherwise identical to `example`. |
| `tabs-as-inner-menu` | Mega menu with tabs | `examples/navigations/mega-menu/tabs-as-inner-menu.html` | Adds `sm:[--trigger:hover] [--auto-close:inside]`. Panel holds a vertical `nav[role=tablist]` with `data-hs-tabs` + 7 `a[data-hs-tab]` styled `hs-tab-active:border-primary-active hs-tab-active:text-primary-active border-e-2`, mirrored to a hidden `<select data-hs-select>` via `data-hs-tab-select`. Needs `HSTabs` **and** `HSSelect`. |
| `mega-menu-to-overlay-on-mobile-resoultion` | Overlay on mobile | `examples/navigations/mega-menu/mega-menu-to-overlay-on-mobile-resoultion.html` | Replaces the collapse shell with an **overlay**: toggle carries `data-hs-overlay` + `data-hs-overlay-options='{"moveOverlayToBody": 640}'`; the panel container is `hs-overlay [--auto-close:sm] bg-overlay … sm:static sm:block sm:transform-none` with `data-hs-overlay-close-on-resize` and a `border-overlay-header` mobile title bar. Needs `HSOverlay`. |
| `columns` | Fewer columns | `examples/navigations/mega-menu/columns.html` | Three sibling menus in one bar — `hs-mega-menu-1-col` (`sm:w-48`, plain `flex flex-col`, no grid), `hs-mega-menu-2-cols` (`sm:grid-cols-2`), `hs-mega-menu-3-cols` (`sm:grid-cols-3`). All `sm:[--trigger:hover]`. |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `navbar` / `navbar-line` | Host bar fill / bottom rule | `white` / `gray-200` | `neutral-900` / `neutral-700` |
| `navbar-nav-foreground` | Trigger label (resting) | `gray-800` | `neutral-200` |
| `primary-hover` / `primary-focus` | Trigger label on hover / focus | `gray-900` | `neutral-300` |
| `primary-active` | Sibling "Active" link; active tab text + `border-e-2` colour | `gray-900` | `neutral-300` |
| `foreground` | Brand wordmark; mobile overlay title | `gray-800` | `neutral-200` |
| `dropdown` | Panel fill — `sm:` only, so mobile inherits the bar | `white` | `neutral-900` |
| `dropdown-line` | Panel border — `sm:` only | `transparent` | `transparent` |
| `dropdown-item-foreground` | Column link label | `gray-800` | `neutral-200` |
| `dropdown-item-hover` / `dropdown-item-focus` | Column link hover + focus fill | `gray-100` | `neutral-800` |
| `layer` / `layer-line` / `layer-foreground` | Hamburger / mobile close button: fill, border, icon | `white` / `gray-200` / `gray-800` | `neutral-800` / `neutral-700` / `white` |
| `layer-hover` / `layer-focus` | Same button, hover + focus fill | `gray-50` | `neutral-700` |
| `muted-foreground-1` | Inactive tab label (`tabs-as-inner-menu`) | `gray-600` | `neutral-400` |
| `line-2` | Divider inside the tabbed panel | `gray-200` | `neutral-700` |
| `select` / `select-line` | Mobile mirror-select field / border | `white` / `transparent` | `neutral-900` / `transparent` |
| `select-item-foreground` | Mirror-select option label | `gray-800` | `neutral-200` |
| `select-item-hover` / `select-item-focus` / `select-item-active` | Mirror-select option states | `gray-100` | `neutral-800` |
| `overlay` | Mobile overlay panel fill (overlay variant) | `white` | `neutral-800` |
| `overlay-header` | Mobile overlay title-bar rule | `gray-200` | `neutral-700` |
| `scrollbar-track` / `scrollbar-thumb` | Overflow scrollbar in the tabbed + overlay variants | `gray-100` / `gray-300` | `neutral-700` / `neutral-500` |

## Behaviour (JS)

Class `HSDropdown` — source of truth `assets/js/preline/dropdown.js` (v4.2.0). The host navbar still uses `HSCollapse` (`data-hs-collapse`, see `components/navbar.md`); `tabs-as-inner-menu` additionally needs `HSTabs` + `HSSelect`; the overlay variant needs `HSOverlay`.

**Options — read as CSS custom properties off the computed style of `.hs-dropdown`, so they are breakpoint-scopable (`sm:[--strategy:absolute]`)**

| Property | Default | Effect |
|---|---|---|
| `--strategy` | `fixed` | Passed to Floating UI. **`static` short-circuits positioning entirely** (`"static"!==r&&(this.el._floatingUI=this.setupFloatingUI(n))`) — the menu renders in normal document flow. This is the whole mobile-accordion mechanism. |
| `--adaptive` | `adaptive` | `none` disables adaptive repositioning. |
| `--trigger` | `click` | `hover` opens on pointer enter. |
| `--auto-close` | `true` | `false` = never auto-close; `inside` = clicking inside does not close (used by `tabs-as-inner-menu`). |
| `--placement` | `""` → `bottom-start` | Floating UI placement. |
| `--offset` | `10` | Floating UI offset in px. |
| `--flip`, `--gpu-acceleration`, `--has-autofocus`, `--autofocus-on-keyboard-only`, `--scope` | `true`/`true`/`true`/`true`/`""` | `--scope:window` appends the menu to `document.body` on open. |

**Structure the JS requires** — the toggle is `:scope > .hs-dropdown-toggle` (or `.hs-dropdown-toggle-wrapper > .hs-dropdown-toggle`, else `children[0]`); the menu is `:scope > .hs-dropdown-menu`. Both must be **direct children** of `.hs-dropdown`.

**Init** — `HSDropdown.autoInit()` on `window` `load`, over `.hs-dropdown:not(.--prevent-on-load-init)`, idempotent (prunes detached, skips known).

**Static API** — `HSDropdown.autoInit()`, `.open(target)`, `.close(target)`, `.closeCurrentlyOpened()`, `.getInstance(target, isInstance)`, `.on(evt, target, cb)`.

**Events** — `open.hs.dropdown`, `close.hs.dropdown` (bubbling `CustomEvent`s).

**Overlay variant only** — `data-hs-overlay-options='{"moveOverlayToBody": 640}'` relocates the panel to `<body>` below 640px (escaping the header's stacking context); `data-hs-overlay-close-on-resize` closes it when the viewport crosses back; `[--auto-close:sm]` auto-closes at the `sm` breakpoint.

## Gotchas
- **`[--is-collapse:true]` / `sm:[--is-collapse:false]` is dead.** It appears on all 9 dropdown roots across these examples, but `grep -c 'is-collapse' assets/js/preline/dropdown.js assets/js/preline/preline.js` returns `0`, and it is absent from `assets/css/`. Nothing reads it. Keeping it is harmless; expecting it to do the mobile switch is not — that is `--strategy:static`.
- **`--strategy:static` is the load-bearing option, and it must not be `fixed`.** Drop `[--strategy:static]` and the mobile menu becomes a floating popover pinned over the page instead of expanding inline inside the collapsed navbar.
- **The panel chrome is `sm:`-gated on purpose.** `sm:bg-dropdown sm:border sm:border-dropdown-line sm:shadow-md` means the mobile menu has *no* background — it inherits `bg-navbar`. Removing the `sm:` prefixes gives you a floating-looking card inside the collapsed nav.
- **`border-dropdown-line` draws nothing under moon** (`transparent` in both modes). `sm:shadow-md` is the only edge. In dark, `bg-dropdown` (`neutral-900`) on `bg-navbar` (`neutral-900`) is *the same colour* — delete the shadow and the panel becomes invisible.
- **`z-50` on the `<header>` and `relative` on the inner wrapper are both required.** The panel is `top-full inset-s-0 z-10`, i.e. positioned against that `relative` ancestor and stacked inside the header's context. `navbar`'s own examples have neither.
- **The chevron rotates in opposite directions per breakpoint**: `hs-dropdown-open:-rotate-180 sm:hs-dropdown-open:rotate-0`. On desktop it deliberately does not move. If your desktop chevron "isn't animating", that is intended, not a bug.
- **`hs-dropdown-open:*` is not part of the theme** — it comes from `@import './src/plugins/dropdown/variants.css'` in `assets/css/variants.css`. Ship the theme without the variants file and the panel opens at `opacity-0`, i.e. invisibly present and click-blocking.
- **`aria-expanded` is only synced if the attribute is already in the markup.** Ship `aria-expanded="false"` on the toggle.
- **`example`, `hover-event`, `slide-up-animation`, `auto-close-behavior` and the overlay variant all reuse `id="hs-mega-menu"`** and `id="hs-navbar-basic-usage"`. Two of them on one page collide — the dropdown collection is keyed by `el.id`, and `aria-labelledby` will point at the wrong button. `columns` is the only file with distinct ids.
- **`[--auto-close:false]` traps keyboard users.** With hover triggering and no auto-close (`slide-up-animation`), the panel only closes on a second click of the toggle. Prefer `inside` if you need clicks inside the panel to survive.
- **`tabs-as-inner-menu` needs three plugins loaded, not one.** Missing `HSSelect` leaves the mobile `<select data-hs-select>` permanently `class="hidden"` — the tab list silently has no mobile control.
- **`hs-mega-menu-content` still exists in the JS but not in the markup.** `HSCollapse.hide()` strips `.block` from `.hs-mega-menu-content` descendants — a leftover hook from the pre-4.x dedicated plugin. Adding that class to your panel makes the navbar collapse force-hide it.

## Copy-paste base

`examples/navigations/mega-menu/columns.html`, the 1-column menu block (lines 17–36), verbatim. It is the smallest complete `hs-dropdown` root in this component; wrap it in the `navbar` collapse shell from Anatomy.

```html
            <div class="hs-dropdown [--strategy:static] sm:[--strategy:absolute] [--adaptive:none] sm:[--trigger:hover] [--is-collapse:true] sm:[--is-collapse:false] ">
            <button id="hs-mega-menu-1-col" type="button" class="hs-dropdown-toggle sm:p-2 flex items-center w-full text-sm text-navbar-nav-foreground hover:text-primary-hover focus:outline-hidden focus:text-primary-focus" aria-haspopup="menu" aria-expanded="false" aria-label="Mega Menu">
              1 Col
              <svg class="hs-dropdown-open:-rotate-180 sm:hs-dropdown-open:rotate-0 ms-auto sm:ms-1 shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>

            <div class="hs-dropdown-menu sm:transition-[opacity,margin] sm:ease-in-out sm:duration-150 hs-dropdown-open:opacity-100 opacity-0 hidden z-10 top-full sm:w-48 sm:bg-dropdown sm:border sm:border-dropdown-line sm:shadow-md rounded-lg py-2 sm:px-2" role="menu" aria-orientation="vertical" aria-labelledby="hs-mega-menu-1-col">
              <div class="flex flex-col">
                <a class="flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-dropdown-item-foreground hover:bg-dropdown-item-hover focus:outline-hidden focus:bg-dropdown-item-focus" href="#">
                  About
                </a>
                <a class="flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-dropdown-item-foreground hover:bg-dropdown-item-hover focus:outline-hidden focus:bg-dropdown-item-focus" href="#">
                  Services
                </a>
                <a class="flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-dropdown-item-foreground hover:bg-dropdown-item-hover focus:outline-hidden focus:bg-dropdown-item-focus" href="#">
                  Customer Story
                </a>
              </div>
            </div>
          </div>
```
