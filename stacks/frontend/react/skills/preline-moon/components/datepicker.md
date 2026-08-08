---
component: datepicker
label: Datepicker
category: base-components
docs: https://preline.co/docs/components/datepicker.html
examples: 6
js: HSSelect, HSDatepicker
tokens: [primary-hover, primary-focus, foreground, surface, surface-focus, muted-foreground-1, layer-line, select, select-item-hover, select-item-focus, dropdown, dropdown-divider]
---

# Datepicker

A calendar panel — month/year selects, a 7-column day grid, optional time row and a Cancel/Apply footer — for picking a single date or a date range.

## When to use
- Picking a calendar date or a start/end range, where a month grid beats typing.
- Only if you also wire a JS engine: **the six doc examples are frozen static markup** (July 2023, hardcoded), they do not compute or select anything.
- Not for a bare "when did this happen" field — a plain `<input type="date">` or the `input` component is smaller and keyboard-native.
- Not for "last 7 days / last 30 days" analytics filters — those are a `dropdown` of preset buttons; the calendar is the fallback, not the primary control.

## Anatomy

Reduced skeleton (classes verbatim from `examples/base-components/datepicker/single-pre-set-ranges.html`; `…` marks omitted siblings):

```html
<!-- panel: bg-dropdown carries the theme; w-80 single, w-80 sm:w-159.5 for two calendars -->
<div class="w-80 flex flex-col bg-dropdown border border-dropdown-line shadow-lg rounded-xl overflow-hidden">
  <div class="p-3 space-y-0.5">
    <!-- header: prev | month+year selects | next -->
    <div class="grid grid-cols-5 items-center gap-x-3 mx-1.5 pb-3">
      <div class="col-span-1">…prev button…</div>
      <div class="col-span-3 flex justify-center items-center gap-x-1">
        <div class="relative"><select data-hs-select='{…}' class="hidden">…</select></div>
        <span class="text-foreground">/</span>
        <div class="relative"><select data-hs-select='{…}' class="hidden">…</select></div>
      </div>
      <div class="col-span-1 flex justify-end">…next button…</div>
    </div>
    <!-- weekday header -->
    <div class="flex pb-1.5">
      <span class="m-px w-10 block text-center text-sm text-muted-foreground-1">Mo</span>…
    </div>
    <!-- one week: the WRAPPER div paints the range strip, the BUTTON paints the day -->
    <div class="flex">
      <div>…plain day…</div>
      <div class="bg-surface rounded-s-full">…range start…</div>
      <div class="bg-surface first:rounded-s-full last:rounded-e-full">…in range…</div>
      <div class="bg-surface rounded-e-full">…range end…</div>
    </div>
  </div>
  <!-- optional footer -->
  <div class="py-3 px-4 flex items-center justify-end gap-x-2 border-t border-dropdown-divider">…Cancel / Apply…</div>
</div>
```

`single-pre-set-ranges.html` contains exactly three distinct day-button class strings (42 buttons: 34 + 6 + 2), verbatim:

| State | Count | Class string |
|---|---|---|
| Every ordinary day — **plain, in-range and the 5 leading previous-month days (those add the `disabled` attribute) all share this one string** | 34 | `m-px size-10 flex justify-center items-center border-[1.5px] border-transparent text-sm text-foreground rounded-full hover:border-primary-hover hover:text-primary-hover disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:border-primary-focus focus:text-primary-focus` |
| Trailing next-month days only — all carry `disabled`, all in a bare `<div>`. Note `focus:bg-surface-focus` instead of the focus border/text pair | 6 | `m-px size-10 flex justify-center items-center border-[1.5px] border-transparent text-sm text-foreground hover:border-primary-hover hover:text-primary-hover rounded-full disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-surface-focus` |
| Range endpoint (`bg-primary` pill) | 2 | `m-px size-10 flex justify-center items-center bg-primary border-[1.5px] border-transparent text-sm font-medium text-primary-foreground hover:border-primary-hover focus:outline-hidden focus:border-primary-focus rounded-full disabled:text-muted-foreground disabled:pointer-events-none` |

