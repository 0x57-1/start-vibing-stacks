---
component: toggle-count
label: Toggle Count
category: advanced-forms
docs: https://preline.co/docs/components/toggle-count.html
examples: 3
js: HSToggleCount
tokens: [foreground, surface, surface-foreground, layer, line-2, surface-1, primary-checked, switch, layer-line, layer-foreground, layer-hover, layer-focus, surface-line, surface-hover, surface-focus]
---

# Toggle Count

Animates a number between two values (`min` <-> `max`) whenever a controlling input fires `change` -- the monthly/annual price swap on a pricing grid.

## When to use
- A pricing grid where one control flips every card between two price points.
- Any "two states, two numbers" readout where the transition should be counted rather than swapped.
- **Do not** use it for a 3+ state selector: the plugin stores a single boolean and has no notion of *which* option was picked (see Gotchas).
- **Do not** use it to render live/derived numbers -- it owns `innerText` of its element and only ever animates between the two literals in the attribute. For a user-editable numeric field use `input-number`.

## Anatomy

Reduced skeleton (all classes appear verbatim in the example files):

```html
<!-- 1. the CONTROL. `id` is what `target` points at. -->
<input type="checkbox" id="toggle-count" class="peer sr-only">

<!-- 2. one counter per card; each has its OWN min/max, all share one target -->
<div class="flex gap-x-1">
  <span class="text-xl font-normal text-foreground">$</span>   <!-- sibling, NOT a child: survives the innerText rewrite -->
  <p data-hs-toggle-count='{ "target": "#toggle-count", "min": 19, "max": 29 }'
     class="text-foreground font-semibold text-3xl tabular-nums">
    19                                                          <!-- pre-JS value; = min unless target ships checked -->
  </p>
</div>
```

The control is *not* required to be an input: `checkbox.html` targets the `<div>` that wraps two radios and relies on `change` bubbling.

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| `checkbox` | Segmented pricing toggle | `examples/advanced-forms/toggle-count/checkbox.html` | Two `<input type="radio">` stretched `size-full` over their labels inside a `bg-surface` pill track; `target` is the **wrapper div** `#toggle-count`, not an input. Active segment painted by `checked:before:bg-layer` + `checked:before:shadow-2xs`; visible text is a `relative z-10` sibling `<span>`. Annual is pre-`checked` and shows `min`. |
| `switch` | Switch pricing toggle | `examples/advanced-forms/toggle-count/switch.html` | Classic `peer sr-only` checkbox with two absolutely-positioned spans: track (`bg-surface-1` -> `peer-checked:bg-primary-checked`) and knob (`bg-switch` + `peer-checked:translate-x-full`). `target` is the checkbox itself. Text labels flank the switch. |
| `destroy-and-reinitialize` | Destroy and reinitialize | `examples/advanced-forms/toggle-count/destroy-and-reinitialize.html` (+ `.js`) | Byte-identical to `checkbox.html` for its first 74 lines, plus two buttons wired to `HSToggleCount.getInstance(el, true).element.destroy()` and `HSToggleCount.autoInit()`. Adds the `layer-*` / `surface-*` button token pair. Both buttons ship a Preline copy-paste slip: their visible labels read "Destroy toggle password" / "Reinitialize toggle password". |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `foreground` | `text-foreground` -- the counting number, the `$` glyph, plan name, switch labels | `gray-800` | `neutral-200` |
| `surface` | `bg-surface` -- resting track of the segmented pill; also the Reinitialize button fill | `gray-100` | `neutral-700` |
| `surface-foreground` | `text-surface-foreground` -- segment label text on that track; also the Reinitialize button label | `gray-800` | `neutral-200` |
| `layer` | `checked:before:bg-layer` -- fill of the ACTIVE segment pill; `bg-layer` -- Destroy button fill | `white` | `neutral-800` |
| `line-2` | `border-line-2` -- outer border of the price card grid | `gray-200` | `neutral-700` |
| `surface-1` | `bg-surface-1` -- switch track, OFF state | `gray-200` | `neutral-600` |
| `primary-checked` | `peer-checked:bg-primary-checked` -- switch track, ON state | `gray-800` | `white` |
| `switch` | `bg-switch` -- the sliding knob | `white` | `neutral-800` |
| `layer-line` | `border-layer-line` -- Destroy button border | `gray-200` | `neutral-700` |
| `layer-foreground` | `text-layer-foreground` -- Destroy button label | `gray-800` | `white` |
| `layer-hover` | `hover:bg-layer-hover` -- Destroy button hover fill | `gray-50` | `neutral-700` |
| `layer-focus` | `focus:bg-layer-focus` -- Destroy button focus fill | `gray-50` | `neutral-700` |
| `surface-line` | `border-surface-line` -- Reinit button border (see Gotchas) | `transparent` | `transparent` |
| `surface-hover` | `hover:bg-surface-hover` -- Reinit button hover fill | `gray-200` | `neutral-600` |
| `surface-focus` | `focus:bg-surface-focus` -- Reinit button focus fill | `gray-200` | `neutral-600` |

