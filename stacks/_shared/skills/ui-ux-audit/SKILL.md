---
name: ui-ux-audit
version: 1.0.0
---

# UI/UX Audit

**ALWAYS invoke BEFORE implementing any UI feature.**

## Workflow

```
1. IDENTIFY → What type of UI? Mobile-first?
        ↓
2. RESEARCH → 3-5 competitors, screenshots
        ↓
3. DEFINE PATTERN → Common patterns, where to differentiate
        ↓
4. IMPLEMENT → Follow accessibility + responsiveness checklists
        ↓
5. VALIDATE → WCAG, touch targets, responsive
```

## Accessibility Checklist (WCAG 2.1)

- [ ] Color contrast ratio ≥ 4.5:1 (text), ≥ 3:1 (large text)
- [ ] All interactive elements have focus styles
- [ ] All images have `alt` text
- [ ] Forms have labels (not just placeholders)
- [ ] Touch targets ≥ 44×44px
- [ ] Keyboard navigable (Tab, Enter, Escape)
- [ ] Screen reader friendly (aria-labels, roles)
- [ ] No content conveyed by color alone

## Responsiveness Checklist

- [ ] Mobile-first approach (min-width breakpoints)
- [ ] Tested at: 320px, 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll at any breakpoint
- [ ] Typography scales properly
- [ ] Images responsive (`max-width: 100%`)
- [ ] Touch-friendly on mobile (no hover-only interactions)

## Design Consistency

- [ ] Using project's design system / component library
- [ ] Consistent spacing (Tailwind scale)
- [ ] Consistent colors (theme tokens)
- [ ] Consistent typography (font sizes, weights)
- [ ] Loading states for all async content
- [ ] Error states for all fallible operations

## Rules

1. **RESEARCH COMPETITORS** — before implementing any UI
2. **MOBILE-FIRST** — always
3. **ACCESSIBILITY IS NOT OPTIONAL** — WCAG 2.1 minimum
4. **DOCUMENT DECISIONS** — why this pattern was chosen
