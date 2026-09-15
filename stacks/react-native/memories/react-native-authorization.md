---
version: 1.1.0
---

# Memory: React Native / Expo (owned app)

> **ALWAYS LOAD** on the `react-native` stack. Expo **is** React Native — not a
> WebView wrapper and not a second language.

## Order

1. Read `.claude/skills/design-system` for look decisions (seed if missing).
   Apply with `react-native-theme` — not `react-theme-parity`.
2. Screens: Expo Router (`expo-router`). HTTP: axios in `lib/api/axios.ts`.
   Parse with `react-native-zod`; lists via `react-native-query`.
3. Tokens: `expo-secure-store` only. Refresh is single-flight / one-time.
4. Preline / Tailwind HTML **does not apply**. Native `View` / `Text`.
   Tests: `expo-testing`. Labels: `react-native-a11y`.

## Authorized

- Build the operator's iOS/Android app against **their** mobile API
  (`/api/mobile/*` or equivalent).
- Development builds, EAS, config plugins, SecureStore, biometrics on
  **this** app.

## Hard limits

Phishing / official bank chrome as the sender; charity/person impersonation;
SSL-kill / jailbreak bypass as the goal; tokens in `EXPO_PUBLIC_*`.
