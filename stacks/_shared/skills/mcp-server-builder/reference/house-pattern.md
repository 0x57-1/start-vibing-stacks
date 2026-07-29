# House pattern — servers under `~/.claude/mcps`

> `mcp-server-builder` v`1.0.0` · inventory taken **2026-07-29**

**Sources** — this file is derived from the local install, not from upstream docs:
`~/.claude/mcps/*/`, `~/.claude/mcps/legolas-d6/SECURITY.md`, and the user-scope
`mcpServers` block in `~/.claude.json`. Re-read those before trusting the counts.

Everything here is stdio, single-user, single-session. As of 2026-07-29 there are
11 first-party servers plus 3 third-party proxies. Match the existing shape
before inventing a new one.

---

## Layout

```
~/.claude/mcps/<name>/
├── server.py                  # Python: single entrypoint, FastMCP decorators
│   └── server.js              # or Node: single entrypoint
├── pyproject.toml             # bounded pin — see SKILL.md §1
├── uv.lock                    # COMMITTED
├── .venv/                     # created by uv sync
├── catalog.json               # only when mirroring an external API
├── data/                      # only when the server ships a local index
├── SECURITY.md                # REQUIRED when there is a write/exec tool
└── README.md
```

Node servers use `package.json` + `package-lock.json` + `node_modules/`, and may
split into `lib/` (helpers, sanitisers) and `tools/` (one file per tool) — see
`exittus-inspect`.

---

## The four archetypes

Pick the closest one and follow it.

### A. Infra ops wrapper — `legolas-d1`, `legolas-d6`, `legolas-oc1`, `legolas-cname`
Wraps `ssh` to a box the user owns. Many unrestricted read tools plus exactly one
guarded `execute_command`. Requires `SECURITY.md`. See the guard below.

### B. External API mirror — `omie`, `exittus_notaas`
A generic `<svc>_call` + `<svc>_describe_endpoint` + `<svc>_search_endpoints`
driven by a **`catalog.json`** generated from the vendor docs, plus a handful of
hand-written convenience tools for the common queries.

`catalog.json` shape:

```json
{
  "source": "…", "base_url": "…", "generated_by": "…",
  "family_count": 0, "endpoint_count": 0,
  "endpoints": [ /* … */ ]
}
```

This keeps hundreds of endpoints reachable without declaring hundreds of tools —
the agent searches the catalog, then calls the generic caller.

### C. App/DB inspector — `exittus-inspect`, `pubweb-inspect`, `pubweb-ads`
Read-only windows into a running app: `query_db`, `db_tables`, `tail_logs`,
`artisan`, `workers`. Column allowlists, secret/PII columns stripped
unconditionally, output size capped. Never a generic write path.

### D. OpenAPI proxy — `exittus`, `plowf`
No code of ours. `npx -y @ivotoby/openapi-mcp-server` against a vendored spec,
refreshed by a `refresh-spec.sh` in the folder. When the origin sits behind
Cloudflare, the refresh script must send a **browser User-Agent** or it gets a
520 — document that in the script, because the next agent will "clean it up".

---

## `server.py` header convention

The module docstring is the first thing a future agent reads. It must state host,
user, port, key path, the services involved, and the **safety model**:

```python
"""
MCP server for <target>
───────────────────────
Host:  …
User:  …  (sudo for privileged ops)
Port:  …
Key:   …/.env.d/<key>
Web:   …

SAFETY MODEL
────────────
• Read tools are unrestricted.
• execute_command applies HARD BLOCKS (regex). Blocked commands return an error
  without ever reaching the server.
• <enumerate refused categories>
• Full block list is documented in SECURITY.md (same folder).

Security note: this wrapper uses Python's subprocess module to invoke the system
ssh client. Local shell injection is mitigated by:
  1. subprocess argument list (no shell=True)
  2. shlex.quote() on all paths/names interpolated into remote commands
  3. SSH key-based auth (no credentials in command)
  4. Hard blocklist on the only free-form tool (execute_command)
"""
```

Then module-level constants (`SERVER_NAME`, `SSH_HOST`, `SSH_PORT`, `SSH_USER`,
`SSH_KEY`, `SSH_BASE`), then tools. Ends with:

```python
if __name__ == "__main__":
    mcp.run()
```

---

## The 3-layer guard (any free-form exec tool)

Copied from `legolas-d6`. A single regex layer is **not sufficient**.

1. **Regex blocklist** (~112 patterns) over the whole command string.
2. **Real shell parse** with `bashlex`:
   - `$(...)`, backticks, `<(...)`, `>(...)` — always blocked
   - `;`, `&&`, `||` — require `allow_compound=True`
   - `&` (background) — always blocked
   - `|` — allowed, **each side validated separately**
3. **Re-run the regex blocklist on every subcommand**, to catch danger hidden
   after `;`/`&&`.

Genuinely destructive work is done manually over SSH, never through the MCP.

### Why layer 2 exists — the 2026-06-16 incident

`find /var/cache/nginx -mindepth 1 -delete` passed the old blocklist (which only
caught `find / -delete` at root and `find ... -exec rm`). It wiped the
`proxy_cache` `levels` tree and, **with no nginx `reload`, every site on the box
went down** — nginx does not recreate the cache directory structure at runtime.

Because a regex blocklist **cannot guarantee** the purge is followed by a reload,
wholesale cache purges via MCP are now **forbidden outright**. Do it manually and
`systemctl reload nginx` immediately after (`reload` itself is allowed).

Write the incident into `SECURITY.md`. The next agent will want to relax the
blocklist; the reasoning is what stops them.

---

## Registration

User scope in `~/.claude.json`, so servers are available across all projects.

Python (uv-managed):
```json
{
  "type": "stdio",
  "command": "uv",
  "args": ["--directory", "/Users/<you>/.claude/mcps/<name>", "run", "python", "server.py"],
  "env": {}
}
```

Python (explicit venv interpreter — `legolas-oc1`, `legolas-cname`):
```json
{
  "type": "stdio",
  "command": "/Users/<you>/.claude/mcps/<name>/.venv/bin/python",
  "args": ["/Users/<you>/.claude/mcps/<name>/server.py"]
}
```

Node:
```json
{ "type": "stdio", "command": "node", "args": ["/Users/<you>/.claude/mcps/<name>/server.js"] }
```

### ⚠️ Secrets in the registration

Some existing entries carry **API keys and Bearer tokens inline** in the `env`
block and in `--headers` arguments inside `~/.claude.json`. That file is not a
secret store: it is large, frequently rewritten by the CLI, and easy to paste.

For **new** servers: read credentials from `.env.d/<name>` inside the server
itself (or from an env var exported by the shell), and leave `"env": {}` in the
registration. Do not add to the inline-secret debt.

---

## Checklist for a new server here

- [ ] Folder under `~/.claude/mcps/<name>/`
- [ ] Archetype chosen (A/B/C/D) and followed
- [ ] `pyproject.toml` pin bounded; `uv.lock` committed
- [ ] Module docstring with host/user/port/key + SAFETY MODEL
- [ ] Tools service-prefixed, annotated, paginated
- [ ] Nothing on stdout
- [ ] `SECURITY.md` if there is any write/exec tool
- [ ] Credentials from `.env.d/`, `"env": {}` in the registration
- [ ] Registered user-scope in `~/.claude.json`
- [ ] Inspector clean, 10 evals written
