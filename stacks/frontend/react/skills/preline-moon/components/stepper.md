---
component: stepper
label: Stepper
category: navigations
docs: https://preline.co/docs/components/stepper.html
examples: 20
js: HSStepper
tokens: [surface, surface-foreground, surface-1, surface-focus, foreground, muted-foreground-1, primary-active, primary-foreground, foreground-inverse, primary, primary-line, primary-hover, primary-focus, layer, layer-line, layer-foreground, layer-hover, layer-focus, secondary, secondary-foreground, muted, line-2, surface-line, surface-hover]
---

# Stepper

A numbered progress rail plus, optionally, a JS-driven wizard: `HSStepper` swaps `[data-hs-stepper-content-item]` panes by inline `display` and writes `active` / `success` / `skipped` / `error` / `processed` classes onto the matching nav items.

## When to use

- Multi-step forms and onboarding where the user must see position and remaining work.
- Read-only progress rails (order status, pipeline stage) — use one of the 12 static examples and skip the plugin entirely.
- **Not** for switching between peer views of the same data — that is `tabs`; a stepper implies order and completion.
- **Not** for a single collapsible section (`collapse`) or a set of them (`accordion`).

## Anatomy

Reduced skeleton of the interactive form. Every class/attribute appears in `examples/navigations/stepper/dynamic-linear.html`.

```html
<div data-hs-stepper>                                   <!-- '{"mode":"non-linear","currentIndex":2}' optional -->
  <ul class="relative flex flex-row gap-x-2">
    <li class="flex items-center gap-x-2 shrink basis-0 flex-1 group"
        data-hs-stepper-nav-item='{"index": 1}'>        <!-- index is REQUIRED and 1-based -->
      <span class="min-w-7 min-h-7 group inline-flex items-center text-xs align-middle">
        <span class="size-7 … bg-surface text-surface-foreground rounded-full
                     hs-stepper-active:bg-primary-active hs-stepper-active:text-primary-foreground
                     hs-stepper-success:bg-primary-active">1</span>
        <span class="ms-2 text-sm font-medium text-foreground">Step</span>
      </span>
      <div class="w-full h-px flex-1 bg-surface-1 group-last:hidden hs-stepper-success:bg-primary"></div>
    </li>
  </ul>

  <div data-hs-stepper-content-item='{"index": 1}'>…</div>
  <div data-hs-stepper-content-item='{"index": 2}' style="display: none;">…</div>
  <div data-hs-stepper-content-item='{"isFinal": true}' style="display: none;">…</div>

  <button data-hs-stepper-back-btn>Back</button>
  <button data-hs-stepper-next-btn>Next</button>
  <button data-hs-stepper-finish-btn style="display: none;">Finish</button>
  <button type="reset" data-hs-stepper-reset-btn style="display: none;">Reset</button>
</div>
```

