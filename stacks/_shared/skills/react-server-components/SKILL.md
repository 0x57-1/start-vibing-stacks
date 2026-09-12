---
name: react-server-components
version: 1.1.0
description: "React 19.3 Server Components (RSC) production patterns for 2026: Server Components as default, 'use client' only on interactive leaves, streaming with Suspense, parallel data fetching with Promise.all, serialization rules, layered caching, Server Actions, use(browser()), Fragment in Flight. Flight CVE floor (do not stop at the first React2Shell patch). Use with Next.js 16+ App Router."
---

# React Server Components (2026 Production)

**Invoke when building any React 19.3+ application using the App Router (Next.js 16+, Remix RSC, TanStack Start, etc.).**

> 2026 reality: Server Components are the default. 40%+ bundle size reduction is common when done correctly. The mental model is: **Server Components fetch and render on the server. Client Components add interactivity. Keep the boundary small and explicit.**
>
> **Flight floor:** new apps pin `react` / `react-dom` / `react-server-dom-*` to **≥ 19.3.0**. Older lines: **19.0.5 / 19.1.6 / 19.2.5**. The first React2Shell patches (19.0.1 / 19.1.2 / 19.2.1) are **not** enough — later DoS and source-exposure CVEs still hit those builds. Read `security-baseline/cve-watchlist.md` on lockfile hit. Do not invent exploit steps.

---

## 1. The Core Mental Model

| Component Type | Runs Where | Bundle Impact | Data Fetching | Interactivity |
|----------------|------------|---------------|---------------|---------------|
| **Server Component** (default) | Server | 0 KB to client | Direct (DB, API, FS) | None |
| **Client Component** (`'use client'`) | Client | Full JS shipped | Via props or API | Full (useState, useEffect, etc.) |

**Rule of thumb:**
- Default to Server Component.
- Add `'use client'` **only** when you need interactivity, browser APIs, or hooks.
- Keep Client Components as **small leaf components** near the user interaction.

---

## 2. Data Fetching — No Waterfalls

**Wrong (sequential):**

```tsx
// app/page.tsx
export default async function Page() {
  const user = await getUser();        // 200ms
  const posts = await getPosts(user);  // waits for user
  const comments = await getComments(); // waits for posts
  return <Dashboard ... />;
}
```

**Correct (parallel):**

```tsx
export default async function Page() {
  const [user, posts, comments] = await Promise.all([
    getUser(),
    getPosts(),
    getComments(),
  ]);
  return <Dashboard user={user} posts={posts} comments={comments} />;
}
```

Or use React's `cache()` for deduplication across the component tree.

---

## 3. Passing Data Across the Server → Client Boundary

**Only plain serializable data is allowed:**

- Primitives (`string`, `number`, `boolean`, `null`)
- Plain objects and arrays
- Dates (serialized as ISO strings in Next.js)
- Promises (React will suspend)

**Forbidden:**

- Functions
- Class instances
- `Map`, `Set`, `Date` (raw), `Error`, `RegExp`
- React elements (JSX) from Server to Client

**Correct pattern:**

```tsx
// Server Component
const user = await getUser();
const safeUser = {
  id: user.id,
  name: user.name,
  createdAt: user.createdAt.toISOString(),
};

return <UserProfile user={safeUser} />; // Client Component
```

---

## 4. Streaming with Suspense

Slow data should be wrapped in `<Suspense>` so the rest of the page streams immediately.

```tsx
import { Suspense } from 'react';
import { Comments } from './comments';

export default function Page() {
  return (
    <div>
      <Header />                    {/* streams first */}
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments />                {/* streams when ready */}
      </Suspense>
    </div>
  );
}
```

---

## 5. Server Actions (`'use server'`)

For mutations, use Server Actions instead of API routes.

```tsx
// app/actions.ts
'use server';

export async function createPost(formData: FormData) {
  const title = formData.get('title');
  await db.post.create({ data: { title } });
  revalidatePath('/posts');
}
```

```tsx
// app/new-post.tsx (Client Component)
'use client';

import { createPost } from './actions';

export function NewPostForm() {
  return (
    <form action={createPost}>
      <input name="title" />
      <button type="submit">Create</button>
    </form>
  );
}
```

---

## 6. Caching Layers (Next.js 16+)

1. **React `cache()`** — per-request memoization
2. **`unstable_cache`** — shared across requests (with tags)
3. **Route segment config** — `export const revalidate = 3600`
4. **Dynamic functions** (`cookies()`, `headers()`) — opt out of static rendering

---

## 7. Common Pitfalls in 2026

| Mistake | Fix |
|---------|-----|
| Putting `'use client'` at the root layout | Only add it to interactive leaves |
| Passing functions or class instances as props | Serialize on the server first |
| Sequential `await` in Server Components | Use `Promise.all` |
| Using Context at the root layout | Context only works inside Client Components |
| Forgetting to handle loading states with Suspense | Wrap slow sections in `<Suspense>` |
| Using `Date` objects directly across boundary | Convert to ISO string on the server |

---

## 8. When to Use Client Components

Only when you need:

- `useState`, `useEffect`, `useReducer`, `useContext`
- Browser APIs (`localStorage`, `window`, `document`)
- Event handlers (`onClick`, `onSubmit`)
- Third-party libraries that require the browser (many chart libs, drag-and-drop, etc.)
- `use(browser())` (React 19.3) — skip SSR for a leaf; wrap in `<Suspense>`

---

## 9. Hardening (no PoC)

| Rule | Why |
|------|-----|
| Pin Flight packages to the combined floor above | React2Shell follow-ons (DoS + Server Function source leak) |
| Validate every Server Action input (Zod) | Actions are public HTTP endpoints |
| Never interpolate secrets into Server Function source | CVE-2025-55183 class: stringified function body |
| Client first-party HTTP = axios instance | Next `fetch` stays on the server / Route Handler |
| `use(browser())` only for true browser widgets | Still streams a fallback — not a security boundary |

---

## See Also

- `nextjs-app-router` — framework-specific patterns on top of RSC
- `react-patterns` v2.1 — React 19.3 (`ViewTransition`, `browser()`, axios contract)
- `security-baseline/cve-watchlist.md` — named floors (Read on lockfile only)
- Official React docs: https://react.dev/reference/rsc/server-components

---

## Memory Optimization Trigger

If this skill accumulates many near-duplicate examples or grows beyond ~200 lines, run:

```bash
npx start-vibing-stacks memory optimize --dry-run
```