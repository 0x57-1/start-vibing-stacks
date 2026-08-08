# Preline `moon` — component index

Grep this file first. One line per component. Then read the scheme, then `cat` the example file
named in the scheme. Paths are relative to `$CLAUDE_PROJECT_DIR/.claude/skills/preline-moon/`.

> **Before the component tables — three things the tables cannot tell you.**
>
> **1. The theme only exists if `<html>` says `theme-moon`.**
> ```html
> <html data-theme="theme-moon" class="dark">
> ```
> The value carries a `theme-` prefix. `data-theme="moon"` matches no selector, errors nowhere, and
> silently renders the **default blue theme**. Tokens flip by themselves — a `dark:` variant next to
> `bg-card` is a bug. Mechanism: `reference/theming.md` §3. Already wired in pubweb-saas:
> `reference/project-integration.md` §2.
>
> **2. Building a page, not a component? Start at *Page recipes* (below), not at these tables.**
> No row here is "settings page" or "list page" — those are compositions, and guessing the
> composition is where the time goes.
>
> **3. In pubweb-saas, some of these are already React components.** `Modal`, `ScrollTable`,
> `EmptyState`, `ToggleSwitch`, `StatusBadge`, `MultiSelect`, `DateRangeDropdown`, `Spinner` and ~17
> more live in `resources/js/Components/Common/` and reusing them is a repo rule, not a preference.
> Inventory: `reference/project-integration.md` §5. Check it before you paste Preline markup.

## Page recipes — compositions, not components

The tables below are per-component. Real requests are page-shaped. These are the assemblies, with
the file for each part. Nothing here is new markup; it is a shopping list.

| You were asked for | Parts, in the order you build them |
|---|---|
| **Settings page** | Shell `container mx-auto` (`examples/layout-and-content/container/static-1.html`) → one card per section, `examples/base-components/card/header-and-footer.html` (`bg-card border-card-line`; header `bg-surface border-b border-card-line`) → rows of `input` / `select` / `switch` (`examples/basic-forms/switch/with-description.html` = toggle + adjacent text label — **no example ships a label+help-text+toggle row, you compose that**) → save button = the first button in `examples/base-components/buttons/types.html` (`bg-primary border-primary-line text-primary-foreground hover:bg-primary-hover focus:bg-primary-focus`) → destructive zone, see *danger / delete button* below |
| **List / index page** | `tables` for static rows, `datatables` when it must sort+search+page → `pagination` if you render the window server-side → `card/empty-states.html` for zero rows → `skeleton` while loading |
| **Detail drawer over a list** | `offcanvas` (`examples/overlays/offcanvas/example.html`). Want the page still scrollable behind it? `scrolling.html` — needs **both** `[--body-scroll:true]` and `[--overlay-backdrop:false]` |
| **Confirm / delete dialog** | `modal` — `components/modal.md` §Confirm dialog has the recipe and the destructive-button caveat |
| **Wizard / onboarding** | `stepper` (panes + rail) — not `tabs`, which has no step state |
| **Dashboard** | `card` grid via `grid` → `charts` (`+ ApexCharts`) → `legend-indicator` → `progress` |

## Third-party globals — is the component even usable here?

Nine components are wrappers around a library that must be on `globalThis` **before**
`import('preline')`. If it is not, that component's factory is `null` for the life of the page and
`autoInit()` skips it forever, with no console error (`SKILL.md` rule 7).

| Global | Components it gates | Wired in pubweb-saas? |
|---|---|---|
| `jQuery` + `DataTable` | `datatables` | **yes** — `resources/js/app.jsx:13,16,23-24` |
| `noUiSlider` | `advanced-range-slider` | **yes** — `app.jsx:15,25` |
| `Dropzone` | `file-upload` | **yes** — `app.jsx:17` |
| `VanillaCalendarPro` | `advanced-datepicker` | **yes** — `app.jsx:18,26` |
| `ApexCharts` | `charts` | via `react-apexcharts` |
| ClipboardJS / Toastify / Sortable / canvas-confetti / Leaflet / D3+Datamaps / Tiptap | `clipboard`, `toast-notifications`, `drag-and-drop`, `confetti`, `maps`, `datamaps`, `text-editor` | **no** — not installed; the repo uses `@dnd-kit` for drag-and-drop |

All five wired globals are assigned in `app.jsx:20-26`, above the `await import('preline')` at
`app.jsx:34`. That order is the whole contract — do not move an import above it.

