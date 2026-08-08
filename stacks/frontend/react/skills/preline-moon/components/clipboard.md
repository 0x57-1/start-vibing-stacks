---
component: clipboard
label: Clipboard
category: third-party-plugins
docs: https://preline.co/docs/components/clipboard.html
examples: 7
js: none (helper-clipboard.js wrapper over ClipboardJS -- no HS class)
tokens: [layer, layer-line, layer-foreground, layer-hover, layer-focus, primary, foreground, tooltip, tooltip-foreground, tooltip-line, muted-foreground-1, line-2]
---

# Clipboard

A copy button wired to ClipboardJS through Preline's `helper-clipboard.js`, which swaps a default icon for a success icon (and optionally a label + tooltip) for 800 ms after a successful copy.

## When to use
- Copying a fixed string, an element's `textContent`, or an `<input>`/`<textarea>`/`<select>` value on click.
- NOT for copying something computed at click time — the text resolver runs off `data-clipboard-text` / `data-clipboard-target` only. Compute into a hidden `<input>` first (see `tooltip-example.html`, which copies from `<input type="hidden">`).
- NOT for "share" flows needing feedback longer than 800 ms — the revert timeout is a hardcoded `setTimeout(…, 800)` with no option to change it. Use `components/toasts.md` for persistent confirmation.

## Anatomy

REDUCED SKELETON — the three `js-clipboard-*` hooks are the whole contract; every class shown appears in the example files.

```html
<!-- 1. the source: element whose textContent (or .value, if input/textarea/select) is copied -->
<div id="hs-clipboard-basic" class="text-sm text-foreground">npm install preline</div>

<!-- 2. the trigger. The wrapper class must match window.HS_CLIPBOARD_SELECTOR (default ".js-clipboard") -->
<button type="button" class="js-clipboard-example ... bg-layer border border-layer-line text-layer-foreground hover:bg-layer-hover focus:bg-layer-focus"
  data-clipboard-target="#hs-clipboard-basic"
  data-clipboard-action="copy"
  data-clipboard-success-text="Copied">

  <!-- 3a. shown at rest, display:none'd on success -->
  <svg class="js-clipboard-default size-4">…</svg>

  <!-- 3b. hidden at rest, display:block'd on success -->
  <svg class="js-clipboard-success hidden size-4 text-primary">…</svg>

  <!-- 3c. optional: textContent replaced by data-clipboard-success-text -->
  <span class="js-clipboard-success-text">Copy</span>
</button>
```

Assets (`examples/third-party-plugins/clipboard/how-to-use-assets-library.html` + `how-to-use-assets-helper.html`):

