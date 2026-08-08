---
component: sidebar
label: Sidebar
category: navigations
docs: https://preline.co/docs/components/sidebar.html
examples: 10
js: HSOverlay
tokens: [sidebar, sidebar-line, sidebar-divider, sidebar-nav-foreground, sidebar-nav-hover, sidebar-nav-focus, sidebar-nav-active, layer, layer-line, layer-foreground, layer-hover, layer-focus, secondary, secondary-foreground, secondary-line, secondary-hover, secondary-focus, muted-foreground, muted-foreground-2, muted-hover, muted-focus, surface-1, surface-foreground, dropdown, dropdown-line, dropdown-item-foreground, dropdown-item-hover, dropdown-item-focus, tooltip, tooltip-line, tooltip-foreground, foreground, scrollbar-track, scrollbar-thumb]
---

# Sidebar

A fixed-position `div.hs-overlay` pinned to the inline-start edge, off-canvas below the breakpoint and statically visible above it, holding a `<header>`, a scrollable `<nav>` body and an optional `mt-auto` footer.

## When to use
- Persistent app chrome with many destinations, groups, or a signed-in account switcher — dashboards, admin, settings.
- When the nav must survive page changes and stay visible at desktop width. For marketing/landing chrome use `navbar`.
- **Not** for a transient panel (filters, details, a form) — that is `overlay` proper, same plugin, different framing.
- **Not** for 3–7 flat links — a `navbar` costs a tenth of the markup.
- Pick the variant by *desktop* behaviour: overlays content (`basic-usage`/`offcanvas`), pushes content (`content-push`), collapses to icons (`content-push-to-mini-sidebar`), is permanently narrow (`mini-sidebar`), or is drag-resizable (`layout-splitter`).

## Anatomy

```html
<!-- REDUCED SKELETON — every class/attribute below appears verbatim in the example files -->

<!-- external toggle: any element, anywhere -->
<button type="button" class="… bg-secondary border border-secondary-line text-secondary-foreground hover:bg-secondary-hover focus:bg-secondary-focus"
        aria-haspopup="dialog" aria-expanded="false"
        aria-controls="hs-sidebar-basic-usage"                 <!-- bare id, NO hash -->
        aria-label="Toggle navigation"
        data-hs-overlay="#hs-sidebar-basic-usage">Open</button> <!-- selector, WITH hash -->

<div id="hs-sidebar-basic-usage"
     class="hs-overlay [--auto-close:lg] lg:block lg:translate-x-0 lg:inset-e-auto lg:bottom-0 w-64
            hs-overlay-open:translate-x-0
            -translate-x-full transition-all duration-300 transform
            h-full hidden
            fixed top-0 inset-s-0 bottom-0 z-60
            bg-sidebar border-e border-sidebar-line"
     role="dialog" tabindex="-1" aria-label="Sidebar">
  <div class="relative flex flex-col h-full max-h-full">

    <header class="p-4 flex justify-between items-center gap-x-2">
      <a class="flex-none font-semibold text-xl text-layer-foreground focus:outline-hidden focus:opacity-80" href="#" aria-label="Brand">Brand</a>
      <div class="lg:hidden -me-2">
        <button type="button" class="… bg-layer border border-layer-line text-muted-foreground-2 hover:bg-layer-hover focus:bg-layer-focus rounded-full"
                data-hs-overlay="#hs-sidebar-basic-usage">…X…<span class="sr-only">Close</span></button>
      </div>
    </header>

    <nav class="h-full overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb">
      <div class="pb-0 px-2 w-full flex flex-col flex-wrap">
        <ul class="space-y-1">
          <li><a class="flex items-center gap-x-3.5 py-2 px-2.5 bg-sidebar-nav-active text-sm text-sidebar-nav-foreground rounded-lg hover:bg-sidebar-nav-hover focus:outline-hidden focus:bg-sidebar-nav-focus" href="#">…</a></li>
        </ul>
      </div>
    </nav>

    <!-- optional: <footer class="mt-auto p-2 border-t border-sidebar-divider"> … hs-dropdown … </footer> -->
  </div>
</div>
```

