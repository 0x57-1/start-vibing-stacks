# Preline Theming — End to End

**What this answers:** how a Preline class like `bg-card` or `text-primary` resolves to a concrete
colour — the CSS import order, the `data-theme="theme-moon"` attribute, the `.dark` class and the
`@custom-variant dark` declaration, `@source` scanning so Preline's own classes survive purge, and
`preline/variants.css`. Then: what each of the nine premade themes actually is (read from their CSS,
not their marketing), how to add a tenth, the custom-font hooks, and where the theme *generator*
lives. If you want the resolved light/dark value of a specific moon token, that is a different file:
`reference/moon-token-table.md`.

---

## 1. CSS entry order

The whole system is one CSS file. Order is load-bearing — later `:root`-level declarations win at
equal specificity. This is the live entry in this project, verbatim from
`pubweb-saas/resources/css/app.css`:

```css
@import "tailwindcss";
@plugin "@tailwindcss/forms";

/* Base theme tokens + mappings */
@import "./themes/theme.css";

/* Optional: predefined themes (import only what you need) */
@import "./themes/moon.css";

@custom-variant dark (&:where(.dark, .dark *));

/* Preline UI — scan component classes + import state variants */
@source "../../node_modules/preline/dist/*.js";
@import "../../node_modules/preline/variants.css";
```

Upstream's own quick-start (`examples/customization/themes/static-1.html`) imports every theme; only
the one named by `data-theme` on `<html>` ever applies, so the rest is dead weight in the bundle.
Import only what you switch between.

| Line | Job | If you omit it |
|---|---|---|
| `@import "tailwindcss"` | Tailwind 4 core + the `--color-*` palette (`--color-gray-800`, …) | every theme var resolves to nothing |
| `@plugin "@tailwindcss/forms"` | draws checkbox/radio/select chrome | form controls fall back to UA styling |
| `@import "./themes/theme.css"` | **defines every semantic token** (`:root` light + `.dark`) **and** the `@theme inline` var→utility mapping | no `bg-card`, no `text-foreground` — the utilities do not exist |
| `@import "./themes/<name>.css"` | overrides a subset of those tokens under `[data-theme="theme-<name>"]` | the default (blue) theme stays |
| `@custom-variant dark (…)` | teaches Tailwind what `dark:` means | `dark:` utilities never emit |
| `@source ".../preline/dist/*.js"` | class scanning of Preline's runtime | classes Preline injects at runtime get purged |
| `@import ".../preline/variants.css"` | the `hs-*` variants + plugin variant files | `hs-dropdown-open:`, `hs-error:` etc. do not exist |

---

## 2. The two-hop variable chain

Never one hop. Always: **utility → `--color-<name>` → `--<name>` → a Tailwind palette var**.

```
bg-card  →  --color-card  →  --card  →  --color-neutral-800
            └ theme.css     └ theme.css :root / .dark,     └ tailwindcss
              @theme inline   or <theme>.css [data-theme]
```

* `@theme inline { --color-card: var(--card); }` — in `themes/theme.css`. This is what **creates the
  utility** `bg-card` / `text-card` / `border-card`. `inline` is required: it makes Tailwind emit
  `var(--card)` into the rule instead of snapshotting the value, which is the only reason a
  `[data-theme]` or `.dark` override further down the cascade can still change it.
* `:root { --card: var(--color-white); }` — in `themes/theme.css`, the default value.
* `[data-theme="theme-moon"] { --card-inverse: var(--color-primary-950); }` — the theme's override.

**Consequence:** to add a colour you need *two* edits — a `@theme inline` mapping (once) and a
`:root` value (per theme). Editing only `:root` gives you a variable with no utility. See
`examples/customization/themes/static-8.html` (the mapping) and `static-9.html` (the value).

Full token reference, verbatim from the docs:

| File | Contents |
|---|---|
| `examples/customization/themes/static-4.html` | the complete `@theme inline` block (every `--color-*` mapping) |
| `examples/customization/themes/static-5.html` | the complete `:root` light block |
| `examples/customization/themes/static-6.html` | the complete `.dark` block |

