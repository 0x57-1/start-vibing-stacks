---
name: react-native-secure-coding
version: 1.0.0
description: >-
  OWASP MASVS-style secure coding for the user's Expo/React Native app. Use
  when reviewing app source, logging, WebViews, or store secrets. Defensive
  only — no exploit PoCs, no third-party app cracking.
---

# Mobile secure coding (owned app)

Scope: source **this repo** ships. Not assessment of third-party APK/IPA.

## Secrets

- No API keys, PIX keys, or refresh tokens in JS. Anything in the bundle is
  public. Use the user API (`/api/mobile/*`) with user credentials.
- `.env` → `.gitignore`. Commit `.env.example` with empty values.
- `EXPO_PUBLIC_*` is compiled in. Treat as public config.

## WebView

Default: **do not** embed the web panel in a WebView. Use native screens +
the mobile API. If a WebView is required: HTTPS only, no `javascript:` URLs,
no mixed content, disable file access.

## Logging

Never log tokens, passwords, 2FA codes, full PIX keys, or raw card data.
Redact in Sentry / console.

## Input

Zod-validate every API body. Amounts as numbers with min. PIX key types
enumerated (`DOCUMENT` / `EMAIL` / `PHONE` / `RANDOM`).

## 2FA

TOTP / email code on a dedicated screen. Throttle resend. Recovery codes
are single-use.

## Platform

- iOS ATS on. Android `usesCleartextTraffic` false in prod.
- Permissions: ask only when the screen needs camera/notifications.
- No `android:debuggable` in release.

## Forbidden

| Action | Why |
|---|---|
| Exploit PoC / Frida script | Dual-use |
| Shipping a debug menu that dumps SecureStore | Leak |
| Official bank UI as the app chrome | Impersonation (hard limit) |
| Hardcoded `ak_…` tokens | Stolen session |

## See Also

- `security-baseline` — generic OWASP
- `react-native-security` — storage / session
- memory `mobile-secure-coding`
