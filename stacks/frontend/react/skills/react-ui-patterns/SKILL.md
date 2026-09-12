---
name: react-ui-patterns
version: 2.1.0
description: "React 19.3 + TanStack Query v5 UI patterns: loading/error/empty hierarchy, `<Activity>` for keep-alive panels, `<ViewTransition>` only around Transition updates, ErrorState/EmptyState/LoadingState, button pending states, RHF + Zod 4, `useOptimistic` vs TanStack `onMutate`, Suspense + useSuspenseQuery, axios `signal` threading. TanStack v5: isPending vs isFetching vs isLoading. Invoke when handling any async UI state, form, mutation, or user feedback."
---

# React UI Patterns — Loading, Errors, Empty States & Forms (R19 + TanStack v5)

**ALWAYS invoke when handling async UI states, forms, or user feedback.**

## Stack snapshot (2026)

| Concern | Pick |
|---|---|
| Server cache + refetch + dedup | **TanStack Query v5** (`useQuery`, `useMutation`, `useSuspenseQuery`) |
| Form state + validation | **react-hook-form** + **`@hookform/resolvers/zod`** (Zod 4) |
| Optimistic UI for **submit-then-confirm** flows | React 19 **`useOptimistic`** (no cache surgery needed) |
| Optimistic UI when you must mutate the cache | TanStack `onMutate` + `setQueryData` rollback |
| Suspense / streaming data | `useSuspenseQuery` + `<Suspense>` |
| Keep-alive hidden panels (tabs / drawers) | React 19.2+ **`<Activity mode>`** — not `{open && <Panel />}` |
| Enter/exit motion | React 19.3 **`<ViewTransition>`** inside `startTransition` |
| Browser-only widget | `use(browser())` + nearest Suspense fallback |
| Client HTTP | Shared **axios** instance + `signal` — not raw `fetch` |
| Toasts | **Sonner** (`toast.success`, `toast.error`) |

> **TanStack Query v5 renamed `loading` → `pending`.** Use `isPending` (no data yet, no error), `isFetching` (any fetch in flight, including refetch), `isLoading` (legacy alias for `isPending && isFetching`). The render-tree decision below is unchanged.

## Core Principles

1. **Never show stale UI** — loading only when actually loading
2. **Always surface errors** — users must KNOW when something fails
3. **Optimistic updates** — make UI feel instant
4. **Progressive disclosure** — show content as it becomes available
5. **Disable during operations** — prevent double-submit

## Loading State Decision Tree

```
Error?
  → Yes: Show ErrorState with retry
  → No ↓

Loading AND no data?
  → Yes: Show Skeleton or Spinner
  → No ↓

Has data?
  → Yes + items: Render data
  → Yes + empty: Show EmptyState
  → No: Show Spinner (fallback)
```

```tsx
// ✅ CORRECT — TanStack v5: isPending = no data yet
const { data, isPending, error, refetch } = useQuery({
  queryKey: ['items'],
  queryFn: ({ signal }) => fetchItems({ signal }),  // thread signal for cancellation
});

if (error)               return <ErrorState error={error} onRetry={refetch} />;
if (isPending)           return <Skeleton />;
if (!data?.items.length) return <EmptyState />;
return <ItemList items={data.items} />;

// ❌ WRONG (v3 idiom) — flashes spinner on refetch when cached data exists
if (isLoading) return <Spinner />;
```

### Suspense alternative

```tsx
// useSuspenseQuery — cleaner when you wrap with <Suspense> + <ErrorBoundary>
function ItemList() {
  const { data } = useSuspenseQuery({
    queryKey: ['items'],
    queryFn: ({ signal }) => fetchItems({ signal }),
  });
  return <ul>{data.items.map(i => <li key={i.id}>{i.title}</li>)}</ul>;
}

<ErrorBoundary fallback={<ErrorState />}>
  <Suspense fallback={<Skeleton />}>
    <ItemList />
  </Suspense>
</ErrorBoundary>
```

### Skeleton vs Spinner

| Use Skeleton | Use Spinner |
|---|---|
| Known content shape (cards, tables, lists) | Unknown shape (modals, inline actions) |
| Initial page load | Button submissions |
| Content placeholders | Small inline operations |

```tsx
// Skeleton component
function CardSkeleton() {
  return (
    <div className="bg-card border border-card-line rounded-xl p-6 animate-pulse">
      <div className="h-4 w-3/4 bg-muted rounded" />
      <div className="mt-3 h-3 w-1/2 bg-muted rounded" />
      <div className="mt-6 h-10 w-full bg-muted rounded" />
    </div>
  );
}

// Skeleton grid
function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }, (_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}
```

## Error Handling Hierarchy

```
Level 1 — Inline error      → Field validation (under input)
Level 2 — Toast notification → Recoverable, user can retry
Level 3 — Error banner      → Page-level, data partially usable
Level 4 — Full error screen → Unrecoverable, needs user action
```

```tsx
// Reusable ErrorState
interface ErrorStateProps {
  error: Error | string;
  onRetry?: () => void;
  title?: string;
}

function ErrorState({ error, onRetry, title }: ErrorStateProps) {
  const message = typeof error === 'string' ? error : error.message;
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title ?? 'Something went wrong'}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md">{message}</p>
      {onRetry && (
        <button onClick={onRetry}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors">
          Try Again
        </button>
      )}
    </div>
  );
}
```

### NEVER Swallow Errors

```tsx
// ✅ CORRECT — error surfaced to user
const mutation = useMutation({
  mutationFn: createItem,
  onSuccess: () => toast.success('Item created!'),
  onError: (error) => {
    console.error('createItem failed:', error);
    toast.error('Failed to create item');
  },
});

// ❌ WRONG — user sees nothing
try { await createItem(data); }
catch (e) { console.log(e); }  // Silent failure!
```

