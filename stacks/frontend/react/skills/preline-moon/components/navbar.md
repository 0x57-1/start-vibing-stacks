---
component: navbar
label: Navbar
category: navigations
docs: https://preline.co/docs/components/navbar.html
examples: 11
js: HSCollapse
tokens: [navbar, navbar-line, navbar-nav-foreground, navbar-inverse, primary-active, primary-hover, primary-focus, primary, foreground, foreground-inverse, layer, layer-line, layer-foreground, layer-hover, layer-focus, dropdown, dropdown-line, dropdown-item-foreground, dropdown-item-hover, dropdown-item-focus, line-inverse, plain, scrollbar-track, scrollbar-thumb]
---

# Navbar

A `<header class="bg-navbar border-b border-navbar-line">` wrapping a centred `<nav class="max-w-340 mx-auto px-4">`, with a brand on one side and a link row on the other, optionally hidden behind an `HSCollapse` hamburger below `sm`.

## When to use
- Top-level site or app chrome: brand + 3–7 destinations + at most one action button.
- Marketing/landing shells and any page that is *not* a dashboard. For a persistent app chrome with many grouped destinations, use `sidebar` instead.
- **Not** for multi-column panels of links — use `mega-menu` (same collapse shell, `hs-dropdown` inside).
- **Not** for in-page section switching — use `tabs` or `scrollspy`.
- The `sm:` breakpoint is hard-coded in every example (`sm:flex`, `sm:hidden`, `sm:block`). Changing it means editing 6–8 utilities per file, not one variable.

## Anatomy

```html
<!-- REDUCED SKELETON — every class/attribute below appears verbatim in the example files -->
<header class="relative flex flex-wrap sm:justify-start sm:flex-nowrap w-full py-3 bg-navbar border-b border-navbar-line">
  <nav class="max-w-340 w-full mx-auto px-4 sm:flex sm:items-center sm:justify-between">

    <div class="flex items-center justify-between">                     <!-- brand row: brand + hamburger -->
      <a class="flex-none text-xl font-semibold text-foreground focus:outline-hidden focus:opacity-80"
         href="#" aria-label="Brand">Brand</a>

      <div class="sm:hidden">
        <button type="button"
                class="hs-collapse-toggle … bg-layer border border-layer-line text-layer-foreground hover:bg-layer-hover focus:bg-layer-focus"
                id="hs-navbar-example-collapse"        <!-- content's aria-labelledby target -->
                aria-expanded="false"                  <!-- load-bearing: HSCollapse only syncs it if present -->
                aria-controls="hs-navbar-example"      <!-- bare id, NO hash -->
                data-hs-collapse="#hs-navbar-example"> <!-- selector, WITH hash -->
          <svg class="hs-collapse-open:hidden shrink-0 size-4">…</svg>   <!-- burger -->
          <svg class="hs-collapse-open:block hidden shrink-0 size-4">…</svg> <!-- X -->
          <span class="sr-only">Toggle navigation</span>
        </button>
      </div>
    </div>

    <div id="hs-navbar-example"
         class="hidden hs-collapse overflow-hidden transition-all duration-300 basis-full grow sm:block"
         aria-labelledby="hs-navbar-example-collapse" role="region">
      <div class="flex flex-col gap-5 mt-5 sm:flex-row sm:items-center sm:justify-end sm:mt-0 sm:ps-5">
        <a class="font-medium text-primary-active focus:outline-hidden" href="#" aria-current="page">Landing</a>
        <!-- NOTE: no `text-sm` on the current-page link in collapse.html; the non-collapsing
             `example.html` does carry `text-sm font-medium` there. -->
        <a class="text-sm text-navbar-nav-foreground hover:text-primary-hover focus:outline-hidden focus:text-primary-focus" href="#">Account</a>
      </div>
    </div>
  </nav>
</header>
```

