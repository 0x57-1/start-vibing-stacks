# Preline `moon` inside **pubweb-saas**

**What this answers:** how much of this skill's corpus you can paste straight into `pubweb-saas` and what you have to change first — the Preline version actually installed vs the one these docs were mined from, the exact CSS import chain that makes `bg-card` / `text-muted-foreground` resolve, where `HSStaticMethods.autoInit()` is (and is not) called in the React SPA and what that means for markup you render after a fetch, which shared components already exist in `resources/js/Components/Common/` so you don't rebuild them, and the repo rules (`CLAUDE.md`) that constrain any `.jsx` edit. Read this before writing your first line of JSX in that repo. For "which token do I write", go to `reference/tokens.md`; for the resolved colour, `reference/moon-token-table.md`.

---

## 1. Versions — the corpus is one minor ahead of the install

| | Version | Source of truth |
|---|---|---|
| **Installed** | **4.1.3** | `package.json` → `"preline": "^4.1.3"`; `node_modules/preline/package.json` → `"version": "4.1.3"` |
| **Docs mined** | **4.2.0** | `data/index.json` → `"generated_from": "https://preline.co/docs (v4.2.0)"` |

**What it means, concretely — three checks I ran:**

| Check | Result | Consequence |
|---|---|---|
| JS plugin file set, 4.2.0 skill copy vs installed `node_modules/preline/dist/*.js` | **Identical set** (`comm` on both name lists → empty both ways) | No plugin was added or removed in 4.2.0. Every `data-hs-*` / `hs-*` attribute documented in this corpus has a matching module in 4.1.3. |
| `variants.css` | Skill's `assets/css/variants.css` is **byte-identical** to `node_modules/preline/variants.css` (4.1.3) | Every `hs-*:` Tailwind variant the examples use (`hs-dropdown-open:`, `hs-accordion-active:`, `hs-selected:`) compiles today. |
| Plugin bytes (`dropdown.js`) | **Differ** | The skill's `assets/js/preline/*.js` is 4.2.0 source. Read it for *behaviour*, but the runtime in the browser is 4.1.3 — if a behaviour question is load-bearing, read `node_modules/preline/dist/` instead. |

Residual risk is limited to the markup-only components 4.2.0 added. Those are pure Tailwind classes generated from *your* JSX, so they render fine at 4.1.3. Everything in `examples/` is safe to copy.

---

## 2. CSS entry wiring — what is actually in place

Single entry, `resources/css/app.css`, declared in `vite.config.js` → `laravel({ input: ['resources/css/app.css', 'resources/js/app.jsx', 'resources/js/Pages/OtherPages/HttpErrorPage.jsx'] })`.

| Line | Directive | Why it matters |
|---|---|---|
| 1 | `@import "tailwindcss";` | Tailwind v4, via `@tailwindcss/vite` (not the PostCSS path) |
| 2 | `@plugin "@tailwindcss/forms";` | The reason `app.css` carries ~70 lines of checkbox/radio overrides — see below |
| 5 | `@import "./themes/theme.css";` | `@theme inline { --color-*: var(--token) }` (L1–185) + `:root` light defaults (L187) + `.dark` |
| 8 | `@import "./themes/moon.css";` | `:root[data-theme="theme-moon"]` (L5–143) and `[data-theme="theme-moon"].dark` (L145–284) |
| 10 | `@custom-variant dark (&:where(.dark, .dark *));` | `dark:` keys off a **class**, not `prefers-color-scheme` |
| 13 | `@source "../../node_modules/preline/dist/*.js";` | Tailwind scans the Preline bundle so classes Preline injects at runtime still get generated |
| 14 | `@import "../../node_modules/preline/variants.css";` | Registers the `hs-*:` variants |

**The repo's `moon.css` is a fork, not upstream.** `resources/css/themes/moon.css` is 307 lines; upstream Preline 4.2.0 `moon.css` (`assets/css/themes/moon.css`) is 139. The fork drops upstream's empty `@theme theme-moon inline {}` block, spells out the **complete** light-mode token set instead of inheriting `theme.css` `:root` defaults, adds `--primary-foreground: var(--color-white)` in light, and appends three dark-mode `input[type=...]:checked` rules that re-draw the `@tailwindcss/forms` checkmark data-URI in `#262626` (because moon flips `--primary-checked` to white in dark, and a white mark on a white box is a blank square — the SVG is a data-URI and cannot read a CSS var).

