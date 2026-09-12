---
name: shadcn-ui
version: 2.1.0
description: "shadcn/ui CLI v4 (March 2026) for React 19.3 + Tailwind CSS 4.3. Components updated to remove forwardRef (refs as props in R19), every primitive carries a data-slot attribute for targeted styling, HSL → OKLCH tokens, size-* utility replaces w-h pairs, default style deprecated in favor of new-york. Pair with Tailwind 4.3 scrollbar / `@container-size` utilities. CLI v4: shadcn/skills, --preset, --dry-run / --diff / --view, --template scaffolds, --base (Radix vs Base UI), `shadcn info` / `shadcn docs`. Invoke when adding, customising, theming, or scaffolding shadcn components."
---

# shadcn/ui — CLI v4 + React 19.3 + Tailwind 4.3 (2026)

**ALWAYS invoke when adding, customising, theming, or scaffolding shadcn components.**

> shadcn/ui is a copy-paste component system, not an npm dependency — components live **in your repo**, get owned and modified there. The CLI keeps them in sync with the upstream registry without hiding the source.

## What's new in 2026 (CLI v4 — March 2026)

| Change | Impact |
|---|---|
| **Tailwind 4.3 + React 19.3 first-class** | All components updated; v3+R18 still works (non-breaking). Use `scrollbar-*` / `@container-size` from the host CSS, not ad-hoc component CSS |
| **`forwardRef` removed** | React 19 treats `ref` as a prop — components are simpler |
| **`data-slot="…"` on every primitive** | Style any sub-element from outside without overriding source |
| **HSL → OKLCH** colour tokens | Smoother gradients, perceptual uniformity |
| **`size-*` utility** | `size-9` instead of `w-9 h-9` |
| **`default` style deprecated** | Use **`new-york`** (the new default in `components.json`) |
| **`shadcn/skills`** | AI-agent registry context — agents discover components via the CLI |
| **`--preset` flag** | Pack colours/theme/fonts/radius into a shareable code string |
| **`--dry-run` / `--diff` / `--view`** | Inspect registry changes before writing files |
| **`--template`** | Scaffolds for Next.js, Vite, Laravel, React Router, Astro, TanStack Start |
| **`--base`** | Choose between **Radix** and **Base UI** primitives |
| **`shadcn info` / `shadcn docs`** | Context commands for agents and humans |

## Initialisation

```bash
# Pick a template (CLI v4 — March 2026)
npx shadcn@latest init --template next-app
# Other templates: vite, laravel, react-router, astro, tanstack-start

# Add components — non-interactive, idempotent
npx shadcn@latest add button card dialog input form

# Inspect before writing (new in v4)
npx shadcn@latest add button --dry-run --diff

# Use Base UI primitives instead of Radix
npx shadcn@latest add dialog --base baseui
```

## `components.json` (Tailwind v4 shape)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

> For Tailwind v4 the `tailwind.config` field stays empty — there's no JS config file in v4.

## Theming with OKLCH

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme inline {
  /* Light theme — OKLCH (replaces v1 HSL tokens) */
  --color-background:        oklch(1.000 0 0);
  --color-foreground:        oklch(0.145 0 0);

  --color-primary:           oklch(0.205 0 0);
  --color-primary-foreground: oklch(0.985 0 0);

  --color-secondary:         oklch(0.970 0 0);
  --color-secondary-foreground: oklch(0.205 0 0);

  --color-muted:             oklch(0.970 0 0);
  --color-muted-foreground:  oklch(0.556 0 0);

  --color-destructive:       oklch(0.577 0.245 27.325);
  --color-destructive-foreground: oklch(0.985 0 0);

  --color-border:            oklch(0.922 0 0);
  --color-ring:              oklch(0.708 0 0);

  --radius:                  0.625rem;  /* slightly larger than v1's 0.5rem */
}

@theme dark inline {
  --color-background:        oklch(0.145 0 0);
  --color-foreground:        oklch(0.985 0 0);
  --color-primary:           oklch(0.985 0 0);
  --color-primary-foreground: oklch(0.205 0 0);
  /* … rest of dark overrides */
}
```

OKLCH ranges (rough guide): lightness 0–1, chroma 0–~0.4, hue 0–360°. Pick lightness on the same axis for siblings — gradients stay perceptually smooth.

## Components without `forwardRef`

```tsx
// React 19 — refs are props, no forwardRef needed
import * as React from "react";
import { cn } from "@/lib/utils";

