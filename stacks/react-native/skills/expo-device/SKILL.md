---
name: expo-device
version: 1.0.0
description: >-
  Boot an Expo app on the iOS Simulator, an Android emulator, or Expo Go,
  and run the device checks Jest cannot see. Use on a Mac when a React
  Native screen or native module must be proven on a device. Not Vitest,
  not Playwright, not a store submit.
---

# Expo device loop

Jest stays in `expo-testing`. A store binary stays in `eas-release`.
This skill is the boot: simulator, emulator, Expo Go, dev build, and
Maestro when a flow needs a real device.

## Pick the lightest run

| Need | Do |
|---|---|
| Logic, store, form, label | `npm test`. Do not boot a simulator. |
| A screen the user will look at, JS only | Boot one simulator or Expo Go. |
| Config plugin, camera, or a native module Expo Go cannot load | Dev build (`expo run:ios` / `expo run:android`). |
| APK, AAB, or IPA | `eas-release`. Do not submit unless asked. |

Required before calling a screen done:

```bash
npx tsc --noEmit
npm test
```

Run `npm run lint` when that script exists. Then boot a device only for the row above.

## See what this Mac already has

```bash
xcode-select -p
xcrun simctl list devices available
```

Android SDK, when present, is usually `~/Library/Android/sdk`:

```bash
"$HOME/Library/Android/sdk/emulator/emulator" -list-avds
"$HOME/Library/Android/sdk/platform-tools/adb" devices
```

## iOS Simulator

Xcode is required. If `xcode-select -p` fails, say so. Do not download Xcode unless the user asked.

```bash
npx expo start --ios
```

That boots one Simulator and opens the app. Leave it running until the screen is checked, then stop the Expo process. Do not boot every device in the list.

## Android emulator

If `-list-avds` prints a name:

```bash
"$HOME/Library/Android/sdk/emulator/emulator" -avd <name> -no-snapshot-save
"$HOME/Library/Android/sdk/platform-tools/adb" wait-for-device
npx expo start --android
```

If there is no SDK and the user did not ask for Android, stop. Report the Jest result and that Android is not installed. Android Studio is several GB. Do not install it on your own.

## Expo Go

Same Wi-Fi as the phone: `npx expo start`. The person scans the QR code. Do not claim the screen was verified if nobody opened it.

## Dev build

```bash
npx expo run:ios
npx expo run:android
```

The first run compiles native code. A later run reuses it. Expo Go is the wrong target once a config plugin is in the app.

## Maestro

Use it for a path Jest cannot see (navigation across screens, the photo picker, the share sheet). If `e2e/` or `.maestro/` already exists, run that folder:

```bash
maestro test e2e
```

or `maestro test .maestro`, matching the repo.

If the user asked for that flow and `maestro` is missing, install it from the official Maestro macOS guide. It needs Java 17. Write one flow for the path they named. Do not add Detox or Playwright for a native screen.

## Forbidden

| Action | Why |
|---|---|
| Playwright / `page.goto` on a native screen | No DOM |
| `eas submit` or a Play upload | Only when the user asked to ship |
| Install Android Studio or Xcode unprompted | Hours and many GB |
| Claim the emulator passed when it never booted | The log has to show the device |

## See Also

- `expo-testing` — Jest + RNTL, always first
- `eas-release` — the binary, after the device boot works
- `expo-modules` — when Expo Go is no longer enough
