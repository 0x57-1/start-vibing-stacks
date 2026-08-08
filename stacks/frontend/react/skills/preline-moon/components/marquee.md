---
component: marquee
label: Marquee
category: base-components
docs: https://preline.co/docs/components/marquee.html
examples: 3
js: none
tokens: [foreground, card, card-line, muted-foreground-1, muted-foreground-2, background, line-2]
---

# Marquee

A continuously scrolling strip built from a duplicated content set inside an `overflow-hidden` viewport, translated by a hand-authored `@keyframes` — pure CSS, no Preline plugin.

## When to use
- Logo walls, testimonial ribbons, announcement tickers — decorative, non-essential content.
- You want motion without a JS carousel: hover-pause is a single utility, no init, no state.
- **Not** for content users must read or act on — it moves, it never stops for keyboard users, and it is duplicated in the DOM.
- **Not** for a paged/user-driven sequence — use `carousel` (`HSCarousel`).
- Every example requires a `<style>` block you must ship yourself; the keyframes are not in the theme.

## Anatomy

```html
<!-- REDUCED SKELETON — every class below appears verbatim in text-ticker.html / horizontal.html -->
<div class="relative overflow-hidden
            before:pointer-events-none before:absolute before:inset-y-0 before:start-0 before:z-2 before:w-16
            before:bg-[linear-gradient(to_right,var(--color-background),transparent)]
            after:pointer-events-none  after:absolute  after:inset-y-0  after:end-0  after:z-2  after:w-16
            after:bg-[linear-gradient(to_left,var(--color-background),transparent)]">   <!-- edge fades -->

  <div class="flex overflow-hidden">                                <!-- clipping viewport -->
    <div class="marquee-track-x [animation:marquee-x_40s_linear_infinite]
                hover:[animation-play-state:paused] flex w-max gap-4 py-2.5">          <!-- the track -->
      <div class="flex items-center gap-10">…SET…</div>
      <div class="flex items-center gap-10" aria-hidden="true">…SAME SET AGAIN…</div>
    </div>
  </div>
</div>
```

Required alongside it — `examples/base-components/marquee/horizontal.css`, verbatim and complete (`<style>` wrapper included; the file *is* a `<style>` block, and `text-ticker.css` lines 1–27 are byte-identical apart from indentation):

```html
<style>
  @keyframes marquee-x {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(calc(-50% - 0.5rem));
    }
  }

  @keyframes marquee-y {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(calc(-50% - 0.5rem));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .marquee-track-x,
    .marquee-track-y {
      animation-duration: 1ms;
      animation-iteration-count: 1;
    }
  }
</style>
```

`marquee-y` ships in `horizontal.css` and `text-ticker.css` (not in `docs-sliding-logos.css`, which defines its own `marquee`) but **no mined example uses it** — there is no vertical marquee HTML here. It is the keyframe you would pair with a `marquee-track-y` track and `[animation:marquee-y_…]`.

`marquee-track-x` carries **no styling of its own** — it exists solely as the selector for the reduced-motion override. The animation itself is the arbitrary utility `[animation:marquee-x_40s_linear_infinite]`.

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| `text-ticker` | Announcement ticker | `examples/base-components/marquee/text-ticker.html` (+ `.css`) | Single row of `whitespace-nowrap` spans. Bar is `border-y border-line-2 bg-background`; `before:w-16`/`after:w-16` fades; 40s duration; duplicate set is `aria-hidden="true"`. |
| `docs-sliding-logos` | Logo marquee | `examples/base-components/marquee/docs-sliding-logos.html` (+ `.css`) | **Different mechanism**: a named `.animate-marquee` class (`animation: marquee 40s linear infinite` + `:hover { animation-play-state: paused }`) with a hard-coded end state `translateX(calc(-256px * 8))`. 2 × 8 `svg.text-foreground` brand marks in `px-4 w-40 md:w-64 h-12` cells. No reduced-motion rule; duplicate set is **not** `aria-hidden`. |
| `horizontal` | Scrolling cards | `examples/base-components/marquee/horizontal.html` (+ `.css`) | Two stacked rows in a `flex flex-col gap-2` shell; the second track (line 309) adds `[animation-direction:reverse]` to the same `[animation:marquee-x_68s_linear_infinite]`; `before:w-20`/`after:w-20`; track padding is `py-1`. 36 `figure.w-72.shrink-0.border-card-line.bg-card` testimonial cards; the duplicate `div.flex.gap-4` in each row is `aria-hidden="true"` (lines 156, 460). |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `foreground` | Ticker item text; brand SVG `fill="currentColor"`; card author name | `gray-800` | `neutral-200` |
| `background` | Ticker bar fill (`bg-background`) **and** the colour stop inside every edge-fade gradient, via `var(--color-background)` | `white` | `neutral-900` |
| `line-2` | Ticker top/bottom rules (`border-y border-line-2`) | `gray-200` | `neutral-700` |
| `card` | Testimonial card fill (`horizontal`) | `white` | `neutral-800` |
| `card-line` | Testimonial card border (`horizontal`) | `gray-200` | `neutral-700` |
| `muted-foreground-1` | Card handle (`@avam`) | `gray-600` | `neutral-400` |
| `muted-foreground-2` | Card quote body | `gray-700` | `neutral-300` |

`--color-background` → `var(--background)` is defined at `assets/css/project-theme.css:2`, so the gradient stop resolves through to the `background` token.

