---
name: test-coverage
version: 1.0.0
---

# Test Coverage — Testing Management

**ALWAYS invoke AFTER implementing any feature. Do NOT skip.**

## Critical Rules

1. **CLEANUP ALL TEST DATA** — fixture-based tracking
2. **VERIFY IN DATABASE** — check DB state after UI actions
3. **TEST ALL VIEWPORTS** — desktop, tablet, mobile minimum
4. **REAL AUTH ONLY** — never mock authentication
5. **UNIQUE DATA** — timestamps in emails/names
6. **NO `.skip()`** — never in committed code

## Files That NEED Tests

| Type | Test Expected | Required |
|------|--------------|----------|
| API Route | Unit + E2E | **YES** |
| Model/Entity | Unit | **YES** |
| Page/View | E2E flow | **YES** |
| Component (interactive) | E2E | YES |
| Hook/Service | Unit | YES |
| Utility (exported) | Unit | YES |

## Required E2E Flows

- [ ] Registration — create user, verify in DB
- [ ] Login/Logout — auth state changes
- [ ] CRUD Create — item created, visible, in DB
- [ ] CRUD Read — item displayed correctly
- [ ] CRUD Update — changes reflected in DB
- [ ] CRUD Delete — removed from DB
- [ ] Permissions — forbidden requests blocked
- [ ] Responsive — works on all viewports

## Stack-Specific Commands

### PHP (PHPUnit + Pest)
```bash
./vendor/bin/phpunit
./vendor/bin/pest --coverage --min=70
```

### Node.js (Vitest + Playwright)
```bash
npx vitest run --coverage
npx playwright test
npx playwright test --ui
```

## Before Commit Checklist

- [ ] All new features have tests?
- [ ] Tests use fixtures for cleanup?
- [ ] Database state verified after UI actions?
- [ ] Tests run on all viewports?
- [ ] Coverage threshold met (≥70%)?
- [ ] No `.skip()` in tests?
- [ ] All tests passing?

## FORBIDDEN

1. **Skipping tests** — `test.skip()`, `.only()`
2. **Mocking auth** — use real authentication
3. **Fixed test users** — `test@test.com` → generate unique
4. **No cleanup** — orphaned test data
5. **No DB validation** — trusting UI without checking DB