**The skill's copies are the repo's copies, byte for byte:**

| Skill file | Repo file | Status |
|---|---|---|
| `assets/css/project-moon.css` | `resources/css/themes/moon.css` | identical |
| `assets/css/project-theme.css` | `resources/css/themes/theme.css` | identical |
| `assets/css/variants.css` | `node_modules/preline/variants.css` | identical |

So `reference/moon-token-table.md` (175 tokens) is authoritative for this repo, not an approximation of it.

**Theme is applied in two places, both required:**

| Where | What | File |
|---|---|---|
| SSR shell | `<html … data-theme="theme-moon" class="dark">` | `resources/views/app.blade.php:2` |
| Runtime | `document.documentElement.setAttribute("data-theme", "theme-moon")` in a mount effect | `resources/js/Context/ThemeContext.jsx:23-25` |

Dark is the **default** (`localStorage.getItem('pw_theme') \|\| 'dark'`). `app.blade.php` proxies `Storage.prototype.get/setItem` so Preline's internal `hs_theme` reads/writes are redirected to `pw_theme` — one key, no flash. Do not add a second theme key.

---

## 3. Preline JS init in a React SPA — the part that bites

`resources/js/app.jsx:33-46`:

```js
const initPreline = async () => {
    await import('preline');
    if (window.HSStaticMethods) {
        window.HSStaticMethods.autoInit();
    }
};

// Initialize on first load
initPreline();

// Re-initialize on page navigation (Inertia SPA)
router.on('navigate', () => {
    setTimeout(initPreline, 100);
});
```

**Mechanism (read out of `node_modules/preline/dist/index.js`):** each plugin's `autoInit()` runs `document.querySelectorAll("<selector>:not(.--prevent-on-load-init)")`, first filtering its `window.$hs*Collection` down to elements still in `document`, then skipping elements already in that collection. It is **idempotent and DOM-scan based**. Calling it twice is free; *not* calling it after new markup mounts leaves that markup dead.

**Consequence for this SPA:** the global hook fires on first load and 100 ms after each Inertia `navigate`. Any Preline-driven node that appears **later** — after an `api.get()` resolves, after a `setState` opens a panel, after a list re-renders — was never scanned. Three components already pay this tax with a local re-init:

| File | Effect deps | Why |
|---|---|---|
| `resources/js/Layouts/CmsLayout.jsx:7-11` | `[]` | layout chrome mounts after the global call |
| `resources/js/Components/App/AppSidebar.jsx:11-15` | `[menuStructure]` | sidebar accordions/overlay are built from a fetched menu |
| `resources/js/Pages/User/Profile/Edit.jsx:31-35` | `[active]` | tab switch swaps the subtree |

**Rule for new code:** if your JSX carries any selector from the table below and that JSX is rendered conditionally or from fetched data, add
`useEffect(() => { window.HSStaticMethods?.autoInit(); }, [theDataThatProducedIt]);`
— or, better, don't use Preline JS at all (§4).

**The 27 selectors `autoInit()` scans** (verbatim from the 4.1.3 bundle; class-based on the left, attribute-based on the right):

| Class selectors | Attribute selectors |
|---|---|
| `.hs-accordion` · `.hs-collapse-toggle` · `.hs-datepicker` · `.hs-dropdown` · `.hs-overlay` · `.hs-tooltip` | `data-hs-carousel` · `data-hs-combo-box` · `data-hs-copy-markup` · `data-hs-datatable` · `data-hs-file-upload` · `data-hs-input-number` · `data-hs-layout-splitter` · `data-hs-pin-input` · `data-hs-range-slider` · `data-hs-remove-element` · `data-hs-scroll-nav` · `data-hs-scrollspy` · `data-hs-select` · `data-hs-stepper` · `data-hs-strong-password` · `data-hs-textarea-auto-height` · `data-hs-theme-click-value` · `data-hs-theme-switch` · `data-hs-toggle-count` · `data-hs-toggle-password` · `data-hs-tree-view` |

