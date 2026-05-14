---
name: nextjs-app-router
version: 1.2.0
---

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

---

## Dynamic Route Slug Consistency (CRITICAL — silent build killer)

> **Next.js validates dynamic-segment slug names at REQUEST TIME, not at build time.** `next build` / `bun run build` **does not catch** this class of bug. It blows up the first time anyone hits the route in production with:
>
> ```
> Error: You cannot use different slug names for the same dynamic path ('id' !== 'userId').
> ```

### The Rule

Inside the **same parent directory**, every `[bracket]` child segment MUST use the **same** inner name. Pick one slug name per resource and reuse it through every nested route under it.

```
# BROKEN — same parent (app/users/), different slug names
app/users/[id]/page.tsx
app/users/[userId]/posts/page.tsx        ← runtime crash

# CORRECT — one canonical slug per resource
app/users/[userId]/page.tsx
app/users/[userId]/posts/page.tsx
app/users/[userId]/posts/[postId]/page.tsx
```

This also applies to catch-all (`[...slug]`) and optional catch-all (`[[...slug]]`) — you may not mix a `[id]` and `[...rest]` as siblings of the same parent.

### Pre-Flight Check (run BEFORE creating any new dynamic route)

```bash
# Quick visual scan — list every dynamic segment with its depth
find src/app app -type d -name '[[]*[]]' 2>/dev/null \
  | awk -F/ '{print NF":"$0}' | sort
```

Eyeball the output: any two paths that share a prefix up to depth `N-1` and diverge into different `[name]` at depth `N` are the bug.

### Programmatic Check (CI gate — mandatory)

The stack ships a Bun script at `scripts/check-route-slugs.mjs`. Add it to `package.json` and wire it into the quality gate **before** `build`:

```jsonc
{
  "scripts": {
    "routes:check": "bun scripts/check-route-slugs.mjs",
    "prebuild": "bun run routes:check",
    "build": "next build"
  }
}
```

Why `prebuild`: makes the check unskippable for anyone running `bun run build` locally, in Vercel, or in CI. The check completes in milliseconds and exits non-zero on the first conflict, with the offending parent dir and conflicting slugs in the error message.

### When to Run

- ☑ **Before creating** any new `[something]/page.tsx` or `[something]/route.ts`
- ☑ **Before any commit** touching `app/**/[*]/**`
- ☑ **In CI** before `bun run build`
- ☑ **As `prebuild`** in `package.json` so local builds also catch it

### Convention — name your slugs by resource, not by position

| Resource | Slug |
|---|---|
| User | `[userId]` |
| Organization / tenant | `[orgId]` or `[tenantId]` |
| Post / article | `[postId]` |
| Instance ID (Evolution API, webhook key) | `[instanceKey]` (or whatever you commit to — pick once) |

Generic `[id]` is acceptable only at the root of a resource (`app/users/[id]/...`) **if and only if** you stay with `[id]` through every nested segment under it. Mixing `[id]` and `[userId]` under the same parent is the bug.

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

## Webhook Handler — Critical Path (avoid retry storms)

> A webhook receiver is a **critical path you do not control**. The provider (Stripe, GitHub, Evolution, Meta, etc.) will retry — often aggressively, often forever — every non-`2xx`. Any error you let propagate becomes their problem AND yours.

### The Three Rules

1. **Verify signature with the RAW body BEFORE parsing JSON.** Parsing first leaks payload validity into your error path and can let unsigned traffic through.
2. **Acknowledge fast (return 2xx within ≤ 5 s).** Persist the event, hand it off to a queue / `waitUntil` / background task, then return. The HTTP handler does NOT do business logic.
3. **Idempotency by provider event ID.** Same event arriving twice (retries, replays) MUST be a no-op. Store the event ID with a unique index.

### Reference Receiver (Next.js Route Handler)

