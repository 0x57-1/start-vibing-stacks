---
name: zod-validation
version: 2.0.0
description: "Zod 4 (stable Aug 2025) runtime validation for TypeScript boundaries — forms, API responses, env vars, server actions. Zod 4 brings 14× faster string parsing, 7× array, 6.5× object, 57% smaller bundle, 2× faster TS compile, 100× fewer tsc instantiations. Major API shifts: top-level format validators (`z.email()`, `z.url()`, `z.uuid()`) for tree-shaking; unified `error` parameter replaces `required_error` / `invalid_type_error` / `errorMap`. Codemod available: `npx @zod/codemod`. Covers schema design, RHF + zodResolver integration, API response validation, split server/client env schemas (security-critical for `NEXT_PUBLIC_*`), reusable schemas, transforms, and Next.js Server Actions. Mentions Valibot/ArkType when bundle/inference cost matters. Invoke at any trust boundary."
---

# Zod 4 — Runtime Type Safety (2026)

**ALWAYS use Zod 4 for form validation, API responses, env vars, server actions.**

## Why Zod 4 (stable since August 2025)

- **14× faster** string parsing, **7×** array, **6.5×** object
- **57% smaller** core bundle
- **~2× faster** TS compilation on large schemas; **100× fewer** tsc instantiations
- Ecosystem locked in: tRPC, Drizzle, React Hook Form, OpenAPI generators
- 15M+ weekly downloads — the de-facto standard

### When to consider an alternative

| Situation | Tool |
|---|---|
| **Bundle size** is critical (edge functions, embeds) | **Valibot** — sub-1KB simple schemas |
| You want **faster TS check** in giant codebases | **Valibot** (~18× faster type-check vs Zod 4) |
| You like TS-syntax string schemas | **ArkType** |
| Mainstream ecosystem + maturity | **Zod 4** ✅ |

## Migration v3 → v4

```bash
npx @zod/codemod --transform v3-to-v4 ./src
```

The two breaking changes you'll see most:

### 1. Top-level format validators (tree-shaking)

```tsx
// v3 (works in v4 but not tree-shakable)
z.string().email().min(5);

// v4 — recommended
z.email();
z.url();
z.uuid();
z.iso.datetime();         // ISO-8601
z.iso.date();
z.cuid2();
z.ipv4();
z.ipv6();
z.base64();
z.jwt();
```

### 2. Unified `error` parameter

```tsx
// v3 — three different parameters
z.string({
  required_error: "Required",
  invalid_type_error: "Must be a string",
  errorMap: ({ code }) => ({ message: code === "too_small" ? "Too short" : "Invalid" }),
});

// v4 — one parameter, string or function
z.string({
  error: (issue) => issue.code === "too_small" ? "Too short" : "Required",
});
// Or just a string:
z.string({ error: "Name is required" });
```

## Core Patterns

### Schema definition

```tsx
import { z } from 'zod';

const UserSchema = z.object({
  name:     z.string().min(2, "Name must be at least 2 characters"),
  email:    z.email({ error: "Enter a valid email" }),       // v4 top-level
  age:      z.number().min(18, "Must be 18+").max(120),
  role:     z.enum(["admin", "user", "moderator"]),
  bio:      z.string().max(500).optional(),
  tags:     z.array(z.string()).min(1, "At least one tag required"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// SINGLE SOURCE OF TRUTH — schema → type
type User = z.infer<typeof UserSchema>;
```

### Form Validation (React Hook Form + Zod 4)

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.email(),                                   // v4 top-level
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type CreateUserForm = z.infer<typeof CreateUserSchema>;

export default function CreateUserPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(CreateUserSchema),
  });

  const onSubmit = async (data: CreateUserForm) => {
    // data is fully validated and typed here
    await api.createUser(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}

      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}

      <input type="password" {...register('confirmPassword')} />
      {errors.confirmPassword && <span>{errors.confirmPassword.message}</span>}

      <button type="submit" disabled={isSubmitting}>Create</button>
    </form>
  );
}
```

### API Response Validation

```tsx
// Validate what the server returns (NEVER trust API responses)
const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    users: z.array(UserSchema),
    total: z.number(),
    page: z.number(),
  }),
});

async function fetchUsers(): Promise<z.infer<typeof ApiResponseSchema>> {
  const res = await fetch('/api/users');
  const json = await res.json();
  return ApiResponseSchema.parse(json); // Throws if invalid
}

// Safe parse (no throw)
const result = ApiResponseSchema.safeParse(json);
if (result.success) {
  return result.data; // Typed correctly
} else {
  console.error('Invalid API response:', result.error.flatten());
}
```

### Environment Variables

> **Split server and client env schemas.** `NEXT_PUBLIC_*` is embedded in the browser bundle — NEVER put secrets there.

```tsx
// lib/env.server.ts — Server-only secrets (NEVER import from client components)
const ServerEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  OPENAI_KEY: z.string().startsWith('sk-'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export const serverEnv = ServerEnvSchema.parse({
  DATABASE_URL: process.env['DATABASE_URL'],
  OPENAI_KEY: process.env['OPENAI_KEY'],
  STRIPE_SECRET_KEY: process.env['STRIPE_SECRET_KEY'],
  NODE_ENV: process.env['NODE_ENV'],
});

// lib/env.client.ts — Public vars only (safe for browser)
const ClientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_STRIPE_KEY: z.string().startsWith('pk_'),
});

