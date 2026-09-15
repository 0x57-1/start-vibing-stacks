---
name: react-native-security
version: 1.0.0
description: >-
  Defensive storage and session security for Expo/React Native apps. Use when
  adding login, refresh tokens, tenant headers, biometric lock, or deep links.
  Not for bypassing SSL, root, or store DRM.
---

# React Native session security

## Tokens

| Store | Use |
|---|---|
| `expo-secure-store` (Keychain / Keystore) | `access_token`, `refresh_token` |
| `expo-secure-store` | `account_uuid` if it is a tenant secret in context |
| Memory (React state) | UI session flag only |
| `AsyncStorage` / MMKV without encryption | **Forbidden** for tokens |

Access token ~60 min; refresh is **one-time** on many APIs (rotate, then
invalidate the old one). Queue a **single** refresh; never fire two parallel
`/refresh` calls.

## HTTP

- One axios instance. `allowAbsoluteUrls: false`. `Authorization: Bearer`.
- Tenant header (e.g. `Plowf-Current-Account`) on every business route.
- `EXPO_PUBLIC_API_URL` is the API origin only — not a secret.

## Deep links + universal links

Allowlist scheme + host. Do not pass tokens in query strings.

## Android backup / iOS backup

Exclude token stores from auto-backup. SecureStore defaults are safer than
files in `DocumentDirectory`.

## Forbidden

| Action | Why |
|---|---|
| Token in `EXPO_PUBLIC_*` or `app.json` extra | Shipped in the binary |
| Log `Authorization` or refresh body | Leak |
| Certificate-pinning **bypass** / user-CA trust for prod | Weakens TLS |
| Root/jailbreak **bypass** as a product feature | Policy |

Pinning (optional hardening) is allowlisted hashes in **your** app, not
disabling TLS checks.

## See Also

- `react-native-secure-coding` — MASVS coding rules
- `react-native-http` — interceptor + refresh queue
- memory `react-native-authorization`