`hidden` + `-translate-x-full` + `transform` + `transition-all` are the closed state; `hs-overlay-open:translate-x-0` is the open state; the `lg:` trio (`lg:block lg:translate-x-0 lg:inset-e-auto`) is what makes it permanently visible at desktop while `hidden` is still on the element.

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| `basic-usage` | Default sidebar | `examples/navigations/sidebar/basic-usage.html` | Baseline (4.7 KB): brand header, flat `<ul>` of 3 links, first is `bg-sidebar-nav-active`, "Calendar" carries a `bg-surface-1 text-surface-foreground` pill. |
| `collapsible-group` | Collapsible nav groups | `examples/navigations/sidebar/collapsible-group.html` | Body becomes `div.hs-accordion-group[data-hs-accordion-always-open]`; group items are `li.hs-accordion > button.hs-accordion-toggle` + `div.hs-accordion-content`, with paired `hs-accordion-active:block hidden` / `hs-accordion-active:hidden block` chevrons. Nests two levels (`ps-7`, then `ps-2`). Needs `HSAccordion`. |
| `offcanvas` | Offcanvas sidebar | `examples/navigations/sidebar/offcanvas.html` | **Byte-identical to `collapsible-group` apart from the id string** (16631 vs 16663 bytes = 4 × 8 chars). Nothing to learn here that `collapsible-group` does not already show. |
| `header-example-with-dropdown` | Header with dropdown | `examples/navigations/sidebar/header-example-with-dropdown.html` | Adds a `data-hs-overlay-minifier` button to the header **and** an account block `div.mt-auto.p-2.border-y.border-sidebar-divider` holding `div.hs-dropdown.[--strategy:absolute].[--auto-close:inside]` with an avatar + `hs-dropdown-menu.w-60`. Despite the name, `mt-auto` pins it to the bottom (see Gotchas). |
| `footer-example-with-dropdown` | Footer with dropdown | `examples/navigations/sidebar/footer-example-with-dropdown.html` | Same account dropdown, in a real `<footer class="mt-auto p-2 border-t border-sidebar-divider">`, and **no** minifier button. This is the one to copy for a bottom account switcher. |
| `content-push` | Sidebar with content push | `examples/navigations/sidebar/content-push.html` | Root gains `[--is-layout-affect:true] [--opened:lg] [--body-scroll:true] lg:[--overlay-backdrop:false]`, flips to `lg:-translate-x-full` + `lg:hs-overlay-layout-open:translate-x-0`, and drops the external toggle block. A sibling `div.sm:hs-overlay-layout-open:ms-64.bg-layer.transition-all` is the pushed content. |
| `content-push-to-mini-sidebar` | Content push with mini sidebar | `examples/navigations/sidebar/content-push-to-mini-sidebar.html` | Root gains `hs-overlay-minified:w-13` + `overflow-x-hidden`; a `data-hs-overlay-minifier` button toggles it; labels are wrapped in `<span class="hs-overlay-minified:hidden">` and rows get `min-h-[36px]`. |
| `mini-sidebar` | Mini sidebar | `examples/navigations/sidebar/mini-sidebar.html` | Permanently `w-20`, no minifier. Links become `size-9.5 rounded-full` icon buttons inside `div.hs-tooltip.[--placement:right]` with `span.hs-tooltip-content` on `bg-tooltip border-tooltip-line text-tooltip-foreground`. Needs `HSTooltip`. |
| `layout-splitter` | Resizable sidebar | `examples/navigations/sidebar/layout-splitter.html` | Breakpoint drops to `sm`. Root carries `data-hs-layout-splitter='{"horizontalSplitterTemplate":…,"horizontalSplitterClasses":"pointer-events-auto relative flex"}'`; the inner wrapper is `data-hs-layout-splitter-horizontal-group` + `pointer-events-none`; the panel is `data-hs-layout-splitter-item='{"dynamicSize":37.0,"minSize":13.0,"preLimitSize":25.0}'` with inline `style="flex: 37 1 0px;"`. `bg-sidebar border-e` moves off the root onto the item. Needs `HSLayoutSplitter`. |
| `empty-content` | Empty sidebar shell | `examples/navigations/sidebar/empty-content.html` | Smallest file (2.2 KB): the shell with `header.justify-end` (close button only, no brand) and an empty `<nav>`. Use it as the starting skeleton. |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `sidebar` | Panel fill | `white` | `neutral-900` |
| `sidebar-line` | Inline-end rule (`border-e`) | `gray-200` | `neutral-700` |
| `sidebar-divider` | Rule around the account block / footer | `gray-200` | `neutral-700` |
| `sidebar-nav-foreground` | Nav item label + icon | `gray-800` | `neutral-200` |
| `sidebar-nav-active` | Current item resting fill | `gray-100` | `neutral-700` |
| `sidebar-nav-hover` | Nav item hover fill | `gray-100` | `neutral-700` |
| `sidebar-nav-focus` | Nav item focus fill | `gray-100` | `neutral-700` |
| `layer-foreground` | Brand wordmark in the header | `gray-800` | `white` |
| `layer` / `layer-line` | Close-button fill / border | `white` / `gray-200` | `neutral-800` / `neutral-700` |
| `layer-hover` / `layer-focus` | Close-button hover + focus fill | `gray-50` | `neutral-700` |
| `muted-foreground-2` | Close- and minifier-button icon | `gray-700` | `neutral-300` |
| `muted-hover` / `muted-focus` | Minifier + account-dropdown trigger hover / focus fill | `gray-100` | `neutral-700` |
| `muted-foreground` | Splitter grip icon (`layout-splitter`) | `gray-500` | `neutral-500` |
| `secondary` / `secondary-foreground` / `secondary-line` | External "Open" toggle: fill / label / border | `gray-900` / `white` / `transparent` | `white` / `neutral-800` / `transparent` |
| `secondary-hover` / `secondary-focus` | Same toggle, hover + focus fill | `gray-800` | `neutral-100` |
| `surface-1` / `surface-foreground` | "New" pill on a nav item: fill / label | `gray-200` / `gray-800` | `neutral-600` / `neutral-200` |
| `foreground` | Account-dropdown trigger label | `gray-800` | `neutral-200` |
| `dropdown` / `dropdown-line` | Account menu panel fill / border | `white` / `transparent` | `neutral-900` / `transparent` |
| `dropdown-item-foreground` | Account menu item label | `gray-800` | `neutral-200` |
| `dropdown-item-hover` / `dropdown-item-focus` | Account menu item hover + focus fill | `gray-100` | `neutral-800` |
| `tooltip` / `tooltip-foreground` / `tooltip-line` | Mini-sidebar tooltip fill / label / border | `gray-900` / `white` / `transparent` | `white` / `neutral-800` / `transparent` |
| `scrollbar-track` / `scrollbar-thumb` | `<nav>` overflow scrollbar | `gray-100` / `gray-300` | `neutral-700` / `neutral-500` |

