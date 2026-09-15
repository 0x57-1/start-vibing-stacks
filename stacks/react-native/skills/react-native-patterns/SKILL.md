---
name: react-native-patterns
version: 1.0.0
description: >-
  React Native UI patterns for Expo (lists, SafeArea, keyboard, 375px). Use
  when building screens. Not web Tailwind/Preline. Not Next.js.
---

# React Native UI patterns

This stack is **native views**, not a website.

| Use | Not |
|---|---|
| `View`, `Text`, `Pressable`, `TextInput` | `div`, `span`, `className` HTML |
| `FlatList` / `SectionList` | Card grids in a `ScrollView` of 1k rows |
| `SafeAreaView` / `react-native-safe-area-context` | Home-indicator overlap |
| `KeyboardAvoidingView` | Inputs hidden by the keyboard |

## Density

Mobile (375): **lists with dividers**, one primary CTA, bottom tabs or a
stack. Do not port web card dashboards.

## Theme

Project `.claude/skills/design-system` is still the SoT for **decisions**
(color, type, spacing). Implement with RN `StyleSheet` or NativeWind — do
**not** paste Preline HTML.

## Forms

`react-hook-form` + Zod is fine. Submit once; disable the button while
in-flight.

## See Also

- `expo-router` — screens
- `react-native-theme` — tokens / StyleSheet
- `react-native-a11y` — labels + 44pt
- `project-ui-standard` — seed/protect design-system
