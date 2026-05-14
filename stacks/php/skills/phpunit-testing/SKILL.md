---
name: phpunit-testing
version: 2.0.0
description: "PHP testing for 2026 — covers PHPUnit 12 (released 2025, foundation for Pest 4) and Pest 4 (March 2026: 20-30% faster, browser testing via Playwright, visual regression, smoke testing, sharding for CI parallelization, mutation testing). Includes Unit / Feature / Browser / Architecture test layout, AAA pattern, data providers / datasets, mocking, fixtures, dataset sharding, coverage thresholds. Invoke when authoring tests, choosing PHPUnit vs Pest, configuring sharding/parallel, or wiring CI test stages."
---

# PHP Testing — PHPUnit 12 & Pest 4 (2026)

**ALWAYS invoke when writing tests, choosing the framework, or wiring CI sharding.**

> Pest 4 (Mar 10, 2026) is built on PHPUnit 12. New projects in 2026: prefer **Pest 4** for ergonomics and built-in browser/visual testing; stay on **PHPUnit 12** if your team has muscle memory or you need raw assertion control.

## Framework Choice

| Need | Pick |
|---|---|
| New Laravel app, want fluent expectation API + browser tests | **Pest 4** |
| Plain PHP library, prefer xUnit-classic | **PHPUnit 12** |
| Big legacy PHPUnit suite | **PHPUnit 12** (don't migrate just for migration's sake) |
| Need visual regression / Playwright in PHP | **Pest 4** (built-in) |

Both share the same engine — assertions, mocks, runners are interoperable through Pest's PHPUnit base. Pest is a thin DSL on top.

## Setup

### Pest 4 (recommended for new Laravel projects)

```bash
composer require --dev pestphp/pest "^4.0"            # PHP 8.3+
composer require --dev pestphp/pest-plugin-laravel "^4.0"
./vendor/bin/pest --init
```

### PHPUnit 12

```bash
composer require --dev phpunit/phpunit "^12.0"
```

## File Layout

```
tests/
├── Pest.php                      # Pest config (test dirs, datasets, helpers)
├── TestCase.php                  # Shared base
├── Unit/
│   ├── Services/UserServiceTest.php
│   └── Helpers/StringHelperTest.php
├── Feature/
│   └── Api/UserApiTest.php
├── Browser/                      # Pest 4 — Playwright-backed
│   └── LoginFlowTest.php
└── Arch/                         # Pest — architecture rules
    └── LayerBoundariesTest.php
phpunit.xml                       # used by both Pest & PHPUnit
```

## `phpunit.xml` — production-grade baseline

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
    bootstrap="vendor/autoload.php"
    colors="true"
    cacheDirectory=".phpunit.cache"
    requireCoverageMetadata="true"
    beStrictAboutCoverageMetadata="true"
    beStrictAboutOutputDuringTests="true"
    failOnRisky="true"
    failOnWarning="true"
    executionOrder="random">

    <testsuites>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="Feature">
            <directory>tests/Feature</directory>
        </testsuite>
        <testsuite name="Browser">
            <directory>tests/Browser</directory>
        </testsuite>
    </testsuites>

    <source>
        <include>
            <directory>app</directory>
        </include>
    </source>

    <coverage includeUncoveredFiles="true">
        <report>
            <clover outputFile="coverage.xml"/>
            <text outputFile="php://stdout" showOnlySummary="true"/>
        </report>
    </coverage>

    <php>
        <env name="APP_ENV" value="testing"/>
        <env name="DB_CONNECTION" value="sqlite"/>
        <env name="DB_DATABASE" value=":memory:"/>
    </php>
</phpunit>
```

## Pest 4 — patterns

### Unit + Feature

```php
// tests/Unit/Services/UserServiceTest.php
use App\Services\UserService;

beforeEach(fn () => $this->service = new UserService);

it('creates a user with valid data', function () {
    $user = $this->service->create(['name' => 'John', 'email' => 'john@test.com']);

    expect($user)
        ->name->toBe('John')
        ->email->toBe('john@test.com');
});

it('rejects invalid email', function () {
    $this->service->create(['name' => 'John', 'email' => 'invalid']);
})->throws(InvalidArgumentException::class, 'Invalid email');

dataset('invalid_users', [
    'empty name'  => [['name' => '',     'email' => 'a@b.com'], 'Name required'],
    'empty email' => [['name' => 'John', 'email' => ''],        'Email required'],
    'no data'     => [[],                                        'Name required'],
]);

it('rejects invalid data', function (array $data, string $expected) {
    $this->service->create($data);
})->with('invalid_users')->throws(InvalidArgumentException::class);
```

### Browser test (Pest 4 — Playwright-backed)

```php
// tests/Browser/LoginFlowTest.php
use function Pest\Browser\visit;

