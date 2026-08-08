---
component: scrollspy
label: Scrollspy
category: navigations
docs: https://preline.co/docs/components/scrollspy.html
examples: 3
js: HSScrollspy
tokens: [navbar-nav-foreground, muted-foreground-1, muted-foreground-2, primary-active, primary, foreground, navbar, navbar-line, dropdown, dropdown-line, layer, layer-line, layer-foreground, layer-hover, layer-focus, surface, surface-line, surface-foreground, surface-hover, surface-focus]
---

# Scrollspy

Toggles an `.active` class on the nav link whose target section is currently at the top of the scroll viewport, and hijacks link clicks into a smooth offset scroll.

## When to use
- In-page navigation for one long document: docs page, ToC sidebar, marketing landing anchors.
- The nav must mark reading position **automatically from scroll**. If the user picks a panel and content swaps, use `tabs` instead — scrollspy never hides anything.
- Not a scroll-triggered animation helper and not a sticky-header shrinker. It only adds/removes `.active`.
- Sibling: `HSScrollNav` (`assets/js/preline/scroll-nav.js`, `data-hs-scroll-nav`, markup in `examples/navigations/navs/scroll-nav.html` — indexed under `navs`/`tabs`, it has no scheme file of its own) drives a horizontally overflowing nav strip with `.hs-scroll-nav-prev` / `.hs-scroll-nav-next` buttons. Unrelated to scroll position.

## Anatomy

Reduced skeleton (all classes below appear in the example files):

```html
<!-- scroll container: its scroll event is what the plugin listens to -->
<div id="parent" class="max-h-85 overflow-y-auto">

  <!-- spy container: EVERY [href] inside becomes a spy link -->
  <div data-hs-scrollspy="#content"
       data-hs-scrollspy-scrollable-parent="#parent"
       class="[--scrollspy-offset:220] md:[--scrollspy-offset:70]">
    <a class="text-navbar-nav-foreground hover:text-muted-foreground-1 hs-scrollspy-active:text-primary-active active" href="#first">First</a>
    <a class="text-navbar-nav-foreground hover:text-muted-foreground-1 hs-scrollspy-active:text-primary-active" href="#second">Second</a>
  </div>

  <!-- sections: id must equal each link's href fragment -->
  <div id="content">
    <div id="first">…</div>
    <div id="second">…</div>
  </div>
</div>
```

Nested variant adds `data-hs-scrollspy-group` on the `<li>` wrapping a parent link + its child `<ul>`; the group's first `[href]` also receives `.active` when any child is in view.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Navbar scrollspy | Navbar scrollspy | `examples/navigations/scrollspy/example-in-navbar.html` | Sticky `bg-navbar` header inside the scroll container; links flat + a `hs-dropdown` holding three more anchors; mobile `hs-collapse-toggle` hamburger. Companion `example-in-navbar.js` closes the collapse before scrolling via a Promise-returning `beforeScroll` — **but as shipped it throws**, see Gotchas. |
| Nested navigation | Nested navigation | `examples/navigations/scrollspy/example-with-nested-nav.html` | `grid grid-cols-5` split `col-span-2` (nav) / `col-span-3` (sections), `<ul class="sticky top-0">` as spy container, `data-hs-scrollspy-group` on parent `<li>`s so parent + child both go active. Scroll parent is `max-h-100` (the other two are `max-h-85`). No `--scrollspy-offset`, no JS file, no header. |
| Destroy and reinitialize | Destroy and reinitialize | `examples/navigations/scrollspy/destroy-and-reinitialize.html` | Same markup as the navbar variant (ids re-prefixed `hs-scrollspy-to-destroy-*`) plus two buttons in a sibling `<div class="flex flex-wrap gap-2 mt-4">` **after** the scroll container: `#hs-destroy-scrollspy` on `bg-layer`, `#hs-auto-init-scrollspy` on `bg-surface` and `disabled` at rest, both `disabled:opacity-50 disabled:pointer-events-none`. `destroy-and-reinitialize.js` calls `element.destroy()` / `HSScrollspy.autoInit()`. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `navbar-nav-foreground` | Resting spy-link text (all 3 examples) | `gray-800` | `neutral-200` |
| `muted-foreground-1` | Link hover + focus text | `gray-600` | `neutral-400` |
| `primary-active` | Active link in the navbar / destroy variants | `gray-900` | `neutral-300` |
| `primary` | Active link in the nested variant; active state of the dropdown trigger | `gray-800` | `white` |
| `muted-foreground-2` | Section body paragraphs | `gray-700` | `neutral-300` |
| `foreground` | Brand anchor / "Navbar" column heading | `gray-800` | `neutral-200` |
| `navbar` | Sticky header fill | `white` | `neutral-900` |
| `navbar-line` | Header bottom border (`border-b`) | `gray-200` | `neutral-700` |
| `dropdown` | Dropdown panel fill — applied `sm:` and up only | `white` | `neutral-900` |
| `dropdown-line` | Dropdown panel border, `sm:` and up | `transparent` | `transparent` |
| `layer` | Hamburger toggle + "Destroy scrollspy" button fill | `white` | `neutral-800` |
| `layer-line` | Same buttons' border | `gray-200` | `neutral-700` |
| `layer-foreground` | Same buttons' text/icon | `gray-800` | `white` |
| `layer-hover` | Same buttons' hover fill | `gray-50` | `neutral-700` |
| `layer-focus` | Same buttons' focus fill | `gray-50` | `neutral-700` |
| `surface` | "Reinitialize scrollspy" button fill (secondary weight) | `gray-100` | `neutral-700` |
| `surface-line` | Its border | `transparent` | `transparent` |
| `surface-foreground` | Its text/icon | `gray-800` | `neutral-200` |
| `surface-hover` | Its hover fill | `gray-200` | `neutral-600` |
| `surface-focus` | Its focus fill | `gray-200` | `neutral-600` |

