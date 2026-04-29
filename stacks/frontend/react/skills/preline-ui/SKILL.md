---
name: preline-ui
version: 1.0.0
---

# Preline UI — Component & Theme System for TailwindCSS 4

**ALWAYS invoke when using Preline components, creating themes, or customizing design tokens.**

## What is Preline

Preline is a **semantic token-based design system** built on TailwindCSS. It provides:
- 220+ CSS tokens for full UI consistency
- Pre-built components (navbar, sidebar, card, dropdown, overlay, etc.)
- Theme generator for custom color schemes
- Light + dark mode via `data-theme` + `.dark`

## Installation

### Step 1: Install

```bash
npm install preline @tailwindcss/forms
```

### Step 2: CSS Config

```css
/* src/app/globals.css (Next.js) or styles/globals.css */
@import "tailwindcss";

/* Preline — MUST be in this order */
@source "./node_modules/preline/dist/*.js";    /* JS component scanning */
@import "./node_modules/preline/variants.css";  /* CSS variants */
@plugin "@tailwindcss/forms";                   /* Forms plugin */
@import "./node_modules/preline/themes/theme.css"; /* Base theme */
```

### Step 3: Init Preline on Route Changes (MANDATORY)

```tsx
// src/components/PrelineInit.tsx
'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function PrelineInit() {
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(() => {
      import('preline/preline').then(({ HSStaticMethods }) => {
        HSStaticMethods.autoInit();
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}

// Add to root layout:
// <PrelineInit />
```

**Rule:** Without `HSStaticMethods.autoInit()`, dropdowns, modals, and accordions will NOT work after client-side navigation.

## Templates & Components (840+ free)

### Where to Find

| Source | URL | What |
|---|---|---|
| **Docs (components)** | https://preline.co/docs | Buttons, modals, forms, tables, navs |
| **Examples (blocks)** | https://preline.co/examples.html | 220+ UI blocks (hero, testimonials, pricing, etc.) |
| **Pro templates** | https://preline.co/pro/templates.html | 21 dashboard/app templates (paid) |
| **GitHub** | https://github.com/htmlstreamofficial/preline | Source + examples |

### How to Use Templates

1. Browse https://preline.co/examples.html
2. Click a block → copy the HTML/JSX
3. Adapt to React:
   - Replace `<a href>` with Next.js `<Link href>` (from `next/link`)
   - Replace `class=` with `className=`
   - Add Preline `data-*` attributes for interactive components
   - Pass data via props or fetch with TanStack Query / Server Components

### Example: Copy a Hero Block

