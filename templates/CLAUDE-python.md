# {{PROJECT_NAME}}

> **CHARACTER LIMIT**: Max 40,000 chars. Validate with `wc -m CLAUDE.md` before commit.

## Recent Changes

<!-- APPEND-ONLY LIFO. Each Claude instance PREPENDS a new `### YYYY-MM-DD · branch · vX.Y.Z` heading
     + 1-4 lines below it. Drop only the OLDEST entry when count > 10. NEVER edit a peer's entry.
     `domain-updater` v3.0.0+ does this automatically post-commit.
     Compactor (`claude-md-compactor.md §5-§6`) enforces the cap, not the prepend. -->

### {{DATE}} · main · v0.1.0
Initial project setup with start-vibing-stacks (Python).

## 30 Seconds Overview

{{PROJECT_NAME}} is a Python 3.12+ project using {{FRAMEWORK}}.

## Stack

| Component | Technology |
|-----------|------------|
| Language | Python >= 3.12 |
| Framework | {{FRAMEWORK}} |
| Database | {{DATABASE}} |
| Type Checking | mypy (strict) |
| Linting | ruff |
| Testing | pytest + pytest-asyncio |
| Validation | Pydantic v2 |
| HTTP Client | httpx |
| Package Manager | uv / pip |

## Architecture

### FastAPI / Flask Projects

```
project/
├── CLAUDE.md                # This file (40k char max)
├── pyproject.toml           # Dependencies + project config
├── .env                     # Secrets (NEVER commit)
├── .env.example             # Template without values
├── .claude/
│   ├── agents/              # 6 active subagents
│   ├── skills/              # Skill systems (auto-injected)
│   ├── hooks/               # Validation hooks
│   ├── config/              # Project configuration
│   └── commands/            # Slash commands
├── app/
│   ├── main.py              # App entrypoint + startup
│   ├── api/v1/
│   │   ├── routes/          # Endpoint modules
│   │   └── deps.py          # Dependencies (auth, db)
│   ├── models/              # SQLAlchemy / Beanie models
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic layer
│   ├── core/
│   │   ├── config.py        # Pydantic Settings (env)
│   │   └── security.py      # Auth, hashing
│   └── utils/               # Helpers
├── scripts/                 # CLI scripts / automation
├── tests/
│   ├── conftest.py          # Shared fixtures
│   ├── unit/
│   └── integration/
└── alembic/                 # DB migrations (if SQL)
```

### Local Scripts / Automation Projects

```
project/
├── CLAUDE.md
├── pyproject.toml
├── .env
├── .env.example
├── .claude/
├── main.py                  # CLI entry point (argparse)
├── scripts/
│   ├── __init__.py
│   ├── wordpress.py         # WordPress API automation
│   ├── ads_manager.py       # Google/Facebook/TikTok Ads
│   └── data_sync.py         # Database sync / ETL
├── lib/
│   ├── __init__.py
│   ├── config.py            # Pydantic Settings
│   ├── http_client.py       # Reusable httpx client
│   ├── logger.py            # Structured logging (rich)
│   └── retry.py             # tenacity retry logic
├── data/                    # Input/output data files
├── logs/                    # Log files
└── tests/
```

### Django Projects

```
project/
├── CLAUDE.md
├── pyproject.toml
├── manage.py
├── config/                  # Settings, URLs, ASGI
├── apps/
│   ├── users/               # Per-app: models, views, serializers, tests
│   └── products/
└── tests/
```

## Critical Rules

### Python 3.12+ (MANDATORY)

- **Type hints on ALL public functions** — parameters, returns, class attributes
- **Pydantic v2 for all data boundaries** — API schemas, config, external data
- **`match/case`** for complex branching (3.10+)
- **`type` keyword** for simple type aliases (3.12+)
- **f-strings** everywhere, never `%` or `.format()`
- **Structural pattern matching** over nested if/elif chains

### Code Organization

- **Thin routes, fat services** — business logic in `services/`, not in routes/views
- **Repository pattern** for database access — isolate queries from business logic
- **Dependency injection** — FastAPI `Depends()`, Django class-based views
- **One concern per module** — a file should do one thing well

### Environment Variables & Secrets (MANDATORY)

```python
# CORRECT: Pydantic Settings loads from .env
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    API_TOKEN: str
    model_config = {"env_file": ".env"}

settings = Settings()
```

| Rule | Reason |
|------|--------|
| All secrets in `.env` | Never hardcode credentials |
| `.env` in `.gitignore` | Never commit secrets |
| `.env.example` always present | Document required variables |
| Pydantic Settings for loading | Typed, validated, auto-parsed |
| `--dry-run` flag for destructive scripts | Prevent accidental data loss |

### Async vs Sync

| Workload | Pattern |
|----------|---------|
| I/O-bound (HTTP, DB, files) | `async def` + `httpx` / `asyncpg` |
| CPU-bound (parsing, computation) | `def` + `multiprocessing` / `concurrent.futures` |
| Local scripts (simple) | Sync is fine unless hitting APIs in bulk |
| Bulk API calls | `async def` + `asyncio.gather` + semaphore |

### Database Safety

