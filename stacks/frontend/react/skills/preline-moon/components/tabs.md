---
component: tabs
label: Tabs
category: navigations
docs: https://preline.co/docs/components/tabs.html
examples: 18
js: HSTabs
tokens: [muted-foreground-1, primary-active, primary-hover, primary-focus, primary-foreground, foreground, line-2, layer, layer-line, layer-hover, layer-focus, layer-foreground, muted, muted-hover, muted-focus, surface, surface-active, surface-foreground, surface-hover, surface-line, surface-focus, primary-100, primary-600, primary-500, primary-400, scrollbar-track, scrollbar-thumb]
---

# Tabs

Mutually exclusive panes over one region: `HSTabs` moves the `active` class between `[data-hs-tab]` toggles inside a `[role="tablist"]` and toggles the `hidden` class on the panels they point at.

## When to use

- Peer views of the same subject that fit one screen each (Overview / Settings / Logs on a record page).
- When the URL should *not* change — tabs are in-page state. If the view is bookmarkable, use `navs` + your router instead.
- **Not** when two sections may be open at once — that is `accordion`.
- **Not** for ordered progress with completion — that is `stepper`.
- **Not** for a link bar — `navs` has a visual twin of every style here without the plugin.

## Anatomy

Reduced skeleton. Every class/attribute appears in `examples/navigations/tabs/tabs-with-underline.html`.

```html
<nav class="flex gap-x-1" aria-label="Tabs" role="tablist" aria-orientation="horizontal">
  <!--          ^ role="tablist" is the autoInit selector — no role, no plugin -->
  <button type="button"
          class="hs-tab-active:font-semibold hs-tab-active:text-primary-active hs-tab-active:after:bg-primary-active
                 relative py-4 px-1 inline-flex items-center gap-x-2 text-sm text-muted-foreground-1
                 after:absolute after:-bottom-px after:inset-x-0 after:w-full after:h-0.5 after:bg-transparent
                 hover:text-primary-hover focus:outline-hidden focus:text-primary-focus active"
          id="tab-item-1" aria-selected="true" data-hs-tab="#panel-1" aria-controls="panel-1" role="tab">Tab 1</button>

  <button type="button" class="… (same, no `active`)"
          id="tab-item-2" aria-selected="false" data-hs-tab="#panel-2" aria-controls="panel-2" role="tab">Tab 2</button>
</nav>

<div class="mt-3">
  <div id="panel-1" role="tabpanel" aria-labelledby="tab-item-1">…</div>
  <div id="panel-2" class="hidden" role="tabpanel" aria-labelledby="tab-item-2">…</div>
  <!--              ^ every non-initial panel ships `hidden` -->
</div>
```

