---
component: maps
label: Maps
category: third-party-plugins
docs: https://preline.co/docs/components/maps.html
examples: 9
js: none
tokens: [foreground, muted-foreground-1, muted-active, muted-hover, muted-focus]
---

# Maps

A Leaflet map mounted into a `div.hs-leaflet`, with a Preline `<style>` block that restyles Leaflet's own zoom bar and popup chrome.

## When to use
- Any geographic view: single location, marker set, city switcher, bubble/choropleth-style density map.
- NOT a Preline component. Preline ships no map JS at all — Leaflet does all the work; Preline contributes a CSS skin (`.hs-leaflet`) and, in one example, a tab strip.
- For a chart of geo data with no basemap, use `charts` (ApexCharts) instead — it is far lighter than Leaflet + tiles.
- The tile layers in every example point at third-party CDNs (`tile.openstreetmap.org`, `basemaps.cartocdn.com`). If the page must be offline or CSP-locked, this component cannot be used as shipped.

## Anatomy

REDUCED SKELETON — the mount node is the whole markup contract; everything else is JS.

```html
<!-- the map container. h-100 = height, hs-leaflet = the Preline skin hook,
     z-10 keeps Leaflet panes under overlays. -->
<div id="hs-basic-leaflet" class="h-100 hs-leaflet z-10"></div>

<!-- add hs-leaflet-unstyled-popover when the popup HTML is your own card -->
<div id="hs-custom-popover-leaflet" class="h-100 hs-leaflet hs-leaflet-unstyled-popover z-10"></div>
```

Assets required on the page (`examples/third-party-plugins/maps/how-to-use-assets-library.html` + `how-to-use-assets.css`):

```html
<link rel="stylesheet" href="./assets/vendor/leaflet/dist/leaflet.css">
<script src="./assets/vendor/lodash/lodash.min.js"></script>
<script src="./assets/vendor/leaflet/dist/leaflet.js"></script>
```

## Variants

| Variant | Section | Example file | What changes |
|---|---|---|---|
| Leaflet CSS | Installation | `examples/third-party-plugins/maps/how-to-use-assets.css` | The one `<link>` for `leaflet.css`. Without it the map renders as scrambled tiles. |
| Leaflet + lodash JS | Installation | `examples/third-party-plugins/maps/how-to-use-assets-library.html` | The two `<script>` tags. |
| Default map | Default map | `examples/third-party-plugins/maps/basic.html` (+ `.js`, `.css`) | Bare mount node. JS: `L.map(...)` with `center`, `zoom: 14`, `maxBounds` + `maxBoundsViscosity: 1.0`, OpenStreetMap tile layer. |
| Map with marker | Map with marker | `examples/third-party-plugins/maps/pin.html` (+ `.js`, `.css`) | Same markup; JS adds `L.marker([...]).bindPopup('...')`. Default blue Leaflet pin. |
| Grayscale basemap | Grayscale basemap | `examples/third-party-plugins/maps/stonescale.html` (+ `.js`, `.css`) | Same markup; tile URL swaps to `basemaps.cartocdn.com/light_all/...`. Only the tile source changes. |
| Custom map marker | Custom map marker | `examples/third-party-plugins/maps/custom-pin.html` (+ `.js`, `.css`) | Same markup; JS builds `L.icon({iconUrl: <data:image/svg+xml,…>, iconSize:[32,32], iconAnchor:[16,32], popupAnchor:[0,-32]})`. |
| Custom marker popovers | Custom marker popovers | `examples/third-party-plugins/maps/custom-popover.html` (+ `.js`, `.css`) | Adds `hs-leaflet-unstyled-popover` to the mount node so Leaflet's popup padding/background is zeroed and the JS-built card (`bg-white rounded-xl shadow-xl w-40 p-3`) is the whole popup. |
| City switcher | City switcher | `examples/third-party-plugins/maps/change-city.html` (+ `.js`, `.css`) | The only example with real markup: a wrapper div + `role="tablist"` pill nav (`--prevent-on-load-init`) of `data-hs-tab` buttons. JS calls `map.setView(coords, 14)` on click and toggles `.active` by hand. |
| Bubble map | Bubble map | `examples/third-party-plugins/maps/bubbles.html` (+ `.js`, `.css`) | Mount node drops `z-10`, keeps `hs-leaflet hs-leaflet-unstyled-popover`. JS draws animated `L.circle` per data point, swaps light/dark tile layers on theme change, reads `--map-colors-*` CSS vars via `varToColor`. |

## Theme tokens (moon)

Only the City switcher and Bubble map carry tokens; the other seven are unstyled mount nodes.

| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `foreground` | Active tab label, and tab label on hover/focus (`hs-tab-active:text-foreground`, `hover:text-foreground`) | `gray-800` | `neutral-200` |
| `muted-foreground-1` | Resting tab label; also the "Active:"/"New:" labels inside the bubble popup card | `gray-600` | `neutral-400` |
| `muted-active` | Selected tab pill fill (`hs-tab-active:bg-muted-active`) | `gray-100` | `neutral-700` |
| `muted-hover` | Selected tab pill fill on hover | `gray-100` | `neutral-700` |
| `muted-focus` | Selected tab pill fill on focus | `gray-100` | `neutral-700` |

Leaflet's own chrome is NOT tokenized. The shared `<style>` block hardcodes `#1f2937` (zoom glyphs), `#e5e7eb` (zoom hover), `#f3f4f6` (popup close button), `rgba(255,255,255,.8)` (zoom bar).

