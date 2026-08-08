---
component: alerts
label: Alerts
category: base-components
docs: https://preline.co/docs/components/alerts.html
examples: 9
js: HSRemoveElement (dismiss variant only)
tokens: [foreground, foreground-inverse, primary, primary-foreground, primary-hover, primary-focus, primary-100, primary-200, primary-400, primary-500, primary-800, primary-900, secondary, secondary-foreground, surface, surface-4, surface-foreground, muted, muted-foreground-2, line-2, line-inverse, plain, inverse, layer, layer-line]
---

# Alerts

An inline, in-flow status banner: a coloured box with `role="alert"`, optionally an icon, a heading, body copy, actions, or a dismiss button.

## When to use

- Persistent, page-level or form-level state the user must see in context: connection errors, validation summaries, permission prompts, version notices.
- Validation summaries that accompany inline field errors (project rule: 422s render under the field — an alert is the *summary*, not the replacement).
- **Not** for transient success/undo feedback — use a toast; an alert occupies layout permanently and reflows the page.
- **Not** for anything blocking a decision — use `modal`/`overlay`.
- **Not** for a passive count or label — use `badge`.

## Anatomy

Reduced skeleton — every class/attribute appears in `examples/base-components/alerts/discovery.html` and `.../with-description.html`.

```html
<div class="bg-layer border border-layer-line rounded-lg p-4"
     role="alert" tabindex="-1" aria-labelledby="hs-discovery-label">
  <div class="flex">
    <div class="shrink-0">
      <svg class="shrink-0 size-4 mt-0.5">…</svg>          <!-- icon column -->
    </div>
    <div class="ms-3">                                      <!-- content column -->
      <h3 id="hs-discovery-label" class="text-foreground font-semibold">Title</h3>
      <p class="mt-2 text-sm text-foreground">Body</p>
    </div>
  </div>
</div>
```

