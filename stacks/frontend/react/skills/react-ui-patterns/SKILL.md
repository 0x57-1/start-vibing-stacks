# React UI Patterns — Loading, Errors, Empty States & Forms

**ALWAYS invoke when handling async UI states, forms, or user feedback.**

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
// ✅ CORRECT — only loading when no data
const { data, isLoading, error, refetch } = useQuery(...);

if (error) return <ErrorState error={error} onRetry={refetch} />;
if (isLoading && !data) return <Skeleton />;
if (!data?.items.length) return <EmptyState />;
return <ItemList items={data.items} />;

// ❌ WRONG — flashes spinner on refetch when cached data exists
if (isLoading) return <Spinner />;
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
        action={{ label: 'Invite User', onClick: () => router.visit('/users/invite') }}
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

## Form Pattern (Inertia.js)

```tsx
import { useForm } from '@inertiajs/react';

export default function CreateUser() {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/users', {
      onSuccess: () => {
        toast.success('User created!');
        reset();
      },
      onError: () => toast.error('Failed to create user'),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Name</label>
        <input
          value={data.name}
          onChange={e => setData('name', e.target.value)}
          className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
        />
        {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Email</label>
        <input
          type="email"
          value={data.email}
          onChange={e => setData('email', e.target.value)}
          className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
        />
        {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
      </div>

      <button
        type="submit"
        disabled={processing}
        className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
      >
        {processing ? (
          <span className="flex items-center gap-2">
            <Loader className="h-4 w-4 animate-spin" /> Creating...
          </span>
        ) : 'Create User'}
      </button>
    </form>
  );
}
```

## Optimistic Updates

```tsx
// Show result immediately, rollback on error
function ToggleFavorite({ item }: { item: Item }) {
  const [optimistic, setOptimistic] = useState(item.isFavorite);

  const toggle = () => {
    setOptimistic(!optimistic);  // Instant UI
    router.post(`/items/${item.id}/favorite`, {}, {
      preserveState: true,
      onError: () => {
        setOptimistic(item.isFavorite);  // Rollback
        toast.error('Failed to update');
      },
    });
  };

  return (
    <button onClick={toggle} className="text-xl">
      {optimistic ? '❤️' : '🤍'}
    </button>
  );
}
```

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

1. **`if (loading) return <Spinner />`** — check `loading && !data` instead
2. **Silent catch** — always toast/display errors to user
3. **No empty state** — every list needs one
4. **Clickable button during submit** — always `disabled={processing}`
5. **Console.log-only errors** — user must see feedback