## Behaviour (JS)

Class `HSToggleCount`, exposed as `window.HSToggleCount`. Source: `assets/js/preline/toggle-count.js` (also bundled in `preline.js`).

`data-hs-toggle-count` is both the JSON options blob and the autoInit selector; the class `--prevent-on-load-init` on a counter makes `autoInit()` skip it. Options merge with a second constructor argument, which wins:

| Option | Default | Meaning |
|---|---|---|
| `target` | none | CSS selector string (`document.querySelector`) or an element. The thing whose `change` event drives the counter. |
| `min` | `0` | Value in the un-toggled state. |
| `max` | `0` | Value in the toggled state. |
| `duration` | `700` | Animation length in ms. |

Mechanism:
1. Constructor seeds `isChecked = target.checked || false`.
2. `init()` registers into `window.$hsToggleCountCollection`, writes `el.innerText = String(max)` **immediately (no animation) if `isChecked`**, then binds `change` on `target`.
3. Each `change` flips the boolean and calls `countUp()` (`min` -> `max`) or `countDown()` (`max` -> `min`).
4. `animate()` is a `requestAnimationFrame` loop writing `Math.floor(...)` into `el.innerText`; the last frame lands exactly on the endpoint.

Init path -- **autoInit**. The module registers `window.addEventListener('load', () => HSToggleCount.autoInit())`. `toggle-count` is also a key in the bundle's `COLLECTIONS`, so `HSStaticMethods.autoInit()` and `HSStaticMethods.autoInit(['toggle-count'])` both cover it.

| API | Signature | Notes |
|---|---|---|
| `HSToggleCount.autoInit()` | static | Creates the collection if absent, prunes entries whose `el` left the DOM, then constructs one instance per `[data-hs-toggle-count]:not(.--prevent-on-load-init)` not already in the collection. Idempotent. |
| `HSToggleCount.getInstance(el, isInstance)` | static | `isInstance` truthy -> `{ id, element }`; falsy/omitted -> the instance. `el` may be a selector string. Returns `null` when the element is not in the collection. |
| `instance.destroy()` | method | Removes the `change` listener and drops the entry from `window.$hsToggleCountCollection`. |
| `instance.toggle()` | method | Animates according to the CURRENT `isChecked`; it does **not** flip it. `toggleChange()` is the one that inverts the flag and then calls `toggle()`. |
| `instance.countUp()` / `instance.countDown()` | method | `min` -> `max` / `max` -> `min`, ignoring whatever digits are currently rendered. |

No custom events are fired -- the inherited `on()` / `fireEvent()` are unused here.