`hidden` + `overflow-hidden` + `transition-all` on the collapse target are required — `HSCollapse` animates `style.height` between `0` and `scrollHeight`. `sm:block` is what restores the row above the breakpoint while the JS-managed `hidden` is still on the element.

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| `example` | Default navbar | `examples/navigations/navbar/example.html` | **No collapse at all** (1 KB). Plain `sm:flex sm:items-center sm:justify-between`; the link row is `flex flex-row items-center gap-5 mt-5 sm:justify-end sm:mt-0 sm:ps-5` and simply wraps on mobile (`flex-wrap` on the `<header>`). Brand uses `text-foreground`. |
| `horizontal-scroll` | Horizontally scrollable navbar | `examples/navigations/navbar/horizontal-scroll.html` | No collapse either; header is `py-4`, not `py-3`. Link row gets `pb-2 overflow-x-auto … sm:pb-0 sm:overflow-x-visible [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb`, and carries 10 links instead of 4. Brand uses `text-layer-foreground` (not `text-foreground` — see Gotchas). |
| `collapse` | Collapsible navbar | `examples/navigations/navbar/collapse.html` | The canonical shell shown in Anatomy: `hs-collapse-toggle` + `data-hs-collapse`, dual burger/X SVGs, `sm:justify-end`. |
| `svg` | SVG logo | `examples/navigations/navbar/svg.html` | `collapse` with the brand text replaced by an inline `<svg class="w-10 h-auto">`. |
| `svg-and-text` | SVG logo with text | `examples/navigations/navbar/svg-and-text.html` | Identical to `svg` except the SVG is wrapped in `<span class="inline-flex items-center gap-x-2 text-xl font-semibold text-foreground">` alongside the word "Brand". |
| `image` | Image logo | `examples/navigations/navbar/image.html` | `collapse` with `<img class="w-10 h-auto" src="…/logo-short.png" alt="Logo">` as the brand. |
| `image-and-text` | Image logo with text | `examples/navigations/navbar/image-and-text.html` | `image` with the `<img>` wrapped in the same `inline-flex items-center gap-x-2` span + text. |
| `alignment` | Left aligned navbar | `examples/navigations/navbar/alignment.html` | Byte-identical to `collapse` except `sm:justify-end` is dropped from the link row, so links sit immediately after the brand. |
| `center-aligned-navbar` | Centered navbar | `examples/navigations/navbar/center-aligned-navbar.html` | `flex flex-wrap basis-full` on `<nav>` + `sm:order-1/2/3`: brand (1), links (2), actions (3). Adds a `bg-layer` "Button" next to the hamburger; the collapse target is `sm:grow-0 sm:basis-auto`. |
| `with-dropdown` | Navbar with dropdown | `examples/navigations/navbar/with-dropdown.html` | Adds a nested `hs-dropdown` in the link row: `[--strategy:static] sm:[--strategy:fixed] [--adaptive:none] sm:[--adaptive:adaptive]`, plus a second-level `hs-dropdown` with `sm:[--strategy:absolute]`. Menu is `sm:bg-dropdown sm:border sm:border-dropdown-line sm:shadow-md` — unstyled (in-flow) on mobile. |
| `color-variants` | Navbar color variants | `examples/navigations/navbar/color-variants.html` | Two stacked headers: `bg-navbar-inverse` and `bg-primary`. No border, no `bg-layer` button — the hamburger is `border-line-inverse/30 text-foreground-inverse hover:bg-plain/20`, links are `text-foreground-inverse/70 hover:text-foreground-inverse`. |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `navbar` | Bar fill | `white` | `neutral-900` |
| `navbar-line` | Bottom rule (`border-b`) | `gray-200` | `neutral-700` |
| `navbar-nav-foreground` | Inactive nav link text | `gray-800` | `neutral-200` |
| `primary-hover` | Nav link hover **text** | `gray-900` | `neutral-300` |
| `primary-focus` | Nav link focus **text** | `gray-900` | `neutral-300` |
| `primary-active` | Current page link text (with `font-medium`) | `gray-900` | `neutral-300` |
| `foreground` | Brand wordmark | `gray-800` | `neutral-200` |
| `layer` / `layer-line` / `layer-foreground` | Hamburger + action button: fill / border / icon | `white` / `gray-200` / `gray-800` | `neutral-800` / `neutral-700` / `white` |
| `layer-hover` / `layer-focus` | Same button, hover + focus fill | `gray-50` | `neutral-700` |
| `navbar-inverse` | Dark colour-variant bar fill | `gray-950` | `black` |
| `primary` | Accent colour-variant bar fill | `gray-800` | `white` |
| `foreground-inverse` | Text on both colour variants (`/70` when inactive) | `white` | `white` |
| `line-inverse` | Hamburger border on colour variants, at `/30` | `white` | `white` |
| `plain` | Hamburger hover/focus fill on colour variants, at `/20` | `white` | `neutral-800` |
| `dropdown` / `dropdown-line` | Dropdown panel fill / border (`sm:` only) | `white` / `transparent` | `neutral-900` / `transparent` |
| `dropdown-item-foreground` | Dropdown item label | `gray-800` | `neutral-200` |
| `dropdown-item-hover` / `dropdown-item-focus` | Dropdown item hover + focus fill | `gray-100` | `neutral-800` |
| `scrollbar-track` / `scrollbar-thumb` | Horizontal-scroll variant scrollbar | `gray-100` / `gray-300` | `neutral-700` / `neutral-500` |

