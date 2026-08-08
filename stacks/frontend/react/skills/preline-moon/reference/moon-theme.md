# Preline `theme-moon` — deep profile (pubweb-saas fork)

**What this answers:** what moon resolves to in light and dark, why `primary` flips from a dark
surface to a *white* surface in dark mode (and what that breaks), why checkbox checkmarks needed a
per-theme data-uri, and exactly how `resources/css/themes/moon.css` in pubweb-saas differs from
upstream Preline 4.2.0's `moon.css`. Read before touching any colour class or theme token here.
Flat token → colour lookup: `reference/moon-token-table.md`. Markup: `examples/`.

---

## 1. Where moon is wired

| Thing | Path |
|---|---|
| Fork of moon (307 lines, **in use**) | `resources/css/themes/moon.css` — byte-identical copy at `assets/css/project-moon.css` |
| Fork of the base token file | `resources/css/themes/theme.css` — copy at `assets/css/project-theme.css` |
| Upstream Preline 4.2.0 | `assets/css/themes/moon.css` (139 lines) · `assets/css/themes/theme.css` |
| Entry / import order | `resources/css/app.css` |
| Theme attribute + dark class | `resources/views/app.blade.php:2` |

`resources/css/app.css` load order (comments stripped):

```css
@import "tailwindcss";
@plugin "@tailwindcss/forms";
@import "./themes/theme.css";   /* base tokens + @theme inline utility mappings */
@import "./themes/moon.css";    /* theme override, must come after */
@custom-variant dark (&:where(.dark, .dark *));
```

Host element: `<html lang="…" data-theme="theme-moon" class="dark">`.

Selectors and specificity — this matters in §7.4:

| Block | Selector | Spec |
|---|---|---|
| theme.css base / dark | `:root` / `.dark` | (0,1,0) |
| moon light | `:root[data-theme="theme-moon"], [data-theme="theme-moon"]` | (0,2,0) via the `:root…` arm |
| moon dark | `[data-theme="theme-moon"].dark` | (0,2,0) |

Theme switching is Preline's `HSThemeAppearance` (`hs_theme`), proxied to `pw_theme`
(`resources/js/Context/ThemeContext.jsx` + the inline script in `app.blade.php`). It toggles the
`dark` class on `<html>`; `data-theme` never changes.

---

## 2. Design character — the mechanism, not the mood

moon has **no accent hue**. It re-points the whole `--primary-50…950` ramp at a neutral Tailwind
ramp: `--color-gray-*` in the light block, `--color-neutral-*` in the dark block.

Everything downstream inherits that, because theme.css maps utilities through an indirection:
`@theme inline { --color-primary-800: var(--primary-800); }`. So `var(--color-primary-800)`
re-resolves per mode with no second declaration — which is why moon can declare chart colours only
in the light block and still be right in dark (§7.4 lists the exceptions that reference
`--color-gray-*` directly and therefore do *not* re-resolve).

The only chromatic tokens left standing are the state colours: `destructive` `red-500` in **both**
modes, `destructive-hover`/`-focus` `red-600` in both.

---

## 3. The primary inversion — the most dangerous fact here

```css
/* moon light */                          /* moon dark */
--primary: var(--color-primary-800);      --primary: var(--color-white);
--primary-foreground: var(--color-white); --primary-foreground: var(--color-primary-800);
--primary-hover: var(--color-primary-900);--primary-hover: var(--color-primary-300);
--primary-checked: var(--color-primary-800); --primary-checked: var(--color-white);
```

Resolved (per `reference/moon-token-table.md`):

| Utility | Light | Dark |
|---|---|---|
| `primary` | `gray-800` | **`white`** |
| `primary-foreground` | `white` | **`neutral-800`** |
| `primary-hover` / `-focus` / `-active` | `gray-900` | `neutral-300` |
| `primary-checked` | `gray-800` | **`white`** |
| `primary-line` | `transparent` | `transparent` |
| `secondary` | `gray-900` | **`white`** |
| `secondary-foreground` | `white` | `neutral-800` |
| `tooltip` | `gray-900` | **`white`** |
| `tooltip-foreground` | `white` | `neutral-800` |
| `switch` | `white` | `neutral-800` |

**Consequence:** `bg-primary` is a *dark* surface in light mode and a *light* surface in dark mode.
Hardcoded light-on-primary text inverts into invisible.

