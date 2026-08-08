---
component: textarea
label: Textarea
category: basic-forms
docs: https://preline.co/docs/components/textarea.html
examples: 18
js: HSTextareaAutoHeight
tokens: [layer, layer-line, foreground, muted-foreground-1, primary-focus, scrollbar-track, scrollbar-thumb, surface]
---

# Textarea

Multi-line free text field; optionally auto-grows to fit its content via `HSTextareaAutoHeight`.

## When to use

- Free-form prose: comments, messages, descriptions, chat composers.
- Single-line values (email, URL, price, search) belong in `input` / `input-group` instead — those carry `type=` semantics and mobile keyboards that `textarea` cannot.
- A textarea decorated with a leading/trailing button uses `relative` + absolutely positioned overlay, not the `input-group` flex add-on pattern (see `default-height-with-autoheight-script.html`).
- Do **not** reach for `data-hs-textarea-auto-height` on a fixed-height composer; use `rows` alone. Auto-height is only worth its JS when the content length is unbounded.

## Anatomy

```html
<!-- REDUCED SKELETON. Every class is verbatim from examples/basic-forms/textarea/{basic,label}.html -->
<div class="max-w-sm w-full">
  <!-- label carries the theme via text-foreground -->
  <label for="ID" class="block mb-3 text-sm font-medium text-foreground">Comment</label>

  <!-- box     : bg-layer + border-layer-line + rounded-lg
       text    : text-foreground / placeholder:text-muted-foreground-1
       focus   : focus:border-primary-focus focus:ring-primary-focus
       scroll  : [&::-webkit-scrollbar-track]:bg-scrollbar-track + …-thumb]:bg-scrollbar-thumb -->
  <textarea id="ID" rows="3" class="py-2 px-3 sm:py-3 sm:px-4 block w-full bg-layer border-layer-line rounded-lg sm:text-sm text-foreground placeholder:text-muted-foreground-1 focus:border-primary-focus focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb"></textarea>
</div>
```

