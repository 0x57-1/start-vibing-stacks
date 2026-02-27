# Tailwind Patterns — Utility-First CSS

**ALWAYS invoke when writing Tailwind CSS classes.**

## Mobile-First Breakpoints

```
sm: 640px → md: 768px → lg: 1024px → xl: 1280px → 2xl: 1536px
```

```tsx
<div className="w-full md:w-1/2 lg:w-1/3 xl:w-1/4">
  {/* Mobile: full → Tablet: half → Desktop: third → Large: quarter */}
</div>
```

## Layout Patterns

### Flexbox
```tsx
// Center
<div className="flex items-center justify-center h-screen" />

// Responsive direction
<div className="flex flex-col md:flex-row gap-4" />
```

### Grid
```tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" />

// Auto-fit
<div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4" />
```

## Dark Mode

```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  <p className="text-gray-600 dark:text-gray-300">Adapts to theme</p>
</div>
```

## Component Patterns

### Card
```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
```

### Button
```tsx
<button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
```

### Input
```tsx
<input className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
```

## Animations

```tsx
<Loader className="h-5 w-5 animate-spin" />           // Spinner
<div className="h-4 w-24 bg-gray-200 animate-pulse" /> // Skeleton
```

### Custom (tailwind.config.js)
```js
animation: {
  'fade-in': 'fadeIn 0.3s ease-in-out',
  'slide-up': 'slideUp 0.3s ease-out',
},
keyframes: {
  fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
  slideUp: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
}
```

## Show/Hide Responsive

```tsx
<div className="hidden lg:block">Desktop only</div>
<div className="block lg:hidden">Mobile only</div>
<span className="sr-only">Screen reader only</span>
```

## FORBIDDEN

1. **`!important`** — fix specificity properly
2. **Arbitrary values when utilities exist** — use the scale
3. **Mixing raw CSS with Tailwind** — stick to utilities
4. **Inconsistent spacing** — follow the 4px scale (p-1=4px, p-2=8px, p-4=16px)
