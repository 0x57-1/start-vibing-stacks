---
component: dropdown
label: Dropdown
category: overlays
docs: https://preline.co/docs/components/dropdown.html
examples: 22
js: HSDropdown
tokens: [dropdown, dropdown-line, dropdown-item-foreground, dropdown-item-hover, dropdown-item-focus, dropdown-divider, dropdown-header, layer, layer-line, layer-foreground, layer-hover, layer-focus]
---

# Dropdown

A click- (or hover-) triggered menu anchored to a toggle button, positioned by Floating UI and shown by toggling `hidden`/`block` on the menu plus `open` on the root.

## When to use
- A list of *actions* or navigation targets attached to a control. Items are `<a>`/`<button>`, `role="menu"`.
- Use **Popover** (`hs-tooltip`) instead when the panel holds read-only content, cards or forms — a popover has no `role="menu"` keyboard model.
- Use **Select** (`HSSelect`) instead when the user is choosing a *value* for a form field; the checkbox/radio-item examples here are for multi-toggle filters, not form selects.
- Use **Modal**/**Offcanvas** when the panel must trap focus and block the page.

## Anatomy
Reduced skeleton (structure + theme-carrying classes only; all classes appear in `examples/overlays/dropdown/default.html`):

```html
<div class="hs-dropdown relative inline-flex">            <!-- root: JS instance, CSS vars live here -->
  <button class="hs-dropdown-toggle ... bg-layer border border-layer-line text-layer-foreground
                 hover:bg-layer-hover focus:bg-layer-focus"
          aria-haspopup="menu" aria-expanded="false">
    Actions
    <svg class="hs-dropdown-open:rotate-180 size-4">…</svg>  <!-- open-state variant -->
  </button>

  <div class="hs-dropdown-menu ... hs-dropdown-open:opacity-100 opacity-0 hidden
              bg-dropdown border border-dropdown-line shadow-md rounded-lg"
       role="menu" aria-orientation="vertical" aria-labelledby="<toggle id>">
    <div class="p-1 space-y-0.5">
      <a class="... text-dropdown-item-foreground hover:bg-dropdown-item-hover
                focus:bg-dropdown-item-focus" href="#">Item</a>
    </div>
  </div>
</div>
```

`.hs-dropdown-menu` must be a **direct child** of `.hs-dropdown` (`:scope > .hs-dropdown-menu`), and the toggle must be `:scope > .hs-dropdown-toggle`, `:scope > .hs-dropdown-toggle-wrapper > .hs-dropdown-toggle`, or `el.children[0]`.

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| Default | Default dropdown | `examples/overlays/dropdown/default.html` | Baseline: `[--auto-close:inside]`, `mt-2`, `before:`/`after:` hover bridges on the menu |
| Hover trigger | Hover trigger | `examples/overlays/dropdown/hover-event.html` | Root gains `[--trigger:hover]`; markup otherwise identical to default |
| Dividers | Menu dividers | `examples/overlays/dropdown/dividers.html` | Menu gains `divide-y divide-dropdown-divider`; items split into 3 `p-1` groups |
| Icons | Menu items with icons | `examples/overlays/dropdown/icons.html` | Each item gets a leading `<svg class="shrink-0 size-4">`; `gap-x-3.5` already in the item class |
| Section title | Section title | `examples/overlays/dropdown/title.html` | `divide-y divide-dropdown-divider` + `<span class="… uppercase text-muted-foreground">` group labels |
| Header | Menu header | `examples/overlays/dropdown/with-header.html` | Leading block `py-3 px-4 border-b border-dropdown-header` with `text-muted-foreground-1` / `text-foreground` |
| Avatar trigger | Custom trigger button | `examples/overlays/dropdown/custom-trigger.html` | Toggle becomes `rounded-full` pill with `<img>` + `text-muted-foreground-2` label |
| Icon-only trigger | Icon-only trigger | `examples/overlays/dropdown/custom-icon-trigger.html` | Toggle is `size-9` square, kebab icon `text-muted-foreground-2`, no chevron |
| Scale transition | Scale transition | `examples/overlays/dropdown/scale-animation.html` | Root gains `[--gpu-acceleration:false]`; menu uses `hs-dropdown-open:scale-100 scale-95 transition-[transform,opacity]` |
| Slide-up transition | Slide-up transition | `examples/overlays/dropdown/slide-up-animation.html` | Menu keeps `transition-[opacity,margin]` and adds `duration-300 mt-2` — the "slide" is the margin animating |
| Inner translate | Inner translate animation | `examples/overlays/dropdown/transform-style-animation.html` | Menu is a bare positioning box; an **inner** `div[data-hs-transition]` carries `hs-dropdown-open:scale-100 origin-top-left` and the `bg-dropdown` chrome |
| Auto close | Auto close behavior | `examples/overlays/dropdown/auto-close-behavior.html` | Three roots, class only (no data attribute in this file): `[--auto-close:inside]`, `[--auto-close:outside]`, `[--auto-close:false]`; the three roots are pushed apart with `mt-1` / `mt-40` / `mt-60` (`mx-1 sm:mt-1 relative sm:inline-flex`), and the first two add `z-20` / `z-10` so their menus overlap the ones below |
| Scope window | Scope to window | `examples/overlays/dropdown/scope-window.html` | Root gains `[--scope:window]` → menu is `appendChild`-ed to `document.body` |
| Checkbox items | Checkbox items | `examples/overlays/dropdown/dropdown-item-checkbox.html` | Items are `input[type=checkbox]` + `<label>`; `checked:bg-primary-checked checked:border-primary-checked`, `border-line-3`; root carries `[--auto-close:inside]` **and** `data-hs-dropdown-auto-close="inside"` |
| Radio items | Radio items | `examples/overlays/dropdown/dropdown-item-radio.html` | Same as checkbox but `type=radio`, `rounded-full`, and `p-1 space-y-0.5` moved onto the menu itself |
| Bottom placements | Bottom placements | `examples/overlays/dropdown/dropdown.html` | `[--placement:bottom-left]`; second block is a split button (plain `<button>` + sibling `.hs-dropdown` with `bg-surface border-line-2`) |
| Top placements | Top placements | `examples/overlays/dropdown/dropup.html` | `[--placement:top-left]`, chevron `m18 15-6-6-6 6` |
| Right-side placements | Right-side placements | `examples/overlays/dropdown/dropright.html` | `[--placement:bottom-right]` (= Floating UI `bottom-end`, i.e. right-*aligned*) |
| Left-side placements | Left-side placements | `examples/overlays/dropdown/dropleft.html` | Still `[--placement:bottom-left]`; only the chevron (`m9 18 6-6-6-6`) and ids differ from `dropdown.html` |
| Responsive alignment | Breakpoint-based alignment | `examples/overlays/dropdown/responsive-alignment.html` | `[--strategy:absolute] [--placement:top-left] sm:[--placement:top-right]` + menu `top-0 lg:inset-s-auto lg:inset-e-0` |
| Responsive alignment RTL | Breakpoint-based alignment in RTL | `examples/overlays/dropdown/responsive-alignment-right-to-left.html` | Same, placements swapped: `[--placement:top-right] sm:[--placement:top-left]` |
| Destroy / reinit | Destroy and reinitialize | `examples/overlays/dropdown/destroy-and-reinitialize.html` (+ `.js`) | Adds two control buttons; JS calls `HSDropdown.getInstance(el, true).element.destroy()` then `HSDropdown.autoInit()` |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `dropdown` | Menu panel fill (`bg-dropdown`) | `white` | `neutral-900` |
| `dropdown-line` | Menu border (`border-dropdown-line`) | `transparent` | `transparent` |
| `dropdown-item-foreground` | Item label colour | `gray-800` | `neutral-200` |
| `dropdown-item-hover` | Item hover fill | `gray-100` | `neutral-800` |
| `dropdown-item-focus` | Item keyboard-focus fill | `gray-100` | `neutral-800` |
| `dropdown-divider` | `divide-dropdown-divider` between item groups | `gray-200` | `neutral-800` |
| `dropdown-header` | `border-dropdown-header` under the header block | `gray-200` | `neutral-700` |
| `layer` | Toggle button resting fill | `white` | `neutral-800` |
| `layer-line` | Toggle button border | `gray-200` | `neutral-700` |
| `layer-foreground` | Toggle button label | `gray-800` | `white` |
| `layer-hover` | Toggle hover fill | `gray-50` | `neutral-700` |
| `layer-focus` | Toggle focus fill | `gray-50` | `neutral-700` |
| `surface` | Split-button (second half) fill | `gray-100` | `neutral-700` |
| `surface-foreground` | Split-button label | `gray-800` | `neutral-200` |
| `surface-hover` / `surface-focus` | Split-button hover / focus fill | `gray-200` | `neutral-600` |
| `line-2` | Split-button border (`border-line-2`) | `gray-200` | `neutral-700` |
| `line-3` | Checkbox / radio border (`border-line-3`) | `gray-300` | `neutral-600` |
| `primary-checked` | Checked checkbox / radio fill + border | `gray-800` | `white` |
| `primary` | Checkbox `text-primary` accent | `gray-800` | `white` |
| `foreground` | Item title text in checkbox/radio + header e-mail | `gray-800` | `neutral-200` |
| `muted-foreground` | Uppercase section title (`title.html`) | `gray-500` | `neutral-500` |
| `muted-foreground-1` | "Signed in as" caption (`with-header.html`) | `gray-600` | `neutral-400` |
| `muted-foreground-2` | Avatar label, kebab icon, item descriptions | `gray-700` | `neutral-300` |

## Behaviour (JS)
Class `HSDropdown` (`assets/js/preline/dropdown.js`, v4.2.0). Auto-inits on `window` `load`; the instance registry is `window.$hsDropdownCollection`.

**State classes the JS writes** — root gets `open`, menu swaps `hidden` ⇄ `block`. Every `hs-dropdown-open:*` utility is the CSS variant for the root's `open` class. Under `[--scope:window]` the *menu* gets `open` as well, because it has been reparented to `<body>` and no longer has the root as an ancestor.

**CSS-variable options** (read off the root via `getComputedStyle`, so they are breakpoint-able with `sm:[--placement:…]`):

| Var | Default | Effect |
|---|---|---|
| `--trigger` | `click` | `click` \| `hover` \| `contextmenu` (long-press on touch synthesises contextmenu) |
| `--auto-close` | `true` | `true` \| `inside` \| `outside` \| `false` |
| `--placement` | `bottom-start` | `POSITIONS[value] \|\| "bottom-start"`. Map: `auto`, `auto-start`, `auto-end`, `top`, `top-left`→`top-start`, `top-right`→`top-end`, `bottom`, `bottom-left`→`bottom-start`, `bottom-right`→`bottom-end`, `right`, `right-start`, `right-end`, `left`, `left-start`, `left-end`. An unknown value silently falls back to `bottom-start` |
| `--strategy` | `fixed` | `fixed` \| `absolute` \| `static` |
| `--offset` | `10` | px gap toggle→menu |
| `--flip` | `true` | Floating UI flip middleware |
| `--adaptive` | `adaptive` | Horizontal clamping. With the default, the computed `x` is clamped into the viewport before being written into `translate3d`. `none` writes `x` as-is (and, under `--strategy:absolute`, drops the transform entirely for a plain `position/margin:0`) |
| `--gpu-acceleration` | `true` | set `false` when animating `transform` yourself (see `scale-animation.html`) |
| `--scope` | *(empty = parent)* | `window` moves the menu to `document.body` |
| `--has-autofocus` | `true` | focus first item on open |
| `--autofocus-on-keyboard-only` | `true` | only autofocus when opened via keyboard |

`--prevent-on-load-init` is **not** a CSS variable: `autoInit()` selects `.hs-dropdown:not(.--prevent-on-load-init)`, so you add the bare class token `--prevent-on-load-init` to the class list (as `examples/third-party-plugins/**` do), never `[--prevent-on-load-init:true]`.

**Attributes the JS reads:** `data-hs-dropdown-toggle` and `data-hs-dropdown-item` (accessibility fallbacks alongside `.hs-dropdown-toggle` / `[role=menuitem]`), and `data-hs-dropdown-transition` — `close()` waits on `el.querySelector('[data-hs-dropdown-transition]') || this.menu`. Those three are the only `data-hs-*` strings in `dropdown.js`.

**Static API:** `HSDropdown.autoInit()`, `HSDropdown.getInstance(elOrSelector, asObject?)`, `HSDropdown.open(target, ?)`, `HSDropdown.close(target)`, `HSDropdown.closeCurrentlyOpened(el?, bool?)`, `HSDropdown.on(event, target, cb)`.
**Instance:** `open()`, `close()`, `destroy()`, `isOpened()`, `containsElement(el)`.
**Events:** `open.hs.dropdown`, `close.hs.dropdown`.
Keyboard set handled: `Escape ArrowUp ArrowDown ArrowRight ArrowLeft Home End Enter`.

`getInstance(el, true)` returns the **collection record** `{element}`; `getInstance(el)` returns the instance directly — the destroy example uses the former: `const {element} = HSDropdown.getInstance(el, true); element.destroy();`

## Gotchas
- **`border-dropdown-line` is `transparent` in BOTH moon modes.** The panel edge you see is `shadow-md`, not the border. Dropping `shadow-md` leaves an edgeless panel; swapping in `border-line-2` is what you want if you actually need a visible hairline.
- The menu must be a **direct child** of `.hs-dropdown`. Wrapping it in a positioning `<div>` makes `this.menu` null and `init()` never runs — no error, just a dead button.
- `--strategy` defaults to **`fixed`**, so the menu is not clipped by `overflow-hidden` ancestors but *is* detached from page scroll containers. `responsive-alignment.html` opts into `[--strategy:absolute]` precisely because it hand-positions with `top-0 lg:inset-e-0`.
- `[--scope:window]` **moves the menu into `document.body`**. Anything relying on ancestor selectors, form nesting, or a React portal boundary breaks.
- The default example's menu carries `before:h-4 before:-top-4` / `after:h-4 after:-bottom-4` full-width pseudo-elements. Those are the hover bridge for `[--trigger:hover]` — deleting them makes hover dropdowns close when the pointer crosses the `mt-2` gap.
- `hs-dropdown-open:*` needs the utility on the element you want restyled *and* an ancestor `.hs-dropdown.open`; it is a variant, not a JS-set class. The chevron uses `hs-dropdown-open:rotate-180` on the `<svg>` itself.
- Anything re-rendered by the SPA (React route change, list refresh) needs `HSDropdown.autoInit()` after mount; `autoInit` filters stale records with `document.contains`, so re-calling it is safe.
- Checkbox/radio menus need `--auto-close:inside` or the first click closes the menu, and it has to be the **class** `[--auto-close:inside]`. `closeCurrentlyOpened` reads it with `getClassPropertyAlt`, which walks `el.classList` looking for a token containing `--auto-close` and regexes the value out of `:(.*)]` — it never touches attributes. `dropdown-item-checkbox.html` / `dropdown-item-radio.html` also carry `data-hs-dropdown-auto-close="inside"`, but that string appears nowhere in `dropdown.js`: it is inert documentation, so do not ship it alone.
- `transform-style-animation.html` marks its inner box `data-hs-transition`, while `close()` looks for `[data-hs-dropdown-transition]`. The example works only because the lookup falls back to `this.menu`, which carries `transition-[opacity,margin]`. If you strip the transition off the menu and rely on the inner box, use the `-dropdown-` spelling or the close animation is cut short.
- `[--gpu-acceleration:false]` in `scale-animation.html` is load-bearing: with GPU acceleration on, Preline writes its own `transform` for positioning and your `scale-95`→`scale-100` is overwritten.
- Split buttons put `.hs-dropdown` on the **second** button's wrapper only; the first button is outside the component. Its `border-line-2` differs from the plain toggle's `border-layer-line` — don't unify them.

## Copy-paste base
`examples/overlays/dropdown/default.html`

```html
<!-- Dropdown -->
<div class="hs-dropdown [--auto-close:inside] relative inline-flex">
  <button id="hs-dropdown-default" type="button" class="hs-dropdown-toggle py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg bg-layer border border-layer-line text-layer-foreground shadow-2xs hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus disabled:opacity-50 disabled:pointer-events-none" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
    Actions
    <svg class="hs-dropdown-open:rotate-180 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
  </button>

  <div class="hs-dropdown-menu transition-[opacity,margin] duration hs-dropdown-open:opacity-100 opacity-0 hidden min-w-60 bg-dropdown border border-dropdown-line shadow-md rounded-lg mt-2 after:h-4 after:absolute after:-bottom-4 after:inset-s-0 after:w-full before:h-4 before:absolute before:-top-4 before:inset-s-0 before:w-full" role="menu" aria-orientation="vertical" aria-labelledby="hs-dropdown-default">
    <div class="p-1 space-y-0.5">
      <a class="flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-dropdown-item-foreground hover:bg-dropdown-item-hover focus:outline-hidden focus:bg-dropdown-item-focus" href="#">
        Newsletter
      </a>
      <a class="flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-dropdown-item-foreground hover:bg-dropdown-item-hover focus:outline-hidden focus:bg-dropdown-item-focus" href="#">
        Purchases
      </a>
      <a class="flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-dropdown-item-foreground hover:bg-dropdown-item-hover focus:outline-hidden focus:bg-dropdown-item-focus" href="#">
        Downloads
      </a>
      <a class="flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-dropdown-item-foreground hover:bg-dropdown-item-hover focus:outline-hidden focus:bg-dropdown-item-focus" href="#">
        Team Account
      </a>
    </div>
  </div>
</div>
<!-- End Dropdown -->
```
