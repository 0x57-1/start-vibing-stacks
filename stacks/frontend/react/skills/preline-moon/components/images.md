---
component: images
label: Images
category: layout-and-content
docs: https://preline.co/docs/components/images.html
examples: 19
js: none
tokens: [layer, layer-foreground, foreground-inverse]
---

# Images

Raw Tailwind utility recipes for sizing an `<img>`, fitting a CSS background, and layering a caption or hover-zoom over a photo — no Preline component class, no runtime.

## When to use
- Any `<img>` or `background-image` that needs `object-fit`, `bg-size`, or an aspect box.
- Photo cards with a caption plate or hover zoom (last two examples).
- **Not** for avatars — use `avatar` (it owns the ring/status-dot/fallback-initials markup).
- **Not** for a click-through content tile with title + body + footer — use `card` (`examples/base-components/card/image-overlays.html` is the maintained version of the overlay pattern here).

## Anatomy

Reduced skeleton (composed from `masonry-example-with-overlay.html` + `zoom.html`; every class below appears in those files):

```html
<a class="group relative block rounded-xl overflow-hidden focus:outline-hidden" href="#">
  <!-- aspect box: clips the scaled image so zoom never pushes layout -->
  <div class="aspect-[12/7] sm:aspect-auto rounded-xl overflow-hidden">
    <!-- group-hover/group-focus drive the zoom; object-cover fills the box -->
    <img class="group-hover:scale-105 group-focus:scale-105 transition-transform duration-500 ease-in-out rounded-xl w-full h-full sm:h-auto object-cover" src="..." alt="...">
  </div>
  <!-- caption plate: the ONLY themed layer -->
  <div class="absolute bottom-0 inset-s-0 inset-e-0 p-2">
    <div class="font-semibold bg-layer text-layer-foreground rounded-lg p-3">Caption</div>
  </div>
</a>
```

