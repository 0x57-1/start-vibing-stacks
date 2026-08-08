---
component: kbd
label: KBD
category: layout-and-content
docs: https://preline.co/docs/components/kbd.html
examples: 6
js: none
tokens: [surface-foreground, surface-line, surface-1, muted-foreground-2, foreground, layer, layer-line, muted-foreground, layer-foreground, line-2, surface, primary-focus]
---

# KBD

Key-cap chips that render a keyboard shortcut (`Ctrl` + `b`, `⌘` + `/`) inline next to a label, an input, or a list row.

## When to use
- Documenting a shortcut in a command palette, a settings list, a toolbar tooltip, or an editor menu.
- As a hint inside a search input that opens an overlay (`input-example`).
- NOT for showing code or a literal value — use `<code>` / the code-block component. `<kbd>` means "the user presses this".
- NOT a button. The caps are inert text; the clickable thing is the input or menu row they sit in.

## Anatomy
Reduced skeleton — every class appears verbatim in `examples/layout-and-content/kbd/types.html` (whose five caps sit flush, with no glue text; the `+` between caps is taken from `list-group-example.html`, the `and` from `working-with-modifier.html`):

```html
<!-- wrapper: lays the caps out and colours the glue text between them -->
<span class="flex flex-wrap items-center gap-x-1 text-sm text-muted-foreground-2">
  <kbd class="min-h-7.5 inline-flex justify-center items-center py-1 px-1.5 bg-surface-1 border border-surface-line font-mono text-sm text-surface-foreground rounded-md">
    ctrl
  </kbd>
  +                                  <!-- glue text, inherits the wrapper colour -->
  <kbd class="min-h-7.5 inline-flex justify-center items-center py-1 px-1.5 bg-layer border border-layer-line font-mono text-sm text-layer-foreground rounded-md">
    b
  </kbd>
</span>
```

Three parts carry the whole component: the flex wrapper (`gap-x-1` + `text-muted-foreground-2`), the cap fill/text pair (`bg-surface-1`/`text-surface-foreground` **or** `bg-layer`/`text-layer-foreground`), and the size trio (`min-h-*` + `py-*` + `px-*`).

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| Types (5 in one row) | Types | `examples/layout-and-content/kbd/types.html` | bare `text-muted-foreground` → bare `text-foreground` → filled `bg-surface-1 border-surface-line` → outlined `bg-layer border-layer-line` → raised, same as outlined plus `shadow-[0px_2px_0px_0px_var(--color-line-2)]` |
| Icon caps | Working with icons | `examples/layout-and-content/kbd/working-with-icons.html` | adds `min-w-7.5` beside `min-h-7.5` so an icon-only cap stays square; inline `<svg class="shrink-0 size-3">` / `size-4` |
| Modifier phrase | Working with modifiers | `examples/layout-and-content/kbd/working-with-modifier.html` | drops `border border-surface-line` entirely; the word `and` sits between caps as glue text |
| Size ramp | Sizes | `examples/layout-and-content/kbd/sizes.html` | `min-h-4.5 px-1 text-xs` / `min-h-7.5 py-1 px-1.5 text-sm` / `min-h-10.5 py-1.5 px-2 text-lg`, all on `bg-surface` |
| Search input hint | Input example | `examples/layout-and-content/kbd/input-example.html` | caps live in an absolutely-positioned `pointer-events-none` overlay inside a relative input group; input has `pe-14` + `data-hs-overlay="#hs-pro-dnsm"` |
| Shortcut list | List group example | `examples/layout-and-content/kbd/list-group-example.html` | `<ul>` rows with `border-t border-line-2 first:border-t-0`; caps rendered as `<span>`, not `<kbd>` |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `muted-foreground-2` | wrapper text colour — the `+` / `and` glue between caps | `gray-700` | `neutral-300` |
| `surface-1` | filled cap fill (`bg-surface-1`) — types, modifier, list rows | `gray-200` | `neutral-600` |
| `surface` | cap fill used by the size ramp (`bg-surface`) | `gray-100` | `neutral-700` |
| `surface-foreground` | glyph colour on a surface cap | `gray-800` | `neutral-200` |
| `surface-line` | cap border on surface caps (`border-surface-line`) | `transparent` | `transparent` |
| `layer` | outlined / raised cap fill (`bg-layer`) | `white` | `neutral-800` |
| `layer-line` | cap border that is actually visible (`border-layer-line`) | `gray-200` | `neutral-700` |
| `layer-foreground` | glyph colour on a layer cap | `gray-800` | `white` |
| `foreground` | borderless cap, strong emphasis; list-row labels | `gray-800` | `neutral-200` |
| `muted-foreground` | borderless cap, dim; search icon and input placeholder | `gray-500` | `neutral-500` |
| `line-2` | list-row divider (`border-line-2`) **and** the 2px drop under the raised cap, via `var(--color-line-2)` | `gray-200` | `neutral-700` |
| `primary-focus` | input focus border + ring in the input example | `gray-900` | `neutral-300` |