- `Ex` = doc examples under `examples/<category>/<component>/`. 825 entries total, 822 with an
  `.html` file — the 3 without are `customization/dark-mode/hs-dark-mode-user.css`,
  `getting-started/index/hs-installation-steps-add.js`, `third-party-plugins/maps/how-to-use-assets.css`.
- `JS` = the Preline class that mounts it. `--` = pure markup + Tailwind, nothing to initialise.
- `*(no scheme)*` = a docs page, not a component; the listed `reference/` file covers it instead.
- 87 of the 98 rows have a scheme in `components/`. Intent lookup is in the last section.

## Base Components — 27 components, 239 examples

| Component | Category | What it is | Ex | JS | Scheme |
|---|---|---|---|---|---|
| `accordion` | base-components | Toggleable disclosure panels, JS-animated height | 9 | HSAccordion | `components/accordion.md` |
| `alerts` | base-components | Inline status banner, optional dismiss button | 9 | HSRemoveElement (dismiss variant only) | `components/alerts.md` |
| `avatar` | base-components | Square/circle photo, initials or glyph | 15 | -- | `components/avatar.md` |
| `avatar-group` | base-components | Overlapped facepile ending in N+ counter | 5 | -- | `components/avatar-group.md` |
| `badge` | base-components | Small inline pill: status, category, count | 14 | HSRemoveElement (dismissible variants only) | `components/badge.md` |
| `blockquote` | base-components | Quoted passage, decorative mark, footer attribution | 9 | -- | `components/blockquote.md` |
| `button-group` | base-components | Segmented button row, borders collapsed | 7 | -- | `components/button-group.md` |
| `buttons` | base-components | Class-string action control, six shapes | 17 | -- | `components/buttons.md` |
| `card` | base-components | Bordered elevated panel — the dashboard primitive | 23 | -- | `components/card.md` |
| `carousel` | base-components | TranslateX slider track, dots and arrows | 14 | HSCarousel | `components/carousel.md` |
| `chat-bubbles` | base-components | Message rows, side set by margins | 4 | -- | `components/chat-bubbles.md` |
| `collapse` | base-components | Selector-bound show/hide of arbitrary block | 3 | HSCollapse | `components/collapse.md` |
| `datepicker` | base-components | Static calendar grid markup, single/range | 6 | HSSelect, HSDatepicker | `components/datepicker.md` |
| `devices` | base-components | CSS phone bezel and browser chrome | 2 | -- | `components/devices.md` |
| `file-uploading-progress-form` | base-components | Per-file upload row with progress bar | 7 | -- | `components/file-uploading-progress-form.md` |
| `legend-indicator` | base-components | Coloured dot plus label for charts | 2 | -- | `components/legend-indicator.md` |
| `list-group` | base-components | Flush-joined rows sharing one border box | 11 | -- | `components/list-group.md` |
| `lists` | base-components | Ordered/unordered lists, inline dots, check features | 5 | -- | `components/lists.md` |
| `marquee` | base-components | Duplicated strip scrolled by CSS keyframes | 3 | -- | `components/marquee.md` |
| `progress` | base-components | Track plus inline-width fill bar | 15 | -- | `components/progress.md` |
| `ratings` | base-components | Star/heart/emoji score row, or thumbs | 6 | -- | `components/ratings.md` |
| `skeleton` | base-components | Grey placeholder bars for loading shapes | 3 | -- | `components/skeleton.md` |
| `spinners` | base-components | Twelve pure-CSS loading indicators | 17 | -- | `components/spinners.md` |
| `static-icons` | base-components | Sized coloured chip wrapping one SVG | 8 | -- | `components/static-icons.md` |
| `timeline` | base-components | Dated events on pseudo-element rail | 5 | -- | `components/timeline.md` |
| `toasts` | base-components | Self-contained alert card, positioned by you | 12 | HSRemoveElement (dismiss only; the dynamic demo uses third-party Toastify-js) | `components/toasts.md` |
| `tree-view` | base-components | Nested collapsible file explorer, optional selection | 8 | HSTreeView, HSAccordion | `components/tree-view.md` |

## Basic Forms — 11 components, 99 examples