function Button({
  ref,                                   // ← just a normal prop
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: React.Ref<HTMLButtonElement>;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}) {
  return (
    <button
      ref={ref}
      data-slot="button"                 // ← every primitive carries data-slot
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button };
```

`forwardRef` still works — but the new components ship without it.

## `data-slot` — style sub-parts from outside

```tsx
// Style the icon inside a Button without touching the Button source
<Button className="[&_[data-slot=icon]]:size-4 [&_[data-slot=icon]]:text-primary">
  <CheckIcon data-slot="icon" />
  Confirm
</Button>

// Style the trigger of a Dialog from a parent
<Dialog>
  <DialogTrigger className="[&[data-slot=trigger]]:rounded-full" asChild>
    <Button>Open</Button>
  </DialogTrigger>
</Dialog>
```

This replaces the old "expose every internal class through props" pattern — the contract is the slot name, not the className.

## Customisation — extend, don't fork

```tsx
// CORRECT — extend via className + variants
<Button variant="outline" size="lg" className="rounded-full">
  Custom
</Button>

// CORRECT — wrap a shadcn primitive when you need a project-specific variant
function PageHeading({ children, className, ...rest }: ComponentProps<"h1">) {
  return (
    <h1 data-slot="page-heading" className={cn("text-2xl font-semibold tracking-tight", className)} {...rest}>
      {children}
    </h1>
  );
}

// WRONG — modifying the shadcn source for one-off styles
// → upgrade path breaks; intent gets lost
```

## Composition

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
    </DialogHeader>
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Update your information.</CardDescription>
      </CardHeader>
      <CardContent>{/* form fields */}</CardContent>
    </Card>
  </DialogContent>
</Dialog>
```

## Forms — shadcn Form + React Hook Form + Zod 4

```tsx
"use client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Schema = z.object({
  email: z.email("Enter a valid email"),                  // Zod 4 top-level
  password: z.string().min(8, "At least 8 characters"),
});

type FormValues = z.infer<typeof Schema>;

export function LoginForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: FormValues) { /* call your API */ }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl><Input type="email" autoComplete="email" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}/>
        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl><Input type="password" autoComplete="current-password" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}/>
        <Button type="submit" className="w-full">Sign in</Button>
      </form>
    </Form>
  );
}
```

## Blocks — copy-paste full UI sections

```bash
# List blocks (auth, dashboards, charts, sidebars, calendars, …)
npx shadcn@latest add --list-blocks

# Add a specific block
npx shadcn@latest add login-04
```

Blocks are full sections (login pages, dashboard shells, billing screens) registered as `registry:block` in the catalog. They land in `components/` and you own them after that.

## Custom registries

```json
// registry-item.json — share components across your team / org
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "data-table",
  "type": "registry:component",
  "dependencies": ["@tanstack/react-table"],
  "registryDependencies": ["button", "input"],
  "files": [{ "path": "components/data-table.tsx", "type": "registry:component" }]
}
```

Host the JSON anywhere (GitHub Pages, Vercel) and consume:

```bash
npx shadcn@latest add https://your-registry.com/r/data-table.json
```

## CLI v4 — workflow commands

```bash
shadcn info                        # show project + dependency context (great for AI agents)
shadcn docs <component>            # open docs for a specific component
shadcn add button --dry-run --view # show what would change, don't write
shadcn add button --diff           # show diff against current files
shadcn add --preset <hash>         # bootstrap an entire design-system from a preset hash
```

## FORBIDDEN

| ❌ Don't | Why |
|---|---|
| Modify component source for one-off styles | Use `className` + `variant` + slots |
| Skip `init` | The CLI needs `components.json` for paths/aliases |
| Stay on the deprecated `default` style | Use `new-york` (new CLI default) |
| Use `forwardRef` in new R19 components | Refs are plain props now |
| Add `w-10 h-10` instead of `size-10` | Tailwind v4 `size-*` is the recommended utility |
| HSL tokens for new themes | OKLCH gives smoother gradients & a11y-friendly mixing |
| Add a component then `npm install` it as a package | shadcn lives **in your repo**, never as a runtime dependency |
| Break built-in a11y (aria, focus, escape handlers) | Radix/Base UI primitives wire it correctly out of the box |

## See Also

- `tailwind-patterns` v2 — `@theme`, container queries, OKLCH
- `react-patterns` v2 — refs as props in R19, `useActionState`, `useOptimistic`
- `react-standards` v2 — STYLES/LABELS const pattern that pairs with shadcn slots
- `zod-validation` v2 — Zod 4 + `@hookform/resolvers/zod`
- `react-ui-patterns` v2 — loading/error/empty states using shadcn primitives
- `_shared/skills/ui-ux-audit` v2 — WCAG 2.2 AA on shadcn components