`group` on the `<li>` plus `group-last:hidden` on the connector is what removes the trailing line; `shrink basis-0 flex-1` is what makes the rail distribute evenly.

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Default | Default stepper | `examples/navigations/stepper/static.html` | Static. Circle above, label under it (`<div class="mt-3">`); connector `ms-2 w-full h-px … group-last:hidden`. |
| Vertical | Vertical stepper | `examples/navigations/stepper/vertical.html` | `flex flex-col gap-y-2`; circle column `flex flex-col items-center` with a `w-px h-full` connector; body `grow pb-6 group-last:pb-0` carries a `text-muted-foreground-1` description. |
| Linear | Linear stepper | `examples/navigations/stepper/linear.html` | Label moves inline next to the circle (`ms-2 block`), connector becomes a sibling of the circle+label group. |
| Vertical linear | Vertical linear stepper | `examples/navigations/stepper/vertical-linear.html` | Vertical layout with the inline circle+label pairing. |
| Responsive | Responsive stepper | `examples/navigations/stepper/responsive.html` | Vertical below `sm`, horizontal above: `flex flex-col sm:flex-row`, connector `mt-2 w-px h-full sm:mt-0 sm:ms-2 sm:w-full sm:h-px sm:flex-1`. |
| Responsive linear | Responsive linear stepper | `examples/navigations/stepper/linear-responsive-example.html` | Same breakpoint flip applied to the linear layout; connector `h-4 ms-3.5` while stacked. |
| White | White stepper | `examples/navigations/stepper/white.html` | Circle swaps `bg-surface text-surface-foreground` for `bg-layer border border-layer-line text-layer-foreground`. |
| Vertical white | Vertical white stepper | `examples/navigations/stepper/vertical-white.html` | Same swap in the vertical layout. |
| Solid | Solid stepper | `examples/navigations/stepper/solid.html` | Circle becomes `bg-secondary text-secondary-foreground` (near-black in light, white in dark). |
| Vertical solid | Vertical solid stepper | `examples/navigations/stepper/vertical-solid.html` | Same swap in the vertical layout. |
| Centered | Centered stepper | `examples/navigations/stepper/center.html` | Adds `max-w-xs mx-auto` to the `<ul>`. Nothing else. |
| Icons / avatars | Stepper with icons and avatars | `examples/navigations/stepper/working-with-icon-and-avatar.html` | Circle content replaced per step: an `<svg class="shrink-0 size-4">`, an `<img class="shrink-0 size-7 rounded-full">`, and a `animate-spin … text-primary` loader. |
| Dynamic linear | Dynamic linear stepper | `examples/navigations/stepper/dynamic-linear.html` | First interactive one: `data-hs-stepper` + nav/content items + back/next/finish/reset. Adds `hs-stepper-active:` / `hs-stepper-success:` / `hs-stepper-completed:` classes and a check SVG revealed by `hs-stepper-success:block`. |
| Vertical dynamic linear | Vertical dynamic linear stepper | `examples/navigations/stepper/vertical-dynamic-linear.html` | Same wiring, vertical rail. |
| Non-linear | Non-linear stepper | `examples/navigations/stepper/non-linear.html` | Root `data-hs-stepper='{"mode":"non-linear"}'`; nav items become clickable; adds `data-hs-stepper-skip-btn` and `data-hs-stepper-complete-step-btn='{"completedText":"This step is completed"}'`. First `<li>` ships the `active` class. |
| Skippable | Skippable step | `examples/navigations/stepper/skipped.html` | A nav item declares `"isOptional": true`; the skip button auto-shows only on that step. |
| Active step | Active step | `examples/navigations/stepper/active.html` | Root `'{"currentIndex": 2}'` — the wizard boots on step 2. |
| Error state | Error state | `examples/navigations/stepper/error.html` (+ `.js`) | Nav item `"hasError": true` + the `error` class; circle gains `hs-stepper-error:bg-red-500`, an X SVG on `hs-stepper-error:block`, and a `hs-stepper-processed:inline-block` spinner. Active label uses `foreground-inverse`. |
| Success state | Success state | `examples/navigations/stepper/success.html` | Root `'{"isCompleted": true}'` **and** the `completed` class; every nav item `"isCompleted": true` + `success`. Boots showing the final pane. |
| Destroy / reinit | Destroy and reinitialize | `examples/navigations/stepper/destroy-and-reinitialize.html` (+ `.js`) | Adds `#hs-stepper-to-destroy` and two control buttons on `bg-layer`/`bg-surface`; the JS calls `HSStepper.getInstance(el, true).element.destroy()` and `HSStepper.autoInit()`. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `surface` (`bg-surface`) | Resting step-circle fill | `gray-100` | `neutral-700` |
| `surface-foreground` (`text-surface-foreground`) | Number inside a resting circle | `gray-800` | `neutral-200` |
| `surface-1` (`bg-surface-1`) | Connector line between steps | `gray-200` | `neutral-600` |
| `surface-focus` (`group-focus:bg-surface-focus`) | Circle fill while its nav item holds focus | `gray-200` | `neutral-600` |
| `foreground` (`text-foreground`) | Step label | `gray-800` | `neutral-200` |
| `muted-foreground-1` (`text-muted-foreground-1`) | Step description, placeholder pane heading | `gray-600` | `neutral-400` |
| `primary-active` (`hs-stepper-active:bg-`, `hs-stepper-success:bg-`) | Circle fill for the current **and** completed step | `gray-900` | `neutral-300` |
| `primary-foreground` (`hs-stepper-active:text-`, `text-primary-foreground`) | Glyph on a filled circle; label on primary buttons | `white` | `neutral-800` |
| `foreground-inverse` (`hs-stepper-active:text-foreground-inverse`) | Active-circle glyph in `error.html` only — **white in both modes** | `white` | `white` |
| `primary` (`bg-primary`, `hs-stepper-success:bg-primary`, `text-primary`) | Next/Finish/Reset fill; completed connector; spinner colour | `gray-800` | `white` |
| `primary-hover` / `primary-focus` (`hover:bg-` / `focus:bg-`) | Primary button fill states | `gray-900` | `neutral-300` |
| `primary-line` (`border-primary-line`) | Primary button border — transparent in both modes | `transparent` | `transparent` |
| `layer` (`bg-layer`) | Back button fill; circle fill in the "white" variants; `hs-stepper-processed:bg-layer` | `white` | `neutral-800` |
| `layer-line` (`border-layer-line`) | Back button / white-circle border | `gray-200` | `neutral-700` |
| `layer-foreground` (`text-layer-foreground`) | Back button label; number in a white circle | `gray-800` | `white` |
| `layer-hover` / `layer-focus` | Back button fill states | `gray-50` | `neutral-700` |
| `secondary` (`bg-secondary`) | Circle fill in the "solid" variants | `gray-900` | `white` |
| `secondary-foreground` (`text-secondary-foreground`) | Number in a solid circle | `white` | `neutral-800` |
| `muted` (`bg-muted`) | Placeholder content box in the interactive demos | `gray-50` | `neutral-800` |
| `line-2` (`border-line-2 border-dashed`) | Placeholder content box border | `gray-200` | `neutral-700` |
| `surface-line` / `surface-hover` | "Reinitialize" control button border / hover | `transparent` / `gray-200` | `transparent` / `neutral-600` |

