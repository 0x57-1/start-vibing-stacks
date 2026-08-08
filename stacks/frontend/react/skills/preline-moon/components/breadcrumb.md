---
component: breadcrumb
label: Breadcrumb
category: navigations
docs: https://preline.co/docs/components/breadcrumb.html
examples: 6
js: none
tokens: [muted-foreground-1, muted-foreground, foreground, primary-focus, line-2, layer, layer-line, layer-foreground, layer-hover, layer-focus, dropdown, dropdown-line, dropdown-item-foreground, dropdown-item-hover, dropdown-item-focus]
---

# Breadcrumb

An `<ol>` of ancestor links ending in a non-link `<li aria-current="page">`, with an inline SVG separator between levels.

## When to use
- Showing where a page sits in a hierarchy the user did not choose (deep docs, nested resources, admin drill-downs).
- Two or more levels above the current page. One level is just a back link.
- **Not** for step progress in a flow — use `stepper`. **Not** for switching between sibling views — use `tabs`.
- When the trail is too long, collapse the middle into a `hs-dropdown` (`more-button-with-dropdown`) rather than truncating text.

## Anatomy

```html
<!-- REDUCED SKELETON — every class/attribute below appears verbatim in the example files -->
<ol class="flex items-center whitespace-nowrap">
  <li class="inline-flex items-center">
    <a class="flex items-center text-sm text-muted-foreground-1 hover:text-primary-focus focus:outline-hidden focus:text-primary-focus" href="#">Home</a>
    <svg class="shrink-0 mx-2 size-4 text-muted-foreground">…</svg>   <!-- separator, sibling of the link -->
  </li>
  <li class="inline-flex items-center">
    <a class="flex items-center text-sm text-muted-foreground-1 hover:text-primary-focus focus:outline-hidden focus:text-primary-focus" href="#">
      App Center
      <svg class="shrink-0 mx-2 size-4 text-muted-foreground">…</svg> <!-- separator, INSIDE the link (see Gotchas) -->
    </a>
  </li>
  <li class="inline-flex items-center text-sm font-semibold text-foreground truncate" aria-current="page">
    Application                                                       <!-- no <a>: current page is plain text -->
  </li>
</ol>
```

There is no wrapper `<nav>` and no `aria-label` in any of the six examples — add `<nav aria-label="Breadcrumb">` yourself if you need it.

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| `chevrons` | Chevron separators | `examples/navigations/breadcrumb/chevrons.html` | Baseline. Separator is a 24×24 lucide chevron, `size-4 mx-2 text-muted-foreground`. |
| `slashes` | Slash separators | `examples/navigations/breadcrumb/slashes.html` | Separator swapped for a 16×16 diagonal stroke (`<path d="M6 13L10 3">`), `size-5` not `size-4`, plus `aria-hidden="true"`. Everything else identical. |
| `with-icons` | Breadcrumbs with icons | `examples/navigations/breadcrumb/with-icons.html` | Each link gains a leading `size-4 me-3` icon (home, layout). Current page stays icon-less. |
| `bordered` | Bordered breadcrumb | `examples/navigations/breadcrumb/bordered.html` | `with-icons` plus `py-2 border-y border-line-2` on the `<ol>` — a rule above and below the whole trail. |
| `more-static-button` | Static more button | `examples/navigations/breadcrumb/more-static-button.html` | Middle `<li>` holds a bare horizontal-ellipsis SVG (`text-muted-foreground`) instead of a link — a decorative "levels hidden" marker with **no** interaction and no accessible name. |
| `more-button-with-dropdown` | More button with dropdown | `examples/navigations/breadcrumb/more-button-with-dropdown.html` | Middle `<li>` holds `div.hs-dropdown.[--placement:top-left]` + `button.hs-dropdown-toggle` (`bg-layer border-layer-line text-layer-foreground`) + `div.hs-dropdown-menu.w-48` on `bg-dropdown border-dropdown-line shadow-md`. Requires `HSDropdown`. |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `muted-foreground-1` | Ancestor link text (resting) | `gray-600` | `neutral-400` |
| `primary-focus` | Ancestor link hover **and** focus text | `gray-900` | `neutral-300` |
| `muted-foreground` | Separator glyph, and the static ellipsis marker | `gray-500` | `neutral-500` |
| `foreground` | Current page (`aria-current="page"`), paired with `font-semibold` | `gray-800` | `neutral-200` |
| `line-2` | `border-y` rule around the whole trail (`bordered` only) | `gray-200` | `neutral-700` |
| `layer` / `layer-line` / `layer-foreground` | More-button fill / border / label | `white` / `gray-200` / `gray-800` | `neutral-800` / `neutral-700` / `white` |
| `layer-hover` / `layer-focus` | More-button hover + focus fill | `gray-50` | `neutral-700` |
| `dropdown` / `dropdown-line` | More-menu panel fill / border | `white` / `transparent` | `neutral-900` / `transparent` |
| `dropdown-item-foreground` | More-menu item label | `gray-800` | `neutral-200` |
| `dropdown-item-hover` / `dropdown-item-focus` | More-menu item hover + focus fill | `gray-100` | `neutral-800` |

