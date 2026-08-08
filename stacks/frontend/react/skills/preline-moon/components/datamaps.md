---
component: datamaps
label: Datamaps
category: third-party-plugins
docs: https://preline.co/docs/components/datamaps.html
examples: 2
js: none (Datamaps + D3 + TopoJSON -- Preline lends varToColor from helper-shared.js)
tokens: [muted-foreground-1]
---

# Datamaps

A choropleth world map rendered as SVG by the third-party **Datamaps** library (D3 + TopoJSON); Preline contributes an empty mount `<div>`, a set of `--map-colors-*` CSS variables, and the `varToColor` helper that converts them into the hex strings D3 requires.

## When to use
- Country-granularity distribution of one metric: users, revenue, sessions per country.
- **Do not use** for a time series, ranking or share-of-total — a choropleth reads poorly for all three; use `charts` (ApexCharts, `helper-apexcharts.js`) instead.
- **Do not use** for sub-country geography. The bundled topology is `datamaps.world.js`; state/province maps need a different Datamaps build.
- Three vendor scripts (D3 + TopoJSON + Datamaps) plus `helper-shared.js` for a single figure — if the page only needs a flag + a number, that is `list-group` markup with no JS.

## Anatomy

Reduced skeleton. The HTML half is the whole of `examples/third-party-plugins/datamaps/basic-usage.html` — one line, no more; the library injects the `<svg>`:

```html
<!-- Mount point only. Datamaps writes an <svg> inside it. No classes, no data-hs-* attribute. -->
<div id="hs-users-datamap"></div>
```

```js
// varToColor() comes from helper-shared.js — it resolves a CSS custom property
// to a HEX string. D3/Datamaps cannot consume the raw oklch() token value.
const dataMap = new Datamap({
  element: document.querySelector('#hs-users-datamap'),
  projection: 'mercator',
  responsive: true,
  fills: {
    defaultFill: varToColor('--map-colors-default'),   // every unlisted country
    MAJOR:       varToColor('--map-colors-primary'),   // named fillKey
  },
  data: dataSet,                                       // { ISO3: { fillKey, … } }
  geographyConfig: {
    borderColor: …, highlightFillColor: …, highlightBorderColor: …,
    popupTemplate: (geo, data) => `…`,                 // returns an HTML string
  },
});
```

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| Library tags | Installation | `examples/third-party-plugins/datamaps/how-to-use-assets-library.html` | Three ordered `<script>`s: `assets/vendor/d3/d3.min.js`, `assets/vendor/topojson/build/topojson.min.js`, `assets/vendor/datamaps/dist/datamaps.world.js`. Order is load-bearing — Datamaps reads the `d3` and `topojson` globals at parse time. |
| World datamap | World datamap | `examples/third-party-plugins/datamaps/basic-usage.html` (+ `.js`) | The only functional example. `basic-usage.js` additionally loads `assets/vendor/preline/dist/helper-shared.js` for `varToColor`, defines a 6-country `dataSet` (BRA/CHN/DEU/GBR/IND/USA, all `fillKey: 'MAJOR'`; only USA sets `customName`), registers an `update` plugin that swaps the whole palette for dark, and adds **three** theme listeners across **two** event names (`on-hs-appearance-change` on `window` and again on the enclosing `[role="tabpanel"]`, `on-hs-color-theme-change` on `window`) plus one `resize` listener. |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `muted-foreground-1` | The "Active:" / "New:" labels inside `popupTemplate` (`text-muted-foreground-1`) — the only Preline semantic utility in the whole component | `gray-600` | `neutral-400` |

The map itself is **not** coloured by utilities. It is coloured by raw CSS custom properties read through `varToColor`. Under moon (`assets/css/themes/moon.css:90-93`) only four of the eight are overridden:

| CSS var | moon override | Used for |
|---|---|---|
| `--map-colors-primary` | `var(--color-primary-800)` → `primary-800` = `gray-800` light / `neutral-800` dark | `MAJOR` fill, light mode |
| `--map-colors-primary-inverse` | `var(--color-primary-200)` → `primary-200` = `gray-200` light / `neutral-200` dark | `MAJOR` fill, dark mode |
| `--map-colors-highlight` | `var(--color-primary-400)` → `primary-400` = `gray-400` light / `neutral-400` dark | hover fill + hover border, light mode |
| `--map-colors-highlight-inverse` | `var(--color-primary-400)` — **same value as the non-inverse** | hover fill + hover border, dark mode |
| `--map-colors-default` / `-inverse` | *not overridden by moon* — falls through to `assets/css/themes/theme.css:539-540` (`gray-300` / `neutral-600`) | unlisted-country fill |
| `--map-colors-border` / `-inverse` | *not overridden by moon* — falls through to `assets/css/themes/theme.css:543-544` (`gray-100` / `neutral-800`) | country outlines |