## Behaviour (JS)

Class `HSStepper` (`assets/js/preline/stepper.js`, v4.2.0), exposed as `window.HSStepper`.

**Init.** On `window` `load` the module runs `HSStepper.autoInit()` over `[data-hs-stepper]:not(.--prevent-on-load-init)`. Idempotent: it first drops collection entries whose element left the DOM, then skips already-collected elements. Instances live in `window.$hsStepperCollection` as `{id, element}`.

**Root options** — JSON in `data-hs-stepper`, merged with the constructor's second argument:

| Key | Default | Effect |
|---|---|---|
| `currentIndex` | `1` | Step the wizard boots on. |
| `mode` | `"linear"` | `"non-linear"` makes nav items clickable and stops Next from auto-completing the step. |
| `isCompleted` | `false` | Boots straight into the `isFinal` content pane. |

**Nav item** — `data-hs-stepper-nav-item` JSON: `index` (required, 1-based), `isFinal`, `isCompleted`, `isSkip`, `isOptional`, `isDisabled`, `isProcessed`, `hasError`. At construction `isCompleted → .success`, `isSkip → .skipped`, `hasError → .error`, `isDisabled → .disabled` (+ the `disabled` attribute on `BUTTON`/`INPUT`).
**Content item** — `data-hs-stepper-content-item` JSON: `index`, `isFinal`, `isCompleted`, `isSkip`.

**Buttons** — resolved once with `querySelector` (so one of each per stepper): `[data-hs-stepper-back-btn]`, `-next-btn`, `-skip-btn`, `-complete-step-btn` (JSON `{"completedText": "…"}`), `-finish-btn`, `-reset-btn`. Visibility is driven by inline `style.display`. The three rules are **not** the same: `showSkipButton()` shows skip only while the current step's `isOptional` is true; `showFinishButton()` shows finish **only when exactly one uncompleted step remains**; `showCompleteStepButton()` is the inverse — it *hides* complete at that same moment and shows it otherwise. Back is never hidden mid-wizard, it is **disabled**: `checkForTheFirstStep()` toggles the `disabled` attribute + class whenever `currentIndex === 1`. Only `handleFinishButtonClick()` hides back/next/skip/complete/finish and reveals reset; `handleResetButtonClick()` puts them back.

**Classes written by JS:** `active` (current nav item), `success`, `skipped`, `error`, `processed`, `disabled` on nav items; `success`/`skipped` on content items; `completed` on the `[data-hs-stepper]` root. The `hs-stepper-*:` Tailwind variants are named after exactly these.

**Static API:** `autoInit()`, `getInstance(target, isInstance = false)`.
**Instance methods:** `goToNext()`, `goToFinish()`, `setProcessedNavItem(i)` / `unsetProcessedNavItem(i)`, `setErrorNavItem(i)`, `setCompleteItem(i)`, `setSkipItem(i)`, `enableButtons()` / `disableButtons()`, `on(evt, cb)`, `destroy()`.
**Events** — callback via `on(...)` and a bubbling `CustomEvent` on the root: `beforeNext`, `next`, `back`, `skip`, `complete`, `beforeFinish`, `finish`, `reset`, `active` — DOM names `<name>.hs.stepper` (e.g. `next.hs.stepper`).

## Gotchas

