---
component: blockquote
label: Blockquote
category: base-components
docs: https://preline.co/docs/components/blockquote.html
examples: 9
js: none
tokens: [foreground, muted-foreground, muted-foreground-1, line-2]
---

# Blockquote

A quoted passage with an optional oversized decorative quote mark behind it and an optional `<footer>` attribution — testimonials, pull quotes, cited excerpts.

## When to use

- Testimonials and pull quotes in marketing/landing content.
- Excerpting someone else's words with attribution (`<footer>` + name + source title).
- **Not** for status or advisory copy — that is `alerts`; a blockquote has no `role`, no colour semantics and no dismiss.
- **Not** as a generic bordered container — use `card`; only `left-bordered` looks like one, and it carries quote semantics for screen readers.
- **Not** for code — use `<pre>`/`<code>`.

## Anatomy

Reduced skeleton — the quote + mark half appears in `examples/base-components/blockquote/example.html`; the `<footer>` half appears in `examples/base-components/blockquote/with-avatar.html` (`example.html` has no footer).

```html
<blockquote class="relative">                                <!-- positioning context -->
  <svg class="absolute -top-6 -inset-s-8 size-16 text-muted-foreground/20"
       aria-hidden="true">…</svg>                            <!-- decorative mark, behind -->
  <div class="relative z-10">                                <!-- lifts text above the mark -->
    <p class="text-foreground sm:text-xl"><em>Quote text</em></p>
  </div>

  <footer class="mt-6">                                      <!-- optional attribution -->
    <div class="text-base font-semibold text-foreground">Josh Grazioso</div>
    <div class="text-xs text-muted-foreground-1">Source title</div>
  </footer>
</blockquote>
```

Mechanism: the mark is absolutely positioned *outside* the box (`-top-6 -inset-s-8`) at 20% opacity and marked `aria-hidden`; `relative z-10` on the text wrapper is what keeps it readable over the mark. Italics come from the `<em>` element, not from a class.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Default | Default blockquote | `examples/base-components/blockquote/example.html` | Baseline: mark + `text-foreground sm:text-xl`. No footer. |
| Small | Small | `examples/base-components/blockquote/small.html` | Body is `text-sm` — the only size with **no** breakpoint, so it stays small on desktop. |
| Medium | Medium | `examples/base-components/blockquote/medium.html` | Body is `sm:text-lg` (one step **below** the default `sm:text-xl`). |
| Large | Large | `examples/base-components/blockquote/large.html` | Body is `text-xl sm:text-3xl sm:leading-normal` — adds an explicit leading because 3xl's default leading is too tight. |
| Centered | Alignment | `examples/base-components/blockquote/alignment.html` | Default + `text-center max-w-lg mx-auto` on the `<blockquote>`. |
| Right aligned | Right-aligned blockquote | `examples/base-components/blockquote/right-aligned.html` | Default + `text-end` on the `<blockquote>`. Mark position unchanged. |
| Cited | Citing a source | `examples/base-components/blockquote/naming-a-source.html` | Adds `<footer class="mt-6">` with a single `text-base font-semibold text-foreground` name. |
| With avatar | Citation with avatar | `examples/base-components/blockquote/with-avatar.html` | Footer becomes `flex items-center`: `shrink-0` avatar `img.size-10.rounded-full` + `ms-4` name/`text-xs text-muted-foreground-1` source title. |
| Left bordered | Blockquote with left border | `examples/base-components/blockquote/left-bordered.html` | **Drops the SVG entirely**; `<blockquote class="relative ps-4 sm:ps-6 border-s-4 border-line-2">` + the avatar footer. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `foreground` (`text-foreground`) | Quote body and attribution name | `gray-800` | `neutral-200` |
| `muted-foreground` (`text-muted-foreground/20`) | The decorative quote mark, at 20% alpha | `gray-500` | `neutral-500` |
| `muted-foreground-1` (`text-muted-foreground-1`) | Source title under the name | `gray-600` | `neutral-400` |
| `line-2` (`border-line-2`) | The 4px start-edge rule in `left-bordered` | `gray-200` | `neutral-700` |

## Behaviour (JS)

Static markup only -- no Preline JS.

## Gotchas

- **The size names do not line up with the default.** `example.html` (the "default") is `sm:text-xl`; `medium.html` is `sm:text-lg`, i.e. *smaller* than the default. Ranked: `small` (`text-sm`) < `medium` (`sm:text-lg`) < `default` (`sm:text-xl`) < `large` (`text-xl sm:text-3xl`). Picking "medium" as an upgrade from the default silently shrinks the type.
- **`small` is not responsive.** Every other size ships a `sm:` prefix, so it grows on desktop; `text-sm` does not. Mixing sizes in one page gives an inconsistent mobile→desktop jump.
- **`relative z-10` on the text wrapper is load-bearing.** Remove it (or drop the wrapper when refactoring to a single `<p>`) and the 20%-alpha mark paints over the first line of the quote.
- **The mark ignores text alignment.** `-inset-s-8` is a logical inset, so it follows `dir="rtl"` — but it does **not** follow `text-end`. `right-aligned.html` keeps the mark at the start edge while the text hugs the opposite side. If you want them together, move the mark yourself.
- **The mark overflows its own box** (`-top-6 -inset-s-8`, `size-16`). Inside a container with `overflow-hidden` or tight `px-`, it is clipped or collides with a neighbour. `left-bordered.html` avoids the problem by removing the SVG rather than repositioning it.
- **Italics come from `<em>`, not a utility.** Templating the quote through a component that strips inline tags removes the italic with no class change to point at.
- **`with-avatar.html` and `left-bordered.html` hardcode an external `images.unsplash.com` URL** — replace it; it will not resolve offline and is not a self-hosted asset.
- Moon renders the quote mark at the same effective value in both themes (`gray-500` and `neutral-500` are the same step), so it stays faint against `white` and against `neutral-900` — it does not need a `dark:` override, and adding one will overshoot.
- The doc source emits `class="relative "` with a trailing space on 6 of the 9 files (`example`, `small`, `medium`, `large`, `naming-a-source`, `with-avatar`); the other 3 (`alignment`, `right-aligned`, `left-bordered`) fill that slot with real classes. Harmless, but do not treat the space as a marker of a second class.

## Copy-paste base

`examples/base-components/blockquote/left-bordered.html` (smallest correct example; no absolutely-positioned mark to clip)

```html
<blockquote class="relative ps-4 sm:ps-6 border-s-4 border-line-2">
  <div class="relative z-10">
    <p class="text-foreground sm:text-xl"><em>
      I just wanted to say that I'm very happy with my purchase so far. The documentation is outstanding - clear and detailed.
    </em></p>
  </div>

  <footer class="mt-6">
    <div class="flex items-center">
      <div class="shrink-0">
        <img class="size-10 rounded-full" src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80" alt="Avatar">
      </div>
      <div class="ms-4">
        <div class="text-base font-semibold text-foreground">Josh Grazioso</div>
        <div class="text-xs text-muted-foreground-1">Source title</div>
      </div>
    </div>
  </footer>
</blockquote>
```