## Empty States

**Every list/collection MUST have an empty state.**

```tsx
// ✅ With empty state
function UserList({ users }: { users: User[] }) {
  if (!users.length) {
    return (
      <EmptyState
        icon={<Users className="h-8 w-8" />}
        title="No users yet"
        description="Invite your first team member"
        action={{ label: 'Invite User', onClick: () => window.location.assign('/users/invite') }}
      />
    );
  }
  return <div className="space-y-2">{users.map(u => <UserCard key={u.id} user={u} />)}</div>;
}

// Reusable EmptyState
function EmptyState({ icon, title, description, action }: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-muted-foreground mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      {action && (
        <button onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors">
          {action.label}
        </button>
      )}
    </div>
  );
}
```

## Button States

```tsx
// ✅ CORRECT — disabled + loading indicator
<button
  onClick={handleSubmit}
  disabled={!isValid || isSubmitting}
  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
>
  {isSubmitting ? (
    <span className="flex items-center gap-2">
      <Loader className="h-4 w-4 animate-spin" />
      Saving...
    </span>
  ) : 'Save'}
</button>

// ❌ WRONG — user can click multiple times
<button onClick={handleSubmit}>
  {isSubmitting ? 'Submitting...' : 'Submit'}
</button>
```

## Form Pattern (React Hook Form + Zod)

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';

const CreateUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
});

type CreateUserForm = z.infer<typeof CreateUserSchema>;

export default function CreateUser() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(CreateUserSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: CreateUserForm) =>
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to create user');
        return res.json();
      }),
    onSuccess: () => {
      toast.success('User created!');
      reset();
    },
    onError: () => toast.error('Failed to create user'),
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Name</label>
        <input
          {...register('name')}
          className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
        />
        {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Email</label>
        <input
          type="email"
          {...register('email')}
          className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
        />
        {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
      >
        {mutation.isPending ? (
          <span className="flex items-center gap-2">
            <Loader className="h-4 w-4 animate-spin" /> Creating...
          </span>
        ) : 'Create User'}
      </button>
    </form>
  );
}
```

## Optimistic Updates — pick by use case

### Option A — React 19 `useOptimistic` (simpler, NEW DEFAULT for forms)

When the optimistic update is **local to a component** and tied to a form Action, this is the cleanest option — no manual rollback, no cache surgery.

```tsx
"use client";
import { useOptimistic } from "react";

function TodoList({ todos, addTodo }: { todos: Todo[]; addTodo: (t: Todo) => Promise<void> }) {
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (current, newTodo: Todo) => [...current, newTodo],
  );

  async function action(formData: FormData) {
    const todo = { id: crypto.randomUUID(), title: String(formData.get("title")), done: false };
    addOptimistic(todo);              // instant
    await addTodo(todo);               // server confirms — on error React reverts on next render
  }

  return (
    <>
      <form action={action}>
        <input name="title" required />
        <button>Add</button>
      </form>
      <ul>{optimisticTodos.map(t => <li key={t.id}>{t.title}</li>)}</ul>
    </>
  );
}
```

### Option B — TanStack Query `onMutate` + cache rollback

Reach for this when the mutation has to update a **shared server cache** that other components also read (toggling a favourite that appears in three lists, for instance).

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";

function ToggleFavorite({ item }: { item: Item }) {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      fetch(`/api/items/${item.id}/favorite`, { method: "POST" }).then(r => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["items"] });
      const previous = qc.getQueryData<Item[]>(["items"]);
      qc.setQueryData<Item[]>(["items"], (old) =>
        old?.map(i => i.id === item.id ? { ...i, isFavorite: !i.isFavorite } : i),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      qc.setQueryData(["items"], context?.previous);    // rollback
      toast.error("Failed to update");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["items"] });    // truth from server
    },
  });

  return (
    <button onClick={() => mutation.mutate()} className="text-xl" aria-label="Toggle favorite">
      {item.isFavorite ? "❤️" : "🤍"}
    </button>
  );
}
```

> Don't combine both for the same flow — `useOptimistic` for forms, TanStack `onMutate` for cross-cache updates. Mixing them creates invisible double rollbacks.

## Checklist — Before Shipping Any UI Component

- [ ] Error state handled and shown to user
- [ ] Loading state only when no data exists (no flash on refetch)
- [ ] Empty state for every collection/list
- [ ] Buttons disabled during async operations
- [ ] Buttons show loading indicator
- [ ] Form errors shown inline under fields
- [ ] Mutations have onError with user feedback
- [ ] Skeleton matches content layout shape

## FORBIDDEN

| Anti-pattern | Fix |
|---|---|
| `if (isLoading) return <Spinner />` (v3 idiom) | TanStack v5: check `isPending` (no data yet), keep cached data visible during refetch |
| Silent `catch (e) { console.log(e) }` | Always surface via toast / inline error |
| List without an empty state | Every collection needs `<EmptyState />` |
| Clickable button while a mutation is pending | `disabled={mutation.isPending}` + spinner |
| `console.log`-only errors | User must see feedback (toast / banner / inline) |
| `useOptimistic` AND TanStack `onMutate` for the same flow | Pick one — mixing produces double rollbacks |
| `mutationFn` that doesn't thread the `signal` | `({ signal }) => api.get(url, { signal })` so unmount cancels in-flight |
| `forwardRef` wrappers around shadcn primitives | React 19 — refs are plain props |
| Unmount a tab the user will reopen | `<Activity mode={on ? 'visible' : 'hidden'}>` |
| Polling / websocket inside `<Activity mode="hidden">` | Keep the engine in a parent; feed props down |
| `<ViewTransition>` without a Transition update | Wrap `setState` in `startTransition` |
