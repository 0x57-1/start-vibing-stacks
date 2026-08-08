---
component: dark-mode
label: Dark Mode
category: customization
docs: https://preline.co/docs/dark-mode.html
examples: 5
js: HSThemeSwitch
tokens: [foreground, surface, surface-1, surface-line, surface-foreground, surface-hover, surface-focus, switch, primary-checked, primary-hover, primary-focus, muted-foreground-2, dropdown, dropdown-line, dropdown-item-foreground, dropdown-item-hover, dropdown-item-focus, layer, layer-line, layer-foreground, layer-hover, layer-focus]
---

# Dark Mode

The control surface that writes the `light` / `dark` / `auto` class onto `<html>` and persists the
choice in `localStorage["hs_theme"]`. Orthogonal to `data-theme` — see `reference/theming.md` §3.

## When to use

- You need a user-facing appearance toggle. Three shipped shapes: a checkbox switch, a two-button
  pair, a dropdown with an explicit *Auto (System)* option.
- You only need the *page* to respond to the OS setting and never offer a control: skip this
  component entirely, ship no JS, and let `@custom-variant dark` + the `.dark` token block do it.
- **Do not** use this to switch *themes* (`data-theme="theme-moon"`). That is `themes` — a different,
  JS-less mechanism. `HSThemeSwitch` never touches `data-theme`.
- **Do not** hand-roll `classList.toggle('dark')`. You lose the anti-FOUC style freeze, the
  `on-hs-appearance-change` event other components listen to, and the `auto` media observer.

## Anatomy

Two mount selectors, two constructor types. `autoInit()` scans **both**, so a page may mix them.

**A — checkbox (`type: 'change'`)**, verbatim shape from `examples/customization/dark-mode/switcher.html`:

```html
<input data-hs-theme-switch type="checkbox" id="darkSwtich" class="peer sr-only">
<!--   ^ mount selector #1. JSON value = options. checked ⇢ 'dark', unchecked ⇢ 'default' -->
```

**B — click target (`type: 'click'`)**, from `button-toggle.html` / `select.html`:

```html
<button type="button" class="hs-dark-mode-active:hidden block hs-dark-mode" data-hs-theme-click-value="dark">
<!--                         ^ visibility variant       ^ marker   ^ mount selector #2; value = theme to set -->
```

Every mount selector ends in `:not(.--prevent-on-load-init)`.

`hs-dark-mode-active:` / `hs-dark-mode` are Tailwind `@custom-variant`s declared in
`assets/css/src/plugins/theme-switch/variants.css`, reached only through **line 24** of
`assets/css/variants.css`. That source file is **not part of this offline mirror** — grep the real
`node_modules/preline/src/plugins/theme-switch/variants.css` if you need its body.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Manual `.dark` | Toggling dark mode manually | `examples/customization/dark-mode/hs-dark-mode-user.css` | No JS at all. `<html class="dark">` plus a `dark:` utility (`bg-white dark:bg-black`). Despite the `.css` extension the file is HTML. The baseline every other variant automates |
| Switcher | Switcher | `examples/customization/dark-mode/switcher.html` (+ `.js`) | `<input data-hs-theme-switch type="checkbox" class="peer sr-only">` inside a `<label>`; two `<span>`s draw track and knob off `peer-checked:`. Writes **`dark` / `default`** — never the string `light` |
| Button toggle | Button toggle | `examples/customization/dark-mode/button-toggle.html` (+ `.js`) | Two `<button>`s, `data-hs-theme-click-value="dark"` and `="light"`, each hidden in the opposite state via `hs-dark-mode-active:hidden block` / `hs-dark-mode-active:block hidden`. Writes **`dark` / `light`** |
| Select | Select | `examples/customization/dark-mode/select.html` (+ `.js`) | An `hs-dropdown` whose three menu buttons carry `data-hs-theme-click-value="default" / "dark" / "auto"`. The only shipped way to reach `auto`. Needs `HSDropdown` on the page as well |
| Destroy and reinitialize | Destroy and Reinitialize | `examples/customization/dark-mode/destroy-and-reinitialize.html` (+ `.js`) | The `button-toggle` pair wrapped in `#hs-theme-switch-to-destroy`, plus two control buttons (`#hs-destroy-theme-switch`, `#hs-auto-init-theme-switch`). The `.js` is the canonical teardown: `const {element} = HSThemeSwitch.getInstance(el, true); element.destroy();` per switch, then `HSThemeSwitch.autoInit()` to remount |

