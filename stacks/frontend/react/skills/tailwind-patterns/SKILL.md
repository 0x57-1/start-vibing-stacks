---
name: tailwind-patterns
version: 2.0.0
description: "Tailwind CSS v4 (stable Jan 22 2025) CSS-first design system with the Rust-based Oxide engine — 3.78× faster full builds, 8.8× faster incremental, 100× faster on no-CSS-change runs. CSS-first config via `@theme` directive (no `tailwind.config.js`), automatic content detection, native container queries (`@container` + `@md:`), OKLCH color space (perceptual uniformity), modern CSS features (cascade layers, `@property`, `color-mix()`), `@import \"tailwindcss\"` single line. Covers the v3 → v4 migration, semantic-token architecture, mobile-first + container-query responsive strategy, dark mode via `@theme dark`, and the 4px spacing scale. Invoke whenever writing Tailwind classes, theming a project, or designing responsive layouts."
---

# Tailwind CSS v4 — CSS-First Design System (2026)

**ALWAYS invoke when writing Tailwind classes, theming, or responsive layouts.**

## v4 Status (2026)

- **Tailwind v4.0 stable**: January 22, 2025
- **Oxide engine** (Rust) — full builds **3.78× faster** (378ms → 100ms), incremental rebuilds **8.8× faster** (44ms → 5ms), no-CSS-change rebuilds **100× faster** (35ms → 192µs)
- **No `tailwind.config.js`** — config lives in CSS via `@theme`
- **Automatic content detection** — no `content: [...]` paths to maintain
- **Native container queries** — no plugin
- **OKLCH** color space everywhere (perceptual uniformity, smoother gradients)
- Built-in support for cascade layers, `@property`, `color-mix()`, modern CSS

## v3 → v4 cheatsheet

| v3 (legacy) | v4 (current) |
|---|---|
| `tailwind.config.js` (JS) | `@theme { … }` block (CSS) |
| `@tailwind base/components/utilities` | `@import "tailwindcss"` (single line) |
| `content: ["./src/**/*.tsx"]` | Auto-detected (no setup) |
| Colors in JS object | CSS variables (`--color-primary`) |
| HSL or hex tokens | **OKLCH** (recommended) |
| `@tailwindcss/container-queries` plugin | Native (`@container`, `@md:flex-row`) |
| `dark:` only | `dark:` **and** `@theme dark { … }` for token switching |
| `@apply` for everything | React components + tokens; reserve `@apply` for legacy CSS |

Migration is non-breaking for existing v3 codebases — both can coexist. Run `npx @tailwindcss/upgrade@latest` to automate the bulk.

## Setup (v4)

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  /* ─── Semantic Colors (OKLCH for perceptual uniformity) ─── */
  --color-primary: oklch(0.55 0.15 250);
  --color-primary-foreground: oklch(0.98 0 0);
  --color-secondary: oklch(0.75 0.05 250);
  --color-secondary-foreground: oklch(0.15 0 0);
  --color-destructive: oklch(0.55 0.2 25);
  --color-destructive-foreground: oklch(0.98 0 0);

  --color-background: oklch(0.99 0 0);
  --color-foreground: oklch(0.15 0 0);
  --color-muted: oklch(0.95 0.01 250);
  --color-muted-foreground: oklch(0.45 0.02 250);
  --color-border: oklch(0.90 0.01 250);
  --color-ring: oklch(0.55 0.15 250);

  --color-surface: oklch(0.98 0 0);
  --color-surface-raised: oklch(1 0 0);

  /* ─── Typography ─── */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* ─── Spacing ─── */
  --spacing-page: 1rem;

  /* ─── Border Radius ─── */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;

  /* ─── Shadows ─── */
  --shadow-sm: 0 1px 2px oklch(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px oklch(0 0 0 / 0.07);
  --shadow-lg: 0 10px 15px oklch(0 0 0 / 0.1);

  /* ─── Animations ─── */
  --animate-fade-in: fade-in 0.2s ease-out;
  --animate-slide-up: slide-up 0.3s ease-out;
  --animate-slide-down: slide-down 0.3s ease-out;
}

/* ─── Dark Mode Override ─── */
@theme dark {
  --color-background: oklch(0.13 0.01 250);
  --color-foreground: oklch(0.95 0 0);
  --color-surface: oklch(0.17 0.01 250);
  --color-surface-raised: oklch(0.21 0.01 250);
  --color-muted: oklch(0.22 0.02 250);
  --color-muted-foreground: oklch(0.65 0.02 250);
  --color-border: oklch(0.28 0.02 250);
}