## Gotchas
- **It is a blind flip-flop, not a state reader.** `toggleChange()` only inverts `isChecked`; it never inspects which control changed or what value it holds, so a third segment is impossible. `checkbox.html` stays in sync only because a radio group fires `change` on the newly-checked input alone (never on the one being un-checked). Put any second, independently-changing control inside the same `target` and `isChecked` desyncs from the DOM, with nothing that ever resyncs it.
- **`min` is the pre-checked value, not the smaller label.** In `checkbox.html` the *Annual* radio carries `checked` and the markup prints `19` = `min`; clicking *Monthly* counts **up** to `29`. Assign `min`/`max` from which control state ships active, not from the word on the button.
- **A bad `target` selector kills every counter after it.** The constructor evaluates `this.target.checked` *before* the `if (this.target)` guard, so a selector matching nothing throws `TypeError: Cannot read properties of null (reading 'checked')` inside `autoInit()`'s `forEach` -- aborting the loop, leaving all later `[data-hs-toggle-count]` elements silently uninitialised with no visible error other than dead numbers.
- **The first-paint number is yours, not the plugin's.** Nothing is written on init unless `isChecked` is true. Hardcode `min` in the markup or the pre-JS / no-JS render lies.
- **`innerText` is replaced wholesale.** Currency symbols, `/mo` suffixes and `<sup>` must be siblings, never children of the counter -- which is exactly why the examples put `$` in its own `<span>`.
- **Keep `tabular-nums`.** Without it the rAF loop re-measures proportional digits every frame and the card visibly jitters.
- **Re-init after client-side render.** The auto hook is `window` `load` -- not `DOMContentLoaded`, not a MutationObserver. Anything mounted by React/Vue/Inertia afterwards needs an explicit `HSToggleCount.autoInit()`; it dedupes on `el`, so calling it again is safe.
- **`getInstance` is unguarded** -- it reads `window.$hsToggleCountCollection` directly and throws if no autoInit ever ran. `destroy()` leaves the number wherever the animation stopped; it does not restore `min`. A later `autoInit()` re-seeds `isChecked` from `target.checked` (a `<div>` target always yields `false`), so the rebuilt instance believes it is sitting at `min` and the next `change` animates `min -> max` no matter what digits are on screen.
- **Moon dark inversion on the segmented pill.** The track is `bg-surface` (`gray-100` -> `neutral-700`) and the active pill is `checked:before:bg-layer` (`white` -> `neutral-800`). Light mode: active pill *lighter* than track. Dark mode: active pill *darker* than track. That reversal is the theme working as designed -- do not "fix" it by swapping the two.
- **`border-surface-line` is `transparent` in both themes.** The Reinitialize button pairs it with the width utility `border`, so a 1px border-box is reserved but invisible and the button lines up with the sibling `border-layer-line` one. `border` owns the geometry, not the colour token: deleting `border-surface-line` moves nothing, it only lets the border paint in the inherited default colour; deleting `border` is what costs 2px of height.
- **The radio segment relies on paint order, and `checked:before:bg-layer` is why.** The `<input>` is `absolute top-0 inset-e-0 size-full` and comes *after* the `<span>` in the DOM, so without `relative z-10` on the span the checked input's opaque `::before` pill paints straight over the label text (unchecked it would not -- the input itself is `bg-transparent bg-none text-transparent`). Clicking still works either way, since `<label for>` drives the radio; what breaks is the ACTIVE segment's text vanishing. Drop `size-full` instead and the absolutely-positioned radio collapses to its intrinsic box in the corner rather than covering the segment.
- **Switch uses `sr-only`, not `hidden`.** `peer sr-only` keeps the checkbox focusable and in the a11y tree while the two spans paint it; `hidden` / `display:none` would drop it from the tab order and break keyboard toggling.

## Copy-paste base

`examples/advanced-forms/toggle-count/switch.html`

```html
<div id="hs-toggle-count">

  <!-- Switch Toggle -->
  <div class="mb-4 flex justify-center items-center gap-x-3">
    <label for="toggle-count" class="text-sm text-foreground">Monthly</label>
    <label for="toggle-count" class="relative inline-block w-11 h-6 cursor-pointer">
      <input type="checkbox" id="toggle-count" class="peer sr-only">
      <span class="absolute inset-0 bg-surface-1 rounded-full transition-colors duration-200 ease-in-out peer-checked:bg-primary-checked peer-disabled:opacity-50 peer-disabled:pointer-events-none"></span>
      <span class="absolute top-1/2 inset-s-0.5 -translate-y-1/2 size-5 bg-switch rounded-full shadow-sm transition-transform duration-200 ease-in-out peer-checked:translate-x-full"></span>
    </label>
    <label for="toggle-count" class="text-sm text-foreground">Annual</label>
  </div>
  <!-- End Switch Toggle -->

  <!-- Card Grid -->
  <div class="grid grid-cols-3 lg:items-center border border-line-2 rounded-xl">
    <!-- Card -->
    <div class="flex flex-col p-4">
      <h4 class="text-foreground mb-1">Startup</h4>
      <div class="flex gap-x-1">
        <span class="text-xl font-normal text-foreground">$</span>
        <p data-hs-toggle-count='{
            "target": "#toggle-count",
            "min": 19,
            "max": 29
          }' class="text-foreground font-semibold text-3xl tabular-nums">
          19
        </p>
      </div>
    </div>
    <!-- End Card -->

    <!-- Card -->
    <div class="flex flex-col p-4">
      <div class="flex justify-between">
        <h4 class="text-foreground mb-1">Team</h4>
      </div>
      <div class="flex gap-x-1">
        <span class="text-xl font-normal text-foreground">$</span>
        <p data-hs-toggle-count='{
            "target": "#toggle-count",
            "min": 89,
            "max": 99
          }' class="text-foreground font-semibold text-3xl tabular-nums">
          89
        </p>
      </div>
    </div>
    <!-- End Card -->

    <!-- Card -->
    <div class="flex flex-col p-4">
      <h4 class="text-foreground mb-1">Enterprise</h4>
      <div class="flex gap-x-1">
        <span class="text-xl font-normal text-foreground">$</span>
        <p data-hs-toggle-count='{
            "target": "#toggle-count",
            "min": 129,
            "max": 149
          }' class="text-foreground font-semibold text-3xl tabular-nums">
          129
        </p>
      </div>
    </div>
    <!-- End Card -->
  </div>
  <!-- End Card Grid -->
</div>
```
