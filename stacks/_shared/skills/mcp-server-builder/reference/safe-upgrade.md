# Safe upgrade of existing MCP servers

> `mcp-server-builder` v`1.2.0` · last verified **2026-07-29**
>
> Load this when changing SDK pins, running `uv lock --upgrade`, or after a new
> Claude Code / MCP SDK release. Pair with `sdk-migration.md` for the 1.x → 2.0 API rename.

**Goal:** upgrade **one server at a time** without taking down the whole
`~/.claude/mcps` fleet (or project MCPs) with a silent `FastMCP` import break.

---

## 0. Why this exists (house inventory, 2026-07-29)

Snapshot of **this machine’s** `~/.claude/mcps` + `~/.claude.json` (re-run §1 on
every machine — do not trust this table forever):

| Server | Kind | Declared pin | Locked / resolved | Risk |
|--------|------|--------------|-------------------|------|
| `activeview-rag` | Python | `mcp[cli]>=1.0.0` | `mcp` **1.28.1** | **Unbounded** — `uv lock --upgrade` → **2.0.0** |
| `exittus_notaas` | Python | `mcp[cli]>=1.0.0` | **1.28.1** | Unbounded |
| `omie` | Python | `mcp[cli]>=1.0.0` | **1.28.1** | Unbounded |
| `legolas-cname` | Python | `mcp[cli]>=1.0.0` | **1.27.1** | Unbounded |
| `legolas-d1` | Python | `mcp[cli]>=1.0.0` | **1.27.1** | Unbounded |
| `legolas-d6` | Python | `mcp[cli]>=1.0.0` | **1.27.1** | Unbounded |
| `legolas-oc1` | Python | `mcp[cli]>=1.0.0` | **1.27.1** | Unbounded |
| `exittus-inspect` | Node | `@modelcontextprotocol/sdk` `^1.0.0` | **1.29.0** | Low for v2 rename; can still jump within 1.x |
| `exittus` / `plowf` | npx wrapper | `@ivotoby/openapi-mcp-server` | remote | Pin npx package version if upgrades bite |
| `github-mcp-server` | Go binary | n/a | own release | Follow upstream releases |
| Project MCPs (`web-scraper`, `pubweb-inspect`, `pubweb-ads`, …) | mixed | check each repo | — | Same rules |

**Client (Claude Code `2.1.220` on this host):** negotiates ≤ `2025-11-25`
(`2026-07-28` / `server/discover` = **0** hits in the binary). While that holds,
**stay on Python `mcp` 1.x with an upper bound `<2`**. Do **not** mass-migrate to
`mcp` 2.0.0 / `@modelcontextprotocol/server` 2.0.0 until the client advertises
`2026-07-28`.

Published SDKs the day of this note: PyPI `mcp` **2.0.0**, npm
`@modelcontextprotocol/sdk` **1.30.0**, `@modelcontextprotocol/server` **2.0.0**.

---

## 1. Inventory (run first, every time)

```bash
# Client protocol ceiling
B=$(readlink -f "$(command -v claude)")
for v in 2025-06-18 2025-11-25 2026-07-28; do
  printf "%-12s %s\n" "$v" "$(grep -ac "$v" "$B" || true)"
done
grep -ac "server/discover" "$B" || true   # 0 = still pre-2026-07-28 client

# Registry latest (drift check)
curl -s https://pypi.org/pypi/mcp/json | python3 -c \
  'import json,sys; print("pypi mcp", json.load(sys.stdin)["info"]["version"])'
npm view @modelcontextprotocol/sdk version
npm view @modelcontextprotocol/server version

# Per-server pins + locked mcp version under ~/.claude/mcps
python3 <<'PY'
import json, re, tomllib
from pathlib import Path
root = Path.home() / ".claude" / "mcps"
for d in sorted(p for p in root.iterdir() if p.is_dir() and not p.name.startswith(".")):
    pj, pkg = d / "pyproject.toml", d / "package.json"
    if pj.exists():
        deps = tomllib.loads(pj.read_text()).get("project", {}).get("dependencies") or []
        pin = next((x for x in deps if "mcp" in x.lower()), "?")
        lock = (d / "uv.lock").read_text() if (d / "uv.lock").exists() else ""
        m = re.search(r'name\s*=\s*"mcp"\s*\nversion\s*=\s*"([^"]+)"', lock)
        print(f"{d.name:22} py  pin={pin:28} locked={m.group(1) if m else '-'}")
    elif pkg.exists():
        data = json.loads(pkg.read_text())
        deps = {**(data.get("dependencies") or {}), **(data.get("devDependencies") or {})}
        mcp = {k: v for k, v in deps.items() if "modelcontextprotocol" in k}
        print(f"{d.name:22} js  {mcp or '(no MCP SDK)'}")
    else:
        print(f"{d.name:22} other")
PY
```

Flag every line where the pin is `>=1.0.0`, `*`, or missing an **upper major**.

---

## 2. Choose the lane (do not mix)

| Client max negotiation | Python target | Node target |
|------------------------|---------------|-------------|
| ≤ `2025-11-25` (**today**) | `mcp[cli]>=1.29,<2` | `@modelcontextprotocol/sdk@^1.30.0` |
| `2026-07-28` (+ `server/discover`) | `mcp>=2.0,<3` + API rename | `@modelcontextprotocol/server@^2.0.0` |

Rules:

