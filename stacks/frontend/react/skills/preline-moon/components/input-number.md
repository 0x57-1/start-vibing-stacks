---
component: input-number
label: Input Number
category: advanced-forms
docs: https://preline.co/docs/components/input-number.html
examples: 13
js: HSInputNumber
tokens: [layer, layer-line, layer-foreground, layer-hover, layer-focus, foreground, muted-foreground-1, surface, muted, muted-foreground, muted-hover, muted-focus, line-2]
---

# Input Number

A quantity stepper: one `type="number"` input plus increment/decrement buttons, clamped to `min`/`max` and moved by `step`.

## When to use
- Small bounded integers a user nudges: cart quantity, seats, per-page, retries.
- When the buttons matter. For a free-form number with no stepper, use a plain `<input type="number">` with the standard input classes — this component adds ~30 lines of markup for the two buttons.
- NOT for a range/threshold you drag — use `range-slider`.
- NOT for a value with no upper bound *and* no lower bound: `min` silently defaults to **0**, so unbounded-negative fields need an explicit `min`.

## Anatomy
Reduced skeleton — the four `data-hs-input-number*` attributes are the whole contract.

```html
<!-- wrapper = the instance; JSON options live on this attribute -->
<div class="py-2 px-3 bg-layer border border-layer-line rounded-lg" data-hs-input-number>
  <div class="w-full flex justify-between items-center gap-x-3">
    <!-- the value; native spinners suppressed by the inline style + webkit resets -->
    <input class="w-full p-0 bg-transparent border-0 text-foreground placeholder:text-muted-foreground-1 focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
           style="-moz-appearance: textfield;" type="number" aria-roledescription="Number field"
           value="1" data-hs-input-number-input>
    <div class="flex justify-end items-center gap-x-1.5">
      <button type="button" class="... bg-layer border border-layer-line text-layer-foreground hover:bg-layer-hover focus:bg-layer-focus disabled:opacity-50 disabled:pointer-events-none"
              tabindex="-1" aria-label="Decrease" data-hs-input-number-decrement>…</button>
      <button type="button" class="... same ..." tabindex="-1" aria-label="Increase" data-hs-input-number-increment>…</button>
    </div>
  </div>
</div>
```

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| example | Default controls | examples/advanced-forms/input-number/example.html | `bg-surface` card, no border; round-cornered `rounded-md` buttons |
| input-style | Labeled input style | examples/advanced-forms/input-number/input-style.html | adds `<span class="block text-xs text-muted-foreground-1">Select quantity</span>` above the input; `bg-layer border-layer-line` card; buttons `rounded-full` (`example` / `mini` / `pricing-seats-example` use `rounded-md`; the two stacked variants use `rounded-se-lg`+`rounded-ee-lg` / `last:rounded-e-lg`) |
| button-vertically-stacked | Vertical buttons | examples/advanced-forms/input-number/button-vertically-stacked.html | buttons in `flex-col divide-y divide-line-2 border-s border-line-2`, `bg-muted text-muted-foreground hover:bg-muted-hover focus:bg-muted-focus`, corner radii `rounded-se-lg` / `rounded-ee-lg`; **no `tabindex="-1"`** |
| buttons-horizontally-stacked | Horizontal buttons | examples/advanced-forms/input-number/buttons-horizontally-stacked.html | `size-10` buttons in `divide-x divide-line-2 border-s border-line-2`, `last:rounded-e-lg`, `bg-layer` |
| mini | Compact size | examples/advanced-forms/input-number/mini.html | `inline-block` card, `[−][ 0 ][+]` order, input is `p-0 w-6 text-center` |
| pricing-seats-example | Seat quantity selector | examples/advanced-forms/input-number/pricing-seats-example.html | label + price block on the left, mini stepper on the right |
| input-disabled | Disabled input | examples/advanced-forms/input-number/input-disabled.html | `disabled` on the input — JS then disables **both** buttons at build |
| button-disabled | Disabled buttons | examples/advanced-forms/input-number/button-disabled.html | decrement rendered with `disabled` and **without** `data-hs-input-number-decrement` |
| step-controls | Custom step size | examples/advanced-forms/input-number/step-controls.html | `data-hs-input-number='{"step":2}'` |
| negative-value | Negative values | examples/advanced-forms/input-number/negative-value.html | `data-hs-input-number='{"min":-10}'`, `value="-10"` |
| maximum-value | Maximum limit | examples/advanced-forms/input-number/maximum-value.html | `data-hs-input-number='{"max":10}'`, `value="10"` |
| validation-states | Validation states | examples/advanced-forms/input-number/validation-states.html | card `border-red-500` (raw Tailwind, not a token), inline error icon, `aria-describedby` + `<p class="text-sm text-red-500">` |
| destroy-and-reinitialize | Destroy and reinitialize | examples/advanced-forms/input-number/destroy-and-reinitialize.html (+ .js) | `{"max":10}` + two buttons calling `element.destroy()` / `HSInputNumber.autoInit()` |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` | card fill and default button fill (`bg-layer`) | `white` | `neutral-800` |
| `layer-line` | card border and button border (`border-layer-line`) | `gray-200` | `neutral-700` |
| `layer-foreground` | +/− glyph colour (`text-layer-foreground`) | `gray-800` | `white` |
| `layer-hover` | button hover fill (`hover:bg-layer-hover`) | `gray-50` | `neutral-700` |
| `layer-focus` | button focus fill (`focus:bg-layer-focus`) | `gray-50` | `neutral-700` |
| `foreground` | the number itself (`text-foreground`) | `gray-800` | `neutral-200` |
| `muted-foreground-1` | small "Select quantity" / "$39 monthly" label and placeholder | `gray-600` | `neutral-400` |
| `surface` | card fill in the default example (`bg-surface`, no border) | `gray-100` | `neutral-700` |
| `muted` | button fill, vertical-stacked variant only (`bg-muted`) | `gray-50` | `neutral-800` |
| `muted-foreground` | glyph colour, vertical-stacked variant only | `gray-500` | `neutral-500` |
| `muted-hover` | button hover fill, vertical-stacked variant only | `gray-100` | `neutral-700` |
| `muted-focus` | button focus fill, vertical-stacked variant only | `gray-100` | `neutral-700` |
| `line-2` | divider + leading rule between stacked buttons (`divide-line-2`, `border-line-2`) | `gray-200` | `neutral-700` |

`surface`, `surface-line`, `surface-foreground`, `surface-hover`, `surface-focus` also appear on the demo buttons of `destroy-and-reinitialize.html`; those are Button tokens, not stepper tokens.

## Behaviour (JS)
Class `HSInputNumber`, source `assets/js/preline/input-number.js` (v4.2.0).

| Attribute | Where | Effect |
|---|---|---|
| `data-hs-input-number` | wrapper | marks the instance; value parsed as JSON options |
| `data-hs-input-number-input` | the `<input>` | the value carrier — **required**, first match wins |
| `data-hs-input-number-increment` | a button | **required for listeners** — `init()` is `createCollection(...)` then `this.input && this.increment && this.build()`, so without it the instance exists but nothing is wired |
| `data-hs-input-number-decrement` | a button | optional at build; see gotcha about `destroy()` |

Options:

| Option | Default | Meaning |
|---|---|---|
| `min` | `0` | lower clamp. **Not** `-Infinity` |
| `max` | `null` → `Number.MAX_SAFE_INTEGER` | upper clamp |
| `step` | `1` | only honoured when `> 0`; otherwise falls back to `1` |
| `forceBlankValue` | `false` | when `true`, a non-numeric/empty input is left blank instead of coerced to `0` |

Init: `window.addEventListener('load', () => HSInputNumber.autoInit())`, scanning `[data-hs-input-number]:not(.--prevent-on-load-init)`; collection is `window.$hsInputNumberCollection`. Manual: `new HSInputNumber(el, options)`.

API: `HSInputNumber.getInstance(target, isInstance?)` — `true` → `{id, element}` (the form the doc `.js` uses), omitted → the instance · `HSInputNumber.autoInit()` (prunes detached elements first) · `element.destroy()` (drops the `disabled` class, un-disables both buttons, removes listeners, leaves the collection).

Events on every value change — button click **and** typing: `instance.on('change', fn)` with `{ inputValue: number }`, and the DOM `CustomEvent` `change.hs.inputNumber` on the wrapper with `event.detail.payload = { inputValue: number }`.

State: at `min` or `max` the wrapper gains the class `disabled` and the corresponding button gets a real `disabled` attribute (only if it is a `BUTTON` or `INPUT` tag).

## Gotchas
- **`min` defaults to `0`, not `-Infinity`.** Without an explicit `min` the decrement button is disabled at build time whenever `value <= 0`, and typing `-5` snaps back to `0`. `negative-value.html` exists solely because of this.
- **`destroy()` throws when a button is missing.** It dereferences `this.input`, `this.increment` and `this.decrement` unguarded (`this.decrement.removeAttribute('disabled')`), while `build()`/`changeValue()` guard with `this.decrement &&`. `button-disabled.html` ships exactly that shape (decrement has no `data-hs-input-number-decrement`) — calling `destroy()` on it is a `TypeError`.
- **No increment attribute = a registered instance that does nothing.** `init()` is `this.createCollection(window.$hsInputNumberCollection, this)` *then* `this.input && this.increment && this.build()`. The collection entry is created unconditionally, so `getInstance()` still returns something; only `build()` is skipped, so a decrement-only stepper has no listeners and no error.
- **`disabled` on the input disables both buttons**, via `build()` → `this.input.hasAttribute('disabled') && this.disableButtons()`. You cannot have a read-only display with working buttons this way; drop `disabled` and use `readonly` if that is the intent.
- **Non-numeric text is scrubbed, not rejected.** `cleanAndExtractNumber` keeps digits, the first `.`, and a leading `-`; `"12ab.3.4"` becomes `12.34`. Set `forceBlankValue: true` if an empty field must stay empty rather than become `0`.
- **`step` must be `> 0`.** `{"step": -1}` or `{"step": 0}` is ignored and reverts to `1`; there is no "decrement by a different step".
- **Two spinner suppressions are both needed.** The inline `style="-moz-appearance: textfield;"` handles Firefox; `[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none` handles Chromium/WebKit. Dropping the inline style re-exposes the native arrows in Firefox only.
- **`tabindex="-1"` on the buttons is deliberate in most variants** — keyboard users are expected to type in the number field. The stacked variants (`button-vertically-stacked`, `buttons-horizontally-stacked`) omit it, so tab order differs between variants. `aria-label="Increase"`/`"Decrease"` and `aria-roledescription="Number field"` are load-bearing for screen readers; there is no visible label.
- **Validation colour is raw Tailwind.** `validation-states.html` uses `border-red-500` / `text-red-500`, which are identical in light and dark under moon (`destructive` = `red-500` in both) — but they are *not* wired to the `destructive` token, so a theme change will not move them.
- **The vertical-stacked variant is the only `muted`-based one.** `muted` is `gray-50`/`neutral-800`, the card is `bg-layer` = `white`/`neutral-800`: in light the buttons sit slightly darker than the card, in dark they are the *same* colour. Only the `divide-line-2` / `border-s border-line-2` rules separate them in dark mode — drop those and the buttons vanish into the card.
- **Re-init after dynamic render.** Mounting the markup after `load` yields no instance. `HSInputNumber.autoInit()` is idempotent (collection-checked) — call it in a mount effect.

## Copy-paste base
`examples/advanced-forms/input-number/example.html`

```html
<!-- Input Number -->
<div class="py-2 px-3 bg-surface rounded-lg" data-hs-input-number>
  <div class="w-full flex justify-between items-center gap-x-5">
    <div class="grow">
      <input class="w-full p-0 bg-transparent border-0 text-foreground placeholder:text-muted-foreground-1 focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" style="-moz-appearance: textfield;" type="number" aria-roledescription="Number field" value="1" data-hs-input-number-input>
    </div>
    <div class="flex justify-end items-center gap-x-1.5">
      <button type="button" class="size-6 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-md bg-layer border border-layer-line text-layer-foreground shadow-2xs hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus disabled:opacity-50 disabled:pointer-events-none" tabindex="-1" aria-label="Decrease" data-hs-input-number-decrement>
        <svg class="shrink-0 size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>
      </button>
      <button type="button" class="size-6 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-md bg-layer border border-layer-line text-layer-foreground shadow-2xs hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus disabled:opacity-50 disabled:pointer-events-none" tabindex="-1" aria-label="Increase" data-hs-input-number-increment>
        <svg class="shrink-0 size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
      </button>
    </div>
  </div>
</div>
<!-- End Input Number -->
```
