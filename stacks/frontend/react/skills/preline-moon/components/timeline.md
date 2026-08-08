---
component: timeline
label: Timeline
category: base-components
docs: https://preline.co/docs/components/timeline.html
examples: 5
js: none — the collapsable variant borrows HSCollapse
tokens: [muted-foreground-1, line-2, foreground, muted-foreground-2, muted-hover, muted-focus, surface-3, layer, layer-line, layer-foreground, surface, line-3, line-6, primary]
---

# Timeline

A vertical list of dated events where each row draws its own segment of the connecting rail as a CSS pseudo-element.

## When to use
- Chronological activity: audit logs, deploy history, order tracking, project milestones.
- You need a date/time gutter and a per-row marker (dot, avatar, or icon chip).
- **Not** for expand/collapse content sections — use `accordion`.
- **Not** for a plain sequence of records with no time axis — a `ScrollTable` or list is denser and cheaper.
- **Not** for a step-by-step wizard with a current position — use `stepper`.

## Anatomy

```html
<!-- REDUCED SKELETON — every class below appears verbatim in the example files -->
<div class="w-full">
  <!-- date group heading -->
  <div class="ps-2 my-2 first:mt-0">
    <h3 class="text-xs font-medium uppercase text-muted-foreground-1">1 Aug, 2023</h3>
  </div>

  <div class="flex gap-x-3">                          <!-- ITEM: 2 (or 3) columns -->

    <!-- OPTIONAL time column, `with-time` only -->
    <div class="min-w-14 text-end">
      <span class="text-xs text-muted-foreground-1">12:05PM</span>
    </div>

    <!-- MARKER column: the ::after IS the vertical rail -->
    <div class="relative last:after:hidden after:absolute after:top-7 after:bottom-0
                after:inset-s-3.5 after:-translate-x-[0.5px] after:border-s after:border-line-2">
      <div class="relative z-10 size-7 flex justify-center items-center">
        <div class="size-2 rounded-full bg-surface-3"></div>   <!-- dot | img | initials span -->
      </div>
    </div>

    <!-- CONTENT column: pb-8 is what gives the rail its length -->
    <div class="grow pt-0.5 pb-8">
      <h3 class="flex gap-x-1.5 font-medium text-foreground">Title</h3>
      <p class="mt-1 text-sm text-muted-foreground-2">Description</p>
    </div>
  </div>
</div>
```

Geometry is coupled: `size-7` (1.75rem) marker box → rail starts at `after:top-7` (below the box) and sits at `after:inset-s-3.5` (0.875rem = half of 1.75rem, i.e. centred). Change the marker size and you must change both.

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| `basic-usage` | Default timeline | `examples/base-components/timeline/basic-usage.html` | Baseline. `size-2 rounded-full bg-surface-3` dot; date headings split the list; author chip is a `<button>` with `hover:bg-muted-hover`. |
| `collapsable` | Collapsible timeline | `examples/base-components/timeline/collapsable.html` | Older items wrapped in `div#hs-timeline-collapse.hs-collapse.hidden`; trailing `button.hs-collapse-toggle.hs-collapse-open:hidden` with `data-hs-collapse="#hs-timeline-collapse"`, styled `text-primary`. |
| `hoverable-rows` | Hoverable rows | `examples/base-components/timeline/hoverable-rows.html` | Row becomes `relative group rounded-lg hover:bg-surface` + stretched `<a class="z-1 absolute inset-0">`; dot becomes hollow: `bg-layer border-2 border-line-3 group-hover:border-line-6`. |
| `with-time` | Side timestamps | `examples/base-components/timeline/with-time.html` | Adds a third leading column `div.min-w-14.text-end` with `text-xs text-muted-foreground-1`. Date headings dropped. |
| `icons-and-avatars` | Timeline with icons and avatars | `examples/base-components/timeline/icons-and-avatars.html` | Marker fills the whole `size-7` box: `img.size-7.rounded-full`, or `span.size-7.bg-layer.border-layer-line.text-layer-foreground.rounded-full` holding initials or an SVG. |

The docs page also lists a `types` / "Timeline variations" section; it has no standalone example file in this mine.

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `muted-foreground-1` | Date heading, side timestamp, author-chip label | `gray-600` | `neutral-400` |
| `line-2` (`after:border-line-2`) | The vertical connector rail | `gray-200` | `neutral-700` |
| `foreground` | Item title `<h3>` | `gray-800` | `neutral-200` |
| `muted-foreground-2` | Item description paragraph | `gray-700` | `neutral-300` |
| `surface-3` | Default solid dot fill | `gray-400` | `neutral-600` |
| `muted-hover` | Author-chip hover fill | `gray-100` | `neutral-700` |
| `muted-focus` | Author-chip focus fill | `gray-100` | `neutral-700` |
| `layer` | Initials/icon chip fill; hollow-dot fill in `hoverable-rows` | `white` | `neutral-800` |
| `layer-line` | Initials/icon chip border | `gray-200` | `neutral-700` |
| `layer-foreground` | Initials letter / chip icon | `gray-800` | `white` |
| `surface` | Row hover fill (`hoverable-rows` only) | `gray-100` | `neutral-700` |
| `line-3` | Hollow-dot ring, resting (`hoverable-rows`) | `gray-300` | `neutral-600` |
| `line-6` | Hollow-dot ring, `group-hover` (`hoverable-rows`) | `gray-600` | `neutral-300` |
| `primary` | "Show older" toggle text (`collapsable`) | `gray-800` | `white` |

