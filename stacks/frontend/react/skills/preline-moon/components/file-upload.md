---
component: file-upload
label: File Upload
category: third-party-plugins
docs: https://preline.co/docs/components/file-upload.html
examples: 7
js: HSFileUpload
tokens: [foreground, layer, layer-line, primary, primary-foreground, primary-hover, primary-focus, muted-foreground, muted-foreground-1, muted-foreground-2, surface-1, line-3, surface, surface-foreground]
---

# File Upload

A Dropzone.js instance wrapped by `HSFileUpload`, which renders one clone of a `<template data-hs-file-upload-preview>` per file and fills in name, extension, size, icon/thumbnail and progress bar from `data-hs-file-upload-*` slots.

## When to use
- Drag-and-drop or click-to-browse upload with per-file previews and progress: document lists, image galleries, single avatar pickers.
- NOT for a plain form field you POST with the rest of the form — Dropzone uploads to `options.url` immediately on drop. Use `components/file-input.md` (a styled `<input type="file">`, no JS) for deferred submit.
- NOT if you cannot ship both **lodash** and **Dropzone**: `HSFileUpload` `console.error`s `"HSFileUpload: Lodash is not available, please add it to the page."` / `"HSFileUpload: Dropzone is not available, please add it to the page."` and skips `autoInit()` entirely.
- For a picker that only needs to look like an input, `input-file.html` is the smallest shape; for a single avatar, `single-image-upload.html`.

## Anatomy

REDUCED SKELETON — every attribute shown is queried by `assets/js/preline/file-upload.js`.

```html
<!-- root: JSON options live in the attribute value -->
<div data-hs-file-upload='{ "url": "/upload", "maxFiles": 1, "singleton": true }'>

  <!-- cloned once per file; NOT rendered as-is -->
  <template data-hs-file-upload-preview>
    <span data-hs-file-upload-file-name></span>.<span data-hs-file-upload-file-ext></span>
    <p data-hs-file-upload-file-size></p>
    <span data-hs-file-upload-file-icon>
      <img class="rounded-lg hidden" src="data:," alt="" data-dz-thumbnail>   <!-- Dropzone attr, not Preline -->
    </span>
    <div role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" data-hs-file-upload-progress-bar>
      <div style="width: 0" data-hs-file-upload-progress-bar-pane></div>
    </div>
    <span data-hs-file-upload-progress-bar-value>0</span>%
    <button type="button" data-hs-file-upload-remove>…</button>
    <button type="button" data-hs-file-upload-reload>…</button>
  </template>

  <!-- becomes Dropzone's `clickable` element. The DROP target is the root div above
       (`new Dropzone(this.el, …)`), not this one. -->
  <div class="cursor-pointer p-12 flex justify-center bg-layer border border-dashed border-line-3 rounded-xl" data-hs-file-upload-trigger>…</div>

  <!-- becomes Dropzone's `previewsContainer` -->
  <div class="mt-4 space-y-2 empty:mt-0" data-hs-file-upload-previews></div>
</div>
```

Assets (`examples/third-party-plugins/file-upload/how-to-use-assets-library.html`):

