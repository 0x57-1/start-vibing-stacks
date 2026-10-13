---
name: playwright-automation
version: 2.1.0
description: "Playwright 1.64 agent walk before deploy, plus committed E2E. Local harness, then the Playwright plugin (navigate, click, fill, console, screenshot) on 127.0.0.1. CLI screenshot when only a picture is needed. A measure script for contrast only. PHP, Node, Python. Expo native stays on Jest. Never a third-party site in that browser."
---

# Playwright — walk the local app, then commit the test

**Invoke before claiming a web screen or flow is done, and when writing E2E.**

Claude, Grok, Kimi, and Cursor all use this file. Grok also gets a copy under `.grok/skills/playwright-automation/`.

## What gives the agent the page

Three tools. They are not substitutes.

| Tool | Use it for | Skip it for |
|---|---|---|
| **Playwright plugin** (`browser_navigate`, `browser_click`, `browser_fill_form`, `browser_evaluate`, `browser_take_screenshot`, `browser_console_messages`, `browser_snapshot`, `browser_resize`, `browser_close`) | Walking a flow. The tree tells the next click. Console shows the JS error. | A single picture. A third-party site. |
| **`playwright-cli`** (`@playwright/cli` **0.1.22**, same line as Playwright 1.64) | One screenshot. `playwright-cli open http://127.0.0.1:<port>` then `playwright-cli screenshot --filename=page.png`. Smaller context than the plugin tree. | A flow that depends on what the page contains. |
| **Measure script** (`browser_evaluate` + `getComputedStyle`, or a short local script) | Contrast and computed color. Numbers, not a guess from the picture. | The only check of a flow. |

Order: boot the local target, walk with the plugin, measure only when the question is numeric, close the browser.

The plugin name depends on the client (`mcp__plugin_playwright_playwright__…` or `mcp__playwright__…` from `@playwright/mcp` in `.claude/settings.json`). Call the action. Do not invent a second browser stack.

## Local target (do this before the first navigation)

Use the harness the repo already has.

| Stack | Boot | Isolated how |
|---|---|---|
| **PHP** | `composer harness` when `scripts/harness-serve.sh` exists. Otherwise `php artisan serve --host=127.0.0.1` only if that process already points at a local database. | SQLite file recreated on boot. Captcha off and `SESSION_SECURE_COOKIE=false` only in **that process env**. Seeder refuses `APP_ENV=production`. |
| **Node** | `webServer` in `playwright.config.ts`, or the repo's dev script bound to `127.0.0.1`. | Test database URL. Not the database the developer is using. |
| **Python** | `uvicorn` / `manage.py runserver` on `127.0.0.1`. | Test database URL in that process. Not the dev database. |
| **React Native** | Do **not** boot Playwright. `expo-testing` (Jest + RNTL). | Playwright only if the user asked to check **Expo web** and the URL is localhost. |

Cookie SPA login (Sanctum or equivalent): one in-page `fetch` for the CSRF cookie and the login POST. A navigation between two `evaluate` calls drops the cookie. `page.request` does not share that CSRF. Do not print the seed password, the cookie, or the CSRF token.

Add a harness only when login, captcha, or a shared database would block the walk. Do not point it at production.

## Committed tests, after the walk

Promote a flow that must stay green. Match what the repo already pins. Do not upgrade the test framework just to look at a page.

- **PHP.** If `pestphp/pest-plugin-browser` is installed: `visit('/')->click('Sign in')->assertSee('…')` in `tests/Browser`. Plugin **5.0.1** (2026-08-10) requires Pest `^5` and PHP `^8.4`. A lockfile still on Pest 4 stays on the 4.x plugin. Gitignore `tests/Browser/Screenshots` and `tests/Browser/Traces`. Pest starts its own local Playwright; there is no supported remote-server switch.
- **Node.** `@playwright/test` **1.64.0** (stable 2026-10-07). `1.65.0` is alpha — do not pin it. Browsers: Chromium 156, Firefox 157, WebKit 27.2. After the pin: `npx playwright install`. CI image: `mcr.microsoft.com/playwright:v1.64.0-noble`.
- **Python.** `pytest-playwright` only when the repo already has it or the user asked for a suite. Same Playwright **1.64** pin.
- **React Native.** No Playwright suite. Jest + RNTL.

## Version policy (2026-10-13)

- **1.64** (current stable): `testProject.default: false` so a plain `npx playwright test` runs Chromium only; CI adds `--project="*"`. `--shuffle` finds order-dependent tests. `locator.within()` scopes a role inside a card. `page.webmcp` tests tools a page exposes to assistants — it does not replace locators on the app.
- **1.60**: HAR (`tracing.startHar()` / `stopHar()`), `locator.drop()`, `test.abort()`.
- **1.58**: CLI + skills for a token-cheap picture (`playwright-cli`).
- **1.56**: planner / generator / healer. Commit only tests a person has read.

```json
"devDependencies": {
  "@playwright/test": "1.64.0"
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
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',           // saves cost; debug locally with --trace=on
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'webkit-tablet', use: { ...devices['iPad (gen 7)'] }, default: false },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] }, default: false },
  ],
  webServer: process.env['CI'] ? undefined : {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000',
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
| Production URL as `baseURL` | The walk mutates real users. Default is `127.0.0.1`. Staging only when the user named `E2E_BASE_URL`. |
| Third-party origin in this browser | Research uses WebFetch / web-scraper. A brand site in Playwright is not a test and fills the context. |
| Printing Cookie, Set-Cookie, CSRF, Authorization, or the harness password | The page works without those values in the chat. |
| Committing `.playwright-data/`, `test-results/`, HAR, or traces | They hold session cookies. |
| Captcha-off or `SESSION_SECURE_COOKIE=false` in the production env file | Those overrides belong to the harness process only. |
| Disabling TLS certificate checks | A local UI walk does not need that. |
| Headless measure script as the only check of a flow | Numbers do not show a broken modal. Walk first. |
| Playwright on Expo native screens | Jest + RNTL. Localhost Expo web only when the user asked. |
| Pinning Playwright `1.65` alpha | Stable pin is `1.64.0`. |
| Leaving the browser open after the walk | `browser_close`. The next task must not inherit the logged-in session. |

## See Also

- `test-coverage` — what to test, fixtures rules
- `accessibility-wcag22` — pair with `getByRole` + aria snapshots
- `ci-pipelines` — Playwright on CI (cache `~/.cache/ms-playwright`)