Contract: `role="alert"` + `tabindex="-1"` + `aria-labelledby` pointing at the heading's `id` on the outer box; icon and content are two flex columns, spacing applied to the content column (`ms-2` / `ms-3` / `ms-4`, varies per example).

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Solid | Solid color variants | `examples/base-components/alerts/solid-color-variants.html` | 7 filled boxes, no border, no icon: `bg-secondary`, `bg-surface-4`, `bg-primary`, `bg-teal-500`, `bg-red-500`, `bg-yellow-500`, `bg-plain`. Label is a `<span class="font-bold">` carrying the `id`. |
| Soft | Soft color variants | `examples/base-components/alerts/soft-color-variants.html` | Same 7, tinted + bordered: `bg-surface`/`bg-muted`/`bg-primary-100 border-primary-200 text-primary-800` with explicit `dark:bg-primary-500/20 dark:border-primary-900 dark:text-primary-400`; light row is `bg-plain/10 border-line-inverse/10`. |
| Bordered | Bordered styles | `examples/base-components/alerts/bordered-styles.html` | Accent edge instead of full border: `bg-teal-50 border-t-2 border-teal-500 rounded-lg` and `bg-red-50 border-s-4 border-red-500` (**no** `rounded-lg`). Icon is a `size-8 rounded-full border-4` chip. |
| With description | With supporting text | `examples/base-components/alerts/with-description.html` | Yellow soft box + icon + `<h3 class="text-sm font-semibold">` + `<div class="mt-1 text-sm …">` body. |
| With list | With list | `examples/base-components/alerts/with-list.html` | Red soft box, body is `<ul class="list-disc space-y-1 ps-5">` — the validation-summary shape. |
| Actions | With actions | `examples/base-components/alerts/actions.html` | `bg-primary-100 border-primary-200 text-foreground`, body in `text-muted-foreground-2`, plus a `mt-4` row of two link-style buttons `text-primary hover:text-primary-hover focus:text-primary-focus`. |
| Link on right | Right-aligned link | `examples/base-components/alerts/link-on-right.html` | `bg-muted border-line-2 text-muted-foreground-2`; content column is `flex-1 md:flex md:justify-between` so the `Details` link floats right at `md:`. |
| Discovery | Discovery | `examples/base-components/alerts/discovery.html` | Neutral card look: `bg-layer border-layer-line rounded-lg shadow-lg`, `text-primary` icon — a notification, not a status. |
| Dismissible | Dismissible alert | `examples/base-components/alerts/dismiss-button.html` | Adds `id` + `hs-removing:translate-x-5 hs-removing:opacity-0 transition duration-300` on the box, and a close `<button data-hs-remove-element="#dismiss-alert">` in `ps-3 ms-auto` with `<span class="sr-only">Dismiss</span>`. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `secondary` / `secondary-foreground` | Solid "Dark" alert fill / its text | `gray-900` / `white` | `white` / `neutral-800` |
| `surface-4` (`bg-surface-4`) | Solid "Secondary" alert fill | `gray-500` | `neutral-500` |
| `primary` (`bg-primary`, `text-primary`) | Solid "Info" fill; action-button and discovery-icon colour | `gray-800` | `white` |
| `primary-foreground` | Text on `bg-primary` | `white` | `neutral-800` |
| `primary-hover` / `primary-focus` | Action-button text on hover / focus | `gray-900` | `neutral-300` |
| `plain` (`bg-plain`, `bg-plain/10`) | Solid & soft "Light" alert fill | `white` | `neutral-800` |
| `inverse` (`text-inverse`) | Text on `bg-plain` | `gray-800` | `neutral-950` |
| `foreground-inverse` | Text on `bg-surface-4`, on solid teal/red/yellow, and on `bg-plain/10` | `white` | `white` |
| `surface` / `surface-foreground` | Soft "Dark" fill / its text | `gray-100` / `gray-800` | `neutral-700` / `neutral-200` |
| `muted` (`bg-muted`) | Soft "Secondary" fill; link-on-right fill | `gray-50` | `neutral-800` |
| `foreground` (`text-foreground`) | Heading & body copy in bordered / actions / discovery | `gray-800` | `neutral-200` |
| `muted-foreground-2` | Secondary body copy in actions / link-on-right | `gray-700` | `neutral-300` |
| `primary-100` / `primary-200` | Soft "Info" fill / its border (light only) | `gray-100` / `gray-200` | `neutral-100` / `neutral-200` |
| `primary-500` / `primary-900` / `primary-400` | Soft "Info" dark overrides (`dark:bg-primary-500/20`, `dark:border-primary-900`, `dark:text-primary-400`) | `gray-500` / `gray-900` / `gray-400` | `neutral-500` / `neutral-900` / `neutral-400` |
| `primary-800` (`text-primary-800`) | Soft "Info" text, light | `gray-800` | `neutral-800` |
| `line-2` (`border-line-2`) | Border on soft dark/secondary and link-on-right | `gray-200` | `neutral-700` |
| `line-inverse` (`border-line-inverse/10`) | Border on soft "Light" | `white` | `white` |
| `layer` / `layer-line` | Discovery card fill / border | `white` / `gray-200` | `neutral-800` / `neutral-700` |

## Behaviour (JS)

Only the dismissible variant is scripted, via `data-hs-remove-element` → class `HSRemoveElement` (`assets/js/preline/remove-element.js`, v4.2.0), exposed as `window.HSRemoveElement`.

| Attribute | On | Effect |
|---|---|---|
| `data-hs-remove-element="<css selector>"` | the close `<button>` | The **selector of the element to delete** (`#dismiss-alert`), resolved once at construction with `document.querySelector`. If it matches nothing, the instance never initialises and the button is inert. |
| `data-hs-remove-element-options='{"removeTargetAnimationClass":"…"}'` | the same button | Overrides the class added before removal. Default `hs-removing`. |

