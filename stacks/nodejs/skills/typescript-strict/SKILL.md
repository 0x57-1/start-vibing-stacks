# TypeScript Strict — Type Safety Patterns

**ALWAYS invoke when writing .ts/.tsx files.**

## Required tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## Index Access

```typescript
// WRONG
const port = process.env.PORT;

// CORRECT — bracket notation
const port = process.env['PORT'];
const host = process.env['HOST'] ?? 'localhost';
```

## Null Handling

```typescript
// Optional chaining + nullish coalescing
const avatar = user.profile?.avatar ?? '/default.png';

// WRONG — || treats 0, '', false as falsy
const count = input || 10;
// CORRECT — ?? only null/undefined
const count = input ?? 10;
```

## Type Guards

```typescript
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value && 'email' in value;
}

// Assertion function
function assertDefined<T>(value: T | undefined | null, msg: string): asserts value is T {
  if (value == null) throw new Error(msg);
}
```

## Const Assertions

```typescript
// Exact types (not widened)
const endpoints = {
  users: '/api/users',
  posts: '/api/posts',
} as const;

// Discriminated unions
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

## Generic Patterns

```typescript
// Constrained
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

// RequireFields utility
type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
```

## FORBIDDEN

1. **`any`** — use `unknown` instead
2. **Non-null assertion without certainty** — check first
3. **Type assertion to hide errors** — fix the actual issue
4. **`@ts-ignore`** — use `@ts-expect-error` with comment
5. **Ignoring strict errors** — always fix properly