`switcher.js`, `button-toggle.js` and `select.js` are **byte-identical to each other** — all three are
the same anti-FOUC `<head>` snippet, not per-variant wiring.

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `surface-1` | switcher track, unchecked (`bg-surface-1`) | `gray-200` | `neutral-600` |
| `primary-checked` | switcher track, checked (`peer-checked:bg-primary-checked`) | `gray-800` | `white` |
| `switch` | switcher knob (`bg-switch`) | `white` | `neutral-800` |
| `foreground` | button-toggle icon colour (`text-foreground`) | `gray-800` | `neutral-200` |
| `surface-hover` | button-toggle hover fill | `gray-200` | `neutral-600` |
| `surface-focus` | button-toggle focus fill | `gray-200` | `neutral-600` |
| `muted-foreground-2` | select trigger icon, resting | `gray-700` | `neutral-300` |
| `primary-hover` | select trigger icon, hover | `gray-900` | `neutral-300` |
| `primary-focus` | select trigger icon, focus | `gray-900` | `neutral-300` |
| `dropdown` | select menu fill | `white` | `neutral-900` |
| `dropdown-line` | select menu border | `transparent` | `transparent` |
| `dropdown-item-foreground` | menu item text | `gray-800` | `neutral-200` |
| `dropdown-item-hover` | menu item hover fill | `gray-100` | `neutral-800` |
| `dropdown-item-focus` | menu item focus fill | `gray-100` | `neutral-800` |
| `layer`, `layer-line`, `layer-foreground`, `layer-hover`, `layer-focus` | the *Destroy* control button | `white`, `gray-200`, `gray-800`, `gray-50`, `gray-50` | `neutral-800`, `neutral-700`, `white`, `neutral-700`, `neutral-700` |
| `surface`, `surface-line`, `surface-foreground` | the *Reinitialize* control button | `gray-100`, `transparent`, `gray-800` | `neutral-700`, `transparent`, `neutral-200` |

## Behaviour (JS)

Source of truth: `assets/js/preline/theme-switch.js` (Preline 4.2.0).

| Surface | Detail |
|---|---|
| Init | `window` `load` → `HSThemeSwitch.autoInit()`. It prunes `window.$hsThemeSwitchCollection` of detached elements, then mounts `[data-hs-theme-switch]:not(.--prevent-on-load-init)` as `new HSThemeSwitch(el, {type:'change'})` and `[data-hs-theme-click-value]:not(.--prevent-on-load-init)` as `{type:'click'}`, skipping anything already in the collection |
| Options | JSON in `data-hs-theme-switch`, merged **under** the constructor's 2nd arg. `theme` (falls back to `localStorage.hs_theme`, else `'default'`), `type` (`'change'` \| `'click'`) |
| Constructor side effect | `init()` calls `setAppearance()` immediately **when `theme !== 'default'`** — mounting a switch can repaint the page before any user interaction |
| `change` type | Sets `el.checked = (theme === 'dark')`, binds `change`. Handler sends `'dark'` when checked, **`'default'`** when not |
| `click` type | Reads `data-hs-theme-click-value` **once, at construction**, binds `click`, sends that literal string |
| `setAppearance(theme, save=true, dispatch=true)` | Appends `<style data-hs-appearance-onload-styles>*{transition: unset !important;}` to `<head>`; writes `localStorage.hs_theme`; resolves `'default'`→`light` and `'auto'`→the `prefers-color-scheme` match; removes `light dark default auto` from `<html>`; adds the resolved class — **plus `auto` itself when theme is `'auto'`** (two classes); removes the freeze style on the next tick; dispatches `on-hs-appearance-change` on `window` with `detail` = the *unresolved* string |
| System observer | A single static `matchMedia('(prefers-color-scheme: dark)')` listener, attached **only while `localStorage.hs_theme === 'auto'`**, re-evaluated on every interaction. It calls `setAppearance('auto', false)` — no write-back |
| Statics | `HSThemeSwitch.autoInit()`, `getInstance(target, isInstance)` |
| Instance | `destroy()` only — removes the listener for its own `type` and filters itself out of the collection. There is no `update()` |

## Gotchas

- **"Light" has two spellings and they are not interchangeable.** The checkbox writes `default`; the
  button toggle writes `light`. The anti-FOUC head script only branches on `light`, `dark` and
  `auto` — `hs_theme === 'default'` satisfies neither `isLightOrAuto` nor `isDarkOrAuto`, so all four
  of its `else if`s fail and it stamps **nothing**. Server-render a `dark` class, let the user switch
  off via the checkbox, reload → the page comes back dark. Ship one shape per app, or normalise the
  stored value yourself.
