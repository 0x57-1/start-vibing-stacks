# PHPUnit Testing Skill

## Setup

```bash
composer require --dev phpunit/phpunit
```

## Test File Location

```
tests/
├── Unit/
│   ├── Services/
│   │   └── UserServiceTest.php
│   └── Helpers/
│       └── StringHelperTest.php
├── Feature/
│   └── Api/
│       └── UserApiTest.php
└── phpunit.xml
```

## Test Template

```php
<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

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

    public function testCreateUserWithValidData(): void
    {
        // Arrange
        $data = ['name' => 'John', 'email' => 'john@test.com'];

        // Act
        $user = $this->service->create($data);

        // Assert
        $this->assertSame('John', $user->name);
        $this->assertSame('john@test.com', $user->email);
    }

    public function testCreateUserThrowsOnInvalidEmail(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid email');

        $this->service->create(['name' => 'John', 'email' => 'invalid']);
    }

    /**
     * @dataProvider invalidDataProvider
     */
    public function testCreateUserRejectsInvalidData(array $data, string $expectedError): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage($expectedError);

        $this->service->create($data);
    }

    public static function invalidDataProvider(): array
    {
        return [
            'empty name' => [['name' => '', 'email' => 'a@b.com'], 'Name required'],
            'empty email' => [['name' => 'John', 'email' => ''], 'Email required'],
            'null data' => [[], 'Name required'],
        ];
    }
}
```

## Mocking

```php
public function testServiceCallsRepository(): void
{
    $repo = $this->createMock(UserRepository::class);
    $repo->expects($this->once())
         ->method('save')
         ->with($this->isInstanceOf(User::class))
         ->willReturn(true);

    $service = new UserService($repo);
    $result = $service->create(['name' => 'John', 'email' => 'j@t.com']);

    $this->assertTrue($result);
}
```

## Running

```bash
vendor/bin/phpunit                          # All tests
vendor/bin/phpunit tests/Unit/              # Unit only
vendor/bin/phpunit --filter testCreateUser  # Specific test
vendor/bin/phpunit --coverage-text          # With coverage
```

## Rules

1. **One assertion concept per test**
2. **Descriptive method names**: `testMethodName_Scenario_ExpectedResult`
3. **Use data providers** for multiple inputs
4. **setUp/tearDown** for shared state
5. **Never skip tests** in commits
