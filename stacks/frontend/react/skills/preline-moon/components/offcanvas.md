---
component: offcanvas
label: Offcanvas (Drawer)
category: overlays
docs: https://preline.co/docs/components/offcanvas.html
examples: 5
js: HSOverlay
tokens: [overlay, overlay-line, overlay-header, foreground, primary, primary-line, primary-foreground, primary-hover, primary-focus, surface, surface-line, surface-foreground, surface-hover, surface-focus]
---

# Offcanvas (Drawer)

An edge-anchored panel that slides in over the page: a `hidden`, `fixed`, pre-translated `.hs-overlay` whose `hs-overlay-open:translate-*-0` variant undoes the offset. Same `HSOverlay` plugin as Modal.

## When to use
- Mobile navigation, carts, filter panels, detail sidebars — anything wide/tall that should keep the page visible behind it.
- Use **Modal** when the content is a short, centred, must-answer dialog.
- Use `[--body-scroll:true] [--overlay-backdrop:false]` (see `scrolling.html`) when the drawer should coexist with page scrolling — that is the "inspector panel" mode, not a true overlay.
- Use **Dropdown**/**Popover** for anchored, non-blocking panels; an offcanvas is full-height and takes focus.

## Anatomy
Reduced skeleton (classes verbatim from `examples/overlays/offcanvas/example.html`):

```html
<button aria-haspopup="dialog" aria-expanded="false" aria-controls="hs-offcanvas-example"
        data-hs-overlay="#hs-offcanvas-example">Open</button>

<div id="hs-offcanvas-example"
     class="hs-overlay hs-overlay-open:translate-x-0        <!-- open state: cancel the offset -->
            hidden translate-x-full                          <!-- closed state: pushed off-screen -->
            fixed top-0 inset-e-0 transition-all duration-300 transform
            h-full max-w-xs w-full z-80
            bg-overlay border-e border-overlay-line"         <!-- panel IS the overlay root -->
     role="dialog" tabindex="-1" aria-labelledby="hs-offcanvas-example-label">
  <div class="flex justify-between items-center py-3 px-4 border-b border-overlay-header">
    <h3 id="hs-offcanvas-example-label" class="font-semibold text-foreground">Offcanvas title</h3>
    <button aria-label="Close" data-hs-overlay="#hs-offcanvas-example" class="… bg-surface …">×</button>
  </div>
  <div class="p-4"><p class="text-foreground">…</p></div>
</div>
```

Unlike Modal there is **no** inner sizing wrapper and **no** `pointer-events-none/auto` pair: `.hs-overlay` *is* the panel.

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| Default (right) | Default offcanvas | `examples/overlays/offcanvas/example.html` | `hs-overlay-open:translate-x-0 translate-x-full`, `top-0 inset-e-0`, `h-full max-w-xs w-full`, `border-e border-overlay-line` |
| Top / left / bottom | Alternative placements | `examples/overlays/offcanvas/placement.html` | Three drawers. Top: `-translate-y-full` + `inset-x-0 max-h-40 size-full border-b`. Left: `-translate-x-full` + `inset-s-0 border-s`. Bottom: `translate-y-full` + `bottom-0 inset-x-0 max-h-40 size-full border-t` |
| Body scroll | Body scroll options | `examples/overlays/offcanvas/scrolling.html` | Two drawers: `[--body-scroll:true] [--overlay-backdrop:false]` (page scrolls, no backdrop) and `[--body-scroll:true]` alone (backdrop kept) |
| Custom backdrop colour | Custom backdrop color | `examples/overlays/offcanvas/custom-backdrop-color.html` | Root adds `hs-overlay-backdrop-open:bg-primary-950/90`; markup otherwise identical to default |
| Destroy / reinit | Destroy and reinitialize | `examples/overlays/offcanvas/destroy-and-reinitialize.html` (+ `.js`) | Adds two control buttons (`bg-layer` / `bg-surface`); JS calls `HSOverlay.getInstance(overlay, true).element.destroy()` then `HSOverlay.autoInit()` |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `overlay` | Drawer panel fill (`bg-overlay`) | `white` | `neutral-800` |
| `overlay-line` | Edge border facing the page (`border-e/s/t/b border-overlay-line`) | `transparent` | `transparent` |
| `overlay-header` | Header rule (`border-b border-overlay-header`) | `gray-200` | `neutral-700` |
| `foreground` | Drawer title + body copy | `gray-800` | `neutral-200` |
| `primary` | Trigger button fill | `gray-800` | `white` |
| `primary-line` | Trigger button border | `transparent` | `transparent` |
| `primary-foreground` | Trigger button label | `white` | `neutral-800` |
| `primary-hover` / `primary-focus` | Trigger hover / focus fill | `gray-900` | `neutral-300` |
| `surface` | Round close-`×` button fill | `gray-100` | `neutral-700` |
| `surface-line` | Close button border | `transparent` | `transparent` |
| `surface-foreground` | Close icon colour | `gray-800` | `neutral-200` |
| `surface-hover` / `surface-focus` | Close button hover / focus fill | `gray-200` | `neutral-600` |
| `primary-950` | Custom backdrop tint (`hs-overlay-backdrop-open:bg-primary-950/90`) | `gray-950` | `neutral-950` |
| `layer` | "Destroy overlay" control button fill (destroy example only) | `white` | `neutral-800` |
| `layer-line` | That button's border | `gray-200` | `neutral-700` |
| `layer-foreground` | That button's label | `gray-800` | `white` |
| `layer-hover` / `layer-focus` | That button's hover / focus fill | `gray-50` | `neutral-700` |

## Behaviour (JS)
Class `HSOverlay` (`assets/js/preline/overlay.js`, v4.2.0) — **identical plugin to Modal**; see `components/modal.md` for the full option table. Auto-inits on `window` `load`; registry `window.$hsOverlayCollection`.

**State classes the JS writes:** root gets `open` and `opened` (drives every `hs-overlay-open:*` variant) and the `hidden` class is removed. The backdrop is a generated `<div class="hs-overlay-backdrop …">`.

**Attributes used by these examples:** only `data-hs-overlay="#id"` — on the trigger and on the close button.

**CSS-variable options that matter here**

| Var | Default | Used by | Effect |
|---|---|---|---|
| `--body-scroll` | `false` | `scrolling.html` | `true` leaves `<body>` scrollable while the drawer is open |
| `--overlay-backdrop` | `true` | `scrolling.html` | `false` = no backdrop at all; `static` = backdrop present but click does not close |
| `--is-layout-affect` | `false` | — | adds `hs-overlay-body-open` to `<body>` (for push-content layouts) |
| `--opened` | — | — | breakpoint at which the drawer starts open (persistent sidebar above `lg`) |
| `--auto-close` | — | — | breakpoint at which it auto-closes |
| `--has-autofocus` | `true` | — | focus the drawer on open |

**Static API:** `HSOverlay.autoInit()`, `.getInstance(elOrSelector, asObject?)`, `.open(target)`, `.close(target)`, `.minify(target, bool)`, `.setOpened(breakpoint, record)`, `.on(event, target, cb)`.
**Instance:** `open()`, `close(forced?, cb?)`, `destroy()`, `isOpened()`, `minify(bool, cb?)`.
**Events:** `open.hs.overlay`, `close.hs.overlay`. Keyboard set: `Escape`, `Tab`.

`getInstance(el)` with no second argument returns `element.el` — the **DOM node**, not the instance. Pass `true` and destructure `{element}`, which is exactly what `destroy-and-reinitialize.js` does.

## Gotchas
- **Class order carries meaning between the placement examples and is easy to break.** The right/left drawers put `hidden` *before* the translate (`hidden translate-x-full`), the top/bottom drawers put `hidden` last (`… border-b border-overlay-line hidden`). Both work, but the pair `hidden` + `translate-*-full` must both be present: without `hidden` the drawer is laid out on load; without the translate it appears with no slide.
- **`border-overlay-line` is `transparent` in both moon modes.** `border-e border-overlay-line` renders nothing — and unlike Modal there is no `shadow` on the panel either, so a light drawer on a light page is separated only by the backdrop. Add a real border (`border-line-2`) or a shadow if you kill the backdrop with `[--overlay-backdrop:false]`.
- **The default backdrop is not themed:** `backdropClasses` is hardcoded to `"hs-overlay-backdrop transition duration fixed inset-0 bg-gray-900/50 dark:bg-neutral-900/80"`. Retint by adding `hs-overlay-backdrop-open:bg-…` to the **root** — the JS copies any class starting with (or containing `:`) `hs-overlay-backdrop-open:` onto the generated node.
- Logical-property insets are used throughout: `inset-e-0` (right in LTR), `inset-s-0` (left), with `border-e` / `border-s` to match. They flip under RTL — the translate direction (`translate-x-full`) does **not**. Check RTL explicitly.
- Top and bottom drawers use `max-h-40 size-full`, i.e. `size-full` sets both dimensions and `max-h-40` clamps the height. Replacing `size-full` with `w-full` silently drops the height and the panel collapses to its content.
- `[--body-scroll:true]` **without** `[--overlay-backdrop:false]` still renders a full-screen backdrop that closes on click — the second example in `scrolling.html` is deliberately that combination. If you want a non-blocking inspector, you need both vars.
- `isClosePrev` defaults to `true` on `HSOverlay`: opening a drawer from inside a modal (or another drawer) closes the first one. Pass `data-hs-overlay-options='{"isClosePrev": false}'` on the trigger to stack.
- `z-80` is baked into every example. Stacking a drawer over a `z-80` modal needs an explicit higher value or `--has-dynamic-z-index:true`.
- **The drawer outranks pubweb-saas's own dialog.** `@/Components/Common/Modal` is `z-[70]` (raised only far enough to clear `AppHeader` at `z-48` / `lg:z-61`); this drawer is `z-80`. A confirm dialog opened from inside the drawer therefore renders **behind** it — visible symptom: the backdrop darkens, the drawer stays on top, the dialog looks like it never opened. Either keep the whole stack in Preline (`components/modal.md` §Confirm dialog) or raise the React modal above `z-80`. Ladder: `reference/project-integration.md` §5a.
- **Opening any other overlay from inside the drawer closes the drawer.** `isClosePrev` defaults to `true` and `HSOverlay` powers *both* offcanvas and modal, so a Preline confirm dialog triggered from a drawer button dismisses the drawer on the way in — and cancelling drops the user on the bare page with their form state gone. `data-hs-overlay-options='{ "isClosePrev": false }'` on the dialog's trigger and closers. A React-state dialog is not affected (it is not an `HSOverlay`).
- Re-run `HSOverlay.autoInit()` after SPA re-renders. If you unmount a drawer while it is open, `close()` it first — **`destroy()` is not enough**. `open()` sets `document.body.style.overflow = 'hidden'` and only `close()` clears it; `destroy()` removes `open`/`opened`/`hidden` and (when `--is-layout-affect`) `hs-overlay-body-open`, but never touches `body.style.overflow`. Skip the `close()` and the page is left unscrollable with no visible overlay.

## Copy-paste base
`examples/overlays/offcanvas/example.html`

```html
<button type="button" class="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg bg-primary border border-primary-line text-primary-foreground hover:bg-primary-hover focus:outline-hidden focus:bg-primary-focus disabled:opacity-50 disabled:pointer-events-none" aria-haspopup="dialog" aria-expanded="false" aria-controls="hs-offcanvas-example" data-hs-overlay="#hs-offcanvas-example">
  Open (right) offcanvas
</button>

<div id="hs-offcanvas-example" class="hs-overlay hs-overlay-open:translate-x-0 hidden translate-x-full fixed top-0 inset-e-0 transition-all duration-300 transform h-full max-w-xs w-full z-80 bg-overlay border-e border-overlay-line" role="dialog" tabindex="-1" aria-labelledby="hs-offcanvas-example-label">
  <div class="flex justify-between items-center py-3 px-4 border-b border-overlay-header">
    <h3 id="hs-offcanvas-example-label" class="font-semibold text-foreground">
      Offcanvas title
    </h3>
    <button type="button" class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full bg-surface border border-surface-line text-surface-foreground hover:bg-surface-hover focus:outline-hidden focus:bg-surface-focus disabled:opacity-50 disabled:pointer-events-none" aria-label="Close" data-hs-overlay="#hs-offcanvas-example">
      <span class="sr-only">Close</span>
      <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </button>
  </div>
  <div class="p-4">
    <p class="text-foreground">
      Some text as placeholder. In real life you can have the elements you have chosen. Like, text, images, lists, etc.
    </p>
  </div>
</div>
```
