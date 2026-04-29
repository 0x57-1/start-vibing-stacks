---
name: accessibility-wcag22
version: 1.0.0
description: WCAG 2.2 AA checklist + axe-core / Playwright integration. Invoke when implementing UI features or auditing accessibility. Pairs with ui-ux-audit.
---

# Accessibility — WCAG 2.2 AA

**ALWAYS invoke when implementing UI, forms, navigation, or any user-facing component.**

> Accessibility is a feature, not a polish step. Building it in costs ~10x less than retrofitting.

## Targeting WCAG 2.2 AA

WCAG 2.2 (October 2023) adds 9 new success criteria over 2.1. Key additions:

| New (2.2) | What | Most relevant when |
|---|---|---|
| 2.4.11 / 2.4.12 Focus Not Obscured | Focused element must not be fully hidden by sticky headers/dialogs | Sticky nav, modals |
| 2.4.13 Focus Appearance (AAA) | Focus indicator size/contrast | Custom focus styles |
| 2.5.7 Dragging Movements | Drag operations must have a non-drag alternative | Kanban, sliders, reordering |
| 2.5.8 Target Size (Min) | Targets ≥ 24×24 CSS px | Buttons, icon links, list items |
| 3.2.6 Consistent Help | Help mechanism in same location across pages | Multi-page apps |
| 3.3.7 / 3.3.8 Redundant Entry / Accessible Authentication | Don't require re-entering data; offer non-cognitive auth | Multi-step forms, login |

## The "Big 8" — Catches 80% of Issues

1. **Semantic HTML** — `<button>` not `<div onClick>`. `<a href>` for navigation, `<button>` for actions.
2. **Keyboard navigation** — every interactive thing reachable via Tab, activatable via Enter/Space.
3. **Focus indicator** — visible outline on focus. Don't `outline: none` without a replacement.
4. **Labels** — every form input has `<label for>` or `aria-label`.
5. **Color contrast** — text 4.5:1 (3:1 for ≥18pt or 14pt bold). Non-text UI 3:1.
6. **Alt text** — every meaningful image has `alt`; decorative images have `alt=""`.
7. **Heading order** — one `<h1>` per page; no skipping levels (h2 → h4).
8. **ARIA only when needed** — first rule of ARIA: don't use ARIA. Native HTML almost always wins.

---

## React + Semantic HTML

```tsx
// WRONG
<div className="button" onClick={handleClick}>Submit</div>

// CORRECT
<button type="button" onClick={handleClick}>Submit</button>

// WRONG — visually a link, semantically a button
<a onClick={navigate}>Settings</a>

// CORRECT
<a href="/settings">Settings</a>
```

### Accessible custom controls
If you must build a custom widget (Combobox, Disclosure, Tabs), follow the **WAI-ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/patterns/

Better — use a headless library that already implements them:
- **Radix UI** (used by shadcn/ui)
- **React Aria** (Adobe)
- **Headless UI** (Tailwind Labs)

---

## Forms

```tsx
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  name="email"
  required
  aria-invalid={!!error}
  aria-describedby={error ? 'email-error' : undefined}
  autoComplete="email"
/>
{error && <p id="email-error" role="alert">{error}</p>}
```

Rules:
- Every input has a label (visible or `aria-label` for icon-only).
- `autoComplete` set for personal info fields (helps password managers + screen readers + 3.3.7).
- Error messages: `role="alert"` for live announcement OR `aria-describedby`.
- Don't disable submit while form is invalid; let user submit and show errors (better UX + a11y).

---

## Focus Management

```tsx
// Modal opens → move focus into the modal; closes → restore to trigger
const triggerRef = useRef<HTMLButtonElement>(null);
const dialogRef = useRef<HTMLDialogElement>(null);

useEffect(() => {
  if (isOpen) dialogRef.current?.focus();
  else triggerRef.current?.focus();
}, [isOpen]);
```

Use Radix / React Aria `Dialog` — they handle focus trap, escape, and `aria-modal` correctly.

### Skip links
```tsx
<a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>
<main id="main" tabIndex={-1}>...</main>
```

---

## Color & Contrast

```css
/* Background and foreground must hit 4.5:1 */
.btn-primary {
  background: #2563eb;   /* blue-600 */
  color: #ffffff;        /* 8.59:1 — passes AAA */
}
```