| Component | Category | What it is | Ex | JS | Scheme |
|---|---|---|---|---|---|
| `checkbox` | basic-forms | Native checkbox restyled; row/card/list layouts | 11 | -- | `components/checkbox.md` |
| `color-picker` | basic-forms | Native input[type=color] in framed field | 1 | -- | `components/color-picker.md` |
| `file-input` | basic-forms | Themed input[type=file], restyled OS button | 3 | -- | `components/file-input.md` |
| `input` | basic-forms | Single-line field: skin, sizes, states | 16 | -- | `components/input.md` |
| `input-group` | basic-forms | Input joined to prefixes, icons, buttons | 14 | -- | `components/input-group.md` |
| `radio` | basic-forms | Native radio, one of a name set | 11 | -- | `components/radio.md` |
| `range-slider` | basic-forms | Native input[type=range], pseudo-element track/thumb | 4 | -- | `components/range-slider.md` |
| `select` | basic-forms | Native select carrying moon token utilities | 9 | -- | `components/select.md` |
| `switch` | basic-forms | Peer-driven CSS toggle, zero JS | 10 | -- | `components/switch.md` |
| `textarea` | basic-forms | Multi-line field, optional auto-grow | 18 | HSTextareaAutoHeight | `components/textarea.md` |
| `time-picker` | basic-forms | Native input[type=time] plus hh/mm panel | 2 | HSDropdown | `components/time-picker.md` |

## Advanced Forms — 9 components, 101 examples

| Component | Category | What it is | Ex | JS | Scheme |
|---|---|---|---|---|---|
| `advanced-select` | advanced-forms | Native select replaced: search, tags, remote | 41 | HSSelect | `components/advanced-select.md` |
| `combobox` | advanced-forms | Filtering text input over inline/remote options | 7 | HSComboBox | `components/combobox.md` |
| `copy-markup` | advanced-forms | Clone a template node up to limit | 5 | HSCopyMarkup | `components/copy-markup.md` |
| `input-number` | advanced-forms | Quantity stepper with min/max/step buttons | 13 | HSInputNumber | `components/input-number.md` |
| `pin-input` | advanced-forms | OTP boxes behaving as one field | 14 | HSPinInput | `components/pin-input.md` |
| `searchbox` | advanced-forms | Command palette / search results panel | 7 | HSComboBox | `components/searchbox.md` |
| `strong-password` | advanced-forms | Live password strength strips and hints | 6 | HSStrongPassword | `components/strong-password.md` |
| `toggle-count` | advanced-forms | Animate a number between two values | 3 | HSToggleCount | `components/toggle-count.md` |
| `toggle-password` | advanced-forms | Flip password inputs to plain text | 5 | HSTogglePassword | `components/toggle-password.md` |

## Navigations — 9 components, 113 examples

| Component | Category | What it is | Ex | JS | Scheme |
|---|---|---|---|---|---|
| `breadcrumb` | navigations | Ancestor links, aria-current on last item | 6 | -- | `components/breadcrumb.md` |
| `mega-menu` | navigations | Multi-column dropdown panel inside navbar | 7 | HSDropdown | `components/mega-menu.md` |
| `navbar` | navigations | Header plus centred nav, brand and links | 11 | HSCollapse | `components/navbar.md` |
| `navs` | navigations | Static link bars; you paint active | 18 | -- | `components/navs.md` |
| `pagination` | navigations | Prev/number/next buttons, server-rendered window | 20 | -- | `components/pagination.md` |
| `scrollspy` | navigations | Active nav link follows scroll position | 3 | HSScrollspy | `components/scrollspy.md` |
| `sidebar` | navigations | Fixed off-canvas rail, static above breakpoint | 10 | HSOverlay | `components/sidebar.md` |
| `stepper` | navigations | Numbered rail plus JS wizard panes | 20 | HSStepper | `components/stepper.md` |
| `tabs` | navigations | Mutually exclusive panes over one region | 18 | HSTabs | `components/tabs.md` |

## Overlays — 6 components, 52 examples

| Component | Category | What it is | Ex | JS | Scheme |
|---|---|---|---|---|---|
| `context-menu` | overlays | Right-click dropdown positioned at the pointer | 1 | HSDropdown | `components/context-menu.md` |
| `dropdown` | overlays | Toggle-anchored action menu, Floating UI | 22 | HSDropdown | `components/dropdown.md` |
| `modal` | overlays | Page-blocking centred dialog with backdrop | 13 | HSOverlay | `components/modal.md` |
| `offcanvas` | overlays | Edge-anchored sliding panel (drawer) | 5 | HSOverlay | `components/offcanvas.md` |
| `popover` | overlays | Rich anchored panel on tooltip plugin | 8 | HSTooltip | `components/popover.md` |
| `tooltip` | overlays | Small hover/focus label, Floating UI | 3 | HSTooltip | `components/tooltip.md` |