## Behaviour (JS)

Class `HSOverlay` — source of truth `assets/js/preline/overlay.js` (v4.2.0). Every example needs it. Additional plugins, by file (`grep -l` in `examples/navigations/sidebar/`):

| Plugin | Files |
|---|---|
| `HSAccordion` (`data-hs-accordion-always-open`) | `collapsible-group`, `offcanvas`, `content-push`, `header-example-with-dropdown`, `footer-example-with-dropdown`, `layout-splitter` |
| `HSDropdown` (`hs-dropdown`) | `header-example-with-dropdown`, `footer-example-with-dropdown` |
| `HSTooltip` (`hs-tooltip`) | `mini-sidebar` |
| `HSLayoutSplitter` (`data-hs-layout-splitter`) | `layout-splitter` |

**Attributes**

| Attribute / class | Effect |
|---|---|
| `.hs-overlay` | The `autoInit()` query (`.hs-overlay:not(.--prevent-on-load-init)`). Instances live in `window.$hsOverlayCollection`; the `opened` class marks open state. |
| `data-hs-overlay="<selector>"` | Marks a toggle. Any number of toggles may point at one overlay; `autoInit()` calls `updateToggles()` on every instance afterwards. |
| `data-hs-overlay-minifier="<selector>"` | Second toggle kind — flips the `minified` class / `hs-overlay-minified:*` variants instead of open/closed. Fires `toggleMinifierClicked.hs.overlay`. |
| `data-hs-overlay-options='{…}'` | JSON. Recognised keys in this build: `moveOverlayToBody`, `hiddenClass`, `emulateScrollbarSpace`, `isClosePrev`, `backdropClasses`, `backdropExtraClasses`, `backdropParent`. |
| `data-hs-overlay-backdrop-template` / `-backdrop-container` | Custom backdrop markup / mount point. |
| `data-hs-overlay-keyboard` | Keyboard (Esc) handling opt-out. |
| `data-hs-accordion-always-open` | On `.hs-accordion-group`: sibling groups stay open (`HSAccordion`). |
| `data-hs-layout-splitter` / `-horizontal-group` / `-vertical-group` / `-item` | `HSLayoutSplitter` root / axis group / resizable panel. Item JSON keys: `dynamicSize`, `minSize`, `preLimitSize` (also `staticSize`-less; `maxSize` is not read by this build). |

