---
component: carousel
label: Carousel
category: base-components
docs: https://preline.co/docs/components/carousel.html
examples: 14
js: HSCarousel
tokens: [layer, layer-foreground, layer-hover, layer-line, layer-focus, primary-active, primary, line-4, line-2, scrollbar-track, scrollbar-thumb, foreground, surface, surface-1, surface-2, surface-3, surface-4, surface-5, surface-line, surface-hover, surface-focus, surface-foreground]
---

# Carousel

A slider driven by `HSCarousel`, which measures the container, sets `transform: translateX` on a flex track, and toggles `active` / `disabled` / `dragging` state classes on arrows, dots and slides.

## When to use

- Cycling a small, fixed set of visual slides: hero banners, screenshot tours, product galleries with thumbnails.
- Multi-item rails (`slidesQty: {"xs":1,"sm":3}`) where each item must snap or centre.
- NOT for long or unbounded lists — nothing here virtualises; use `Components/Common/ScrollTable` or a plain overflow container.
- NOT for tabbed content — content the user chooses between belongs in Tabs (`HSTabs`); a carousel moves on its own and hides the other panels from search and keyboard flow.

## Anatomy

Reduced skeleton. All nine `hs-carousel*` class names below are queried literally by the constructor (`assets/js/preline/carousel.js`: `.hs-carousel`, `.hs-carousel-body`, `.hs-carousel-slide`, `.hs-carousel-prev`, `.hs-carousel-next`, `.hs-carousel-pagination`, `.hs-carousel-info`, `.hs-carousel-info-total`, `.hs-carousel-info-current`) — renaming any of them silently disables that part, since each lookup falls back to `null`.

