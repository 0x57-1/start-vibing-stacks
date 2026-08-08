---
component: time-picker
label: TimePicker
category: basic-forms
docs: https://preline.co/docs/components/time-picker.html
examples: 2
js: HSDropdown
tokens: [primary, layer, foreground, primary-foreground, muted-hover, muted-foreground, line-2, primary-focus, scrollbar-track, scrollbar-thumb, layer-line, muted-foreground-1, layer-foreground, primary-hover, layer-hover, layer-focus, dropdown, dropdown-line, dropdown-divider, dropdown-footer]
---

# TimePicker

Two unrelated things under one doc page: a themed native `<input type="time">`, and a **markup-only** hh / mm / AM-PM column panel built out of `HSDropdown` + hidden radios. There is no `HSTimePicker` class.

## When to use
- **Native input** — default choice. Real value in the form, real mobile pickers, zero JS. Use it unless you must control the option set.
- **Custom dropdown** — only when you need to restrict times (15-min slots, business hours) or match the panel to the design system. You must write the selection→input wiring yourself; the example ships none.
- Not for date+time — use Datepicker (`assets/js/preline/datepicker.js`, `HSDatepicker`), which owns time-of-day too.
- Not for free-typed durations; that is a plain text/number input.

## Anatomy

Reduced skeleton of the custom variant (all classes verbatim from `examples/basic-forms/time-picker/custom-design.html`):