## Layout & Content — 10 components, 72 examples

| Component | Category | What it is | Ex | JS | Scheme |
|---|---|---|---|---|---|
| `columns` | layout-and-content | CSS multi-column flow via columns-* utilities | 3 | -- | `components/columns.md` |
| `container` | layout-and-content | Breakpoint max-width cap for page content | 6 | -- | `components/container.md` |
| `custom-scrollbar` | layout-and-content | WebKit scrollbar restyled by arbitrary variants | 2 | -- | `components/custom-scrollbar.md` |
| `dividers` | layout-and-content | hr, or flex pseudo-element rules | 5 | -- | `components/dividers.md` |
| `grid` | layout-and-content | Tailwind CSS Grid layout primitives | 10 | -- | `components/grid.md` |
| `images` | layout-and-content | Sizing, object-fit, caption and zoom recipes | 19 | -- | `components/images.md` |
| `kbd` | layout-and-content | Key-cap chips for keyboard shortcuts | 6 | -- | `components/kbd.md` |
| `layout-splitter` | layout-and-content | Drag-resizable flex-grow panel groups | 6 | HSLayoutSplitter | `components/layout-splitter.md` |
| `links` | layout-and-content | Text-link colour, underline and icon recipes | 8 | -- | `components/links.md` |
| `typography` | layout-and-content | Heading scale, inline tags, gradient text | 7 | -- | `components/typography.md` |

## Tables — 1 components, 19 examples

| Component | Category | What it is | Ex | JS | Scheme |
|---|---|---|---|---|---|
| `tables` | tables | Static table markup: scroll, stripes, hover | 19 | -- | `components/tables.md` |

## Third-Party Plugins — 12 components, 105 examples

| Component | Category | What it is | Ex | JS | Scheme |
|---|---|---|---|---|---|
| `advanced-datepicker` | third-party-plugins | Calendar popover on vanilla-calendar-pro | 15 | HSDatepicker (+ HSSelect for the header dropdowns, HSOverlay in the modal example) | `components/advanced-datepicker.md` |
| `advanced-range-slider` | third-party-plugins | Single/dual handle slider on noUiSlider | 18 | HSRangeSlider (+ HSOverlay in the modal example) | `components/advanced-range-slider.md` |
| `charts` | third-party-plugins | ApexCharts via buildChart, dark override merged | 18 | -- | `components/charts.md` |
| `clipboard` | third-party-plugins | Copy button with icon swap (ClipboardJS) | 7 | (helper-clipboard.js wrapper over ClipboardJS -- no HS class) | `components/clipboard.md` |
| `confetti` | third-party-plugins | Full-screen particle burst (canvas-confetti) | 2 | (canvas-confetti -- Preline ships only the trigger button markup) | `components/confetti.md` |
| `datamaps` | third-party-plugins | Choropleth world map (Datamaps + D3) | 2 | (Datamaps + D3 + TopoJSON -- Preline lends varToColor from helper-shared.js) | `components/datamaps.md` |
| `datatables` | third-party-plugins | Sortable searchable paginated table (DataTables.net) | 13 | HSDataTable (+ HSSelect, HSDropdown) | `components/datatables.md` |
| `drag-and-drop` | third-party-plugins | Reorderable lists on Sortable.js | 5 | (Sortable.js -- Preline ships only the hs-dragged variant) | `components/drag-and-drop.md` |
| `file-upload` | third-party-plugins | Dropzone with template-cloned file previews | 7 | HSFileUpload | `components/file-upload.md` |
| `maps` | third-party-plugins | Leaflet map, restyled zoom and popup | 9 | -- | `components/maps.md` |
| `text-editor` | third-party-plugins | Tiptap editor, Preline-markup toolbar | 7 | (Tiptap/ProseMirror -- Preline ships no editor module) | `components/text-editor.md` |
| `toast-notifications` | third-party-plugins | Toastify-stacked transient notifications | 2 | (Toastify JS -- Preline ships only the hs-toastify-on variant) | `components/toast-notifications.md` |

## Customization — 3 components, 19 examples

| Component | Category | What it is | Ex | JS | Scheme |
|---|---|---|---|---|---|
| `colors` | customization | Palette and colour-token documentation page | 0 | -- | `reference/tokens.md *(no scheme)*` |
| `dark-mode` | customization | .dark class and theme-switch mechanics | 5 | HSThemeSwitch | `components/dark-mode.md` |
| `themes` | customization | Nine premade themes, data-theme attribute | 14 | -- | `components/themes.md` |