`data-hs-tab` holds a **CSS selector** (`#panel-1`), resolved with `document.querySelector` — so panels may live anywhere in the document, not only next to the nav.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Underline | Underline tabs | `examples/navigations/tabs/tabs-with-underline.html` | Baseline. Underline drawn as an `after:` pseudo bar on a `relative` button, painted by `hs-tab-active:after:bg-primary-active`. Wrapped in `border-b border-line-2`. |
| With icons | Tabs with icons | `examples/navigations/tabs/tabs-with-icons.html` | Same, plus a leading `<svg class="shrink-0 size-4">` per toggle. |
| Auto-centered | Auto-centered tabs | `examples/navigations/tabs/tabs-centered.html` (+ `.js`) | Wraps the tablist in `data-hs-scroll-nav` (bare, no JSON) + `.hs-scroll-nav-body`, adds round `.hs-scroll-nav-prev`/`-next` buttons (`hidden md:flex hs-scroll-nav-disabled:hidden hs-scroll-nav-disabled:pointer-events-none`, `size-9 bg-layer text-layer-foreground rounded-full`) and a JS bridge: `HSTabs.getInstance("#hs-tabs-centered", true)` + `HSScrollNav.getInstance('#hs-scroll-nav-tabs-centered', true)`, then `tabs.element.on('change', ({el}) => scrollNav.element.centerElement(el))`. Active style switches to `border-b-2` + `hs-tab-active:border-primary-active`. |
| With badges | Tabs with badges | `examples/navigations/tabs/tabs-with-badges.html` | Trailing `<span class="… bg-surface text-surface-foreground">` that becomes `hs-tab-active:bg-primary-100 hs-tab-active:text-primary-600 dark:hs-tab-active:bg-primary-500/20 dark:hs-tab-active:text-primary-400`. |
| Centered | Tab alignment | `examples/navigations/tabs/horizontal-alignment.html` | Underline style + `justify-center` on the `<nav>`. |
| Right aligned | Right-aligned tabs | `examples/navigations/tabs/right-aligned.html` | Same with `justify-end`. |
| Vertical | Vertical tabs | `examples/navigations/tabs/vertical.html` | `flex flex-wrap` shell, nav `flex flex-col space-y-2` + `aria-orientation="vertical"`; the `after:` bar becomes `after:-inset-e-px after:inset-y-0 after:w-0.5 after:h-full`. Rail is `border-e border-line-2`. |
| Card style | Card-style tabs | `examples/navigations/tabs/card-type-tab.html` | Toggles `-mb-px bg-muted border border-line-2 rounded-t-lg`; active `hs-tab-active:bg-layer hs-tab-active:border-b-transparent hs-tab-active:text-primary-active`. |
| Scrollable | Scrollable tabs | `examples/navigations/tabs/horizontal-scroll.html` | Nav gets `overflow-x-auto` + `[&::-webkit-scrollbar]:h-2` with `bg-scrollbar-track` / `bg-scrollbar-thumb`; active uses `border-b-2` + `hs-tab-active:border-primary-active`. No scroll-nav arrows. |
| Mobile select | Tabs with mobile select | `examples/navigations/tabs/select-on-mobile.html` | Adds `data-hs-tab-select="#tab-select"` to the nav and a `<select id="tab-select" class="sm:hidden …">` whose `<option value>` equals each `data-hs-tab` selector (`#hs-tab-to-select-1`). Nav wrapper is `hidden sm:block`. |
| Segment | Segmented tabs | `examples/navigations/tabs/segment.html` | Track `bg-surface hover:bg-surface-hover rounded-lg transition p-1`; active `hs-tab-active:bg-layer hs-tab-active:text-layer-foreground`. |
| Underline bar | Underline bar tabs | `examples/navigations/tabs/bar-with-underline.html` | One boxed row: `border border-line-2 rounded-xl overflow-hidden`, cells `min-w-0 flex-1 bg-layer first:border-s-0 border-s border-b-2 border-layer-line`; active `hs-tab-active:border-b-primary-active hs-tab-active:text-foreground`. |
| Stone pills | Pills on stone surface | `examples/navigations/tabs/pills-on-stone-color.html` | Active `hs-tab-active:bg-surface-active hs-tab-active:text-surface-foreground hs-tab-active:hover:text-surface-foreground`. |
| Brand pills | Brand-color pills | `examples/navigations/tabs/pills-with-brand-color.html` | Active `hs-tab-active:bg-primary-active hs-tab-active:text-primary-foreground hs-tab-active:hover:text-primary-foreground`. |
| Fill and justify | Fill and justify tabs | `examples/navigations/tabs/fill-and-justify.html` | Brand pills + `flex-auto` on each toggle — widths follow content, slack shared. |
| Equal width | Equal-width tabs | `examples/navigations/tabs/equal-with-elements.html` | Brand pills + `basis-0 grow` — identical widths regardless of label length. |
| Hover triggered | Hover-triggered tabs | `examples/navigations/tabs/open-on-hover.html` | Nav carries `data-hs-tabs='{"eventType": "hover"}'`; vertical `after:` bar styling, `flex flex-col`. |
| Destroy / reinit | Destroy and reinitialize | `examples/navigations/tabs/destroy-and-reinitialize.html` (+ `.js`) | The underline baseline plus two control buttons — `#hs-destroy-tabs` on `bg-layer border-layer-line text-layer-foreground`, `#hs-auto-init-tabs` on `bg-surface border-surface-line text-surface-foreground` (ships `disabled`). JS resolves the nav by `#hs-tabs` and runs `const {element} = HSTabs.getInstance(tabs, true); element.destroy();` then `HSTabs.autoInit()`. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `muted-foreground-1` (`text-muted-foreground-1`) | Resting label of every inactive tab and of the panel body copy | `gray-600` | `neutral-400` |
| `primary-active` (`hs-tab-active:text-`, `:after:bg-`, `:border-`, `:bg-`) | Active label, active underline bar, active brand pill fill | `gray-900` | `neutral-300` |
| `primary-hover` (`hover:text-primary-hover`) | Inactive tab on hover | `gray-900` | `neutral-300` |
| `primary-focus` (`focus:text-primary-focus`, `focus:border-`/`focus:ring-`) | Inactive tab on focus; mobile `<select>` focus ring | `gray-900` | `neutral-300` |
| `primary-foreground` (`hs-tab-active:text-primary-foreground`) | Label on an active brand pill | `white` | `neutral-800` |
| `foreground` (`hover:text-foreground`, `hs-tab-active:text-foreground`) | Hover label in card/bar styles; active label in the bar style; `<em>` inside panels | `gray-800` | `neutral-200` |
| `line-2` (`border-line-2`) | Underline rail, card borders, bar frame, mobile select border | `gray-200` | `neutral-700` |
| `layer` (`bg-layer`) | Active card tab, active segment pill, bar cell surface, scroll-arrow button | `white` | `neutral-800` |
| `layer-line` (`border-layer-line`) | Bar cell dividers; control-button border | `gray-200` | `neutral-700` |
| `layer-foreground` (`text-layer-foreground`) | Label on the active segment pill; scroll-arrow glyph | `gray-800` | `white` |
| `layer-hover` / `layer-focus` | Bar cell + control button fill states | `gray-50` | `neutral-700` |
| `muted` (`bg-muted`) | Inactive card-tab surface | `gray-50` | `neutral-800` |
| `muted-hover` / `muted-focus` (`hover:bg-` / `focus:bg-`) | Scroll-arrow fill states | `gray-100` | `neutral-700` |
| `surface` (`bg-surface`) | Segment track; inactive badge fill | `gray-100` | `neutral-700` |
| `surface-active` (`hs-tab-active:bg-surface-active`) | Active stone pill fill | `gray-200` | `neutral-600` |
| `surface-foreground` (`text-surface-foreground`) | Label on an active stone pill; inactive badge text | `gray-800` | `neutral-200` |
| `surface-hover` / `surface-focus` / `surface-line` | Segment track hover; "reinitialize" control button | `gray-200` / `gray-200` / `transparent` | `neutral-600` / `neutral-600` / `transparent` |
| `primary-100` / `primary-600` | Active badge fill / text in light mode | `gray-100` / `gray-600` | `neutral-100` / `neutral-600` |
| `primary-500` / `primary-400` (`dark:` only) | Active badge fill (`/20`) / text in dark mode | `gray-500` / `gray-400` | `neutral-500` / `neutral-400` |
| `scrollbar-track` / `scrollbar-thumb` | Webkit scrollbar of the scrollable + auto-centered navs | `gray-100` / `gray-300` | `neutral-700` / `neutral-500` |

