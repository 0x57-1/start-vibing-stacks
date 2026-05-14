---
name: scripting-automation
version: 2.0.0
description: "Local Python scripts and automation tooling for Python 3.13/3.14 with uv as the default package + project manager (uv init / uv add / uv run / uv tool — Astral, acquired by OpenAI Mar 2026, ~75M monthly downloads vs Poetry 66M, 10–100× faster than pip). Covers project layout for ETL/CLI/cron jobs, Pydantic Settings (.env), reusable httpx + tenacity client, WordPress REST integration, MariaDB/Postgres direct access (no ORM), structured CLI with argparse + match/case + rich, structured logging, and uv single-file scripts via PEP 723 inline metadata. Use for WordPress, ad-platform automation, ETL, scrapers, batch jobs."
---

# Local Scripts & Automation — Python 3.13/3.14 with uv

**ALWAYS invoke when building local scripts, CLI tools, scrapers, ad-platform automation, ETL, or cron-style jobs.**

## When to use

- WordPress REST automation (posts, media, taxonomies)
- Ad-platform automation (Google Ads, Meta, TikTok, LinkedIn APIs)
- ETL / CSV / Excel pipelines
- Web scraping & data extraction
- Database sync, batch processing
- Scheduled tasks (cron, GitHub Actions cron, Vercel cron, systemd timers)
- "API integrations without a web framework"

## Toolchain (2026)

| Tool | Why |
|---|---|
| **`uv`** (Astral) | Project + package + Python-version manager. 10–100× faster than pip; surpassed Poetry in monthly downloads in early 2026. Astral was acquired by OpenAI in March 2026 with public commitment to keep `uv` open source. |
| `ruff` | Lint + format in one Rust binary |
| `pyright` | Type checking (correctness); `ty` (Astral) when speed matters |
| `httpx` + `tenacity` | HTTP with retries |
| `pydantic-settings` | Typed env config |
| `rich` | Terminal output, tables, progress bars, tracebacks |
| `tomllib` (3.11+ stdlib) | TOML reading — drop `tomli`/`toml` from deps |

## Project Layout

```
project/
├── pyproject.toml         # Project + tool config (uv, ruff, pyright, pytest)
├── uv.lock                # Universal lockfile — commit this
├── .env                   # Secrets — NEVER commit
├── .env.example           # Safe template
├── README.md
├── main.py                # CLI entry
├── scripts/
│   ├── __init__.py
│   ├── wordpress.py       # WordPress automation
│   ├── ads_manager.py     # Ad campaigns
│   └── data_sync.py       # DB sync
├── lib/
│   ├── __init__.py
│   ├── http_client.py     # Reusable httpx client
│   ├── config.py          # Pydantic Settings
│   ├── logger.py          # rich/structlog
│   └── retry.py           # Retry helpers
├── data/                  # I/O files
├── logs/
└── tests/
    └── test_scripts.py
```

## uv quickstart

```bash
# Install once (mac/linux)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Bootstrap a project
uv init my-script && cd my-script
uv python pin 3.13                            # writes .python-version
uv add httpx pydantic-settings tenacity rich
uv add --dev pytest ruff pyright

# Run anything inside the project venv
uv run python main.py
uv run pytest

# Install a global CLI tool, isolated
uv tool install ruff                          # works like pipx, just faster
```

`uv` reads/writes `pyproject.toml` and produces a single universal `uv.lock` that resolves consistently across macOS/Linux/Windows. Commit the lockfile.

## `pyproject.toml` (uv-native)

```toml
[project]
name = "my-script"
version = "0.1.0"
requires-python = ">=3.13"
dependencies = [
    "httpx>=0.27",
    "pydantic-settings>=2.5",
    "tenacity>=9.0",
    "rich>=13.7",
]

[dependency-groups]
dev = ["pytest>=9.0", "ruff>=0.5", "pyright>=1.1"]
ads = ["google-ads>=24.0", "facebook-business>=19.0"]

[tool.ruff]
line-length = 100
target-version = "py313"
[tool.ruff.lint]
select = ["E", "F", "W", "I", "B", "UP", "N", "S", "RUF"]
```

## Single-file scripts — PEP 723 inline metadata

For one-off scripts you want runnable without `pip install`:

```python
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.13"
# dependencies = ["httpx>=0.27", "rich>=13.7"]
# ///

import httpx
from rich import print

r = httpx.get("https://api.example.com/status", timeout=5)
print(r.json())
```

`uv run script.py` reads the inline metadata, builds an isolated venv, runs the script. Killer for cron jobs, GitHub Actions one-liners, throwaway helpers.

## Configuration (Pydantic Settings)

```python
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="forbid")

    WP_URL:          str
    WP_USER:         str
    WP_APP_PASSWORD: str = Field(min_length=10)

    GOOGLE_ADS_DEVELOPER_TOKEN: str = ""
    FACEBOOK_ACCESS_TOKEN:      str = ""
    TIKTOK_ACCESS_TOKEN:        str = ""

    DB_HOST:     str = "localhost"
    DB_PORT:     int = 3306
    DB_NAME:     str
    DB_USER:     str
    DB_PASSWORD: str

    LOG_LEVEL: str  = "INFO"
    DRY_RUN:   bool = False

settings = Settings()                          # validated at import
```