```html
<div id="hs-carousel" class="relative" data-hs-carousel='{"loadingClasses": "opacity-0"}'>
  <div class="hs-carousel relative w-full min-h-96 overflow-hidden">      <!-- this.container -->
    <div class="hs-carousel-body flex flex-nowrap absolute top-0 bottom-0 inset-s-0
                transition-transform duration-700 opacity-0">            <!-- this.inner, gets the transform -->
      <div class="hs-carousel-slide ">…</div>                            <!-- this.slides, width set by JS -->
    </div>
  </div>

  <button type="button" class="hs-carousel-prev hs-carousel-disabled:opacity-50 …">…</button>
  <button type="button" class="hs-carousel-next hs-carousel-disabled:opacity-50 …">…</button>

  <div class="hs-carousel-pagination …"></div>                            <!-- EMPTY for dots; pre-filled for thumbs -->

  <div class="hs-carousel-info …">                                        <!-- optional counter -->
    <span class="hs-carousel-info-current">0</span> / <span class="hs-carousel-info-total">0</span>
  </div>
</div>
```

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| `basic-usage` | Basic usage | `examples/base-components/carousel/basic-usage.html` | Arrows only. Config is just `{"loadingClasses": "opacity-0"}`; no pagination node. |
| `pagination` | Pagination | `examples/base-components/carousel/pagination.html` | Adds an empty `.hs-carousel-pagination` plus `dotsItemClasses` (`hs-carousel-active:bg-primary-active … border border-line-4`). |
| `autoplay` | Autoplay | `examples/base-components/carousel/autoplay.html` | `+ "isAutoPlay": true`. Interval is the `speed` option, default 4000 ms. |
| `infiniteLoop` | Infinite loop | `examples/base-components/carousel/infiniteLoop.html` | `+ "isInfiniteLoop": true`. Suppresses `addDisabledClass()`, so arrows never grey out. |
| `rtl` | RTL | `examples/base-components/carousel/rtl.html` | `+ "isRTL": true`. A JS option — not inferred from `dir="rtl"`. |
| `multiple-slides` | Multiple slides | `examples/base-components/carousel/multiple-slides.html` | `+ "slidesQty": {"xs":1,"sm":3}`; slides get `px-1` and the body `-mx-1`. |
| `centered` | Centered | `examples/base-components/carousel/centered.html` | `+ "isCentered": true` with `slidesQty`; the active slide sits mid-container. |
| `draggable` | Draggable | `examples/base-components/carousel/draggable.html` | `+ "isDraggable": true`; body adds `cursor-grab hs-carousel-dragging:transition-none hs-carousel-dragging:cursor-grabbing`. |
| `auto-height` | Auto height | `examples/base-components/carousel/auto-height.html` | `+ "isAutoHeight": true`; drops `min-h-96` and the `absolute` body, switches to `transition-[height,transform]`. |
| `snap-point` | Snap scrolling | `examples/base-components/carousel/snap-point.html` | `+ "isSnap": true`; container becomes `flex snap-x snap-mandatory overflow-x-auto` with `[&::-webkit-scrollbar-*]` tokens, slides get `snap-center`. |
| `info` | Slide counter | `examples/base-components/carousel/info.html` | Adds `.hs-carousel-info` with `.hs-carousel-info-current` / `.hs-carousel-info-total`; JS fills both. |
| `thumbnails-horizontal` | Thumbnails (horizontal) | `examples/base-components/carousel/thumbnails-horizontal.html` | Pagination is **pre-filled** with `.hs-carousel-pagination-item` (`border border-line-2 … hs-carousel-active:border-primary-active`); no `dotsItemClasses`. |
| `thumbnails-vertical` | Thumbnails (vertical) | `examples/base-components/carousel/thumbnails-vertical.html` | Same, rail is `flex-row sm:flex-col` with `max-h-96` and vertical scrollbar; active border token is `primary`, not `primary-active`. |
| `destroy-and-reinitialize` | Destroy and reinitialize | `examples/base-components/carousel/destroy-and-reinitialize.html` (+ `.js`) | Two `layer`/`surface` buttons calling `element.destroy()` and `HSCarousel.autoInit()`. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` | Arrow-button and info-pill surface | `white` | `neutral-800` |
| `layer-foreground` | Arrow-button icon and info-pill text | `gray-800` | `white` |
| `layer-hover` | Arrow-button hover surface | `gray-50` | `neutral-700` |
| `layer-line` | Border of the destroy/reinit demo buttons | `gray-200` | `neutral-700` |
| `layer-focus` | Focus fill of the destroy demo button | `gray-50` | `neutral-700` |
| `primary-active` | Active dot fill + border; active thumbnail border (horizontal) | `gray-900` | `neutral-300` |
| `primary` | Active thumbnail border in the **vertical** thumbnails variant | `gray-800` | `white` |
| `line-4` | Inactive dot border | `gray-400` | `neutral-500` |
| `line-2` | Thumbnail tile border (resting) | `gray-200` | `neutral-700` |
| `scrollbar-track` | Custom scrollbar track on snap + thumbnail rails | `gray-100` | `neutral-700` |
| `scrollbar-thumb` | Custom scrollbar thumb on snap + thumbnail rails | `gray-300` | `neutral-500` |
| `foreground` | Slide caption text | `gray-800` | `neutral-200` |
| `surface` | Demo slide 1 background (filler, not chrome) | `gray-100` | `neutral-700` |
| `surface-1` | Demo slide 2 background | `gray-200` | `neutral-600` |
| `surface-2` | Demo slide 3 background | `gray-300` | `neutral-500` |
| `surface-3` | Demo slide 4 background | `gray-400` | `neutral-600` |
| `surface-4` | Demo slide 5 background | `gray-500` | `neutral-500` |
| `surface-5` | Demo slide 6 background | `gray-600` | `neutral-400` |
| `surface-line` / `surface-hover` / `surface-focus` | Reinitialize demo button border / hover / focus | `transparent` / `gray-200` / `gray-200` | `transparent` / `neutral-600` / `neutral-600` |
| `surface-foreground` | Reinitialize demo button text | `gray-800` | `neutral-200` |

## Behaviour (JS)

Class `HSCarousel`, source `assets/js/preline/carousel.js` (Preline 4.2.0). Attribute: `data-hs-carousel='<JSON>'` on the root.

Options (constructor defaults, verbatim names):

| Option | Default | Effect |
|---|---|---|
| `currentIndex` | `0` | Starting slide index. |
| `loadingClasses` | `null` | Comma-separated string → `[removeAfterInit, addAfterInit, addLater]`. `"opacity-0"` = remove `opacity-0` from `.hs-carousel-body` once ready. |
| `dotsItemClasses` | `null` | Classes applied to each dot the JS builds inside `.hs-carousel-pagination`. |
| `isAutoHeight` | `false` | Animates container height to the active slide. |
| `isAutoPlay` | `false` | Starts the `speed` timer; every arrow/dot click resets it. |
| `isCentered` | `false` | Centres the active slide in multi-slide mode. |
| `isDraggable` | `false` | Mouse/touch drag on `.hs-carousel-body`. |
| `isInfiniteLoop` | `false` | Wraps around; skips `addDisabledClass()`. |
| `isRTL` | `false` | Right-to-left travel. |
| `isSnap` | `false` | Native scroll-snap mode instead of transform. |
| `hasSnapSpacers` | `true` | Injects `.hs-snap-before` / `.hs-snap-after` into the body when `isSnap`. |
| `speed` | `4000` | Autoplay interval, ms. |
| `updateDelay` | `0` | Delay used when recalculating. |
| `slidesQty` | `1` | Number, or a breakpoint map like `{"xs":1,"sm":3}`. |

Init: `window.addEventListener('load', () => HSCarousel.autoInit())`. `autoInit()` scans `[data-hs-carousel]:not(.--prevent-on-load-init)`, prunes detached entries, and skips elements already in `window.$hsCarouselCollection`. Global is `window.HSCarousel`.

Methods: `goTo(index)` · `goToPrev()` · `goToNext()` · `recalculateWidth()` · `destroy()`.
Statics: `HSCarousel.autoInit()` · `HSCarousel.getInstance(elOrSelector, isInstance?)`.
Events: `instance.on('update', cb)` — the only `fireEvent` name in the module; the payload is the new `currentIndex`, fired from `goToPrev` / `goToNext` / `goTo`.

State classes the JS actually toggles are bare: `init` on the root, `active` on slides and dot items, `disabled` on the arrows, `dragging` on the body. You style them through the `hs-carousel-active:`, `hs-carousel-disabled:` and `hs-carousel-dragging:` custom variants registered by `@import './src/plugins/carousel/variants.css'` in `assets/css/variants.css`.

## Gotchas

- **`loadingClasses: "opacity-0"` is why a broken carousel is invisible rather than merely static.** `.hs-carousel-body` ships with `opacity-0` in the markup, and the class is removed inside a `setTimeout(..., 400)` at the end of `init()`. If Preline never runs — bad import, `--prevent-on-load-init`, a JSON parse error earlier on the page — you get an empty box, not unstyled slides. Also budget for that deliberate ~400 ms reveal.
- **A malformed `data-hs-carousel` JSON kills every later carousel on the page.** The constructor does a bare `JSON.parse(attr)`; the throw propagates out of `autoInit()`'s `forEach`, so carousels after the bad one never initialise. Keep the attribute single-quoted in HTML with double-quoted JSON inside.
- **`destroy()` dereferences `this.prev`, `this.next`, `this.container` and `this.dots` unconditionally.** Read the source: it calls `this.prev.classList.remove("disabled")` and evaluates `this.dots.querySelectorAll(":scope > *")`. Calling `destroy()` on `basic-usage.html` — which has arrows but **no** `.hs-carousel-pagination` — throws a TypeError. Only destroy carousels shaped like `destroy-and-reinitialize.html` (arrows + pagination).
- **`destroy()` also wipes the pagination node** (`this.dots.innerHTML = null`). For the dots variant that is correct (the JS built them). For the thumbnails variants your hand-authored `.hs-carousel-pagination-item` tiles are your markup and they are destroyed too — destroy → `autoInit()` is not round-trippable there.
- **Dots vs thumbnails are mutually exclusive contracts.** Dots mode: leave `.hs-carousel-pagination` **empty** and pass `dotsItemClasses`. Thumbnails mode: pre-write the `.hs-carousel-pagination-item` children and pass **no** `dotsItemClasses`. Doing both leaves you with generated dots on top of your tiles.
- **`isDraggable` is ignored when `isSnap` is on** — `init()` guards it as `this.isDraggable && !this.isSnap && this.initDragHandling()`. Snap mode gets its native scroll instead.
- **Snap mode injects sibling elements into `.hs-carousel-body`.** With `isSnap` and the default `hasSnapSpacers: true` you get `.hs-snap-before` / `.hs-snap-after`, so never index body children positionally to find slide N — query `.hs-carousel-slide`.
- **When the body is absolutely positioned, something must carry an explicit height — and it is not always `.hs-carousel`.** Ten of the fourteen examples put `min-h-96` on `.hs-carousel` (`relative w-full min-h-96 overflow-hidden`). The exceptions: `snap-point.html` has a non-absolute body and carries `min-h-96` on `.hs-carousel-body`; `thumbnails-vertical.html` puts it on the inner `sm:order-2 relative grow overflow-hidden min-h-96 rounded-lg` wrapper because its `.hs-carousel` is the `flex flex-col sm:flex-row gap-2` rail container; `auto-height.html` has no `min-h-96` at all — it drops the `absolute top-0 bottom-0` too and switches the transition to `transition-[height,transform]`. Copy whichever whole, do not mix halves.
- **The two thumbnail examples disagree on the active-border token**: horizontal uses `hs-carousel-active:border-primary-active` (`gray-900` / `neutral-300`), vertical uses `hs-carousel-active:border-primary` (`gray-800` / `white`). Pick one for your app; in dark mode they are visibly different.
- **`getInstance(el)` returns the instance; `getInstance(el, true)` returns the collection record.** The demo destructures the record: `const {element} = HSCarousel.getInstance(carousel, true); element.destroy();`. (`HSRemoveElement.getInstance` inverts this — see `components/badge.md`.)
- **`inset-s-*` / `inset-e-*` appear throughout these files** (`inset-s-0` on the body, `inset-s-2`/`inset-e-2` on the arrows) and are defined in no file under `assets/css/`; Tailwind v4 core spells the logical insets `start-*` / `end-*`. Confirm they compile, or the arrows collapse to the container's left edge.

## Copy-paste base

`examples/base-components/carousel/basic-usage.html`

```html
<!-- Carousel -->
<div id="hs-carousel" class="relative" data-hs-carousel='{"loadingClasses": "opacity-0"}' >
  <div class="hs-carousel relative w-full min-h-96 overflow-hidden">
    <!-- Carousel Body -->
    <div class="hs-carousel-body flex flex-nowrap absolute top-0 bottom-0 inset-s-0 transition-transform duration-700 opacity-0">
      <div class="hs-carousel-slide ">
        <div class="flex justify-center h-full bg-surface p-6">
          <span class="self-center text-4xl text-foreground transition duration-700">First slide</span>
        </div>
      </div>
      <div class="hs-carousel-slide ">
        <div class="flex justify-center h-full bg-surface-1 p-6">
          <span class="self-center text-4xl text-foreground transition duration-700">Second slide</span>
        </div>
      </div>
      <div class="hs-carousel-slide ">
        <div class="flex justify-center h-full bg-surface-2 p-6">
          <span class="self-center text-4xl text-foreground transition duration-700">Third slide</span>
        </div>
      </div>
    </div>
    <!-- End Carousel Body -->
  </div>

  <!-- Arrows -->
  <button type="button" class="hs-carousel-prev hs-carousel-disabled:opacity-50 hs-carousel-disabled:cursor-default absolute top-1/2 inset-s-2 inline-flex justify-center items-center size-10 bg-layer text-layer-foreground rounded-full shadow-2xs hover:bg-layer-hover -translate-y-1/2 focus:outline-hidden">
    <span class="text-2xl" aria-hidden="true">
      <svg class="shrink-0 size-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    </span>
    <span class="sr-only">Previous</span>
  </button>
  <button type="button" class="hs-carousel-next hs-carousel-disabled:opacity-50 hs-carousel-disabled:cursor-default absolute top-1/2 inset-e-2 inline-flex justify-center items-center size-10 bg-layer text-layer-foreground rounded-full shadow-2xs hover:bg-layer-hover -translate-y-1/2 focus:outline-hidden">
    <span class="sr-only">Next</span>
    <span class="text-2xl" aria-hidden="true">
      <svg class="shrink-0 size-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
    </span>
  </button>
  <!-- End Arrows -->
</div>
<!-- End Carousel -->
```
