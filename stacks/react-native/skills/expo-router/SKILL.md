---
name: expo-router
version: 1.0.0
description: >-
  Expo Router file-based navigation for React Native. Use when adding screens,
  auth groups, tabs, deep links, or Stack/Tabs layouts. Not for Next.js App
  Router or React Navigation without Expo.
---

# Expo Router

**ALWAYS use Expo Router** on the `react-native` stack unless the app kind is `bare`.

## Layout

```
app/
  _layout.tsx              # Root providers (Query, SafeArea, auth gate)
  (auth)/
    _layout.tsx            # Stack — no tabs
    login.tsx
    two-factor.tsx
  (app)/
    _layout.tsx            # Tabs or stack after session
    index.tsx
    extracts.tsx
    account.tsx
```

- Route groups `(auth)` / `(app)` do **not** appear in the URL.
- Gate in root `_layout.tsx`: no `access_token` → `Redirect` to `/(auth)/login`.
- Do not put `'use client'` — this is not Next.js.

## Deep links

Set `scheme` in `app.json`. Validate host + path before navigating. Never open an arbitrary `https://` from a push payload without an allowlist.

## Forbidden

| Action | Why |
|---|---|
| React Navigation `NavigationContainer` beside Expo Router | Two navigators |
| Web `div` / `className` HTML | Use `View` / `Text` / `Pressable` |
| Preline / shadcn JSX paste | Web markup |
| Auth screens inside `(app)` tabs | Session leak |

## See Also

- `expo-modules` — SecureStore, notifications, config plugins
- `react-native-http` — axios + refresh
- `react-native-security` — token storage