## Behaviour (JS)

Class `HSCollapse` — source of truth `assets/js/preline/collapse.js` (v4.2.0). Only the collapsing variants use it; `example` and `horizontal-scroll` are pure CSS. The dropdown inside `with-dropdown` is `HSDropdown` (`assets/js/preline/dropdown.js`).

**Attributes**

| Attribute / class | Effect |
|---|---|
| `data-hs-collapse="<selector>"` | The content selector, resolved once in the constructor with `document.querySelector`. Unresolvable → `init()` never runs → no listener, no error. |
| `.hs-collapse-toggle` | The `autoInit()` query (`.hs-collapse-toggle:not(.--prevent-on-load-init)`). Without it the button is never bound. |
| `aria-expanded` | Synced to `"true"`/`"false"` on init and every toggle — **only if the attribute already exists**. Always ship `aria-expanded="false"`. |
| `.hs-collapse`, `role="region"`, `aria-labelledby` | Markup convention on the target; the JS keys off the `open` and `hidden` classes, not `.hs-collapse`. |
| `[--strategy]`, `[--adaptive]` (dropdown) | Read off the *computed style* of `.hs-dropdown`. `--strategy:static` is the sentinel that **skips Floating UI entirely** (`"static"!==r&&(this.el._floatingUI=this.setupFloatingUI(n))`), so the menu lays out in normal flow — this is how the mobile accordion behaviour is achieved. Defaults: `--strategy:fixed`, `--adaptive:adaptive`, `--trigger:click`, `--auto-close:true`, `--offset:10`. |

**Init** — `collapse.js` registers `window.addEventListener('load', () => HSCollapse.autoInit())`. `autoInit()` creates/prunes `window.$hsCollapseCollection` and skips toggles already in it, so it is idempotent. Manual: `new HSCollapse(el, options, events)`.

**State machine** — `show()` adds `open` to toggle and content, removes `hidden`, sets `height:0`, then next tick `height:scrollHeight`, clearing it after the transition. `hide()` reverses. Both `return false` if `animationInProcess` or the state already matches.

**Static API** — `HSCollapse.autoInit()`, `.getInstance(target, isInstance=false)`, `.findInCollection(target)`, `.show(target)`, `.hide(target)`, `.on(evt, target, cb)`.

**Events** — instance callbacks `beforeOpen`, `open`, `hide`; bubbling `CustomEvent`s `beforeOpen.hs.collapse`, `open.hs.collapse`, `hide.hs.collapse` on the toggle, `detail.payload` = the toggle.

