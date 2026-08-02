---
version: 1.0.0
---

# Memory: React Theme Parity (Laravel / Inertia / SPA)

> **ALWAYS LOAD** — Before and after editing React UI (`.jsx` / `.tsx` pages or components), the agent MUST discover the project’s existing theme (or sibling-page CSS patterns) and validate that new UI matches it. Stops long-session drift: purple-default shadcn, random `gray-*`, `text-white` on primary, new UI libraries, one-off hex colors.

---

## Declared purpose

Laravel + React (Inertia or SPA) projects usually already have:

- CSS theme tokens (`resources/css/themes/*.css`, `@theme`, `data-theme`, `.dark`)
- Shared layouts (`CmsLayout`, `AppLayout`, `AuthLayout`, …)
- Shared Common components (`Spinner`, `Modal`, `EmptyState`, …)
- A house UI kit (Preline, custom, etc.) — **not** whatever the model defaults to

In long sessions Claude forgets and invents a second design system. This memory forces **discover → copy → validate**.

---

## Discovery protocol (run BEFORE writing UI)

Execute in order until you have a styling source of truth:

1. **Theme files** — Read if present:
   - `resources/css/themes/theme.css`, `*.css` under `resources/css/themes/`
   - `resources/css/app.css` (`@theme`, `.input-primary`, Preline imports)
   - `src/app/globals.css` / `app/globals.css` (Next-style)
   - `tailwind.config.*` only as fallback (v4 tokens often live in CSS)
2. **Theme runtime** — `ThemeContext`, `data-theme=`, `HSThemeAppearance`, `dark` class on `<html>`
3. **Layouts** — `resources/js/Layouts/*` or `src/components/layout/*`
4. **Sibling pages** — Open 1–2 pages in the **same area** (e.g. other `Pages/User/*`) and copy their class strategy
5. **Feature styles** — local `styles.js` / `STYLES` const / `_components/shared.jsx`
6. **CLAUDE.md / .cursorrules** — FORBIDDEN UI rules for this repo

If **no** dedicated theme tokens exist → **sibling-page parity** is mandatory (same layout wrapper, spacing tier, border/bg/text class families, button recipe). Do not invent a new palette.

---

## Two valid modes (pick one per feature — do not mix)

| Mode | When | Rules |
|------|------|--------|
| **A. Semantic tokens** | Project has `bg-primary`, `text-foreground`, `border-line-*`, `bg-card`, … | Use tokens; **avoid** `dark:` on those color utilities (tokens already flip) |
| **B. Explicit gray + `dark:`** | Legacy pages use `bg-white dark:bg-neutral-800` | Stay in that family for that feature; copy from sibling `styles.js` |

Mixing A and B on the same screen is the #1 “looks off” failure.

---

## Validation checklist (BEFORE claiming done / Stop)

For every new or heavily edited page/component:

- [ ] Wrapped in the **same layout** siblings use (`CmsLayout` / project equivalent)
- [ ] Classes in a **`STYLES` const** (or shared `styles.js`) — not Tailwind soup inline on every node
- [ ] Colors from theme tokens **or** sibling gray/`dark:` set — no one-off hex / random `blue-600`
- [ ] Primary buttons use project recipe (often `bg-primary text-primary-foreground`) — **not** `text-white` if moon/inverted themes break it
- [ ] Forms use project field class (e.g. `.input-primary`) when it exists
- [ ] Reused `Components/Common/*` (Spinner, Modal, EmptyState, …) — no new spinner/modal
- [ ] **No new UI library** (shadcn/MUI/Chakra/Radix) unless already a dependency
- [ ] Icons: project default (often `lucide-react` named imports)
- [ ] Spacing tier matches siblings (`p-4 sm:p-6` vs dense `p-3 sm:p-4`)
- [ ] Mobile: divided lists over card grids when that is the house rule
- [ ] Dark mode spot-check: toggle or reason about `.dark` / token flip

If any box fails → fix before finalize. In long sessions, **re-read** the theme file + one sibling page before the next UI chunk.

---

## Typical drift (reject on sight)

| Drift | Fix |
|-------|-----|
| Default “AI purple / indigo” palette | Revert to project primary tokens |
| Added shadcn/ui from muscle memory | Remove; use house components |
| `text-white` on primary CTA | Use `primary-foreground` or sibling button classes |
| `dark:` on semantic token colors | Drop `dark:`; let CSS variables flip |
| New card/modal primitive | Use `Components/Common` |
| Inline class novels | Extract `STYLES` |
| Wrong layout shell | Wrap like Quizzes / sibling Index page |

---

## Hook companion

`user-prompt-submit` injects a **THEME PARITY** reminder when the project has React UI and the prompt/session involves `.jsx`/`.tsx`. Treat it as mandatory, not optional flavor text.

---

## Scope

| Action | Status |
|--------|--------|
| Discover theme + sibling CSS before UI edits | Required |
| Validate checklist before done | Required |
| Introduce unrelated design system mid-feature | Forbidden |
| “Looks fine in light only” without dark/token check | Forbidden |

---

## See Also

- Skills: `react-standards` (Inertia), `react-api-standards`, `tailwind-patterns`, `preline-ui` / `shadcn-ui` (only if project already uses them)
- Memory: `cursor-ide-edit-sync.md` (IDE buffer vs real file when restyling)
- Skill: `svs-finalize` — theme parity before documenter/commit
