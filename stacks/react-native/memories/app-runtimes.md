---
version: 1.0.0
---

# Memory: App runtimes

> **ALWAYS LOAD** on the `react-native` stack. Skills: `expo-official`, `swift-macos`.

Two ways to run an app the model just wrote:

- **Expo / React Native.** Skill `expo-official` (snapshot of the
  Anthropic-verified Expo plugin). Read `upstream/expo-overview` first.
  Jest (`expo-testing`) before a device. Then `expo-device`: one iOS
  Simulator if Xcode is already there, otherwise Expo Go. SwiftUI controls
  go through `@expo/ui` (`upstream/expo-ui`). Do not submit to a store
  unless asked.
- **Native Swift, no Expo.** Skill `swift-macos`. `swift test` / `swift run`
  for a package. `xcodebuild` plus `open` for a Mac `.app`. One iOS
  Simulator only when the project is iOS and a simulator is already
  installed. Do not install Xcode unless asked.

Model id when the app calls Claude: `claude-opus-5-5`. Key from the
environment, never from a committed file.