```html
<script src="./assets/vendor/clipboard/dist/clipboard.min.js"></script>
<script src="./assets/vendor/preline/dist/helper-clipboard.js"></script>
```

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| ClipboardJS lib | Installation | `examples/third-party-plugins/clipboard/how-to-use-assets-library.html` | `clipboard.min.js`. Required — the helper calls `new ClipboardJS(...)`. |
| Preline helper | Installation | `examples/third-party-plugins/clipboard/how-to-use-assets-helper.html` | `helper-clipboard.js`. Provides the icon/label/tooltip swap. |
| Copy text | Copy text | `examples/third-party-plugins/clipboard/basic-usage.html` | Source is a `div`; button is icon-only (`js-clipboard-default` + `js-clipboard-success`, no label span). |
| Copy input value | Copy input value | `examples/third-party-plugins/clipboard/copy-from-input.html` | Source is a visible `<input>` (`.value` is read, not `textContent`); button adds `group` + a `js-clipboard-success-text` label that flips "Copy" → "Copied". |
| Clipboard with tooltip | Clipboard with tooltip | `examples/third-party-plugins/clipboard/tooltip-example.html` | Source is `<input type="hidden">`. Button is `hs-tooltip` with `[--trigger:focus]`; the tooltip content is a static "Copied" string. |
| Tooltip, changing text | Clipboard with tooltip | `examples/third-party-plugins/clipboard/tooltip-example-change-text.html` | Same shape, two differences: `[--trigger:focus]` is **replaced** by `[--is-toggle-tooltip:false]` (so the trigger falls back to the default `hover`), and the tooltip body is `<span class="js-clipboard-success-text">Copy</span>`, so the tooltip label itself flips to "Copied". |
| Clipboard in modal | Modal example | `examples/third-party-plugins/clipboard/modal-example.html` | Full `hs-overlay` modal (`data-hs-overlay`) containing an input + `size-11` icon button wrapped in `hs-tooltip`; tooltip content holds the `js-clipboard-success-text` span. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` | Copy button resting fill (`bg-layer`); also the input fill in the input/modal variants | `white` | `neutral-800` |
| `layer-line` | Copy button border and input border | `gray-200` | `neutral-700` |
| `layer-foreground` | Copy button icon/label colour | `gray-800` | `white` |
| `layer-hover` | Copy button hover fill | `gray-50` | `neutral-700` |
| `layer-focus` | Copy button focus fill | `gray-50` | `neutral-700` |
| `primary` | Success checkmark colour (`js-clipboard-success ... text-primary`) | `gray-800` | `white` |
| `primary-focus` | Focus ring/border on the source input (`focus:border-primary-focus focus:ring-primary-focus`) | `gray-900` | `neutral-300` |
| `foreground` | The copied text itself, and the input's typed value | `gray-800` | `neutral-200` |
| `muted-foreground-1` | Input placeholder | `gray-600` | `neutral-400` |
| `line-2` | Vertical divider between the code text and the icon (`border-s border-line-2`) in the tooltip variants | `gray-200` | `neutral-700` |
| `tooltip` | Tooltip bubble fill | `gray-900` | `white` |
| `tooltip-foreground` | Tooltip label | `white` | `neutral-800` |
| `tooltip-line` | Tooltip border | `transparent` | `transparent` |
| `primary` / `primary-hover` / `primary-focus` / `primary-foreground` / `primary-line` | Modal variant only: the "Open modal" and "Save changes" buttons | see above; `primary-foreground` `white`/`neutral-800`, `primary-line` `transparent`/`transparent` | |
| `overlay` / `overlay-line` / `overlay-header` / `overlay-footer` | Modal variant only: dialog panel, border, header rule, footer rule | `white`/`transparent`/`gray-200`/`gray-200` | `neutral-800`/`transparent`/`neutral-700`/`neutral-700` |
| `surface` / `surface-line` / `surface-foreground` / `surface-hover` / `surface-focus` | Modal variant only: the round close button | `gray-100`/`transparent`/`gray-800`/`gray-200`/`gray-200` | `neutral-700`/`transparent`/`neutral-200`/`neutral-600`/`neutral-600` |
| `scrollbar-track` / `scrollbar-thumb` | Modal variant only: `[&::-webkit-scrollbar-track]` / `-thumb` on the modal body | `gray-100` / `gray-300` | `neutral-700` / `neutral-500` |

## Behaviour (JS)

No `HS*` class. `assets/js/preline/helper-clipboard.js` (1.4 KB) exports one function and runs it once on `window` `load`.

| Fact | Value (read from `helper-clipboard.js`) |
|---|---|
| Default selector | `window.HS_CLIPBOARD_SELECTOR ?? '.js-clipboard'` — read at script-parse time |
| Init | `window.addEventListener('load', () => init(SELECTOR))`, one pass, `document.querySelectorAll(selector)` |
| Manual re-init | The UMD fallback copies the module's enumerable exports onto `window`, so the initializer is `window.default('.your-selector')` |
| Text resolution | `el.dataset.clipboardText` if set; else `document.querySelector(el.dataset.clipboardTarget)`, then `.value` for `SELECT`/`INPUT`/`TEXTAREA`, otherwise `.textContent` |
| On success | `.js-clipboard-success-text` textContent := `data-clipboard-success-text \|\| ''` (old value stashed); `.js-clipboard-default` → `style.display = 'none'`; `.js-clipboard-success` → `style.display = 'block'`; `el.closest('.hs-tooltip')` (self or ancestor) → `window.HSTooltip.show(...)` |
| Revert | `setTimeout(..., 800)` restores the old label **only if it was truthy** (`if (span && oldText)`), calls `HSTooltip.hide(...)`, and clears both inline `display` values |

`data-clipboard-action="copy"` is a ClipboardJS attribute (the alternative is `cut`); the Preline helper does not read it.

Tooltip options ride on CSS custom properties read by `HSTooltip` (`assets/js/preline/tooltip.js`, via `getClassProperty`). Those five are the complete list in 4.2.0: `--trigger` (default `hover`), `--placement` (default `top`), `--strategy`, `--scope` (default `parent`), `--prevent-popper`.

## Gotchas

- **The docs examples will not work if you copy them as-is.** Every example button uses `js-clipboard-example`, but the helper's default selector is `.js-clipboard`. Either rename the class to `js-clipboard`, or set `window.HS_CLIPBOARD_SELECTOR = '.js-clipboard-example'` **before** `helper-clipboard.js` is parsed — the constant is captured at parse time, not at `load`.
- **Init is a single `load`-time pass.** Anything rendered later (React/SPA route, modal body fetched by XHR, table row appended) gets no listener. Re-run `window.default('.js-clipboard')` after render. There is no `autoInit`, no collection, and no `destroy` — calling it twice on the same button attaches a second ClipboardJS instance.
- **`hidden` on `.js-clipboard-success` is overridden by inline style, not removed.** The helper sets `style.display='block'` on success and `style.display=''` on revert; re-hiding depends entirely on the Tailwind `hidden` class still being there. Swap `hidden` for an inline `style="display:none"` and the revert (`display=''`) wipes your only hiding rule — the success icon stays visible forever.
- **`[--is-toggle-tooltip:false]` on `tooltip-example-change-text.html` is dead.** `grep -r is-toggle-tooltip assets/js/` matches nothing in Preline 4.2.0 — `tooltip.js` reads only `--trigger`, `--placement`, `--strategy`, `--scope`, `--prevent-popper`. The variant's real behavioural difference from `tooltip-example.html` is that it *drops* `[--trigger:focus]`, so the tooltip opens on hover.
- **The tooltip is found with `closest('.hs-tooltip')`.** In `tooltip-example.html` the class is on the *button itself*; in `modal-example.html` the button is the toggle and `.hs-tooltip` is the wrapping `div`. Both work; a layout where `.hs-tooltip` is a *sibling* silently loses the tooltip step. The `HSTooltip.show(el)` call is also silent when the element is not in `$hsTooltipCollection` (`findInCollection` → `null`), i.e. when the tooltip was injected after `HSTooltip.autoInit()` ran on `load`.
- **An initially-empty `.js-clipboard-success-text` never reverts.** The revert branch is `if (span && oldText)`; `oldText` of an empty span is `''`, so the label sticks on "Copied" forever. Give the span a resting label ("Copy"), as every example does.
- **`data-clipboard-success-text` and `.js-clipboard-success-text` are a pair.** With the attribute but no span, nothing shows; with the span but no attribute, the label is replaced by an empty string for 800 ms and looks like a rendering bug.
- **In moon, `primary` is `gray-800` in light and `white` in dark** — the success checkmark is near-black on white and white on `neutral-800`. It reads as a colour inversion, not a green "success" tick; if you want green, hardcode it, do not reach for a token.
- **`tooltip` inverts under moon** (`gray-900` light → `white` dark) with `tooltip-foreground` doing the opposite. Never pair `bg-tooltip` with `text-foreground`.
- **`layer` and `overlay` are both `white`/`neutral-800`** — the copy button inside the modal has zero contrast against the dialog until the `border-layer-line` is kept. Do not drop the border.

## Copy-paste base

`examples/third-party-plugins/clipboard/basic-usage.html` (verbatim):

```html
<div class="inline-flex items-center gap-x-3">
  <div id="hs-clipboard-basic" class="text-sm text-foreground">
    npm install preline
  </div>

  <button type="button" class="js-clipboard-example p-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg bg-layer border border-layer-line text-layer-foreground shadow-2xs hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus disabled:opacity-50 disabled:pointer-events-none"
    data-clipboard-target="#hs-clipboard-basic"
    data-clipboard-action="copy"
    data-clipboard-success-text="Copied">
    <svg class="js-clipboard-default size-4 group-hover:rotate-6 transition" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>

    <svg class="js-clipboard-success hidden size-4 text-primary" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  </button>
</div>
```
