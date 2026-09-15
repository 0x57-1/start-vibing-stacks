---
version: 1.0.0
---

# Memory: React Native theme (owned Expo app)

> **ALWAYS LOAD** on `react-native`. Replaces web `react-theme-parity` on
> this stack — do not apply CSS tokens / `uiStyles.js` / `<Button variant>`
> from the web pipeline.

## Order

1. Read `.claude/skills/design-system` for **decisions** (seed if missing).
2. Implement with `StyleSheet` or existing NativeWind — skill
   `react-native-theme`.
3. Lists / SafeArea: `react-native-patterns`. Labels: `react-native-a11y`.

## Do not

- Load or follow `react-theme-parity.md` / `react-theme-apply`.
- Paste Preline, shadcn, or Tailwind HTML into a native screen.
