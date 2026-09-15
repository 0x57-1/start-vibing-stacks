---
name: react-native-zod
version: 1.0.0
description: >-
  Zod at Expo trust boundaries: API envelopes, forms, EXPO_PUBLIC env.
  Use when adding login, lists, or payments. Not Next.js Server Actions
  or NEXT_PUBLIC_* schemas.
---

# Zod on React Native

Parse every mobile API envelope. Fail closed on unknown shapes.

## Envelope

```ts
import { z } from 'zod';

function envelope<T extends z.ZodType>(data: T) {
  return z.object({ data }).strict();
}

const AccountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
}).strict();

const parsed = envelope(AccountSchema).safeParse(res.data);
if (!parsed.success) throw new Error('Invalid account payload');
```

Amounts: `z.number().positive()` (or `z.coerce.number()` only when the
API sends strings). PIX key types: `z.enum(['DOCUMENT','EMAIL','PHONE','RANDOM'])`.

## Forms

`react-hook-form` + `zodResolver` is fine. Native `TextInput` — no HTML
`register` + `<form>`. Disable submit while in-flight.

## Env (public only)

```ts
const PublicEnvSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url(),
});

export const publicEnv = PublicEnvSchema.parse({
  EXPO_PUBLIC_API_URL: process.env['EXPO_PUBLIC_API_URL'],
});
```

`EXPO_PUBLIC_*` is compiled into the binary. Never put tokens, PIX keys,
or `ak_…` here. Secrets stay on the user API.

## Forbidden

| Action | Why |
|---|---|
| `res.data as T` | Lie |
| Next.js `'use server'` / `FormData` actions | Not this stack |
| `NEXT_PUBLIC_*` / `VITE_*` schemas | Use `EXPO_PUBLIC_*` |
| `z.email()` on a PIX phone key | Enum the key type first |

## See Also

- `react-native-http` — axios instance
- `react-native-query` — parse inside `queryFn`
- `typescript-strict` — `process.env['…']`