## Behaviour (JS)

Static markup only -- no Preline JS. Leaflet is the runtime; the mount node has no `data-hs-*` init attribute.

Every example wraps its code in `window.addEventListener('load', …)`; all except `bubbles.js` add an IIFE inside it. Then:

| Step | Call |
|---|---|
| Mount | `L.map('<id>', { center, zoom, maxBounds, maxBoundsViscosity: 1.0 })` |
| Basemap | `L.tileLayer(url, { maxZoom: 19, minZoom: 2, attribution }).addTo(map)` |
| Marker | `L.marker(coords, { icon }).bindPopup(html).addTo(map)` |
| Custom icon | `L.icon({ iconUrl, iconSize, iconAnchor, popupAnchor })` |
| Recenter | `map.setView(coords, 14)` |
| Bubble | `L.circle([lat,lng], { fillColor, fillOpacity, radius, color: null, weight: 0 })` + `circle.on('mouseover'/'mouseout')` |

`bubbles.js` additionally loads `assets/vendor/preline/dist/helper-shared.js` for `varToColor(varName, root?)` — that UMD bundle copies its exports onto `window`, so the call is bare. It returns `varName` untouched if it already starts with `#`/`rgba`, otherwise reads the computed custom property off `root ?? document.documentElement`, clamps its chroma in oklch and returns a hex. `bubbles.js` also listens to two Preline theme events:

```js
window.addEventListener('on-hs-appearance-change', (evt) => { currentTheme = evt.detail; return changeTheme(evt.detail); });
window.addEventListener('on-hs-color-theme-change', () => changeTheme(currentTheme));
```

`changeTheme` swaps `lightLayer` (`.../light_all/...`) for `darkLayer` (`.../dark_all/...`) via `map.removeLayer` / `map.addLayer`, and recolours the circles from `--map-colors-primary` / `--map-colors-primary-inverse`.

## Gotchas

- **The `<style>` block is not optional and is identical in all 7 map examples** (md5 `7cb3aea8…` for `basic.css`, `pin.css`, `stonescale.css`, `custom-pin.css`, `custom-popover.css`, `change-city.css`, `bubbles.css`). Without it you get stock Leaflet chrome, not the Preline look. Copy it once globally, not per-map.
- **The City switcher tab strip is deliberately dead to Preline.** `HSTabs.autoInit()` selects `[role="tablist"]:not(select):not(.--prevent-on-load-init)` — the nav carries `--prevent-on-load-init`, so `change-city.js` toggles `.active` itself. Strip that class and `HSTabs` instantiates on the nav: it binds its own click handler, does the same `.active` / `aria-selected` bookkeeping a second time, and treats `data-hs-tab="London"` as a CSS selector (`document.querySelector('London')` → `null`), so no panel is ever shown. Both handlers then run per click.
- **`z-10` on the mount node.** Leaflet sets very high z-indexes on its own panes and controls; the class puts the map in its own stacking context. Six of the seven maps carry it; `bubbles.html` is the only one without (`class="h-100 hs-leaflet hs-leaflet-unstyled-popover"`). `bubbles.js` also passes `zoomControl: false` and then re-adds the control with `L.control.zoom({ position: 'topright' })`.
- **Dark mode does not follow moon automatically.** Only `bubbles.js` swaps tile layers on `on-hs-appearance-change`. The other six hardcode one basemap and glare in dark mode: `basic.js`/`pin.js` on `tile.openstreetmap.org/{z}/{x}/{y}.png`, and `stonescale/custom-pin/custom-popover/change-city` on `{s}.basemaps.cartocdn.com/light_all/…`. The popup cards in `custom-popover.js` and `bubbles.js` are hardcoded `bg-white` too.
- **Popup HTML built in JS is outside the Tailwind scan by default.** `change-city.js` emits `text-gray-800`/`text-gray-500`; `bubbles.js` emits `text-muted-foreground-1`. Those classes only exist in `.js` files — add the JS to your Tailwind `@source`/content globs or they get purged and the popup renders unstyled.
- **`hs-leaflet-unstyled-popover` strips Leaflet's popup box.** It sets `display: flex` on `.leaflet-popup-content-wrapper` and, on `.leaflet-popup-content`, `padding: 0; margin: 0; background: none; line-height: normal; border-radius: 0; font-size: inherit; min-height: auto`. Add it only when you supply the whole card; on a plain `bindPopup('text')` the text sits flush against the popup edge.
- **`maxBounds` + `maxBoundsViscosity: 1.0` in every example clamps the map to Britain** (`[[40,-10],[60,10]]`), except `bubbles.js` which uses the whole world. Copy-pasting `basic.js` for a non-UK centre gives a map that snaps back and looks broken.

## Copy-paste base

`examples/third-party-plugins/maps/pin.html` (markup) + `examples/third-party-plugins/maps/pin.js`:

```html
<div id="hs-pin-leaflet" class="h-100 hs-leaflet z-10"></div>
```

```html
<script>
  window.addEventListener('load', () => {
    (function () {
      const map = L.map('hs-pin-leaflet', {
        center: [51.5074, -0.1278],
        zoom: 14,
        // Prevent dragging over the limit
        maxBounds: [
          [40, -10],
          [60, 10]
        ],
        maxBoundsViscosity: 1.0
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 2,
        attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      L.marker([51.5074, -0.1278]).bindPopup('This is London, UK.').addTo(map);
    })();
  });
</script>
```
