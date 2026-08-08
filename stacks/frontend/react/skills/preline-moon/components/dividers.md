---
component: dividers
label: Dividers and hr
category: layout-and-content
docs: https://preline.co/docs/components/dividers.html
examples: 5
js: none
tokens: []
---

# Dividers and hr

Horizontal and vertical rules that separate content — either a real `<hr>`, or a flex row whose `before:`/`after:` pseudo-elements draw the rule around a label.

## When to use
- A plain visual break between blocks: `<hr>`.
- A labelled separator ("Or", "Continue with") between two action groups: the pseudo-element pattern, **not** an `<hr>` — an `<hr>` cannot host text.
- Separating rows inside a list or table: prefer `border-t` on the row itself (`first:border-t-0`), as `kbd/list-group-example.html` does. One border per row beats one `<hr>` per gap.
- NOT for spacing. If you only want air, use `space-y-*` / `gap-*`; a divider is a semantic "these are different things".

## Anatomy
Reduced skeleton — all three shapes, every class verbatim from `examples/layout-and-content/dividers/{example,height,with-label,responsive}.html` (`border-2` is from `height.html`, the coloured `<hr>` from `example.html`):

```html
<!-- 1. Plain rule: colour and thickness are border utilities on the element -->
<hr class="border-stone-500 dark:border-neutral-500">
<hr class="border-2">

<!-- 2. Labelled rule: flex row; before:/after: are the two rule halves, flex-1 makes them fill -->
<div class="py-3 flex items-center text-sm text-stone-800 before:flex-1 before:border-t before:border-stone-200 before:me-6 after:flex-1 after:border-t after:border-stone-200 after:ms-6 dark:text-neutral-200 dark:before:border-neutral-600 dark:after:border-neutral-600">Center aligned</div>

<!-- 3. Direction-flipping rule: empty div, top border on mobile, start border from sm up -->
<div class="border-t sm:border-t-0 sm:border-s border-stone-200 dark:border-neutral-700"></div>
```

Which pseudo-elements you include is what sets the alignment: `after:` only = label left, `before:` + `after:` = centred, `before:` only = label right.

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| Colours | Example | `examples/layout-and-content/dividers/example.html` | eight `<hr>`s: bare (inherits base border), `border-stone-800 dark:border-white`, `border-stone-500 dark:border-neutral-500`, then `border-teal-500` / `blue-500` / `red-500` / `yellow-500` / `white` |
| Thickness | Height | `examples/layout-and-content/dividers/height.html` | `<hr>` then `border-2`, `border-4`, `border-8` |
| Labelled | With label | `examples/layout-and-content/dividers/with-label.html` | three rows: `after:` only (left), `before:`+`after:` (centre), `before:` only (right); rule colour `border-stone-200 dark:border-neutral-600` |
| Label between buttons | Vertical button group with label | `examples/layout-and-content/dividers/vertical-button-group-with-label.html` | an "Or" separator (`py-3 … text-xs text-stone-400 uppercase …`) stacked between two full-width `py-2.5 px-3 … rounded-lg border border-stone-200` buttons inside `max-w-xs` |
| Direction flip | Responsive | `examples/layout-and-content/dividers/responsive.html` | `flex flex-col sm:flex-row gap-3` with an empty `<div class="border-t sm:border-t-0 sm:border-s …">` between the two buttons — horizontal rule stacked, vertical rule side-by-side |

## Theme tokens (moon)
None. `index.json` reports `"tokens": {}` for this component — **every divider example hardcodes raw palette classes** (`border-stone-200`, `text-stone-400`, `dark:border-neutral-600`, `dark:border-neutral-700`, `dark:text-neutral-500`) instead of semantic tokens, so nothing here responds to the moon theme.

Token equivalents to substitute when you want the divider to follow the theme (values from `reference/moon-token-table.md`; none of these appear in the example files — the utilities are registered in `assets/css/project-theme.css`, e.g. `--color-border: var(--border)`):

