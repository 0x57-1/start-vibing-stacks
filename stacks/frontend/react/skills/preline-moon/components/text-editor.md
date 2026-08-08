---
component: text-editor
label: WYSIWYG Editor
category: third-party-plugins
docs: https://preline.co/docs/components/text-editor.html
examples: 7
js: none (Tiptap/ProseMirror -- Preline ships no editor module)
tokens: [foreground, muted-hover, muted-focus, layer, layer-line, muted-foreground-1, line-7]
---

# WYSIWYG Editor

A Tiptap (ProseMirror) editor whose toolbar is plain Preline markup: a sticky button row of `data-hs-editor-*` hooks plus an empty `data-hs-editor-field` div that Tiptap mounts into.

## When to use
- Rich text authoring where the stored value is HTML: comments, descriptions, CMS body fields.
- NOT for plain text that just needs to grow — use the auto-height textarea (scheme `components/textarea.md`, `HSTextareaAutoHeight` in `assets/js/preline/textarea-auto-height.js`, 5 KB shipped) instead of pulling the whole Tiptap/ProseMirror graph off `esm.sh`.
- NOT for code input — the `data-hs-editor-code` button toggles an inline `code` **mark**, not a code block with highlighting.
- The examples import Tiptap from `esm.sh` at runtime (`<script type="module">`). For a bundled app, install `@tiptap/*` from npm and keep only the markup + the wiring loop.

## Anatomy

REDUCED SKELETON — the toolbar buttons are inert markup; the only structural requirements are the wrapper `id` and the empty field div.

```html
<!-- REDUCED: 1 of 9 toolbar buttons shown; all 9 share the same class string -->
<div class="bg-layer border border-layer-line rounded-xl overflow-hidden">
  <div id="hs-editor-tiptap">                                  <!-- scoping id used by every querySelector -->
    <div class="sticky top-0 bg-layer flex align-middle gap-x-0.5 border-b border-layer-line p-2">
      <button class="size-8 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-full text-foreground hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus disabled:opacity-50 disabled:pointer-events-none" type="button" data-hs-editor-bold>
        <svg class="shrink-0 size-4" …></svg>
      </button>
      <!-- data-hs-editor-italic | -underline | -strike | -link | -ol | -ul | -blockquote | -code -->
    </div>

    <div class="h-40 overflow-auto" data-hs-editor-field></div>   <!-- MUST be empty: Tiptap replaces its content -->
  </div>
</div>
```

Assets (`how-to-use-basic-js-library.html`, `how-to-use-extensions-js-library.html`):