it('logs the user in', function () {
    visit('/login')
        ->fill('email',    'user@test.com')
        ->fill('password', 'secret')
        ->press('Sign in')
        ->assertPathIs('/dashboard')
        ->assertSee('Welcome back');
});

// Multi-viewport smoke
it('login page is responsive', function (string $device) {
    visit('/login')
        ->onDevice($device)            // 'iphone-14', 'ipad', 'desktop-1280'
        ->assertNoConsoleErrors()
        ->assertNoBrokenLinks()
        ->screenshot();
})->with(['iphone-14', 'ipad', 'desktop-1280']);
```

### Architecture test (Pest)

```php
// tests/Arch/LayerBoundariesTest.php
arch('controllers do not call DB directly')
    ->expect('App\Http\Controllers')
    ->not->toUse(['Illuminate\Support\Facades\DB']);

arch('domain layer is framework-free')
    ->expect('App\Domain')
    ->not->toUse([
        'Illuminate\Database',
        'Illuminate\Http',
        'Illuminate\Support\Facades',
    ]);

arch('strict types everywhere')
    ->expect('App')
    ->toUseStrictTypes();
```

### Mutation testing

```bash
./vendor/bin/pest --mutate --covered-only
```

Pest mutates your code and re-runs tests; surviving mutants reveal weak assertions.

## PHPUnit 12 — same domain, classic style

```php
<?php
declare(strict_types=1);

namespace Tests\Unit\Services;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use App\Services\UserService;

final class UserServiceTest extends TestCase
{
    private UserService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new UserService();
    }

    #[Test]
    public function it_creates_a_user_with_valid_data(): void
    {
        $user = $this->service->create(['name' => 'John', 'email' => 'john@test.com']);
        self::assertSame('John', $user->name);
        self::assertSame('john@test.com', $user->email);
    }

    #[Test]
    #[DataProvider('invalidDataProvider')]
    public function it_rejects_invalid_data(array $data, string $expected): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage($expected);
        $this->service->create($data);
    }

    public static function invalidDataProvider(): array
    {
        return [
            'empty name'  => [['name' => '',     'email' => 'a@b.com'], 'Name required'],
            'empty email' => [['name' => 'John', 'email' => ''],        'Email required'],
            'no data'     => [[],                                        'Name required'],
        ];
    }
}
```

> PHPUnit 12 deprecated `/** @test */` and `/** @dataProvider */` annotations — use the `#[Test]` and `#[DataProvider]` attributes shown above.

## Mocking

```php
// PHPUnit
$repo = $this->createMock(UserRepository::class);
$repo->expects($this->once())
     ->method('save')
     ->with($this->isInstanceOf(User::class))
     ->willReturn(true);

// Pest — same engine, fluent
$repo = mock(UserRepository::class)
    ->shouldReceive('save')->once()->andReturn(true)
    ->getMock();
```

For HTTP: `Http::fake()` (Laravel) or Saloon's `MockClient` — see `external-api-patterns`.

## Sharding for CI *(Pest 4 / PHPUnit 12)*

```bash
# Split a slow suite across 4 runners
./vendor/bin/pest --parallel --shard=1/4
./vendor/bin/pest --parallel --shard=2/4
./vendor/bin/pest --parallel --shard=3/4
./vendor/bin/pest --parallel --shard=4/4
```

```yaml
# .github/workflows/ci.yml
strategy:
  matrix:
    shardIndex: [1, 2, 3, 4]
    shardTotal: [4]
steps:
  - run: ./vendor/bin/pest --parallel --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
```

## Coverage Thresholds

```bash
# Fail under 70%
./vendor/bin/pest --coverage --min=70
./vendor/bin/phpunit --coverage-text --min=70
```

Realistic 2026 baseline: **70% line coverage minimum**, 100% on Services / Domain layer, lower for Controllers (covered by feature tests anyway).

## Rules

1. **One concept per test** — don't `@dataProvider` a test that mixes unrelated assertions
2. **Descriptive names** — `it_rejects_invalid_email`, not `testCreateUser2`
3. **Datasets / data providers** for input matrices (DRY assertions, named cases)
4. **`#[Test]` attribute, not `@test` PHPDoc** (PHPUnit 12 deprecated the latter)
5. **`setUp` for shared fresh state, not shared mutable state**
6. **Architecture tests on every Laravel project** — enforce layer rules in code, not docs
7. **Mutation testing on critical Services** quarterly — catches "fake green" suites
8. **Never `->skip()` / `->only()` in committed code**
9. **Browser tests use real browsers (Pest 4 Playwright)** — no jsdom hacks

## See Also

- `playwright-automation` (`_shared`) — same Playwright engine Pest 4 uses
- `quality-gate` — test step ordering
- `external-api-patterns` — `Http::fake()` / Saloon mocking patterns
- `phpstan-analysis` — typing that makes tests cheaper