| Never write | Write instead | Why |
|---|---|---|
| `bg-primary text-white` | `bg-primary text-primary-foreground` | `text-white` on a white surface in dark mode |
| `bg-secondary text-white` | `bg-secondary text-secondary-foreground` | same inversion |
| `bg-tooltip text-white` | `bg-tooltip text-tooltip-foreground` | same inversion |
| `checked:bg-primary-checked` + a white mark | see §5 | box and mark both white |

Evidence from the mined docs: **232 example files use `bg-primary`; in 0 of them does the same
`class` attribute also contain `text-white`** — Preline 4.2.0 always pairs a surface with its
`-foreground` token (`text-primary-foreground`: 121 files).

Canonical primary button, verbatim from `examples/base-components/buttons/active.html`:

```html
<button type="button" class="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg bg-primary border border-primary-line text-primary-foreground hover:bg-primary-hover focus:outline-hidden focus:bg-primary-focus active:bg-primary-active disabled:opacity-50 disabled:pointer-events-none" >
    Solid
  </button>
```

`--primary-line` is `transparent` in both modes: `border border-primary-line` is a 1px transparent
ring for box-model parity with the outline variant, not a visible border.

---

## 4. Full palette by family

Values from `reference/moon-token-table.md` (the authority for resolved colours).

`primary-50 … primary-950` map step-for-step: light → `gray-50 … gray-950`, dark →
`neutral-50 … neutral-950`. No shifts, no skips. (The table prints `zinc-50` for the `primary-50`
dark row; both CSS files declare `var(--color-neutral-50)` — identical lightness, read it as
`neutral-50`.)

### Page / surface

| Utility | Light | Dark |
|---|---|---|
| `background` | `white` | `neutral-900` |
| `background-1` / `-2` | `gray-50` / `gray-100` | `neutral-900` / `neutral-950` |
| `plain` (`--background-plain`) | `white` | `neutral-800` |
| `foreground` | `gray-800` | `neutral-200` |
| `foreground-inverse` | `white` | `white` |
| `inverse` | `gray-800` | `neutral-950` |
| `surface` | `gray-100` | `neutral-700` |
| `surface-1` / `-2` | `gray-200` / `gray-300` | `neutral-600` / `neutral-500` |
| `surface-3` / `-4` / `-5` * | `gray-400` / `500` / `600` | `neutral-600` / `500` / `400` |
| `surface-foreground` | `gray-800` | `neutral-200` |
| `surface-hover`/`-focus`/`-active` | `gray-200` | `neutral-600` |
| `muted` | `gray-50` | `neutral-800` |
| `muted-foreground` / `-1` / `-2` | `gray-500` / `600` / `700` | `neutral-500` / `400` / `300` |
| `muted-hover`/`-focus`/`-active` | `gray-100` | `neutral-700` |

\* See §7.4 — these three have no dark declaration in the fork.

### Lines

| Utility | Light | Dark |
|---|---|---|
| `border` | `gray-200` | `neutral-700` |
| `line-1` … `line-8` | `gray-100 · 200 · 300 · 400 · 500 · 600 · 700 · 800` | `neutral-700 · 700 · 600 · 500 · 400 · 300 · 200 · 100` |
| `line-inverse` | `white` | `white` |
| `{primary,secondary,surface,dropdown,select,overlay,tooltip}-line` | `transparent` | `transparent` |

The `line-1…8` ramp **reverses direction** between modes: higher index = darker in light, lighter
in dark. `border-line-3` is the field-border default (used by `.input-primary`).

### Containers

All are `white` in light. `*-inverse` is `gray-950` light / `black` dark for card, navbar,
sidebar, dropdown, select, overlay, footer; `layer` and `popover` have no inverse.

| Dark = `neutral-800` | Dark = `neutral-900` |
|---|---|
| `card` `layer` `overlay` `footer` | `navbar` `sidebar` `dropdown` `select` `popover` |

Every container's `*-line` / `*-divider` / `*-header` / `*-footer` is `gray-200` light,
`neutral-700` dark; `*-item-hover/focus/active` is `gray-100` light and `neutral-800` dark
(dropdown, select) or `neutral-700` (navbar, sidebar, layer).

### Charts

