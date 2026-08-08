---
component: typography
label: Typography
category: layout-and-content
docs: https://preline.co/docs/components/typography.html
examples: 7
js: none
tokens: []
---

# Typography

Per-element text utilities — heading scale, inline semantic tags, gradient text, description lists, responsive sizes, first-line/first-letter, and `<details>` open-state styling. No `prose` class, no plugin.

## When to use
- Setting the heading scale on a page (`text-4xl` → `text-base` for `h1` → `h6`).
- Semantic inline markup — `static-2.html` covers all 8, in file order: `<mark> <del> <s> <ins> <u> <small> <strong> <em>`.
- Term/definition pairs — the `<dl>` grid in `static-4.html`.
- **Not** for long-form CMS/markdown output — that wants `@tailwindcss/typography` (`prose`), which **is not installed here** (`resources/css/app.css` loads only `@plugin "@tailwindcss/forms"`). Style it element-by-element or add the plugin first.
- **Not** for a collapsible panel with animation — `static-7.html`'s `<details>` is native; use `accordion` (`HSAccordion`) for a controlled, multi-panel version.

## Anatomy

Reduced skeleton (classes verbatim from `static-1.html` / `static-4.html`):

```html
<!-- heading scale: size utility carries the hierarchy, colour is repeated per element -->
<h1 class="text-4xl text-stone-800 dark:text-neutral-200">h1. Heading</h1>
<h2 class="text-3xl text-stone-800 dark:text-neutral-200">h2. Heading</h2>

<!-- description list = a grid, not a dl-specific layout -->
<dl class="grid sm:grid-cols-3 gap-1 sm:gap-3">
  <dt class="sm:col-span-1 font-semibold text-stone-800 dark:text-neutral-200">Term</dt>
  <dd class="sm:col-span-2 mb-3 sm:mb-0 text-stone-800 dark:text-neutral-200">Definition</dd>
</dl>
```

There is no wrapper and no inherited colour: **every element repeats its own `text-*` colour pair.**

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| static-1 | Headings | `examples/layout-and-content/typography/static-1.html` | `h1…h6` mapped to `text-4xl / 3xl / 2xl / xl / lg / base`, all `text-stone-800 dark:text-neutral-200` |
| static-2 | Inline text elements | `examples/layout-and-content/typography/static-2.html` | `<mark> <del> <s> <ins> <u> <small> <strong> <em>` — browser defaults, only the wrapping `<p>` is coloured |
| static-3 | Gradient text | `examples/layout-and-content/typography/static-3.html` | `bg-clip-text bg-linear-to-tl from-blue-500 to-violet-500 text-transparent` |
| static-4 | Description list alignment | `examples/layout-and-content/typography/static-4.html` | `<dl>` on `grid sm:grid-cols-3`; `sm:col-span-1` term / `sm:col-span-2` definition, `truncate` on one term, one nested `<dl>` at `sm:grid-cols-5` |
| static-5 | Responsive font sizes | `examples/layout-and-content/typography/static-5.html` | `text-sm md:text-base lg:text-lg` — breakpoint-scaled body copy |
| static-6 | First-line and first-letter | `examples/layout-and-content/typography/static-6.html` | `first-line:uppercase first-line:tracking-widest` + drop cap `first-letter:text-7xl first-letter:font-bold first-letter:float-left first-letter:mr-3` |
| static-7 | Open/closed state | `examples/layout-and-content/typography/static-7.html` | Native `<details open>` with `open:` variants — `open:bg-white dark:open:bg-neutral-900 open:ring-1 open:ring-black/5 dark:open:ring-white/10 open:shadow-lg`; `<summary>` gets `select-none` |

## Theme tokens (moon)

_None._ `index.json` records `"tokens": {}` for this component — every example uses raw palette utilities (`stone-800`, `neutral-200`, `neutral-900`, `blue-500`, `violet-500`) instead of semantic tokens. See the first Gotcha for the substitution table.

## Behaviour (JS)

Static markup only -- no Preline JS. `static-7.html` uses the browser's native `<details>` disclosure; the `open:` variant targets the `[open]` attribute the browser toggles.

## Gotchas