---

## 3. `data-theme` and `.dark` are orthogonal

Two independent switches on `<html>`.

```html
<html data-theme="theme-harvest">   <!-- examples/customization/themes/static-3.html -->
```
```html
<html class="dark">                 <!-- examples/customization/dark-mode/hs-dark-mode-user.css -->
```

Every theme file carries **two** selector blocks, and the dark one is scoped to *both*:

```css
:root[data-theme="theme-moon"],
[data-theme="theme-moon"] { … }      /* light */

[data-theme="theme-moon"].dark { … } /* dark — requires BOTH */
```

The doubled light selector (`:root[…]` plus bare `[…]`) is deliberate: it lets you scope a theme to
a subtree (`<div data-theme="theme-moon">`) as well as the document.

`@custom-variant dark (&:where(.dark, .dark *))` is what makes the `dark:` *utility* prefix work. It
is separate from, and required in addition to, the `.dark`-scoped token blocks — tokens flip
automatically, `dark:bg-black` does not. `:where()` keeps specificity at 0 so `dark:` variants
compose normally.

### Switching at runtime

Preline's `theme-switch` plugin (`assets/js/preline/theme-switch.js`) owns the `<html>` class. Strings
extracted from that module: it reads/writes `localStorage["hs_theme"]` ∈ `light | dark | auto |
default`, toggles the `dark` / `light` / `default` class on `html`, honours
`data-hs-appearance-onload-styles`, and dispatches `on-hs-appearance-change`.

| Attribute | Element | Example file |
|---|---|---|
| `data-hs-theme-switch` | `<input type="checkbox">` | `examples/customization/dark-mode/switcher.html` |
| `data-hs-theme-click-value="dark"` / `"light"` / `"default"` / `"auto"` | `<button>` | `examples/customization/dark-mode/button-toggle.html`, `select.html` |

Anti-FOUC: `examples/customization/dark-mode/switcher.js` is an inline `<script>` **for `<head>`**
that reads `hs_theme` and stamps the class before first paint. Ship it or accept a flash.

Class-driven visibility for the toggle icons, verbatim from `button-toggle.html`:

```
hs-dark-mode-active:hidden block hs-dark-mode
hs-dark-mode-active:block hidden hs-dark-mode
```

---

## 4. `@source` and `variants.css`

**`@source "../../node_modules/preline/dist/*.js"`** — Preline builds DOM at runtime (dropdown menus,
select options, datepicker cells). Those class strings live in the dist JS, which Tailwind 4 does not
scan by default because `node_modules` is excluded. Without this line the app looks correct until a
component opens, then renders unstyled. It is a scan directive only; it emits nothing by itself.

**`@import ".../preline/variants.css"`** — `assets/css/variants.css` in this skill is that file. It
is 23 `@import`s of per-plugin variant files plus five `@custom-variant` declarations:

| Variant | Selector it expands to |
|---|---|
| `hs-success:` | `&.success` and `.success &` |
| `hs-error:` | `&.error` and `.error &` |
| `hs-apexcharts-tooltip-dark:` | `&.dark` |
| `hs-dragged:` | `&.dragged` (Sortable.js) |
| `hs-toastify-on:` | `&.toastify.on` and `.toastify.on &` |

The 23 imports (`./src/plugins/<plugin>/variants.css`) are what give you `hs-dropdown-open:`,
`hs-accordion-active:`, `hs-collapse-open:`, `hs-overlay-open:`, `hs-tab-active:`, `hs-select-open:`,
`hs-stepper-active:` and the rest. They are **relative to the npm package**, so this import must point
at `node_modules/preline/variants.css`, not at a copy.

---

## 5. The nine premade themes

Read from `assets/css/themes/*.css`. "Primary ramp" = the family `--primary-50…950` is aliased to;
"neutral" = the family driving `--background-*` / `--foreground` / `--border`. `--primary` is the
step the ramp resolves to for a filled button.

