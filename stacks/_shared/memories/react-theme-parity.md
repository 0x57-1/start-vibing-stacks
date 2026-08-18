---
version: 1.1.0
---

# Memory: React Theme Parity (Laravel / Inertia / SPA)

> **ALWAYS LOAD** — Before and after editing React UI (`.jsx` / `.tsx`) or theme
> CSS, discover the house theme and **validate mechanically**. Stops long-session
> drift: purple shadcn, `gray-*`, `text-white` on primary, `dark:` on tokens,
> invented utilities, extract-refactors that drop identifiers.

Evidence: pubweb-saas session `8a0abd61` (style-guide + crash `labelColor` +
transparent tables + hover ΔL*=0). Skill `react-theme-apply` is the playbook.

---

## Declared purpose

Projects usually already have CSS tokens, layouts, Common components, and a kit
(Preline moon, custom). Agents invent a second system mid-session. This memory
forces **CSS truth → copy → grep/guard → both modes**.

---

## CSS-first gate (before any token migrate in JSX)

If `resources/css/themes/` exists:

1. Read `theme.css` (`@theme inline`) + the active theme file (`moon.css`, …).
2. Confirm each token you will use exists in **@theme inline** AND **both**
   light and dark theme blocks. A name only in light **freezes** when the theme
   selector out-specifies `.dark` (moon fork: `:root[data-theme]` is (0,2,0)).
3. Fork vs upstream spelling (`-border` vs `-line`) — fix the **map**, do not
   invent a third name.
4. **No mass JSX migrate** onto a lying token. CSS patches first.

If no themes folder → sibling-page parity only. Do not invent a palette.

Then: ThemeContext / `data-theme` / `.dark` → layouts → 1–2 sibling pages →
`STYLES` / `uiStyles.js` → CLAUDE.md FORBIDDEN UI.

---

## Two valid modes (do not mix on one screen)

| Mode | When | Rules |
|------|------|--------|
| **A. Semantic tokens** | `bg-primary`, `text-foreground`, `border-line-*` exist | **No `dark:` on those colors** (tokens flip). |
| **B. Explicit gray + `dark:`** | Legacy sibling already uses `bg-white dark:bg-neutral-800` | Copy that family only. |

---

## Hard laws (reject on sight)

| Law | Fail |
|-----|------|
| 1 | `dark:bg-*` / `dark:text-*` next to a semantic token (`bg-card`, …) |
| 2 | `text-white` on `bg-primary` / `bg-secondary` when those invert in dark |
| 3 | Invented token (`bg-neutral-soft`, …) — compiles to **nothing**, no error |
| 4 | Hover/focus color ≡ parent surface (ΔL* 0) — e.g. `hover:bg-dropdown-item-hover` on `bg-card` when both resolve to the same hex |
| 5 | Transparent table on a busy page — tables need an **opaque** surface (`bg-sidebar` / `bg-card`) + thead token, **both** modes |
| 6 | Extract shared JS (`chartTheme.js`, `uiStyles.js`) without `rg` of **every old identifier** at every call site |
| 7 | `focus:outline-none` without `focus-visible:` / `focus:ring` in the **same** class string |
| 8 | New UI library (shadcn/MUI) not already in `package.json` |
| 9 | Probe files under `node_modules/` |
| 10 | “Looks fine” in one mode only |

**Four `dark:` exceptions only:** numeric ramp (`primary-50…950`), status hue with no token, dataviz categorical hex, **alpha of the same token** (`bg-primary/5 dark:bg-primary/10`).

---

## Extract / shared helper (P0)

When you move colors into a helper:

```bash
# old names that used to live in the file
rg -n "labelColor|axisColor|gridColor" resources/js
```

Every former identifier must exist on the export **or** every call site must be
updated **in the same commit**. Missing binding = whitescreen (session `labelColor`).

ATTENTION GATE if the extract is incomplete — do not push.

---

## Validation (before done / Stop)

- [ ] CSS-first gate passed (or no themes/)
- [ ] Same layout shell as siblings
- [ ] `STYLES` const / shared styles — not class novels
- [ ] Laws 1–7: run the guard
- [ ] Common/* reused
- [ ] **Both modes**: toggle or two computed styles — not “should flip”
- [ ] Live curl uses a **browser UA** (Cloudflare 520 on `curl/*` is not “site down”)

```bash
node scripts/check-theme-tokens.mjs
# if the project has it:
php artisan test --filter=DesignSystemGuard
```

If `docs/design/style-guide/` exists, that guide **wins** over inventing markup.
If the guide number ≠ today’s grep, fix the **number**, not the recipe.

---

## UPS

`user-prompt-submit` injects **THEME APPLY** (1.16+) on theme/table/hover prompts
or when `themes/*.css` / `.jsx` are in `filesTouched`. Not optional flavor.

---

## See also

- Skill `react-theme-apply` — order of work
- Skills `preline-moon`, `react-standards`, `tailwind-patterns`
- `cdn-asset-deploy-verify.md` — browser UA for live HTML
- `execute-ship-ops.md` — ATTENTION if extract incomplete
- `svs-finalize` — run the guard before documenter on theme touches