**Options — read as CSS custom properties off the element, so they are breakpoint-scopable (`lg:[--overlay-backdrop:false]`)**

| Property | Used by | Effect |
|---|---|---|
| `--auto-close` | every example (`lg`, `sm`) | Auto-close at/above that breakpoint. |
| `--opened` | `content-push` | Breakpoint at/above which the overlay starts open. |
| `--is-layout-affect` | `content-push` | Adds the layout-open class so sibling content can shift (`hs-overlay-layout-open:ms-64`). |
| `--overlay-backdrop` | `content-push` (`lg:` false) | Suppresses the backdrop. |
| `--body-scroll` | `content-push` | Leaves `<body>` scrollable while open (no `hs-overlay-body-open`). |
| `--auto-close-equality-type`, `--has-autofocus`, `--auto-hide`, `--close-when-click-inside`, `--has-dynamic-z-index`, `--overlay-scroll-behavior`, `--tab-accessibility-limited`, `--toggle-classes-immediately` | (available, unused here) | Also read by `overlay.js`. |

**Init** — `HSOverlay.autoInit()` on `window` `load`: creates/prunes `window.$hsOverlayCollection`, counts already-`opened` items, constructs missing instances, then re-runs `updateToggles()` everywhere. Idempotent.

**Static API** — `HSOverlay.autoInit()`, `.open(target)`, `.close(target)`, `.setOpened(…)`, `.getInstance(target, isInstance)`, `.on(evt, target, cb)`.

**Events** — `open.hs.overlay`, `close.hs.overlay`, `toggleClicked.hs.overlay`, `toggleMinifierClicked.hs.overlay`.

**`HSLayoutSplitter`** — `autoInit()` over `[data-hs-layout-splitter]:not(.--prevent-on-load-init)`; statics `autoInit`, `getInstance`, `on`; events `drag.hs.layoutSplitter`, `onPrevLimit`/`onNextLimit`/`onPrevPreLimit`/`onNextPreLimit.hs.layoutSplitter`.