```tsx
// From preline.co/examples.html → Hero sections
// Adapt HTML to React component:
export default function HeroSection() {
  return (
    <div className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-foreground">
            Build your next idea
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Preline UI is an open-source set of prebuilt UI components.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/register"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover font-medium transition-colors">
              Get Started
            </Link>
            <Link href="/docs"
              className="px-6 py-3 bg-layer border border-layer-line text-layer-foreground rounded-lg hover:bg-layer-hover font-medium transition-colors">
              Documentation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Key Component Categories (free)

| Category | Count | Examples |
|---|---|---|
| **Navigation** | 20+ | Navbar, sidebar, breadcrumb, pagination |
| **Hero** | 11 | Landing page headers |
| **Cards** | 15+ | Product, blog, profile, pricing |
| **Forms** | 20+ | Login, register, contact, checkout |
| **Tables** | 10+ | Sortable, paginated, striped |
| **Modals** | 8+ | Confirmation, form, full-screen |
| **Dropdowns** | 10+ | Menu, select, multi-select |
| **Testimonials** | 10+ | Quotes, carousel, grid |
| **Pricing** | 8+ | Monthly/yearly toggle, comparison |
| **Dashboard** | 5+ | Stats, charts, activity feed |

## Token Architecture

```
Layer 1 — Tailwind primitives:    var(--color-blue-600)
Layer 2 — Preline semantic:       --primary: var(--color-blue-600)
Layer 3 — Component tokens:       --navbar-nav-hover: var(--color-gray-100)
Layer 4 — Usage in HTML:          className="bg-primary text-primary-foreground"
```

### Core Token Groups

| Group | Example Tokens | Purpose |
|---|---|---|
| **Background** | `--background`, `--background-1`, `--background-2` | App surfaces |
| **Foreground** | `--foreground`, `--foreground-inverse` | Text colors |
| **Primary** | `--primary`, `--primary-hover`, `--primary-foreground`, `--primary-50`→`950` | Brand/action color |
| **Secondary** | `--secondary`, `--secondary-hover`, `--secondary-foreground` | Secondary emphasis |
| **Muted** | `--muted`, `--muted-foreground`, `--muted-foreground-1`, `--muted-foreground-2` | Subdued elements |
| **Destructive** | `--destructive`, `--destructive-hover`, `--destructive-foreground` | Danger actions |
| **Border** | `--border`, `--border-line-1`→`8` | Border scale (light→dark) |
| **Surface** | `--surface`, `--surface-1`→`5`, `--surface-foreground` | Elevated layers |
| **Layer** | `--layer`, `--layer-hover`, `--layer-foreground` | Stacked elements |

### Component Token Groups

| Component | Tokens | Notes |
|---|---|---|
| **Navbar** | `--navbar`, `--navbar-line`, `--navbar-nav-*` | 3 variants (base, `-1`, `-2`) |
| **Sidebar** | `--sidebar`, `--sidebar-line`, `--sidebar-nav-*` | 3 variants (base, `-1`, `-2`) |
| **Card** | `--card`, `--card-line`, `--card-divider`, `--card-header`, `--card-footer` | |
| **Dropdown** | `--dropdown`, `--dropdown-item-*` | hover, focus, active states |
| **Select** | `--select`, `--select-item-*` | Same state pattern |
| **Overlay** | `--overlay`, `--overlay-line`, `--overlay-header`, `--overlay-footer` | Modals |
| **Tooltip** | `--tooltip`, `--tooltip-foreground`, `--tooltip-line` | |
| **Popover** | `--popover`, `--popover-line` | |
| **Scrollbar** | `--scrollbar-track`, `--scrollbar-thumb` | + inverse variants |

## Creating Custom Themes

### Theme File Structure (MUST follow order)

```css
/* 1. Import base theme */
@import "./theme.css";

/* 2. Theme scoping block — custom palettes ONLY */
@theme theme-brand inline {
  --color-brand-50: oklch(98% 0.003 250);
  --color-brand-100: oklch(95% 0.01 250);
  --color-brand-200: oklch(88% 0.03 250);
  --color-brand-300: oklch(78% 0.06 250);
  --color-brand-400: oklch(68% 0.10 250);
  --color-brand-500: oklch(58% 0.14 250);
  --color-brand-600: oklch(50% 0.15 250);
  --color-brand-700: oklch(42% 0.13 250);
  --color-brand-800: oklch(35% 0.10 250);
  --color-brand-900: oklch(28% 0.08 250);
  --color-brand-950: oklch(20% 0.05 250);
}

/* 3. Light mode — semantic token overrides */
:root[data-theme="theme-brand"],
[data-theme="theme-brand"] {
  --background: var(--color-white);
  --foreground: var(--color-gray-800);

  --primary: var(--color-brand-600);
  --primary-foreground: var(--color-white);
  --primary-hover: var(--color-brand-700);
  --primary-focus: var(--color-brand-700);
  --primary-active: var(--color-brand-700);

  /* ... all 220+ tokens as needed */
}