## Gotchas
- **Hover makes dark-mode links *dimmer*, not brighter.** `navbar-nav-foreground` is `neutral-200` and `primary-hover`/`primary-focus`/`primary-active` are all `neutral-300`. Under moon dark, hovering a link, focusing it, or marking it current all move it *down* in contrast. The current page is distinguished from its neighbours only by `font-medium` — `aria-current="page"` is doing the real work.
- **No bundle assigns `window.HSCollapse`.** `grep -o 'window\.HS[A-Za-z]*=' assets/js/preline/preline.js | sort -u` has no `HSCollapse`; `collapse.js` assigns the class to **`window.HSAccordion`**. `preline.js` exposes it only as a module export (`Object.defineProperty(t,"HSCollapse",…)`). To call it globally: `import { HSCollapse } from 'preline'; window.HSCollapse = HSCollapse;`.
- **Auto-init fires once on `window` `load`.** A React/Inertia page swap or any late-rendered navbar is never bound and the hamburger silently does nothing. Call `HSCollapse.autoInit()` (or `HSStaticMethods.autoInit()`) after mount — both are idempotent.
- **`hs-collapse-open:*` is not part of the theme.** It comes from `@import './src/plugins/collapse/variants.css'` in `assets/css/variants.css`; grepping `collapse` in `assets/css/themes/moon.css` and `assets/css/project-moon.css` returns zero hits. Ship the theme without the variants file and the menu still opens while the burger icon never turns into an X.
- **Two examples colour the brand differently.** `example` uses `text-foreground` (`gray-800`/`neutral-200`); `horizontal-scroll` uses `text-layer-foreground` (`gray-800`/**`white`**). Identical in light, visibly different in dark. Pick `foreground` unless you want the brand to punch.
- **`navbar-nav-hover`, `navbar-nav-focus`, `navbar-nav-active` exist as utilities but no example uses them.** They are *surface* tokens (`gray-100`/`neutral-700`), for pill-style nav items. The doc examples colour text instead. Don't reach for `hover:bg-navbar-nav-hover` and expect it to match the shipped look.
- **The hamburger button is invisible against the bar in light mode.** `bg-layer` and `bg-navbar` are both `white`; only `border-layer-line` separates them. Dropping the border loses the button. In dark it is the reverse — `neutral-800` on `neutral-900`.
- **`border-dropdown-line` draws nothing under moon** (`transparent` both modes). The `sm:shadow-md` is the only separation, and it is `sm:`-prefixed along with the background — on mobile the dropdown is deliberately unstyled and in-flow.
- **Hash placement is asymmetric**: `data-hs-collapse="#hs-navbar-example"` (selector, with `#`) vs `aria-controls="hs-navbar-example"` (id, no `#`). Copying one into the other breaks the binding or the a11y relationship.
- **Seven of the nine collapsing examples reuse the ids `hs-navbar-example` / `hs-navbar-example-collapse`** — `collapse`, `svg`, `svg-and-text`, `image`, `image-and-text`, `alignment`, `with-dropdown`. The exceptions are `center-aligned-navbar` (`hs-navbar-alignment`) and `color-variants` (`hs-navbar-dark` + `hs-navbar-primary`, one pair per header). Two navbars sharing an id (or a copy-pasted mobile + desktop pair) bind both toggles to the first match and make `getInstance` ambiguous — the collection is keyed by `el.id`.
- **`max-w-340`** is the container cap in every example (Tailwind v4 spacing scale, 340 × 0.25rem = 85rem). It is not a default; keep it or the bar spans the full viewport.
- **`color-variants` has no `border-b`.** Its two headers rely on fill alone, and its hamburger drops `bg-layer` entirely for `border-line-inverse/30` + `hover:bg-plain/20`. Do not mix the two button recipes.

## Copy-paste base

`examples/navigations/navbar/example.html`, verbatim and complete — the smallest correct navbar (no JS required).

```html
<header class="flex flex-wrap sm:justify-start sm:flex-nowrap w-full py-3 bg-navbar border-b border-navbar-line">
  <nav class="max-w-340 w-full mx-auto px-4 sm:flex sm:items-center sm:justify-between">
    <a class="flex-none font-semibold text-xl text-foreground focus:outline-hidden focus:opacity-80" href="#" aria-label="Brand">Brand</a>
    <div class="flex flex-row items-center gap-5 mt-5 sm:justify-end sm:mt-0 sm:ps-5">
      <a class="text-sm font-medium text-primary-active focus:outline-hidden" href="#" aria-current="page">Landing</a>
      <a class="text-sm text-navbar-nav-foreground hover:text-primary-hover focus:outline-hidden focus:text-primary-focus" href="#">Account</a>
      <a class="text-sm text-navbar-nav-foreground hover:text-primary-hover focus:outline-hidden focus:text-primary-focus" href="#">Work</a>
      <a class="text-sm text-navbar-nav-foreground hover:text-primary-hover focus:outline-hidden focus:text-primary-focus" href="#">Blog</a>
    </div>
  </nav>
</header>
```