The two out-of-month rows are styled inconsistently by the doc itself (`grep -c 'disabled>' single-pre-set-ranges.html` → 11 = 5 + 6). If you generate the grid, use one string for all out-of-month days.

**The endpoint string is not shared across the six files.** `single-pre-set-ranges` and `with-time` use the row above; `single-datepicker`, `ranges`, `pre-set-ranges` and `ranges-with-time` instead use
`m-px size-10 flex justify-center items-center bg-primary border-[1.5px] border-transparent text-sm font-medium text-primary-foreground hover:border-primary-hover rounded-full disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-surface-focus`
(no `focus:border-primary-focus`, `disabled:opacity-50` instead of `disabled:text-muted-foreground`). Pick one and normalise — do not mix.

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| `single-datepicker` | Single date picker | `examples/base-components/datepicker/single-datepicker.html` | Bare panel, `w-80`, no footer, no range strip. One `bg-primary` selected pill. Smallest of the six. |
| `single-pre-set-ranges` | Single calendar range | `examples/base-components/datepicker/single-pre-set-ranges.html` | Adds `bg-surface` wrapper divs (range strip, `rounded-s-full` / `rounded-e-full` at the ends) and a `border-t border-dropdown-divider` Cancel/Apply footer. Endpoints add `disabled:text-muted-foreground`. |
| `with-time` | Single date with time | `examples/base-components/datepicker/with-time.html` | Adds `<div class="pt-3 flex justify-center items-center gap-x-2">` under the grid with 3 more `data-hs-select` (hour / minute / AM-PM). These use `hs-selected:bg-select-item-active` and `"dropdownVerticalFixedPlacement": "top"` so the list opens upward. |
| `ranges` | Date range picker | `examples/base-components/datepicker/ranges.html` | Two calendars: panel becomes `w-80 sm:w-159.5`, inner `<div class="sm:flex">`. Row-edge cells use gradient wrappers `bg-linear-to-l from-surface` / `bg-linear-to-r from-surface` so the strip bleeds off each calendar. Footer is `flex items-center py-3 px-4 justify-end …`. |
| `pre-set-ranges` | Range picker with summary | `examples/base-components/datepicker/pre-set-ranges.html` | `ranges` plus a read-back label in the footer — a `<span>` with class `md:me-3 text-xs text-muted-foreground-1` holding the literal text `20.07.2023 - 10.08.2023`. That span is the *only* diff against `ranges.html` (49,671 B vs 49,564 B). No preset sidebar despite the slug. |
| `ranges-with-time` | Date range with time | `examples/base-components/datepicker/ranges-with-time.html` | Two calendars, a time row per calendar, and a two-column footer (`flex flex-col sm:flex-row sm:justify-between …`) holding two editable date inputs: `p-2 block w-24 bg-surface border-transparent rounded-lg text-sm text-surface-foreground placeholder:text-muted-foreground-1 focus:bg-layer-focus focus:border-primary-focus focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none`, plus the same `md:me-3` summary span as `pre-set-ranges`. Largest file (66 KB). |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `dropdown` | Panel surface (`bg-dropdown`) | `white` | `neutral-900` |
| `dropdown-line` | Panel border | `transparent` | `transparent` |
| `dropdown-divider` | Footer top rule (`border-t`) | `gray-200` | `neutral-800` |
| `foreground` | Day number, arrow glyphs, `/` and `:` separators, Cancel button label (`bg-layer … text-foreground`) | `gray-800` | `neutral-200` |
| `muted-foreground-1` | Weekday header (Mo…Su), footer summary text, input placeholder | `gray-600` | `neutral-400` |
| `muted-foreground` | Disabled range endpoint text (`disabled:text-muted-foreground`) | `gray-500` | `neutral-500` |
| `muted-hover` / `muted-focus` | Prev/next arrow button fill on hover / focus | `gray-100` / `gray-100` | `neutral-700` / `neutral-700` |
| `primary` | Selected-day pill fill, Apply button fill | `gray-800` | `white` |
| `primary-foreground` | Selected-day text, Apply label | `white` | `neutral-800` |
| `primary-hover` | Day hover ring + text, month/year toggle hover text, Apply hover fill | `gray-900` | `neutral-300` |
| `primary-focus` | Day focus ring + text, Apply focus border/ring | `gray-900` | `neutral-300` |
| `surface` | In-range strip behind days; footer date-input fill | `gray-100` | `neutral-700` |
| `surface-focus` | `focus:bg-surface-focus` — the trailing out-of-month days in `single-pre-set-ranges`/`with-time`; the selected pill in the other four files; in-range days in the two-calendar files | `gray-200` | `neutral-600` |
| `surface-foreground` | Text inside the footer date inputs | `gray-800` | `neutral-200` |
| `layer` / `layer-line` | Cancel button fill + border; **and the generated select *dropdown panel* border** (`"dropdownClasses": "… bg-select border border-layer-line …"`) — not the toggle | `white` / `gray-200` | `neutral-800` / `neutral-700` |
| `layer-hover` / `layer-focus` | Cancel button hover / focus fill; `layer-focus` also fills the `ranges-with-time` footer inputs on focus | `gray-50` / `gray-50` | `neutral-700` / `neutral-700` |
| `select` | Month/year/time dropdown panel fill | `white` | `neutral-900` |
| `select-item-foreground` | Option label | `gray-800` | `neutral-200` |
| `select-item-hover` / `select-item-focus` | Option hover / focus fill | `gray-100` | `neutral-800` |
| `select-item-active` | Currently selected option fill (time selects only) | `gray-100` | `neutral-800` |
| `scrollbar-track` / `scrollbar-thumb` | Option-list scrollbar in the month/year dropdown | `gray-100` / `gray-300` | `neutral-700` / `neutral-500` |

