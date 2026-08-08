---
component: strong-password
label: Strong Password
category: advanced-forms
docs: https://preline.co/docs/components/strong-password.html
examples: 6
js: HSStrongPassword
tokens: [foreground, primary-focus, muted-foreground-1, layer, layer-line, primary, popover, popover-line, layer-foreground, layer-hover, layer-focus, surface, surface-line, surface-foreground, surface-hover, surface-focus]
---

# Strong Password

A live strength meter: `HSStrongPassword` watches a password `<input>` and renders one strip per passed rule, optionally driving a checklist of hints inline or in a popover.

## When to use
- Signup / change-password forms where you want the user to see which rules they still fail.
- Pair with `toggle-password` on the same input — they are independent plugins and do not conflict (different attributes, different targets).
- Do NOT treat it as validation. It never blocks submit, never sets `setCustomValidity`, and runs entirely client-side; the server must re-check.
- Do NOT use for a single boolean "password ok" hint — a plain `<p class="text-sm">` is cheaper than five DOM-scanning rule rows.

## Anatomy

Reduced skeleton (classes copied from `examples/advanced-forms/strong-password/with-indicator-and-hints.html`):

```html
<!-- the watched field: any id, referenced by "target" -->
<input type="password" id="pw" class="py-2.5 sm:py-3 px-4 block w-full bg-layer border-layer-line rounded-md sm:text-sm text-foreground placeholder:text-muted-foreground-1 focus:border-primary-focus focus:ring-primary-focus">

<!-- strips host: JS WIPES its innerHTML and appends one <div> per available check -->
<div data-hs-strong-password='{
       "target": "#pw",
       "hints": "#pw-hints",
       "stripClasses": "hs-strong-password:opacity-100 hs-strong-password-accepted:bg-teal-500 h-2 flex-auto rounded-full bg-primary opacity-50 mx-1"
     }' class="flex mt-2 -mx-1"></div>

<!-- hints host (optional). In mode:"popover" THIS element is the popover. -->
<div id="pw-hints">
  <!-- label array is indexed by strength 0..N -->
  <span data-hs-strong-password-hints-weakness-text='["Empty","Weak","Medium","Strong","Very Strong","Super Strong"]' class="text-sm font-semibold text-foreground"></span>

  <!-- one row per rule; the row itself carries the hs-strong-password-active: variant -->
  <li data-hs-strong-password-hints-rule-text="min-length" class="hs-strong-password-active:text-teal-500 flex items-center gap-x-2">
    <span class="hidden" data-check>...check icon...</span>
    <span data-uncheck>...cross icon...</span>
    Minimum number of characters is 6.
  </li>
</div>
```