`assets/css/project-moon.css` contains **zero** `map-colors` declarations, so the pubweb-saas fork inherits exactly the above.

## Behaviour (JS)
Static markup only — no Preline JS component. Datamaps is the runtime; Preline only lends `varToColor` from `helper-shared.js`.

- **`varToColor(varName, el?)`** (`assets/js/preline/helper-shared.js`, exported onto the global by the UMD wrapper): returns the argument unchanged if it already starts with `#` or `rgba`; otherwise reads `getComputedStyle(el || document.documentElement).getPropertyValue(varName).trim()`, then `parse()` → `clampChroma(…, 'oklch')` → `formatHex()`. The second argument scopes the lookup to an element — pass it when the map lives inside a subtree with its own `data-theme`.
- **Constructor**: `new Datamap({ element, projection: 'mercator', responsive: true, fills, data, geographyConfig })`. No autoInit, no `data-hs-*`.
- **`dataMap.addPlugin('update', fn)`** registers a method, then `dataMap.update(mode)` invokes it with `(_, mode)`. Inside, the example reassigns `this.options.fills`, restrokes with `this.svg.selectAll('.datamaps-subunit').style('stroke', …)`, and calls `this.updateChoropleth(dataSet, { reset: true })`. `reset: true` is required — without it the previous fills survive.
- **`dataMap.resize()`** must be called from a `window` `resize` listener; `responsive: true` alone does not reflow.
- **Theme events**
  - `on-hs-appearance-change` — dispatched by `HSThemeSwitch` (`assets/js/preline/theme-switch.js`) as `window.dispatchEvent(new CustomEvent("on-hs-appearance-change", {detail: e}))` at the end of `setAppearance(e, t = true, i = true)`. `detail` is the **raw** theme argument, so it can be `'auto'` or `'default'`, not just `'dark'`/`'light'` — see the first gotcha. The example listens on `window` **and** on `document.querySelector('#hs-users-datamap').closest('[role="tabpanel"]')`, caching the tab-local value in `tabTheme` so a per-tab preview overrides the global one.
  - `on-hs-color-theme-change` — **the Preline runtime never dispatches it; only the docs site does.** In `assets/js/preline/` the string appears in exactly one file and only as a listener (`helper-apexcharts.js:8`). The dispatcher lives in the docs bundle: `assets/js/docs/hs.theming.js` fires it after writing `hs-clipboard-theme` and `data-theme="theme-…"`, and `assets/js/docs/hs.component-appearance.js` re-dispatches it into preview iframes. **Its `detail` is an object, not a string** — `{target, context, theme}` — so the example's `dataMap.update(evt.detail)` on this event hands the plugin an object, `mode === 'dark'` is false, and the light palette is applied unconditionally. In your own app nothing dispatches this at all, so either dispatch it yourself with `detail` set to a plain theme string, or drop the listener.
- Initial paint: `dataMap.update(localStorage.getItem('hs_theme'))` — the theme is read from `localStorage` key `hs_theme`.

