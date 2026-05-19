---
name: validate
description: Run the full quality gate (typecheck → lint → test → build) using THIS project's `active-project.json#qualityGates`. Per-stack reference is below.
version: 1.1.0
---

# /validate — Run Full Validation

## How it works (canonical — always use this)

1. **Read the gates from `.claude/config/active-project.json#qualityGates`.** This is the **only** source of truth — it was populated at install time from the active stack and reflects this project's actual tooling.
2. Run each gate in `order` ascending; stop at the first failure that has `required: true`.
3. If a gate has `appliesTo: ["nextjs", ...]`, only run it when `framework` in `active-project.json` matches.

```bash
jq -r '.qualityGates | sort_by(.order) | .[] | "\(.order). \(.name) (required=\(.required)): \(.command)"' .claude/config/active-project.json
```

`commit-manager` refuses to commit while `/validate` is failing.

---

## Per-stack reference (suggested — only used if `active-project.json` is missing or corrupted)

This block exists so the model has a stack-aware fallback. **Do not pick from here when `active-project.json#qualityGates` is present and valid** — that JSON always wins.

```json
{
  "python": {
    "_default": {
      "typecheck": "mypy .",
      "lint":      "ruff check .",
      "format":    "ruff format .",
      "test":      "pytest --tb=short",
      "serve":     "uvicorn app.main:app --reload"
    },
    "frameworks": {
      "fastapi":  { "test": "pytest --tb=short" },
      "django":   { "test": "python manage.py test", "migrate": "python manage.py migrate" },
      "flask":    { "test": "pytest --tb=short" },
      "scripts":  { "test": "pytest --tb=short" }
    },
    "_runOrder": ["typecheck", "lint", "test"]
  },

  "nodejs": {
    "_default": {
      "typecheck": "bun run typecheck",
      "lint":      "bun run lint",
      "format":    "bun run format",
      "test":      "bun run test",
      "build":     "bun run build",
      "serve":     "bun run dev"
    },
    "frameworks": {
      "nextjs": {
        "_extra": [
          { "name": "RouteSlugs",   "command": "node scripts/check-route-slugs.mjs",   "order": 4, "required": true,  "why": "next build does not catch dynamic-route slug mismatch" },
          { "name": "BuildScripts", "command": "node scripts/check-build-scripts.mjs", "order": 5, "required": true,  "why": "Vercel/Docker strip devDeps; scripts.build calling tsx/ts-node/vitest crash exit 127" }
        ]
      },
      "nuxt":     { "build": "bun run build" },
      "astro":    { "build": "bun run build" },
      "express":  { "test": "bun run test" },
      "fastify":  { "test": "bun run test" },
      "vanilla":  { "test": "bun run test" }
    },
    "_runOrder": ["typecheck", "lint", "test", "_extra", "build"]
  },

  "php": {
    "_default": {
      "static":    "vendor/bin/phpstan analyse --level=6",
      "test":      "vendor/bin/phpunit",
      "format":    "vendor/bin/php-cs-fixer fix",
      "serve":     "php artisan serve"
    },
    "frameworks": {
      "laravel-octane": {
        "serve": "php artisan octane:start --watch",
        "_extraIfFrontend": ["typecheck", "lint", "viteManifest"]
      },
      "laravel":        { "_extraIfFrontend": ["typecheck", "lint", "viteManifest"] }
    },
    "_frontendChecks": {
      "typecheck":    "npx tsc --noEmit",
      "lint":         "npx eslint resources/js/",
      "viteManifest": "node scripts/check-vite-manifest.mjs"
    },
    "_runOrder": ["static", "test", "typecheck", "lint", "viteManifest"]
  }
}
```

### How to read this fallback

- `_default` — commands that always apply within the stack.
- `frameworks.<framework>` — overrides or extras gated by `framework` in `active-project.json`.
- `_extra` — additional gates with explicit `order` (PHP/Next.js use this for stack-specific static checks like vite-manifest, route-slugs, build-scripts).
- `_runOrder` — order to chain when no `qualityGates` is available.

If `.claude/config/active-project.json#qualityGates` is missing, **do not silently fall back** — instead:

1. Print a warning: `WARN: active-project.json#qualityGates missing — using fallback for stack=<X>, framework=<Y>`.
2. Run the fallback in `_runOrder`.
3. Recommend the user re-run `npx start-vibing-stacks` (or `migrate --apply`) to repair the config.

---

## Output format

```
typecheck: PASS  (1.4s)
lint:      PASS  (0.8s)
tests:     PASS  (45/45 in 6.2s)
e2e:       SKIP  (not configured)
build:     PASS  (3.1s)

✅ All gates passed — safe to invoke commit-manager
```

If any required gate fails, print its full output and exit non-zero. Optional gates (`required: false`) print a warning but do not block.