| Utility | Light | Dark |
|---|---|---|
| `chart-primary` | `gray-800` | `neutral-200` |
| `chart-1` / `-2` / `-3` / `-4` | `gray-50` / `200` / `400` / `950` | `neutral-800` / `400` / `600` / `white` |
| `chart-5` / `-6` / `-7` | `slate-400` / `zinc-500` / `stone-400` | `slate-400` / `zinc-500` / `stone-500` |
| `chart-8` / `-9` / `-10` | `gray-100` / `200` / `300` | `neutral-700` / `500` / `700` |

`chart-8/9/10` are *not* declared by moon — they come from theme.css and are already neutral.
`chart-5/6/7` are the deliberate non-primary slots, the only place moon admits a second family.

Separately, `--chart-colors-*` is the **ApexCharts bridge**: chart configs read it via
`varToColor('--chart-colors-…')` (`examples/third-party-plugins/charts/*.js`; `cssVarToValue` in
`assets/js/preline/helper-apexcharts.js`). Not a utility, not in the token table. See §7.5.

---

## 5. Checkbox / radio checkmark data-uri

**The failure.** `@tailwindcss/forms` paints a checked box with `background-color: currentColor`
and lays a checkmark SVG over it as a `background-image` data-uri with `fill="white"` **baked into
the URI** — and a data-uri cannot read a CSS variable. Fine while the accent is dark. Under moon
dark `--primary-checked` is `white`, so box and mark are both white: a blank square,
indistinguishable from unchecked.

Preline's own example carries the hazard (verbatim, `examples/basic-forms/checkbox/default.html`):

```html
    <input type="checkbox" class="shrink-0 size-4 bg-transparent border-line-3 rounded-sm shadow-2xs text-primary focus:ring-0 focus:ring-offset-0 checked:bg-primary-checked checked:border-primary-checked disabled:opacity-50 disabled:pointer-events-none" id="hs-default-checkbox">
```

**The fix, split across two files.**

1. `resources/css/themes/moon.css` re-declares the three data-uris for `theme-moon` + `.dark` only
   — the one theme/mode where the box behind the mark is light. Fill `%23262626` = `neutral-800` =
   `--primary-foreground` in dark:

```css
[data-theme="theme-moon"].dark input[type="checkbox"]:checked {
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='%23262626' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
}
```

   plus `input[type="radio"]:checked` (a `circle`) and `input[type="checkbox"]:indeterminate`
   (a `stroke='%23262626'` bar). Deliberately **no light-mode rule** — in moon light, and in the
   default theme in both modes, the box is dark and the plugin's white mark is already right.

2. `resources/css/app.css` `@layer base` moves the *colour* out of call sites:

```css
    input[type="checkbox"],
    input[type="radio"] {
        border-color: var(--color-border);
        color: var(--color-primary-checked);
    }
```

   Setting `color` (not `background-color` on `:checked`) is load-bearing: the plugin reads
   `currentColor` from **five** selectors — `:checked`, `:checked:hover`, `:checked:focus`,
   `:indeterminate`, `:indeterminate:hover/:focus` — and seeds `color` with blue-600. Overriding
   only `:checked` leaves the box right at rest and blue on hover/focus. The same block re-adds
   `border-radius: 0.25rem` (the plugin sets `none`) and declares the focus ring — `ring-1` in
   `--color-primary`, 1px offset painted in `--color-background`, matching `.input-primary`.

**Call-site rule in this repo: checkboxes and radios carry LAYOUT ONLY** — a colour utility on one
is now always a mistake. Real call site (`resources/js/Pages/Admin/Plans/Form.jsx:262`) is
`className="shrink-0 size-4"`. When copying a Preline checkbox example here, **strip**
`text-primary checked:bg-primary-checked checked:border-primary-checked border-line-3
focus:ring-0 focus:ring-offset-0`; keep `shrink-0 size-4`.

---

## 6. Fork vs upstream — the headline

Upstream `moon.css` is a **139-line stub** (73 light + 32 dark declarations) leaning on
`themes/theme.css` for the rest. The fork is **307 lines** (108 + 111), enumerating the neutral
surface/border/container system explicitly instead of inheriting it.