- **Parameterized queries ALWAYS** — `cursor.execute(query, params)`
- **Connection context managers** — auto-close on exit
- **Migrations** — Alembic (FastAPI) or Django `makemigrations`
- **Pool connections** in production — `pool_size` + `max_overflow`

## Quality Gates

```bash
mypy .                    # Type checking (MUST pass)
ruff check .              # Linting (MUST pass)
ruff format . --check     # Format check
pytest --tb=short         # Tests (MUST pass)
```

## FORBIDDEN

### Security (CRITICAL)

| Action | Reason |
|--------|--------|
| Hardcoded API keys/passwords | Use `.env` + Pydantic Settings |
| Commit `.env` files | Secrets leak to repository |
| SQL without parameterization | SQL injection |
| Deserializing untrusted binary data | Remote code execution risk |
| `yaml.load()` without SafeLoader | Code injection |
| No input validation on external data | Use Pydantic models |
| Storing plaintext passwords | Use `passlib` / `bcrypt` |

### Code Quality

| Action | Reason |
|--------|--------|
| `import *` | Explicit imports only |
| `requests` library | Use `httpx` (modern, sync+async) |
| `print()` for logging | Use `logging` module or `rich` |
| No type hints on public APIs | mypy must pass |
| Business logic in routes/views | Use services layer |
| Bare `except Exception` | Catch specific exceptions |
| `time.sleep()` in async code | Use `await asyncio.sleep()` |
| Sync HTTP in async context | Blocks the event loop |
| Global mutable state | Use dependency injection |
| Files > 400 lines | Split into modules |

### Workflow

| Action | Reason |
|--------|--------|
| Skip tests | Quality gate blocks commit |
| Skip type checking | mypy catches runtime errors |
| No `.env.example` | Others can't configure project |
| No `--dry-run` on destructive scripts | Risk of accidental data loss |
| Commit directly to main | Use feature branches |

## CLAUDE.md Update Rules

### When to Update

| Change Type | What to Update |
|-------------|----------------|
| Any file change | PREPEND new entry to `## Recent Changes` (LIFO, cap 10) |
| New feature | 30s Overview, Architecture if needed |
| New pattern | Add to relevant section |
| Gotcha discovered | Add to FORBIDDEN or NRY |
| New dependency | Update Stack table |

### Recent Changes Format (MANDATORY)

Each new entry is a `###` block PREPENDED below the HTML comment anchor. Multi-instance safe by construction (append-only LIFO, cap 10).

```markdown
## Recent Changes

<!-- APPEND-ONLY LIFO ... (HTML comment, do NOT edit) -->

### YYYY-MM-DD · feature/example · v0.2.0
1-4 plain-text lines describing WHAT and WHY. Inline `code` allowed for agent/skill/file names.
No bullets, no nested headers, no horizontal rules.

### YYYY-MM-DD · main · v0.1.0
(previous entry below — never edit a peer's entry)
```

`domain-updater` v3.0.0+ does the prepend automatically post-commit. Drop only the OLDEST `### ` block when count exceeds 10. NEVER reorder middle entries; NEVER collapse two entries into one.

## Agent System

| Agent | Purpose |
|-------|---------|
| research-web | Researches best practices (MANDATORY for new features) |
| documenter | Maps files to domains, tracks what exists |
| domain-updater | Records problems, solutions, learnings |
| commit-manager | Manages commits and merges |
| tester | Creates tests with pytest |
| claude-md-compactor | Compacts CLAUDE.md when over 40k chars |

### Skills

| Category | Skills |
|----------|--------|
| **Core** | python-patterns, pydantic-validation, pytest-testing, python-performance |
| **Framework** | fastapi-patterns, django-patterns, async-patterns, scripting-automation |
| **UI** | ui-ux-pro-max (auto-installed for frontend projects) |

## Domain Documentation

### Location

```
.claude/skills/codebase-knowledge/domains/
├── api.md
├── database.md
├── scripts.md
└── ...
```

### Documentation Agents

| Agent | Role | When |
|-------|------|------|
| **documenter** | Maps files to domains | AFTER implementation |
| **domain-updater** | Records problems + solutions | BEFORE commit |

## Workflow

```
1. TODO LIST → Create detailed task list
2. RESEARCH → Run research agent for new features
3. BRANCH → Create feature/ | fix/ | refactor/ | test/
4. IMPLEMENT → Follow skills + type everything
5. QUALITY → mypy → ruff → pytest (all must pass)
6. DOCUMENT → Update domains + CLAUDE.md
7. COMMIT → Conventional commit format
```

## Commit Format

```
[type]: [description]

- Detail 1
- Detail 2

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`

## NRY (Never Repeat Yourself)

- Always check `.claude/skills/` before implementing patterns from scratch
- Use `tenacity` for retry logic, not hand-rolled loops
- Use `pydantic_settings` for env config, not `os.getenv()` manually
- Use `httpx` for HTTP, never `urllib` or `requests`
- Use `rich` for CLI output, not bare `print()`

## Configuration

Project-specific settings in `.claude/config/`:

- `active-project.json` — Stack, framework, database, skills
- `security-rules.json` — Security audit rules
- `standards-review.json` — Imported project standards (if adapted)

## Setup by start-vibing

This project was set up with `npx start-vibing-stacks`.
For updates: `npx start-vibing-stacks --force`
