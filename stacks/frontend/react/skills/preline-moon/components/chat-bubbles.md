---
component: chat-bubbles
label: Chat Bubbles
category: base-components
docs: https://preline.co/docs/components/chat-bubbles.html
examples: 4
js: none
tokens: [foreground, primary, primary-foreground, layer, layer-line, surface-5, foreground-inverse, muted-foreground-1]
---

# Chat Bubbles

A `<ul>` of message rows where side is decided by margin utilities on the `<li>` and speaker is encoded by the bubble fill: `bg-layer` (them) vs `bg-primary` (you).

## When to use
- Transcript-style conversation UI: support chat, AI assistant output, message threads.
- You need per-message metadata (delivery status, timestamps) hung below the bubble.
- **Not** for a single system notice — use `alerts` or `toasts`.
- **Not** for threaded comments with replies and nesting — the flat `<ul>` has no nesting affordance.
- **Not** as a container for long-form documents; the incoming bubble is capped at `max-w-lg`.

## Anatomy

```html
<!-- REDUCED SKELETON — every class below appears verbatim in the example files -->
<ul class="space-y-5">

  <!-- INCOMING: me-11 reserves the right gutter -->
  <li class="max-w-lg flex gap-x-2 sm:gap-x-4 me-11">
    <img class="inline-block size-9 rounded-full" src="…" alt="Avatar">   <!-- optional -->
    <div>
      <div class="bg-layer border border-layer-line rounded-2xl p-4 space-y-3">
        <p class="text-sm text-foreground">…</p>
      </div>
      <span class="mt-1.5 flex items-center gap-x-1 text-xs text-muted-foreground-1">Sent</span>
    </div>
  </li>

  <!-- OUTGOING: ms-auto pushes the row right, text-end aligns the inline bubble -->
  <li class="ms-auto flex gap-x-2 sm:gap-x-4">
    <div class="grow text-end space-y-3">
      <div class="inline-flex flex-col justify-end">
        <div class="inline-block bg-primary rounded-2xl p-4 shadow-2xs">
          <p class="text-sm text-primary-foreground">…</p>
        </div>
        <span class="mt-1.5 ms-auto flex items-center gap-x-1 text-xs text-muted-foreground-1">Sent</span>
      </div>
    </div>
    <span class="shrink-0 inline-flex items-center justify-center size-9.5 rounded-full bg-surface-5">
      <span class="text-sm font-medium text-foreground-inverse">AZ</span>          <!-- optional -->
    </span>
  </li>
</ul>
```