- **`autoInit()` only fires on `window` `load`.** Anything mounted later (React route change, modal body, `api.get()` result) is dead markup until you call `HSStepper.autoInit()` yourself — safe to repeat.
- **Panes are hidden with inline `style="display: none;"`, not the `hidden` class** (`setCurrentContentItemActions` sets `el.style.display = ''`). Ship every non-initial pane with that inline style, and never manage them with `hidden` — the two mechanisms fight and the inline style wins.
- **In linear mode nav items are NOT clickable.** `buildNavItem` attaches the click listener only when `mode !== 'linear' || isDisabled` — so in the default mode the rail is display-only, and, inverted, an item marked `"isDisabled": true` is the one item that *does* get a listener. Forward motion is the Next button.
- **`getInstance(el)` without the second argument returns the instance's wrapper entry's `element`, and the destroy example uses the two-argument form**: `HSStepper.getInstance(stepper, true).element.destroy()`. Copy that shape.
- **Async gating runs through `beforeNext` + `processed`.** `nextClick()` fires `beforeNext` first and *then* checks `isProcessed`; so the handler calls `setProcessedNavItem(i)`, the click aborts with `disableAll()`, and your callback later calls `unsetProcessedNavItem(i)` + `enableButtons()` + `goToNext()` (or `setErrorNavItem(i)`). See `error.js`.
- **`disableAll()` silently clears state.** It resets `hasError`, `isCompleted`, `isDisabled` and strips `error`/`success` from the current nav item — a blocked Next wipes a previously shown error before your async check re-adds it.
- **`examples/navigations/stepper/error.js` is a dump of the doc page tail, not a clean script** (32 KB, contains `</textarea>`, `<h2>` and later sections). Extract only the `<script>` block at the top. `destroy-and-reinitialize.js` is clean.
- **Error and completion colours are hard-coded palette, not tokens**: `hs-stepper-error:bg-red-500`, `hs-stepper-completed:bg-teal-500`, `hs-stepper-completed:bg-teal-600`. They do not follow moon and do not re-tint under another theme.
- **`primary-active` is the fill for both the current and the completed step** (`gray-900`/`neutral-300`) — the two are distinguished only by the check SVG revealed by `hs-stepper-success:block`. Delete that SVG and current vs done become indistinguishable.
- **Dark mode inverts the emphasis of the filled circle.** Resting is `bg-surface` (`gray-100`/`neutral-700`); active is `primary-active` (`gray-900`/`neutral-300`). Light mode goes dark-on-light; dark mode goes *light*-on-dark, so `text-primary-foreground` (`white`/`neutral-800`) has to flip with it. Do not hard-code `text-white` on the circle.
- **Pre-set state must be written twice.** `success.html` puts `"isCompleted": true` in the JSON *and* the literal `success` class on the `<li>` (and `completed` on the root); `non-linear.html` likewise ships `active` in the class list. The constructor adds these classes from JSON, but first paint happens before `load` — omit the literal class and the stepper flashes un-styled.
- **`index` is 1-based and defines `totalSteps`** (`setTotalSteps` takes the max). A gap or a 0-based list silently breaks Finish, which fires when exactly one uncompleted step remains.

## Copy-paste base

`examples/navigations/stepper/static.html` (smallest correct example — presentational rail, no plugin; for the interactive wizard copy `dynamic-linear.html` instead)

```html
<!-- Stepper -->
<ul class="relative flex flex-row gap-x-2">
  <!-- Item -->
  <li class="shrink basis-0 flex-1 group">
    <div class="min-w-7 min-h-7 w-full inline-flex items-center text-xs align-middle">
      <span class="size-7 flex justify-center items-center shrink-0 bg-surface font-medium text-surface-foreground rounded-full">
        1
      </span>
      <div class="ms-2 w-full h-px flex-1 bg-surface-1 group-last:hidden"></div>
    </div>
    <div class="mt-3">
      <span class="block text-sm font-medium text-foreground">
        Step
      </span>
    </div>
  </li>
  <!-- End Item -->

  <!-- Item -->
  <li class="shrink basis-0 flex-1 group">
    <div class="min-w-7 min-h-7 w-full inline-flex items-center text-xs align-middle">
      <span class="size-7 flex justify-center items-center shrink-0 bg-surface font-medium text-surface-foreground rounded-full">
        2
      </span>
      <div class="ms-2 w-full h-px flex-1 bg-surface-1 group-last:hidden"></div>
    </div>
    <div class="mt-3">
      <span class="block text-sm font-medium text-foreground">
        Step
      </span>
    </div>
  </li>
  <!-- End Item -->

  <!-- Item -->
  <li class="shrink basis-0 flex-1 group">
    <div class="min-w-7 min-h-7 w-full inline-flex items-center text-xs align-middle">
      <span class="size-7 flex justify-center items-center shrink-0 bg-surface font-medium text-surface-foreground rounded-full">
        3
      </span>
      <div class="ms-2 w-full h-px flex-1 bg-surface-1 group-last:hidden"></div>
    </div>
    <div class="mt-3">
      <span class="block text-sm font-medium text-foreground">
        Step
      </span>
    </div>
  </li>
  <!-- End Item -->
</ul>
<!-- End Stepper -->
```
