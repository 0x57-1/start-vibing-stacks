---
component: file-uploading-progress-form
label: File Uploading Progress
category: base-components
docs: https://preline.co/docs/components/file-uploading-progress-form.html
examples: 7
js: none
tokens: [foreground, muted-foreground-1, layer, layer-line, layer-foreground, surface-1, primary, primary-foreground, surface-hover, surface-focus, card, card-line, card-footer, muted]
---

# File Uploading Progress

A per-file upload row: type-icon chip, name + size, pause/delete controls, and a percentage progress bar — plus a card shell that stacks several rows over a summary footer.

## When to use

- Rendering the state of an in-flight or finished upload you are driving yourself (XHR / fetch progress events).
- **Do not** use it as the drop zone — that is the `file-upload` component (`HSFileUpload`, Dropzone-backed). This one is only the *readout*; it has no input, no dropzone, no JS.
- Single row = bare `div.w-full`; 2+ rows = the card shell from the `multiple-files-*` examples.

## Anatomy

Reduced skeleton. Every class appears in `examples/base-components/file-uploading-progress-form/*.html`.

```html
<div class="w-full">
  <div class="mb-2 flex justify-between items-center">
    <div class="flex items-center gap-x-3">
      <span class="size-8 flex justify-center items-center bg-layer border border-layer-line text-layer-foreground rounded-lg">
        <svg class="shrink-0 size-5" …>…</svg>   <!-- file-type glyph, brand-coloured, hard-coded fills -->
      </span>
      <div>
        <p class="text-sm font-medium text-foreground">preline-ui.xls</p>
        <p class="text-xs text-muted-foreground-1">7 KB</p>
      </div>
    </div>
    <div class="inline-flex items-center gap-x-2">
      <!-- STATE SLOT: pause+delete buttons, OR a status <span> + delete -->
    </div>
  </div>

  <div class="flex items-center gap-x-3 whitespace-nowrap">
    <div class="flex w-full h-2 bg-surface-1 rounded-full overflow-hidden" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
      <!--                    ^ track                        ^ a11y value lives HERE -->
      <div class="… bg-primary …" style="width: 25%"></div>
      <!--          ^ state colour   ^ visual value lives HERE (inline style) -->
    </div>
    <div class="w-10 text-end"><span class="text-sm text-foreground">25%</span></div>
    <!--                              ^ third copy of the same number -->
  </div>
</div>
```

State is expressed in exactly three places: the bar's `bg-*`, the trailing-control slot, and the number (which appears three times — `aria-valuenow`, inline `width`, and the label text).

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Newly added file | Newly added file | `examples/base-components/file-uploading-progress-form/just-uploaded-file.html` | `aria-valuenow="1"` / `width: 1%` / label `1%`; bar `bg-primary`; controls = Pause + Delete |
| Upload in progress | Upload in progress | `examples/base-components/file-uploading-progress-form/in-progress-file.html` | Identical to the above except the number is `25` everywhere. This is the only difference between the two files |
| Upload complete | Upload complete | `examples/base-components/file-uploading-progress-form/completed.html` | Bar becomes `bg-teal-500`, `100` everywhere; the Pause `<button>` is **replaced** by `<span class="relative">` holding a teal check SVG + `<span class="sr-only">Success</span>`; Delete stays |
| Upload failed | Upload failed | `examples/base-components/file-uploading-progress-form/error.html` | Bar becomes `bg-red-500`; Pause replaced by a red warning SVG + `<span class="sr-only">Error</span>`. **Progress stays at 25%** — the failed bar is a partial red bar, not a full one |
| Multiple files: newly added | Multiple files: newly added | `examples/base-components/file-uploading-progress-form/multiple-files-just-uploaded.html` | Card shell: `flex flex-col bg-card border border-card-line shadow-2xs rounded-xl`, body `p-4 md:p-5 space-y-7` with 3 rows all at `1%`, footer `py-2 px-4 md:px-5 bg-muted border-t border-card-footer rounded-b-xl` reading `3 left` + Pause/Delete text buttons |
| Multiple files: in progress | Multiple files: in progress | `examples/base-components/file-uploading-progress-form/multiple-files-in-progress.html` | Same shell; rows 1 and 3 done (`bg-teal-500`, 100%, success icon), row 2 at 25%; footer `1 left` |
| Multiple files: mixed results | Multiple files: mixed results | `examples/base-components/file-uploading-progress-form/multiple-files-error.html` | Same shell; rows 1 and 3 done (`bg-teal-500`, 100%), row 2 becomes `bg-red-500` + error icon at 25%; footer `2 success, 1 failed` and the first footer button flips to a Play glyph labelled **Start**, promoted to the emphasised style `text-foreground hover:bg-surface-hover focus:bg-surface-focus` (no hover text change) instead of the resting `text-muted-foreground-1 hover:bg-surface-hover hover:text-foreground` |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `foreground` | file name, percentage label, active footer button | `gray-800` | `neutral-200` |
| `muted-foreground-1` | file size, resting icon buttons, footer button text | `gray-600` | `neutral-400` |
| `layer` | fill of the `size-8` file-type chip | `white` | `neutral-800` |
| `layer-line` | border of the file-type chip | `gray-200` | `neutral-700` |
| `layer-foreground` | chip glyph colour (unused by the brand SVGs — see Gotchas) | `gray-800` | `white` |
| `surface-1` | progress bar **track** | `gray-200` | `neutral-600` |
| `primary` | progress bar **fill** while uploading | `gray-800` | `white` |
| `primary-foreground` | declared text colour inside the bar (no text exists) | `white` | `neutral-800` |
| `card` | multi-file card body fill | `white` | `neutral-800` |
| `card-line` | multi-file card border | `gray-200` | `neutral-700` |
| `card-footer` | `border-t` between body and footer | `gray-200` | `neutral-700` |
| `muted` | multi-file card footer fill | `gray-50` | `neutral-800` |
| `surface-hover` | footer button hover fill | `gray-200` | `neutral-600` |
| `surface-focus` | footer button focus fill | `gray-200` | `neutral-600` |