## Behaviour (JS)

Class `HSScrollspy` — `assets/js/preline/scrollspy.js` (v4.2.0). Collection global `window.$hsScrollspyCollection`.

| Attribute | Effect |
|---|---|
| `data-hs-scrollspy` | Marks the spy container. **Its value is never read by the plugin** — it is only the selector handle used by `autoInit()` / `getInstance()`. |
| `data-hs-scrollspy-scrollable-parent` | CSS selector of the scrolling element. Absent → the plugin binds `scroll` on `document`. |
| `data-hs-scrollspy-group` | On an ancestor of a link: the group's first `[href]` also gets `.active`. |
| `data-hs-scrollspy-options` | JSON on the spy container, merged with constructor options. Only option read: `ignoreScrollUp` (default `false`). |

Init: the module registers `window.addEventListener('load', () => HSScrollspy.autoInit())` — the `load` event, not `DOMContentLoaded`. `autoInit()` skips `.--prevent-on-load-init`, prunes entries whose `el` is no longer in the document, and refuses to double-register an element already in the collection, so re-calling it is safe. Manual: `new HSScrollspy(el, options)`.

Statics: `HSScrollspy.getInstance(target, isInstance = false)`, `HSScrollspy.autoInit()`.
Instance: `.destroy()`, `.scrollTo(link)`, `.update(evt, section)`, `.on(name, fn)`.

`HSStaticMethods` (used by both example JS files for `afterTransition`, and offering `autoInit(collection = 'all')`) is defined only in the bundled `assets/js/preline/preline.js` — it is **not** in the standalone `scrollspy.js`. `assets/js/preline/scrollspy-non-auto.js` exports the same class as its UMD entry but registers no `load` listener and never assigns `window.HSScrollspy` — with that build you construct instances yourself.

Events — each is fired twice, through `fireEvent` (the `.on()` callback) **and** as a bubbling DOM CustomEvent. The two carry **different payloads for `afterScroll`**, and the DOM event is not dispatched on the same node for both:

| Event | `.on()` argument | DOM name | dispatched on | `evt.detail.payload` |
|---|---|---|---|---|
| `beforeScroll` | the spy container el | `beforeScroll.hs.scrollspy` | the spy container | the spy container el |
| `afterScroll` | the link that just became active | `afterScroll.hs.scrollspy` | **that link** (bubbles up to the container) | the spy container el |

`beforeScroll` only fires from `scrollTo()`, i.e. on link click — not on `popstate`, and never on scroll-driven activation. If its `.on()` handler returns a Promise, the scroll is deferred until it resolves; any other return value scrolls immediately. `afterScroll` fires from `update()`, once per qualifying section per scroll event.

Mechanics worth knowing: `links = el.querySelectorAll('[href]')`; sections are resolved once in `init()` as `scrollable.querySelector(link.getAttribute('href'))` (raw attribute, not `link.href`, which would be an absolute URL) — but `linkClick`/`scrollTo`/`handlePopstate` re-resolve with **`document.querySelector`**, so a click can scroll to a node the scroll-position pass never sees. Click handler calls `preventDefault()`, skips `javascript:;`, computes `section.offsetTop - offset - scrollable.offsetTop`, `history.pushState(null, null, href)`, then `scrollTo({behavior:'smooth'})`. Offset comes from the CSS custom property `--scrollspy-offset` read off the container via `getComputedStyle`, overridden per section by the same property on the section — resolved with `||`, so a section value of `0` falls back to the container's. A `popstate` listener re-runs the same scroll for back/forward.

## Gotchas

