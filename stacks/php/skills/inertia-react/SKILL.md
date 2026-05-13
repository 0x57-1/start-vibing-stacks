---
name: inertia-react
version: 2.0.0
description: LEGACY skill — Inertia.js + React with Laravel-rendered pages. Use
  ONLY in pre-existing projects already built on Inertia. For NEW projects use
  `laravel-api-architecture` + `axios-laravel-api` + `react-api-standards`
  (API-first React SPA, no controller-rendered pages).
---

# Inertia.js + React — Laravel Frontend (LEGACY)

> **STATUS: LEGACY.** Do NOT pick this stack for new projects. Inertia couples
> the controller's first byte to a database query, blocking the page render.
> The modern default is **Laravel API + Axios + React SPA** (see the skills
> `laravel-api-architecture`, `axios-laravel-api`, `react-api-standards`).
>
> Keep this skill loaded **only** when extending an existing Inertia codebase
> that you cannot rewrite in the same change.

**ALWAYS invoke when writing Inertia.js pages, components, or shared data in
LEGACY projects only.**

## How Inertia Works

```
Browser ←→ Inertia.js ←→ Laravel Controller
           (no API needed)

- First request: full HTML (SSR or SPA)
- Subsequent: XHR with JSON props → React re-renders
- No API routes needed — controllers return Inertia::render()
```

## Controller Pattern

```php
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(): \Inertia\Response
    {
        return Inertia::render('Users/Index', [
            'users' => User::query()
                ->select('id', 'name', 'email', 'created_at')
                ->orderByDesc('created_at')
                ->paginate(20),
            'filters' => request()->only(['search', 'role']),
        ]);
    }

    public function store(StoreUserRequest $request): \Illuminate\Http\RedirectResponse
    {
        User::create($request->validated());
        return redirect()->route('users.index')
            ->with('success', 'User created.');
    }
}
```

## React Page Component

```tsx
// resources/js/Pages/Users/Index.tsx
import { Head, Link, router } from '@inertiajs/react';
import { PageProps, User, PaginatedData } from '@/types';

interface Props extends PageProps {
  users: PaginatedData<User>;
  filters: { search?: string; role?: string };
}

export default function UsersIndex({ users, filters }: Props) {
  return (
    <>
      <Head title="Users" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search */}
        <input
          defaultValue={filters.search}
          onChange={(e) => router.get('/users', { search: e.target.value }, {
            preserveState: true,
            replace: true,
          })}
          placeholder="Search..."
          className="border rounded-lg px-4 py-2"
        />

        {/* List */}
        {users.data.map((user) => (
          <div key={user.id} className="p-4 border-b">
            <Link href={`/users/${user.id}`} className="text-blue-600 hover:underline">
              {user.name}
            </Link>
          </div>
        ))}

        {/* Pagination */}
        {users.links.map((link, i) => (
          <Link key={i} href={link.url ?? ''} className={link.active ? 'font-bold' : ''}>
            <span dangerouslySetInnerHTML={{ __html: link.label }} />
          </Link>
        ))}
      </div>
    </>
  );
}
```

## Shared Data (Layout Props)

```php
// app/Http/Middleware/HandleInertiaRequests.php
public function share(Request $request): array
{
    return [
        ...parent::share($request),
        'auth' => [
            'user' => $request->user()?->only('id', 'name', 'email', 'avatar'),
        ],
        'flash' => [
            'success' => session('success'),
            'error' => session('error'),
        ],
    ];
}
```

```tsx
// Access in any component
import { usePage } from '@inertiajs/react';

const { auth, flash } = usePage().props;
```

## Forms (useForm hook)

```tsx
import { useForm } from '@inertiajs/react';

export default function CreateUser() {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
    password: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/users');
  };

  return (
    <form onSubmit={submit}>
      <input value={data.name} onChange={e => setData('name', e.target.value)} />
      {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}

      <input value={data.email} onChange={e => setData('email', e.target.value)} />
      {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}

      <button type="submit" disabled={processing} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
        {processing ? 'Saving...' : 'Create'}
      </button>
    </form>
  );
}
```

## TypeScript Types

```tsx
// resources/js/types/index.d.ts
export interface PageProps {
  auth: { user: User | null };
  flash: { success?: string; error?: string };
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  created_at: string;
}

export interface PaginatedData<T> {
  data: T[];
  links: { url: string | null; label: string; active: boolean }[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
```

## TailwindCSS 4 Setup

```css
/* resources/css/app.css */
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --color-primary-foreground: #ffffff;
  --font-sans: 'Inter', sans-serif;
}
```

## FORBIDDEN

1. **API routes for Inertia pages** — use `Inertia::render()` in controllers
2. **`window.location` for navigation** — use `router.visit()` or `<Link>`
3. **Fetching data in useEffect** — pass as props from controller
4. **Duplicating validation** — validate in FormRequest, show errors from `useForm`
5. **`any` types for page props** — always type with `interface Props extends PageProps`