Three independent parts: `group` + `overflow-hidden` (clip), `object-*`/`bg-*` (fit), `bg-layer`/`text-*-inverse` (the themed overlay).

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| images-are-block-level | Images are block-level | `examples/layout-and-content/images/images-are-block-level.html` | Bare `<img>` — no classes at all; the browser default |
| images-are-block-level-second | Images are block-level | `examples/layout-and-content/images/images-are-block-level-second.html` | `inline` — opts back out of Preline's block-level image reset |
| image-thumbnails | Image thumbnails | `examples/layout-and-content/images/image-thumbnails.html` | `w-56 h-auto` — fixed width, intrinsic ratio preserved |
| fixed | Fixed | `examples/layout-and-content/images/fixed.html` | `bg-fixed` — background stays put while the page scrolls (parallax) |
| local | Local | `examples/layout-and-content/images/local.html` | `bg-local` — background scrolls with the element's own content |
| scroll | Scroll | `examples/layout-and-content/images/scroll.html` | `bg-scroll` — background scrolls with the page, not the content |
| setting-the-background-position | Setting the background position | `examples/layout-and-content/images/setting-the-background-position.html` | 9 divs, one per anchor — `bg-top-left` `bg-top` `bg-top-right` `bg-left` `bg-center` `bg-right` `bg-bottom-left` `bg-bottom` `bg-bottom-right` — each paired with `bg-no-repeat` |
| auto | Auto | `examples/layout-and-content/images/auto.html` | `bg-auto` — intrinsic size, plus `bg-no-repeat bg-center` |
| cover | Cover | `examples/layout-and-content/images/cover.html` | `bg-cover` — fills the box, crops overflow |
| contain | Contain | `examples/layout-and-content/images/contain.html` | `bg-contain` — whole image visible, letterboxed |
| fullscreen | Fullscreen | `examples/layout-and-content/images/fullscreen.html` | `h-screen bg-cover bg-center` — viewport-height hero |
| resizing-to-cover-a-container | Resizing to cover a container | `examples/layout-and-content/images/resizing-to-cover-a-container.html` | `object-cover h-48 w-96` on the `<img>` |
| containing-an-element | Containing an element | `examples/layout-and-content/images/containing-an-element.html` | `object-contain` — fits inside, no crop |
| stretching-to-fit-a-container | Stretching to fit a container | `examples/layout-and-content/images/stretching-to-fit-a-container.html` | `object-fill` — ignores aspect ratio, distorts |
| scaling-down-if-too-large | Scaling down if too large | `examples/layout-and-content/images/scaling-down-if-too-large.html` | `object-scale-down` — `contain` only when oversized, else `none` |
| using-an-elements-original-size | Using an element's original size | `examples/layout-and-content/images/using-an-elements-original-size.html` | `object-none` — intrinsic size, cropped by the box |
| zoom | Zoom | `examples/layout-and-content/images/zoom.html` | `group` + `group-hover:scale-110 group-focus:scale-110` inside `overflow-hidden`; image is `absolute` |
| overlay-image | Overlay image | `examples/layout-and-content/images/overlay-image.html` | Arbitrary-value `bg-[url('…')]` on the `<a>` itself; the two text layers move in **opposite** directions on `group-hover` — heading `text-foreground-inverse/90 group-hover:text-foreground-inverse` (fades in), CTA `text-foreground-inverse group-hover:text-foreground-inverse/70` (fades out) |
| masonry-example-with-overlay | Masonry example with overlay | `examples/layout-and-content/images/masonry-example-with-overlay.html` | 5 cards on `grid sm:grid-cols-12` with `sm:self-end` + `lg:col-start-3`; each card = aspect box + `bg-layer` caption plate |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` (`bg-layer`) | Caption plate sitting on top of the photo — the resting surface | `white` | `neutral-800` |
| `layer-foreground` (`text-layer-foreground`) | Caption text on that plate | `gray-800` | `white` |
| `foreground-inverse` (`text-foreground-inverse`) | Text drawn *directly* on the photo, no plate behind it | `white` | `white` |

## Behaviour (JS)

Static markup only -- no Preline JS. Zoom and overlay reveal are pure CSS (`group-hover:` / `group-focus:` + `transition-transform`).

## Gotchas

- **`inset-s-*` / `inset-e-*` are dead classes in this project.** 875 occurrences across 273 of the 822 example files, plus 10 more inside 5 `assets/js/preline/*.js` templates — but **nothing** defines them: not this skill's `assets/css/` (`project-moon.css`, `project-theme.css`, `variants.css`, `themes/*.css`), and not the live project (`resources/css/app.css`, `resources/css/themes/theme.css`, `node_modules/preline/variants.css`). In `masonry-example-with-overlay.html` the caption is `absolute bottom-0 inset-s-0 inset-e-0` → it collapses to `absolute bottom-0`, so the plate shrink-wraps its text in the bottom-left instead of spanning the card. Replace with `start-0 end-0` (Tailwind v4 logical insets) or `left-0 right-0`.
- **`foreground-inverse` is `white` in BOTH modes** (moon does not override it). It is for text over a dark photograph, *never* for text on `bg-layer` — under light moon that would be white-on-white. `overlay-image.html` is safe only because its background is a photo.
- **`bg-layer` inverts, the photo does not.** The masonry caption plate is white in light mode and `neutral-800` in dark. If the photo is dark, the light-mode plate has high contrast and the dark-mode plate nearly disappears into it. Consider a fixed plate (`bg-black/60` + `text-foreground-inverse`) when the image is the constant.
- **The `object-*` examples wrap in `bg-white`, raw Tailwind, no `dark:` variant.** `containing-an-element.html`, `resizing-to-cover-a-container.html`, `stretching-to-fit-a-container.html`, `scaling-down-if-too-large.html`, `using-an-elements-original-size.html` all render a white letterbox in dark mode. Swap for `bg-layer` (`white` / `neutral-800`).
- **`overflow-hidden` on the aspect box is load-bearing for zoom.** Without it `scale-105`/`scale-110` overflows the card and overlaps siblings — the grid does not clip for you.
- **`focus:outline-hidden` on the card `<a>` kills the keyboard ring.** `group-focus:scale-105` is the only remaining focus affordance; do not drop it while keeping `focus:outline-hidden`.
- **Literal `...` in most files is doc placeholder text, not markup.** 16 of the 19 examples contain it (`class="bg-cover bg-center ..."`, `src="..."`, `alt="..."`); 8 of those also ship `style="background-image: url(...)"` with no real URL. Only `zoom.html`, `overlay-image.html` and `masonry-example-with-overlay.html` are complete and copy-runnable.
- **`bg-[url('…')]` (overlay-image) is an arbitrary value**, so the URL must be statically present in a `@source`-scanned file. A runtime-computed image URL must go through `style="background-image: …"` instead — Tailwind cannot generate a class it never saw.

## Copy-paste base

`examples/layout-and-content/images/zoom.html`

```html
<div class="group shrink-0 relative rounded-xl overflow-hidden w-56 sm:w-96 h-44 mx-auto">
  <img class="transition-transform duration-500 ease-in-out group-hover:scale-110 group-focus:scale-110 size-full absolute top-0 inset-s-0 object-cover rounded-xl" src="https://images.unsplash.com/photo-1633114128174-2f8aa49759b0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1024&h=1280&q=80" alt="Image Description">
</div>
```

Fix before shipping: `inset-s-0` → `start-0`.