- **Every `[href]` descendant of the spy container is treated as a link, and a bad one is fatal, not cosmetic.** `init()` runs `scrollable.querySelector(link.getAttribute('href'))` on each. `href="#"` or `href="javascript:;"` is not a valid selector → **SyntaxError inside the constructor**, so the whole instance dies (the click-time `javascript:;` guard is too late to help). A valid-but-unmatched `#nope` pushes `null` into `sections`, and then every scroll event throws `TypeError` at `section.getAttribute('id')`. This is why the brand `<a href="#">` sits *outside* the `data-hs-scrollspy` element in the navbar and destroy examples — put the attribute on the tight wrapper around the nav links only.
- **Seed one link with `active`.** `destroy()` runs `this.el.querySelector('[href].active').classList.remove('active')` with no null guard, so destroying before anything activated throws a TypeError. Every example ships the first link with a literal `active` class — keep it.
- **Under moon, `hs-scrollspy-active:text-primary` is invisible in light mode.** `primary` is `gray-800` and the resting `navbar-nav-foreground` is also `gray-800`. The nested-nav example uses exactly that pair. Prefer `hs-scrollspy-active:text-primary-active` (`gray-900`), or carry the state with `font-medium`/underline as well. In dark mode the pair does separate (`white` vs `neutral-200`).
- **`--scrollspy-offset` is a CSS variable, not a data attribute.** It ships as an arbitrary-value utility on the container — `[--scrollspy-offset:220] md:[--scrollspy-offset:70]` — and is read via `getComputedStyle`, so it responds to breakpoints. A **non-zero** per-section value on the section element wins over the container value (no example ships one). Without it a sticky header covers the section you just jumped to.
- **Forgetting `data-hs-scrollspy-scrollable-parent` when the content scrolls in a div silently does nothing** — the listener lands on `document`, which never scrolls.
- **`getInstance(sel)` returns the DOM element, not the instance.** Only `getInstance(sel, true)` returns the collection entry; then reach the instance through `.element` (`HSScrollspy.getInstance(sel, true).element.on(...)`) — see both `.js` files.
- **Re-init after any dynamic render.** Auto-init fires once on `window load`; SPA-rendered navs need `HSScrollspy.autoInit()` (or `HSStaticMethods.autoInit()`), which is idempotent and self-pruning.
- **Mobile collapse + scroll must be sequenced.** Clicking a link while the hamburger panel is open scrolls to a position measured against the still-expanded layout. Both example JS files return a Promise from `beforeScroll` that hides the `HSCollapse` and resolves inside `HSStaticMethods.afterTransition` — that is the pattern to copy.
- **Copy that pattern from `destroy-and-reinitialize.js`, not from `example-in-navbar.js`.** The navbar one ships broken twice over: it looks up `HSCollapse.getInstance('[data-hs-collapse="#navbar-collapse-basic"]', true)` while the HTML declares `data-hs-collapse="#hs-scrollspy-example-heading"` (no match → `getInstance` returns `null` → `collapse.element` throws on the first link click), and it runs bare, with no `window load` wrapper, while `autoInit()` only populates the collection *on* `load`. `destroy-and-reinitialize.js` wraps everything in `window.addEventListener('load', …)` and uses the id that actually exists. Note also that `getInstance` reads `window.$hsScrollspyCollection.find(...)` with no guard, so calling it before anything has initialised throws rather than returning `null`.
- **Section headings in the examples are not tokenised** — they hardcode `text-stone-800 dark:text-neutral-200`. Copying them verbatim opts that text out of the theme; swap for `text-foreground` if you want it to follow moon.
- The dropdown panel is themed **only from `sm:` up** (`sm:bg-dropdown sm:border sm:border-dropdown-line`); on mobile it renders inline inside the collapsed nav with no surface of its own. That is intentional, not a missing class.

## Copy-paste base

Smallest correct example — `examples/navigations/scrollspy/example-with-nested-nav.html`, nav portion: verbatim lines 6–30 plus the closing `</ul>` from line 52. Elided but required for it to work: the third group (`#item-3` + children, lines 31–51), the `#scrollspy-2` sections, and the outer `#scrollspy-scrollable-parent-2` wrapper.

```html
<ul class="sticky top-0" data-hs-scrollspy="#scrollspy-2" data-hs-scrollspy-scrollable-parent="#scrollspy-scrollable-parent-2">
  <li data-hs-scrollspy-group>
    <a href="#item-1" class="block py-0.5 text-sm/6 font-medium text-navbar-nav-foreground hover:text-muted-foreground-1 focus:outline-hidden focus:text-muted-foreground-1 hs-scrollspy-active:text-primary active">Item 1</a>
    <ul>
      <li class="ms-4">
        <a href="#item-1-1" class="group flex items-center gap-x-2 py-0.5 text-sm text-navbar-nav-foreground hover:text-muted-foreground-1 focus:outline-hidden focus:text-muted-foreground-1 hs-scrollspy-active:text-primary">
          <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
          Item 1-1
        </a>
      </li>
      <li class="ms-4">
        <a href="#item-1-2" class="group flex items-center gap-x-2 py-0.5 text-sm text-navbar-nav-foreground hover:text-muted-foreground-1 focus:outline-hidden focus:text-muted-foreground-1 hs-scrollspy-active:text-primary">
          <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
          Item 1-2
        </a>
      </li>
    </ul>
  </li>
  <li>
    <a href="#item-2" class="block py-0.5 text-sm/6 font-medium text-navbar-nav-foreground hover:text-muted-foreground-1 focus:outline-hidden focus:text-muted-foreground-1 hs-scrollspy-active:text-primary">Item 2</a>
  </li>
</ul>
```
