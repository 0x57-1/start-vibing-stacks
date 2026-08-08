---
component: spinners
label: Spinners
category: base-components
docs: https://preline.co/docs/components/spinners.html
examples: 17
js: none
tokens: [surface-4, primary, foreground, muted-foreground-1, muted-foreground-2, muted-foreground, card, card-line, plain]
---

# Spinners

Pure-CSS loading indicators: one rotating ring plus twelve alternative shapes (dots, bars, carets, shimmer). Eleven of the twelve share the same accessibility wrapper; `typing-dots.html` does not (see Gotchas).

## When to use
- Indeterminate waits where you cannot show progress: form submit, panel refresh, streaming response.
- The **ring** (`example.html`) is the default; **loading-dots / blinking-caret / terminal / shimmer-text** read as "the machine is composing" and belong next to streamed text; **wave / bars / ellipsis / pulse-dot** are compact inline markers.
- Do NOT use a spinner where the shape of the result is known — use a skeleton instead. `inside-a-card.html` is a spinner filling a card only because the card's contents are unknown until load.
- Do NOT use a spinner inside a button by hand; `buttons/loading.html` already has the correct span.

## Anatomy

Reduced skeleton. Every class below appears verbatim in the example files.

```html
<!-- Pattern A: the ring. Colour comes from text-*, NOT border-*. -->
<div class="animate-spin inline-block size-6 border-3 border-current border-t-transparent rounded-[999px] text-muted-foreground-2"
     role="status" aria-label="loading">
  <span class="sr-only">Loading...</span>
</div>

<!-- Pattern B: every other variant. role+aria on the OUTER div,
     the visual is aria-hidden, the label is an sr-only sibling. -->
<div class="inline-flex" role="status" aria-label="loading">
  <span class="… [animation:spinner-<name>_1s_ease-in-out_infinite]" aria-hidden="true"></span>
  <span class="sr-only">Loading...</span>
</div>
```

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| `example` | Default spinner | `examples/base-components/spinners/example.html` | The ring: `animate-spin inline-block size-6 border-3 border-current border-t-transparent rounded-[999px]` |
| `svg-spinner` | SVG spinner | `examples/base-components/spinners/svg-spinner.html` | Inline SVG, `animate-spin`; full circle at `opacity=".2"` is the track, quarter arc is the head |
| `throbber` | Throbber | `examples/base-components/spinners/throbber.html` | 12 stroked spokes with baked `opacity` (0.15 · 0.22 · 0.32 · 0.42 · 0.54 · 0.66 · 0.78 · 0.9 · 1 · 0.86 · 0.7 · 0.5 — peak at the 9th path, not the last), whole `<svg>` spun |
| `ring-loader` | Ring | `examples/base-components/spinners/ring-loader.html` | Two stacked `size-4` circles; outer uses `border-foreground/50 animate-ping` |
| `pulse-dot` | Pulse dot | `examples/base-components/spinners/pulse-dot.html` (+ `.css`) | One `size-2` dot, `[animation:spinner-pulse-dot_1s_ease-in-out_infinite]`, scale 1→1.5 |
| `wave` | Wave | `examples/base-components/spinners/wave.html` (+ `.css`) | 5 bars `h-2.5/3.5/4.5/3.5/2.5`, `scaleY`, delays 0/0.12/0.24/0.36/0.48s |
| `bars` | Bars | `examples/base-components/spinners/bars.html` (+ `.css`) | 3 bars `origin-bottom`, fills graded `bg-muted-foreground-1/55`, `/75`, `bg-surface-4` |
| `terminal` | Terminal | `examples/base-components/spinners/terminal.html` (+ `.css`) | `font-mono` `>` prompt + block caret, `[animation:spinner-caret_1s_steps(1)_infinite]` |
| `blinking-caret` | Blinking caret | `examples/base-components/spinners/blinking-caret.html` (+ `.css`) | Word "Loading" + a thin `h-3.5 w-1` caret, same `spinner-caret` keyframes |
| `shimmer-text` | Shimmer text | `examples/base-components/spinners/shimmer-text.html` (+ `.css`) | `bg-clip-text text-transparent` over a moving gradient; needs the `.spinner-shimmer-text` rule |
| `loading-dots` | Loading dots | `examples/base-components/spinners/loading-dots.html` (+ `.css`) | Text + three animated `.` characters bouncing via `spinner-ellipsis` |
| `ellipsis` | Ellipsis | `examples/base-components/spinners/ellipsis.html` (+ `.css`) | Three `size-1.5` dots, `translateY(-0.4em)`, 0.7s cycle |
| `typing-dots` | Typing dots | `examples/base-components/spinners/typing-dots.html` (+ `.css`) | 3 dots scaling 1→0.75; **hardcoded `stone`/`neutral` colours, no `role="status"`, no `sr-only`** |
| `color-variants` | Color variants | `examples/base-components/spinners/color-variants.html` | Ten copies of the ring differing only in the `text-*` class |
| `sizes` | Sizes | `examples/base-components/spinners/sizes.html` | `size-4` / `size-6` / `size-8`, `border-3` unchanged |
| `inside-a-card` | Inside a card | `examples/base-components/spinners/inside-a-card.html` | `min-h-60` card + `flex flex-auto flex-col justify-center items-center` + `text-primary` ring |
| `customized-description` | Spinner with description | `examples/base-components/spinners/customized-description.html` | Alert box + `absolute … bg-plain/30` scrim + ring centred with `top-1/2 inset-s-1/2 -translate-x-1/2 -translate-y-1/2` |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `muted-foreground-2` | Default ring colour (`example.html`, `sizes.html`) | `gray-700` | `neutral-300` |
| `muted-foreground-1` | Faded bars in `bars.html` (via `/55`, `/75`) and the shimmer gradient's dim stops | `gray-600` | `neutral-400` |
| `muted-foreground` | Quiet ring option in `color-variants.html` | `gray-500` | `neutral-500` |
| `foreground` | SVG/throbber stroke, caret + text variants | `gray-800` | `neutral-200` |
| `surface-4` | Dot / bar fill for pulse-dot, wave, bars, ellipsis | `gray-500` | `neutral-500` |
| `primary` | Ring colour inside a card; alert icon + text in `customized-description.html` | `gray-800` | `white` |
| `card` | Host card surface in `inside-a-card.html` | `white` | `neutral-800` |
| `card-line` | Its border | `gray-200` | `neutral-700` |
| `plain` | `bg-plain/30` blocking scrim over the alert | `white` | `neutral-800` |
| `primary-50` | Alert box fill (`customized-description.html`) | `gray-50` | `zinc-50` |
| `primary-200` | Alert box border | `gray-200` | `neutral-200` |
| `primary-500` | Its dark-mode fill/border base (`dark:bg-primary-500/20`) | `gray-500` | `neutral-500` |
| `primary-900` | Its dark-mode border (`dark:border-primary-900`) | `gray-900` | `neutral-900` |