```ts
// app/api/webhooks/[provider]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

export const runtime = 'nodejs'; // crypto.timingSafeEqual + raw body
export const dynamic = 'force-dynamic';

const SECRET = process.env['WEBHOOK_SECRET']!;

function verify(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', SECRET).update(rawBody).digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  // 1) RAW body — never req.json() before signature check
  const rawBody = await req.text();
  const signature = req.headers.get('x-signature');

  if (!verify(rawBody, signature)) {
    // Signature failure is the ONLY 4xx we return. Provider will not retry 401.
    return new NextResponse('invalid signature', { status: 401 });
  }

  // 2) Parse AFTER signature passes
  let event: { id: string; type: string; data: unknown };
  try {
    event = JSON.parse(rawBody);
  } catch {
    // Malformed body from an authenticated source = log + 200.
    // Returning 400/500 here triggers infinite retries for a payload we cannot process anyway.
    logger.warn({ rawBody }, 'webhook.parse_failed');
    return new NextResponse('accepted', { status: 200 });
  }

  // 3) Idempotency — store-or-skip on event.id (unique index)
  try {
    await db.webhookEvent.create({
      data: { id: event.id, type: event.type, payload: event, status: 'pending' },
    });
  } catch (e) {
    if (isUniqueViolation(e)) {
      // Duplicate delivery — already accepted. Ack and move on.
      return new NextResponse('duplicate', { status: 200 });
    }
    // DB down: signal the provider to retry (this IS our fault).
    logger.error({ err: e, eventId: event.id }, 'webhook.persist_failed');
    return new NextResponse('storage error', { status: 503 });
  }

  // 4) Hand off async. NEVER await business logic here.
  //    Options, in order of preference:
  //      (a) push to a queue (BullMQ, Inngest, QStash, SQS)
  //      (b) Vercel: `waitUntil(processEvent(event))` — runs after response
  //      (c) trigger an internal API call with `fetch(..., { keepalive: true })`
  await queue.publish('webhook.received', { eventId: event.id });

  // 5) Always 2xx if we got this far. Provider stops retrying.
  return NextResponse.json({ received: true });
}
```

### The Async Processor (separate from the receiver)

The processor is where downstream calls happen. **It must absorb its own failures** — never let them bubble back into the HTTP receiver:

```ts
// jobs/process-webhook.ts
import CircuitBreaker from 'opossum';

const downstream = new CircuitBreaker(callDownstreamAPI, {
  timeout: 5_000,
  errorThresholdPercentage: 50,
  resetTimeout: 30_000,
});

export async function processWebhook(eventId: string) {
  const event = await db.webhookEvent.findUniqueOrThrow({ where: { id: eventId } });
  if (event.status === 'processed') return; // re-entrancy safety

  try {
    await downstream.fire(event.payload);
    await db.webhookEvent.update({
      where: { id: eventId },
      data: { status: 'processed', processedAt: new Date() },
    });
  } catch (err) {
    // Mark for retry from OUR side (queue redelivery + backoff),
    // NOT from the provider's side. Provider already got 2xx.
    await db.webhookEvent.update({
      where: { id: eventId },
      data: {
        status: 'failed',
        attempts: { increment: 1 },
        lastError: serializeError(err),
      },
    });
    logger.error({ err, eventId }, 'webhook.process_failed');
    throw err; // queue will backoff + retry per OUR policy
  }
}
```

See `error-handling` Pattern 5 for circuit breaker tuning and Pattern 4 for retry+backoff.

### FORBIDDEN — Webhook Handlers

| Anti-pattern | Why it's lethal |
|---|---|
| `await req.json()` before signature verification | Signature is computed on the raw body bytes; framework re-serialization breaks it. Also accepts unsigned traffic into your parser. |
| Doing the business logic inline in the handler | Provider timeout (≤ 5–30 s) → they retry while you're still processing → duplicate writes. |
| Returning `5xx` on downstream failures | Provider retries forever, queue floods, your downstream gets even more load. Ack 2xx, retry from your side. |
| Returning `4xx` on parse / business errors | Same retry storm. Only `4xx` justified is `401` for bad signature. |
| No idempotency key | First retry creates a duplicate user / duplicate charge / duplicate message. |
| Logging the full payload | PII / secrets in logs. Log the event ID + type; redact `data.*`. |
| One `/api/webhooks` for all providers | Each provider has its own signature scheme, secrets, retry policy. Isolate per-route (`/api/webhooks/[provider]`). |
| Trusting `X-Forwarded-For` for provider IP allowlist | Use signature verification, not IP allowlisting. Provider IPs rotate. |

