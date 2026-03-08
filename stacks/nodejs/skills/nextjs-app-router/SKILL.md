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

## Environment Variables & API Security (MANDATORY)

> **NEXT_PUBLIC_ vars are embedded in the browser JS bundle.** Anyone can see them in DevTools.

### Server vs Client Environment

| Prefix | Accessible from | Safe for |
|--------|----------------|----------|
| No prefix | Server Components, Route Handlers, Server Actions | API keys, secrets, tokens, DB URLs |
| `NEXT_PUBLIC_*` | Server + Browser (embedded in JS) | Public URLs, analytics IDs, publishable keys |

### FORBIDDEN Environment Patterns

```bash
# NEVER DO THIS — secret exposed in browser bundle
NEXT_PUBLIC_OPENAI_KEY=sk-abc123
NEXT_PUBLIC_STRIPE_SECRET_KEY=sk_live_abc
NEXT_PUBLIC_DATABASE_URL=postgresql://user:pass@host/db

# CORRECT — server-only (no NEXT_PUBLIC_ prefix)
OPENAI_KEY=sk-abc123
STRIPE_SECRET_KEY=sk_live_abc
DATABASE_URL=postgresql://user:pass@host/db

# OK as NEXT_PUBLIC_ — no secret value
NEXT_PUBLIC_APP_URL=https://myapp.com
NEXT_PUBLIC_STRIPE_KEY=pk_live_abc
NEXT_PUBLIC_GA_ID=G-XXXXX
```

### API Proxy Pattern (MANDATORY)

External API calls with secrets MUST go through server-side Route Handlers:

```tsx
// app/api/ai/route.ts — Secret stays on server
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env['OPENAI_KEY']}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'AI request failed' }, { status: 502 });
  }

  return NextResponse.json(await response.json());
}
```

```tsx
// components/chat.tsx — Client calls YOUR route, not external API
'use client';

async function sendMessage(prompt: string) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  return res.json();
}
```

### Server Actions for Mutations

Server Actions also keep secrets server-side:

```tsx
// app/actions/payment.ts
'use server';

import Stripe from 'stripe';

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!);

export async function createCheckout(priceId: string) {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env['APP_URL']}/success`,
    cancel_url: `${process.env['APP_URL']}/cancel`,
  });
  return { url: session.url };
}
```

## FORBIDDEN

1. **`'use client'` on server-capable components** — default to server
2. **Fetching in client when server fetch works** — use server components
3. **`getServerSideProps` / `getStaticProps`** — App Router uses async components
4. **API routes for server-only data** — use server components directly
5. **Prop drilling through layouts** — use parallel routes or context
6. **`NEXT_PUBLIC_` with API keys, secrets, or tokens** — secrets leak to browser bundle
7. **Calling external APIs from client components** — use Route Handlers as proxy
8. **`process.env['SECRET']` in `'use client'` files** — only `NEXT_PUBLIC_*` vars work client-side
