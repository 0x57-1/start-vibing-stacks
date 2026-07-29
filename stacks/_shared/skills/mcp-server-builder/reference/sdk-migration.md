# SDK migration — 1.x → 2.0.0

> `mcp-server-builder` v`1.0.0` · last verified **2026-07-29**

**Sources**
- Python SDK migration guide — https://py.sdk.modelcontextprotocol.io/migration/
- Python SDK releases — https://github.com/modelcontextprotocol/python-sdk/releases
- TypeScript SDK releases — https://github.com/modelcontextprotocol/typescript-sdk/releases
- PyPI `mcp` — https://pypi.org/project/mcp/
- npm registry (fetchable) — https://registry.npmjs.org/@modelcontextprotocol/server

> The `npmjs.com` **web** pages return HTTP 403 to non-browser user agents. Use
> the registry API or `npm view` — not a plain `curl` of the package page.

> ⚠️ **Version numbers below were read on 2026-07-29 and will drift.** Re-check
> before pinning:
> ```bash
> curl -s https://pypi.org/pypi/mcp/json | python3 -c 'import json,sys; print(json.load(sys.stdin)["info"]["version"])'
> npm view @modelcontextprotocol/server version
> npm view @modelcontextprotocol/sdk version
> ```

## Version landscape (July 2026)

### Python — PyPI `mcp`

| Version | Protocol | Notes |
|---|---|---|
| `1.27.x` – `1.29.0` | `2025-11-25` | maintenance mode |
| `2.0.0a1` – `2.0.0a3` | `2025-11-25` | alphas, pre-2026 spec |
| `2.0.0b1`+ | **`2026-07-28`** | first with the new revision |
| **`2.0.0`** (2026-07-28) | **`2026-07-28`** | stable; *serves every earlier revision from the same server* |

`requires_python >= 3.10`.

> Do **not** confuse with the standalone PyPI package **`fastmcp`** (v3.x). It is
> a different project with a different API. Our servers import the SDK's bundled
> `mcp.server.fastmcp`.

### Node — npm

| Package | Latest | Protocol |
|---|---|---|
| `@modelcontextprotocol/sdk` | `1.30.0` | `2025-11-25` (2025-era) |
| **`@modelcontextprotocol/server`** | `2.0.0` | **`2026-07-28`** |
| **`@modelcontextprotocol/client`** | `2.0.0` | **`2026-07-28`** |

v2 **split the SDK into two packages**. It is a rename, not a version bump — which
is why a `^1.x` range can never drift into it.

---

## Python: `mcp` 1.x → 2.0.0

### The rename

```python
# 1.x
from mcp.server.fastmcp import FastMCP
mcp = FastMCP("my-server")

# 2.0
from mcp.server import MCPServer
mcp = MCPServer("my-server")
```

**The decorator API is unchanged** — `@mcp.tool`, `@mcp.resource`, `@mcp.prompt`
all keep working. For a decorator-only server the migration is the import plus
the constructor.

### Breaking changes

| # | Change | Action |
|---|---|---|
| 1 | `FastMCP` → **`MCPServer`** | rename import + constructor |
| 2 | **Low-level `Server` overhauled** — handler registration moved from decorators to **constructor parameters**; return values no longer auto-wrap; handlers return explicit result types including `InputRequiredResult` | rewrite low-level servers; decorator servers unaffected |
| 3 | **Middleware signature** `(ctx, method, params, call_next)` → **`(ctx, call_next)`**; `method`/`params` moved onto `ServerRequestContext` | update every middleware |
| 4 | `Context.client_id` **removed** | drop it, or derive from `clientInfo` in `_meta` |
| 5 | **`MCP_*` environment variables no longer configure servers** | configure in code / your own settings |
| 6 | `FileResource.is_binary` → **`encoding`** field | update resource definitions |
| 7 | `RFC7523OAuthClientProvider` **removed** | see the auth section of the spec |

Also new in 2.0: a **first-class `Client`**.

Official guide: `py.sdk.modelcontextprotocol.io/migration/`

### Migration order for a decorator-only server

1. Bump the pin to `mcp>=2.0,<3`, `uv lock`, `uv sync`.
2. Swap the import and the constructor.
3. Delete any `MCP_*` env-var reliance.
4. `grep` for `Context` — if unused, you are done.
5. Inspector round-trip, then the evals.

---

## Node: `@modelcontextprotocol/sdk` 1.x → `@modelcontextprotocol/server` 2.0.0

| Change | Action |
|---|---|
| Package renamed/split | `npm rm @modelcontextprotocol/sdk && npm i @modelcontextprotocol/server` (add `/client` only if you also act as a client) |
| `serverInfo` moved from the `DiscoverResult` body into the result **`_meta`** (spec PR #3002) | SDK handles it; do not hand-roll `server/discover` |
| Server must stamp `_meta['io.modelcontextprotocol/serverInfo']` on **every** 2026-era response | SDK handles it |
| `RequestMetaEnvelope.clientInfo` demoted from required to SHOULD | treat as optional — never assume present |

### Backward compatibility

v2.0.0 restores tolerance for legacy `CallToolResult.content`: an inbound result
**without `content` defaults to `[]`** instead of failing validation, so deployed
older servers keep working.

But **the 2026-era wire schemas are strict** — a server that declares the new
revision cannot rely on legacy parsing leniency. Older 1.x servers keep working
through client version negotiation; they simply do not get 2026-07-28 features.

---

## Deciding when to migrate

Migrate when the **client** starts negotiating `2026-07-28`. Until then the new
SDK buys nothing and costs an API rewrite.

```bash
B=$(readlink -f "$(command -v claude)")
grep -ac "2026-07-28"     "$B"   # 0 → client is pre-revision
grep -ac "server/discover" "$B"   # 0 → confirms it
grep -ac "Mcp-Session-Id"  "$B"   # >0 → still using sessions
```

Because `mcp` 2.0.0 serves every earlier revision from the same server, you can
also migrate the Python API **early** and keep serving old clients — the
constraint is your own code, not the wire.