```html
<script src="./assets/vendor/lodash/lodash.min.js"></script>
<script src="./assets/vendor/dropzone/dist/dropzone-min.js"></script>
```

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| lodash + Dropzone | Installation | `examples/third-party-plugins/file-upload/how-to-use-assets-library.html` | The two hard dependencies. Both are checked by name at `load`. |
| Default file upload | Default file upload | `examples/third-party-plugins/file-upload/example.html` | Full row preview: icon slot, name + ext, size, remove button, 2px progress bar (`bg-surface-1` track, `bg-primary` pane, `hs-file-upload-complete:bg-green-500`). Dashed `border-line-3` drop zone. Declares per-extension `icon`/`class` in the JSON. |
| File size validation | File size validation | `examples/third-party-plugins/file-upload/error.html` (+ `.js`) | Adds `maxFilesize: 1` and two extra markers per preview: `data-hs-file-upload-file-error` (red text + red `hs-tooltip`, both `style="display: none;"`) and `data-hs-file-upload-file-success` on the size line, plus a `data-hs-file-upload-reload` retry button. The toggling is done by the page's own `dropzone.on('error', …)`. |
| Image gallery upload | Image gallery upload | `examples/third-party-plugins/file-upload/gallery.html` | `acceptedFiles: "image/*"`, `autoHideTrigger: false`; preview is a thumbnail card (`data-dz-thumbnail` visible), no name/ext/size slots; previews container is `grid grid-cols-4 gap-x-2 empty:gap-0`. |
| Single-image upload | Single-image upload | `examples/third-party-plugins/file-upload/single-image-upload.html` | `acceptedFiles: "image/*", maxFiles: 1, singleton: true`. Preview is a bare round `<img>`. Previews container doubles as `data-hs-file-upload-pseudo-trigger`; separate `data-hs-file-upload-trigger` button + `data-hs-file-upload-clear` delete button. Empty state hidden via `group-has-[div]:hidden`. |
| Input-style file picker | Input-style file picker | `examples/third-party-plugins/file-upload/input-file.html` | Renders as a form input: `bg-surface` "Choose File" cap + `data-hs-file-upload-previews` showing "No Chosen File" until a file exists; the trigger is an absolutely positioned `size-full` overlay span. Smallest example (1.1 KB). |
| Destroy and reinitialize | Destroy and reinitialize | `examples/third-party-plugins/file-upload/destroy-and-reinitialize.html` (+ `.js`) | Default markup with 4 deltas: root gains `id="hs-file-upload-to-destroy"`, drop-zone border becomes `border-layer-line`, cloud SVG becomes `text-primary`, and a sibling `<div>` adds two control buttons (`#hs-destroy-file-upload` on `bg-layer`, `#hs-auto-init-file-upload` on `bg-surface`, `disabled`). The JS wires `HSFileUpload.getInstance(el, true).element.destroy()` and `HSFileUpload.autoInit()`. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` | Drop-zone fill and preview-card fill (`bg-layer`); also the icon square and the "browse" word's background | `white` | `neutral-800` |
| `layer-line` | Preview card border; drop-zone border in the gallery/destroy variants (`border-dashed border-layer-line`) | `gray-200` | `neutral-700` |
| `line-3` | Drop-zone dashed border in the Default/error variants, and the dotted ring of the single-image empty state (`border-2 border-dotted border-line-3`) | `gray-300` | `neutral-600` |
| `foreground` | File name, "Drop your file here or", the numeric progress value | `gray-800` | `neutral-200` |
| `muted-foreground-1` | File size line, remove/reload icon buttons at rest, and the file-icon glyph | `gray-600` | `neutral-400` |
| `muted-foreground-2` | The "Drop your file here or …" line wrapper (`text-sm/6`) | `gray-700` | `neutral-300` |
| `muted-foreground` | The "Pick a file up to 2MB." hint, the big cloud SVG in Default, and the camera glyph in single-image | `gray-500` | `neutral-500` |
| `surface-1` | Progress-bar **track** (`bg-surface-1`) | `gray-200` | `neutral-600` |
| `primary` | Progress-bar **pane** fill, the "browse" link colour, and the big cloud SVG in every variant except Default (`text-primary`) | `gray-800` | `white` |
| `primary-foreground` | Text on the progress pane and on the "Upload photo" button | `white` | `neutral-800` |
| `primary-hover` | "browse" hover colour, "Upload photo" hover fill | `gray-900` | `neutral-300` |
| `primary-focus` | Focus ring on "browse" and on the input-style picker (`focus:ring-primary-focus`) | `gray-900` | `neutral-300` |
| `primary-line` | Border of the "Upload photo" button | `transparent` | `transparent` |
| `surface` / `surface-foreground` | "Choose File" cap in the input-style picker, and the "Reinitialize file upload" button in destroy | `gray-100` / `gray-800` | `neutral-700` / `neutral-200` |
| `surface-line` / `surface-hover` / `surface-focus` | destroy variant only: that same "Reinitialize" button (the input-style cap has no border/hover/focus) | `transparent`/`gray-200`/`gray-200` | `transparent`/`neutral-600`/`neutral-600` |
| `layer-foreground` | The input-style picker button, and "Destroy file upload" in destroy. **Not** single-image's "Delete", which is `text-red-500` | `gray-800` | `white` |
| `layer-hover` / `layer-focus` | single-image's empty-state circle + "Delete", and "Destroy file upload" | `gray-50`/`gray-50` | `neutral-700`/`neutral-700` |
| `tooltip` / `tooltip-foreground` / `tooltip-line` | Error variant only: the red-icon size-limit tooltip | `gray-900`/`white`/`transparent` | `white`/`neutral-800`/`transparent` |

## Behaviour (JS)

Class `HSFileUpload` (`assets/js/preline/file-upload.js`), exposed as `window.HSFileUpload`, collection `window.$hsFileUploadCollection`.

**Init.** `Dropzone.autoDiscover = false` is set at module evaluation (guarded by `typeof Dropzone !== 'undefined'`), so load order matters: Dropzone must be on the page before `file-upload.js`. Then on `window` `load`: if any `[data-hs-file-upload]:not(.--prevent-on-load-init)` exists, it `console.error`s for whichever of `_` (lodash) / `Dropzone` is undefined, and calls `HSFileUpload.autoInit()` only when both are defined.

**Attributes.**

| Attribute | What it does |
|---|---|
| `data-hs-file-upload` | Root + JSON options. Parsed with `JSON.parse`. |
| `data-hs-file-upload-preview` | `el.querySelector('[data-hs-file-upload-preview]')?.innerHTML` becomes Dropzone's `previewTemplate`. Every example puts it on a `<template>`; any element works. If absent, a built-in default template is used — and that one is hardcoded `bg-white / border-gray-300 / bg-blue-600 / dark:*`, not tokens. |
| `data-hs-file-upload-previews` | Becomes `previewsContainer`. |
| `data-hs-file-upload-trigger` | Becomes `clickable`. Also gets `style.display='none'` when files exist **iff** `autoHideTrigger` is true. |
| `data-hs-file-upload-pseudo-trigger` | Any number of elements; each gets an `onclick` that forwards `.click()` to the `clickable` element. |
| `data-hs-file-upload-file-name` / `-file-ext` | `textContent` from `splitFileName(file.name)` (split at the last `.`). |
| `data-hs-file-upload-file-size` | `textContent` from `formatFileSize(file.size)` → `B / KB / MB / GB / TB`, 2 decimals. |
| `data-hs-file-upload-file-icon` | Container the extension `<svg>` is `append`ed into. Gated on `[data-dz-thumbnail]` existing **anywhere in the preview**: if it does and `file.type` includes `image/`, that `<img>` gets `hidden` removed; if it does and the type is not an image, `setIcon(ext, iconEl)` runs. No thumbnail node → neither branch runs. |
| `data-hs-file-upload-progress-bar` / `-pane` / `-value` | `aria-valuenow` / `style.width='<n>%'` / `innerText='<n>'` (floored). |
| `data-hs-file-upload-remove` / `-clear` | `dropzone.removeFile(file)` / `dropzone.removeAllFiles(true)`. |
| `data-hs-file-upload-reload` | Per-file "replace this file" button. Its click builds a detached `<input type="file">`, `.click()`s it, and on `change` copies the preview refs onto the new File then `dropzone.removeFile(old)` + `dropzone.addFile(new)`. Both listeners are tracked so `destroy()` can unbind them. |

**Options.** Preline sets `clickable`, `previewsContainer`, `previewTemplate`, `addRemoveLinks: false`, `autoHideTrigger: false`, then spreads your JSON over them. Preline-specific keys: `singleton` (on add, if `files.length > 1`, remove `files[0]`) and `extensions` (`_.merge`d with a built-in `{ icon, class }` map). Everything else (`url`, `maxFiles`, `maxFilesize`, `acceptedFiles`, …) is plain Dropzone.

**Events.** Preline subscribes to `addedfile`, `removedfile`, `uploadprogress`, `complete`. Reach the raw emitter via `element.dropzone.on('error', (file, response) => …)` — exactly what `error.js` does.

**Static methods.** `HSFileUpload.autoInit()`; `HSFileUpload.getInstance(elOrSelector, isInstance)` — pass `true` for `{ id, element }` (then `element.destroy()` / `element.dropzone`), falsy returns the raw DOM node. `instance.destroy()` unbinds tracked listeners, calls `dropzone.destroy()`, and drops itself from `$hsFileUploadCollection`.

## Gotchas

- **`data-hs-file-upload-file-error` and `data-hs-file-upload-file-success` are NOT runtime attributes.** Grep `assets/js/preline/file-upload.js`: they do not appear. `error.html` ships them with inline `style="display: none;"` and `error.js` toggles them by hand inside `dropzone.on('error', …)`. Copying `error.html` without that script gives you an error UI that never appears.
- **After toggling an error tooltip into view you must re-init tooltips.** `error.js` ends with `HSStaticMethods.autoInit(['tooltip'])`; the tooltip markup was inside a `<template>` clone and has no `HSTooltip` instance until then.
- **`getInstance(el)` returns the element, `getInstance(el, true)` returns the instance wrapper.** `destroy-and-reinitialize.js` destructures `const { element } = HSFileUpload.getInstance(fileUpload, true)` and then calls `element.destroy()`. The naming is inverted from what you would guess: `element` is the *HSFileUpload instance*, `element.el` is the DOM node.
- **`onComplete` adds the class `complete`, not `hs-file-upload-complete`.** `hs-file-upload-complete:` is a Tailwind 4 `@custom-variant` that maps onto `.complete`; it is declared in `assets/css/src/plugins/file-upload/variants.css`, reached only through line 22 of `assets/css/variants.css`. Skip that import chain and `hs-file-upload-complete:bg-green-500` compiles to nothing — the finished bar stays `bg-primary`.
- **`autoHideTrigger` defaults to `false`, and no example turns it on.** It sits in `concatOptions` as `autoHideTrigger: !1` and is read in `previewAccepted` (`display='none'` when `files.length > 0`) and `onRemoveFile` (`display=''` at zero files). Every shipped example therefore keeps the drop zone visible after a pick — `gallery.html`'s explicit `"autoHideTrigger": false` restates the default and changes nothing. Pass `true` yourself if you want it to disappear.
- **`singleton: true` is not `maxFiles: 1`.** `maxFiles` makes Dropzone *reject* the second file; `singleton` silently *removes the first* so the newest always wins. `single-image-upload.html` and `input-file.html` set both.
- **`gallery.html`'s preview card is not tokenized.** It ships raw `bg-white border-gray-200 dark:bg-neutral-800 dark:border-neutral-700` where the other examples use `bg-layer border-layer-line`. Those resolve to the same moon colours today, but they will not follow a theme swap — replace them.
- **Preview slots do not exist in the DOM until a file is added** — they live inside `<template>`. Never `querySelector` or measure them at page load.
- **The drop target is the root `[data-hs-file-upload]`, not the dashed box.** `initDropzone()` does `new Dropzone(this.el, this.concatOptions)`; `[data-hs-file-upload-trigger]` is only passed as `clickable`. So a drop anywhere inside the root — including onto the previews list — is accepted, while a *click* only opens the picker on the trigger (or on any `[data-hs-file-upload-pseudo-trigger]`, which forwards `.click()` to it).
- **`surface-1` (`gray-200`/`neutral-600`) vs `primary` (`gray-800`/`white`) is the progress-bar contrast pair.** Under moon dark the pane is `white` on a `neutral-600` track — do not "fix" it with `bg-foreground` (`neutral-200`), which nearly vanishes against the track.
- **The drop-zone border differs between examples**: `border-line-3` (Default, error) vs `border-layer-line` (gallery, destroy). `line-3` is one step darker in light and one step lighter in dark. Pick one per app.

## Copy-paste base

`examples/third-party-plugins/file-upload/input-file.html` (verbatim — the smallest correct instance):

```html
<!-- File Upload -->
<div data-hs-file-upload='{
  "url": "/upload",
  "maxFiles": 1,
  "singleton": true
}'>
  <template data-hs-file-upload-preview>
    <div class="flex items-center w-full">
      <span class="grow-0 overflow-hidden truncate" data-hs-file-upload-file-name></span>
      <span class="grow-0">.</span>
      <span class="grow-0" data-hs-file-upload-file-ext></span>
    </div>
  </template>

  <button type="button" class="relative flex w-full bg-layer border border-layer-line text-layer-foreground shadow-2xs rounded-lg text-sm focus:outline-hidden focus:z-10 focus:border-primary-focus focus:ring-1 focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none">
    <span class="h-full py-3 px-4 bg-surface text-surface-foreground text-nowrap rounded-s-lg">Choose File</span>
    <span class="group grow flex overflow-hidden h-full py-3 px-4" data-hs-file-upload-previews>
      <span class="group-has-[div]:hidden">No Chosen File</span>
    </span>
    <span class="absolute top-0 left-0 size-full" data-hs-file-upload-trigger></span>
  </button>
</div>
<!-- End File Upload -->
```
