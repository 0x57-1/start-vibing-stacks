---
version: 1.0.0
---

# Memory: Expo Router + native modules

> File-based routes and Expo SDK modules for iOS and Android.

- Groups: `(auth)` vs `(app)`. Gate on SecureStore session in root layout.
- New native capability → Expo module + config plugin → **development
  build** (not Expo Go).
- CNG: do not hand-edit `ios/` `android/` if `npx expo prebuild` owns them.
- Deep links: allowlist `scheme` + host. No tokens in the query string.

Skills: `expo-router`, `expo-modules`, `eas-release`.