**Init.** `HSRemoveElement.autoInit()` runs on `window` `load` over `[data-hs-remove-element]:not(.--prevent-on-load-init)`; it prunes detached entries and skips already-collected ones, so re-calling it is safe. Collection: `window.$hsRemoveElementCollection`. Statics: `autoInit()`, `getInstance(target, isInstance=false)`. Instance: `remove()`, `destroy()`.

**Removal sequence.** Click → add `hs-removing` to the target → `afterTransition(...)` → `setTimeout(...)` → `target.remove()`. `afterTransition` inspects computed style and fires the callback **immediately** when `transition-property` is `none` or `transition-duration` is 0 — so without a `transition` utility on the target the alert vanishes with no animation. No events are emitted and there is no un-remove: the node is gone from the DOM.

## Gotchas

- **Status colour is not tokenised under moon.** Success / danger / warning are raw `teal-*`, `red-*`, `yellow-*` with hand-written `dark:` overrides in every example. Only dark / secondary / info / light map onto tokens — and moon's primary ramp is **gray**, so the "Info" alert renders monochrome and carries no informational hue. Do not expect `bg-primary` to look blue.
- **`bg-plain` + `text-inverse` is near-unreadable in moon dark**: `neutral-800` fill under `neutral-950` text. Check the solid "Light" variant before shipping it, or pair `bg-plain` with `text-foreground`.
- **`hover:text-foreground-hover` / `focus:text-foreground-focus` in `link-on-right.html` reference tokens that do not exist under moon** — no `--foreground-hover` / `--foreground-focus` in `reference/moon-token-table.md`, `assets/css/project-moon.css` or `assets/css/themes/moon.css`. The link has no visible hover/focus colour change. Use `primary-hover` / `primary-focus` (as `actions.html` does) instead.
- **The dismiss target is a selector on the button, not the alert.** Duplicating the alert markup duplicates the hardcoded `#dismiss-alert` id; every close button then removes the first one. Generate a unique id per instance.
- **`transition` on the alert box is functional, not cosmetic** — see the `afterTransition` note above.
- **Dynamically rendered alerts are inert until `HSRemoveElement.autoInit()` runs again** (it only auto-fires on `window` `load`). In a React SPA, call it after mount, or handle the close button in React and skip the attribute entirely.
- **`role="alert"` only announces on insertion/change.** An alert already in the DOM at first paint is not read out. Render it after the response, don't pre-render it hidden.
- `bordered-styles.html`'s red box deliberately omits `rounded-lg` while the teal one keeps it — copying both into one group gives mismatched corners.
- **Semantic tokens flip with the theme; the numeric `primary-*` ramp does not.** `surface` (`gray-100`→`neutral-700`) and `muted` (`gray-50`→`neutral-800`) invert, so the soft Dark/Secondary alerts carry no `dark:` utilities at all. `primary-100` is `gray-100` in light and `neutral-100` in dark — still a near-white fill — and `primary-800` is dark in both; that is exactly why the soft "Info" alert and `actions.html` ship explicit `dark:bg-primary-500/20 dark:border-primary-900` overrides. Never assume a `primary-<number>` utility self-corrects in dark; check `reference/moon-token-table.md` and add the `dark:` pair.

## Copy-paste base

`examples/base-components/alerts/discovery.html`

```html
<!-- Alert -->
<div class="bg-layer border border-layer-line rounded-lg shadow-lg p-4" role="alert" tabindex="-1" aria-labelledby="hs-discovery-label">
  <div class="flex">
    <div class="shrink-0">
      <svg class="shrink-0 size-4 text-primary mt-1" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
    </div>
    <div class="ms-3">
      <h3 id="hs-discovery-label" class="text-foreground font-semibold">
        New version published
      </h3>
      <p class="mt-2 text-sm text-foreground">
        Chris Lynch published a new version of this page. Refresh to see the changes.
      </p>
    </div>
  </div>
</div>
<!-- End Alert -->
```