/* 4. Dark mode */
[data-theme="theme-brand"].dark {
  --background: var(--color-neutral-800);
  --foreground: var(--color-neutral-200);

  --primary: var(--color-brand-500);
  --primary-foreground: var(--color-white);
  --primary-hover: var(--color-brand-600);

  /* ... dark overrides */
}
```

### Activation

```html
<html data-theme="theme-brand">
<!-- Or with dark mode: -->
<html data-theme="theme-brand" class="dark">
```

```tsx
// React theme switcher
function ThemeToggle() {
  const [dark, setDark] = useState(false);
  return (
    <button onClick={() => {
      document.documentElement.classList.toggle('dark');
      setDark(!dark);
    }}>
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
```

## Using Components with React

### Navbar

```tsx
<nav className="bg-navbar border-b border-navbar-line">
  <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
    <Link href="/" className="text-foreground font-bold text-lg">Brand</Link>
    <div className="flex items-center gap-1">
      <Link href="/dashboard"
        className="px-3 py-2 rounded-lg text-navbar-nav-foreground hover:bg-navbar-nav-hover transition-colors">
        Dashboard
      </Link>
      <Link href="/leads"
        className="px-3 py-2 rounded-lg text-navbar-nav-foreground hover:bg-navbar-nav-hover transition-colors">
        Leads
      </Link>
    </div>
  </div>
</nav>
```

### Card

```tsx
<div className="bg-card border border-card-line rounded-xl overflow-hidden">
  <div className="bg-card-header px-6 py-4 border-b border-card-divider">
    <h3 className="text-foreground font-semibold">Title</h3>
  </div>
  <div className="px-6 py-4">
    <p className="text-muted-foreground">Content</p>
  </div>
  <div className="bg-card-footer px-6 py-3 border-t border-card-divider">
    <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors">
      Action
    </button>
  </div>
</div>
```

### Sidebar

```tsx
<aside className="w-64 bg-sidebar border-r border-sidebar-line h-screen">
  <nav className="p-4 space-y-1">
    {navItems.map(item => (
      <Link key={item.href} href={item.href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
          ${isActive(item.href)
            ? 'bg-sidebar-nav-active text-primary font-medium'
            : 'text-sidebar-nav-foreground hover:bg-sidebar-nav-hover'}`}>
        {item.icon}
        {item.label}
      </Link>
    ))}
  </nav>
</aside>
```

### Dropdown (with Preline JS)

```tsx
<div className="hs-dropdown relative">
  <button className="hs-dropdown-toggle px-4 py-2 bg-layer border border-layer-line rounded-lg text-layer-foreground hover:bg-layer-hover">
    Options ▾
  </button>
  <div className="hs-dropdown-menu hidden bg-dropdown border border-dropdown-line rounded-lg shadow-lg mt-1 p-1 min-w-48">
    <button className="w-full text-left px-3 py-2 rounded-md text-dropdown-item-foreground hover:bg-dropdown-item-hover">
      Edit
    </button>
    <div className="border-t border-dropdown-divider my-1" />
    <button className="w-full text-left px-3 py-2 rounded-md text-destructive hover:bg-dropdown-item-hover">
      Delete
    </button>
  </div>
</div>
```

## Theme Generator (CLI)

```bash
# Generate theme from config
npx preline-theme-generator /tmp/config.json ./src/styles/themes/brand.css

# Config format:
{
  "name": "brand",
  "hue": 250,
  "style": "professional",
  "useCustomDarkGray": true,
  "tailwindGray": "neutral"
}
```

## Chart Tokens (Apexcharts)

```css
/* Charts require HEX for gradients — no oklch! */
--chart-colors-primary-hex: #2563eb;
--chart-colors-chart-1-hex: #8b5cf6;
--chart-colors-chart-2-hex: #06b6d4;
```

## FORBIDDEN

| ❌ Don't | ✅ Do |
|---|---|
| Modify `theme.css` (base) | Create separate theme file |
| Put tokens inside `@theme` block | Tokens in selector blocks only |
| Use raw colors (`bg-blue-500`) | Use semantic tokens (`bg-primary`) |
| `oklch()` in chart `-hex` tokens | Use hex format for charts |
| Force HTML class changes | Theme activation via `data-theme` only |
| Invent token names | Follow Preline's naming system |
| `@apply` for component styles | React components with token classes |
| Skip `HSStaticMethods.autoInit()` | Always re-init after client-side navigation |