### Pre-Commit Checklist (Webhook Routes)

- [ ] Signature verified on the **raw body** before any parsing
- [ ] `timingSafeEqual` used for signature comparison (no `===`)
- [ ] Provider event ID stored with a unique index → idempotency
- [ ] Handler returns 2xx within ~1 s on the success path
- [ ] Business logic delegated to queue / `waitUntil` / background task
- [ ] Downstream calls wrapped in circuit breaker + retry+backoff
- [ ] Logs include `eventId` + `provider` + `type`; payload `data` redacted
- [ ] Tested: duplicate delivery → 200 (no duplicate side-effect)
- [ ] Tested: invalid signature → 401, never reaches the parser

---

## Build Script Hygiene (Vercel / CI — silent deploy killer)

> **Vercel sets `NODE_ENV=production` during deploy**, which causes `npm
> install` to **omit `devDependencies`**. Any binary your `build` /
> `prebuild` / `postinstall` script invokes must be resolvable from
> `dependencies` (or `node_modules/.bin` shipped via a prod dep) —
> otherwise you get `sh: line 1: <tool>: command not found` and
> `Error: Command "npm run build" exited with 127` at deploy time, even
> though `bun run build` worked locally.

This is **not** a Next.js bug. Same trap exists on Vercel Functions,
Netlify, Cloudflare Pages, Railway, Render, Fly.io, AWS Amplify, Docker
multi-stage builds, and any CI runner that respects `NODE_ENV` or runs
`npm ci --omit=dev`.

### Common Offenders (devDep tools invoked from `scripts`)

| Tool | Typical wrong usage | Why it breaks |
|---|---|---|
| `tsx` | `"build": "tsx scripts/seed.ts && next build"` | `tsx` is dev-only; not installed on Vercel |
| `ts-node` | `"prebuild": "ts-node ./gen.ts"` | Same — `ts-node` rarely in `dependencies` |
| `tsc` | `"prebuild": "tsc -p tsconfig.gen.json"` | `typescript` is conventionally a devDep |
| `vitest` / `jest` | `"prebuild": "vitest run"` | Test runners are dev-only |
| `eslint` / `prettier` / `biome` | `"build": "eslint . && next build"` | Linters are dev-only |
| `tailwindcss` (CLI) | `"build": "tailwindcss -i ... && next build"` | Next.js handles Tailwind via its compiler; the standalone CLI is dev-only |
| `prisma` | `"postinstall": "prisma generate"` | **OK** only if `prisma` is in `dependencies` (it should be) — generation needs the CLI on every install |

### The Rule

Anything referenced in `scripts.build`, `scripts.prebuild`,
`scripts.postbuild`, `scripts.start`, `scripts.postinstall`,
`scripts.prepare`, `scripts.prepublishOnly` must be one of:

1. A Node-builtin (`node`, plain shell)
2. Prefixed with `npx` / `bunx` / `pnpm exec` (downloads on demand — slow, fragile)
3. The package's own `bin` entry
4. Present in `dependencies` (not just `devDependencies`)
5. A plain-Node script: `node scripts/foo.mjs` (zero deps; works everywhere)

### Fix Vectors (in order of preference)

#### 1. Convert TS scripts to zero-dep `.mjs` (BEST for tiny utilities)

```jsonc
// BEFORE — fails on Vercel
{ "scripts": { "prebuild": "tsx scripts/check-routes.ts" } }

// AFTER — works everywhere, no devDep needed
{ "scripts": { "prebuild": "node scripts/check-routes.mjs" } }
```

Use modern Node features (`node:fs/promises`, top-level `await`,
`import.meta`). Bun, Node 20+, and every CI runner support `.mjs`
natively.

#### 2. Move the tool to `dependencies` (when you genuinely need the runtime tool)

```bash
# Prisma client generation — needs the CLI on every install
bun remove -D prisma
bun add prisma
```

Costs: larger node_modules in prod. Acceptable for runtime-needed CLIs
(`prisma`, sometimes `tsx` if you have many TS scripts).

