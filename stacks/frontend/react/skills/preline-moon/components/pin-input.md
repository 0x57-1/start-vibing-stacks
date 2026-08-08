---
component: pin-input
label: PIN Input
category: advanced-forms
docs: https://preline.co/docs/components/pin-input.html
examples: 14
js: HSPinInput
tokens: [layer, layer-line, foreground, muted-foreground-1, primary-focus, surface-1, surface-line, line-2]
---

# PIN Input

A row of single-character `<input>` boxes that behave as one field: typing advances focus, Backspace retreats, and a paste anywhere fills every box.

## When to use
- One-time codes / MFA / OTP, short verification PINs, redemption codes.
- Fixed, known length only — the number of boxes IS the length; there is no `length` option.
- NOT for a password or any variable-length secret; use a normal `<input type="password">` with `toggle-password`.
- NOT for masked money/date/phone masks — Preline has no input-mask component; this splits characters into discrete inputs.

## Anatomy
Reduced skeleton — classes below are the ones that carry the theme; see the copy-paste base for the verbatim string.

```html
<!-- wrapper = the instance; JSON options live on this attribute -->
<div class="flex justify-center gap-x-3" data-hs-pin-input>
  <!-- one input per character; ALL theme classes live here, not on the wrapper -->
  <input type="text"
         class="block size-9.5 text-center bg-layer border-layer-line rounded-md sm:text-sm
                text-foreground placeholder:text-muted-foreground-1
                focus:border-primary-focus focus:ring-primary-focus
                disabled:opacity-50 disabled:pointer-events-none"
         placeholder="⚬" data-hs-pin-input-item>
  <!-- ...repeat N times... -->
</div>
```

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| basic-usage | Default PIN input | examples/advanced-forms/pin-input/basic-usage.html | 4 boxes, no placeholder, no options attribute |
| placeholder | Placeholder characters | examples/advanced-forms/pin-input/placeholder.html | adds `placeholder="⚬"` to each box |
| type | Numbers only | examples/advanced-forms/pin-input/type.html | `data-hs-pin-input='{"availableCharsRE": "^[0-9]+$"}'` + webkit spin-button resets |
| regex-type | Custom character regex | examples/advanced-forms/pin-input/regex-type.html | same shape, `"availableCharsRE": "^[0-3]+$"` |
| masked | Masked PIN input | examples/advanced-forms/pin-input/masked.html | `type="password"` on each box |
| show-pin-code-suggest-on-ios-keyboard | iOS one-time-code autofill | examples/advanced-forms/pin-input/show-pin-code-suggest-on-ios-keyboard.html | box 1 = `type="text" inputmode="numeric" autocomplete="one-time-code"`, boxes 2-4 = `type="tel"` |
| focus-effect | Scale on focus | examples/advanced-forms/pin-input/focus-effect.html | adds `focus:scale-110` |
| stone-input | Filled boxes | examples/advanced-forms/pin-input/stone-input.html | `bg-surface-1 border-surface-line` at rest, `focus:bg-layer` |
| underline-input | Underline style | examples/advanced-forms/pin-input/underline-input.html | `bg-transparent border-t-transparent border-b-2 border-x-transparent border-b-line-2` + `focus:border-t-transparent focus:border-x-transparent focus:border-b-primary-focus focus:ring-0`, no `rounded-md` |
| disabled | Disabled | examples/advanced-forms/pin-input/disabled.html | `disabled` attribute on every box |
| length | Different lengths | examples/advanced-forms/pin-input/length.html | three wrappers with 3 / 5 / 7 boxes — length is box count, not an option |
| sizes | Size variants | examples/advanced-forms/pin-input/sizes.html | `size-9.5 sm:text-sm` / `size-11 sm:text-sm` / `size-15.5 text-lg` |
| modal-example | PIN input in modal | examples/advanced-forms/pin-input/modal-example.html | same `size-11` group nested in an `hs-overlay` dialog (`bg-overlay`, `overlay-header`/`overlay-footer`) |
| destroy-and-reinitialize | Destroy and reinitialize | examples/advanced-forms/pin-input/destroy-and-reinitialize.html (+ .js) | `id` on the wrapper + two buttons calling `element.destroy()` / `HSPinInput.autoInit()` |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` | resting box fill (`bg-layer`); also the focus fill of the stone variant | `white` | `neutral-800` |
| `layer-line` | resting box border (`border-layer-line`) | `gray-200` | `neutral-700` |
| `foreground` | the typed character (`text-foreground`) | `gray-800` | `neutral-200` |
| `muted-foreground-1` | placeholder glyph (`placeholder:text-muted-foreground-1`) | `gray-600` | `neutral-400` |
| `primary-focus` | focused border **and** ring (`focus:border-primary-focus focus:ring-primary-focus`); bottom border in the underline variant | `gray-900` | `neutral-300` |
| `surface-1` | filled-box resting fill, stone variant only (`bg-surface-1`) | `gray-200` | `neutral-600` |
| `surface-line` | filled-box border, stone variant only — transparent in both themes | `transparent` | `transparent` |
| `line-2` | resting bottom rule, underline variant only (`border-b-line-2`) | `gray-200` | `neutral-700` |

The modal example additionally pulls `overlay`, `overlay-line`, `overlay-header`, `overlay-footer`, `primary*`, `surface*`, `layer-foreground/hover/focus`, `scrollbar-track`, `scrollbar-thumb` — those belong to the Modal/Button shell, not to the PIN input.

## Behaviour (JS)
Class `HSPinInput`, source `assets/js/preline/pin-input.js` (v4.2.0).

| Attribute | Where | Effect |
|---|---|---|
| `data-hs-pin-input` | wrapper | marks the instance; its value, if present, is parsed as JSON options |
| `data-hs-pin-input-item` | each input | collected in DOM order into `this.items` |

Options (the complete set — there is only one):

| Option | Default | Meaning |
|---|---|---|
| `availableCharsRE` | `"^[a-zA-Z0-9]+$"` | string compiled with `new RegExp()`; a keystroke failing it is reverted to the previous value |

Init: `window.addEventListener('load', () => HSPinInput.autoInit())`. `autoInit()` scans `[data-hs-pin-input]:not(.--prevent-on-load-init)` and skips elements already in `window.$hsPinInputCollection`. Manual: `new HSPinInput(el, options)`.

| API | Signature | Notes |
|---|---|---|
| `HSPinInput.getInstance(target, isInstance?)` | `target` = element or selector string | with `true` returns `{id, element}`; without, returns the instance |
| `HSPinInput.autoInit()` | static | also prunes detached elements from the collection |
| `element.destroy()` | instance | removes all listeners, nulls `items`, drops the `active` class, removes from the collection |

Events — both fire only when every box is non-empty:

| Event | Delivery | Payload |
|---|---|---|
| `completed` | `instance.on('completed', fn)` | `{ currentValue: string[] }` |
| `completed.hs.pinInput` | DOM `CustomEvent` on the wrapper | `event.detail.payload = { currentValue: string[] }` |

State class: the wrapper gains `active` while all boxes are filled and loses it otherwise (`toggleCompleted`). That class is the only completion signal in the markup.

## Gotchas
- **Paste always fills from box 1.** `onPaste` calls `autoFillAll(text)` which writes `items[0..n]` regardless of which box was focused. Pasting into box 3 overwrites boxes 1-3.
- **Placeholders are cached at build time.** `buildInputItems` snapshots each `placeholder` attribute into `this.placeholders`; focus clears the attribute and blur restores the *snapshot*. Changing `placeholder` from JS after init is silently reverted on the next blur.
- **`availableCharsRE` is a JSON string, not a regex literal.** Write `"^[0-9]+$"` — no slashes, and escape backslashes for JSON (`"^\\d+$"`).
- **Numbers-only uses `type="text"`, not `type="number"`.** `type.html` keeps `type="text"` and constrains via the regex; the `[&::-webkit-outer-spin-button]:appearance-none` / `[&::-webkit-inner-spin-button]:appearance-none` utilities are carried anyway across most examples. `type="number"` would break single-character truncation (`value[value.length-1]`).
- **No `length`, `size` or `count` option.** The number of `data-hs-pin-input-item` elements *is* the length (`length.html` proves it: 3 / 5 / 7 boxes, identical options).
- **Re-init after any dynamic render.** React/Vite pages that mount the markup after `load` get no instance. Call `HSPinInput.autoInit()` in an effect; it is idempotent (collection-checked).
- **`destroy()` does not remove the markup**, only the listeners — the boxes stay editable-looking but dead until `autoInit()`.
- **`index.json` under-reports the underline variant.** The index token list for `underline-input` records only `foreground` and `muted-foreground-1`, but the file also uses `border-b-line-2` and `focus:border-b-primary-focus` — and `line-2` is absent from the component-level token map entirely. Read the file, not the index, when styling this variant.
- **`surface-1` inverts direction under moon.** In light it is `gray-200` (darker than the `white` layer); in dark it is `neutral-600` (lighter than the `neutral-800` layer). The stone variant therefore reads as "recessed" in light and "raised" in dark — `focus:bg-layer` snaps it back either way.
- **`disabled` is markup-only.** The JS still attaches listeners to disabled boxes; `disabled:pointer-events-none` is what actually stops interaction.

## Copy-paste base
`examples/advanced-forms/pin-input/basic-usage.html`

```html
<div class="flex justify-center gap-x-3" data-hs-pin-input>
  <input type="text" class="block size-9.5 text-center bg-layer border-layer-line rounded-md sm:text-sm text-foreground placeholder:text-muted-foreground-1 focus:border-primary-focus focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none" data-hs-pin-input-item>
  <input type="text" class="block size-9.5 text-center bg-layer border-layer-line rounded-md sm:text-sm text-foreground placeholder:text-muted-foreground-1 focus:border-primary-focus focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none" data-hs-pin-input-item>
  <input type="text" class="block size-9.5 text-center bg-layer border-layer-line rounded-md sm:text-sm text-foreground placeholder:text-muted-foreground-1 focus:border-primary-focus focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none" data-hs-pin-input-item>
  <input type="text" class="block size-9.5 text-center bg-layer border-layer-line rounded-md sm:text-sm text-foreground placeholder:text-muted-foreground-1 focus:border-primary-focus focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none" data-hs-pin-input-item>
</div>
```
