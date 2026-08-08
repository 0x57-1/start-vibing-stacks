---
component: navs
label: Navs
category: navigations
docs: https://preline.co/docs/components/navs.html
examples: 18
js: none
tokens: [primary, primary-hover, primary-focus, primary-active, primary-foreground, muted-foreground-1, muted-foreground, foreground, line-2, layer, layer-foreground, muted, muted-hover, muted-focus, surface, surface-1, surface-foreground, surface-hover, primary-100, primary-800, primary-500, primary-400, scrollbar-track, scrollbar-thumb]
---

# Navs

Static link bars — `<nav>` or `<ul>` of `<a>` elements where **you** paint the current item; no plugin, no panels, no state.

## When to use

- Real navigation: routes, page sections, anything where clicking changes the URL.
- The visual vocabulary (underline, pills, segment, card) you want when the framework's router already owns the active state (React Router `NavLink`, Inertia `Link`).
- **Not** for switching panes in place — that is `tabs` (`role="tablist"` + `data-hs-tab` + `HSTabs`). Every nav "tab" style here has a 1:1 twin in `tabs`.
- **Not** for the app shell's primary sidebar/header — those are `sidebar` / `navbar`.

## Anatomy

Reduced skeleton of the underline style. Every class appears in `examples/navigations/navs/with-icons.html`.

```html
<div class="w-full border-b-2 border-line-2">              <!-- rail: the line the tabs sit on -->
  <nav class="-mb-0.5 flex gap-x-6">                       <!-- -mb-0.5 pulls the item borders over the rail -->
    <a class="py-4 px-1 inline-flex items-center gap-2 border-b-2 border-transparent text-sm
              whitespace-nowrap text-muted-foreground-1
              hover:text-primary-hover focus:outline-hidden focus:text-primary-focus" href="#">Tab 1</a>

    <a class="py-4 px-1 inline-flex items-center gap-2 border-b-2 border-primary text-sm font-medium
              whitespace-nowrap text-primary focus:outline-hidden"
       href="#" aria-current="page">Tab 2</a>              <!-- ACTIVE: border-primary + text-primary + font-medium -->
  </nav>
</div>
```