## Behaviour (JS)

Class `HSTabs` (`assets/js/preline/tabs.js`, v4.2.0), exposed as `window.HSTabs`.

**Init.** On `window` `load` the module runs `HSTabs.autoInit()` over **`[role="tablist"]:not(select):not(.--prevent-on-load-init)`**. Idempotent — it prunes detached entries then skips already-collected elements. Instances live in `window.$hsTabsCollection`.

**Options** — JSON in `data-hs-tabs`, merged with the constructor's second argument:

| Key | Default | Effect |
|---|---|---|
| `eventType` | `"click"` | `"hover"` binds `mouseenter` on the toggles instead of `click`. |
| `preventNavigationResolution` | `null` | Number, or a breakpoint key (`xs:0, sm:640, md:768, lg:1024, xl:1280, 2xl:1536`). Calls `preventDefault()` on the toggle click while `document.body.clientWidth <= value`. |

**Attributes.** `data-hs-tab="<selector>"` on each toggle points at its panel. `data-hs-tab-select="<selector>"` on the tablist binds an external `<select>`; its `change` handler looks up `[data-hs-tab="<option value>"]` and clicks it (or dispatches `mouseenter` in hover mode). `data-hs-tabs-vertical="true"` — or `aria-orientation="vertical"` — switches arrow keys from Left/Right to Up/Down.

**Switching.** `open(toggle)` removes `active` from the previous toggle, adds `hidden` to the previous panel, adds `active` to the new toggle, removes `hidden` from the new panel, and flips `aria-selected` **only on elements that already have the attribute**. The `hs-tab-active:` Tailwind variants key on that `active` class.