/* ─── Keyframes ─── */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slide-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slide-down {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

## Color Token Architecture

```
Layer 1 — Primitive:    oklch(0.55 0.15 250)         (raw values)
Layer 2 — Semantic:     --color-primary               (purpose-based)
Layer 3 — Component:    className="bg-primary"         (usage in JSX)

Usage in Tailwind classes:
  bg-primary text-primary-foreground
  bg-destructive text-destructive-foreground
  bg-muted text-muted-foreground
  bg-surface border-border
```

## Mobile-First Responsive

```
Breakpoints (min-width):
  (none) → 0px      Mobile base
  sm:    → 640px    Large phone
  md:    → 768px    Tablet
  lg:    → 1024px   Laptop
  xl:    → 1280px   Desktop
  2xl:   → 1536px   Large desktop
```

```tsx
{/* Mobile: stack → Tablet: 2 cols → Desktop: 3 cols */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

{/* Mobile: full width → Desktop: sidebar layout */}
<div className="flex flex-col lg:flex-row gap-6">
  <aside className="w-full lg:w-64 shrink-0">Sidebar</aside>
  <main className="flex-1">Content</main>
</div>
```

## Container Queries (v4 Native)

```tsx
{/* Parent defines container */}
<div className="@container">
  {/* Children respond to PARENT width, not viewport */}
  <div className="flex flex-col @md:flex-row @lg:grid @lg:grid-cols-3 gap-4">
    <Card />
  </div>
</div>

{/* Named containers for specificity */}
<div className="@container/card">
  <h2 className="text-sm @md/card:text-lg">Title</h2>
</div>
```

**Rule:** Use container queries for **reusable components** (cards, widgets). Use viewport breakpoints for **page-level layouts**.

## Component Patterns

### Button

```tsx
const buttonVariants = {
  base: "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  variant: {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-border bg-transparent hover:bg-muted",
    ghost: "hover:bg-muted",
  },
  size: {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  },
};
```

### Card

```tsx
<div className="bg-surface-raised rounded-lg border border-border shadow-sm p-6 hover:shadow-md transition-shadow">
  <h3 className="text-lg font-semibold text-foreground">Title</h3>
  <p className="mt-2 text-muted-foreground">Description</p>
</div>
```

### Input

```tsx
<input className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors" />
```

### Table (responsive)

```tsx
{/* Mobile: card layout → Desktop: table */}
<div className="hidden md:block">
  <table className="w-full text-sm">
    <thead className="border-b border-border">
      <tr className="text-left text-muted-foreground">
        <th className="p-3 font-medium">Name</th>
      </tr>
    </thead>
  </table>
</div>
<div className="md:hidden space-y-3">
  {/* Card layout for mobile */}
</div>
```

## Dark Mode

```tsx
{/* Automatic with semantic tokens */}
<div className="bg-background text-foreground">
  <p className="text-muted-foreground">Always adapts</p>
  <div className="border-border bg-surface">Card</div>
</div>

{/* Toggle button */}
<button onClick={() => document.documentElement.classList.toggle('dark')}>
  Toggle Theme
</button>
```

**Rule:** Use semantic tokens (`bg-background`, `text-foreground`) instead of explicit dark classes. The `@theme dark` block handles everything.

## Show/Hide

```tsx
<div className="hidden lg:block">Desktop only</div>
<div className="lg:hidden">Mobile only</div>
<span className="sr-only">Screen reader only</span>
```

## Auto-fit Grid

```tsx
{/* Cards that auto-wrap based on available space */}
<div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

## Animations

```tsx
<div className="animate-fade-in">Fades in on mount</div>
<div className="animate-slide-up">Slides up on mount</div>
<Loader className="h-5 w-5 animate-spin" />
<div className="h-4 w-24 bg-muted animate-pulse rounded" />  {/* Skeleton */}
```

## Spacing Consistency

```
Use the 4px scale consistently:
  gap-1 = 4px    p-1 = 4px
  gap-2 = 8px    p-2 = 8px
  gap-3 = 12px   p-3 = 12px
  gap-4 = 16px   p-4 = 16px
  gap-6 = 24px   p-6 = 24px
  gap-8 = 32px   p-8 = 32px

Page padding: px-4 md:px-6 lg:px-8
Section gaps: space-y-6 md:space-y-8
Card padding: p-4 md:p-6
```

## Modern CSS — leverage what v4 unlocks

```css
/* color-mix() — derive variants from semantic tokens */
.btn-primary-soft {
  background: color-mix(in oklch, var(--color-primary) 12%, transparent);
}

/* @property — animatable custom properties */
@property --gradient-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

/* Cascade layers — predictable specificity (Tailwind already uses these) */
@layer components {
  .card-hero { /* your custom layer */ }
}
```

## `size-*` utility (use over `w-N h-N`)

```tsx
{/* OK — single utility, less repetition */}
<img className="size-10 rounded-full" />
<button className="size-9 grid place-items-center">

{/* Avoid the duplicate */}
<img className="w-10 h-10 rounded-full" />
```

## FORBIDDEN

| ❌ Don't | ✅ Do |
|---|---|
| `tailwind.config.js` in v4 | `@theme` in CSS |
| `@apply` for everything | React components + token classes |
| `!important` | Fix specificity (or use cascade layers) |
| `style={{ color: 'red' }}` | `text-destructive` |
| Arbitrary values for design tokens (`text-[#2563eb]`) | Define `--color-*` in `@theme` |
| `bg-white dark:bg-gray-900` | `bg-background` (semantic + `@theme dark`) |
| `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| Dynamic class strings (`bg-${color}-500`) | Static complete strings (Oxide can't see derived ones) |
| HSL tokens for new themes | OKLCH (perceptual uniformity, smoother gradients) |
| `w-10 h-10` pairs | `size-10` |
| `forwardRef`-style ref-as-prop indirection | Refs are just props in React 19 |
| `content: [...]` arrays | Auto-detection in v4 |
| Inconsistent spacing | Follow 4px scale |

## See Also

- `react-standards` — STYLES const pattern using these tokens
- `shadcn-ui` — components built on top of Tailwind v4 + OKLCH + `data-slot`
- `preline-ui` — alternative token system on top of Tailwind v4
- `react-ui-patterns` — loading/error/empty states using semantic tokens
- `_shared/skills/ui-ux-audit` — WCAG 2.2 AA contrast checks against semantic tokens