| | light | dark |
|---|---|---|
| upstream / fork declarations | 73 / 108 | 32 / 111 |
| only in upstream | 38 (all `--chart-colors-*` / `--map-colors-*`) | 0 |
| only in fork | 73 | 79 |
| conflicting values | **0** | **8** |

**Zero value conflicts in the light block** — where both declare a token, they agree. The fork's
light block is purely *additive*. The dark block is where the fork diverges for real.

---

## 7. The delta, precisely

### 7.1 What the fork adds in **light** (73, all new)

`--primary-foreground`; the full `--background*` / `--foreground` / `--inverse` / `--border` /
`--border-line-1…8` / `--surface*` / `--muted*` sets; every `--{layer,navbar,sidebar,card,
dropdown,select,overlay}-*` line/divider/header/footer/nav/item token; plus `--popover-line`
`--tooltip` `--table-line` `--footer-line` `--scrollbar-{track,thumb}`.
(Exact list: `diff` the two files, §8.)

Every one resolves to the value theme.css `:root` already had. **The light block is documentation,
not behaviour.** Before assuming a light-block edit is load-bearing, check theme.css `:root`.

### 7.2 What the fork adds in **dark** (79) — this *is* behaviour

Upstream moon dark declares only the neutral ramp, the primary inversion, the 7 `*-inverse`
tokens, `--switch`, `--background-plain` and 6 chart slots; everything else fell through to
theme.css `.dark`. The fork re-declares the whole surface system **one step darker**:

| Token | theme.css `.dark` (= upstream moon dark) | fork moon dark |
|---|---|---|
| `--background` | `neutral-800` | **`neutral-900`** |
| `--navbar` | `neutral-800` | **`neutral-900`** |
| `--sidebar` | `neutral-800` | **`neutral-900`** |
| `--card` | `neutral-800` | `neutral-800` (restated) |
| `--layer` | `neutral-800` | `neutral-800` (restated) |
| `--dropdown` / `--select` / `--popover` | `neutral-900` | `neutral-900` (restated) |

Net effect: page ground `neutral-900`, cards/layers lift to `neutral-800`. Upstream moon dark put
page and card both at `neutral-800` — flat.

### 7.3 The 8 value conflicts in the dark block

| Token | upstream moon dark | fork moon dark |
|---|---|---|
| `--{navbar,sidebar,card,dropdown,select,overlay,footer}-inverse` | `var(--color-primary-950)` → `neutral-950` | `var(--color-black)` |
| `--switch` | `var(--color-primary-800)` | `var(--color-neutral-800)` |

The 7 `*-inverse` tokens go to pure `black` in the fork (token table dark column: `black`). The
`--switch` change is cosmetically a no-op — `--color-primary-800` already resolves to
`neutral-800` in dark — but it hardcodes the family, so re-pointing the primary ramp no longer
moves the switch.

### 7.4 Nine tokens the fork declares in the LIGHT block only

```
--surface-3  --surface-4  --surface-5
--chart-colors-foreground   --chart-colors-foreground-inverse
--chart-colors-primary      --chart-colors-primary-inverse
--chart-5    --chart-6
```

`--chart-colors-primary*` is safe: written as `var(--color-primary-800)`, it re-resolves through
`@theme inline` in dark. `--chart-5/6` are `slate-400`/`zinc-500`, identical in both modes per the
table. The rest are written against `--color-gray-*` / `--color-white` literally and have
**no dark counterpart in the fork**, so their dark value depends on falling through to theme.css
`.dark` — and the moon light block matches `<html data-theme="theme-moon" class="dark">` at
specificity (0,2,0) while `.dark` matches at (0,1,0). `moon-token-table.md` reports the theme.css
`.dark` values (`surface-3/4/5` → `neutral-600/500/400`).

**Practical rule:** `bg-surface-3/4/5` (26 / 51 / 13 example files) is the one part of the surface
ramp whose dark rendering the fork does not pin. Prefer `surface`, `surface-1`, `surface-2` —
declared in both blocks. If you need 3/4/5 in dark, add the declaration rather than guess.

### 7.5 The `--chart-colors-*` / `--map-colors-*` tokens the fork dropped (38)

Upstream moon overrides the full ApexCharts bridge: `--chart-colors-chart-{1..7}` with their
`-inverse` / `-hex` / `-hex-inverse` variants, `--chart-colors-candlestick-*`, `--map-colors-*`.
The fork keeps only `--chart-colors-{foreground,primary}(-inverse)` and drops the other 38.