Tools:
- Browser devtools have built-in contrast checkers
- `@axe-core/react` shows warnings inline during dev
- VS Code: a11y-themes / Color Picker extensions

**Never** use color alone to convey meaning (e.g. red border = error). Pair with icon + text.

---

## Keyboard Testing — Manual

For every UI:
1. Tab through — every interactive thing is reachable
2. Tab order is logical (visual order matches DOM order)
3. Enter activates buttons/links; Space activates buttons (and toggles checkboxes)
4. Esc closes modals/menus
5. Arrow keys in radio groups, tabs, menus, listboxes
6. Focus is visible at every step
7. Focus is never lost or trapped (other than intentional in modals)

---

## Automated Testing — axe-core + Playwright

### Install
```bash
bun add -d @axe-core/playwright
```

### Per-page check
```ts
// tests/e2e/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('a11y', () => {
  for (const path of ['/', '/login', '/dashboard', '/settings']) {
    test(`no axe violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    });
  }
});
```

### Per-component check
```ts
test('Modal is accessible', async ({ page }) => {
  await page.goto('/components/modal-demo');
  await page.click('text=Open');
  const results = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .withTags(['wcag2aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

### Dev-time inline checks (React)
```ts
// app/providers.tsx — only in dev
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  import('@axe-core/react').then(axe => {
    import('react-dom').then(ReactDOM => axe.default(React, ReactDOM, 1000));
  });
}
```

---

## Lighthouse CI (Pages)

```yaml
# .github/workflows/ci.yml — append to e2e job
- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v11
  with:
    urls: |
      http://localhost:3000/
      http://localhost:3000/dashboard
    configPath: ./.lighthouserc.json
```

`.lighthouserc.json`:
```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:accessibility": ["error", { "minScore": 0.95 }]
      }
    }
  }
}
```

---

## Mobile / Touch (WCAG 2.2 §2.5.8)

```css
/* Minimum touch target — 24×24 CSS px (44×44 recommended for mobile) */
button, [role="button"], a {
  min-width: 44px;
  min-height: 44px;
}
```

For dense UIs, the spec allows smaller if "equivalent functionality" exists elsewhere — but it's safer to just hit 44px.

---

## Screen Reader Testing

You can't ship a11y without ever using a screen reader. Quick smoke:
- macOS: VoiceOver (`Cmd+F5`)
- Windows: NVDA (free) or Narrator
- Mobile: VoiceOver (iOS) / TalkBack (Android)

Test the golden path: load page → tab through → fill form → submit. If the screen reader announces what's happening, you're 80% there.

---

## Pre-Commit Checklist

- [ ] Semantic HTML (no `div onClick` for buttons/links)
- [ ] Every form input has a label
- [ ] Every image has `alt` (or `alt=""` if decorative)
- [ ] Heading levels are sequential (no skipping)
- [ ] Color contrast ≥ 4.5:1 for body text, 3:1 for large/UI
- [ ] Focus visible on all interactive elements
- [ ] Keyboard test passes (Tab/Enter/Esc/Arrows)
- [ ] axe-core test added for new pages/components
- [ ] Touch targets ≥ 24×24 px (44 recommended)
- [ ] Drag operations have non-drag alternative (WCAG 2.2 §2.5.7)
- [ ] No `outline: none` without replacement
- [ ] No `aria-*` on the wrong element type

## FORBIDDEN

| Pattern | Why |
|---|---|
| `<div onClick>` for an action | Not keyboard-reachable, no role |
| `<a>` without `href` | Not keyboard-reachable, no link semantics |
| `outline: none` with no `:focus-visible` style | Invisible focus = unusable |
| `aria-label` on a `<div>` that should be a `<button>` | Cargo-cult ARIA — fix the element |
| Color-only error indication | Colorblind users can't see |
| `role="button"` on a `<button>` | Redundant; native role wins |
| Placeholder as label | Disappears on input, fails contrast |
| Auto-playing video/audio with sound | WCAG 1.4.2 |
| Drag-only interactions | WCAG 2.2 §2.5.7 — provide buttons |
| Modal that traps tab AND has unreachable close button | Keyboard dead-end |

## See Also

- `ui-ux-audit` — broader UX audit including responsive
- `playwright-automation` — where the axe tests live
- `react-patterns` — Radix / React Aria preferred over custom widgets
- WCAG 2.2 quick-reference: https://www.w3.org/WAI/WCAG22/quickref/
- WAI-ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