| Theme | `data-theme` | Primary ramp | `--primary` light → dark | Neutral (light) | Neutral (dark) | Character (mechanism) |
|---|---|---|---|---|---|---|
| **theme** (default) | *(none — it is `:root`)* | `blue` | `primary-600` → `primary-500` | `gray` | `neutral` | The base. Also the only file with the `@theme inline` mapping and the font hooks. |
| **harvest** | `theme-harvest` | `amber` | `primary-700` → `primary-300` | `preline-khaki` (custom oklch) | `stone` | Warm amber on a khaki paper. Dark mode inverts to a pale `amber-300` fill with `--primary-foreground: stone-800`. |
| **retro** | `theme-retro` | `fuchsia` | `primary-500` → `primary-500` | `neutral` | `neutral` | **Zero radius everywhere** + hard outlines: all eight `--border-line-*` are `neutral-800`, and `--primary-line: neutral-800` puts a border on filled primary buttons. |
| **ocean** | `theme-ocean` | `cyan` | `primary-600` → `primary-500` | *(inherits `gray`)* | `gray` | Pure hue swap. The only theme that overrides essentially nothing but `--primary-*`, the `*-inverse` surfaces and the chart ramp. |
| **autumn** | `theme-autumn` | `amber` | `primary-500` → `primary-200` | `stone` | `neutral` | Same amber ramp as harvest, warmer neutral, brighter `--primary`. Dark flips to `amber-200` with `--primary-foreground: neutral-800`. |
| **bubblegum** | `theme-bubblegum` | `pink` | `primary-600` → `primary-500` | `preline-mauve` (custom oklch) | `neutral` | Pink on a mauve-tinted paper. |
| **cashmere** | `theme-cashmere` | `preline-mauve` (custom oklch) | `primary-600` → `primary-400` | `stone` | `stone` | Muted mauve as the *brand*, not the paper. Fully warm: stone neutrals in both modes. |
| **moon** | `theme-moon` | `gray` (light) / `neutral` (dark) | `primary-800` → **`white`** | `gray` | `neutral` | Monochrome. **The ramp itself changes family between modes**, and `--primary` inverts to white with `--primary-foreground: primary-800`. |
| **olive** | `theme-olive` | `preline-avocado` (custom oklch) | `primary-600` → `primary-400` | `preline-avocado-soft` (custom oklch) | `preline-avocado-soft` | The only theme whose *neutral* is also custom — a desaturated green paper in both modes. |

Four palettes are not Tailwind's: `preline-khaki`, `preline-mauve`, `preline-avocado`,
`preline-avocado-soft`, defined as raw `oklch()` in the `@theme inline` block of
`assets/css/themes/theme.css` (lines 20-66) and mirrored machine-readably in
`data/palettes.json`. A theme that uses one of them **needs `theme.css` imported** — the ramp lives
there, not in the theme file.

Structural notes worth grepping for:

* Every theme file except `theme.css` and `retro.css` opens with an empty `@theme theme-<name>
  inline { }` placeholder. It is the declared namespace; nothing depends on its contents today.
* `retro.css` uses `@layer utilities` instead, to re-point `.rounded` at `--radius-ui: 0` and force
  `before:rounded` / `after:rounded` to `inherit`.
* `moon` is the only theme that reassigns the primary ramp to a **different Tailwind family** in dark
  (`gray` → `neutral`). Anything that hardcodes `gray-` next to a `primary-` utility drifts in dark.

---

## 6. Moon specifics you will trip over

`--primary` in moon dark is `white` (`assets/css/themes/moon.css:111`), matching
`reference/moon-token-table.md`: `primary` = `gray-800` light, `white` dark;
`primary-foreground` = `white` light, `neutral-800` dark. A "primary button" in moon dark is a white
slab with dark text.

That breaks `@tailwindcss/forms`, which paints `:checked` with `currentColor` and lays a checkmark
SVG with `fill="white"` **hardcoded inside a data-URI** — a data-URI cannot read a CSS variable, so a
white box got a white tick: a blank square. The fix is per-theme and lives in the theme, at
`assets/css/project-moon.css:297-307` — three rules re-emitting the check, radio dot and
indeterminate dash with `fill='%23262626'`. There is deliberately **no matching light-mode rule**:
everywhere else the checked box is dark and the plugin's white mark is already right.