Opt a node out with `.--prevent-on-load-init` (used in `examples/third-party-plugins/datatables/*.html`; **not** used anywhere in this repo).

---

## 4. What the repo actually uses from Preline JS — very little

| Selector | Files using it |
|---|---|
| `hs-dropdown` | `Components/App/AppHeader.jsx`, `Components/App/NotificationsDropdown.jsx`, `Components/Common/DateRangeDropdown.jsx` |
| `hs-overlay` | `Components/App/AppHeader.jsx`, `Components/App/AppSidebar.jsx`, `Layouts/CmsLayout.jsx` |
| `data-hs-theme-click-value` | 3 occurrences (theme buttons) |
| `data-hs-overlay` | 2 occurrences |
| everything else (`hs-tooltip`, `hs-select`, `hs-combobox`, `hs-stepper`, `hs-tab`, `hs-collapse`, `hs-datatable`, `hs-file-upload`, `hs-input-number`, `hs-carousel`, `hs-scrollspy`, …) | **zero occurrences** |

`hs-accordion` appears once and only in a comment explaining why it was *rejected*: `Components/App/SidebarItem.jsx:149` — "instead of Preline's `hs-accordion` — Preline measured the content while…". Same story for `Components/Common/DateTimePicker.jsx` ("Pure-React date-time picker (no Preline JS)") and `SiteSelector.jsx` / `MultiSelect.jsx`, which are `useState` + outside-click listeners.

**The established pattern in this repo is: Preline markup + Tailwind classes, React behaviour.** Copy the class strings from `examples/`; drive open/closed state with `useState`. Reach for the Preline plugin only where the repo already does (dropdown, overlay) — that keeps the `autoInit` surface small enough to stay correct.

The live dropdown wrapper string, `Components/Common/DateRangeDropdown.jsx:151,164`:

```
hs-dropdown [--auto-close:inside] relative inline-flex
hs-dropdown-menu hs-dropdown-open:opacity-100 opacity-0 hidden z-20 bg-white border border-gray-200 rounded-xl shadow-lg dark:bg-neutral-800 dark:border-neutral-700
```

---

## 5. `resources/js/Components/Common/` — reuse, do not rebuild

Every file below is at `resources/js/Components/Common/<name>`, importable as `@/Components/Common/<name>` (`vite.config.js` aliases `@` → `/resources/js`). `CLAUDE.md` lists "Inline spinner/toggle/empty/modal boilerplate" as FORBIDDEN — this table is that rule's inventory.