Rule keys are fixed: `lowercase`, `uppercase`, `numbers`, `special-characters`, `min-length`.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Meter only | Default strength meter | `examples/advanced-forms/strong-password/basic-usage.html` | Baseline. `target` + `stripClasses` only; no hints, no weakness label. 5 strips. |
| Custom minimum length | Minimum length | `examples/advanced-forms/strong-password/minLength.html` | Adds `"minLength": "8"` (a JSON **string** — see Gotchas). Everything else identical to baseline. |
| Inline checklist | Strength indicator with hints | `examples/advanced-forms/strong-password/with-indicator-and-hints.html` | Adds `hints` pointing at a plain `<div>`, a `data-hs-strong-password-hints-weakness-text` label, and 5 `data-hs-strong-password-hints-rule-text` rows with `[data-check]`/`[data-uncheck]` spans. |
| Popover checklist | Popover hints | `examples/advanced-forms/strong-password/working-with-popover.html` | Adds `"mode": "popover"`. The `hints` element is now the popover itself (`hidden absolute z-10 w-full bg-popover border border-popover-line shadow-xl rounded-lg p-4`) with the strips nested inside it; needs a `relative` ancestor. No weakness label. |
| Custom rule set | Custom special character set | `examples/advanced-forms/strong-password/api.html` | Built on the **popover** variant (`"mode": "popover"`, same `hidden absolute z-10 w-full bg-popover border border-popover-line shadow-xl rounded-lg p-4` host, no weakness label), plus `"checksExclude": ["lowercase", "min-length"]` and `"specialCharactersSet": "&!@"`. Only 3 strips render and only the 3 surviving rule rows are listed. |
| Destroy / reinit | Destroy and reinitialize | `examples/advanced-forms/strong-password/destroy-and-reinitialize.html` (+ `.js`) | Same as the inline-checklist variant plus two buttons calling `HSStrongPassword.getInstance(el, true)` → `element.destroy()` and `HSStrongPassword.autoInit()`. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` | Password input resting fill (`bg-layer`) | `white` | `neutral-800` |
| `layer-line` | Password input border | `gray-200` | `neutral-700` |
| `foreground` | Input text, "Level:" label, section headings | `gray-800` | `neutral-200` |
| `muted-foreground-1` | Placeholder + resting rule-row text | `gray-600` | `neutral-400` |
| `primary-focus` | Input focus border + ring | `gray-900` | `neutral-300` |
| `primary` | Strip fill (`bg-primary opacity-50`, `opacity-100` once passed) | `gray-800` | `white` |
| `popover` | Popover-mode hints panel fill | `white` | `neutral-900` |
| `popover-line` | Popover border — the only floating-panel border under moon that is NOT transparent (`dropdown-line`, `select-line`, `overlay-line`, `tooltip-line` all are) | `gray-100` | `neutral-700` |
| `layer-foreground` | "Destroy" button label (destroy/reinit variant) | `gray-800` | `white` |
| `layer-hover` / `layer-focus` | "Destroy" button hover/focus fill | `gray-50` | `neutral-700` |
| `surface` | "Reinitialize" button fill | `gray-100` | `neutral-700` |
| `surface-line` | "Reinitialize" button border — transparent both modes | `transparent` | `transparent` |
| `surface-foreground` | "Reinitialize" button label | `gray-800` | `neutral-200` |
| `surface-hover` / `surface-focus` | "Reinitialize" button hover/focus fill | `gray-200` | `neutral-600` |

## Behaviour (JS)

Class `HSStrongPassword` (`assets/js/preline/strong-password.js`).

Init: `HSStrongPassword.autoInit()` on `window load`; skips `.--prevent-on-load-init` and elements already in `window.$hsStrongPasswordCollection`. Manual: `new HSStrongPassword(el, options)`.

| Attribute | Purpose |
|---|---|
| `data-hs-strong-password` | Strips host + JSON options |
| `data-hs-strong-password-hints-weakness-text` | JSON array of labels, indexed by current strength |
| `data-hs-strong-password-hints-rule-text` | One rule row; value is the rule key |
| `data-check` / `data-uncheck` | The two icon spans inside a rule row (both required) |

Options and defaults from the constructor: `target` (selector or element, required) · `hints` (selector or element, null) · `stripClasses` (null) · `minLength` (**6**) · `mode` (`"default"` \| `"popover"`) · `popoverSpace` (**10** px) · `checksExclude` (`[]`) · `specialCharactersSet` (default `` !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~ ``).

Mechanism per keystroke — **up to three separate `input` listeners on the target**, not one:
1. `build()` binds the first → `setStrength(value)` → `checkStrength(value)` runs the regexes for each of `availableChecks` (`["lowercase","uppercase","numbers","special-characters","min-length"]` minus `checksExclude`). Empty value forces strength `0` (`value.length || (strength = 0)`), and the result is stored on `this.strength` / `this.passedRules`.
2. Still inside `checkStrength`: `strength === availableChecks.length` → `.accepted` on the strips host, else removed.
3. `setStrength` then calls `hideStrips(strength)` — `.passed` onto child strips at index `< strength`, removed from the rest — and fires `change`.
4. `buildWeakness()` and `buildRules()` (only when `hints` is set) bind the other two listeners, each body wrapped in `setTimeout(...)`; that deferral is what makes them read the `this.strength` step 1 just wrote. `setWeaknessText()` writes `labels[this.strength]`; `setRulesText()` calls `checkIfPassed()` per row, adding/removing `.active` and flipping `hidden` between `[data-check]` and `[data-uncheck]`.

Variants (`node_modules/preline/src/plugins/strong-password/variants.css`, imported through `assets/css/variants.css`):
`hs-strong-password:` → `&.passed` **or** `.passed &` · `hs-strong-password-accepted:` → `&.accepted` **or** `.accepted &` · `hs-strong-password-active:` → `&.active` **only** · `hs-password-active:` → `&.active` or `.active &` (that last one is what `toggle-password` uses; it lives in this plugin's file).

Popover mode adds `focus`/`blur` listeners on the target: focus swaps `hidden`→`block` and calls `recalculateDirection()` (adds `top-full` or `bottom-full` plus an inline `margin-top`/`margin-bottom` of `popoverSpace`); blur removes `block`, `bottom-full`, `top-full` and clears both inline margins. The module also binds a `document` `scroll` listener that re-runs `recalculateDirection()` on whichever instance has `isOpened`.

Events: `instance.on('change', {strength, rules})` and the DOM `CustomEvent` **`change.hs.strongPassword`** on the strips host (`detail.payload = {strength, rules}`; `rules` is a `Set`).
Statics: `HSStrongPassword.getInstance(target, isInstance)` · `autoInit()`. `destroy()` only detaches the five listeners and drops the collection entry.

## Gotchas

- **`getInstance(el)` returns a DOM element here, not an instance.** The source is `return i ? (e ? i : i.element.el) : null` — one `.el` deeper than `HSTogglePassword`/`HSCopyMarkup`, which return `i.element`. Always call `HSStrongPassword.getInstance(el, true)` and destructure `{element}` (exactly what `destroy-and-reinitialize.js` does); `getInstance(el).destroy()` throws.
- **A rule row missing `[data-check]` or `[data-uncheck]` throws on every keystroke.** `checkIfPassed()` dereferences both `querySelector` results with no null check. Both spans are mandatory even if one is visually empty.
- **The weakness label array must have `availableChecks.length + 1` entries.** It is indexed `labels[this.strength]`, strength ranges `0..N`. With the default 5 checks you need 6 labels, and the two files that carry a label ship exactly 6 (`with-indicator-and-hints.html`, `destroy-and-reinitialize.html`). `checksExclude` shortens that range, so copying the 6-entry array into a config that excludes 2 checks leaves everything past index 3 dead. Both popover files (`working-with-popover.html`, `api.html`) ship no `data-hs-strong-password-hints-weakness-text` at all — `this.weakness` is `null`, `buildWeakness()` is skipped, and that second `input` listener is never bound.
- **`hs-strong-password-active:` has no descendant form.** Its variant is `&.active` only, while `hs-strong-password:` and `hs-strong-password-accepted:` also match `.passed &` / `.accepted &`. Put the active styling on the element carrying `data-hs-strong-password-hints-rule-text`; on a child `<span>` it silently never applies.
- **`buildStrips()` sets `this.el.innerHTML = ""`.** Anything you author inside the `data-hs-strong-password` div is destroyed at init and again on every `autoInit()`. Strip count equals `availableChecks.length`, so `checksExclude` changes the number of bars.
- **The "passed" colour is not a moon token.** `hs-strong-password-accepted:bg-teal-500` and `hs-strong-password-active:text-teal-500` are literal Tailwind palette colours, identical in light and dark. The unpassed strip is `bg-primary opacity-50` = `gray-800` light but **`white`** dark — so under moon the meter reads dark-on-light then white-on-dark, and only the accepted state is theme-invariant.
- **Rule rows for excluded checks are removed from the DOM.** `buildHints()` runs `checksExclude.includes(key) && t.remove()` — you can leave all five `<li>`s in the template and let the config prune them, but they are gone after init, not hidden.
- **Popover mode positions itself with inline styles.** The `hints` element must be `absolute` inside a `relative` ancestor (`<div class="relative flex-1">` in the examples) and must start `hidden`. Do not add your own `top-*`/`mt-*` — `recalculateDirection()` overwrites `style.marginTop`/`style.marginBottom` and toggles `top-full`/`bottom-full`.
- **`minLength` ships as the JSON string `"8"`.** The plugin never parses it; `value.length >= "8"` works by JS coercion, but `instance.minLength` is a string if you read it back.
- **`destroy()` leaves the DOM dirty.** It removes listeners only — the strips, `.accepted`, `.passed` and `.active` classes stay as they were. `autoInit()` afterwards rebuilds the strips from scratch (`innerHTML = ""`) and re-reads the current input value, so the round-trip is visually consistent; a partial teardown is not.
- The strength meter is advisory. It never touches `required`, `pattern`, or form validity — server-side policy is still the only enforcement.

## Copy-paste base

`examples/advanced-forms/strong-password/basic-usage.html`

```html
<!-- Strong Password -->
<div class="max-w-sm">
  <div class="flex mb-2">
    <div class="flex-1">
      <input type="password" id="hs-strong-password-base" class="py-2.5 sm:py-3 px-4 block w-full bg-layer border-layer-line rounded-md sm:text-sm text-foreground placeholder:text-muted-foreground-1 focus:border-primary-focus focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none" placeholder="Enter password">
      <div data-hs-strong-password='{
            "target": "#hs-strong-password-base",
            "stripClasses": "hs-strong-password:opacity-100 hs-strong-password-accepted:bg-teal-500 h-2 flex-auto rounded-full bg-primary opacity-50 mx-1"
          }' class="flex mt-2 -mx-1"
      ></div>
    </div>
  </div>
</div>
<!-- End Strong Password -->
```
