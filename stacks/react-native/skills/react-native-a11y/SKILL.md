---
name: react-native-a11y
version: 1.0.0
description: >-
  VoiceOver / TalkBack labels, roles, and 44pt targets for Expo screens.
  Use when building forms, lists, or tabs. Not axe-core, not semantic HTML,
  not Playwright.
---

# React Native accessibility

The shared `accessibility-wcag22` skill is **web**. On this stack use
native props. Contrast and target-size ideas still apply.

## Required on every control

```tsx
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Sign in"
  accessibilityState={{ disabled: pending }}
  onPress={onSubmit}
>
  <Text>Sign in</Text>
</Pressable>
```

| Control | Role | Label |
|---|---|---|
| Primary action | `button` | Verb (“Sign in”, “Send PIX”) |
| Text field | default + `accessibilityLabel` | Field name, not the placeholder alone |
| Tab | `button` or `tab` | Tab name |
| Decorative icon | `accessible={false}` | — |

`accessibilityLabel` is what RNTL `getByLabelText` finds (`expo-testing`).

## Size + motion

- Hit target ≥ **44×44** pt (Apple HIG; larger than WCAG 24 CSS px).
- `allowFontScaling` on body text. Do not clip at 1.0.
- Respect `Reduce Motion` — skip looping animation when set.

## Forbidden

| Action | Why |
|---|---|
| `<button>` / `<label for>` / ARIA | Not the native tree |
| axe + Playwright as the gate | No DOM |
| Icon-only tab with no label | TalkBack silence |
| `accessible={false}` on a real control | Hidden from AT |

## See Also

- `expo-testing` — query by label
- `react-native-patterns` — lists
- `react-native-theme` — contrast tokens
