---
name: laravel-inertia-i18n
version: 1.0.0
---

# Laravel + Inertia i18n — Centralized Translations

**ALWAYS invoke when adding translations, creating new pages, or working with multilingual content.**

## Architecture

```
Laravel Backend                    Inertia Share              React Frontend
┌─────────────────┐               ┌──────────────┐           ┌──────────────────┐
│ lang/en/*.php    │──→ config ──→│ InertiaShare  │──→ props →│ __('key')        │
│ lang/pt/*.php    │   mapping    │ translations  │           │ via usePage()    │
│ lang/en.json     │              │ + cache       │           │                  │
└─────────────────┘               └──────────────┘           └──────────────────┘

Key decisions:
- Translations live in Laravel (single source of truth)
- Only NEEDED translations sent per page (not all)
- Cached forever (invalidate on deploy)
- Frontend reads via usePage().props.translations
```

## Backend: Translation Files

### File Structure

```
lang/
├── en/
│   ├── messages.php        # Global (loaded on all pages)
│   ├── validation.php      # Laravel validation messages
│   ├── auth.php            # Auth pages
│   └── admin/
│       ├── dashboard.php   # Admin dashboard specific
│       └── ai-models.php   # AI models page specific
├── pt/
│   ├── messages.php
│   ├── validation.php
│   └── admin/
│       ├── dashboard.php
│       └── ai-models.php
├── en.json                 # JSON format (optional, merged)
└── pt.json
```

### Translation File Example

```php
// lang/en/messages.php
return [
    'common' => [
        'buttons' => [
            'save' => 'Save',
            'cancel' => 'Cancel',
            'close' => 'Close',
            'saving' => 'Saving...',
            'add_ai_model' => 'Add AI Model',
        ],
    ],
    'errors' => [
        'error' => 'Error',
        'api_save_failed_generic' => 'Failed to save. Please try again.',
        'validation_failed_check_fields' => 'Validation failed. Please check the fields.',
        'invalid_json' => 'Invalid JSON format.',
    ],
    'admin' => [
        'ai' => [
            'ai-models' => [
                'new_model_button' => 'New AI Model',
                'add_modal_description' => 'Fill in the details to add a new AI model.',
                'fields' => [
                    'name' => 'Name',
                    'slug' => 'Slug',
                    'system_prompt' => 'System Prompt',
                    'temperature' => 'Temperature',
                    // ...
                ],
            ],
        ],
    ],
];
```

## Backend: Page-to-Translation Mapping

### Config File

```php
// config/translations_inertia.php
return [
    // Global: loaded on EVERY page
    'global' => [
        'messages',      // lang/{locale}/messages.php
    ],

    // Per-page: loaded only when visiting that route
    'pages' => [
        'admin/dashboard' => ['admin/dashboard'],
        'admin/ai-models' => ['admin/ai-models'],
        'auth/login' => ['auth'],
        'auth/register' => ['auth'],
    ],
];
```

**Rule:** Only send translations the page actually needs — not the entire `lang/` folder.

## Backend: InertiaShare Middleware

```php
// app/Support/InertiaShare.php
class InertiaShare
{
    public static function getProps(Request $request): array
    {
        $locale = App::getLocale();

        return [
            'auth' => [
                'user' => $request->user()?->only('id', 'name', 'email', 'role', 'timezone', 'avatar_url'),
            ],
            'locale' => $locale,
            'translations' => static::getTranslations($locale, $request->route()->uri),
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ];
    }

    protected static function getTranslations(string $locale, string $pageUri): array
    {
        $cacheKey = "translations_{$locale}_{$pageUri}";

        return Cache::rememberForever($cacheKey, function () use ($locale, $pageUri) {
            $globalFiles = config('translations_inertia.global', []);
            $pageFiles = config("translations_inertia.pages.{$pageUri}", []);
            $files = array_unique(array_merge($globalFiles, $pageFiles));

            $translations = [];
            $langPath = lang_path($locale);

            foreach ($files as $file) {
                $filePath = "{$langPath}/{$file}.php";
                if (File::exists($filePath)) {
                    $translations[$file] = require $filePath;
                }
            }

            // Merge JSON translations (lang/{locale}.json)
            $jsonPath = lang_path("{$locale}.json");
            if (File::exists($jsonPath)) {
                $json = json_decode(File::get($jsonPath), true);
                if (is_array($json)) {
                    $translations = array_merge($translations, $json);
                }
            }

            return $translations;
        });
    }
}
```

