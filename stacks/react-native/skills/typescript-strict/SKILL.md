---
name: typescript-strict
version: 1.0.0
description: >-
  TypeScript strict mode for Expo/React Native. Use when writing .ts/.tsx,
  process.env access, or fixing tsc errors. Same rules as the Node skill.
---

# TypeScript Strict — Type Safety Patterns

**ALWAYS invoke when writing .ts/.tsx files.**

Expo public env is `process.env['EXPO_PUBLIC_*']` (bracket notation). Never
`process.env.EXPO_PUBLIC_API_URL`.

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

Use `"extends": "expo/tsconfig.base"` and keep `strict` on.

## Index Access

```typescript
const url = process.env['EXPO_PUBLIC_API_URL'] ?? '';
```

## FORBIDDEN

1. **`any`** — use `unknown` instead
2. **Non-null assertion without certainty**
3. **`@ts-ignore`** — use `@ts-expect-error` with comment
4. Treating `EXPO_PUBLIC_*` as a secret — it is compiled into the JS bundle