| Component | Signature (props) | Notes |
|---|---|---|
| `Spinner` | `()` | `size-7 border-2 border-primary border-t-transparent rounded-full animate-spin` in a `py-20` flex box. Page-level only. |
| `EmptyState` | `{ icon, title, description, action }` | `icon` is a **Lucide component**, not a node. Dashed-border card. |
| `Modal` | `{ open, onClose, size, closeOnBackdrop, className, children }` | `size` ∈ `sm\|md\|lg\|xl\|2xl\|3xl\|5xl\|full`. `z-[70]` (must clear `AppHeader` at `lg:z-61`); non-`full` caps at `max-h-[calc(100vh-6rem)]` and scrolls internally. |
| `ScrollTable` | `{ children, className }` | Card shell + `overflow-x-auto`. Put `<table className="min-w-full divide-y …">` inside. |
| `ToggleSwitch` | `{ active, onChange, disabled, ariaLabel }` | `role="switch"` + `aria-checked`. Single source of truth for switches. |
| `StatusBadge` | `{ status, tone, label, title, size, pill, icon }` | `label` is REQUIRED and the caller does the i18n. Tones: emerald/amber/red/gray/primary. |
| `KpiCard` | `{ … }` | Dashboard KPI tile. |
| `StatCardMini` | `{ icon, label, value, tone }` | Compact 3-col stat strip tile. |
| `DeltaChip` | `{ value, size, className }` | Signed % pill; renders **nothing** when `value` is null (no fake 0%). |
| `CountUp` | `{ value, format, duration, placeholder, className }` | Tween wrapper over `useCountUp.js`; honours `prefers-reduced-motion`. |
| `Sparkline` | `{ … , dateLabels }` | Inline-SVG area chart, zero-dep. ApexCharts is reserved for big interactive charts. |
| `DateRangeDropdown` | `{ filters, onChange, __, presets }` | Presets + custom calendar. The one date-range control for Analytics / Push / Project. |
| `DateTimePicker` | `{ value, onChange, placeholder, timeZone }` | `"YYYY-MM-DDTHH:mm"` local. Pure React. |
| `SiteSelector` | `{ sites, value, onChange, allLabel, __, ariaLabel }` | `value === null` = "all sites in project". |
| `MultiSelect` | `{ options, value, onChange, placeholder, disabled }` | `options: [{ id, host, name? }]`, chip tags. |
| `CountryPicker` | `{ value, options, onChange, disabled }` + `export const EVERYWHERE = '*'` | Values are **UPPERCASE** ISO-2 on the wire; DB stores lowercase (deliberate — see the country rule in `CLAUDE.md`). |
| `TimezoneSelect` | `{ … }` | IANA picker. |
| `WindowTimezoneLabel` | `{ timezone, className }` | States which clock a panel's day window closed in. Renders the IANA id, never an abbreviation. |
| `RefreshButton` | `{ label, onRefresh, busy, cooldownSeconds, storageKey, className }` | Cosmetic client throttle; `storageKey` persists the countdown in `sessionStorage`. |
| `ImageUploadField` | `{ label, value, onChange, context, defaultValue, required, help, error, placeholder }` | `context` ∈ `push_icon \| push_image`. |
| `StepConsole` | `{ log, className }` | Terminal-style progress; `log: [{ id, text, status }]`, status ∈ `running\|ok\|fail`. |
| `ThemeToggleButton` | — | Theme + locale control. |
| `useCountUp.js` | `(target, { duration })` | Hook. |

**Dead file:** `resources/js/Components/Common/Untitled` (6.9 KB, an older `ThemeToggleButton`) is imported by nothing. Do not extend it; delete it if you touch that directory (repo rule: no dead/legacy code).

**Token debt worth knowing before you copy from these:** `EmptyState.jsx`, `ScrollTable.jsx`, `Modal.jsx`, `ToggleSwitch.jsx` and `DateRangeDropdown.jsx` still hard-code `bg-white … dark:bg-neutral-800`, `border-gray-200 … dark:border-neutral-700`. Those pairs *are* what `bg-card` and `border-line-2` resolve to under moon (`moon-token-table.md`: `card` = `white`/`neutral-800`; `line-2` = `gray-200`/`neutral-700`), so they render correctly — they are just the pre-token style. **New code uses the token and no `dark:` variant.** The current house style is `resources/js/Pages/User/Quizzes/_components/placements/styles.js`, whose header states it outright:

> Theme tokens only — moon.css and theme.css both define these, so a `dark:` variant next to one of them is a bug, not a refinement.

---

## 5a. The z-index ladder — measured, and it does not favour Preline

Two stacking families coexist and **the Preline one wins**. Every overlay example in this corpus is
hardcoded `z-80`; the repo's own dialog was only ever raised far enough to clear the header.

| Layer | `z` | Source |
|---|---|---|
| Preline overlays — every `modal` / `offcanvas` / `sidebar` example | `z-80` | `examples/overlays/*/*.html` |
| Preline toast container (`toast-notifications`) | `z-90` | `examples/third-party-plugins/toast-notifications/basic.js` |
| `Components/Common/Modal` | `z-[70]` | `Modal.jsx:45` |
| `AppSidebar` | `z-60` | `AppSidebar.jsx:40` |
| `AppHeader` | `z-48` / `lg:z-61` | `AppHeader.jsx:55` |

**The failure this produces:** a `@/Components/Common/Modal` confirm dialog opened from inside a
Preline `offcanvas` drawer renders *behind* the drawer. The backdrop darkens, the drawer stays on
top, and it reads as "the modal never opened". Nothing logs.