## HTTP Client (reusable, retried)

```python
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

class ApiClient:
    def __init__(self, base_url: str, auth: tuple[str, str] | None = None):
        self.client = httpx.Client(
            base_url=base_url,
            auth=auth,
            timeout=httpx.Timeout(connect=5, read=30, write=30, pool=5),
            headers={"User-Agent": "AutomationScript/1.0"},
        )

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(min=1, max=10),
        retry=retry_if_exception_type((httpx.TransportError, httpx.HTTPStatusError)),
        reraise=True,
    )
    def get(self, path: str, **kw) -> dict:
        r = self.client.get(path, **kw)
        r.raise_for_status()
        return r.json()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10), reraise=True)
    def post(self, path: str, **kw) -> dict:
        r = self.client.post(path, **kw)
        r.raise_for_status()
        return r.json()

    def close(self) -> None:
        self.client.close()
```

## WordPress REST API pattern

```python
from lib.http_client import ApiClient
from lib.config       import settings

wp = ApiClient(
    base_url=f"{settings.WP_URL}/wp-json/wp/v2",
    auth=(settings.WP_USER, settings.WP_APP_PASSWORD),
)

def create_post(title: str, content: str, status: str = "draft") -> dict:
    return wp.post("/posts", json={"title": title, "content": content, "status": status})

def update_post(post_id: int, **fields) -> dict:
    return wp.post(f"/posts/{post_id}", json=fields)
```

## Database access — direct, no ORM

```python
import mariadb
from contextlib import contextmanager
from lib.config import settings

@contextmanager
def get_connection():
    conn = mariadb.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
    )
    try:
        yield conn
    finally:
        conn.close()

def fetch_all(query: str, params: tuple = ()) -> list[dict]:
    with get_connection() as conn:
        cur = conn.cursor(dictionary=True)
        cur.execute(query, params)               # parameterised — never f-string
        return cur.fetchall()

def execute(query: str, params: tuple = ()) -> int:
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute(query, params)
        conn.commit()
        return cur.rowcount
```

For PostgreSQL prefer `psycopg[binary]` (psycopg 3) over psycopg2.

## CLI Entry — argparse + match/case

```python
import argparse
import logging
from rich.logging import RichHandler

from lib.config import settings

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(message)s",
    handlers=[RichHandler(rich_tracebacks=True)],
)
logger = logging.getLogger(__name__)

def main() -> int:
    parser = argparse.ArgumentParser(description="Automation Scripts")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("wp-sync",    help="Sync WordPress posts")
    sub.add_parser("ads-report", help="Generate ads performance report")
    sub.add_parser("db-migrate", help="Run data migration")

    args = parser.parse_args()

    if settings.DRY_RUN:
        logger.warning("DRY RUN — no changes will be persisted")

    match args.command:
        case "wp-sync":
            from scripts.wordpress import sync_posts
            sync_posts()
        case "ads-report":
            from scripts.ads_manager import generate_report
            generate_report()
        case "db-migrate":
            from scripts.data_sync import run_migration
            run_migration()
        case _:
            parser.print_help()
            return 2
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
```

## Logging (structured, prod-ready)

```python
import logging
from rich.logging import RichHandler

logging.basicConfig(
    level="INFO",
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
    handlers=[
        RichHandler(rich_tracebacks=True, show_time=False),
        logging.FileHandler("logs/script.log"),
    ],
)

# For real prod observability use structlog + JSON formatter — see _shared/observability
```

## Reading TOML/JSON configs

```python
# 3.11+ — stdlib, no extra dep
import tomllib
with open("pyproject.toml", "rb") as f:
    data = tomllib.load(f)
```

Drop `tomli` / `toml` from `dependencies` for Python 3.11+ projects.

## FORBIDDEN

| Anti-pattern | Reason |
|---|---|
| Hardcoded credentials | Use `.env` + `BaseSettings(extra="forbid")` |
| No retry on flaky API | Use `tenacity` with exponential backoff + jitter |
| `print()` for output | Use `logging` + `rich` (machine-readable + human-readable) |
| `requests` library | Use `httpx` (sync + async, http/2, modern API) |
| `pip install` in new projects | Use `uv add` (Astral's `uv` is the 2026 default) |
| Missing `uv.lock` in repo | Builds become non-reproducible |
| f-string interpolation in SQL | SQL injection — always parameterise |
| No `--dry-run` on destructive scripts | Always provide a safe preview mode |
| No `.env.example` | Onboarding nightmare |
| Per-tool config files (`.flake8`, `.isort.cfg`, `pyproject` for black + isort + ruff) | Consolidate under `[tool.ruff]` + `[tool.pyright]` in `pyproject.toml` |
| `tomli` / `toml` deps for 3.11+ | Use stdlib `tomllib` |

## See Also

- `python-patterns` — version policy, framework selection
- `async-patterns` — when to switch from `httpx.Client` to `AsyncClient`
- `pydantic-validation` — `BaseSettings(extra="forbid")` pattern
- `_shared/skills/secrets-management` — `.env` discipline + 3-layer gitleaks
- `_shared/skills/observability` — structlog + OpenTelemetry for prod scripts