## Behaviour (JS)
Static markup only for four of the five variants — **except `collapsable`**, which is plain Timeline markup driven by `HSCollapse` (`assets/js/preline/collapse.js`).

- `data-hs-collapse="#hs-timeline-collapse"` on the toggle → `document.querySelector` → the wrapped block.
- Auto-init fires once on `window` `load`, scanning `.hs-collapse-toggle:not(.--prevent-on-load-init)`.
- On open, `HSCollapse` adds `open` to the toggle **and** the content, removes `hidden`, and animates inline `height` from `0` to `scrollHeight`.
- Full API, events and re-init rules: see `components/collapse.md`.

## Gotchas
- **`last:after:hidden` is dead code as shipped.** `last:` compiles to `&:last-child`, but the marker column is *never* the last child of `div.flex.gap-x-3` — the content column always follows it (and in `with-time` / `hoverable-rows` the marker is not even the first child: a `div.min-w-14.text-end` resp. the stretched `<a>` precedes it). The rail is therefore drawn on **every** item, including the final one, dangling for the full height of that row's `pb-8`. To terminate it, drop `pb-8` on the last item's content column or add a literal `after:hidden`.
- **The stretched link in `hoverable-rows` eats the nested button.** `<a class="z-1 absolute inset-0">` covers the row; only the marker's inner `div.relative.z-10` is lifted above it. The author `<button>` in the content column has no stacking context, so it is unclickable. Give any nested interactive element `relative z-10` — or don't nest one inside a stretched-link row.
- **The rail comes from `pb-8`, not from the list.** Each row's rail spans `after:top-7` → `after:bottom-0` of that row only. Remove `pb-8` and the segments stop meeting; rows of different heights produce a continuous line anyway because each segment runs to its own bottom edge.
- **Everything is logical-property based** — `ps-2`, `-ms-1`, `-ms-px`, `after:inset-s-3.5`, `after:border-s`, `text-end`. The whole component mirrors correctly under `dir="rtl"`. Do not "fix" these to `pl-*` / `left-*` / `border-l`.
- **Marker contrast inverts under moon.** The dot (`surface-3`) is *darker* than the rail (`line-2`) in light (`gray-400` vs `gray-200`) but *lighter* than it in dark (`neutral-600` vs `neutral-700`). If you swap the dot for a custom colour, check both modes.
- **The `collapsable` toggle is one-way.** It carries `hs-collapse-open:hidden`, so "Show older" removes itself on open and there is no way back. For a reversible control use the two-span pattern from `examples/base-components/collapse/show-hide.html`.
- `aria-expanded="false"` on the collapse toggle is load-bearing: `HSCollapse` only maintains the attribute when it already exists on the element.

## Copy-paste base

Verbatim from `examples/base-components/timeline/basic-usage.html` — lines 1–2 (wrapper) + lines 91–121 (second date heading 91–97, the shortest complete item 98–119, close 120–121). Byte-identical to those ranges.

```html
<!-- Timeline -->
<div class="w-full">
  <!-- Heading -->
  <div class="ps-2 my-2 first:mt-0">
    <h3 class="text-xs font-medium uppercase text-muted-foreground-1">
      31 Jul, 2023
    </h3>
  </div>
  <!-- End Heading -->
  <!-- Item -->
  <div class="flex gap-x-3 ">
    <!-- Icon -->
    <div class="relative last:after:hidden after:absolute after:top-7 after:bottom-0 after:inset-s-3.5 after:-translate-x-[0.5px] after:border-s after:border-line-2">
      <div class="relative z-10 size-7 flex justify-center items-center">
        <div class="size-2 rounded-full bg-surface-3"></div>
      </div>
    </div>
    <!-- End Icon -->

    <!-- Right Content -->
    <div class="grow pt-0.5 pb-8">
      <h3 class="flex gap-x-1.5 font-medium text-foreground">
        Take a break ⛳️
      </h3>
      <p class="mt-1 text-sm text-muted-foreground-2">
        Just chill for now... 😉
      </p>
    </div>
    <!-- End Right Content -->
  </div>
  <!-- End Item -->
</div>
<!-- End Timeline -->
```