## Behaviour (JS)

Static markup only -- no Preline JS.

Note that `data/index.json` lists a long `hs_attrs` array for this component (`data-hs-select`, `data-hs-tab`, `data-hs-clipboard-options`, `data-hs-theming-*`, …). **None of those belong to a spinner** — they were scraped from the documentation page's own tab/theme-switcher chrome. Do not add them.

## Gotchas
- **The `[animation:…]` utility names an animation; it does not create one.** Nine variants reference keyframes that Tailwind will never generate for you. Ship them yourself:
  | Keyframes | Used by | Utility spelling | Defined in |
  |---|---|---|---|
  | `spinner-pulse-dot` | pulse-dot | `[animation:…]` | `examples/base-components/spinners/pulse-dot.css` |
  | `spinner-wave` | wave | `[animation:…]` | `wave.css` |
  | `spinner-bars` | bars | `[animation:…]` | `bars.css` |
  | `spinner-caret` | terminal, blinking-caret | `[animation:…]` | `terminal.css`, `blinking-caret.css` |
  | `spinner-shimmer` (+ `.spinner-shimmer-text`) | shimmer-text | `[animation:…]` | `shimmer-text.css` |
  | `spinner-ellipsis` | ellipsis, loading-dots | `[animation:…]` | `ellipsis.css`, `loading-dots.css` |
  | `typing` | typing-dots | `animate-[typing_1s_ease-in-out_infinite]` — the ONLY file using the `animate-[…]` spelling | `typing-dots.css` |
  Without them the element renders but never moves — and nothing errors.
- **The sibling `.css` files are page dumps, not stylesheets.** Only the leading `<style>…</style>` block is real; everything after the first `</textarea>` is doc-site scaffolding (~30 KB of it). `head -20 <file>.css` gets you the whole payload.
- **`typing-dots.html` is the outlier — do not treat it as a peer.** It has no `role="status"`, no `sr-only` label, `aria-hidden="true"` on the entire block, and hardcoded `text-stone-400 dark:text-neutral-500` / `bg-stone-400 dark:bg-neutral-600`. It is invisible to assistive tech and immune to the theme. If you need it, rewrite it against pattern B and `surface-4`.
- **Colour the ring with `text-*`, never `border-*`.** The ring is `border-current` with `border-t-transparent`; that transparent quadrant is what makes rotation legible. Setting an explicit `border-<colour>` fills the gap and the thing appears to stand still.
- **`shimmer-text.css` reads `var(--color-muted-foreground-1)` and `var(--color-foreground)`** — the `@theme inline` aliases (`assets/css/project-theme.css:6,62`), not the raw `--foreground` / `--muted-foreground-1` that `project-moon.css` defines. Inline that gradient somewhere without the `@theme` layer and it resolves to nothing: transparent text on transparent background.
- **`surface-4` is the one token that barely moves between modes** (`gray-500` / `neutral-500`), which is why every dot/bar variant uses it — those spinners are deliberately mode-agnostic. If you swap them to `foreground` they will flip contrast with the theme.
- **`reference/moon-token-table.md` prints `primary-50` dark as `zinc-50`,** but both `assets/css/themes/moon.css:99` and `assets/css/project-moon.css:165` set `--primary-50: var(--color-neutral-50)`. Same lightness, different hue label — do not derive a hue from that row.
- `rounded-[999px]` is used rather than `rounded-full` in every ring; grep accordingly.
- `border-3` is a real Tailwind v4 width. Do not "fix" it to `border-2`; the ring reads thin at `size-4`.

## Copy-paste base

`examples/base-components/spinners/example.html`

```html
<div class="animate-spin inline-block size-6 border-3 border-current border-t-transparent rounded-[999px] text-muted-foreground-2" role="status" aria-label="loading">
  <span class="sr-only">Loading...</span>
</div>
```
