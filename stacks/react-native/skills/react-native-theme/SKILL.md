---
name: react-native-theme
version: 1.0.0
description: >-
  Native theme for Expo: design-system tokens via StyleSheet or NativeWind.
  Use on any screen. Not Tailwind HTML, not Preline, not react-theme-parity
  Button variant CSS.
---

# React Native theme

Project `.claude/skills/design-system` is still the SoT for **decisions**
(color, type, spacing). **Implement** them with RN — not web recipes.

If `design-system` still mentions `uiStyles.js`, Preline, or
`react-theme-parity`, ignore those rows. Append a native Decision row
instead of pasting HTML.

## Tokens

One module (`lib/theme.ts` or `StyleSheet.create` per feature):

```ts
export const colors = {
  bg: '#0B0F14',
  fg: '#F4F6F8',
  accent: '#3D8BFF',
  danger: '#E24B4A',
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24 } as const;
```

`useColorScheme()` for dark / light. Do not ship a second ad-hoc palette
in a screen.

## Components

| Use | Not |
|---|---|
| `View` / `Text` / `Pressable` + `StyleSheet` | `div` / `className` HTML |
| NativeWind **only if** the repo already has it | Adding NativeWind mid-task to paste Tailwind |
| Parents pass **role** (`primary`, `ghost`) | Parents pass raw hex / margin soup |

A `<Button variant="primary" size="md">` on this stack is a **native**
Pressable you own — not the web `react-theme-apply` helper.

## Forbidden

| Action | Why |
|---|---|
| Preline / shadcn JSX | Web markup |
| `react-theme-parity` CSS pipeline | Web-only memory |
| Inline hex on every screen | Token drift |
| Card grid of 1k rows | Use `FlatList` (`react-native-patterns`) |

## See Also

- `design-system` — decisions
- `react-native-patterns` — lists / SafeArea
- `react-native-a11y` — labels + target size
- memory `react-native-theme.md`