## Behaviour (JS)

Static markup only — no Preline JS. The one exception is `more-button-with-dropdown`, whose middle level is a standard `hs-dropdown` handled by `HSDropdown` (`assets/js/preline/dropdown.js`); see `components/dropdown.md`. Its only non-default option is the class `[--placement:top-left]`, read as the CSS property `--placement` and fed to Floating UI (default is `bottom-start`).

## Gotchas
- **The separator lives in two different places across levels.** In every example the *first* level puts the SVG after `</a>` as a sibling; the *second* puts it **inside** the `<a>`. Inside the anchor it becomes part of the click target and inherits `hover:text-primary-focus`, so hovering the link recolours the separator on level 2 but not level 1. Pick one and be consistent — the examples are not.
- **`primary-focus` is both the hover and the focus colour** (`hover:text-primary-focus focus:text-primary-focus`) — there is no `primary-hover` anywhere in this component, unlike navbar. Under moon that means gray-600 → gray-900 in light, neutral-400 → neutral-300 in dark: a genuine brightening in both modes.
- **`focus:outline-hidden` removes the focus ring**; the only remaining focus affordance is the text-colour shift to `primary-focus`. On a link that is already hovered, focus is invisible. Do not delete the `focus:text-*` half.
- **The current page has no `<a>` and no `href`.** It is an `<li>` with `aria-current="page"`. Wrapping it in a link to itself breaks the pattern and doubles the tab stop.
- **`more-static-button` is inaccessible by construction**: an ellipsis SVG with no `aria-label`, no `role`, no `sr-only` text and no `aria-hidden`. If you ship it, add `aria-hidden="true"` (it is decorative) or use the dropdown variant instead.
- **`truncate` only exists on the last `<li>`.** With `whitespace-nowrap` on the `<ol>` and `flex` items, a long ancestor label pushes the trail horizontally out of the container instead of ellipsising. Add `truncate`/`max-w-*` per level if labels are user-generated.
- **`border-dropdown-line` draws nothing under moon** (`transparent` in both modes) — the more-menu panel is separated from the page by `shadow-md` alone. On a `bg-layer` surface in dark (`neutral-800`) a `bg-dropdown` menu (`neutral-900`) is darker than its backdrop; do not remove the shadow.
- **`bordered` uses `line-2`, not `border`.** Both resolve to `gray-200`/`neutral-700` under moon, so a swap is invisible here — but they diverge under other themes. Copy the token as written.

## Copy-paste base

`examples/navigations/breadcrumb/chevrons.html`, verbatim and complete.

```html
<ol class="flex items-center whitespace-nowrap ">
  <li class="inline-flex items-center">
    <a class="flex items-center text-sm text-muted-foreground-1 hover:text-primary-focus focus:outline-hidden focus:text-primary-focus" href="#">
      Home
    </a>
    <svg class="shrink-0 mx-2 size-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
  </li>
  <li class="inline-flex items-center">
    <a class="flex items-center text-sm text-muted-foreground-1 hover:text-primary-focus focus:outline-hidden focus:text-primary-focus" href="#">
      App Center
      <svg class="shrink-0 mx-2 size-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
    </a>
  </li>
  <li class="inline-flex items-center text-sm font-semibold text-foreground truncate" aria-current="page">
    Application
  </li>
</ol>
```
