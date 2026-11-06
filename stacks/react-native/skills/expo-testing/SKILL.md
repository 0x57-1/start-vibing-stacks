---
name: expo-testing
version: 1.0.2
description: >-
  Jest + React Native Testing Library for Expo apps. Use when writing
  *.test.ts(x), mocking SecureStore/axios, or running npm test. Not Vitest,
  not Playwright, not Detox unless the repo already has that runner.
---

# Expo testing (Jest + RNTL)

**ALWAYS use this skill on `react-native`.** Ignore `vitest-testing` and
Playwright. Maestro / Detox only if the repo already has the config.
Playwright is allowed only when the user asked to check Expo web and the
URL is `127.0.0.1` — then `playwright-automation` **2.1**. Never a store
page or a third-party site.

## Layout

```
lib/api/axios.test.ts
app/(auth)/login.test.tsx
```

Mirror a neighbour `*.test.tsx`. Prefer `npm test` from `active-project.json`.

## Render

```tsx
import { render, screen, userEvent } from '@testing-library/react-native';

render(<LoginScreen />);
expect(screen.getByLabelText('Email')).toBeOnTheScreen();
await userEvent.type(screen.getByLabelText('Email'), 'a@b.co');
```

Query by **text** or `accessibilityLabel`. Never `document`, CSS, or
`getByTestId` as the first choice.

## Mocks

```ts
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
```

Mock the axios instance in `lib/api/axios.ts`. Never put live `ak_…`
tokens or refresh bodies in fixtures.

## Rules the web `test-coverage` skill must NOT win

| Web rule | RN |
|---|---|
| Verify in database | No local DB unless the screen uses expo-sqlite |
| Never mock auth | **Do** mock SecureStore + 401 refresh |
| Playwright viewports | One phone width is enough (375) |
| E2E every page | Unit/RNTL for screens. A device boot is `expo-device`, after this suite is green |

## Forbidden

| Action | Why |
|---|---|
| Vitest / `bun run test` | Expo Jest |
| Playwright / `page.goto` | No DOM |
| Preline / `div` in a test | Native `View` / `Text` |
| `.skip` / `.only` committed | Hides red |

## See Also

- `react-native-a11y` — labels the queries need
- `react-native-http` — mock this client
- `test-coverage` — isolation / no `.skip` only
- `expo-device` — simulator, emulator, Expo Go, after Jest is green
