---
name: react-native-query
version: 1.0.0
description: >-
  TanStack Query on Expo: QueryClient in root layout, refetch on focus,
  persist optional, 401 retry after single-flight refresh. Use when adding
  lists, account, or session hydration. Not Next.js RSC / server actions.
---

# TanStack Query (React Native)

One `QueryClient` in root `app/_layout.tsx`. Screens call hooks — they do
not create a second client.

## Client

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

Use `@tanstack/query-sync-storage-persister` + SecureStore **only** for
non-secret cache (lists). Never persist `access_token` in Query cache
files — tokens stay in SecureStore (`react-native-security`).

## App state

- `AppState` → `focusManager.setFocused` so lists refetch when the app
  returns to the foreground.
- `NetInfo` → `onlineManager.setOnline` when the project already depends
  on `@react-native-community/netinfo`. Do not add the dep just to look busy.

## Keys

```ts
['account'] 
['extracts', accountId]
['providers']
```

Include the tenant `accountId` in the key. After account switch, invalidate
or `queryClient.clear()`.

## Mutations

Optimistic update + rollback (`onError` restore). Disable the submit button
while `isPending`. On 401 the axios interceptor refreshes once; do not
open a second refresh from `onError`.

## Hydration

Session flag from SecureStore in root layout. Queries that need a token
use `enabled: Boolean(accessToken)`.

## Forbidden

| Action | Why |
|---|---|
| Token in persisted Query cache | Leak |
| `fetch` inside `queryFn` | Use `lib/api/axios.ts` |
| New QueryClient per screen | Cache split |
| Invalidate on every keystroke | Thrash |

## See Also

- `react-native-http` — axios + refresh
- `react-native-zod` — parse `data` before `queryFn` returns
- `expo-router` — provider in root layout