`inline-flex flex-col` + `inline-block` on the outgoing bubble is what makes it shrink-to-fit; the surrounding `text-end` is what right-aligns it inside `grow`.

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| `example` | Conversation | `examples/base-components/chat-bubbles/example.html` | Baseline two-sided thread, no avatars. Incoming `li.max-w-lg…me-11`, outgoing `li.ms-auto` + `div.grow.text-end`. |
| `one-sided` | One-sided | `examples/base-components/chat-bubbles/one-sided.html` | Outgoing `<li>` drops `ms-auto` and `text-end`, gains `max-w-lg`. Both speakers stack against the start edge; only the fill distinguishes them. |
| `with-avatar` | Messages with avatars | `examples/base-components/chat-bubbles/with-avatar.html` | Adds `img.size-9.rounded-full` *before* the incoming bubble and `span.size-9.5.bg-surface-5` + `text-foreground-inverse` initials *after* the outgoing one. |
| `with-footer` | Message metadata | `examples/base-components/chat-bubbles/with-footer.html` | Adds a status line under each bubble: `span.mt-1.5.text-xs.text-muted-foreground-1` (outgoing also `ms-auto`), plus a failure state using raw `text-red-500`. |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` | Incoming bubble fill | `white` | `neutral-800` |
| `layer-line` | Incoming bubble border | `gray-200` | `neutral-700` |
| `foreground` | Body text + heading inside the incoming bubble | `gray-800` | `neutral-200` |
| `primary` | Outgoing bubble fill | `gray-800` | `white` |
| `primary-foreground` | Outgoing bubble text | `white` | `neutral-800` |
| `muted-foreground-1` | Delivery-status footer text (`with-footer`) | `gray-600` | `neutral-400` |
| `surface-5` | Outgoing initials avatar fill | `gray-600` | `neutral-400` |
| `foreground-inverse` | Outgoing initials letters | `white` | `white` |

`text-primary` also appears on the in-bubble links — same token as the outgoing fill, see Gotchas.

## Behaviour (JS)
Static markup only -- no Preline JS.

## Gotchas
- **Under moon, `primary` and `foreground` are the same colour in light mode** (`gray-800` both). The "Installation Guide" / "Framework Guides" links inside the incoming bubble use `text-primary`, so in light mode they are pixel-identical to body text and only read as links on `hover:underline`. If link affordance matters, add `underline` at rest rather than relying on colour.
- **The outgoing bubble inverts wholesale between modes.** `bg-primary` is `gray-800`→`white` and `text-primary-foreground` is `white`→`neutral-800`. It is the highest-contrast object on the page in *both* modes. Never hardcode `text-white` on it — that produces white-on-white in dark.
- **The failure state is not a token.** `with-footer` ships `text-red-500`, a raw Tailwind colour that will not follow a theme swap. `destructive` resolves to `red-500` in both light and dark under moon, so `text-destructive` is a drop-in with identical output today and correct behaviour under other themes.
- **Only the incoming `<li>` is width-capped.** `max-w-lg` is on the incoming row in every variant, but the outgoing row in `example`, `with-avatar` and `with-footer` has none — a long outgoing message spans the full container. `one-sided` is the only variant where both are capped. Add `max-w-lg` to the outgoing `<li>` if you accept free-text input.
- **Alignment is margins, not flex.** `me-11` on incoming, `ms-auto` on outgoing; the `<ul>` itself is only `space-y-5`. Adding `flex` / `items-*` / `justify-*` to the `<ul>` breaks the layout. Both utilities are logical, so the thread mirrors under `dir="rtl"` for free.
- **Avatar sizes disagree by 2px**: incoming image is `size-9`, outgoing initials chip is `size-9.5`. That is what the docs ship; normalise both if you care about a straight gutter.
- **Initials contrast is weak in dark.** `foreground-inverse` is `white` in *both* modes, but its backing `surface-5` goes `gray-600` → `neutral-400`. White on `neutral-400` is a low-contrast pairing; swap the text to `text-foreground` or darken the chip if the initials must be readable.
- The `space-y-3` on the incoming bubble applies *inside* the card (between heading, paragraph and link list). The bare `<div>` wrapping the card in every incoming `<li>` is what lets the footer span sit *outside* the card and escape that spacing — see `with-footer.html` lines 6–37 (card 8–30, footer span 33–36, both inside the bare `<div>`). `example.html` / `one-sided.html` / `with-avatar.html` keep the same wrapper with nothing after the card; do not "simplify" it away or the footer variant stops composing.

## Copy-paste base

Verbatim from `examples/base-components/chat-bubbles/one-sided.html` — the outgoing bubble (lines 35–49); pair it with an incoming `<li>` inside the same `<ul class="space-y-5">`.

```html
  <!-- Chat -->
  <li class=" max-w-lg flex gap-x-2 sm:gap-x-4">
    <div class="grow  space-y-3">
      <div class="inline-flex flex-col justify-end">
        <!-- Card -->
        <div class="inline-block bg-primary rounded-2xl p-4 shadow-2xs">
          <p class="text-sm text-primary-foreground">
            what's preline ui?
          </p>
        </div>
        <!-- End Card -->
      </div>
    </div>
  </li>
  <!-- End Chat -->
```