If you author a new theme that makes `--primary` light in either mode, you owe it the same three
rules.

---

## 7. Adding a custom theme

Upstream path — `examples/customization/themes/static-7.html`:

```css
@import "tailwindcss";

/* Base theme tokens + mappings */
@import "./themes/theme.css";

/* Your theme overrides (copied from theme.css or another premade theme) */
@import "./themes/my-theme.css";
```

`my-theme.css` structure, matching every shipped theme:

```
1. header comment
2. (optional) @layer utilities { :root[data-theme="theme-<name>"] { … } }   ← radius/shape overrides
3. @theme theme-<name> inline { }                                          ← custom brand/gray ramps
4. :root[data-theme="theme-<name>"],
   [data-theme="theme-<name>"] { … }                                       ← light tokens
5. [data-theme="theme-<name>"].dark { … }                                  ← dark tokens
```

Values may be Tailwind vars, hex, or oklch (`examples/customization/themes/static-9.html`):

```css
:root {
  --primary: var(--color-blue-600);
  --primary-hover: var(--color-blue-700);
  --primary-foreground: var(--color-white);

  --primary: #2563eb;

  --background: oklch(100% 0 0);
  --foreground: oklch(32.11% 0.02 264.05);

  --my-brand: var(--color-purple-600);   /* needs the @theme inline mapping below */
}
```

A genuinely new token needs the mapping too (`static-8.html`):

```css
@theme inline {
  --color-my-brand: var(--my-brand);
}
```

Then override it again for dark (`static-10.html`):

```css
.dark {
  --primary: var(--color-blue-500);
  --primary-hover: var(--color-blue-400);
  --background: var(--color-neutral-800);
  --my-brand: var(--color-purple-400);
}
```

**Checklist:** theme key is `theme-<name>` in all three selectors; both light and dark blocks cover
the same token set; chart and map tokens stay `var()`-based, never raw `oklch()`; `--primary-foreground`
is chosen by contrast against your actual `--primary` step in *each* mode.

---

## 8. Custom fonts

Two hooks, both in `assets/css/themes/theme.css`, in a plain `@theme` block (not `inline`) at lines
11-17:

| Var | Shipped value | Utility it generates |
|---|---|---|
| `--font-custom-default` | `var(--font-sans)` | `font-custom-default` |
| `--font-custom-serif` | `"Domine", ui-sans-serif, system-ui, …` | `font-custom-serif` |
| `--font-custom-mono` | `"Kode Mono", ui-sans-serif, system-ui, …` | `font-custom-mono` |

The same block also holds `--radius-full: calc(infinity * 1px)`.

To change the *body* font you do not touch these — you override `--font-sans`, which
`--font-custom-default` points at (`examples/customization/themes/static-12.html`):

```css
:root {
  --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;
}
```

Load the face first — the `@import url(…fonts.googleapis.com…)` goes **above**
`@import "tailwindcss"` (`examples/customization/themes/static-11.html`).

Caveat: no example, doc page or component in this skill's 825 mined examples uses a `font-custom-*`
class. They are hooks, not a pattern in use.

---

## 9. Fork divergences — `pubweb-saas` vs upstream Preline 4.2.0

`reference/moon-token-table.md` and `data/moon-tokens.json` are resolved from the **fork actually in
use** (`assets/css/project-theme.css` + `assets/css/project-moon.css`), not from
`assets/css/themes/*.css`. Three differences matter.

**(a) `--<component>-line` was renamed to `--<component>-border` on the raw-variable side.** The
utility name is unchanged (`border-card-line` still works); only the variable the mapping reads
moved:

