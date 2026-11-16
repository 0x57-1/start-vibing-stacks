---
name: expo-official
version: 1.0.0
description: >-
  Official Expo skills (expo/skills, Anthropic-verified plugin
  expo@claude-plugins-official) for writing and running a React Native
  app, including SwiftUI through @expo/ui. Use when the project has an
  expo dependency, an app.json, or the user asks for an Expo or React
  Native app. Load this before choosing an expo-* or eas-* skill.
---

# Official Expo skills

The files under `upstream/` are an unmodified copy of
[expo/skills](https://github.com/expo/skills) `plugins/expo/skills` at
`dfdebcc6c4c1bf7a9471cefd6b6f39c7ba6c884d` (2026-11-15).
License: `UPSTREAM-LICENSE` (MIT, Copyright 2025-present 650 Industries, Inc.).

Anthropic lists that plugin as `expo@claude-plugins-official`.
Install in Claude Code, when the user asks for the live plugin:

```bash
claude plugin install expo@claude-plugins-official
```

This package already contains the snapshot, so the agent can follow it
without that install.

## Read order

1. Read `upstream/expo-overview/SKILL.md` before writing Expo code.
2. Read the one skill it routes to. Paths are `upstream/<name>/SKILL.md`.
3. Then apply the start-vibing-stacks rules below. They win on conflict.

| Goal | Official file |
|---|---|
| Native controls, SwiftUI on iOS, Jetpack Compose on Android | `upstream/expo-ui/SKILL.md` |
| Menus, sheets, icons, media, gradients | `upstream/expo-native-ui/SKILL.md` |
| Motion | `upstream/expo-animation/SKILL.md` |
| Navigation and screens | `upstream/expo-router/SKILL.md` |
| Data | `upstream/expo-data-fetching/SKILL.md` |
| A screen that must look native | `upstream/expo-design-system/SKILL.md` |
| Dev client, modules, upgrade, brownfield, DOM, App Clip | the matching `upstream/expo-*` file |
| EAS build, update, hosting, observe | the matching `upstream/eas-*` file |

## Rules that win

| Topic | Do |
|---|---|
| Tests | `expo-testing` (Jest + RNTL) before any simulator. |
| Boot | `expo-device`. One iOS Simulator when Xcode is already installed. Otherwise Expo Go. Android only when an AVD already exists. |
| Toolchain | Do not install Xcode or Android Studio unless the user asked. |
| Store | `eas-release` builds the binary. `eas submit` and TestFlight only when the user asked to ship. |
| Tokens | SecureStore. Nothing secret in `EXPO_PUBLIC_*`. |
| Native modules | `expo-modules` for the package's module loop. Read `upstream/expo-module` for the Expo API shape. |

A bare React Native app with no `expo` dependency is not this skill.
Boot it with the repo's own `npm test` and the existing native runner.
A Mac app written in Swift, with no Expo, is `swift-macos`.