#### 3. Configure Vercel to install devDeps (LAST RESORT — global override)

```jsonc
// vercel.json
{ "installCommand": "npm install --include=dev" }
```

This **doubles** the install size for every deploy. Only use when you
have a real TypeScript build pipeline that can't be migrated to `.mjs`.

#### 4. Compile TS scripts ahead of time (advanced)

Bundle TS utilities to `.js` with `tsup`/`esbuild` during dev, commit
the output, run the `.js` in build. Useful for big script suites; for
one-off utilities the `.mjs` approach is simpler.

### Why "It Works on My Machine"

| Environment | Behavior |
|---|---|
| Local `bun install` | Installs ALL deps by default (including devDeps) |
| Local `bun run build` | `node_modules/.bin/tsx` exists → succeeds |
| Local `npm install` (no flags) | Installs ALL deps (devDeps included unless `NODE_ENV=production`) |
| Vercel build step | Runs with `NODE_ENV=production` → devDeps **stripped** → `tsx` missing |
| Docker `FROM node:20` + `npm ci --omit=dev` | Same as Vercel |
| GitHub Actions default | Installs ALL deps unless workflow explicitly sets `NODE_ENV=production` |

The asymmetry is the trap. Local dev and CI accidentally agree; deploy
disagrees. Catch it statically.

### Static Check (CI gate — mandatory)

The stack ships `scripts/check-build-scripts.mjs` (zero deps). It parses
`package.json`, walks every deploy-time script (`build`, `prebuild`,
`postbuild`, `start`, `postinstall`, `prepare`, `prepublishOnly`),
tokenises the command, and flags any token that is:

- A known dev-only tool name (`tsx`, `ts-node`, `vitest`, `eslint`, ...)
- AND not prefixed with `npx`/`bunx`/`pnpm exec`/`node`
- AND not present in `dependencies`

Wire it as `prebuild` AND in CI:

```jsonc
{
  "scripts": {
    "routes:check": "node scripts/check-route-slugs.mjs",
    "build:check":  "node scripts/check-build-scripts.mjs",
    "prebuild":     "bun run routes:check && bun run build:check",
    "build":        "next build"
  }
}
```

### Stack-shipped Scripts MUST Be `.mjs`

When this stack scaffolds a helper script (`check-route-slugs.mjs`,
`check-build-scripts.mjs`, anything in `scripts/`), it is **always**
plain `.mjs` runnable via `node`. **Never** use `.ts` requiring `tsx`
or `ts-node`. The whole point of these scripts is to run during
build — they have to work on Vercel.

### Pre-Commit Checklist (Build Scripts)

- [ ] `package.json#scripts.build` has no `tsx` / `ts-node` / dev-only CLI
- [ ] `package.json#scripts.prebuild` (if any) is also clean
- [ ] `package.json#scripts.postinstall` (runs on Vercel during install) is also clean
- [ ] Any helper script in `scripts/` is `.mjs`, runnable via plain `node`
- [ ] If a runtime tool is genuinely needed (e.g. `prisma generate`), it lives in `dependencies`, not `devDependencies`
- [ ] Tested with `NODE_ENV=production npm ci && npm run build` locally before deploy

---

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
9. **Mixing `[id]` / `[userId]` / `[someId]` as siblings of the same parent dir** — runtime crash; `next build` does NOT catch it. Run `bun run routes:check` (see "Dynamic Route Slug Consistency")
10. **Webhook business logic inline in the Route Handler** — ack 2xx fast, process async (see "Webhook Handler — Critical Path")
11. **Skipping signature verification or parsing JSON before verifying** — always verify the raw body first
12. **Returning 5xx from a webhook on a downstream failure** — triggers provider retry storms; ack 2xx and retry from your side
13. **Calling `tsx` / `ts-node` / `vitest` / `eslint` directly from `scripts.build` or `scripts.prebuild`** — Vercel strips devDeps; build fails with exit 127. Convert to `.mjs` or move to `dependencies` (see "Build Script Hygiene")
14. **Shipping helper scripts as `.ts`** — they cannot run on Vercel without `tsx` in `dependencies`. Use `.mjs` and plain `node`
