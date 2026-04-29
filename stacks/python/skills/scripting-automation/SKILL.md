---
name: scripting-automation
version: 1.0.0
---

# Local Scripts & Automation — Python 3.12+

**ALWAYS invoke when building local scripts, CLI tools, or automation tasks.**

## When to Use

- WordPress API automation (create/update posts, manage media)
- Ad campaign management (Google Ads, Facebook Ads, TikTok Ads API)
- Data pipelines (CSV/Excel processing, database sync)
- Web scraping and data extraction
- File system operations and batch processing
- Scheduled tasks and cron-like automation
- API integrations without a web framework

## Project Structure

```
project/
├── pyproject.toml        # Dependencies + project metadata
├── .env                  # API keys, credentials (NEVER commit)
├── .env.example          # Template without real values
├── scripts/
│   ├── __init__.py
│   ├── wordpress.py      # WordPress automation
│   ├── ads_manager.py    # Ad campaigns
│   └── data_sync.py      # Database sync
├── lib/
│   ├── __init__.py
│   ├── http_client.py    # Reusable httpx client
│   ├── config.py         # Pydantic Settings
│   ├── logger.py         # Structured logging
│   └── retry.py          # Retry with backoff
├── data/                 # Input/output data files
├── logs/                 # Log files
├── tests/
│   └── test_scripts.py
└── main.py               # Entry point / CLI
```

## Configuration (Pydantic Settings)

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    WP_URL: str
    WP_USER: str
    WP_APP_PASSWORD: str

    GOOGLE_ADS_DEVELOPER_TOKEN: str = ""
    FACEBOOK_ACCESS_TOKEN: str = ""
    TIKTOK_ACCESS_TOKEN: str = ""

    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str

    LOG_LEVEL: str = "INFO"
    DRY_RUN: bool = False

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

settings = Settings()
```

## HTTP Client (reusable)

```python
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

class ApiClient:
    def __init__(self, base_url: str, auth: tuple[str, str] | None = None):
        self.client = httpx.Client(
            base_url=base_url,
            auth=auth,
            timeout=30.0,
            headers={"User-Agent": "AutomationScript/1.0"},
        )

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    def get(self, path: str, **kwargs) -> dict:
        r = self.client.get(path, **kwargs)
        r.raise_for_status()
        return r.json()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    def post(self, path: str, **kwargs) -> dict:
        r = self.client.post(path, **kwargs)
        r.raise_for_status()
        return r.json()

    def close(self):
        self.client.close()
```

## WordPress REST API Pattern

```python
from lib.http_client import ApiClient
from lib.config import settings

wp = ApiClient(
    base_url=f"{settings.WP_URL}/wp-json/wp/v2",
    auth=(settings.WP_USER, settings.WP_APP_PASSWORD),
)

def create_post(title: str, content: str, status: str = "draft") -> dict:
    return wp.post("/posts", json={
        "title": title,
        "content": content,
        "status": status,
    })

def update_post(post_id: int, **fields) -> dict:
    return wp.post(f"/posts/{post_id}", json=fields)

def bulk_update_posts(posts: list[dict]) -> list[dict]:
    results = []
    for post in posts:
        pid = post.pop("id")
        result = update_post(pid, **post)
        results.append(result)
        logger.info(f"Updated post {pid}: {result['title']['rendered']}")
    return results
```

## Database Access (direct, no ORM)

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
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, params)
        return cursor.fetchall()

def execute(query: str, params: tuple = ()) -> int:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        conn.commit()
        return cursor.rowcount
```

## CLI Entry Point

```python
import argparse
import logging
from lib.config import settings

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("logs/script.log"),
    ],
)
logger = logging.getLogger(__name__)

def main():
    parser = argparse.ArgumentParser(description="Automation Scripts")
    sub = parser.add_subparsers(dest="command")

    sub.add_parser("wp-sync", help="Sync WordPress posts")
    sub.add_parser("ads-report", help="Generate ads performance report")
    sub.add_parser("db-migrate", help="Run data migration")

    args = parser.parse_args()

    if settings.DRY_RUN:
        logger.warning("DRY RUN mode — no changes will be saved")

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

if __name__ == "__main__":
    main()
```

## Essential Libraries

```toml
# pyproject.toml
[project]
dependencies = [
    "httpx>=0.27",
    "pydantic-settings>=2.0",
    "tenacity>=8.0",
    "python-dotenv>=1.0",
    "mariadb>=1.1",
    "rich>=13.0",
]

[project.optional-dependencies]
dev = ["pytest>=8.0", "mypy>=1.8", "ruff>=0.3"]
ads = ["google-ads>=24.0", "facebook-business>=19.0"]
```

## Logging (structured)

```python
from rich.console import Console
from rich.logging import RichHandler
import logging

console = Console()
logging.basicConfig(
    level="INFO",
    format="%(message)s",
    handlers=[RichHandler(console=console, rich_tracebacks=True)],
)
```

## FORBIDDEN

1. **Hardcoded credentials** — use `.env` + Pydantic Settings
2. **No error handling on API calls** — always try/except + retry
3. **No logging** — every script must log actions and errors
4. **`requests` library** — use `httpx` (modern, sync+async)
5. **Print statements for output** — use `logging` or `rich`
6. **No `--dry-run` flag** — destructive scripts must support dry run
7. **SQL without parameterization** — always use `?` placeholders
8. **No `.env.example`** — always provide template for credentials
