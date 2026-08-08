---
component: skeleton
label: Skeleton
category: base-components
docs: https://preline.co/docs/components/skeleton.html
examples: 3
js: none
tokens: [surface-1]
---

# Skeleton

Grey placeholder bars that occupy the shape of not-yet-loaded content, so the page does not reflow when data arrives.

## When to use
- First paint of any page that fetches via `api.get()` — render the skeleton in the same DOM shape as the loaded content.
- Prefer over a centred spinner whenever the final layout is known in advance; use `spinners` only for indeterminate work with no predictable shape (a submit button, a modal action).
- Do NOT use for an empty result set — that is `EmptyState`. A skeleton that never resolves reads as a broken page.
- Do NOT use for a determinate long job — that is `progress`.

## Anatomy

Reduced skeleton (every class below appears verbatim in the example files):

```html
<!-- REDUCED SKELETON - not copy-paste, see "Copy-paste base" -->
<div class="flex animate-pulse">            <!-- animation lives on the WRAPPER -->
  <div class="shrink-0">
    <span class="size-12 block bg-surface-1 rounded-full"></span>   <!-- avatar; block is required -->
  </div>
  <div class="ms-4 mt-2 w-full">
    <p class="h-4 bg-surface-1 rounded-full" style="width: 40%;"></p>  <!-- title bar, inline width -->
    <ul class="mt-5 space-y-3">
      <li class="w-full h-4 bg-surface-1 rounded-full"></li>           <!-- body lines -->
    </ul>
  </div>
</div>
```

Every painted surface is `bg-surface-1`. There is no `dark:` utility anywhere in this component — the token carries both themes.

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| `example` | Default skeleton | `examples/base-components/skeleton/example.html` | Text block only: one 40%-wide title bar plus a `<ul>` of four full-width `h-4` lines. No wrapper element, so nothing to hang an animation on. |
| `complex-combination` | Combined layout | `examples/base-components/skeleton/complex-combination.html` | Adds a `flex` wrapper, a `shrink-0` column and a `size-12` circular avatar; the text block moves into `ms-4 mt-2 w-full`. Static (no pulse). |
| `active-animation` | Animated skeleton | `examples/base-components/skeleton/active-animation.html` | Byte-identical to `complex-combination` except `class="flex "` becomes `class="flex animate-pulse"`. That single class is the whole animation. |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `surface-1` | Fill of every placeholder bar, line and avatar circle (`bg-surface-1`, 17 occurrences across the 3 files — the only token used) | `gray-200` | `neutral-600` |

## Behaviour (JS)
Static markup only -- no Preline JS. `index.json` reports `hs_attrs: []` and `hs_js: []`; the pulse is the Tailwind `animate-pulse` keyframe, nothing else.

## Gotchas
- **`animate-pulse` belongs on the wrapper, never on the bars.** It animates `opacity` and children inherit the effect. `example.html` ships with two root-level siblings (`<p>` + `<ul>`) and *no* wrapper, so pasting it gives you a permanently static skeleton — add a `<div class="animate-pulse">` around it yourself.
- **moon inverts the contrast direction.** `surface-1` is `gray-200` — darker than the white `background` — in light, but `neutral-600` in dark, which is *lighter* than both `background` (`neutral-900`) and `card` (`neutral-800`). Hand-rolling the dark half misses the step, not the side: `dark:bg-gray-700` is `oklch(37.3%)` over a `neutral-800` card at `26.9%`, where the token lands at `43.9%` — same direction, barely visible. Use the token.
- **The 40% title bar is an inline `style="width: 40%;"`, not a utility.** Under a CSP without `style-src 'unsafe-inline'` the attribute is dropped and the bar renders full width, silently breaking the shape. Replace with `w-2/5` when the page is CSP-locked.
- **`block` on the avatar `<span>` is load-bearing.** `<span>` is inline by default and would ignore `size-12`; the circle collapses to zero width without it.
- **`rounded-full` on an `h-4` element is a pill, not a circle.** Only the `size-12` square becomes a circle. Do not "fix" this to `rounded-md` — the pill shape is what distinguishes the placeholder from real content.
- **Empty `<p>`/`<li>` are announced.** The `<ul>` reports "list, 4 items" with no content, and the examples ship zero ARIA. Put `aria-hidden="true"` on the wrapper and expose loading state through a separate live region.
- **`ms-4` / `space-y-3` are logical/flow utilities** — the avatar gutter mirrors under `dir="rtl"` automatically. Do not swap to `ml-4`.
- Repo rule: the skeleton must mirror the shape of the loaded component. This markup does not derive anything — if the real card has three lines, delete the fourth `<li>`.

## Copy-paste base

`examples/base-components/skeleton/active-animation.html`

```html
<div class="flex animate-pulse">
  <div class="shrink-0">
    <span class="size-12 block bg-surface-1 rounded-full"></span>
  </div>

  <div class="ms-4 mt-2 w-full">
    <p class="h-4 bg-surface-1 rounded-full" style="width: 40%;"></p>

    <ul class="mt-5 space-y-3">
      <li class="w-full h-4 bg-surface-1 rounded-full"></li>
      <li class="w-full h-4 bg-surface-1 rounded-full"></li>
      <li class="w-full h-4 bg-surface-1 rounded-full"></li>
      <li class="w-full h-4 bg-surface-1 rounded-full"></li>
    </ul>
  </div>
</div>
```
