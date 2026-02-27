# Next.js App Router — Modern Patterns

**ALWAYS invoke when writing Next.js pages, layouts, or server components.**

## File Conventions

```
app/
├── layout.tsx          # Root layout (required)
├── page.tsx            # Home page
├── loading.tsx         # Loading UI (Suspense boundary)
├── error.tsx           # Error boundary ('use client')
├── not-found.tsx       # 404 page
├── (auth)/             # Route group (no URL segment)
│   ├── login/page.tsx
│   └── register/page.tsx
├── dashboard/
│   ├── layout.tsx      # Nested layout
│   ├── page.tsx
│   └── [id]/page.tsx   # Dynamic route
└── api/
    └── route.ts        # API route handler
```

## Server vs Client Components

```tsx
// DEFAULT: Server Component (no directive needed)
async function UserList() {
  const users = await db.user.findMany(); // Direct DB access
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}

// CLIENT: Only when needed (interactivity, hooks, browser APIs)
'use client';
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c + 1)}>{count}</button>;
}
```

## Data Fetching

```tsx
// Server Component — fetch with caching
async function Page() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 }, // ISR: revalidate every hour
  });
  return <div>{data}</div>;
}

// Dynamic data (no cache)
async function Page() {
  const data = await fetch('https://api.example.com/data', {
    cache: 'no-store',
  });
}
```

## Server Actions

```tsx
// app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string;
  await db.user.create({ data: { name } });
  revalidatePath('/users');
}

// In component
<form action={createUser}>
  <input name="name" />
  <button type="submit">Create</button>
</form>
```

## Route Handlers (API)

```tsx
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page') ?? '1');
  const users = await db.user.findMany({ skip: (page - 1) * 20, take: 20 });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json(result.error, { status: 400 });
  const user = await db.user.create({ data: result.data });
  return NextResponse.json(user, { status: 201 });
}
```

## Metadata

```tsx
// Static
export const metadata = { title: 'Dashboard', description: 'User dashboard' };

// Dynamic
export async function generateMetadata({ params }: { params: { id: string } }) {
  const user = await getUser(params.id);
  return { title: user.name };
}
```

## FORBIDDEN

1. **`'use client'` on server-capable components** — default to server
2. **Fetching in client when server fetch works** — use server components
3. **`getServerSideProps` / `getStaticProps`** — App Router uses async components
4. **API routes for server-only data** — use server components directly
5. **Prop drilling through layouts** — use parallel routes or context