The active item is three explicit swaps — `border-transparent → border-primary`, `text-muted-foreground-1 → text-primary`, plus `font-medium` — and it drops its hover/focus classes. Disabled is `opacity-50 pointer-events-none` (link) or `text-muted-foreground pointer-events-none` (pill styles).

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Default | Default nav | `examples/navigations/navs/example.html` | Bare `<nav class="flex gap-x-6">` of `text-primary` links; active is `font-semibold` + `aria-current="page"` only — no colour change. |
| List-based | List-based nav | `examples/navigations/navs/with-ul-list.html` | Same links inside `<ul class="list-disc space-x-6">` / `<li class="inline-block">`; disabled adds `opacity-50 pointer-events-none`. |
| Underline | Underline tabs | `examples/navigations/navs/tabs-with-underline.html` | Adds the `border-b-2 border-line-2` rail + `-mb-0.5`. **All three anchors carry identical classes**; the first adds a trailing bare `active` class and `aria-current="page"` — nothing visual (see Gotchas). |
| With icons | Tabs with icons | `examples/navigations/navs/with-icons.html` | Underline style with a leading `<svg class="shrink-0 size-4">`; here the active item **is** painted (`border-b-primary text-primary font-medium`). |
| With badges | Tabs with badges | `examples/navigations/navs/with-badges.html` | Trailing `<span class="ms-1 py-0.5 px-1.5 rounded-full text-xs font-medium bg-surface text-surface-foreground">`; the active badge is `bg-primary-100 text-primary-800 dark:bg-primary-500/20 dark:text-primary-400`. |
| Centered | Centered nav | `examples/navigations/navs/horizontal-alignment.html` | Underline style + `justify-center` on the `<nav>`; hover uses `hover:text-primary-focus` instead of `hover:text-primary-hover`. |
| Right aligned | Right-aligned nav | `examples/navigations/navs/right-aligned.html` | Same file with `justify-end`. |
| Vertical | Vertical nav | `examples/navigations/navs/vertical.html` | Rail moves to the inline end: `max-w-20 w-full border-e-2 border-line-2`, `<nav class="-me-0.5 flex flex-col space-y-3">`, items `border-e-2 pe-4`. |
| Card style | Card-style tabs | `examples/navigations/navs/card-type-tab.html` | `border-b border-line-2` rail; items `-mb-px py-3 px-4 border border-line-2 rounded-t-lg`; inactive `bg-muted text-muted-foreground-1`, active `bg-layer border-b-transparent text-primary`. |
| Segment | Segmented tabs | `examples/navigations/navs/segment.html` | Track `flex bg-surface hover:bg-surface-hover rounded-lg p-1`; active pill `bg-layer text-layer-foreground shadow-2xs`, others `bg-transparent`. |
| Underline bar | Underline bar tabs | `examples/navigations/navs/bar-with-underline.html` | One boxed row: `border border-line-2 rounded-xl divide-x divide-line-2 overflow-hidden`, items `min-w-0 flex-1 bg-layer`; active `border-b-2 border-b-primary text-layer-foreground`. |
| Stone pills | Stone pill tabs | `examples/navigations/navs/pills-on-stone-color.html` | No track. Active pill `bg-surface-1 text-surface-foreground rounded-lg`; others transparent. |
| Brand pills | Brand pill tabs | `examples/navigations/navs/pills-with-brand-color.html` | Same shape, active pill `bg-primary text-primary-foreground`. |
| Scrollable | Scrollable nav | `examples/navigations/navs/scroll-nav.html` | The only JS example: `data-hs-scroll-nav='{"autoCentering": true}'` wrapper, `<nav class="hs-scroll-nav-body … overflow-x-auto snap-x snap-mandatory">`, items `hs-scroll-nav-active:text-primary-active` + the current one carrying `active`, plus `.hs-scroll-nav-prev` / `.hs-scroll-nav-next` buttons with `hs-scroll-nav-disabled:opacity-50`. Scrollbar tinted with `[&::-webkit-scrollbar-track]:bg-scrollbar-track` / `[&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb`. |
| Fill and justify | Fill and justify nav | `examples/navigations/navs/fill-and-justify.html` | `<ul class="flex gap-x-2">` with `<li class="flex-auto">`; items `w-full … justify-center`, active `bg-primary text-primary-foreground`. Width follows content. |
| `<nav>` markup | Using `<nav>` markup | `examples/navigations/navs/nav-based-navigation.html` | Same brand-pill row, `<li class="basis-0 grow">` — equal widths regardless of label length. |
| Equal width items | Equal-width nav items | `examples/navigations/navs/equal-width-elements.html` | Identical to `nav-based-navigation.html`: `<ul>`/`<li class="basis-0 grow">`. |
| Equal width `<nav>` | Using `<nav>` markup | `examples/navigations/navs/equal-width-navigation.html` | The `<ul>`/`<li>` dropped: `<nav class="flex gap-x-2">` with `basis-0 grow` moved onto each `<a>`. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `primary` (`text-primary`, `bg-primary`, `border-b-primary`) | Active item: label, pill fill, underline | `gray-800` | `white` |
| `primary-foreground` (`text-primary-foreground`) | Label on a filled brand pill | `white` | `neutral-800` |
| `primary-hover` (`hover:text-primary-hover`) | Inactive item on hover | `gray-900` | `neutral-300` |
| `primary-focus` (`focus:text-primary-focus`) | Inactive item on keyboard focus (same colour as hover) | `gray-900` | `neutral-300` |
| `primary-active` (`hs-scroll-nav-active:text-primary-active`) | Current item in the scrollable nav | `gray-900` | `neutral-300` |
| `muted-foreground-1` (`text-muted-foreground-1`) | Resting label of every inactive tab/pill | `gray-600` | `neutral-400` |
| `muted-foreground` (`text-muted-foreground`) | Disabled label in the pill / segment / bar styles | `gray-500` | `neutral-500` |
| `foreground` (`hover:text-foreground`) | Hover label in the card / bar styles | `gray-800` | `neutral-200` |
| `line-2` (`border-line-2`, `divide-line-2`) | Underline rail, card borders, bar frame and dividers | `gray-200` | `neutral-700` |
| `layer` (`bg-layer`) | Active card tab, active segment pill, bar cell surface | `white` | `neutral-800` |
| `layer-foreground` (`text-layer-foreground`) | Label on an active segment pill / active bar cell | `gray-800` | `white` |
| `muted` (`bg-muted`) | Inactive card-tab surface | `gray-50` | `neutral-800` |
| `muted-hover` / `muted-focus` (`hover:bg-` / `focus:bg-`) | Bar-cell hover/focus fill; scroll arrow fill | `gray-100` | `neutral-700` |
| `surface` (`bg-surface`) | Segment track; inactive badge fill | `gray-100` | `neutral-700` |
| `surface-hover` (`hover:bg-surface-hover`) | Segment track hover | `gray-200` | `neutral-600` |
| `surface-1` (`bg-surface-1`) | Active stone pill fill | `gray-200` | `neutral-600` |
| `surface-foreground` (`text-surface-foreground`) | Label on an active stone pill; inactive badge text | `gray-800` | `neutral-200` |
| `primary-100` / `primary-800` (`bg-` / `text-`) | Active badge in light mode | `gray-100` / `gray-800` | `neutral-100` / `neutral-800` |
| `primary-500` / `primary-400` (`dark:bg-…/20` / `dark:text-`) | Active badge in dark mode | `gray-500` / `gray-400` | `neutral-500` / `neutral-400` |
| `scrollbar-track` / `scrollbar-thumb` | Webkit scrollbar of the scrollable nav | `gray-100` / `gray-300` | `neutral-700` / `neutral-500` |

## Behaviour (JS)

Static markup only — no Preline JS. `index.json` reports no `hs_js` for this component; state is `aria-current="page"` plus the class swap you render.