## Getting Started — 10 components, 6 examples

| Component | Category | What it is | Ex | JS | Scheme |
|---|---|---|---|---|---|
| `about` | getting-started | What Preline UI is | 0 | -- | `reference/project-integration.md *(no scheme)*` |
| `accessibility` | getting-started | Accessibility notes for the library | 0 | -- | `reference/project-integration.md *(no scheme)*` |
| `agent-skills` | getting-started | Upstream Preline agent-skill packaging | 1 | -- | `reference/upstream-theme-generator/SKILL.md *(no scheme)*` |
| `changelog` | getting-started | Preline 4.2.0 changelog | 0 | -- | `reference/javascript.md *(no scheme)*` |
| `components` | getting-started | Component catalogue landing page | 0 | -- | `INDEX.md *(no scheme)*` |
| `frameworks` | getting-started | Framework integration guides | 0 | -- | `reference/project-integration.md *(no scheme)*` |
| `index` | getting-started | Installation: npm, CSS entry, JS entry | 3 | HSDropdown | `reference/project-integration.md` + `reference/javascript.md` §1 *(no scheme)* |
| `license` | getting-started | Preline licensing terms | 0 | -- | `reference/project-integration.md *(no scheme)*` |
| `preline-javascript` | getting-started | autoInit, prevent-auto-init, static methods | 2 | HSSelect,HSStaticMethods | `reference/javascript.md *(no scheme)*` |
| `resources` | getting-started | Figma and asset links | 0 | -- | `reference/theming.md *(no scheme)*` |
## Find by intent

What you were asked for -> what it is called here. `+` = you also need the third-party library.

