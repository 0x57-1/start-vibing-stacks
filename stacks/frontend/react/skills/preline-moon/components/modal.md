---
component: modal
label: Modal
category: overlays
docs: https://preline.co/docs/components/modal.html
examples: 13
js: HSOverlay
tokens: [overlay, overlay-line, overlay-header, overlay-footer, foreground, primary, primary-line, primary-foreground, primary-hover, primary-focus, surface, surface-line, surface-foreground, surface-hover, surface-focus, layer, layer-line, layer-foreground, layer-hover, layer-focus]
---

# Modal

A page-blocking dialog: a `hidden` fixed full-viewport `.hs-overlay` scroller containing a centred panel, opened by any element carrying `data-hs-overlay="#id"` and driven by `HSOverlay`.

## When to use
- Confirmations, short forms and anything that must interrupt the flow and take focus.
- Use **Offcanvas** (same `HSOverlay` engine) when the panel should slide from an edge and keep page context — navigation, carts, filters.
- Use **Dropdown**/**Popover** for non-blocking, anchored panels. A modal locks body scroll and steals focus; that is the cost.
- The mobile-first pattern in this repo is a bottom sheet/full-screen drawer, not a centred dialog — see `fullscreen-modal.html` for the `sm:`/`md:`/`lg:` full-screen-below-breakpoint variants.

## Anatomy
Reduced skeleton (classes all taken from `examples/overlays/modal/example.html`):

```html
<button data-hs-overlay="#hs-basic-modal"                 <!-- any element; toggles the overlay -->
        aria-haspopup="dialog" aria-expanded="false" aria-controls="hs-basic-modal">Open</button>

<div id="hs-basic-modal"
     class="hs-overlay hidden size-full fixed top-0 inset-s-0 z-80
            overflow-x-hidden overflow-y-auto pointer-events-none"   <!-- scroller, click-through -->
     role="dialog" tabindex="-1" aria-labelledby="hs-basic-modal-label">
  <div class="sm:max-w-lg sm:w-full m-3 sm:mx-auto">                  <!-- animation target -->
    <div class="flex flex-col bg-overlay border border-overlay-line shadow-2xs rounded-xl
                pointer-events-auto">                                 <!-- panel; re-enables clicks -->
      <div class="… border-b border-overlay-header">
        <h3 id="hs-basic-modal-label" class="font-semibold text-foreground">Title</h3>
        <button aria-label="Close" data-hs-overlay="#hs-basic-modal" class="… bg-surface …">×</button>
      </div>
      <div class="p-4 overflow-y-auto">…</div>
      <div class="… border-t border-overlay-footer">…</div>
    </div>
  </div>
</div>
```

The three-level nesting is required: `.hs-overlay` (fixed scroller, `pointer-events-none`) → sizing/animation wrapper → panel (`pointer-events-auto`).

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| Default | Default modal | `examples/overlays/modal/example.html` | Fade only — `hs-overlay-open:opacity-100 hs-overlay-open:duration-500 opacity-0 transition-all` sits on the **root**, wrapper is plain `sm:max-w-lg` |
| Scale transition | Scale transition | `examples/overlays/modal/scale-animation.html` | Wrapper is `hs-overlay-animation-target hs-overlay-open:scale-100 scale-95 … min-h-[calc(100%-56px)] flex items-center`; panel gains `w-full` |
| Slide-down transition | Slide-down transition | `examples/overlays/modal/slide-down-animation.html` | Wrapper `hs-overlay-animation-target hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all` |
| Slide-up transition | Slide-up transition | `examples/overlays/modal/slide-up-animation.html` | Same margin animation starting lower (`mt-14` → `hs-overlay-open:mt-7`) but the wrapper has **no** `hs-overlay-animation-target` — only `scale-animation.html` and `slide-down-animation.html` carry that class |
| Sizes | Modal sizes | `examples/overlays/modal/sizes.html` | Three modals; only the wrapper width changes: `sm:max-w-lg` / `md:max-w-2xl` / `lg:max-w-4xl` (+ matching `mx-auto` breakpoint) |
| Static backdrop | Static backdrop | `examples/overlays/modal/static-backdrop.html` | Root gains `[--overlay-backdrop:static]` and `data-hs-overlay-keyboard="false"` — backdrop click and Esc both stop closing |
| Scrolling behaviour | Scrolling behavior | `examples/overlays/modal/scrolling-behavior.html` | Two modals, and the CSS var is on the **second** one. `#hs-scroll-inside-body-modal` (first, plain root) gets it purely from CSS: wrapper `m-3 h-[calc(100%-56px)]` + panel `max-h-full overflow-hidden` so the `p-4 overflow-y-auto` body scrolls. `#hs-scroll-inside-viewport-modal` (second) has `[--overlay-scroll-behavior:inside-viewport]` on the root and a plain wrapper/panel |
| Centered | Centered modal | `examples/overlays/modal/vertically-centered.html` | Wrapper adds `min-h-[calc(100%-56px)] flex items-center`; scrollable version also adds `h-[calc(100%-56px)]` |
| Focus management | Focus management | `examples/overlays/modal/focus-management.html` | Body holds an `<input>`; `--has-autofocus` (default `true`) puts focus in the dialog on open |
| Toggle between modals | Toggle between modals | `examples/overlays/modal/toggle-between-modals.html` | Two modals, no CSS vars, no options. Each `×` closes itself (`data-hs-overlay="#its-own-id" data-hs-overlay-close`); an in-body button points at the **other** id, and default `isClosePrev:true` closes the first as the second opens |
| Stacked overlays | Stacked overlays | `examples/overlays/modal/stacked-overlays.html` | Three roots at `z-80` / `z-70` / `z-60`. `data-hs-overlay-options='{ "isClosePrev": false }'` sits on the 6 buttons targeting levels **2 and 3** (their opener + both closers each); the level-1 opener and closers have none, because nothing sits under level 1 |
| Fullscreen | Fullscreen modal | `examples/overlays/modal/fullscreen-modal.html` | Five modals. Wrapper `hs-overlay-open:mt-0 mt-10 max-w-full max-h-full h-full`; the 4 breakpoint variants undo it above `sm:`/`md:`/`lg:`/`xl:` with e.g. `sm:hs-overlay-open:mt-10 sm:mt-0 sm:max-w-lg sm:max-h-none sm:h-auto sm:mx-auto` (the `xl` wrapper uses `xl:max-w-xl`), and the panel re-gains its corners with `sm:border sm:rounded-xl sm:shadow-2xs` — the fullscreen panel keeps `border border-overlay-line` but drops `rounded-xl shadow-2xs` |
| Custom backdrop colour | Custom backdrop color | `examples/overlays/modal/custom-backdrop-color.html` | Root gains `hs-overlay-backdrop-open:bg-primary-950/90` — the JS copies any `hs-overlay-backdrop-open:*` class onto the generated backdrop |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `overlay` | Panel fill (`bg-overlay`) | `white` | `neutral-800` |
| `overlay-line` | Panel border (`border-overlay-line`) | `transparent` | `transparent` |
| `overlay-header` | Header rule (`border-b border-overlay-header`) | `gray-200` | `neutral-700` |
| `overlay-footer` | Footer rule (`border-t border-overlay-footer`) | `gray-200` | `neutral-700` |
| `foreground` | Dialog title + body copy | `gray-800` | `neutral-200` |
| `primary` | Trigger button + primary action fill | `gray-800` | `white` |
| `primary-line` | Primary button border | `transparent` | `transparent` |
| `primary-foreground` | Primary button label | `white` | `neutral-800` |
| `primary-hover` / `primary-focus` | Primary button hover / focus fill | `gray-900` | `neutral-300` |
| `surface` | Round close-`×` button fill | `gray-100` | `neutral-700` |
| `surface-line` | Close button border | `transparent` | `transparent` |
| `surface-foreground` | Close icon colour | `gray-800` | `neutral-200` |
| `surface-hover` / `surface-focus` | Close button hover / focus fill | `gray-200` | `neutral-600` |
| `layer` | Secondary ("Close") footer button fill | `white` | `neutral-800` |
| `layer-line` | Secondary button border | `gray-200` | `neutral-700` |
| `layer-foreground` | Secondary button label | `gray-800` | `white` |
| `layer-hover` / `layer-focus` | Secondary button hover / focus fill | `gray-50` | `neutral-700` |
| `muted-foreground-1` | Input placeholder in `focus-management.html` | `gray-600` | `neutral-400` |
| `primary-950` | Custom backdrop tint (`hs-overlay-backdrop-open:bg-primary-950/90`) | `gray-950` | `neutral-950` |

## Behaviour (JS)
Class `HSOverlay` (`assets/js/preline/overlay.js`, v4.2.0). Auto-inits on `window` `load`; registry `window.$hsOverlayCollection`. Modal and Offcanvas are the **same** plugin — only the markup differs.

**State classes the JS writes:** root gets `open` **and** `opened`; `hs-overlay-open:*` is the variant for that state. `document.body` gets `hs-overlay-body-open` only when `--is-layout-affect` is on. The backdrop is a generated `<div class="hs-overlay-backdrop …">` appended to `backdropParent`.

**Attributes**

`overlay.js` contains exactly six `data-hs-*` strings — anything else you see in the markup is inert.

| Attribute | Where | Effect |
|---|---|---|
| `data-hs-overlay="#id"` | trigger / close button | The instance collects `document.querySelectorAll('[data-hs-overlay="#<id>"]')` as its toggle buttons; every one of them toggles |
| `data-hs-overlay-keyboard="false"` | root | Sets `hasAbilityToCloseOnBackdropClick=false` (default `true`), which gates `onEsc`, the `--close-when-click-inside` click and the `inside-viewport` click — **not** the backdrop click, which is unconditional |
| `data-hs-overlay-options='{…}'` | root **and/or** any toggle | Parsed off the root, then shallow-merged with the JSON of every toggle button in document order (toggles win), then with the constructor's options. Config is per **overlay**, not per trigger |
| `data-hs-overlay-backdrop-container="#sel"` | root | Selector of a node to `cloneNode(true)` as the backdrop instead of the generated `<div>` |
| `data-hs-overlay-minifier="#id"` | button | Drives `HSOverlay.minify()` (sidebar collapse; not used by modal examples) |
| `data-hs-overlay-backdrop-template` | — | **Written by the JS** onto the backdrop it creates. Not an authoring hook |

`data-hs-overlay-close` appears in `toggle-between-modals.html` but in **no** file under `assets/js/preline/` — it is decoration. The `×` buttons that carry it also carry `data-hs-overlay="#their-own-id"`, which is what closes them. The *swap* comes from a separate in-body button pointing at the other modal's id plus `isClosePrev` defaulting to `true`.

**CSS-variable options** (on the root)

| Var | Default | Effect |
|---|---|---|
| `--overlay-backdrop` | `true` | `false` = no backdrop; `static` = backdrop rendered but click does not close |
| `--overlay-scroll-behavior` | *(page)* | `inside-viewport` sets `el.style.pointerEvents='auto'` on open (overriding the root's `pointer-events-none`) so the fixed scroller itself takes the wheel, and adds a click-on-root closer gated by `hasAbilityToCloseOnBackdropClick` |
| `--body-scroll` | `false` | `true` leaves `<body>` scrollable |
| `--has-autofocus` | `true` | focus the dialog on open |
| `--has-dynamic-z-index` | `false` | auto-stack z-index instead of hand-written `z-80/z-70/z-60` |
| `--is-layout-affect` | `false` | add `hs-overlay-body-open` to `<body>` |
| `--auto-close` / `--auto-close-equality-type` | — | Breakpoint (a number, or a `BREAKPOINTS` name) at which resize force-closes an `opened` overlay. `--auto-close-equality-type:less-than` flips the test to `clientWidth <= n`; anything else means `clientWidth >= n` |
| `--auto-hide` | `0` | ms before self-close |
| `--close-when-click-inside` | `false` | close on any inside click |
| `--tab-accessibility-limited` | `true` | limit Tab to the dialog |
| `--toggle-classes-immediately` | `false` | skip the transition frame |
| `--opened` | — | breakpoint at which it starts open |

`--prevent-on-load-init` is **not** a CSS variable: `autoInit()` selects `.hs-overlay:not(.--prevent-on-load-init)`, so add the bare class token `--prevent-on-load-init` to the root's class list, never `[--prevent-on-load-init:true]`.

**JS options** (via `data-hs-overlay-options` or `new HSOverlay(el, opts)`): `hiddenClass` (`"hidden"`), `emulateScrollbarSpace` (`false`), `isClosePrev` (**`true`**), `backdropClasses`, `backdropParent` (`document.body`), `backdropExtraClasses`, `moveOverlayToBody`, `isToggleClassesImmediately`.

**Static API:** `HSOverlay.autoInit()`, `.getInstance(elOrSelector, asObject?)`, `.open(target)`, `.close(target)`, `.minify(target, bool)`, `.setOpened(breakpoint, record)`, `.on(event, target, cb)`, `.findInCollection(target)`.
**Instance:** `open(cb?)`, `close(forced?, cb?)`, `destroy()`, `isOpened()`, `minify(bool, cb?)`.
**Events:** `open.hs.overlay`, `close.hs.overlay`. Keyboard set: `Escape`, `Tab` (`OVERLAY_ACCESSIBILITY_KEY_SET`).

`getInstance(el)` with no second argument returns `element.el` — the **DOM node**, not the instance (same asymmetry as `HSTooltip`). Pass `true` and destructure `{element}`. It also accepts a toggle button: if the resolved element carries a `data-hs-overlay` attribute, that attribute's value is used as the lookup selector instead.

## Gotchas
- **The default backdrop is NOT themed.** `backdropClasses` is hardcoded to `"hs-overlay-backdrop transition duration fixed inset-0 bg-gray-900/50 dark:bg-neutral-900/80"` — plain Tailwind, no moon token, and it uses `dark:` not the moon variables. To retint, add `hs-overlay-backdrop-open:bg-…` to the **root**: the JS scans the root's class list and copies any class starting with (or containing `:`) `hs-overlay-backdrop-open:` onto the generated backdrop.
- **`border-overlay-line` is `transparent` in both moon modes.** `shadow-2xs` alone separates the panel from the backdrop. Don't "clean up" the border class expecting a visible edge — and don't expect one to appear.
- **`isClosePrev` defaults to `true`.** Opening modal B from inside modal A silently closes A. The fix is `data-hs-overlay-options='{ "isClosePrev": false }'`, and it belongs to the **nested** overlay (B), not to A: the constructor merges the JSON off B's root plus every `[data-hs-overlay="#B"]` button, so one of them setting it is enough for the whole instance. `stacked-overlays.html` puts it on all 6 buttons that address levels 2 and 3, and on none of the level-1 buttons. Add hand-managed descending `z-` values (`z-80`/`z-70`/`z-60`) or `--has-dynamic-z-index:true`.
- `pointer-events-none` on the root and `pointer-events-auto` on the panel are load-bearing: the root covers the viewport, so without the pair the backdrop never receives the click that closes the modal.
- **`hs-overlay-animation-target` is nearly always absent, and the animation still runs.** Of the 13 examples only `scale-animation.html` and `slide-down-animation.html` carry it. `this.animationTarget = el.querySelector('.hs-overlay-animation-target') || el` — it only selects which element `afterTransition` is measured on, it does **not** enable anything. The other eleven put `hs-overlay-open:mt-7 hs-overlay-open:opacity-100 transition-all` on the unmarked wrapper (or, in `example.html`, on the root itself) and animate fine — the JS only ever writes `open`/`opened` onto the **root**, and those wrappers are descendants of it, so the variant resolves through the ancestor either way. Add the marker when the wrapper's transition outlasts the root's, so `close()` waits on the right element.
- `[--overlay-backdrop:static]` alone still closes on **Esc**. `static-backdrop.html` also sets `data-hs-overlay-keyboard="false"` — you need both.
- `role="dialog" tabindex="-1" aria-labelledby="…-label"` and the matching `id` on the `<h3>` are what make the dialog announceable; the trigger's `aria-haspopup="dialog" aria-expanded aria-controls` triple is maintained by the JS. Keep all of it.
- The magic number `56px` in `h-[calc(100%-56px)]` / `min-h-[calc(100%-56px)]` is the `m-3` (12px) top+bottom plus the `mt-7` (28px) open offset. Change the margins and you must change the calc.
- After any SPA re-render, call `HSOverlay.autoInit()`; and if you removed a still-open overlay from the DOM, `close()` it first or `hs-overlay-body-open`/scroll-lock can survive it.

## Confirm dialog

The most-requested shape, and the one with no dedicated example. Build it from
`examples/overlays/modal/example.html` (the Copy-paste base below) plus four deliberate changes.

**1. Make it un-dismissable so the answer is explicit.** Verbatim from
`examples/overlays/modal/static-backdrop.html` — the var goes on the **root**, the attribute is
`false` as a string:

```
class="hs-overlay [--overlay-backdrop:static] hidden size-full fixed top-0 inset-s-0 z-80 overflow-x-hidden overflow-y-auto pointer-events-none"
data-hs-overlay-keyboard="false"
```

Backdrop click and `Escape` both stop closing. Now the `×` and Cancel are the only ways out, so
**keep both** — a static backdrop with no visible cancel is a trap.

**2. Recolour the confirm button.** The footer in the Copy-paste base below is already the right
shape (`flex justify-end items-center gap-x-2 py-3 px-4 border-t border-overlay-footer`, Cancel on
`bg-layer`, action on `bg-primary`). Leave the Cancel button exactly as it is; on the action button
swap five class tokens. **This is a substitution, not a quotation — `bg-destructive` appears in no
example file** (`grep -rl 'bg-destructive' examples/` = 0):

| In `example.html` | For a destructive confirm | Resolved (light = dark) |
|---|---|---|
| `bg-primary` | `bg-destructive` | `red-500` |
| `border-primary-line` | `border-transparent` | — |
| `text-primary-foreground` | `text-destructive-foreground` | `white` |
| `hover:bg-primary-hover` | `hover:bg-destructive-hover` | `red-600` |
| `focus:bg-primary-focus` | `focus:bg-destructive-focus` | `red-600` |

The `destructive` ramp does **not** invert between modes, so unlike `primary` this pair is safe in
both — but keep the `-foreground` pairing anyway. If you would rather ship only classes that exist
in the corpus, Preline's own red button is
`bg-red-500 border border-transparent text-foreground-inverse hover:bg-red-600 focus:bg-red-600`
(`examples/base-components/buttons/solid-color-variants.html`) — identical pixels, raw palette.
Do **not** reuse `destructive` for a validation border; those stay literal `red-500` (`components/select.md`).

**3. If the confirm opens from a drawer or another modal, it will close it.** `isClosePrev` defaults
to `true` on `HSOverlay`, and an `offcanvas` is the same plugin — clicking "Delete" inside a drawer
makes the drawer vanish as the dialog appears, and cancelling leaves you on the bare page. Put
`data-hs-overlay-options='{ "isClosePrev": false }'` on the **confirm** overlay's trigger and its
closers (the pattern in `examples/overlays/modal/stacked-overlays.html`), then hand-manage `z-`:
the drawer is `z-80`, so the dialog needs higher, or set `--has-dynamic-z-index:true`.

**4. In pubweb-saas, prefer the repo's own dialog.** `@/Components/Common/Modal`
(`{ open, onClose, size, closeOnBackdrop, className, children }`) is React-state driven, so none of
the `autoInit` / `isClosePrev` / body-scroll traps apply. **But it is `z-[70]`** and every Preline
overlay example is `z-80` — open it from a Preline `offcanvas` and it renders *behind* the drawer.
Pick one family per stack. Inventory and ladder: `reference/project-integration.md` §5, §5a.

## Copy-paste base
`examples/overlays/modal/example.html`

```html
<button type="button" class="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg bg-primary border border-primary-line text-primary-foreground hover:bg-primary-hover focus:outline-hidden focus:bg-primary-focus disabled:opacity-50 disabled:pointer-events-none" aria-haspopup="dialog" aria-expanded="false" aria-controls="hs-basic-modal" data-hs-overlay="#hs-basic-modal">
  Open modal
</button>

<div id="hs-basic-modal" class="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 hidden size-full fixed top-0 inset-s-0 z-80 opacity-0 overflow-x-hidden transition-all overflow-y-auto pointer-events-none" role="dialog" tabindex="-1" aria-labelledby="hs-basic-modal-label">
  <div class="sm:max-w-lg sm:w-full m-3 sm:mx-auto">
    <div class="flex flex-col bg-overlay border border-overlay-line shadow-2xs rounded-xl pointer-events-auto">
      <div class="flex justify-between items-center py-3 px-4 border-b border-overlay-header">
        <h3 id="hs-basic-modal-label" class="font-semibold text-foreground">
          Modal title
        </h3>
        <button type="button" class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full bg-surface border border-surface-line text-surface-foreground hover:bg-surface-hover focus:outline-hidden focus:bg-surface-focus disabled:opacity-50 disabled:pointer-events-none" aria-label="Close" data-hs-overlay="#hs-basic-modal">
          <span class="sr-only">Close</span>
          <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <div class="p-4 overflow-y-auto">
        <p class="mt-1 text-foreground">
          This is a wider card with supporting text below as a natural lead-in to additional content.
        </p>
      </div>
      <div class="flex justify-end items-center gap-x-2 py-3 px-4 border-t border-overlay-footer">
        <button type="button" class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg bg-layer border border-layer-line text-layer-foreground shadow-2xs hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus disabled:opacity-50 disabled:pointer-events-none" data-hs-overlay="#hs-basic-modal">
          Close
        </button>
        <button type="button" class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg bg-primary border border-primary-line text-primary-foreground hover:bg-primary-hover focus:outline-hidden focus:bg-primary-focus disabled:opacity-50 disabled:pointer-events-none">
          Save changes
        </button>
      </div>
    </div>
  </div>
</div>
```