Non-hex ones degrade harmlessly: theme.css defines e.g.
`--chart-colors-chart-3: var(--color-primary-400)`, which moon's ramp already recolours to grey.

**The `-hex` ones do not.** In the fork's `themes/theme.css` they are literal hex, not `var()`:

| Token | fork theme.css `:root` | upstream theme.css `:root` |
|---|---|---|
| `--chart-colors-primary-hex` | `#2563eb` (blue-600) | `var(--color-primary-600)` |
| `--chart-colors-chart-1-hex` | `#eff6ff` | `var(--color-primary-50)` |
| `--chart-colors-chart-2-hex` | `#bfdbfe` | `var(--color-primary-200)` |
| `--chart-colors-chart-3-hex` | `#60a5fa` | `var(--color-primary-400)` |
| `--chart-colors-chart-4-hex` | `#1e40af` | `var(--color-primary-800)` |
| `--chart-colors-chart-{5,6,7}-hex` | `#9333ea` `#22d3ee` `#f97316` | purple-600 / cyan-400 / orange-500 |

Upstream moon overrode those; the fork does not. **Any chart here that reads a
`--chart-colors-*-hex` token renders Preline-blue, off-theme, in both modes.** Use the non-hex
tokens (`--chart-colors-chart-3`) or the `chart-N` Tailwind utilities.

### 7.6 Six dead declarations: the `*-line` → `*-border` rename

The fork's `themes/theme.css` is a different Preline revision: it renamed six container border
tokens and updated its `@theme inline` mapping accordingly.

```css
/* fork theme.css      */ --color-card-line: var(--card-border);
/* upstream theme.css  */ --color-card-line: var(--card-line);
```

`moon.css` (fork) still declares the **old** names, so these six declarations are inert — nothing
reads them: `--card-line` · `--navbar-line` · `--sidebar-line` · `--popover-line` ·
`--table-line` · `--footer-line`.

(`--layer-line` and `--border-line-1…8` are *not* affected; the fork kept those names.) The
utilities `border-card-line`, `border-navbar-line` etc. still work — they resolve to
`--card-border` / `--navbar-border` from theme.css, same `gray-200` / `neutral-700` values, so
nothing looks wrong. `moon-token-table.md` corroborates: those six rows print `--card-border`,
`--navbar-border`, … in the "CSS var" column, and `data/moon-tokens.json` flags them
`overridden_by_moon: false`.

**Consequence:** editing `--card-line` in `moon.css` changes nothing. Edit `--card-border`.

### 7.7 theme.css fork vs upstream, in one line

`:root` and `.dark` carry the same 246 / 153 declarations in both. The differences: the `*-line` →
`*-border` rename (§7.6), the `-hex` chart tokens becoming literals (§7.5), and `@theme inline`
shrinking 219 → 183 (fork drops the four `--color-preline-{khaki,mauve,avocado,avocado-soft}-*`
palettes, adds eight `--map-colors-*` mappings).

---

## 8. Grep recipes

```bash
# one token, both modes, full var() chain  ('overridden_by_moon' flags moon's 110 of 175)
python3 -c "import json;d=json.load(open('data/moon-tokens.json'));print(json.dumps(d['primary-foreground'],indent=1))"

# what the fork declares that upstream does not
diff <(grep -o '^\s*--[a-z0-9-]*' assets/css/project-moon.css | tr -d ' ' | sort -u) \
     <(grep -o '^\s*--[a-z0-9-]*' assets/css/themes/moon.css   | tr -d ' ' | sort -u)
```

## 9. Checklist before shipping a colour change

1. No `text-white` / `text-black` / `text-gray-*` on `bg-primary`, `bg-secondary`, `bg-tooltip` —
   use the matching `-foreground` token (§3).
2. No colour utility on `input[type=checkbox|radio]` — layout only (§5).
3. Not relying on `surface-3/4/5` in dark (§7.4); not reading `--chart-colors-*-hex` (§7.5).
4. Editing a container border token: `--card-border` / `--navbar-border` / …, not `--card-line`
   (§7.6).
5. New token in the fork's light block needs a dark-block counterpart unless written as
   `var(--color-primary-N)` (§2, §7.4).
