# shadcn/ui — Component Library Patterns

**ALWAYS invoke when adding or modifying shadcn/ui components.**

## Installation

```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog input
```

## Theming

```css
/* globals.css — CSS variables for theming */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --border: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
  }
}
```

## Component Customization

```tsx
// CORRECT — extend via className + variants
import { Button } from '@/components/ui/button';
<Button variant="outline" size="lg" className="rounded-full">Custom</Button>

// WRONG — modify component source for one-off styles
```

## Composition Pattern

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Compose primitives, don't create monolithic components
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <Card><CardContent>...</CardContent></Card>
  </DialogContent>
</Dialog>
```

## Form Pattern (with Zod)

```tsx
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

<Form {...form}>
  <FormField control={form.control} name="email" render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl><Input {...field} /></FormControl>
      <FormMessage />
    </FormItem>
  )} />
</Form>
```

## FORBIDDEN

1. **Modifying component source for one-off needs** — use className/variants
2. **Installing without init** — always `npx shadcn@latest init` first
3. **Ignoring dark mode** — all components must work in both themes
4. **Skipping accessibility** — shadcn components have built-in a11y, don't break it