### Register in Middleware

```php
// app/Http/Middleware/HandleInertiaRequests.php
use App\Support\InertiaShare;

public function share(Request $request): array
{
    return array_merge(parent::share($request), InertiaShare::getProps($request));
}
```

## Frontend: translate.js Utility

```js
// resources/js/Utils/translate.js
import { usePage } from '@inertiajs/react';

/**
 * Get translated string by dot-notation key.
 * @param {string} key - e.g. 'messages.common.buttons.save'
 * @param {object} replacements - e.g. { name: 'John' } for ':name'
 * @returns {string} Translated string or key as fallback
 */
export default function __(key, replacements = {}) {
    const { translations } = usePage().props;

    let translation = key.split('.').reduce(
        (obj, part) => (obj && obj[part] !== undefined ? obj[part] : null),
        translations
    );

    // Fallback: return key if not found
    if (translation === null || translation === undefined) {
        return key;
    }

    // Replace :placeholders
    if (typeof translation === 'string' && Object.keys(replacements).length > 0) {
        Object.keys(replacements).forEach((placeholder) => {
            translation = translation.replace(
                new RegExp(`:${placeholder}`, 'g'),
                replacements[placeholder]
            );
        });
    }

    return translation;
}
```

## Frontend: Component Pattern (CONST)

```tsx
import __ from '@/Utils/translate';

// ═══════════════════════════════════════════
// 1. TRANSLATIONS — before hooks, outside component
// ═══════════════════════════════════════════
const LABELS = {
    title: __('messages.admin.ai.ai-models.new_model_button'),
    description: __('messages.admin.ai.ai-models.add_modal_description'),
    nameField: __('messages.admin.ai.ai-models.fields.name'),
    slugField: __('messages.admin.ai.ai-models.fields.slug'),
    save: __('messages.common.buttons.save'),
    saving: __('messages.common.buttons.saving'),
    cancel: __('messages.common.buttons.cancel'),
    errorTitle: __('messages.errors.error'),
    validationFailed: __('messages.errors.validation_failed_check_fields'),
} as const;

// ═══════════════════════════════════════════
// 2. CSS STYLES — semantic tokens
// ═══════════════════════════════════════════
const STYLES = {
    modal: 'relative w-full max-w-[558px] rounded-3xl bg-card p-6 lg:p-10',
    title: 'mb-6 text-xl font-semibold text-foreground',
    description: 'mb-7 text-sm leading-6 text-muted-foreground',
    form: 'space-y-4',
    gridTwo: 'grid grid-cols-2 gap-4',
    actions: 'mt-8 flex w-full flex-col sm:flex-row items-center justify-between gap-3',
    fieldError: 'text-sm text-destructive mt-1',
    btnFull: 'w-full',
} as const;

// ═══════════════════════════════════════════
// 3. COMPONENT
// ═══════════════════════════════════════════
export default function AiModelsAddModal({ isOpen, onClose, onAdded }) {
    // hooks, state, handlers...

    return (
        <Modal isOpen={isOpen} onClose={onClose} className={STYLES.modal}>
            <h4 className={STYLES.title}>{LABELS.title}</h4>
            <p className={STYLES.description}>{LABELS.description}</p>
            {/* form fields using LABELS and STYLES */}
        </Modal>
    );
}
```

## Adding New Translations

### Checklist

1. Add string to `lang/en/{file}.php` **and** `lang/pt/{file}.php`
2. If new file: add to `config/translations_inertia.php` (global or page-specific)
3. Clear cache: `php artisan cache:clear`
4. In React component: add to `LABELS` const using `__('key')`
5. **NEVER** call `__()` inside JSX directly — always via LABELS const

### Cache Invalidation

```bash
# After adding/changing translations:
php artisan cache:clear

# For Octane (in-memory):
php artisan octane:reload
```

## FORBIDDEN

| ❌ Don't | ✅ Do |
|---|---|
| `__()` inside JSX return | `LABELS.title` via const |
| Send ALL translations to every page | Map per-page in config |
| Hardcode strings in components | Use translation keys |
| Skip Portuguese translation | Always add both `en` + `pt` |
| `Cache::forget()` for translations | `cache:clear` on deploy |
| Translation keys in camelCase | Use dot.notation `messages.admin.title` |