Pick one family per stack. Mixing needs an explicit `z-` above `z-80` on the React modal, or
`--has-dynamic-z-index:true` on the Preline side. Preline's stacked examples hand-manage descending
values (`z-80`/`z-70`/`z-60` in `examples/overlays/modal/stacked-overlays.html`) — it never computes
them for you by default.

## 5b. Third-party globals — all five are wired, in the right order

`SKILL.md` rule 7: a wrapper component whose library is not on `globalThis` at the moment
`import('preline')` evaluates gets a `null` factory for the life of the page, and `autoInit()` skips
it forever with no console error. In this repo that contract is satisfied — `resources/js/app.jsx`
assigns every global at lines 20-26, above the `await import('preline')` inside `initPreline()` at
line 34.

| Global | `app.jsx` | Unlocks | Installed |
|---|---|---|---|
| `window.$` / `window.jQuery` | 13, 22-23 | — | `jquery ^4.0.0` |
| `window.DataTable` | 16, 24 | `datatables` (`HSDataTable`) | `datatables.net ^2.3.6` |
| `window.noUiSlider` | 15, 25 | `advanced-range-slider` (`HSRangeSlider`) | `nouislider` |
| `window.VanillaCalendarPro` | 18, 26 | `advanced-datepicker` (`HSDatepicker`) | `vanilla-calendar-pro` |
| Dropzone | 17 (side-effect import) | `file-upload` (`HSFileUpload`) | `dropzone` |

So `datatables` **is usable here today** — §7 below says it is used *nowhere*, which is a statement
about adoption, not about capability. Do not read it as "unavailable".

**Not installed**, so those components are off the table until you add the library: ClipboardJS
(`clipboard`), Toastify (`toast-notifications`), Sortable.js (`drag-and-drop` — the repo uses
`@dnd-kit`), canvas-confetti, Leaflet (`maps`), D3 + Datamaps (`datamaps`), Tiptap (`text-editor`).

**Do not move an import above line 20.** The order is the whole contract, and breaking it fails
silently in exactly the way rule 7 describes.

## 6. Project rules that constrain any `.jsx` edit

From `pubweb-saas/CLAUDE.md` (§ "React / Frontend" and § "FORBIDDEN → Frontend (React)"), with the repo state next to each:

| Rule | Repo state |
|---|---|
| **`api` instance only** — never raw `axios`, never `fetch()` for page data | **Clean.** `import axios from 'axios'` appears only in `resources/js/bootstrap.js:3`; everything else imports `@/lib/api`. `resources/js/lib/api.js` is the instance: `withCredentials: true`, `withXSRFToken: true`, `X-Requested-With`, and a response interceptor that sends 401 → `/login`. `fetch(` appears only in `resources/js/adx/launcher.js.stub` and `analytics/tracker.js.stub` — edge scripts, not the SPA. |
| **Shell + skeleton on first paint**, then fetch | Enforced by convention. 49 files use `animate-pulse`. There is **no shared `Skeleton` component** — the only extracted one is `Pages/User/Push/Subscribers/_components/SiteAnalyticsSkeleton.jsx`. Skeletons match the shape of the loaded content, per component. |
| **skeleton + empty + error states are all three mandatory per page** | Use `Spinner` / `EmptyState` from `Components/Common/`. |
| **`STYLES` const above the component**, no inline class soup | Partially adopted: 12 files declare `const STYLES`. Model: `Pages/User/Quizzes/_components/placements/styles.js`. **`LABELS` is aspirational — 0 files declare it**; labels go through `useTranslate()` (`@/Utils/translate`) against `lang/{en,pt}`. |
| **No inline SVG in JSX — use `?react`** | **Not honoured.** `vite-plugin-svgr` is wired (`vite.config.js` → `svgr()`), `resources/js/Icons/` holds 24 `.svg`, and `Icons/index.js` re-exports 3 of them — but only **2 files** import `?react`, while **43 files contain 71 inline `<svg>`** and **124 files import `lucide-react`**. In practice: **use `lucide-react` named imports** for UI icons (that is what the shared components take), `?react` for brand/product marks in `Icons/`, and inline `<svg>` only where the SVG *is* the content (`Common/Sparkline.jsx`). Do not add new decorative inline SVG. |
| **`<Link>` not `<a href>`; `useNavigate()` not `window.location`** | 67 files import from `@inertiajs/react`. **The router is Inertia, not React Router** — see §7. |
| **No `Inertia::render()` for new endpoints; no Inertia `useForm()`** | The ban is on Inertia as a **data transport**. Inertia remains the page resolver (`createInertiaApp` in `app.jsx`). Data comes from `api.get()`. |
| **422 → inline field errors**, not a toast | |
| **`useMemo` to derive state**, never `useEffect` | |
| **No tokens in `localStorage`** | Sanctum HttpOnly cookie only. The only key the SPA writes is `pw_theme`. |
| **Project switch = page remount** | `app.jsx` wraps every resolved page in `ProjectKeyedPage` with `key={currentProject?.id ?? 'no-project'}`. Do **not** add `currentProject` to fetch deps, and do not remove the wrapper. |
| **Files > 400 lines must be split**; page-specific components live in `Pages/<page>/_components/` | `vite.config.js` `manualChunks` groups `/Pages/X/` + its `_components` into one chunk per feature — putting a page component in `Components/` breaks that grouping. |

