# {{PROJECT_NAME}}

> **CHARACTER LIMIT**: Max 40,000 chars. Validate with `wc -m CLAUDE.md` before commit.

## Recent Changes

<!-- APPEND-ONLY LIFO. Each Claude instance PREPENDS a new `### YYYY-MM-DD · branch · vX.Y.Z` heading
     + 1-4 lines below it. Drop only the OLDEST entry when count > 10. NEVER edit a peer's entry. -->

### {{DATE}} · main · v0.1.0
Initial project setup with start-vibing-stacks (React Native / {{FRAMEWORK}}).

## 30 Seconds Overview

{{PROJECT_NAME}} is an Expo / React Native app (iOS + Android). Expo **is**
React Native — native views, not a WebView. HTTP talks to the product mobile
API. Tokens live in SecureStore.

## Stack

| Component | Technology |
|-----------|------------|
| Runtime | Expo SDK 54+ / React Native |
| Language | TypeScript **strict mode** |
| App kind | {{FRAMEWORK}} |
| Local DB | {{DATABASE}} |
| Navigation | Expo Router |
| HTTP | Axios ≥ 1.20.0 (`allowAbsoluteUrls: false`) |
| Tokens | expo-secure-store |
| Release | EAS Build / Submit / Update |

## Architecture

```
project/
├── CLAUDE.md
├── app/                    # Expo Router
│   ├── _layout.tsx
│   ├── (auth)/             # login / 2FA (auth-panel kind)
│   └── (app)/              # session screens
├── lib/api/axios.ts        # Bearer + optional tenant header
├── .claude/skills/         # expo-router, security, eas-release, …
└── .env.example            # EXPO_PUBLIC_API_URL only (public)
```

## Workflow

```
0. INIT → commit-manager
1. Screens → Expo Router groups
2. API → axios + Zod (never fetch for JSON)
3. Tokens → SecureStore; single-flight refresh
4. TEST → tester + `expo-testing` (Jest + RNTL, not Vitest)
5. DATA → `react-native-query` + `react-native-zod`
6. UI → `react-native-theme` + `react-native-a11y` (not react-theme-parity)
7. SECURITY → security-auditor §4.RN (not web overlay)
8. QUALITY → tsc && lint (`quality-gate` § RN)
9. DOCS → documenter (Expo paths) → domain-updater
10. VALIDATE → stop-validator
```

## Critical Rules

- No `div` / Preline / shadcn HTML. `View` / `Text` / `Pressable`.
- `process.env['EXPO_PUBLIC_API_URL']` — public origin, not a secret.
- Guest auth routes send **no** Bearer.
- `EXPO_PUBLIC_*` is compiled into the binary.

## Forbidden

| Action | Why |
|--------|-----|
| Tokens in AsyncStorage | Leak |
| Parallel `/auth/refresh` | One-time refresh dies |
| WebView of the web panel by default | Use the mobile API |
| Exploit / SSL-kill / jailbreak bypass | Policy |
| Official bank chrome as this app | Impersonation |

## Active Memories

- `react-native-authorization.md`
- `expo-router-modules.md`
- `mobile-secure-coding.md`
- `react-native-theme.md` (replaces web `react-theme-parity` on this stack)
