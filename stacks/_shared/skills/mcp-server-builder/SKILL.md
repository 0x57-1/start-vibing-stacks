---
name: mcp-server-builder
version: 1.2.0
description: >
  Build, audit, upgrade or modify MCP servers (protocol 2026-07-28 + safe 1.x
  fleet upgrades). Covers version-pin traps (Python mcp 2.0.0 renamed FastMCP→
  MCPServer; Node v2 is @modelcontextprotocol/server), unbounded pins like
  mcp[cli]>=1.0.0, one-server-at-a-time upgrade (reference/safe-upgrade.md),
  deprecated surfaces, tool naming/annotations/pagination, and ~/.claude/mcps
  house pattern. Invoke before creating/editing a server, before uv lock
  --upgrade / npm update on MCP deps, before touching pyproject.toml or
  package.json that declares an MCP SDK, and before registering in ~/.claude.json.
---

# MCP Server Builder — protocol 2026-07-28

**Invoke before writing or changing ANY MCP server code, dependency pin, or registration.**

> The 2026-07-28 revision turned MCP from a bidirectional stateful protocol into
> plain request/response. Most of that is the SDK's job — but the **version pins
> are not**, and getting them wrong silently breaks every server at once.

| | |
|---|---|
| **Skill version** | `1.2.0` |
| **Spec revision covered** | `2026-07-28` |
| **Primary source** | [Bringing MCP 2026-07-28 to Claude](https://claude.com/blog/bringing-mcp-2026-07-28-to-claude) |
| **Last verified** | **2026-07-29** — Claude Code `2.1.220` (negotiates ≤ `2025-11-25`), PyPI `mcp` `2.0.0`, npm `@modelcontextprotocol/sdk` `1.30.0`, `@modelcontextprotocol/server` `2.0.0` |
| **House fleet note** | Most `~/.claude/mcps/*` Python servers still declare `mcp[cli]>=1.0.0` with locks on **1.27–1.28** — see `reference/safe-upgrade.md` before any upgrade |

> **Re-verify before trusting §1.** The pin table depends on what the local client
> negotiates and on the latest published SDKs — both move. Run the check in §1,
> compare against *Last verified*, and bump this block when it drifts.

---

## 0. Read this first — the two traps

### Trap 1: `mcp` 2.0.0 renamed the server class

The Python SDK `mcp` **2.0.0** shipped **2026-07-28** (same day as the spec).

```python
from mcp.server.fastmcp import FastMCP   # 1.x  — what our servers use
from mcp.server import MCPServer         # 2.0  — the rename
```

A dependency line of `mcp[cli]>=1.0.0` resolves to **2.0.0** on any
`uv lock --upgrade` / `uv sync --upgrade` / deleted lockfile. The import dies and
the server is gone. **Never leave an unbounded MCP SDK constraint.**

### Trap 2: the Node v2 is a different package, not a newer version

```
@modelcontextprotocol/sdk     → 1.30.0 = last 2025-era release
@modelcontextprotocol/server  → 2.0.0  = 2026-07-28 (server half)
@modelcontextprotocol/client  → 2.0.0  = 2026-07-28 (client half)
```

`^1.0.0` will never reach v2 (different name), so Node is safe from silent
breakage — but `^0.6.0` means a SDK from Nov-2024, five majors behind.

---

## 1. Default pins (as of July 2026)

**Check the client first.** The pin depends on what the local client negotiates:

```bash
B=$(readlink -f "$(command -v claude)")
for v in 2025-06-18 2025-11-25 2026-07-28; do printf "%-12s %s\n" "$v" "$(grep -ac "$v" "$B")"; done
grep -ac "server/discover" "$B"    # 0 = client is still pre-2026-07-28
```

| Client negotiates | Python | Node |
|---|---|---|
| **max `2025-11-25`** (today) | `mcp[cli]>=1.29,<2` | `@modelcontextprotocol/sdk@^1.30.0` |
| `2026-07-28` | `mcp>=2.0,<3` | `@modelcontextprotocol/server@^2.0.0` |

Rules that never change:

- **Always upper-bound the major.** `>=1.0.0` and `*` are defects, not flexibility.
- **Commit the lockfile** (`uv.lock`, `package-lock.json`). It is the only thing
  standing between a stale constraint and a dead server.
- `mcp` 2.0.0 *serves every earlier revision from the same server* — so the wire
  is backward compatible. **The break is purely in the Python API**, which is why
  you migrate on your schedule, not the spec's.
- Do **not** confuse the SDK's bundled `mcp.server.fastmcp` with the standalone
  PyPI `fastmcp` package (v3.x, different project, different API).

For the exact rename list, load `reference/sdk-migration.md`.

**Upgrading existing servers** (not greenfield): load `reference/safe-upgrade.md`
**before** `uv lock --upgrade`, deleting a lockfile, or changing a pin. Default
lane while Claude Code max-negotiates `2025-11-25`: bound to `mcp[cli]>=1.27,<2`
and upgrade **one directory at a time**.

---

## 2. Never adopt these (Deprecated or Removed)

`reference/protocol-2026-07-28.md` has the full delta. The short version — if you
are about to write any of this, stop:

| Surface | Status | Do instead |
|---|---|---|
| `initialize` / `notifications/initialized` | **removed** | nothing — SDK puts version + capabilities in `_meta` per request |
| Sessions, `Mcp-Session-Id` header | **removed** | server-minted handle passed as an ordinary tool argument |
| `ping` | **removed** | — |
| `logging/setLevel`, `notifications/message` unprompted | **removed** | read `io.modelcontextprotocol/logLevel` from request `_meta` |
| `resources/subscribe` / `unsubscribe`, HTTP GET stream | **removed** | `subscriptions/listen` |
| SSE resumability (`Last-Event-ID`) | **removed** | re-issue the request with a new id |
| server→client requests (`roots/list`, `sampling/createMessage`, `elicitation/create`) | **removed** | MRTR: return `InputRequiredResult` (`resultType:"input_required"`) with `inputRequests` |
| `tasks/result`, `tasks/list` | **removed** | extension `io.modelcontextprotocol/tasks`: `tasks/get` (poll) + `tasks/update` |
| **Roots, Sampling, Logging** features | **deprecated** (≥12 mo window) | tool params / resource URIs for Roots; call the LLM provider API directly instead of Sampling; **stderr or OpenTelemetry** instead of Logging |
| **HTTP+SSE transport** | **deprecated** | Streamable HTTP |
| **DCR (RFC 7591)** | **deprecated** | Client ID Metadata Documents |
| `includeContext: "thisServer"` / `"allServers"` | **deprecated** | omit, or `"none"` |

Newly **required** on the server side (the SDK emits these — verify, don't hand-roll):

- `resultType` on every result (`"complete"` | `"input_required"`)
- `server/discover` RPC — every server **MUST** implement it
- `ttlMs` + `cacheScope` (`"public"`|`"private"`) on `tools/list`, `prompts/list`,
  `resources/list`, `resources/read`, `resources/templates/list`
- `_meta['io.modelcontextprotocol/serverInfo']` stamped on every 2026-era response

Error codes changed: resource-not-found is now **`-32602`** (was `-32002`).
`-32000..-32019` stays implementation-defined; **`-32020..-32099` is reserved for
the spec** — do not allocate there.

---

## 3. Workflow

Four phases, in order. Do not skip phase 1.

### Phase 1 — Research before typing
1. Read the target API docs; list the endpoints worth exposing.
2. **Do not mirror the API 1:1.** Expose the operations an agent actually needs;
   collapse chatty endpoint chains into one tool.
3. Decide transport (§4) and auth (env vars via `.env.d/`, never inline).
4. Check whether an existing server under `~/.claude/mcps/` already covers it.

### Phase 2 — Implement
Follow §4–§6 and `reference/house-pattern.md`.

### Phase 3 — Review and test
```bash
npx @modelcontextprotocol/inspector uv run server.py     # or: node server.js
```
Verify: server starts, `tools/list` returns, every tool round-trips, errors are
descriptive, **nothing is written to stdout**.

### Phase 4 — Evals (mandatory for a new server)
Write **10** read-only, multi-hop questions with single verifiable answers.
Format and runner in `reference/evaluation.md`. A server nobody evaluated is a
server nobody knows works.

---

## 4. Transport

| | stdio | Streamable HTTP |
|---|---|---|
| Use for | local tools, everything under `~/.claude/mcps` | remote, multi-client |
| Clients | single | many |

**Default to stdio.** Never HTTP+SSE (deprecated since `2025-03-26`, now formally
Deprecated under the lifecycle policy).

> **stdio hard rule: stdout belongs to JSON-RPC.** One stray `print()` /
> `console.log()` corrupts the stream and the server dies with a parse error.
> Log to **stderr**. In Python, `print(..., file=sys.stderr)` or `logging` with a
> `StreamHandler(sys.stderr)`.

For local Streamable HTTP: bind `127.0.0.1` (not `0.0.0.0`), validate the
`Origin` header, enable DNS-rebinding protection.

---

## 5. Tool design

**Naming** — `{service}_{action}_{resource}`, snake_case, always service-prefixed
(a session loads a dozen servers at once; `send_message` will collide,
`slack_send_message` will not). Verb first. No version numbers.

**Server naming** — Python `{service}_mcp`, Node `{service}-mcp-server`.

**Descriptions** must match behaviour exactly and narrowly. A description that
oversells is worse than a missing tool: the agent will call it and get garbage.

**Annotations on every tool** — they drive whether the client dares call it:

| Annotation | Set true when |
|---|---|
| `readOnlyHint` | does not modify anything |
| `destructiveHint` | may destroy/overwrite (**default is true** — set false explicitly on safe tools) |
| `idempotentHint` | repeat calls with same args change nothing further |
| `openWorldHint` | touches external entities |

They are **hints, not a security boundary**. Enforce in code (§6).

**Pagination** on every list tool: respect `limit` (default 20–50), return
`total`, `count`, `offset`, `has_more`, `next_offset`. Never load the full set
into memory.

**Response shape** — offer `response_format` of `"markdown"` (default, human
readable, timestamps formatted, `Name (id)`) and `"json"` (complete, machine
readable). Schemas may now use any JSON Schema 2020-12 keyword, including `$ref`.

**Return tools from `tools/list` in a deterministic order** — the spec asks for
it, and it directly improves prompt-cache hit rate.

**Errors** — report inside the result (`isError: true` + text), not as a
protocol error. Say what to do next: *"Error: 412 results. Retry with
`filter='active_only'`."* Never leak internals or stack traces.

---

## 6. Security (non-negotiable)

- Secrets from env / `.env.d/` files. **Never** inline, never in a tool argument
  default, never echoed back in a response.
- Validate every input with Pydantic (Python) or Zod (Node).
- Paths: reject traversal. Subprocess: **argument list, never `shell=True`**, and
  `shlex.quote()` anything interpolated into a remote command.
- **Any free-form execution tool needs the 3-layer guard** used by `legolas-d1`/
  `legolas-d6` — regex blocklist, then a real shell parse (`bashlex`) rejecting
  `$(...)`/backticks/`<(...)`/`&`, then re-validating **each subcommand** after
  `;`/`&&`/`||`. A single regex layer is not enough: see the 2026-06-16 incident
  in `~/.claude/mcps/legolas-d6/SECURITY.md`, where `find /var/cache/nginx
  -mindepth 1 -delete` passed the blocklist and took every site on the box down.
- Ship a `SECURITY.md` next to any server with a write or exec tool, documenting
  the blocklist and the reasoning. Future agents will extend the blocklist; they
  need the *why*, not just the patterns.

---

## 7. House pattern

Full detail in `reference/house-pattern.md`. Shape:

```
~/.claude/mcps/<name>/
├── server.py | server.js      # single entrypoint
├── pyproject.toml             # bounded pin (§1)
├── uv.lock                    # committed
├── catalog.json               # when mirroring an external API
├── SECURITY.md                # when there is a write/exec tool
└── README.md
```

Module docstring at the top of `server.py` states host, user, port, key path and
the **safety model** — that header is what a future agent reads first.

Register in `~/.claude.json` under user scope (`type: "stdio"`), pointing at the
`.venv` interpreter or `uv`.

---

## 8. Checklist before declaring done

- [ ] SDK pin has an upper major bound; lockfile committed
- [ ] Existing fleet: no unbounded `mcp[cli]>=1.0.0` left after touch (see `safe-upgrade.md`)
- [ ] Nothing from §2 adopted
- [ ] stdio: zero writes to stdout
- [ ] Every tool: service-prefixed name, exact description, 4 annotations
- [ ] List tools paginate and report `has_more`
- [ ] `tools/list` order is deterministic
- [ ] Secrets only from env / `.env.d/`
- [ ] Free-form exec tool has the 3-layer guard + `SECURITY.md`
- [ ] Inspector run clean
- [ ] 10 evals written and passing (new server or 2.0 migration)
- [ ] Registered in `~/.claude.json`

---

## Reference

| File | Load when |
|---|---|
| `reference/safe-upgrade.md` | **upgrading** existing `~/.claude/mcps` / project MCPs without fleet outage |
| `reference/protocol-2026-07-28.md` | need the full spec delta, `_meta` keys, error-code policy |
| `reference/sdk-migration.md` | migrating 1.x → 2.0.0 (Python or Node) |
| `reference/house-pattern.md` | creating a server under `~/.claude/mcps` |
| `reference/evaluation.md` | phase 4 — writing/running the 10 evals |

---

## Sources

| What | Link |
|---|---|
| **Announcement (primary source for this skill)** | https://claude.com/blog/bringing-mcp-2026-07-28-to-claude |
| Spec `2026-07-28` | https://modelcontextprotocol.io/specification/2026-07-28/ |
| **Changelog vs `2025-11-25`** | https://modelcontextprotocol.io/specification/2026-07-28/changelog |
| Deprecated-features registry | https://modelcontextprotocol.io/specification/2026-07-28/deprecated |
| Feature lifecycle / deprecation policy | https://modelcontextprotocol.io/community/feature-lifecycle |
| MRTR pattern | https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr |
| Streamable HTTP transport | https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http |
| Extensions overview | https://modelcontextprotocol.io/docs/extensions/overview |
| Python SDK migration guide | https://py.sdk.modelcontextprotocol.io/migration/ |
| Python SDK releases | https://github.com/modelcontextprotocol/python-sdk/releases |
| TypeScript SDK releases | https://github.com/modelcontextprotocol/typescript-sdk/releases |
| MCP Inspector | https://github.com/modelcontextprotocol/inspector |
| Official `mcp-builder` skill (base, Apache-2.0) | https://github.com/anthropics/skills/tree/main/skills/mcp-builder |

Adapted from Anthropic's official `mcp-builder` skill, which as of **2026-07-29**
was last substantively updated **2025-12-01** — it predates the `2026-07-28`
revision and pins no SDK versions. **This skill supersedes it**; do not install
the upstream one on top.

### Changelog

| Version | Date | Change |
|---|---|---|
| `1.2.0` | 2026-07-29 | Python pin floor `>=1.29,<2` (1.29.0 = same-day as spec). |
| `1.1.0` | 2026-07-29 | `reference/safe-upgrade.md` — inventory of house MCPs, bound pins, one-server upgrade + rollback. |
| `1.0.0` | 2026-07-29 | Initial. Covers spec `2026-07-28`; pin table verified against Claude Code `2.1.220`. |