```html
<div class="max-w-32">                                   <!-- width owner -->
  <div class="relative w-full">
    <input type="text" class="py-2.5 sm:py-3 ps-4 pe-12 block w-full
      bg-layer border-layer-line rounded-lg sm:text-sm text-foreground
      placeholder:text-muted-foreground-1
      focus:border-primary-focus focus:ring-primary-focus" placeholder="hh:mm aa">

    <div class="absolute inset-y-0 inset-e-0 flex items-center pe-3">
      <div class="hs-dropdown [--auto-close:inside] relative inline-flex">   <!-- HSDropdown root -->
        <button type="button" id="…" class="hs-dropdown-toggle size-7 rounded-full
          bg-layer text-layer-foreground hover:bg-layer-hover focus:bg-layer-focus"
          aria-haspopup="menu" aria-expanded="false">…clock svg…</button>

        <div class="hs-dropdown-menu hidden opacity-0 hs-dropdown-open:opacity-100
          bg-dropdown border border-dropdown-line shadow-xl rounded-lg"
          role="menu" aria-labelledby="…">
          <div class="flex flex-row divide-x divide-dropdown-divider">
            <div class="p-1 max-h-56 overflow-y-auto
                 [&::-webkit-scrollbar-track]:bg-scrollbar-track
                 [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb">   <!-- one per column: hh, mm, am/pm -->
              <label for="hs-cbchlhh00" class="… text-foreground hover:bg-muted-hover
                     has-checked:bg-primary has-checked:text-primary-foreground">
                <input type="radio" id="hs-cbchlhh00" name="hs-cbchlhh"
                       class="hidden border-line-2 text-primary focus:ring-layer">
                <span class="block">00</span>
              </label>
              <!-- … repeated per option … -->
            </div>
          </div>
          <div class="py-2 px-3 flex justify-between border-t border-dropdown-footer">
            <button type="button" class="bg-layer text-layer-foreground hover:text-primary-hover">Now</button>
            <button type="button" class="bg-primary text-primary-foreground hover:bg-primary-hover">OK</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

Three scroll columns share one `divide-x` row; state lives in three radio groups keyed by `name`, not by `id`.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Native time input | Native time input | `examples/basic-forms/time-picker/default-browser.html` | `<input type="time">` with the standard field classes only. 334 bytes, no JS, no panel. |
| Custom dropdown picker | Custom dropdown picker | `examples/basic-forms/time-picker/custom-design.html` | `<input type="text">` + trailing clock button + `hs-dropdown` panel: 24 hour radios (`hs-cbchlhh`), 24 "minute" radios (`hs-cbchlmm`), 2 AM/PM radios (`hs-cbchlcs`), plus a Now / OK footer. 41 KB, 698 lines. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `bg-layer` | Field surface; clock-toggle resting fill; "Now" button fill | `white` | `neutral-800` |
| `border-layer-line` | Field border | `gray-200` | `neutral-700` |
| `text-foreground` | Field text and option labels | `gray-800` | `neutral-200` |
| `placeholder:text-muted-foreground-1` | Field placeholder (`hh:mm aa`) | `gray-600` | `neutral-400` |
| `focus:border-primary-focus` / `focus:ring-primary-focus` | Field focus border + ring; OK-button focus fill; "Now" focus text | `gray-900` | `neutral-300` |
| `text-layer-foreground` | Clock icon colour; "Now" label | `gray-800` | `white` |
| `hover:bg-layer-hover` | Clock-toggle hover fill | `gray-50` | `neutral-700` |
| `focus:bg-layer-focus` | Clock-toggle focus fill | `gray-50` | `neutral-700` |
| `bg-dropdown` | Panel surface | `white` | `neutral-900` |
| `border-dropdown-line` | Panel border — **transparent in both themes** | `transparent` | `transparent` |
| `divide-dropdown-divider` | Vertical rules between hh / mm / am-pm columns | `gray-200` | `neutral-800` |
| `border-dropdown-footer` | Rule above the Now / OK footer | `gray-200` | `neutral-700` |
| `[&::-webkit-scrollbar-track]:bg-scrollbar-track` | Column scrollbar track | `gray-100` | `neutral-700` |
| `[&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb` | Column scrollbar thumb | `gray-300` | `neutral-500` |
| `hover:bg-muted-hover` | Option hover fill | `gray-100` | `neutral-700` |
| `has-checked:bg-primary` / `bg-primary` | Selected option fill; OK button fill | `gray-800` | `white` |
| `has-checked:text-primary-foreground` / `text-primary-foreground` | Selected option label; OK button label | `white` | `neutral-800` |
| `hover:bg-primary-hover` / `hover:text-primary-hover` | OK hover fill; "Now" hover text | `gray-900` | `neutral-300` |
| `has-disabled:text-muted-foreground` | Disabled option label | `gray-500` | `neutral-500` |
| `border-line-2` | Border on the (hidden) radio input | `gray-200` | `neutral-700` |
| `text-primary` | Accent on the (hidden) radio input | `gray-800` | `white` |

## Behaviour (JS)

Native variant: none.

Custom variant rides on **`HSDropdown`** (`assets/js/preline/dropdown.js`, global `window.HSDropdown`). `data-hs-*` attributes are not used — everything is class-driven.

| Hook | Effect |
|---|---|
| `.hs-dropdown` | Component root. `autoInit()` selects `.hs-dropdown:not(.--prevent-on-load-init)` and skips roots already in `window.$hsDropdownCollection`. |
| `.hs-dropdown-toggle` | Resolved as `:scope > .hs-dropdown-toggle`, else `:scope > .hs-dropdown-toggle-wrapper > .hs-dropdown-toggle`, else `el.children[0]`. |
| `.hs-dropdown-menu` | Resolved as `:scope > .hs-dropdown-menu`. **If toggle or menu is missing, `init()` never runs and nothing is bound.** |
| `.hs-dropdown-open:*` | Variant driven by the `open` class the instance adds to the root. |
| `[--auto-close:inside]` | Read via `getClassProperty(el,'--auto-close','true')`. `inside` makes the global click handler skip this root, so clicks *inside* the panel do not close it. Other values: `outside`, `false`. |

Other CSS-var options the same module reads off the root: `--trigger` (`click` default, `hover`, `contextmenu`), `--placement`, `--offset` (`10`), `--strategy` (`fixed`; `static` disables Floating UI entirely), `--flip` (`true`), `--scope` (`window` reparents the menu to `<body>`), `--has-autofocus`, `--autofocus-on-keyboard-only`, `--gpu-acceleration`, `--adaptive`.

Opening removes `hidden` / adds `block` on the menu, adds `open` on the root, flips `aria-expanded`, and dispatches `open.hs.dropdown` on the root (`close.hs.dropdown` on close). API: `HSDropdown.open(target)`, `HSDropdown.close(target)`, `HSDropdown.closeCurrentlyOpened()`, `HSDropdown.getInstance(el, true)`, `HSDropdown.on('open'|'close', target, cb)`; instance `.open() .close() .destroy() .forceClearState() .isOpened()`. Keyboard (Enter / Space / Esc / arrows / Home / End / Tab) comes from `window.HSAccessibilityObserver`.

Re-init after rendering the panel dynamically: `window.HSStaticMethods.autoInit()`.

## Gotchas
- **The panel is not connected to the input.** The input is `type="text"`; no script writes the picked hour/minute back, and `OK` / `Now` are inert `<button type="button">`. There is no `.js` sibling in `examples/basic-forms/time-picker/`. You are copying a shell, not a widget.
- **The minutes column is 00–23, not 00–59.** Ids run `hs-cbchlmm00` … `hs-cbchlmm23` — upstream duplicated the hours column. Generate the real 60 (or your slot set) yourself.
- **`[--auto-close:inside]` is load-bearing.** The default is `true`, so without it the global window-click handler closes the panel on the first option click. In `closeCurrentlyOpened()` two separate escapes exist: the clicked root is *filtered out of the close list* only when `getClassPropertyAlt(root,'--auto-close') === 'inside'`, and the remaining roots are then skipped when their `closeMode` is `'false'` or `'outside'`. `inside` is the one that keeps this panel open on an inside click while still closing it on an outside click.
- **Radio identity is `name`, not `id`.** Two pickers on one page share `hs-cbchlhh` / `hs-cbchlmm` / `hs-cbchlcs` and will fight. Rename per instance.
- **The radios are `hidden`.** Selection styling is `has-checked:` on the wrapping `<label>`, and hidden inputs are not focusable — the panel is mouse-only unless you swap `hidden` for a visually-hidden pattern.
- **`border-dropdown-line` is `transparent` in BOTH moon themes.** The panel edge is `shadow-xl`. Removing the shadow leaves a borderless floating box; adding a colour to `dropdown-line` will not help without a theme override.
- **Moon inverts the selected pill.** `has-checked:bg-primary` is `gray-800` in light and `white` in dark, with the label flipping `white` → `neutral-800`. Selected time reads as a *white* chip in dark mode; that is correct, not a bug.
- **The "Now" button carries `bg-layer` with no padding.** Against `bg-dropdown` this is invisible in light (`white` on `white`) and shows as a `neutral-800` chip on the `neutral-900` panel in dark. Drop `bg-layer` if you want a plain text link in both themes.
- **`transition-[opacity,margin] duration`** — `duration` has no value; it is a dead class and the transition falls back to the default duration. Use `duration-150` if timing matters.
- The `before:`/`after:` `h-4` absolute blocks on the menu are invisible hover bridges. Keep them if you switch to `[--trigger:hover]`.
- The panel offers a 24-hour column **and** AM/PM. Pick one; shipping both produces an ambiguous value.
- `placeholder` on `<input type="time">` (native variant) is inert — the UA always renders its own `--:--` mask. Put the hint in a label.
- `inset-e-0` / `pe-12` / `ps-4` are logical properties; do not swap for `right`/`pr`/`pl`.

## Copy-paste base

`examples/basic-forms/time-picker/default-browser.html`

```html
<div class="max-w-32 w-full">
  <input type="time" class="py-2.5 sm:py-3 px-4 block w-full bg-layer border-layer-line rounded-lg sm:text-sm text-foreground placeholder:text-muted-foreground-1 focus:border-primary-focus focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none" placeholder="Basic time picker">
</div>
```