## Behaviour (JS)
Static markup only -- no Preline JS. `index.json` lists `hs_js: []`.

`examples/layout-and-content/kbd/input-example.html` does carry `data-hs-overlay="#hs-pro-dnsm"`, but that attribute belongs to **HSOverlay** (`assets/js/preline/overlay.js`) and sits on the `<input>`, not on the `<kbd>`. The kbd is decoration; the overlay opens on input interaction.

## Gotchas
- **`surface-line` is `transparent` in BOTH light and dark under moon.** `border border-surface-line` on a filled cap therefore paints nothing — the cap reads as borderless in both themes. If you actually want an outline, use the `bg-layer border-layer-line` cap from `types.html` (`gray-200` / `neutral-700`). This is why `working-with-modifier.html` can drop the border with no visual difference.
- **`primary-focus` inverts** — `gray-900` in light, `neutral-300` in dark. The search input's focus ring goes near-black on white and pale-grey on dark. Do not hardcode a dark ring.
- **`list-group-example.html` uses `<span>`, not `<kbd>`.** Copying it loses the semantic element that screen readers announce as keyboard input. Swap `<span>` for `<kbd>` when reusing that row; the class list is identical.
- `min-h-7.5`, `min-h-4.5`, `min-h-10.5`, `min-w-7.5` are **fractional spacing values** (Tailwind v4 arbitrary spacing scale). They are not in the v3 default scale — a v3 build silently drops them and caps collapse to text height.
- Icon-only caps need `min-w-7.5` **as well as** `min-h-7.5`, otherwise `px-1.5` alone makes them narrower than they are tall (`working-with-icons.html` sets both).
- In `input-example.html` the kbd overlay is `pointer-events-none` and the input reserves room with `pe-14` (and `ps-10` for the left icon). Change the number of caps and you must retune `pe-*`, or the typed text runs under them.
- The raised type depends on `--color-line-2`, registered in `assets/css/project-theme.css` as `@theme inline { --color-line-2: var(--border-line-2) }`. Without that `@theme inline` block the shadow resolves to nothing.
- The `+` between caps is **plain text in the wrapper**, coloured by `text-muted-foreground-2` on the parent — not a class on the kbd. Wrapping it in its own element without that colour makes it jump.
- Logical inset utilities (`inset-s-0`, `inset-e-0`, `ps-*`, `pe-*`) are used throughout instead of left/right — keep them for RTL, do not "fix" them to `pl`/`pr`.

## Copy-paste base
`examples/layout-and-content/kbd/working-with-modifier.html` (smallest complete block; the border is omitted, which under moon is visually identical to `border-surface-line`)

```html
<!-- KBD -->
<span class="flex flex-wrap items-center gap-x-1 text-sm text-muted-foreground-2">
  <kbd class="min-h-7.5 inline-flex justify-center items-center py-1 px-1.5 bg-surface-1 font-mono text-sm text-surface-foreground rounded-md">
    shift
  </kbd>
  and
  <kbd class="min-h-7.5 inline-flex justify-center items-center py-1 px-1.5 bg-surface-1 font-mono text-sm text-surface-foreground rounded-md">
    b
  </kbd>
</span>
<!-- End KBD -->
```