| Token (utility) | Replaces | Light | Dark |
|---|---|---|---|
| `line-2` (`border-line-2`) | `border-stone-200 dark:border-neutral-700` on rules and row borders | `gray-200` | `neutral-700` |
| `border` (`border-border`) | the generic `<hr>` / container border | `gray-200` | `neutral-700` |
| `foreground` (`text-foreground`) | `text-stone-800 dark:text-neutral-200` on a divider label | `gray-800` | `neutral-200` |
| `muted-foreground` (`text-muted-foreground`) | `text-stone-400 dark:text-neutral-500` on an "Or" label | `gray-500` | `neutral-500` |

## Behaviour (JS)
Static markup only -- no Preline JS.

## Gotchas
- **These examples are pre-token markup.** Unlike `kbd` and `layout-splitter` in the same category, not one divider example uses a semantic utility. Pasting them into a moon-themed page gives you a stone-tinted rule that will not move when the theme changes. Swap `border-stone-200 dark:border-neutral-700` → `border-line-2` (the dark half happens to match `neutral-700`; the light half does **not** — `stone-200` ≠ `gray-200`).
- **The labelled divider is not an `<hr>`** — it is a `<div>` whose text content is the label and whose rules are `before:`/`after:` pseudo-elements. Do not try to add a label to an `<hr>`; do not remove the `flex` from the wrapper, since `before:flex-1` is what stretches the rules.
- **Drop a pseudo-element and the alignment changes, not just the decoration.** `after:` only pushes the label left, `before:` only pushes it right. There is no `text-left`/`text-right` in these examples.
- **The responsive divider must reset its first border**: `border-t sm:border-t-0 sm:border-s`. Omit `sm:border-t-0` and you get an L-shaped corner at `sm` and up, because both borders stay on.
- The responsive divider is an **empty `<div>` inside a flex container**, not an `<hr>`. As a flex child with no content its cross-size comes from `align-items: stretch`; putting it in a non-flex parent renders nothing visible.
- Spacing uses **logical** margins (`me-6`, `ms-6`) and logical borders (`border-s`). Keep them for RTL; rewriting to `mr`/`ml`/`border-l` breaks right-to-left layouts.
- A bare `<hr>` carries no colour class — it takes the base border colour from the Tailwind/Preline preflight layer. If your reset differs from Preline's, the "default" rule in `example.html` will not look like the docs.
- Thickness comes from `border-*` (border-width), not `h-*`: preflight gives `hr` `height: 0` and the rule you see is the border. Note `border-2/4/8` set **all four** widths, so an `<hr>` draws top *and* bottom — the band is thicker than the number reads. The rule contributes no margin of its own; spacing around it comes from the surrounding `space-y-*` / `gap-*`.
- `border-white` (last row of `example.html`) is invisible on a light background; it exists for dark/inverse panels only.
- The "Or" label uses `text-xs text-stone-400 uppercase` while the plain labels use `text-sm text-stone-800` — the two labelled examples are not interchangeable snippets, they are two different type treatments.

## Copy-paste base
`examples/layout-and-content/dividers/with-label.html`

```html
<div class="py-3 flex items-center text-sm text-stone-800 after:flex-1 after:border-t after:border-stone-200 after:ms-6 dark:text-neutral-200 dark:after:border-neutral-600">Left aligned</div>
<div class="py-3 flex items-center text-sm text-stone-800 before:flex-1 before:border-t before:border-stone-200 before:me-6 after:flex-1 after:border-t after:border-stone-200 after:ms-6 dark:text-neutral-200 dark:before:border-neutral-600 dark:after:border-neutral-600">Center aligned</div>
<div class="py-3 flex items-center text-sm text-stone-800 before:flex-1 before:border-t before:border-stone-200 before:me-6 dark:text-neutral-200 dark:before:border-neutral-600">Right aligned</div>
```