- **The checkbox-sync listener never registers.** `theme-switch.js` (and `index.js`) guard it as
  `window.$hsThemeSwitchCollection && window.addEventListener('on-hs-appearance-change', …)` at
  *module evaluation*, when the collection does not exist yet — the array is first created inside
  `autoInit()`, later. So a checkbox switch does **not** re-check itself when a different control
  changes the appearance. Two switches on one page drift apart. Listen for
  `on-hs-appearance-change` yourself and set `.checked`.
- **The anti-FOUC snippet is not optional and does not ship in the bundle.** `switcher.js` is an
  inline `<script>` for `<head>`; without it `<html>` has no class until `window load`, so the first
  paint is light and then snaps. The file's own comment says so.
- **`auto` leaves two classes on `<html>`** (`auto` *and* the resolved `light`/`dark`). Code that
  reads appearance with `html.className === 'dark'` breaks; use `classList.contains('dark')`.
- **The `auto` observer is only live while the stored value is `auto`.** Pick `dark` explicitly and
  the OS listener is removed — which is correct, but it also means nothing reacts to the OS until
  the user picks `auto` again through the `select` variant. `switcher` and `button-toggle` can never
  reach `auto`.
- **`data-hs-theme-click-value` is read once, at construction.** Changing the attribute later does
  nothing; `autoInit()` skips already-mounted elements. `destroy()` then re-init — the
  `destroy-and-reinitialize` example is that recipe.
- **`destroy()` must be called per switch element, not per widget.** In the button-toggle shape each
  of the two `<button>`s is its own instance; the example's `querySelectorAll('… [data-hs-theme-click-value]')`
  loop is deliberate.
- **Under moon the select menu has no visible border.** `dropdown-line` is `transparent` in both
  modes, so `border border-dropdown-line` draws nothing and the menu is separated by `shadow-md`
  alone. Do not "fix" the border by swapping in `border-line-2` unless you intend to diverge.
- **Icon visibility is driven by CSS variants, not by JS.** `hs-dark-mode-active:hidden block` /
  `hs-dark-mode-active:block hidden` both require the `hs-dark-mode` marker class on the same
  element. Drop the marker and both icons show at once.
- The `select` variant is a full `hs-dropdown` — it needs `HSDropdown` mounted too, so
  `HSStaticMethods.autoInit()` (or both modules) rather than `theme-switch.js` alone.

## Copy-paste base

`examples/customization/dark-mode/switcher.html` — verbatim:

```html
<label for="darkSwtich" class="relative inline-block w-11 h-6 cursor-pointer">
    <input data-hs-theme-switch type="checkbox" id="darkSwtich" class="peer sr-only">
    <span class="absolute inset-0 bg-surface-1 rounded-full transition-colors duration-200 ease-in-out peer-checked:bg-primary-checked peer-disabled:opacity-50 peer-disabled:pointer-events-none"></span>
    <span class="absolute top-1/2 inset-s-0.5 -translate-y-1/2 size-5 bg-switch rounded-full shadow-sm transition-transform! duration-200 ease-in-out peer-checked:translate-x-full"></span>
  </label>
```

Plus, in `<head>`, `examples/customization/dark-mode/switcher.js` verbatim (identical to
`button-toggle.js` and `select.js`):

```html
<script>
  // This code should be added to <head>.
  // It's used to prevent page load glitches.
  const html = document.querySelector('html');
  const isLightOrAuto = localStorage.getItem('hs_theme') === 'light' || (localStorage.getItem('hs_theme') === 'auto' && !window.matchMedia('(prefers-color-scheme: dark)').matches);
  const isDarkOrAuto = localStorage.getItem('hs_theme') === 'dark' || (localStorage.getItem('hs_theme') === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isLightOrAuto && html.classList.contains('dark')) html.classList.remove('dark');
  else if (isDarkOrAuto && html.classList.contains('light')) html.classList.remove('light');
  else if (isDarkOrAuto && !html.classList.contains('dark')) html.classList.add('dark');
  else if (isLightOrAuto && !html.classList.contains('light')) html.classList.add('light');
</script>
```

Note the typo `darkSwtich` is upstream's, in the shipped file. Rename both halves if you copy it.