| You need | Component(s) | Note |
|---|---|---|
| data table (sort / search / paginate) | `datatables` | `+ jQuery + DataTables.net`. For a static table use `tables`; for the page-number row alone use `pagination` |
| plain table markup | `tables` | 19 examples: scroll wrapper, stripes, hover, borders, caption |
| side drawer / slide-over | `offcanvas` | `HSOverlay`, edge-anchored. App navigation rail that stays open on desktop is `sidebar` |
| stacking / z-index, "my modal opens behind the drawer" | `modal` + `offcanvas` | Every Preline overlay example is `z-80`; pubweb-saas `Components/Common/Modal` is `z-[70]`, so the React dialog loses. Ladder: `reference/project-integration.md` §5a |
| "opening a dialog closed my drawer" | `modal` | `isClosePrev` defaults to **true** and one plugin (`HSOverlay`) drives both. Fix: `data-hs-overlay-options='{ "isClosePrev": false }'` — `components/modal.md` §Gotchas |
| "component renders but nothing happens" | — | Three causes, in order of likelihood: re-render without `HSStaticMethods.autoInit()` (`SKILL.md` rule 5), a missing third-party global (rule 7 + *Third-party globals* above), or a broken parent/child selector chain (rule 9) |
| modal / confirm dialog | `modal` | `HSOverlay`. Recipe + the destructive-button caveat: `components/modal.md` §Confirm dialog. If it must not block the page, use `popover` |
| danger / delete button | *no example* | `grep -rl 'bg-destructive' examples/` = **0 files**. Token exists: `destructive` `red-500`, `-hover`/`-focus` `red-600`, `-foreground` `white`, same light and dark. Preline's own red button is raw palette (`bg-red-500 … text-foreground-inverse hover:bg-red-600`) in `examples/base-components/buttons/solid-color-variants.html`. Same pixels; see `SKILL.md` rule 14 |
| success / warning / error colour | *no token beyond `destructive`* | moon has **no** `success`/`warning`/`info` token — check `reference/moon-token-table.md` before assuming one. Preline uses literal `teal-*` / `yellow-*` / `blue-*`; `alerts` and `badge` are where those live |
| form validation state | `input` / `select` / `switch` | `validation-states.html` in each. Literal `border-red-500` / `border-teal-500`, **identical light and dark** — do not substitute `destructive` (`components/select.md` §Gotchas) |
| date picker | `advanced-datepicker` | `+ vanilla-calendar-pro`. `datepicker` is static markup only (no plugin) |
| date **range** | `advanced-datepicker` | `ranges.html`, `pre-set-ranges.html`, `ranges-with-time.html`; static equivalents in `datepicker` |
| time picker | `time-picker` | Native `input[type=time]`, plus a markup-only hh/mm/AM-PM panel built on `HSDropdown` |
| file upload (drag-drop, previews) | `file-upload` | `+ Dropzone`. Plain field is `file-input`; per-file progress rows are `file-uploading-progress-form` |
| tag input / multi-select chips | `advanced-select` | `tags.html`, `tags-disabled.html`, `remote-data-tags.html`, `multiple*.html` |
| autocomplete | `combobox` | Free-text filter over inline or remote options. Full-page search UI is `searchbox` |
| command palette (CMD+K) | `searchbox` | `HSComboBox` + `HSOverlay` |
| toast | `toasts` / `toast-notifications` | `toasts` = static card you position + `HSRemoveElement` dismiss. `toast-notifications` = dynamic stack, `+ Toastify JS` |
| empty state | `card` | `examples/base-components/card/empty-states.html`; sidebar variant in `examples/navigations/sidebar/empty-content.html`. The glyph chip is `static-icons` |
| wizard / multi-step form | `stepper` | `HSStepper` swaps panes and writes the rail state. Non-interactive rail also in `stepper` |
| tabs | `tabs` | `HSTabs`. Static link bar with no panes is `navs`; disclosure panels are `accordion` |
| dropdown menu | `dropdown` | `HSDropdown`. Right-click version is `context-menu`; wide panel is `mega-menu` |
| tooltip vs popover | `tooltip` / `popover` | Both are the `HSTooltip` plugin. `tooltip` = label; `popover` = rich panel, no `role="menu"` |
| form select | `select` (native) / `advanced-select` (`HSSelect`) | Use `dropdown` only for actions, never for a form value |
| OTP / verification code | `pin-input` | `HSPinInput` |
| password strength meter | `strong-password` | `HSStrongPassword` |
| show/hide password | `toggle-password` | `HSTogglePassword` |
| quantity stepper | `input-number` | `HSInputNumber` |
| toggle switch | `switch` | Pure CSS `peer sr-only`, no JS |
| slider | `range-slider` (native) / `advanced-range-slider` (`+ noUiSlider`) | Dual handles / tooltips need the advanced one |
| chart | `charts` | `+ ApexCharts`, through Preline's `buildChart()` (merges the dark override) |
| map | `maps` (`+ Leaflet`) / `datamaps` (`+ Datamaps, D3, TopoJSON`) | `maps` = markers & geography; `datamaps` = country choropleth |
| rich text / WYSIWYG | `text-editor` | `+ Tiptap`. Preline ships the toolbar markup only |
| copy to clipboard | `clipboard` | `+ ClipboardJS`, via `helper-clipboard.js` |
| reorder by dragging | `drag-and-drop` | `+ Sortable.js`, `hs-dragged:` variant |
| resizable panes | `layout-splitter` | `HSLayoutSplitter` |
| file tree / nested list | `tree-view` | `HSTreeView` on top of `HSAccordion` |
| breadcrumbs | `breadcrumb` | |
| pagination row | `pagination` | No plugin — you render the window |
| scroll-linked nav highlight | `scrollspy` | `HSScrollspy` |
| loading state | `spinners` / `skeleton` / `progress` | Spinner in a button is `examples/base-components/buttons/loading.html` |
| status pill / count badge | `badge` | Inline banner is `alerts` |
| avatar stack | `avatar-group` | Single avatar is `avatar` |
| activity feed | `timeline` | Chat transcript is `chat-bubbles` |
| star rating | `ratings` | |
| dark-mode toggle | `dark-mode` | `HSThemeSwitch`; `examples/customization/dark-mode/{switcher,button-toggle,select}.html`, mechanics in `reference/theming.md` |
| theme switching (`data-theme`) | `themes` | 14 examples; `reference/theming.md` §5 lists all nine themes |
| repeatable form row | `copy-markup` | `HSCopyMarkup` clones a `<template>` up to `limit` |
| monthly/annual price swap | `toggle-count` | `HSToggleCount` |
| keyboard shortcut hint | `kbd` | |
| scrolling logo strip | `marquee` | Image slider is `carousel` |
| celebration animation | `confetti` | `+ canvas-confetti` |
| custom scrollbar | `custom-scrollbar` | `[&::-webkit-scrollbar]:*` arbitrary variants |
| page shell / max width | `container` + `grid` | Newspaper flow is `columns` |
