---
name: react-native-http
version: 1.0.0
description: >-
  Axios client for Expo apps talking to a user mobile API. Use when adding
  login, refresh, tenant headers, or list/create payments. Axios ≥ 1.20.0
  with allowAbsoluteUrls false.
---

# React Native HTTP (axios)

One instance in `lib/api/axios.ts`. Never `fetch()` for JSON APIs on this
stack (project HTTP rule).

```typescript
import axios from 'axios';

const baseURL = process.env['EXPO_PUBLIC_API_URL'] ?? '';

export const api = axios.create({
  baseURL,
  allowAbsoluteUrls: false,
  headers: { Accept: 'application/json' },
});
```

## Interceptors

1. Attach `Authorization: Bearer <access>` from SecureStore.
2. Attach tenant header from SecureStore (`EXPO_PUBLIC_ACCOUNT_HEADER` name,
   default `Plowf-Current-Account` only when the API requires it).
3. On 401: single-flight refresh (`POST /auth/refresh` with **no** Bearer),
   rotate both tokens, retry the original request once.
4. Refresh is one-time: a second parallel refresh invalidates the first.

Guest routes (`/auth/login`, `/auth/two-factor/*`, `/auth/refresh`) must
**not** send the old Bearer.

## Zod

Parse `data` from `{ data: T }`. Fail closed on unknown shapes.

## See Also

- `react-native-security` — where tokens live
- `react-native-zod` — parse envelopes
- `react-native-query` — queryFn uses this client
- `expo-router` — redirect to login on refresh failure
