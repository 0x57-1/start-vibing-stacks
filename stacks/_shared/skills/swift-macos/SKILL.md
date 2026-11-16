---
name: swift-macos
version: 1.0.0
description: >-
  Build and run a native Swift app on a Mac: Swift Package, Xcode
  macOS app, or iOS Simulator when the project is iOS. Use when the
  tree has Package.swift, an .xcodeproj, an .xcworkspace, or the user
  asks for a Swift or SwiftUI app. Not Expo and not React Native.
---

# Swift on the Mac

Opus 5.5 writes the app. This skill is how that app is built and opened
on the machine. There is no Anthropic skill corpus for SwiftUI. The
official Claude Code plugin for Swift is `swift-lsp@claude-plugins-official`
(SourceKit-LSP). It ships with Xcode. Install it only when the user asks:

```bash
claude plugin install swift-lsp@claude-plugins-official
```

## Toolchain

Do not download Xcode unless the user asked.

```bash
xcode-select -p
xcrun swift --version
```

If that fails, stop and say the Swift toolchain is missing. Do not start
a multi-gigabyte install on your own.

## Run

Swift package (`Package.swift`, no app target):

```bash
swift test
swift run
```

Mac app (`.xcodeproj` or `.xcworkspace`):

```bash
xcodebuild -list -project App.xcodeproj
xcodebuild -scheme App -destination 'platform=macOS' -derivedDataPath build build
open build/Build/Products/Debug/*.app
```

Use the scheme `xcodebuild -list` printed. Use `-workspace App.xcworkspace`
when a workspace is the entry. The app is running only after `open` and
a path that exists.

iOS app, same Mac, Simulator already installed:

```bash
xcrun simctl list devices available
xcodebuild -scheme App -destination 'platform=iOS Simulator,name=iPhone 16' -derivedDataPath build build
```

Boot one simulator that is already installed. Do not create a new runtime
and do not install Xcode.

## Claude from inside the app

When the app itself calls Claude, the model id is `claude-opus-5-5`.
On Apple Foundation Models (macOS 27 / Xcode 27 beta) the constant is
`.opus5_5` in `ClaudeForFoundationModels`. The key comes from the
environment. Do not write it into the repo.

## Forbidden

| Action | Why |
|---|---|
| Install Xcode unprompted | Hours and many GB |
| `eas submit` or an App Store upload | Only when the user asked to ship |
| Commit an API key | The key stays in the environment |
