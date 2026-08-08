---
component: lists
label: Lists
category: base-components
docs: https://preline.co/docs/components/lists.html
examples: 5
js: none
tokens: [foreground, primary, primary-foreground, muted-foreground-1, muted-foreground-2, primary-50, primary-600, primary-500, primary-400, surface-2, surface-4, muted, plain, secondary, secondary-foreground, foreground-inverse, inverse]
---

# Lists

Ordered / unordered text lists, plus two non-`list-style` patterns: an inline dot-separated row and a check-marked feature list.

## When to use
- Prose bullets and numbered steps (`basic-usage`, `list-marker`).
- Feature / inclusion lists on pricing and marketing blocks (`checked-style`) — a check glyph reads as "you get this" in a way a bullet does not.
- Footer link rows and metadata trails (`separator`).
- Not for rows with actions, avatars, badges or two-line content — that is a `list-group` / table, not this. Nothing here handles hover, selection or dividers between full-width rows.

## Anatomy

Reduced skeleton of the two distinct shapes (classes verbatim from `basic-usage.html` and `checked-style.html`):

```html
<!-- Shape A: real list-style. The marker is CSS, styled via marker: -->
<ul class="list-disc list-inside text-foreground">
  <li>…</li>
</ul>

<!-- Shape B: no list-style at all. Each row is a flex pair, icon + text. -->
<ul class="space-y-3 text-sm">
  <li class="flex gap-x-3">
    <!-- bare glyph: size-4 mt-0.5 to optically centre against the first text line -->
    <svg class="shrink-0 size-4 mt-0.5 text-primary" …><polyline points="20 6 9 17 4 12"/></svg>
    <!-- OR a chip: size-5 circle wrapping a size-3.5 glyph -->
    <span class="size-5 flex justify-center items-center rounded-full bg-primary text-primary-foreground">
      <svg class="shrink-0 size-3.5" …><polyline points="20 6 9 17 4 12"/></svg>
    </span>
    <span class="text-foreground">FAQ</span>
  </li>
</ul>
```

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| `basic-usage` | List style types | `examples/base-components/lists/basic-usage.html` | Three blocks showing `list-disc`, `list-decimal` (on an `<ol>`) and `list-none`, each with `list-inside text-foreground`. The `font-mono` caption above each is `text-sm text-muted-foreground-1`. (The docs' "Basic usage" section has no example file of its own.) |
| `list-marker` | Styled markers | `examples/base-components/lists/list-marker.html` | Colours the CSS marker: `marker:text-primary list-disc ps-5 space-y-2 text-sm text-muted-foreground-2`. Note `ps-5` **instead of** `list-inside` — the marker hangs outside the text block. Smallest file (183 B). |
| `separator` | Inline separator list | `examples/base-components/lists/separator.html` | No markers. Each `<li>` is `inline-block relative pe-8 last:pe-0 last-of-type:before:hidden` with a pseudo-element dot: `before:absolute before:top-1/2 before:inset-e-3 before:-translate-y-1/2 before:size-1 before:bg-surface-2 before:rounded-full`. |
| `checked-style` | Checked list | `examples/base-components/lists/checked-style.html` | Three check treatments at `primary`: bare icon (`text-primary`), soft chip (`bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400`), solid chip (`bg-primary text-primary-foreground`). |
| `list-checked-color-variations` | Checked list color variants | `examples/base-components/lists/list-checked-color-variations.html` | The same three treatments × 7 colours (dark, gray, green, blue, red, yellow, light). Green/red/yellow are raw palette (`teal-500`, `red-500`, `yellow-500` + `dark:` halves); dark/gray/blue/light use tokens (`foreground`, `muted`/`surface-4`, `primary*`, `plain`/`inverse`/`foreground-inverse`). Largest file (9.4 KB). |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `foreground` | List item text; "dark" check glyph and chip label | `gray-800` | `neutral-200` |
| `muted-foreground-1` | `font-mono` captions in `basic-usage`; the "gray" check glyph | `gray-600` | `neutral-400` |
| `muted-foreground-2` | Body text of `list-marker` and `separator` | `gray-700` | `neutral-300` |
| `primary` | `marker:text-primary`; blue check glyph; solid check-chip fill | `gray-800` | `white` |
| `primary-foreground` | Label on the solid `bg-primary` chip | `white` | `neutral-800` |
| `primary-50` | Soft chip fill, light mode only (`dark:` overrides it) | `gray-50` | `zinc-50` |
| `primary-600` | Soft chip glyph, light mode | `gray-600` | `neutral-600` |
| `primary-500` | Soft chip fill in dark (`dark:bg-primary-500/20`) | `gray-500` | `neutral-500` |
| `primary-400` | Soft chip glyph in dark (`dark:text-primary-400`) | `gray-400` | `neutral-400` |
| `surface-2` | The separator dot (`before:bg-surface-2`) | `gray-300` | `neutral-500` |
| `surface-4` | Solid "gray" chip fill | `gray-500` | `neutral-500` |
| `muted` | Soft "dark" / "gray" chip fill (`bg-muted`) | `gray-50` | `neutral-800` |
| `plain` | "Light" chip fill — `bg-plain/10` soft, `bg-plain` solid | `white` | `neutral-800` |
| `inverse` | Glyph on the solid `bg-plain` chip | `gray-800` | `neutral-950` |
| `secondary` / `secondary-foreground` | Solid "dark" chip fill / glyph | `gray-900` / `white` | `white` / `neutral-800` |
| `foreground-inverse` | "Light" check glyph and the glyph on coloured solid chips | `white` | `white` |

## Behaviour (JS)

Static markup only -- no Preline JS.

## Gotchas
- **`marker:` needs a marker to exist.** `marker:text-primary` is inert under `list-none`, and applies to the number under `list-decimal`. It also cannot colour the flex/check lists — those have no CSS marker at all, the glyph is an `<svg>`.
- **`list-inside` and `ps-5` are alternatives, not partners.** `basic-usage` uses `list-inside` (marker joins the text flow, wrapped lines start under the marker); `list-marker` uses `ps-5` with no `list-inside` (marker hangs in the padding, wrapped lines align). Mixing the two conventions in one page misaligns every wrapped bullet.
- **`inset-e-3` in `separator.html` is a logical-inset utility that is not in this skill's CSS.** Nothing under `assets/css/` defines it (`grep -r inset-e assets/css/` → 0); stock Tailwind v4 spells it `end-3`. It appears in 58 of the 822 example HTML files (147 use some `inset-e-*`), so it presumably ships with Preline's plugin — verify it actually compiles in your build before trusting the dot placement, otherwise the separator lands at `inset: 0` and stretches.
- **`last-of-type:before:hidden` and `last:pe-0` are two different jobs**: the first removes the trailing dot, the second removes the trailing gap. Drop either and the row ends with a stray dot or a dangling 2rem of padding. `last-of-type` also behaves differently from `last` if you interleave non-`<li>` nodes.
- **The soft chip's `dark:` half is mandatory under moon.** `primary-50` resolves to `zinc-50` in dark — near white. Without `dark:bg-primary-500/20 dark:text-primary-400` you get a white chip with a `neutral-600` glyph on a dark page. This is the one place the moon `primary-*` ramp changes families (`zinc-50` at step 50, `neutral-*` at 400/500/600).
- **moon inverts the solid chip.** `bg-primary text-primary-foreground` is a dark chip with a white check in light mode and a **white chip with a dark check** in dark mode. Hardcoding `text-white` on the glyph makes it vanish in dark.
- **`foreground-inverse` is `white` in BOTH modes.** The "Light" row of `list-checked-color-variations` (`text-foreground-inverse` on a bare glyph) is invisible on a light page — that variant only makes sense on a dark surface. Same for `bg-plain/10` (white at 10%).
- **`list-none` and the check lists strip list semantics in Safari/VoiceOver** (`list-style: none` drops the `list` role). Add `role="list"` to the `<ul>` if the grouping matters to screen readers — none of the five examples does.
- **The check `<svg>` is inlined per item** — 266 B for the bare `size-4` glyph, 248 B for the `size-3.5` one inside a chip. A 12-item pricing list ships ~3 KB of duplicated path data; extract it to a React/Blade partial rather than copying the file wholesale.
- **`mt-0.5` on the bare glyph vs none on the chip** — the `size-4` icon needs the nudge to sit on the text baseline, the `size-5` chip does not. Copying `mt-0.5` onto the chip pushes it off.

## Copy-paste base

Verbatim from `examples/base-components/lists/list-marker.html` (smallest correct example — a coloured-marker bullet list):

```html
<ul class="marker:text-primary list-disc ps-5 space-y-2 text-sm text-muted-foreground-2">
  <li>
    FAQ
  </li>
  <li>
    License
  </li>
  <li>
    Terms & Conditions
  </li>
</ul>
```

The check-list row, verbatim from `examples/base-components/lists/checked-style.html`:

```html
<ul class="space-y-3 text-sm">
  <li class="flex gap-x-3">
    <svg class="shrink-0 size-4 mt-0.5 text-primary" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    <span class="text-foreground">
      FAQ
    </span>
  </li>
</ul>
```