1. **One server per PR / session.** Never `for d in ~/.claude/mcps/*; do uv lock --upgrade; done`.
2. **Bound the pin before any upgrade command.** Unbounded `>=1.0.0` is a landmine.
3. **Commit / copy the lockfile** (`uv.lock` / `package-lock.json`) before and after.
4. **Prefer patch/minor within the current major** until the client moves.
5. npx wrappers (`exittus`, `plowf`): pin with `@ivotoby/openapi-mcp-server@x.y.z` in
   `~/.claude.json` args if a floating `-y` pulls a bad release.

---

## 3. Safe path A — stay on 1.x (recommended while client is pre-2026-07-28)

Do this for **each** Python house server (`legolas-*`, `omie`, `activeview-rag`, …).

### A1. Snapshot

```bash
SERVER=~/.claude/mcps/<name>
cp -a "$SERVER" "/tmp/mcp-backup-<name>-$(date +%Y%m%d%H%M%S)"
cd "$SERVER"
git status 2>/dev/null || true   # if the server is a git repo, commit first
```

### A2. Bound the pin (no behavior change yet)

In `pyproject.toml`:

```toml
# BEFORE (unsafe)
dependencies = ["mcp[cli]>=1.0.0"]

# AFTER (safe for current Claude Code)
dependencies = ["mcp[cli]>=1.29,<2"]
```

Node (`package.json`):

```json
"@modelcontextprotocol/sdk": "^1.30.0"
```

### A3. Refresh lock **without** jumping major

```bash
# Python — resolve within <2 only
uv lock          # NOT: uv lock --upgrade  (until pin is bounded)
uv sync

# Confirm locked major is still 1.x
rg -n 'name = "mcp"' -A1 uv.lock | head -5
```

```bash
# Node
npm install @modelcontextprotocol/sdk@^1.30.0
# confirm package-lock still under @modelcontextprotocol/sdk 1.x
```

### A4. Smoke (stdio must stay clean)

```bash
# Must print JSON-RPC on stdout only when spoken to — no banner on start
uv run python -c "from mcp.server.fastmcp import FastMCP; print('import-ok', file=__import__('sys').stderr)"

# Full start (Ctrl+C after tools/list via inspector, or timeout)
npx @modelcontextprotocol/inspector uv run python server.py
# or: timeout 5 uv run python server.py  → should idle, not crash
```

Still import `FastMCP` from `mcp.server.fastmcp` — **do not** switch to `MCPServer` on this lane.

### A5. Re-register / reconnect

- Restart Claude Code session (or toggle the server off/on in MCP settings).
- Call one **read-only** tool that you know works (list/status).
- Only then move to the next server.

### A6. Optional: bump 1.27 → 1.28/1.29 within `<2`

```bash
uv lock --upgrade-package mcp
uv sync
# re-run A4 smoke + one live tool call
```

---

## 4. Safe path B — migrate one server to MCP 2.0 / spec 2026-07-28

**Only when** §1 shows the client negotiates `2026-07-28` (or you accept running a
2.0 server that still speaks older revisions — the **Python import API** still breaks).

1. Finish path A on that server (bounded pin + backup).
2. Open `reference/sdk-migration.md` and apply the rename (`FastMCP` → `MCPServer`).
3. Change pin to `mcp>=2.0,<3` (Python) or move Node to `@modelcontextprotocol/server`.
4. `uv lock && uv sync` (or npm install) **on that directory only**.
5. Inspector + 10 evals (`reference/evaluation.md`) before touching the next server.
6. Keep a sibling checkout or `/tmp` backup until 24h of real use look clean.

---

## 5. Rollback (when something breaks)

```bash
# Restore tree
rm -rf ~/.claude/mcps/<name>
cp -a /tmp/mcp-backup-<name>-* ~/.claude/mcps/<name>

# Or git
cd ~/.claude/mcps/<name> && git checkout -- pyproject.toml uv.lock

uv sync   # or npm ci
# restart Claude session / MCP
```

If **many** servers died at once after a global upgrade: restore from backups in
dependency order (start with the one you need for the current task), and
**immediately** apply A2 bounds on every survivor so the next `uv lock --upgrade`
cannot repeat the outage.

---

## 6. FORBIDDEN (fleet killers)

| Action | Why |
|--------|-----|
| Leave `mcp[cli]>=1.0.0` / unbounded pins | Next upgrade installs `2.0.0` → `FastMCP` import dies |
| `uv lock --upgrade` / `uv sync --upgrade` across all mcps | Cascading outage |
| Delete `uv.lock` “to refresh” with unbounded pin | Same as above |
| Migrate all servers to 2.0 in one afternoon | No rollback granularity |
| Upgrade SDK and rewrite tools in the same step | Cannot tell which broke |
| Print to stdout in stdio servers while “testing” | Corrupts JSON-RPC |

---

## 7. Definition of done (per server)

- [ ] Pin has upper major (`<2` or `<3` as appropriate)
- [ ] Lockfile updated and kept
- [ ] Import smoke + inspector OK
- [ ] One real read-only tool call from the client OK
- [ ] Backup retained until next successful session
- [ ] Only **then** start the next server

---

## See also

- Skill body §1 (default pins) and §0 traps
- `sdk-migration.md` — API rename details for path B
- `evaluation.md` — regression questions after a 2.0 move
- `house-pattern.md` — layout under `~/.claude/mcps`
