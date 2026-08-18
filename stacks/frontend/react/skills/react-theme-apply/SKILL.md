---
name: react-theme-apply
version: 1.0.0
description: >
  Apply an existing React/Tailwind semantic theme (Preline moon or project
  themes/*.css) without inventing a second design system. CSS-first, then
  Common/shell, then pages, then shared JS helpers. Grep + both-mode proof.
  Use when correcting panel/pages to house tokens, tables/hover/contrast, or
  after a style-guide. Memory: react-theme-parity. Companion: preline-moon.
---

# React theme apply

**Invoke** when the user asks to align UI to the project theme, fix contrast /
tables / hover, or migrate raw `gray-*` to tokens. Pair with always-on
`react-theme-parity.md`.

> Do **not** start on pages. CSS that lies multiplies across every file you touch.

---

## Order (hard)

```
0. Locate truth     themes/*.css + @theme inline + style-guide if present
1. Patch CSS        both theme blocks + @theme map (no orphan light-only tokens)
2. Common + shell   Modal, table, layout, header/sidebar
3. Pages            copy STYLES from siblings; no new palette
4. Shared JS        chartTheme / uiStyles — rg every old ident
5. Guard            node scripts/check-theme-tokens.mjs (+ DesignSystemGuard)
6. Both modes       toggle or two computed styles
```

If `docs/design/style-guide/` exists, follow its recipes. Guide vs grep: fix the
**count** in the guide, not the token recipe.

---

## 0–1 CSS truth

```bash
ls resources/css/themes/
# Confirm token NAME in:
#   @theme inline  AND  light block  AND  dark block
```

Moon fork: `:root[data-theme="theme-moon"]` is **(0,2,0)** vs `.dark` **(0,1,0)**.
A custom property declared only in the light theme block **stays light** in dark.

Spelling: if moon says `--card-line` and `@theme` maps `--color-card-border`,
utilities are dead. Fix the map — do not invent `--card-border-line`.

**No JSX token migrate until this is green.**

---

## 2–3 Markup

- Same layout as siblings (`CmsLayout` / project shell).
- `STYLES` const. Semantic tokens. **No `dark:` on those colors** (4 exceptions
  in `react-theme-parity`).
- Tables: **opaque** surface + thead token; check first-column leftovers.
- Hover/focus must differ from the **painted parent** (not just “has hover:”).
- Focus: `outline` on chrome controls, `ring` on fields. Never `outline-none` alone.
- Reuse `Components/Common/*`. No new modal/spinner/UI lib.

Load `preline-moon` for `hs-*` / moon token tables — do not fetch preline.co.

---

## 4 Shared JS extract

```bash
rg -n "labelColor|from '@/lib/chartTheme'" resources/js
```

Ship the helper and **all** call-site updates in one commit. Missing export =
production whitescreen.

---

## 5 Guard

```bash
node scripts/check-theme-tokens.mjs
# project-specific:
# php artisan test --filter=DesignSystemGuard
```

R1 dark:+semantic · R2 bg-primary+text-white · R3 outline-none without substitute.

---

## 6 Prove both modes

Toggle `class="dark"` / ThemeContext. Cloudflare **520** on `curl/*` is anti-bot,
not “site down” — use a browser UA (`cdn-asset-deploy-verify`).

---

## FORBIDDEN

| Action | Why |
|--------|-----|
| Page-by-page token swap on broken CSS | Multiplies the lie |
| `dark:bg-neutral-800` next to `bg-card` | Freezes dark |
| New shadcn/MUI mid-feature | Second system |
| Write probes under `node_modules/` | Not a theme source |
| Claim done from one mode | Session 8a0abd61 |

---

## See also

- Memory `react-theme-parity`
- `preline-moon`, `react-standards`, `tailwind-patterns`
- `svs-finalize` — guard before documenter on theme touches
