---
name: ui-ux-audit
version: 2.0.1
description: "UI/UX audit workflow targeting WCAG 2.2 AA (current W3C Recommendation since Dec 2024 — WCAG 3.0 is still a Working Draft as of 2026, do NOT plan against it). Competitor research, multi-viewport responsiveness (375 / 768 / 1280 + 1440), touch-target ≥ 24×24 CSS px (WCAG 2.2 SC 2.5.8), focus-not-obscured (2.4.11/2.4.12), redundant entry / accessible auth (3.3.7/3.3.8), design-system consistency. Pairs with accessibility-wcag22 for the per-criterion checklist. Invoke before implementing any UI feature."
---

# UI / UX Audit (WCAG 2.2 AA, 2026)

**ALWAYS invoke BEFORE implementing any UI feature, and again BEFORE merging.**

> WCAG 2.2 AA is the conformance target (W3C Recommendation Dec 12, 2024). WCAG 3.0 remains a Working Draft (March 2026 update) — useful to read, but do not gate on it.

## Workflow

```
1. IDENTIFY  → What type of UI? Mobile-first? Form-heavy? Data-dense?
        ↓
2. RESEARCH  → 3–5 competitor screenshots; note common patterns + differentiation opportunities
        ↓
3. DECIDE    → Pattern chosen + WHY (record in domain.md "decisions" section)
        ↓
4. IMPLEMENT → Follow accessibility + responsiveness checklists below
        ↓
5. VALIDATE  → Local harness, then walk 127.0.0.1 with the Playwright plugin (playwright-automation 2.1). axe-core + viewports 375 / 768 / 1280. A measure script is for contrast numbers only.
        ↓
6. DOCUMENT  → Update domain.md with the chosen pattern + rationale
```

## Accessibility checklist — WCAG 2.2 AA

The "Big 8" catches ~80% of issues; the WCAG 2.2 deltas are the next 15%.

### Big 8 (perpetual, 2.0+)
- [ ] Semantic HTML (`<button>` not `<div onClick>`; `<a href>` for nav)
- [ ] Every interactive element keyboard reachable + activatable (Tab, Enter, Space, Esc)
- [ ] Visible focus indicator on every focusable element (no `outline: none` without a replacement)
- [ ] Every form input has a programmatic label (`<label for>` or `aria-label`)
- [ ] Color contrast ≥ 4.5:1 (normal text), ≥ 3:1 (≥18pt or 14pt bold), ≥ 3:1 (non-text UI)
- [ ] Every meaningful image has `alt`; decorative images have `alt=""`
- [ ] One `<h1>` per page; no skipping heading levels
- [ ] ARIA only when native HTML can't express it ("first rule of ARIA: don't use ARIA")

### WCAG 2.2 deltas (the 9 new criteria)
- [ ] **2.4.11 / 2.4.12 Focus Not Obscured** — sticky headers / modals must not fully hide the focused element
- [ ] **2.5.7 Dragging Movements** — every drag operation has a non-drag alternative (kanban: keyboard reorder; slider: text input; drag-upload: click-to-pick)
- [ ] **2.5.8 Target Size (Minimum)** — interactive targets ≥ **24×24 CSS px** (with spacing exceptions); icon buttons need padding even if icon is smaller
- [ ] **3.2.6 Consistent Help** — help mechanism in same relative location across pages
- [ ] **3.3.7 Redundant Entry** — don't ask users to re-enter info already provided in the same flow (auto-fill or carry forward)
- [ ] **3.3.8 Accessible Authentication (Min)** — at least one auth method that doesn't require cognitive function tests (allow paste of password, support password managers, offer passkeys / magic links)

For the per-criterion code patterns, see `accessibility-wcag22`.

## Responsiveness checklist (multi-viewport)

Test at:
- **375 × 667** — small mobile (iPhone SE-class)
- **414 × 896** — large mobile (iPhone Pro Max-class)
- **768 × 1024** — tablet portrait
- **1280 × 800** — small desktop
- **1440 × 900** — typical desktop
- **1920 × 1080** — large desktop

Per breakpoint:
- [ ] No horizontal scroll
- [ ] Tap targets ≥ 24×24 (≥ 44×44 strongly recommended on touch)
- [ ] Text scales (use `rem` / `clamp()`); no fixed `px` for body
- [ ] Images responsive (`max-width: 100%; height: auto;`) and prefer `srcset` / `<picture>`
- [ ] No hover-only interactions on touch devices
- [ ] Sticky elements don't obscure focus or content (WCAG 2.4.11)
- [ ] Forms reflow vertically on narrow viewports

## Design-system consistency

- [ ] Use the project's component library (shadcn/ui, Mantine, Radix, MUI, etc.) — don't roll your own when one exists
- [ ] Use design tokens (Tailwind theme, CSS vars) — no raw hex colors in components
- [ ] Use the spacing scale (Tailwind `p-2`, `gap-4`) — no arbitrary `padding: 13px`
- [ ] Use the typography scale (named sizes in Tailwind / theme) — no `font-size: 17px` one-offs
- [ ] Loading states for **every** async action
- [ ] Error states for **every** fallible operation (toast, inline, or boundary — pick one and use it consistently)
- [ ] Empty states for every list (with action when applicable)

## Tooling

| Layer | Tool |
|---|---|
| Static / dev | `eslint-plugin-jsx-a11y` |
| Runtime in tests | `@axe-core/playwright` (`AxeBuilder`) |
| Manual smoke | Lighthouse → Accessibility tab |
| Color-contrast check | DevTools → Inspect → Accessibility pane |
| Screen reader spot-check | VoiceOver (macOS), NVDA (Windows) |

```ts
// Playwright + axe-core — drop into tests/e2e
import AxeBuilder from '@axe-core/playwright';

test('home is WCAG 2.2 AA clean', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

## Rules

1. **RESEARCH COMPETITORS** — before any new pattern; record decisions in domain.md
2. **MOBILE-FIRST** — design at 375 first; widen up. Never the reverse.
3. **WCAG 2.2 AA IS THE FLOOR** — never weaken to 2.1; aim for AAA where cheap (focus appearance, error suggestion)
4. **DOCUMENT THE WHY** — pattern choices live in domain.md so the next implementer doesn't relitigate
5. **TEST AT THE SIX BREAKPOINTS** — see Responsiveness checklist; CI runs at minimum 375 / 768 / 1280

## See Also

- `accessibility-wcag22` — per-criterion code patterns and axe-core integration
- `playwright-automation` **2.1** — local walk before deploy, then multi-viewport tests (375 / 768 / 1280)
- `tailwind-patterns` / `shadcn-ui` — when those are the design system
