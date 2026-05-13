---
name: playwright-automation
version: 2.0.0
description: "Playwright 1.60+ E2E and browser-automation patterns for 2026. Page Object Model, fixtures (auth + DB cleanup), multi-viewport (375 / 768 / 1280), trace viewer, UI Mode v2 (search + system theme), HAR recording (1.60), screencast API (1.59), Playwright Agents (planner/generator/healer, 1.56+), sharding for CI, accessibility snapshots. Invoke when writing E2E tests or browser automation."
---

# Playwright Automation — E2E Testing (1.60+)

**ALWAYS invoke when writing E2E tests or browser automation.**

> Pin Playwright in `package.json` and pin the matching browser binary version. Mismatch between client and browser is the #1 source of "flaky in CI" reports.

## Version policy (2026)

- **1.60** (current): HAR recording first-class API (`tracing.startHar()` / `stopHar()`), `locator.drop()`, `test.abort()`, aria-snapshot bounding-box.
- **1.59**: `page.screencast` (video with action annotations + real-time frames), `browser.bind()`.
- **1.58**: UI Mode + Trace Viewer search (`Cmd/Ctrl+F`), `system` theme, JSON auto-format, **CLI+SKILLs token-efficient mode** (relevant for AI-assisted authoring).
- **1.57**: aria snapshot improvements.
- **1.56**: **Playwright Agents** (planner / generator / healer) — AI-assisted test creation and self-healing locators.

```json
// package.json
"devDependencies": {
  "@playwright/test": "1.60.0"
},
"scripts": {
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:debug": "PWDEBUG=1 playwright test",
  "test:e2e:trace": "playwright show-trace test-results/trace.zip"
}
```

## Folder structure

```
tests/e2e/
├── fixtures/             # Auth, DB cleanup, custom fixtures
├── pages/                # Page Object Model
├── flows/                # User journey tests
├── api/                  # API-only tests (request fixture)
├── visual/               # Screenshot / aria-snapshot regressions
└── playwright.config.ts
```

## `playwright.config.ts` — production-ready baseline

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 4 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ...(process.env['CI'] ? [['github']] : []),
  ],
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:3000',
    trace: 'on-first-retry',           // saves cost; debug locally with --trace=on
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'webkit-tablet',    use: { ...devices['iPad (gen 7)'] } },
    { name: 'mobile-chrome',    use: { ...devices['Pixel 7'] } },
  ],
  webServer: process.env['CI'] ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
});
```

## Page Object Model

```typescript
// tests/e2e/pages/base.page.ts
import { type Page, type Locator, expect } from '@playwright/test';

export abstract class BasePage {
  protected readonly page: Page;
  constructor(page: Page) { this.page = page; }

  get loadingSpinner(): Locator { return this.page.getByTestId('loading-spinner'); }
  get errorMessage(): Locator { return this.page.getByTestId('error-message'); }

  async waitForLoad(): Promise<void> {
    await this.loadingSpinner.waitFor({ state: 'hidden' });
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.waitForLoad();
  }
}
```

## Fixtures — cleanup is mandatory

```ts
// tests/e2e/fixtures/auth.ts
import { test as base } from '@playwright/test';

type TestUser = { name: string; email: string; password: string };

function generateTestUser(): TestUser {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(7);
  return {
    name: `Test User ${ts}`,
    email: `testuser_${ts}_${rand}@test.com`,
    password: 'TestPassword123!',
  };
}

export const test = base.extend<{ user: TestUser }>({
  user: async ({ request }, use) => {
    const user = generateTestUser();
    await request.post('/api/test/users', { data: user });
    await use(user);
    await request.delete(`/api/test/users/${encodeURIComponent(user.email)}`); // cleanup
  },
});
```

The cleanup runs **even if the test fails** — fixtures unwind with try/finally semantics. Track every created entity in a fixture; never trust a test to clean up after itself.

## Selector priority (use locators, not CSS)

1. `getByRole('button', { name: 'Save' })` — accessibility-aware
2. `getByLabel('Email')` — form fields
3. `getByPlaceholder('Search...')` — when label is implied
4. `getByText('Welcome back')` — visible text content
5. `getByTestId('submit-button')` — escape hatch when above don't fit

CSS / XPath only as last resort. Prefer roles — they double as accessibility checks.

```html
<!-- Required data-testid on app-rendered elements -->
<input data-testid="email-input" />
<input data-testid="password-input" />
<button data-testid="submit-button" />
<div data-testid="error-message" />
<div data-testid="success-message" />
<div data-testid="loading-spinner" />
<nav data-testid="sidebar" />
<button data-testid="hamburger-menu" />
```

## Multi-viewport testing (375 / 768 / 1280)

```typescript
const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
] as const;

for (const viewport of viewports) {
  test.describe(`Responsive — ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });
    test('navigation adapts', async ({ page }) => { /* ... */ });
  });
}
```

## Aria snapshots — accessibility regression *(1.50+, improved in 1.60)*

```ts
// First run records snapshot:
await expect(page.locator('main')).toMatchAriaSnapshot();

// Subsequent runs assert structure stays the same — catches accessibility regressions
// Update with: npx playwright test --update-snapshots
```

## HAR recording *(1.60)*

```ts
// Record outbound network for replay or debugging
await context.tracing.startHar({ path: 'test.har' });
await page.goto('/checkout');
await context.tracing.stopHar();

// Replay against a recorded HAR (offline / deterministic tests):
await context.routeFromHAR('checkout.har', { update: false });
```

## Trace Viewer + UI Mode

```bash
npx playwright test --trace on             # full trace
npx playwright show-trace test-results/.../trace.zip
npx playwright test --ui                   # UI Mode v2 — Cmd/Ctrl+F search, system theme, single-worker
```

## Sharding for CI

```yaml
# Split a slow E2E suite across N runners
strategy:
  matrix:
    shardIndex: [1, 2, 3, 4]
    shardTotal: [4]
steps:
  - run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
```

Then merge HTML reports with `npx playwright merge-reports`.

## Playwright Agents *(1.56+, AI-assisted)*

The `planner`, `generator`, and `healer` agents support AI-driven test creation and self-healing locators. Useful when bootstrapping coverage on a legacy app, but **always commit human-reviewed tests** — never let an agent rewrite locked tests in CI without approval.

## FORBIDDEN

| Pattern | Why |
|---|---|
| Hardcoded test data (`test@test.com`) | Breaks parallel runs, leaves orphan rows |
| `.skip()` or `.only()` in committed code | Silently disables coverage |
| No fixture cleanup | Test DB fills with garbage |
| Mocked auth | Integration value lost; the real flow breaks unnoticed |
| Single viewport | Mobile breaks shipped to prod |
| `page.waitForTimeout(N)` | Flaky; use `waitFor`, `toBeVisible`, etc. |
| CSS selectors when a role / label exists | Loses accessibility coverage |
| `--no-deps` in CI install | Browser binaries silently outdated |

## See Also

- `test-coverage` — what to test, fixtures rules
- `accessibility-wcag22` — pair with `getByRole` + aria snapshots
- `ci-pipelines` — Playwright on CI (cache `~/.cache/ms-playwright`)