---

## 7. Not wired up — say it plainly

| Claim | Reality |
|---|---|
| `CLAUDE.md` Stack table says **React Router** | There is no React Router. `package.json` has no `react-router*`; `grep -rn react-router resources/js` returns one comment. Routing is `@inertiajs/react` + Ziggy (`window.route`). |
| `CLAUDE.md` says "**Filters in URL via `useSearchParams`**" | `useSearchParams` does not exist here. The working pattern is `new URLSearchParams(window.location.search)` for initial state + `history.replaceState` to persist — `Pages/User/Push/Index.jsx:78-83`. |
| `LABELS` const pattern | Zero occurrences. i18n goes through `useTranslate()`. |
| Shared `Skeleton` primitive | Does not exist. Hand-roll `animate-pulse` matching your content shape. |
| Preline `Tooltip`, `Select`, `Combobox`, `Stepper`, `Tabs`, `Datatable`, `File Upload`, `Input Number`, `Carousel`, `Scrollspy` plugins | Present in `node_modules`, scanned by `autoInit`, currently used **nowhere** — that is adoption, **not** capability. Their libraries are wired (§5b) and their doc examples are valid markup, so they work if you reach for them. Before adopting one, check whether the repo already solved it in React (`SiteSelector`, `MultiSelect`, `DateTimePicker`, `SidebarItem`). |
| `sonner`, `clsx`+`tailwind-merge` `cn()` helper, `framer-motion` | `clsx` and `tailwind-merge` are installed; there is no `cn()` helper in `resources/js/lib/`. Class composition is template literals and `STYLES` objects. No toast library — feedback is inline. (The global `~/.claude/CLAUDE.md` mandates `cn`/Sonner/shadcn for *Next.js* projects; this repo is Laravel + Inertia and does not follow those.) |

---

## 8. Copy-paste checklist for a new panel

1. Pull markup from `examples/<category>/<component>/<slug>.html` (index them via `data/index.json`).
2. Replace raw palette colours with moon tokens (`reference/tokens.md`) and **delete the `dark:` variants** that accompany them.
3. Strip Preline JS attributes unless you need dropdown/overlay; drive state with `useState`. If you keep them and the node is conditional, add a scoped `window.HSStaticMethods?.autoInit()` effect.
4. Swap hand-rolled spinner/empty/modal/toggle/table shells for `@/Components/Common/*`.
5. Icons: `import { X } from 'lucide-react'` (named), never wildcard, never new inline `<svg>`.
6. Data: `import api from '@/lib/api'` → `api.get(...)` in a mount effect; render shell + skeleton first; handle empty and error.
7. Long class lists → `const STYLES = { ... }` above the component (or a sibling `styles.js` for a page family).
8. Gates before commit: `npm run build` (part of the quality gate), plus the PHP gates listed in `CLAUDE.md`.
