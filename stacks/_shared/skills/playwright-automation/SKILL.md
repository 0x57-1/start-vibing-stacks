---
name: playwright-automation
version: 1.0.0
---

# Playwright Automation — E2E Testing

**ALWAYS invoke when writing E2E tests or browser automation.**

## Structure

```
tests/e2e/
├── fixtures/          # Auth, DB cleanup, custom fixtures
├── pages/             # Page Object Model
├── flows/             # User journey tests
├── api/               # API-only tests
└── playwright.config.ts
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

## Auth Fixture

```typescript
export function generateTestUser(): TestUser {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(7);
  return {
    name: `Test User ${ts}`,
    email: `testuser_${ts}_${rand}@test.com`,
    password: 'TestPassword123!',
  };
}
```

## Multi-Viewport Testing

```typescript
const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
] as const;

for (const viewport of viewports) {
  test.describe(`Responsive - ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });
    test('navigation adapts', async ({ page }) => { /* ... */ });
  });
}
```

## Required data-testid

```html
<input data-testid="email-input" />
<input data-testid="password-input" />
<button data-testid="submit-button" />
<div data-testid="error-message" />
<div data-testid="success-message" />
<div data-testid="loading-spinner" />
<nav data-testid="sidebar" />
<button data-testid="hamburger-menu" />
```

## FORBIDDEN

1. **Hardcoded test data** — generate unique data with timestamps
2. **`.skip()` or `.only()`** — never in committed code
3. **No cleanup** — always track + clean created data
4. **Mocked auth** — use real authentication flows
5. **Single viewport** — test mobile + tablet + desktop