- **These examples bypass the theme.** Every one uses `text-stone-800 dark:text-neutral-200`, while moon's body-text token is `foreground` = `gray-800` (light) / `neutral-200` (dark). The dark value matches; the **light value does not** — `stone-800` is a warm grey, `gray-800` is cool. Mixing typography examples with tokenised components puts two greys on the same page. Substitute:

  | Doc class pair | Token replacement | Light | Dark |
  |---|---|---|---|
  | `text-stone-800 dark:text-neutral-200` | `text-foreground` | `gray-800` | `neutral-200` |
  | `text-stone-600 dark:text-neutral-400` | `text-muted-foreground-1` | `gray-600` | `neutral-400` |
  | `open:bg-white dark:open:bg-neutral-900` | `open:bg-layer` | `white` | `neutral-800` |

  Note the last row is **not** byte-identical in dark: `layer` is `neutral-800`, the doc uses `neutral-900`.
- **`dark:` here means the `.dark` class, not the OS setting.** `resources/css/app.css` declares `@custom-variant dark (&:where(.dark, .dark *))`. Nothing renders dark until an ancestor carries `.dark` — testing with the OS toggle alone will show light output and look like the variant is broken.
- **`static-6.html` has no dark variant on the drop cap.** `first-letter:text-stone-900` is unconditional, so on a dark background the first letter is near-black on near-black — a 7xl invisible glyph. Add `dark:first-letter:text-neutral-200` (or use `first-letter:text-foreground`).
- **`<mark>` is the one inline tag the `<p>` colour never reaches.** In `static-2.html` every colour lives on the wrapping `<p>` and the inline tags inherit it — except `<mark>`, whose `color` *and* `background-color` the UA stylesheet sets on the element itself, and Tailwind v4's preflight ships no `mark` rule to clear them (verified: `node_modules/tailwindcss/preflight.css` has no `mark` selector). So `<mark>` stays dark-on-yellow in both modes no matter what `text-stone-800 dark:text-neutral-200` says on the parent — a light-mode highlight stranded on a dark surface. If it must follow the theme, set both halves on the `<mark>` itself (`bg-*` + `text-*`); overriding only one leaves the UA's other half in place.
- **Gradient text needs all three classes.** `bg-clip-text` + a `bg-linear-*` gradient + `text-transparent`. Omit `text-transparent` and you get solid text on a gradient block. `bg-linear-to-tl` is **Tailwind v4** naming — v3 called it `bg-gradient-to-tl`; copying v3 snippets into this project produces a class that does not exist.
- **Gradient text is unselectable-looking and unreadable to some tooling**: `text-transparent` means any fallback path (forced colours, print, copy-paste into a plain-text field) shows nothing. Never use it for the only copy of a heading's meaning.
- **`<dl>` styling lives on the grid, not the `<dl>`.** `static-4.html` needs `sm:col-span-1`/`sm:col-span-2` on *every* `<dt>`/`<dd>`; the `<dl>` only declares `grid sm:grid-cols-3`. A `<dd>` without a span class silently becomes one column wide. `mb-3 sm:mb-0` exists because below `sm` the grid is single-column and the gap alone does not separate pairs — remove it and the stacked view collapses.
- **`truncate` on a `<dt>` requires a bounded width.** It works in `static-4.html` only because `sm:col-span-1` in a 3-column grid gives it one. In a single-column stack (below `sm`) the term still truncates to the container width, which may be the whole page — no ellipsis appears.
- **`<details>` is not animatable and `<summary>` swallows clicks.** `select-none` in `static-7.html` prevents the double-click-selects-text artifact. If you need an animated or exclusively-open group, switch to `HSAccordion`.
- **Heading size and heading level are independent here.** `static-1.html` happens to align them, but nothing enforces it — pick the level for document outline and the `text-*` size for visual weight; do not demote an `h2` to `h4` to make it smaller.

## Copy-paste base

`examples/layout-and-content/typography/static-1.html`

```html
<h1 class="text-4xl text-stone-800 dark:text-neutral-200">h1. Preline heading</h1>
<h2 class="text-3xl text-stone-800 dark:text-neutral-200">h2. Preline heading</h2>
<h3 class="text-2xl text-stone-800 dark:text-neutral-200">h3. Preline heading</h3>
<h4 class="text-xl text-stone-800 dark:text-neutral-200">h4. Preline heading</h4>
<h5 class="text-lg text-stone-800 dark:text-neutral-200">h5. Preline heading</h5>
<h6 class="text-base text-stone-800 dark:text-neutral-200">h6. Preline heading</h6>
```

For themed pages, replace each `text-stone-800 dark:text-neutral-200` with `text-foreground`.
