---
name: zod-validation
version: 1.0.0
---

# Zod Validation — Runtime Type Safety

**ALWAYS use Zod for form validation, API responses, and data boundaries.**

## Why Zod

- Runtime validation (TypeScript types disappear at runtime)
- Auto-infer TypeScript types from schemas
- Works with React Hook Form, tRPC, Next.js Server Actions
- Single source of truth: schema → type → validation

## Core Patterns

### Schema Definition

```tsx
import { z } from 'zod';

// Define schema
const UserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be 18+').max(120),
  role: z.enum(['admin', 'user', 'moderator']),
  bio: z.string().max(500).optional(),
  tags: z.array(z.string()).min(1, 'At least one tag required'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Infer type from schema (SINGLE SOURCE OF TRUTH)
type User = z.infer<typeof UserSchema>;
```

### Form Validation (React Hook Form + Zod)

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
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

### Reusable Schemas

```tsx
// Shared between frontend and backend
// schemas/user.ts

export const EmailSchema = z.string().email().toLowerCase().trim();
export const PasswordSchema = z.string().min(8).max(128);
export const UUIDSchema = z.string().uuid();
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const DateRangeSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
}).refine((d) => d.to > d.from, 'End date must be after start date');
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

## FORBIDDEN

| Don't | Do |
|---|---|
| Trust API responses blindly | `Schema.parse(response)` |
| Manual `if/else` validation | Zod schema |
| Duplicate types + validation | `z.infer<typeof Schema>` |
| `any` or `unknown` without validation | Parse with Zod first |
| Validate only on server | Validate on BOTH client + server |

## Rules

1. **SINGLE SOURCE OF TRUTH** — schema defines type AND validation
2. **VALIDATE AT BOUNDARIES** — forms, API responses, env vars
3. **SAFE PARSE FOR UI** — `safeParse()` for user-facing, `parse()` for internal
4. **SHARED SCHEMAS** — same schema on frontend and backend
5. **TRANSFORM DATA** — clean/normalize during validation, not after