## Gotchas
- **Active, hover and focus are the same colour.** `sidebar-nav-active`, `sidebar-nav-hover` and `sidebar-nav-focus` all resolve to `gray-100` (light) / `neutral-700` (dark). A hovered item is pixel-identical to the current page. Nothing in the shipped markup carries `aria-current` either — add it, and add your own weight/indicator if the distinction matters.
- **`header-example-with-dropdown` does not put the dropdown in the header.** The account block is `<div class="mt-auto p-2 border-y border-sidebar-divider">` — `mt-auto` inside the `flex flex-col` shell shoves it to the bottom, exactly like the footer variant, and `border-y` draws a rule on both sides. The only true header difference is the added `data-hs-overlay-minifier` button. Want it at the top? Drop `mt-auto`.
- **`offcanvas.html` is `collapsible-group.html` with a renamed id.** Do not spend time diffing them.
- **`aria-controls` takes a bare id, `data-hs-overlay` takes a selector with `#`.** Copying one into the other breaks either the binding or the a11y relationship.
- **Every example reuses `id="hs-sidebar-<variant>"` in four places** (toggle `aria-controls`, toggle `data-hs-overlay`, the root `id`, the close button `data-hs-overlay`). Rename all four together — a partial rename silently produces a toggle that opens nothing.
- **The close button is invisible against the panel in light mode.** `bg-layer` and `bg-sidebar` are both `white`; only `border-layer-line` separates them. Same story for the brand: `text-layer-foreground` is `white` in dark (not `neutral-200` like `foreground`), so it reads brighter than the nav items on purpose.
- **`hs-overlay-open:*`, `hs-overlay-minified:*`, `hs-overlay-layout-open:*`, `hs-accordion-active:*`, `hs-tooltip-shown:*` are not part of the theme.** They come from the plugin variant files `@import`ed by `assets/css/variants.css`; grepping them in `assets/css/themes/moon.css` and `assets/css/project-moon.css` returns zero hits. Without that CSS the sidebar stays `-translate-x-full` — open, focus-trapped and off-screen.
- **Auto-init fires once on `window` `load`.** A sidebar mounted by a SPA route change is never bound: the desktop `lg:block` layout still looks right, but the mobile toggle does nothing. Call `HSOverlay.autoInit()` / `HSStaticMethods.autoInit()` after mount.
- **`hidden` stays on the root at desktop.** Visibility comes from `lg:block` beating it in specificity order, not from the class being removed. Replacing `hidden` with `opacity-0` or removing it breaks the mobile closed state.
- **`z-60` is above most app chrome.** A sticky `navbar` at `z-50` (as in the mega-menu examples) will be covered by the sidebar. Reconcile the two before shipping both.
- **`content-push` declares `[--body-scroll:true]` twice** in the same class attribute (once mid-string, once at the end). Harmless, but do not treat the duplicate as meaningful.
- **`content-push` has no external "Open" button.** It ships only the in-content toggle inside the pushed `div`. Copying the file alone gives you a sidebar with no visible way to open it below `lg`.
- **`layout-splitter` needs `pointer-events-none` on the group and `pointer-events-auto` on the item and the splitter.** They are in the markup for a reason: the group spans the viewport and would otherwise eat every click on the page.
- **`data-hs-layout-splitter` JSON embeds an HTML template with escaped quotes.** It must stay single-quoted in the attribute; reformatting it with a prettifier that normalises quotes will break the parse silently.
- **`border-dropdown-line`, `border-secondary-line` and `border-tooltip-line` all draw nothing under moon** (`transparent` in both modes). They preserve box size; the separation is `shadow-lg` / `shadow-2xs`. In dark, `bg-dropdown` (`neutral-900`) sits on `bg-sidebar` (`neutral-900`) — same colour, shadow only.
- **`mini-sidebar` is not the minified state.** It is a separate, permanently `w-20` sidebar with tooltips and no `data-hs-overlay-minifier`. The collapsible one is `content-push-to-mini-sidebar` (`hs-overlay-minified:w-13`). Only those two files contain `hs-overlay-minified`.

## Copy-paste base

`examples/navigations/sidebar/empty-content.html`, verbatim and complete — the shell with an empty `<nav>` to fill.

```html
<!-- Navigation Toggle -->
<div class="lg:hidden py-16 text-center">
  <button type="button" class="py-2 px-3 inline-flex justify-center items-center gap-x-2 text-start bg-secondary border border-secondary-line text-secondary-foreground text-sm font-medium rounded-lg shadow-2xs hover:bg-secondary-hover focus:outline-hidden focus:bg-secondary-focus" aria-haspopup="dialog" aria-expanded="false" aria-controls="hs-sidebar-empty-content" aria-label="Toggle navigation" data-hs-overlay="#hs-sidebar-empty-content">
    Open
  </button>
</div>
<!-- End Navigation Toggle -->

<!-- Sidebar -->
<div id="hs-sidebar-empty-content" class="hs-overlay [--auto-close:lg] lg:block lg:translate-x-0 lg:inset-e-auto lg:bottom-0 w-64
hs-overlay-open:translate-x-0
-translate-x-full transition-all duration-300 transform
h-full
hidden

fixed top-0 inset-s-0 bottom-0 z-60
bg-sidebar border-e border-sidebar-line" role="dialog" tabindex="-1" aria-label="Sidebar" >
  <div class="relative flex flex-col h-full max-h-full ">
      <!-- Header -->
      <header class=" p-4 flex justify-end items-center gap-x-2">

        <div class="lg:hidden -me-2">
          <!-- Close Button -->
          <button type="button" class="flex justify-center items-center gap-x-3 size-6 bg-layer border border-layer-line text-sm text-muted-foreground-2 hover:bg-layer-hover rounded-full disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-layer-focus" data-hs-overlay="#hs-sidebar-empty-content">
            <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            <span class="sr-only">Close</span>
          </button>
          <!-- End Close Button -->
        </div>
      </header>
      <!-- End Header -->

      <!-- Body -->
      <nav class="h-full overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb">
      </nav>
      <!-- End Body -->
  </div>
</div>
<!-- End Sidebar -->
```