```js
import { Editor } from 'https://esm.sh/@tiptap/core@2.11.0';
import StarterKit from 'https://esm.sh/@tiptap/starter-kit@2.11.0';
```

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Core imports | Installation | `examples/third-party-plugins/text-editor/how-to-use-basic-js-library.html` | The two mandatory ESM imports: `@tiptap/core` + `starter-kit`, pinned to `2.11.0`. |
| Extension imports | Installation | `examples/third-party-plugins/text-editor/how-to-use-extensions-js-library.html` | Unpinned `extension-placeholder` / `extension-ordered-list` imports (the docs' "…" list). |
| Minimal init | Installation | `examples/third-party-plugins/text-editor/how-to-use-init-js-library.html` | Smallest wiring: `new Editor({ element, extensions })` + one `click` → `editor.chain().focus().toggleOrderedList().run()`. |
| Known issues | Installation | `examples/third-party-plugins/text-editor/how-to-use-known-issues-library.html` | An `<script type="importmap">` remapping six `prosemirror-model` versions (1.19.3 – 1.24.1) onto `1.20.0`. Markup, not prose — ship it verbatim. |
| Default editor | Default editor | `examples/third-party-plugins/text-editor/basic-usage.html` (+ `.js`, `.css`) | Full 9-button toolbar + field. JS configures Placeholder, Paragraph, Bold, Underline, Link, BulletList, OrderedList, ListItem, Blockquote and binds all 9 buttons through an `actions` array. |
| Custom blockquote style | Custom blockquote style | `examples/third-party-plugins/text-editor/alternative-blockquote.html` (+ `.js`, `.css`) | Markup differs **only** in the wrapper id (`hs-editor-tiptap-blockquote-alt`) — `diff` against `basic-usage.html` is one line. JS defines a `Node.create({ name: 'customBlockquote', … addNodeView() })` that injects a decorative quote SVG, adds `blockquote: false` to `StarterKit.configure`, drops the `Blockquote` import, and swaps the toggle to `toggleWrap('customBlockquote')`. Its imports are **unpinned** (`https://esm.sh/@tiptap/core`, no `@2.11.0`) — see the importmap gotcha. |
| Editor in modal | Modal example | `examples/third-party-plugins/text-editor/modal-example.html` (+ `.js`, `.css`) | Same editor nested in an `hs-overlay` dialog (`data-hs-overlay`, `overlay`/`overlay-header`/`overlay-footer` chrome, `surface` close button, `primary` save button). Wrapper id `hs-editor-tiptap-modal`. |

## Theme tokens (moon)

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `layer` | Editor shell fill and the sticky toolbar fill (`bg-layer` on both, so the toolbar hides scrolled content) | `white` | `neutral-800` |
| `layer-line` | Shell border and the rule under the toolbar (`border-b border-layer-line`) | `gray-200` | `neutral-700` |
| `foreground` | Toolbar icon colour; also the paragraph / list text set from JS (`text-sm text-foreground`, `list-disc list-inside text-foreground`) | `gray-800` | `neutral-200` |
| `muted-hover` | Toolbar button hover fill (`hover:bg-muted-hover`, round `size-8`) | `gray-100` | `neutral-700` |
| `muted-focus` | Toolbar button focus fill (`focus:bg-muted-focus`) | `gray-100` | `neutral-700` |
| `muted-foreground-1` | Placeholder text, applied as `emptyNodeClass: 'before:text-muted-foreground-1'` | `gray-600` | `neutral-400` |
| `line-7` | Blockquote left rule in the Default and modal editors (`Blockquote.configure` → `relative border-s-4 ps-4 sm:ps-6 border-line-7 sm:[&>p]:text-lg`). The custom-blockquote variant drops it. | `gray-700` | `neutral-200` |
| `overlay` / `overlay-line` / `overlay-header` / `overlay-footer` | Modal variant: dialog panel, its border, header rule, footer rule | `white`/`transparent`/`gray-200`/`gray-200` | `neutral-800`/`transparent`/`neutral-700`/`neutral-700` |
| `surface` / `surface-line` / `surface-foreground` / `surface-hover` / `surface-focus` | Modal variant: the round close button | `gray-100`/`transparent`/`gray-800`/`gray-200`/`gray-200` | `neutral-700`/`transparent`/`neutral-200`/`neutral-600`/`neutral-600` |
| `primary` / `primary-line` / `primary-foreground` / `primary-hover` / `primary-focus` | Modal variant: "Open modal" and "Save changes" buttons | `gray-800`/`transparent`/`white`/`gray-900`/`gray-900` | `white`/`transparent`/`neutral-800`/`neutral-300`/`neutral-300` |
| `layer-foreground` / `layer-hover` / `layer-focus` | Modal variant: the secondary "Close" button | `gray-800`/`gray-50`/`gray-50` | `white`/`neutral-700`/`neutral-700` |
| `scrollbar-track` / `scrollbar-thumb` | Modal variant: `[&::-webkit-scrollbar-*]` on the dialog body | `gray-100` / `gray-300` | `neutral-700` / `neutral-500` |

## Behaviour (JS)

Static markup only -- no Preline JS. There is **no** `text-editor.js` in `assets/js/preline/`, and no `HSEditor` class anywhere in the runtime.

`data-hs-editor-bold | -italic | -underline | -strike | -link | -ol | -ul | -blockquote | -code | -field` are **naming conventions only**: nothing reads them but the example's own `document.querySelector`. Rename them and the editor still works, as long as your selectors match.

Wiring (`basic-usage.js`, `<script type="module">`):

```js
const editor = new Editor({
  element: document.querySelector('#hs-editor-tiptap [data-hs-editor-field]'),
  editorProps: { attributes: { class: 'relative min-h-40 p-3' } },
  extensions: [ StarterKit.configure({ history: false }), Placeholder.configure({…}), … ]
});

const actions = [{ id: '#hs-editor-tiptap [data-hs-editor-bold]', fn: () => editor.chain().focus().toggleBold().run() }, …];
actions.forEach(({ id, fn }) => { const action = document.querySelector(id); if (action === null) return; action.addEventListener('click', fn); });
```

| Button | Command |
|---|---|
| `-bold` / `-italic` / `-underline` / `-strike` / `-code` | `toggleBold()` / `toggleItalic()` / `toggleUnderline()` / `toggleStrike()` / `toggleCode()` |
| `-link` | `window.prompt('URL')` then `extendMarkRange('link').setLink({ href: url })` |
| `-ol` / `-ul` / `-blockquote` | `toggleOrderedList()` / `toggleBulletList()` / `toggleBlockquote()` (custom variant: `toggleWrap('customBlockquote')`) |

The modal variant additionally needs `HSOverlay` (`assets/js/preline/overlay.js`) for `data-hs-overlay` — that part *is* Preline JS.

## Gotchas

- **The `<style>` block is mandatory and identical across all three styled examples** (`basic-usage.css` == `alternative-blockquote.css` == `modal-example.css`). Without `.tiptap p.is-editor-empty:first-child::before { content: attr(data-placeholder) }` the placeholder never renders; without `.ProseMirror:focus { outline: none }` the browser draws a focus ring around the whole editor body.
- **The placeholder colour must be a `before:` variant.** The docs' Installation snippet uses `emptyNodeClass: 'text-foreground'`, which does nothing visible — the placeholder is a `::before` pseudo-element. `basic-usage.js` uses `emptyNodeClass: 'before:text-muted-foreground-1'`. Copy the latter.
- **Ship the importmap from `how-to-use-known-issues-library.html`** whenever any import is unpinned — which is exactly the case in `alternative-blockquote.js`. Unpinned `esm.sh` specifiers resolve to whatever `prosemirror-model` each package currently wants, so one page ends up with two copies of it. The remap rewrites the `v135/prosemirror-model@{1.19.3,1.21.0,1.22.1,1.23.0,1.24.0,1.24.1}/es2022/prosemirror-model.mjs` URLs onto `1.20.0`. `basic-usage.js` and `modal-example.js` sidestep it by pinning every import to `@2.11.0`.
- **Editor padding lives in JS, not markup.** `editorProps.attributes.class = 'relative min-h-40 p-3'` is applied to the ProseMirror root *inside* the field div; the markup wrapper only carries `h-40 overflow-auto`. Put `p-*` on the wrapper too and you pad twice, once outside the scroll box and once inside. Those classes exist only inside a `.js` file — add your JS to the Tailwind `@source`/content globs or they get purged.
- **The field div ships empty in every example** (`<div class="h-40 overflow-auto" data-hs-editor-field></div>`), and it is what Tiptap is handed as `element`. Anything you put inside is a mount-time casualty, not markup you can style.
- **Every selector is scoped by the wrapper id.** `alternative-blockquote.html` differs from `basic-usage.html` by exactly one line — `id="hs-editor-tiptap-blockquote-alt"` — because two editors on one page with the same id would bind the second editor's commands to the first editor's buttons. Change the id in both the HTML and all 9 `actions` entries.
- **`line-7` inverts hard under moon**: the blockquote rule is `gray-700` in light and `neutral-200` in dark, i.e. near-black on white then near-white on `neutral-800`. That is intentional (it is a contrast rule, not a border), so do not "fix" it to `layer-line`.
- **No active state.** The toolbar buttons have `hover:bg-muted-hover` / `focus:bg-muted-focus` and nothing else; no example reads `editor.isActive(…)`. There is no editor variant in `assets/css/variants.css` either (`grep -i editor` there matches nothing), so `hs-editor-active:` does not exist. A pressed look is yours to wire.
- **`StarterKit` already includes Bold/Italic/Strike/BulletList/OrderedList/ListItem/Blockquote/Paragraph.** The examples re-import and re-`configure()` them for one reason only: every `configure()` call in `basic-usage.js` sets nothing but `HTMLAttributes.class`. Delete the re-imports and you keep the commands and lose the styling.
- **`blockquote: false` in the custom variant is about the HTML tag, not the extension name.** `CustomBlockquote` declares `parseHTML() { return [{ tag: 'blockquote' }] }`, the same tag StarterKit's built-in blockquote node claims. `StarterKit.configure({ history: false, blockquote: false })` is what leaves that tag to the custom node. The names (`blockquote` vs `customBlockquote`) never collide.
- **`history: false` in the Default example disables undo/redo.** Drop that option unless you are deliberately delegating history elsewhere.

## Copy-paste base

`examples/third-party-plugins/text-editor/basic-usage.html` — verbatim, toolbar elided after the first button (the other 8 are the same `<button>` class string, differing only in the `data-hs-editor-*` attribute and the SVG's inner `<path>`/`<line>` children):

```html
<!-- Tiptap -->
<div class="bg-layer border border-layer-line rounded-xl overflow-hidden">
  <div id="hs-editor-tiptap">
    <div class="sticky top-0 bg-layer flex align-middle gap-x-0.5 border-b border-layer-line p-2">
      <button class="size-8 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-full text-foreground hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus disabled:opacity-50 disabled:pointer-events-none" type="button" data-hs-editor-bold>
        <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 12a4 4 0 0 0 0-8H6v8"/><path d="M15 20a4 4 0 0 0 0-8H6v8Z"/></svg>
      </button>
      <!-- …8 more buttons in the file: data-hs-editor-italic, -underline, -strike, -link, -ol, -ul, -blockquote, -code… -->
    </div>

    <div class="h-40 overflow-auto" data-hs-editor-field></div>
  </div>
</div>
<!-- End Tiptap -->
```

Required CSS, verbatim from `examples/third-party-plugins/text-editor/basic-usage.css`:

```html
<style>
  .ProseMirror:focus {
    outline: none;
  }

  .tiptap ul p,
  .tiptap ol p {
    display: inline;
  }

  .tiptap p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
</style>
```