One exception: `scroll-nav.html` opts into `HSScrollNav` (`assets/js/preline/scroll-nav.js`). It auto-inits on `window` `load` over `[data-hs-scroll-nav]:not(.--prevent-on-load-init)` and looks up `.hs-scroll-nav-body` (the scroller), `.hs-scroll-nav-prev`, `.hs-scroll-nav-next`. Options JSON: `paging` (default `true` — arrows jump one visible page; `false` steps one item) and `autoCentering` (default `false` — when `true`, on init and on resize it centres `.hs-scroll-nav-body .active`). It adds/removes the `disabled` class + attribute on the arrows at the ends, recomputes on a 200 ms-debounced `scroll`/`resize`, and exposes `centerElement(el, behavior = 'smooth')`, `goTo(el, cb)`, `getCurrentState()`, `destroy()`, plus static `getInstance(target, isInstance)` / `autoInit()`.

## Gotchas

- **`tabs-with-underline.html` renders with nothing selected.** All three anchors share the same class string; the first adds only `aria-current="page"` plus a bare `active` class, and there is no `.active` rule in `assets/css/project-moon.css` / `project-theme.css` and no `hs-*-active:` utility on the element. `active` is meaningful only as a hook for the plugin variants. Copy the active treatment from `with-icons.html` instead: `border-b-primary text-primary font-medium`, and delete the hover/focus classes on that item.
- **`bar-with-underline.html` ships `focus:text-text-foreground`** — a doubled prefix that is not a class and compiles to nothing. Use `focus:text-foreground` (as the tabs twin `tabs/bar-with-underline.html` does).
- **Hover *dims* the default nav in dark mode.** `example.html` rests at `text-primary` (`gray-800`/`white`) and hovers to `primary-hover` (`gray-900`/`neutral-300`): darker-on-white in light, but visibly *duller* in dark. The tab styles avoid this by resting at `muted-foreground-1` (`neutral-400`) so hover brightens. Do not carry `text-primary` resting into a dark-first surface.
- **`hover` and `focus` resolve to the same colour** (`primary-hover` = `primary-focus` = `gray-900`/`neutral-300`) and every item sets `focus:outline-hidden`. Keyboard focus is invisible; add your own ring if that matters.
- **Three files use `hover:text-primary-focus` instead of `hover:text-primary-hover`**: `horizontal-alignment.html`, `right-aligned.html`, `vertical.html`. Same value under moon, different under a theme where the two diverge — normalise when you copy.
- **`-mb-0.5` / `-mb-px` / `-me-0.5` are load-bearing.** They pull the item's own `border-b-2` on top of the container rail. Drop them and you get a doubled 4 px line under the active tab.
- **`fill-and-justify` and `equal-width` are not the same thing.** `flex-auto` (fill) sizes each item to its content and shares the slack; `basis-0 grow` (equal width) ignores content length. `nav-based-navigation.html` and `equal-width-elements.html` are byte-equivalent — the doc's two "Using `<nav>` markup" sections are `nav-based-navigation.html` (`<ul>`) and `equal-width-navigation.html` (bare `<nav>`), which is the only one that actually drops the list.
- **The badge colours are the one place a `dark:` prefix survives.** `with-badges.html` writes `bg-primary-100 text-primary-800 dark:bg-primary-500/20 dark:text-primary-400` instead of a semantic pair; `primary-100` is `neutral-100` in dark, which is why the explicit override exists. Keep both halves or the dark badge goes near-white.
- **`pointer-events-none` is how "disabled" is expressed on `<a>`** — `disabled:` variants never fire on an anchor. `with-ul-list.html` uses `opacity-50 pointer-events-none`; the pill styles use `text-muted-foreground pointer-events-none`. Neither is announced to assistive tech; add `aria-disabled="true"`.
- **`scroll-nav.html`'s arrows are positioned against a `relative px-6` wrapper** (`absolute inset-y-0 inset-s-0` / `inset-e-0`). Remove the padding and the arrows overlap the first and last item.

## Copy-paste base

`examples/navigations/navs/example.html` (the doc default; for a tab bar with a visible active state copy `with-icons.html`)

```html
<nav class="flex gap-x-6">
  <a class="inline-flex items-center gap-x-2 text-sm whitespace-nowrap text-primary hover:text-primary-hover focus:outline-hidden focus:text-primary-focus" href="#">
    Link
  </a>
  <a class="inline-flex items-center gap-x-2 text-sm font-semibold whitespace-nowrap text-primary hover:text-primary-hover focus:outline-hidden focus:text-primary-focus" href="#" aria-current="page">
    Active
  </a>
  <a class="inline-flex items-center gap-x-2 text-sm whitespace-nowrap text-primary hover:text-primary-hover focus:outline-hidden focus:text-primary-focus" href="#">
    Link
  </a>
  <a class="inline-flex items-center gap-x-2 text-sm whitespace-nowrap text-primary hover:text-primary-hover focus:outline-hidden focus:text-primary-focus" href="#">
    Disabled
  </a>
</nav>
```