`data/index.json` credits this component with `primary` (count 2) and twelve `data-hs-*` attributes (`data-hs-select`, `data-hs-tab`, `data-hs-clipboard-options`, …). Every one of them is a scrape artefact of the **docs-page chrome that trails the sidecar `.css` files** — `text-ticker.css` and `docs-sliding-logos.css` each carry 28 `data-hs-` hits and one `text-primary`, all *after* their first `</style>` (see Gotchas). The three example **HTML** files return `0` for both greps, and `horizontal.css` returns `0` as well. Nothing in the real component is themed by `primary` and there is no Preline JS to bind.

## Behaviour (JS)
Static markup only -- no Preline JS. All motion is CSS: an `animation` shorthand on the track, `hover:[animation-play-state:paused]` for pause, `[animation-direction:reverse]` for the counter-scrolling row.

## Gotchas
- **`-0.5rem` in the keyframe is `gap-4` divided by two.** Track width is `2W + gap`; `-50%` travels `-(W + gap/2)` and the extra `-0.5rem` covers the remaining half-gap, landing exactly one set + one gap over — a seamless loop. Change `gap-4` to anything else and you must change the `0.5rem`, or the strip visibly jumps every cycle.
- **`docs-sliding-logos` breaks below `md`.** Its keyframe ends at `translateX(calc(-256px * 8))` = 8 cells × `w-64` (256px), but the cells are `w-40 md:w-64` — at mobile widths one set is 1280px while the animation still travels 2048px, so the loop stutters. Either drop `w-40` or switch that example to the `marquee-x` percentage keyframe used by the other two.
- **Only two of three examples respect `prefers-reduced-motion`.** The rule targets `.marquee-track-x` / `.marquee-track-y`; `docs-sliding-logos` uses `.animate-marquee` and is never matched, so it keeps scrolling for users who asked it not to. Add `.animate-marquee` to that media block.
- **The duplicate set must be `aria-hidden="true"`.** `text-ticker` and `horizontal` do this; `docs-sliding-logos` does **not**, so screen readers announce all eight brands twice.
- **The edge fades assume the marquee sits on `bg-background`.** They are hardcoded `var(--color-background)` gradients on `::before`/`::after`. `text-ticker` also sets `bg-background` on the bar so they match; `horizontal` and `docs-sliding-logos` set no background at all — drop either onto a `bg-surface` or card section and you get a white (light) / `neutral-900` (dark) wedge at each edge. Swap the gradient stop to match the actual backdrop.
- **Pause is pointer-only.** `hover:[animation-play-state:paused]` never fires for keyboard or touch users. If the strip contains links, add `focus-within:[animation-play-state:paused]` — otherwise a focused link keeps sliding out from under the caret.
- **Two `overflow-hidden` layers are both required**: the outer `relative overflow-hidden` clips the fades and rounds the box, the inner `flex overflow-hidden` clips the `w-max` track. Removing the inner one lets the track widen its parent and the page scrolls horizontally.
- **`w-max` on the track is load-bearing** — it makes the track as wide as both sets so `-50%` means "one set". A track that inherits the container width makes the percentage meaningless.
- **Duplicated markup doubles the DOM cost.** `horizontal.html` is 31 KB for 36 `<figure>` cards and `docs-sliding-logos.html` is 75 KB of inline brand SVG paths. Server-render one set and clone it, or accept the payload.
- **The sidecar `.css` files in this mine are truncated docs pages.** Only the block before the first `</style>` is real CSS: `text-ticker.css` lines 1–27, `docs-sliding-logos.css` lines 1–18. Everything after is docs-page scaffolding. `horizontal.css` (27 lines) is clean end to end.

## Copy-paste base

`examples/base-components/marquee/text-ticker.html`, verbatim and complete. Ship it with `examples/base-components/marquee/horizontal.css` (the `marquee-x` keyframes + reduced-motion rule).

```html
<!-- Text ticker -->
<div class="relative overflow-hidden border-y border-line-2 bg-background before:pointer-events-none before:absolute before:inset-y-0 before:start-0 before:z-2 before:w-16 before:bg-[linear-gradient(to_right,var(--color-background),transparent)] after:pointer-events-none after:absolute after:inset-y-0 after:end-0 after:z-2 after:w-16 after:bg-[linear-gradient(to_left,var(--color-background),transparent)]">
  <div class="flex overflow-hidden">
    <div class="marquee-track-x [animation:marquee-x_40s_linear_infinite] hover:[animation-play-state:paused] flex w-max gap-4 py-2.5">
      <div class="flex items-center gap-10 ps-4 text-sm text-foreground">
        <span class="inline-flex items-center gap-2 whitespace-nowrap"><span aria-hidden="true">💬</span> 24/7 support available</span>
        <span class="inline-flex items-center gap-2 whitespace-nowrap"><span aria-hidden="true">🚀</span> Fast shipping on all orders</span>
        <span class="inline-flex items-center gap-2 whitespace-nowrap"><span aria-hidden="true">✨</span> New Tailwind components released weekly</span>
        <span class="inline-flex items-center gap-2 whitespace-nowrap"><span aria-hidden="true">🔥</span> Save 20% on your first order</span>
      </div>
      <div class="flex items-center gap-10 pe-4 text-sm text-foreground" aria-hidden="true">
        <span class="inline-flex items-center gap-2 whitespace-nowrap"><span aria-hidden="true">💬</span> 24/7 support available</span>
        <span class="inline-flex items-center gap-2 whitespace-nowrap"><span aria-hidden="true">🚀</span> Fast shipping on all orders</span>
        <span class="inline-flex items-center gap-2 whitespace-nowrap"><span aria-hidden="true">✨</span> New Tailwind components released weekly</span>
        <span class="inline-flex items-center gap-2 whitespace-nowrap"><span aria-hidden="true">🔥</span> Save 20% on your first order</span>
      </div>
    </div>
  </div>
</div>
<!-- End Text ticker -->
```
