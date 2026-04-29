---
name: composer-workflow
version: 1.0.0
---

# Composer Workflow

## Requirements

- **Composer >= 2.0**
- **PHP >= 8.3**

## Essential Commands

```bash
composer install              # Install from lock file (CI/deploy)
composer update               # Update dependencies (dev only)
composer require package/name # Add dependency
composer require --dev pkg    # Add dev dependency
composer dump-autoload -o     # Optimize autoloader (production)
```

## composer.json Structure

```json
{
    "name": "vendor/project",
    "type": "project",
    "require": {
        "php": ">=8.3"
    },
    "require-dev": {
        "phpunit/phpunit": "^11.0",
        "phpstan/phpstan": "^2.0",
        "friendsofphp/php-cs-fixer": "^3.0"
    },
    "autoload": {
        "psr-4": {
            "App\\": "src/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "Tests\\": "tests/"
        }
    },
    "scripts": {
        "test": "phpunit",
        "lint": "phpstan analyse --level=6",
        "format": "php-cs-fixer fix",
        "check": [
            "@lint",
            "@test"
        ]
    },
    "config": {
        "sort-packages": true,
        "allow-plugins": {}
    }
}
```

## PSR-4 Autoloading

```
src/
├── Controllers/
│   └── UserController.php    → App\Controllers\UserController
├── Services/
│   └── UserService.php       → App\Services\UserService
├── Models/
│   └── User.php              → App\Models\User
└── Middleware/
    └── AuthMiddleware.php     → App\Middleware\AuthMiddleware
```

## Rules

1. **Always commit composer.lock**
2. **Never edit vendor/**
3. **Use `composer install` in CI/production** (not update)
4. **PHP >= 8.3 in require** — enforce minimum version
5. **PSR-4 autoloading** — no manual includes