## Behaviour (JS)

Two different plugins are in play; do not confuse them.

**What the doc examples actually run: `HSSelect`** (`assets/js/preline/select.js`). Every month, year, hour, minute and AM/PM control is a `<select … class="hidden">` carrying a `data-hs-select='{…}'` JSON blob. `HSSelect.autoInit()` matches `[data-hs-select]` and replaces the native select with a generated toggle + dropdown. Options used inside these examples: `placeholder`, `toggleTag`, `toggleClasses`, `dropdownClasses`, `optionClasses`, `optionTemplate`, plus `viewport` (`with-time` pins the dropdown to `#with-time-tab-preview-datepicker`) and `dropdownVerticalFixedPlacement: "top"` for the time row. Events: `change.hs.select`, `load.hs.select`. Nothing else in the markup is interactive — the arrows, day buttons and Apply/Cancel are inert `<button type="button">`.

**The real engine: `HSDatepicker`** (`assets/js/preline/datepicker.js`, 172 KB — the heaviest module in the bundle). It is **not used by any doc example** (`grep -c hs-datepicker examples/base-components/datepicker/*.html` → 0 in all six).
- `HSDatepicker.autoInit()` scans `.hs-datepicker:not(.--prevent-on-load-init)` — a **class** selector, not an attribute. Adding `data-hs-datepicker='{…}'` without the `hs-datepicker` class initialises nothing.
- Config is JSON in `data-hs-datepicker`, merged over constructor options. Keys read by the module: `mode`, `selectionDatesMode`, `selectedDates`, `dateMin`, `dateMax`, `dateFormat`, `dateLocale`, `layouts`, `templates`, `styles`, `inputModeOptions`, `replaceTodayWithText`, `applyUtilityClasses`, `removeDefaultStyles`.
- Callbacks it wires: `onInit`, `onShow`, `onHide`, `onUpdate`, `onChangeToInput`, `onChangeTime`, `onClickArrow`, `onClickMonth`, `onClickYear`, `onCreateDateEls`.
- Emits `change.hs.datepicker` on the element (detail carries the selected time + context). Instances live in `window.$hsDatepickerCollection`; `HSDatepicker.getInstance(elOrSelector, true)` returns the wrapper record.

