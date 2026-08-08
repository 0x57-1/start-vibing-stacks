---
component: devices
label: Devices
category: base-components
docs: https://preline.co/docs/components/devices.html
examples: 2
js: none
tokens: [inverse, plain, foreground-inverse]
---

# Devices

Pure-CSS phone bezel and browser-window chrome that frame a screenshot `<img>` on marketing pages.

## When to use
- Landing / marketing sections that show a product screenshot and need it to read as "a real screen".
- Prefer over `card` when the frame itself is the message; prefer `card` (or plain `images`) inside the app, where a fake browser bar competes with the real one.
- Do NOT wrap live interactive UI in it — the bezel is decorative `<figure>` markup with no clipping guarantees and no responsive scaling of the content.
- Do NOT use both mockups in one viewport at the same scale; the phone is `w-60`, the browser `w-3xl`, and they are drawn to different visual weights.

## Anatomy

Reduced skeleton (all classes appear verbatim in the example files):

```html
<!-- REDUCED SKELETON - browser variant -->
<figure class="... shadow-[...] dark:shadow-[...] rounded-b-lg">   <!-- shadow is hand-written, NOT a token -->
  <div class="relative flex items-center bg-inverse rounded-t-lg py-2 px-24">   <!-- chrome bar -->
    <div class="flex gap-x-1 absolute top-2/4 inset-s-4 -translate-y-1">
      <span class="size-2 bg-plain/30 rounded-full"></span>        <!-- traffic lights x3 -->
    </div>
    <div class="... size-full bg-plain/30 text-foreground-inverse rounded-sm">www.preline.com</div>
  </div>
  <div class="bg-inverse rounded-b-lg">                            <!-- body -->
    <img class="max-w-full h-auto rounded-b-lg" src="..." alt="...">
  </div>
</figure>
```

The phone variant is the same idea with one layer: `<figure>` → `div.p-1.5.bg-inverse.rounded-3xl` → `<img>`.

## Variants
| Variant | Section | Example file | What changes |
|---|---|---|---|
| `mobile` | Phone mockup | `examples/base-components/devices/mobile.html` | Single `bg-inverse` bezel, `p-1.5` + `rounded-3xl`, fixed `w-60`, image `280x560`. Adds an `inset` shadow layer to fake the bottom edge highlight. No chrome, no text, uses only `inverse`. |
| `browser` | Browser window | `examples/base-components/devices/browser.html` | Two-piece frame (`rounded-t-lg` chrome bar + `rounded-b-lg` body), three `bg-plain/30` traffic-light dots absolutely positioned at `inset-s-4`, a `bg-plain/30` URL pill with `text-foreground-inverse`, `w-3xl`, image `1618x1010`, and `ms-auto me-20 relative z-1` positioning. |

## Theme tokens (moon)
| Token (utility) | Role in this component | Light | Dark |
|---|---|---|---|
| `inverse` | The device body: phone bezel, browser chrome bar and browser body (`bg-inverse`, 3 occurrences) | `gray-800` | `neutral-950` |
| `plain` | Chrome furniture drawn *on* the bezel — traffic-light dots and the URL pill, always at 30% alpha (`bg-plain/30`) | `white` | `neutral-800` |
| `foreground-inverse` | The `www.preline.com` label inside the URL pill (`text-foreground-inverse`) | `white` | `white` |

## Behaviour (JS)
Static markup only -- no Preline JS. `index.json` reports `hs_attrs: []` and `hs_js: []` for both examples.

## Gotchas
- **The chrome furniture nearly disappears in dark mode.** `bg-plain/30` is `white`/30 over a `gray-800` bezel in light (clearly visible) but `neutral-800`/30 over a `neutral-950` bezel in dark — near-zero contrast. If the traffic lights and URL pill must read in dark, replace `bg-plain/30` with a literal `bg-white/30`, which is what light mode already resolves to.
- **`foreground-inverse` is `white` in BOTH themes.** It is the only theme-invariant token here, which is exactly why it works on the always-dark `inverse` bezel. Never reuse it on a light surface.
- **Shadows are not tokenized.** Both examples hand-write `shadow-[...]` plus a `dark:shadow-[...]` twin that swaps `rgb(45 55 75/…)` (blue-grey) for `rgb(0 0 0/…)`. These are the only `dark:` utilities in the component — copy the pair or dark mode keeps a blue-tinted light-mode shadow.
- **`w-3xl`, `z-1` and `inset-s-4` are v4-era spellings.** None exist in stock Tailwind v3 (v3 has `max-w-3xl` but no `w-3xl`; no numeric `z-1`; no logical `inset-s-*`), so on v3 they emit nothing and the layout silently collapses. `size-2` / `size-full` are NOT in that set — `size-*` landed in v3.4 and works there.
- **`px-24` on the chrome bar is structural, not cosmetic.** The traffic lights are `absolute … inset-s-4`, so they sit *over* the bar; the `size-full` URL pill is only kept clear of them by that padding. Shrink `px-24` and the dots overlap the URL text.
- **Logical properties mirror under RTL.** `ms-auto`, `me-20`, `inset-s-4` mean the browser mock flips side and the traffic lights move to the right edge under `dir="rtl"`. That is usually correct — just do not be surprised.
- **`mobile.html` sets `rounded rounded-[1.25rem]` on the same `<img>`** — two utilities writing `border-radius`, resolution left to stylesheet order. Drop the bare `rounded`; the `[1.25rem]` value is the intended one.
- **Image `src` is doc-relative and aspect-locked.** `../../assets/img/280x560/img1.jpg` and `../../assets/img/1618x1010/img1.jpg` will 404 in this repo. The folder name is the ratio: keep 1:2 for the phone and ~1.6:1 for the browser or the bezel padding reads uneven.
- **`<figure>` with no `<figcaption>` and a placeholder `alt`** ("Mobile Placeholder" / "Browser Placeholder"). Replace `alt` with what the screenshot actually shows, or set `alt=""` if the frame is purely decorative.

## Copy-paste base

`examples/base-components/devices/mobile.html`

```html
<figure class="mx-auto max-w-full w-60 h-auto">
    <div class="p-1.5 bg-inverse shadow-[0_2.75rem_5.5rem_-3.5rem_rgb(45_55_75/20%),0_2rem_4rem_-2rem_rgb(45_55_75/30%),inset_0_-0.1875rem_0.3125rem_0_rgb(45_55_75/20%)] dark:shadow-[0_2.75rem_5.5rem_-3.5rem_rgb(0_0_0/20%),0_2rem_4rem_-2rem_rgb(0_0_0/30%),inset_0_-0.1875rem_0.3125rem_0_rgb(0_0_0/20%)] rounded-3xl">
      <img class="max-w-full rounded rounded-[1.25rem] h-auto" src="../../assets/img/280x560/img1.jpg" alt="Mobile Placeholder">
    </div>
  </figure>
```