| Utility | Upstream var | Fork var |
|---|---|---|
| `card-line` | `--card-line` | `--card-border` |
| `navbar-line`, `navbar-1-line`, `navbar-2-line` | `--navbar-line`, … | `--navbar-border`, … |
| `sidebar-line`, `sidebar-1-line`, `sidebar-2-line` | `--sidebar-line`, … | `--sidebar-border`, … |
| `dropdown-line`, `select-line`, `overlay-line`, `popover-line`, `tooltip-line`, `table-line`, `footer-line` | `--*-line` | `--*-border` |

`--layer-line`, `--primary-line` and `--secondary-line` were **not** renamed.

The trap: `assets/css/project-moon.css` still declares `--navbar-line`, `--sidebar-line`,
`--card-line`, `--popover-line`, `--table-line` and `--footer-line`. Nothing reads them — the fork's
`@theme inline` reads the `-border` names. They are inert, and they look fine only because the
values coincide with the base defaults (`gray-200` / `neutral-700`). **Pasting an upstream premade
theme into this project silently loses every one of those borders.** Rename them on the way in.

**(b) The fork drops the plain `@theme { }` block.** `assets/css/project-theme.css` contains no
`--font-custom-*` and no `--radius-full`, and none of the four `preline-*` custom palettes — so
`harvest`, `bubblegum`, `cashmere` and `olive` cannot be dropped into this project as-is; their
ramps are missing.

**(c) Upstream `moon.css` is thinner than the fork.** Its dark block sets only `--background-plain`
and the primary/chart tokens, inheriting `--background: neutral-800` from `theme.css`'s `.dark`. The
fork sets `--background: neutral-900` explicitly, which is what the token table records. When in
doubt about a moon value, `reference/moon-token-table.md` is the authority for *this project*;
`assets/css/themes/moon.css` is the authority for upstream.

App-level base rules that are not in either theme file live in
`pubweb-saas/resources/css/app.css`: `input/select/textarea`
inherit `--color-foreground`, checkbox/radio take **all** colour from
`--color-primary-checked` + `--color-border` (a colour utility on a checkbox is a bug), and the focus
ring is re-declared to `ring-1 ring-primary` with a 1px offset painted in `--color-background`.
There is one `@layer components` class, `.input-primary`.

---

## 10. Generating a brand-new theme

Preline ships its own Agent Skill for this. It is vendored, offline, at
`reference/upstream-theme-generator/`:

| Path | Use |
|---|---|
| `SKILL.md` | entry point + read order + security constraints |
| `docs/workflow.md` | preview / write / validate modes, input normalisation, output structure |
| `docs/palette-guidance.md` | hue ranges, mood→palette mapping, gray-family choice |
| `docs/final-output-style.md` | rules for the emitted file |
| `docs/validation-checklist.md` | close-out checks |
| `docs/token-reference.md` | full token coverage detail |
| `examples.md` | sample outputs |
| `scripts/find-themes-dir.js` | resolves the target dir (no repo-wide `find .`) |
| `scripts/run-theme-generator.js` | the **only** execution entry point |

```bash
# preview to stdout
node scripts/run-theme-generator.js --name seafoam --hue 180 --style vibrant --tailwind-gray zinc --stdout

# write the file
node scripts/run-theme-generator.js --name seafoam --hue 180 --style vibrant --tailwind-gray zinc --output src/assets/css/themes/seafoam.css
```

Inputs: `name` (kebab-case, required), `hue` **or** `primaryColor` (required; use `primaryColor` only
for a brand hex), `style` (`vibrant` default, `soft` for muted/pastel), `useCustomDarkGray` (only on
an explicit "cohesive dark" request), `tailwindGray` (`stone|neutral|zinc|slate|gray`),
`fontSans`/`fontSerif`/`fontMono` (only if asked).

Its rules: no `npx`, no network, no raw user text interpolated into the shell, exactly one project
file created, and the theme directory resolved by `find-themes-dir.js` — which checks
`src/assets/css/themes/`, `src/css/themes/`, `src/styles/themes/`, `assets/css/themes/`,
`styles/themes/`, `dist/assets/css/themes/`, `npm/preline/css/themes/`, in that order. **This
project's themes live at `resources/css/themes/`, which is not on that list** — pass the path
explicitly, and apply the fork renames from §9(a) to the output.