## Gotchas
- **The examples are pictures of a calendar, not a calendar.** Days are hardcoded to July/August 2023 and every day button is inert. Ship these as-is and you get a panel that never changes month and never returns a date. Either drive it with `HSDatepicker` (add `class="hs-datepicker"`) or render the grid server-side / in React and keep only the class strings.
- **`HSDatepicker.autoInit` keys off the CLASS `.hs-datepicker`**, while its options come from `data-hs-datepicker`. Every other Preline component in this set autoInits on the attribute. Getting this backwards fails silently.
- **`dropdown-line` is `transparent` in BOTH moon modes.** `border border-dropdown-line` on the panel paints nothing; the panel is separated from the page purely by `shadow-lg`. Do not "fix" the missing border by swapping in `border-layer-line` unless you mean to change the design.
- **The range strip lives on the wrapper `<div>`, the day pill on the `<button>`.** `bg-surface` + `rounded-s-full`/`rounded-e-full` on the wrapper, `bg-primary` + `rounded-full` on the button. Move `bg-surface` onto the button and the strip breaks into 7 disconnected circles. Corollary: **an in-range day button is not restyled at all** — it carries the identical class string to a plain day; only its wrapper differs. If you are generating the grid, the only per-day decisions are wrapper class, `disabled`, and endpoint-vs-not.
- **moon inverts the selected day.** `primary` = `gray-800` light but `white` dark, `primary-foreground` = `white` light but `neutral-800` dark. The selected pill is a dark chip on light and a white chip on dark; `hover:border-primary-hover` (`gray-900` / `neutral-300`) is a *darker* ring in light and a *lighter* one in dark. Any hardcoded `text-white` on a day breaks dark mode.
- **`w-159.5` is a Tailwind v4 fractional size** (the only one here; the other fractional class in these files is the ordinary `size-3.5`). It compiles under v4's numeric scale; on a v3 config it silently drops and the two-calendar panel collapses to `w-80`.
- **The month/year `<select>` must stay `class="hidden"`.** HSSelect renders its own toggle next to it; removing `hidden` shows both the native select and the generated one.
- **Re-init after dynamic render.** Both plugins filter their global collections by `document.contains(...)`; after replacing the panel in a SPA call `HSSelect.autoInit()` (and `HSDatepicker.autoInit()` if used) or the new selects stay native and hidden — i.e. an invisible month picker.
- **`viewport` in the time selects points at a doc-page id** (`#with-time-tab-preview-datepicker`, 3× in `with-time`, and the *same* id 6× in `ranges-with-time`). Copy either example into your app and the option keeps referencing a non-existent node; drop it or repoint it.

## Copy-paste base

Verbatim **excerpt** from `examples/base-components/datepicker/single-pre-set-ranges.html` — panel shell, weekday header, and one week row carrying a plain day plus a range-start day. `cat` the full file for the complete grid, the month/year `data-hs-select` blobs and the Cancel/Apply footer (footer markup is quoted under Variants and Anatomy above).

```html
<div class="w-80 flex flex-col bg-dropdown border border-dropdown-line shadow-lg rounded-xl overflow-hidden">
    <!-- Calendar -->
    <div class="p-3 space-y-0.5">
      <!-- Weeks -->
      <div class="flex pb-1.5">
        <span class="m-px w-10 block text-center text-sm text-muted-foreground-1">
          Mo
        </span>
      </div>
      <!-- Days -->
      <div class="flex">
        <div>
          <button type="button" class="m-px size-10 flex justify-center items-center border-[1.5px] border-transparent text-sm text-foreground rounded-full hover:border-primary-hover hover:text-primary-hover disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:border-primary-focus focus:text-primary-focus">
            4
          </button>
        </div>
        <div class="bg-surface rounded-s-full">
          <button type="button" class="m-px size-10 flex justify-center items-center bg-primary border-[1.5px] border-transparent text-sm font-medium text-primary-foreground hover:border-primary-hover focus:outline-hidden focus:border-primary-focus rounded-full disabled:text-muted-foreground disabled:pointer-events-none">
            5
          </button>
        </div>
      </div>
      <!-- Days -->
    </div>
</div>
```