No border-**width** utility appears in this skin. The 1px border comes from `@tailwindcss/forms`; `border-layer-line` only recolours it. Drop the plugin and every textarea goes borderless. The one exception is the underline variant, which sets `border-b-2` explicitly (`underline-input.html`, `floating-label.html`).

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| `basic` | Default textarea | `examples/basic-forms/textarea/basic.html` | Baseline: `rows="3"`, no label, no placeholder. |
| `placeholder` | Textarea with placeholder | `examples/basic-forms/textarea/placeholder.html` | Adds `placeholder=`; colour from `placeholder:text-muted-foreground-1`. |
| `label` | Textarea with label | `examples/basic-forms/textarea/label.html` | `<label class="block mb-3 text-sm font-medium text-foreground">` above. |
| `hidden-label` | Hidden label textarea | `examples/basic-forms/textarea/hidden-label.html` | Same label, `class="sr-only"` — a11y name without visual label. |
| `stone-input` | Stone style textarea | `examples/basic-forms/textarea/stone-input.html` | `bg-surface border-transparent` resting, `focus:bg-layer` on focus. |
| `underline-input` | Underlined textarea | `examples/basic-forms/textarea/underline-input.html` | `bg-transparent border-b-2 border-b-line-2` + `border-{t,x}-transparent`, `focus:ring-0`. |
| `floating-label` | Floating label | `examples/basic-forms/textarea/floating-label.html` | 3 stacked skins (layer / surface / underline); `peer` + `peer-not-placeholder-shown:` label. |
| `default-height-with-autoheight-script` | Autoheight with default height | `examples/basic-forms/textarea/default-height-with-autoheight-script.html` | `data-hs-textarea-auto-height='{"defaultHeight": 48}'`, `max-h-36 resize-none overflow-y-auto`, absolute Send button. |
| `sizes` | Textarea sizes | `examples/basic-forms/textarea/sizes.html` | Padding only: `py-1 sm:py-2 px-3` / `py-2 px-3 sm:py-3 sm:px-4` / `sm:p-5 py-2 px-3`. Text stays `sm:text-sm`. |
| `readonly` | Read-only textarea | `examples/basic-forms/textarea/readonly.html` | `readonly` attribute; **no** style change — reads identical to editable. |
| `disabled` | Disabled textarea | `examples/basic-forms/textarea/disabled.html` | `disabled` and `disabled readonly`; `disabled:opacity-50 disabled:pointer-events-none` fires. |
| `helper-text` | Textarea with helper text | `examples/basic-forms/textarea/helper-text.html` | `<p class="mt-2 text-xs text-muted-foreground-1">` + `aria-describedby`. |
| `corner-hint` | Textarea with corner hint | `examples/basic-forms/textarea/corner-hint.html` | Label row becomes `flex flex-wrap justify-between items-center gap-2` with a trailing `<span>`. |
| `autoheight` | Auto-resizing textarea | `examples/basic-forms/textarea/autoheight.html` | Bare `data-hs-textarea-auto-height`; scrollbar utilities **removed** (it never scrolls). |
| `modal-example` | Modal example | `examples/basic-forms/textarea/modal-example.html` | Textarea inside `.hs-overlay.hidden`; height is deferred to the overlay's `open` event. |
| `textarea-examples` | Chat composer | `examples/basic-forms/textarea/textarea-examples.html` | `pb-12` reserves room for an absolutely positioned toolbar (`absolute bottom-px inset-x-px bg-layer`). |
| `validation-states` | Validation states | `examples/basic-forms/textarea/validation-states.html` | `border-red-500` / `border-teal-500` + absolute status icon. Raw palette, **not** tokens. |
| `destroy-and-reinitialize` | Destroy and reinitialize | `examples/basic-forms/textarea/destroy-and-reinitialize.html` (+ `.js`) | Floating-label textarea plus two buttons calling `element.destroy()` and `HSTextareaAutoHeight.autoInit()`. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` | Resting field fill (`bg-layer`); also the focus fill of the stone variant | `white` | `neutral-800` |
| `layer-line` | Field hairline (`border-layer-line`) | `gray-200` | `neutral-700` |
| `foreground` | Typed text and the label (`text-foreground`) | `gray-800` | `neutral-200` |
| `muted-foreground-1` | Placeholder, helper text, corner hint, floated label | `gray-600` | `neutral-400` |
| `primary-focus` | Focus border + focus ring (`focus:border-primary-focus focus:ring-primary-focus`) | `gray-900` | `neutral-300` |
| `scrollbar-track` | Inner scrollbar gutter (`[&::-webkit-scrollbar-track]:bg-scrollbar-track`) | `gray-100` | `neutral-700` |
| `scrollbar-thumb` | Inner scrollbar thumb | `gray-300` | `neutral-500` |
| `surface` | Stone-variant resting fill (`bg-surface`) | `gray-100` | `neutral-700` |
| `line-2` | Underline variant rule (`border-b-line-2`) — in the markup of `underline-input.html` and `floating-label.html`, but **absent from `data/index.json`**'s counter for this component, which does not recognise per-side `border-b-*` utilities. Trust the markup | `gray-200` | `neutral-700` |
| `primary` | Send-button fill in the autoheight + chat examples | `gray-800` | `white` |
| `primary-foreground` | Send-button icon/label | `white` | `neutral-800` |
| `primary-hover` | Send-button hover fill | `gray-900` | `neutral-300` |
| `primary-line` | Send-button border — transparent both modes, present for box-size parity | `transparent` | `transparent` |
| `muted-hover` / `muted-focus` | Ghost toolbar buttons in the chat composer | `gray-100` | `neutral-700` |
| `layer-foreground` | Secondary button label next to the field | `gray-800` | `white` |
| `layer-hover` / `layer-focus` | Secondary button hover/focus fill | `gray-50` | `neutral-700` |

`overlay`, `overlay-line`, `overlay-header` and `overlay-footer` appear only in `modal-example.html` and belong to the Modal component, not the textarea. `surface-line` / `surface-foreground` / `surface-hover` / `surface-focus` are likewise chrome, not field: they dress the close button in `modal-example.html` and the "Reinitialize" button in `destroy-and-reinitialize.html`. Only bare `surface` is a textarea fill (the stone variant).

## Behaviour (JS)

Class `HSTextareaAutoHeight` — `assets/js/preline/textarea-auto-height.js`.

| Attribute | Effect |
|---|---|
| `data-hs-textarea-auto-height` | Marks the element for `autoInit()`. Empty = defaults. |
| `data-hs-textarea-auto-height='{"defaultHeight": 48}'` | JSON options. `defaultHeight` (px) is used **only while the content is one line**; past one line it switches to `scrollHeight + 3`. |
| `class="--prevent-on-load-init"` | Excluded from `autoInit()`; construct it yourself. |

Init path: the module registers `window.addEventListener('load', () => HSTextareaAutoHeight.autoInit())` and exposes `window.HSTextareaAutoHeight`. There is no per-element `new` in any example.

| API | Signature / behaviour |
|---|---|
| `HSTextareaAutoHeight.autoInit()` | Creates the global `window.$hsTextareaAutoHeightCollection` if absent, prunes entries whose `el` is no longer `document.contains(...)`, then instantiates every `[data-hs-textarea-auto-height]:not(.--prevent-on-load-init)` that is not already registered. Idempotent — safe to call repeatedly. |
| `HSTextareaAutoHeight.getInstance(target, isInstance?)` | `target` is an element or a selector string. `isInstance=true` returns the `{id, element}` collection record; otherwise the instance. `null` when unregistered. |
| `instance.destroy()` | Removes the `input` listener and drops the record from the collection. |
| `instance.textareaSetHeight(offset = 0)` | Sets `style.height='auto'` then `scrollHeight + offset`px (internally always called with `3`). |

Hidden-parent handling: at init the instance checks `el.closest('.hs-overlay.hidden')`, `[role="tabpanel"].hidden`, `.hs-collapse.hidden`. If any matches, it does **not** measure immediately (a hidden element reports `scrollHeight` 0). It instead subscribes to the owning component: `HSCollapse` `beforeOpen`, `HSOverlay` `open` (re-measures every registered textarea inside that overlay), `HSTabs` `change` (re-measures `[data-hs-textarea-auto-height]` inside the newly current panel).

This module fires no events of its own; `on()` exists on the base plugin but nothing calls `fireEvent`.

## Gotchas

- **`new HSTextareaAutoHeight(el)` ignores the attribute JSON.** The constructor reads options from `el.getAttribute('data-hs-copy-markup')` — a genuine upstream copy/paste bug. Only `autoInit()` parses `data-hs-textarea-auto-height`. If you construct manually, pass options as the second argument: `new HSTextareaAutoHeight(el, {defaultHeight: 48})`.
- **`destroy()` does not restore the height.** It removes the listener but leaves the inline `style.height` at its last computed value. Clear `el.style.height` yourself if you want the `rows` height back.
- **Re-init after dynamic render.** `autoInit()` runs once on window `load`. Anything mounted afterwards (React re-render, fetched fragment, opened drawer) needs `window.HSTextareaAutoHeight.autoInit()` again.
- **Overlay order matters.** For a textarea inside `.hs-overlay`, init calls `window.HSOverlay.getInstance(...)` immediately — the overlay must already be initialised, or that lookup throws during `autoInit()`.
- **Scrollbar utilities on an auto-height field are inconsistent upstream.** Five examples carry `data-hs-textarea-auto-height`. Three drop the `[&::-webkit-scrollbar*]` classes (`autoheight.html`, `floating-label.html`, `destroy-and-reinitialize.html`) — an unbounded field never scrolls, so they would be dead. Two keep them: `default-height-with-autoheight-script.html`, where they are load-bearing because growth is capped with `max-h-36 overflow-y-auto`, and `modal-example.html`, where they are inherited boilerplate on an uncapped field (the modal body around it is the element that actually scrolls). Copy the capped one if you want a bounded composer.
- **Floating label is placeholder-driven.** The label moves purely through `peer-not-placeholder-shown:` / `peer-focus:`. A non-empty `placeholder` attribute plus `placeholder:text-transparent` on the textarea are load-bearing — remove either and the label sits permanently over the text. The `<label>` must also stay **after** the `peer` textarea in the DOM (`peer-*` only matches later siblings).
- **Validation colours are not themed.** `validation-states.html` hardcodes `border-red-500` / `text-red-600` / `border-teal-500` / `text-teal-600`. They are identical in light and dark; nothing in the moon token table moves them.
- **`readonly` looks exactly like editable.** `readonly.html` adds no visual affordance at all. If read-only state must be legible, add it yourself.
- **Extra focus class on the underline variant.** `underline-input.html` (and the third field of `floating-label.html`) set both the shorthand `focus:border-primary-focus` — which targets `border-color`, all four sides — and the per-side `focus:border-b-primary-focus` + `focus:border-{t,x}-transparent`. Same specificity, different properties, so which colour lands on each side is decided by generated-CSS order alone; there is no built utility CSS in this skill to read it off. The intended result is the per-side one: `input`'s underline variant ships the per-side classes **without** the shorthand. Delete the shorthand, not the per-side rules.
- **`rows` still matters** — it sets the first-paint height before JS measures, so a `rows="1"` auto-height field flashes one line tall.

## Copy-paste base

`examples/basic-forms/textarea/label.html`

```html
<div class="max-w-sm w-full">
  <label for="textarea-label" class="block mb-3 text-sm font-medium text-foreground">Comment</label>
  <textarea id="textarea-label" class="py-2 px-3 sm:py-3 sm:px-4 block w-full bg-layer border-layer-line rounded-lg sm:text-sm text-foreground placeholder:text-muted-foreground-1 focus:border-primary-focus focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb" rows="3" placeholder="Say hi..."></textarea>
</div>
```