## Gotchas
- **`=== 'dark'` is a strict compare against a value that is often `'auto'` or `'default'`.** Five places in `basic-usage.js` branch on `localStorage.getItem('hs_theme') === 'dark'` (lines 105-107) or `mode === 'dark'` (lines 138, 146), and `theme-switch.js` stores whatever string it was handed: `setAppearance(e, t = true, …)` does `t && localStorage.setItem("hs_theme", e)`, its toggle path writes `"dark"` or `"default"`, and its system-theme observer branches on `"auto" === localStorage.getItem("hs_theme")` — so `'auto'` is a real stored value. `setAppearance` itself resolves the alias (`"default"` → `light`, `"auto"` → `matchMedia('(prefers-color-scheme: dark)').matches`) **before** painting `<html>`, but it dispatches and stores the *unresolved* string. Net effect: a user on `'auto'` with a dark OS gets a dark page and **light** map borders/highlights, on first paint *and* on every switch — no error, just wrong colours. Resolve `'auto'`/`'default'` yourself before comparing.
- **Never pass a token straight to D3.** The `--map-colors-*` values are `oklch()`; D3/Datamaps write them into SVG `fill`/`stroke` where older engines and the SVG-to-canvas path choke. `varToColor` exists solely to hex them — dropping it silently yields unpainted (black or transparent) countries.
- **`fills` keys are matched against `data[ISO3].fillKey`.** `defaultFill` is mandatory; a country whose `fillKey` has no matching entry in `fills` renders unfilled.
- **The popup is hardcoded `bg-white`** in `basic-usage.js` (`<div class="bg-white rounded-xl shadow-xl w-37.5 p-3">`) — it does **not** use `bg-layer`, so the tooltip stays white in dark mode while its `text-muted-foreground-1` labels flip to `neutral-400` (low contrast on white). Swap to `bg-layer border border-layer-line` if you care.
- **The shipped `popupTemplate` has a real defect.** Two lines read `<span class="text-sm font-medium ${data.active.value}</span>` — the `class` attribute is never closed and the *value* is interpolated into it, so the number never renders. Same for `data.new.value`. Fix to `class="text-sm font-medium">${data.active.value}` when copying. The `growUp`/`growDown` strings also carry a stray extra `</svg>`.
- **`--map-colors-highlight` and `--map-colors-highlight-inverse` are literally the same declaration under moon** — both `var(--color-primary-400)` (`moon.css:92-93`). So the `=== 'dark'` ternary on `highlightFillColor` / `highlightBorderColor` picks between two identical vars: a no-op branch. The hover colour still flips with the mode, because `.dark` remaps `--primary-400` from `gray-400` to `neutral-400` underneath — it is the var that changes, not the branch. Do not "fix" a hover state by editing only one of the two names, and do not conclude hover is frozen at `gray-400` in dark.
- **`highlightFillColor` / `highlightBorderColor` are functions here; `borderColor` (line 105) is a plain value** evaluated once at construction. That asymmetry is load-bearing: the `update` plugin never touches highlight colours — it only reassigns `this.options.fills` and restrokes `.datamaps-subunit` — so re-reading the CSS var on every hover is the *only* thing that makes hover follow a theme change. Static border colour survives only because `update` restrokes it by hand.
- Flag images in the popup are loaded from a document-relative path (`../../assets/vendor/svg-country-flags/svg/${data.short}.svg`). That breaks the moment the page moves a directory level; make it root-relative.
- **Re-render kills it.** The instance holds a D3 selection over the injected `<svg>`. If a framework replaces `#hs-users-datamap`'s contents, construct a new `Datamap` — there is no `destroy()` call in the example to lean on.

## Copy-paste base

`examples/third-party-plugins/datamaps/how-to-use-assets-library.html` + `examples/third-party-plugins/datamaps/basic-usage.html` — the complete markup surface of this component is three script tags and one empty div:

```html
<script src="./assets/vendor/d3/d3.min.js"></script>
<script src="./assets/vendor/topojson/build/topojson.min.js"></script>
<script src="./assets/vendor/datamaps/dist/datamaps.world.js"></script>

<div id="hs-users-datamap"></div>
```

Minimal init — reduced from `examples/third-party-plugins/datamaps/basic-usage.js` (read that file for the full `dataSet`, `popupTemplate` and theme-event wiring). The `src` below is verbatim from that file and is **Preline-dist-relative**; the copy of the same file mined into this skill, the one to read, is `assets/js/preline/helper-shared.js`:

```html
<script src="../../assets/vendor/preline/dist/helper-shared.js"></script>
<script>
  (function () {
    const dataSet = { USA: { fillKey: 'MAJOR', short: 'us' } };
    const dataMap = new Datamap({
      element: document.querySelector('#hs-users-datamap'),
      projection: 'mercator',
      responsive: true,
      fills: {
        defaultFill: varToColor('--map-colors-default'),
        MAJOR: varToColor('--map-colors-primary'),
      },
      data: dataSet,
    });

    window.addEventListener('resize', function () {
      dataMap.resize();
    });
  })();
</script>
```