**Keyboard.** Registered with `window.HSAccessibilityObserver` under the `[role="tablist"]` selector: Arrow keys move to the next/previous toggle and Home/End to the first/last — each of which calls `.focus()` **and** `.click()`, i.e. automatic activation.

**Static API:** `autoInit()`, `getInstance(target, isInstance = false)`, `open(target)` (no-op if the toggle already has `active`), `on(evt, target, cb)`.
**Instance:** `open(el)`, `destroy()`.
**Event:** `change` — callback via `on('change', …)` and a bubbling `CustomEvent` **`change.hs.tab` dispatched on the toggle**, payload `{el, prev, current, tabsId}`. Only `el` is an element (the new toggle); `prev` and `current` are the *panel selector strings* (`this.prevContentId` / `this.currentContentId`, i.e. the `data-hs-tab` values), and `tabsId` is `this.el.id`.

## Gotchas

- **`role="tablist"` is the init selector, not a `data-hs-*` attribute.** A nav full of `data-hs-tab` toggles with no `role="tablist"` never becomes an instance and every click is inert. Conversely, any `[role="tablist"]` you add for a11y elsewhere gets picked up by the plugin.
- **`autoInit()` only fires on `window` `load`.** Tabs rendered later (route change, `api.get()` result, modal body) are dead until you call `HSTabs.autoInit()` yourself — safe to repeat.
- **Initial state lives in two places and both are required.** `this.current` is `toggles.find(el => el.classList.contains('active'))`. Ship no `active` and the first click has `prev === undefined`, so nothing gets hidden — **two panels render at once**. Ship `active` but leave that panel `hidden` and the tab bar lies about what is on screen.
- **`aria-selected` is only maintained if it already exists** (`if (el.ariaSelected) el.ariaSelected = 'true'`). Absent means it stays absent forever. Ship `aria-selected="false"` on every inactive toggle — the string `"false"` is truthy, so it updates correctly.
- **Panels use the `hidden` class** — unlike `stepper`, which uses inline `display`. Do not mix the two, and do not rely on `[hidden]` the attribute.
- **Arrow keys activate, they do not just move focus,** and there is no roving `tabindex` — every toggle stays in the tab order. If you need manual activation (WAI-ARIA's other pattern), this plugin cannot do it.
- **`open-on-hover.html` is visually vertical but declares `aria-orientation="horizontal"`** (`flex flex-col space-y-2`). Arrow-key direction is read from `data-hs-tabs-vertical` / `aria-orientation`, so Left/Right drive a top-to-bottom list there. Fix the attribute when you copy.
- **`eventType: "hover"` removes click activation entirely.** The click listener bound in hover mode only ever calls `preventDefault()` under `preventNavigationResolution`; it never opens a tab. Touch users cannot switch. Pair it with `data-hs-tab-select` or don't ship it on mobile.
- **The mobile `<select>` values must include the `#`** — `change()` does `document.querySelector('[data-hs-tab="' + value + '"]')`, an exact attribute match against the selector string, so `value="#hs-tab-to-select-1"` and `data-hs-tab="#hs-tab-to-select-1"` must be byte-identical. The `<select>` itself is excluded from autoInit by `:not(select)`.
- **`destroy()` freezes the visual state.** It removes listeners, unregisters the accessibility component and drops the collection entry, but leaves `active` on the toggle and `hidden` on the panels exactly where they were. Re-running `autoInit()` resumes from that frozen state.
- **Two different mechanisms draw the same underline.** `tabs-with-underline` / `tabs-with-icons` / `tabs-with-badges` / `vertical` use a `relative` + `after:` pseudo bar (`hs-tab-active:after:bg-primary-active`); `horizontal-scroll` / `tabs-centered` use `border-b-2 border-transparent` + `hs-tab-active:border-primary-active`. Mixing the two on one bar gives a double line, and the `after:` version silently disappears if you drop `relative`.
- **`tabs-centered.html` hard-codes its rail** as `border-stone-200 dark:border-neutral-700` instead of `border-line-2` — it will not follow a theme swap. It also loads lodash (`assets/vendor/lodash/lodash.min.js`) purely for `_.debounce` in `tabs-centered.js`; substitute your own debounce.
- **Six example files reuse the same ids.** `tabs-with-underline`, `tabs-with-icons`, `tabs-with-badges`, `horizontal-alignment`, `right-aligned` and `destroy-and-reinitialize` all ship `<nav id="hs-tabs">`, toggle ids `tabs-with-underline-item-1..3`, panel ids `tabs-with-underline-1..3` and `data-hs-tab="#tabs-with-underline-1..3"`. Paste two of them onto one page and every selector — `document.querySelector('#hs-tabs')` in `destroy-and-reinitialize.js`, and `data-hs-tab` itself, which `open()` resolves with `document.querySelector` — silently hits the first match, so clicking the second bar opens the first bar's pane. Rename ids per instance.
- **`getInstance(target, true)` returns the collection entry `{id, element}`, not the instance.** Instance methods are one level down: `HSTabs.getInstance(el, true).element.destroy()`, `.element.on('change', cb)`, `.element.current`. With the flag omitted you get `.element` directly. Both bundled scripts (`destroy-and-reinitialize.js`, `tabs-centered.js`) use the two-argument form.
- **Active state is only one step brighter in dark.** Resting `muted-foreground-1` is `neutral-400`, active `primary-active` is `neutral-300`. The underline / pill fill is what actually communicates selection in dark mode — do not ship a text-only active treatment.
- **Hover and focus are the same colour** (`primary-hover` = `primary-focus` = `gray-900`/`neutral-300`) and every toggle sets `focus:outline-hidden`; add your own focus ring if keyboard use matters.

## Copy-paste base

`examples/navigations/tabs/segment.html` (smallest complete example: tablist + 3 panels)

```html
<!-- Tab Nav -->
<div class="flex">
  <div class="flex bg-surface hover:bg-surface-hover rounded-lg transition p-1">
    <nav class="flex gap-x-1" aria-label="Tabs" role="tablist" aria-orientation="horizontal">
      <button type="button" class="hs-tab-active:bg-layer hs-tab-active:text-layer-foreground py-3 px-4 inline-flex items-center gap-x-2 bg-transparent text-sm text-muted-foreground-1 focus:outline-hidden font-medium rounded-lg hover:text-primary-hover focus:outline-hidden focus:text-primary-focus disabled:opacity-50 disabled:pointer-events-none active" id="segment-item-1" aria-selected="true" data-hs-tab="#segment-1" aria-controls="segment-1" role="tab">
        Tab 1
      </button>
      <button type="button" class="hs-tab-active:bg-layer hs-tab-active:text-layer-foreground py-3 px-4 inline-flex items-center gap-x-2 bg-transparent text-sm text-muted-foreground-1 focus:outline-hidden font-medium rounded-lg hover:text-primary-hover focus:outline-hidden focus:text-primary-focus disabled:opacity-50 disabled:pointer-events-none" id="segment-item-2" aria-selected="false" data-hs-tab="#segment-2" aria-controls="segment-2" role="tab">
        Tab 2
      </button>
      <button type="button" class="hs-tab-active:bg-layer hs-tab-active:text-layer-foreground py-3 px-4 inline-flex items-center gap-x-2 bg-transparent text-sm text-muted-foreground-1 focus:outline-hidden font-medium rounded-lg hover:text-primary-hover focus:outline-hidden focus:text-primary-focus disabled:opacity-50 disabled:pointer-events-none" id="segment-item-3" aria-selected="false" data-hs-tab="#segment-3" aria-controls="segment-3" role="tab">
        Tab 3
      </button>
    </nav>
  </div>
</div>
<!-- End Tab Nav -->

<!-- Tab Content -->
<div class="mt-3">
  <div id="segment-1" role="tabpanel" aria-labelledby="segment-item-1">
    <p class="text-muted-foreground-1">
      This is the <em class="font-semibold text-foreground">first</em> item's tab body.
    </p>
  </div>
  <div id="segment-2" class="hidden" role="tabpanel" aria-labelledby="segment-item-2">
    <p class="text-muted-foreground-1">
      This is the <em class="font-semibold text-foreground">second</em> item's tab body.
    </p>
  </div>
  <div id="segment-3" class="hidden" role="tabpanel" aria-labelledby="segment-item-3">
    <p class="text-muted-foreground-1">
      This is the <em class="font-semibold text-foreground">third</em> item's tab body.
    </p>
  </div>
</div>
<!-- End Tab Content -->
```