export const clientEnv = ClientEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
  NEXT_PUBLIC_STRIPE_KEY: process.env['NEXT_PUBLIC_STRIPE_KEY'],
});
```

**Rule:** If a variable contains a key, secret, token, or password, it MUST be in `ServerEnvSchema` without `NEXT_PUBLIC_` prefix.

### Reusable Schemas (Zod 4 top-level)

```tsx
// schemas/common.ts — shared between frontend and backend
export const EmailSchema    = z.email().transform(v => v.toLowerCase().trim());
export const PasswordSchema = z.string().min(8).max(128);
export const UUIDSchema     = z.uuid();
export const URLSchema      = z.url();
export const ISODateSchema  = z.iso.datetime();

export const PaginationSchema = z.object({
  page:  z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const DateRangeSchema = z.object({
  from: z.coerce.date(),
  to:   z.coerce.date(),
}).refine(d => d.to > d.from, "End date must be after start date");
```

### Discriminated unions (polymorphic payloads)

```tsx
const PaymentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("card"), last4: z.string().length(4) }),
  z.object({ type: z.literal("pix"),  key:   z.string() }),
  z.object({ type: z.literal("boleto"), barcode: z.string() }),
]);
type Payment = z.infer<typeof PaymentSchema>;
```

### Branded types — distinguish IDs at the type level

```tsx
const UserIdSchema = z.uuid().brand<"UserId">();
type UserId = z.infer<typeof UserIdSchema>;

function getUser(id: UserId) { /* … */ }
getUser("not a uuid");                  // ❌ type error
getUser(UserIdSchema.parse(input));     // ✅
```

### Transform & Preprocess

```tsx
// Clean data during validation
const ContactSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  phone: z.string().transform((val) => val.replace(/\D/g, '')),
  amount: z.string().transform((val) => parseFloat(val)),
  tags: z.preprocess(
    (val) => (typeof val === 'string' ? val.split(',') : val),
    z.array(z.string())
  ),
});
```

## Integration with Next.js Server Actions

```tsx
'use server';

import { z } from 'zod';

const CreateLeadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().toLowerCase().trim(),
  domainId: z.string().uuid(),
});

export async function createLead(formData: FormData) {
  const result = CreateLeadSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    domainId: formData.get('domainId'),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  await db.lead.create({ data: result.data });
  return { success: true };
}
```

### Client-Side with React Hook Form

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const CreateLeadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  domainId: z.string().uuid(),
});

type CreateLeadForm = z.infer<typeof CreateLeadSchema>;

export function LeadForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateLeadForm>({
    resolver: zodResolver(CreateLeadSchema),
  });

  const onSubmit = async (data: CreateLeadForm) => {
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      {/* ... */}
    </form>
  );
}
```

## Use with React 19 Actions + `useActionState`

```tsx
"use client";
import { useActionState } from "react";
import { z } from "zod";

const Schema = z.object({
  email:    z.email(),
  password: z.string().min(8),
});

async function loginAction(_prev: { error: string | null }, formData: FormData) {
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return await loginRequest(parsed.data);
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, { error: null });
  return (
    <form action={action}>
      <input name="email" type="email" />
      <input name="password" type="password" />
      {state.error && <p className="text-destructive">{state.error}</p>}
      <button disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
```

## FORBIDDEN

| Don't | Do |
|---|---|
| Trust API responses blindly | `Schema.parse(response)` (or `safeParse` for soft fail) |
| Manual `if/else` validation | Zod schema (single source of truth) |
| Duplicate types + validation | `z.infer<typeof Schema>` |
| `any` or `unknown` without validation | Parse with Zod first |
| Validate only on server | Validate on BOTH client and server |
| `z.string().email()` in v4 | `z.email()` (tree-shakable, top-level) |
| `required_error` / `invalid_type_error` / `errorMap` (v3) | Unified `error` parameter (v4) |
| Dump secrets into `NEXT_PUBLIC_*` | Server-only `ServerEnvSchema`; client gets only public keys |
| Re-implement common formats (URL, UUID, datetime, JWT) | `z.url()`, `z.uuid()`, `z.iso.datetime()`, `z.jwt()` |

## Rules

1. **SINGLE SOURCE OF TRUTH** — schema defines type AND validation
2. **VALIDATE AT BOUNDARIES** — forms, API responses, env vars, queue messages
3. **SAFE PARSE FOR UI** — `safeParse()` for user-facing forms, `parse()` for internal/trusted
4. **SHARED SCHEMAS** — same schema on frontend and backend (workspace package)
5. **TRANSFORM DURING VALIDATION** — `.toLowerCase()`, `.trim()`, `.transform(...)` happen as part of `parse`, not afterwards
6. **PREFER TOP-LEVEL FORMAT VALIDATORS** in v4 — better tree-shaking + clearer intent

## See Also

- `react-patterns` v2 — `useActionState`, `useOptimistic`, `use()` hook
- `react-ui-patterns` v2 — RHF + Zod + TanStack Query patterns
- `shadcn-ui` v2 — `<Form>` component built on RHF + Zod
- `_shared/skills/security-baseline` v2 — input validation as defense layer
- `_shared/skills/openapi-design` v2 — schemas → OpenAPI 3.2