## Behaviour (JS)

Static markup only -- no Preline JS. `index.json` reports empty `hs_attrs` and `hs_js` for all 7 examples. Progress is yours to drive: on each progress event write the same number to `aria-valuenow`, to the inline `style="width: N%"`, and to the label text, and swap the bar's `bg-*` on completion/failure.

## Gotchas

- **The number lives in three places and nothing syncs them.** `aria-valuenow`, the inline `width`, and the visible label are independent strings. Update one and screen readers or sighted users see a stale value. `role="progressbar"` sits on the *track*, not the fill — put `aria-valuenow` there.
- **State colours are raw palette, not tokens.** `bg-teal-500` (complete) and `bg-red-500` (error) do not follow a theme swap and have no `dark:` variant; only the in-progress `bg-primary` is tokenised (and it inverts hard under moon: `gray-800` light → `white` dark).
- **The in-progress bar has no colour of its own — it flips with the theme.** `primary` is `gray-800` in light and `white` in dark, so the same markup renders a near-black bar on a light page and a pure-white bar on a dark one. The bar itself is always the highest-contrast element in the row; the element that goes weak in dark mode is the *track*: `surface-1` = `neutral-600` sitting on the multi-file shell's `card` = `neutral-800`, two steps apart. If the empty portion of the bar has to read as a distinct trough, override the track — not the fill.
- **Failure does not mean 100%.** `error.html` keeps `aria-valuenow="25"` / `width: 25%` and the label `25%`. A red *full* bar is not what Preline ships; do not "fix" it to 100 without deciding what you want.
- **Completed and error remove the Pause button entirely** — they do not disable it. The `<span class="relative">` status wrapper takes its slot, so the control column shifts from 2 buttons to icon + 1 button. Every status span pairs its SVG with `<span class="sr-only">Success</span>` / `Error`; keep that, it is the only accessible name in the row.
- **`text-primary-foreground` inside the bar fill is dead weight** — no example ever puts text in the bar. Harmless, but do not assume a percentage renders there.
- **The file-type SVG has hard-coded `fill="#21A366"` etc.** (an Excel icon). It ignores `layer-foreground` and will not retheme or invert. Swap the whole SVG per MIME type; do not try to recolour it with a class.
- **Footer button styling encodes state.** Resting controls use `text-muted-foreground-1 hover:text-foreground`; the primary action in the mixed-results footer (`Start`) uses `text-foreground` with no hover text change. That is the pattern for "this is the action to take now".
- **`surface-hover` and `surface-focus` are the same colour under moon** (`gray-200` / `neutral-600`), as are `card-line` and `card-footer` (`gray-200` / `neutral-700`) — do not expect visible separation between those pairs.
- Card body spacing is `space-y-7` between rows; the row itself provides no vertical margin, so stacking rows without that wrapper glues them together.

## Copy-paste base

Progress bar block, verbatim from `examples/base-components/file-uploading-progress-form/in-progress-file.html` (the file-type SVG in the header is ~3 KB of paths — cat the full file for it):

```html
  <!-- Progress Bar -->
  <div class="flex items-center gap-x-3 whitespace-nowrap">
    <div class="flex w-full h-2 bg-surface-1 rounded-full overflow-hidden" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
      <div class="flex flex-col justify-center rounded-full overflow-hidden bg-primary text-xs text-primary-foreground text-center whitespace-nowrap transition duration-500" style="width: 25%"></div>
    </div>
    <div class="w-10 text-end">
      <span class="text-sm text-foreground">25%</span>
    </div>
  </div>
  <!-- End Progress Bar -->
```
