---
name: expo-modules
version: 1.0.1
description: >-
  Expo modules and config plugins for iOS and Android. Use when adding
  SecureStore, camera, notifications, splash, permissions, or a development
  build. Not for writing exploits or bypassing OS security.
---

# Expo modules (iOS + Android)

Prefer **Expo SDK modules** over community native forks. Add a module, then
`npx expo prebuild` only when you need a **development build** (custom native
code). Expo Go is for prototypes.

## Config plugins

Declare plugins in `app.json` / `app.config.ts`. Do not hand-edit
`ios/` or `android/` if the project is CNG (Continuous Native Generation) —
your edits die on the next prebuild.

```json
{
  "expo": {
    "plugins": [
      "expo-secure-store",
      ["expo-notifications", { "sounds": [] }],
      "expo-camera"
    ]
  }
}
```

## Common modules

| Need | Package |
|---|---|
| Tokens | `expo-secure-store` |
| Push | `expo-notifications` |
| Camera (user-owned capture) | `expo-camera` |
| Biometrics | `expo-local-authentication` |
| Clipboard | `expo-clipboard` (never auto-read) |
| Updates | `expo-updates` (EAS Update) |

## Development builds

`npx expo run:ios` / `run:android` or EAS. Required as soon as a config plugin
or custom native module is in the app. How to boot the simulator is
`expo-device`.

## Forbidden

| Action | Why |
|---|---|
| Symlink `ios/` into git then prebuild --clean | Lost work |
| Jailbreak / Frida / SSL-kill | Not authorized here |
| Copy a 100 MB native SDK into the repo | Use the Expo package |
| `expo install` skipped after SDK bump | Native mismatch |

## See Also

- `eas-release` — store binaries
- `react-native-security` — where tokens live
