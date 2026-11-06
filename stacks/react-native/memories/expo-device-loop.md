---
version: 1.0.0
---

# Memory: Expo device loop

> **ALWAYS LOAD** on the `react-native` stack. Skill: `expo-device`.

## Order

1. `npx tsc --noEmit` and `npm test` (`expo-testing`, Jest + RNTL). A red test stops the task.
2. A visible screen, or a native module Expo Go cannot load: boot **one** device with `expo-device`. On a Mac, the iOS Simulator when Xcode is installed. An Android emulator only when an AVD already exists, or the user asked to install Android. Expo Go when the target is a phone on the same Wi-Fi.
3. A flow Jest cannot see (multi-screen, photo picker, share sheet): Maestro, if `e2e/` or `.maestro/` exists, or if the user asked for that flow.
4. An APK, AAB, or IPA: `eas-release`. No submit unless they asked to ship.

## Do not

- Boot a simulator for a store, hook, or type change.
- Install Android Studio or Xcode without being asked.
- Use Playwright on a native screen.
- Say the device passed when it never opened.
