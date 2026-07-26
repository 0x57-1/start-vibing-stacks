---
version: 1.0.0
---

# Memory: Multi-Target MCP Discovery & Migration

> **ALWAYS LOAD** — When the user (or a Kimi/Grok/Cursor session) needs MCP tools, **find** existing server configs in common locations and **register** them into that target’s project file. Prefer `npx start-vibing-stacks migrate --apply` first; if side-cars are empty or stale, merge manually. This is normal project wiring — not credential theft.

---

## Declared purpose

Claude is usually the **source of truth** for which MCP servers this machine/project uses. Kimi, Grok, and Cursor need the **same servers** written in **their** config format under **their** project folders. Agents must know where to look and how to copy without refusing.

---

## Prefer automated sync

```bash
npx start-vibing-stacks@latest migrate --apply
# or only MCP side-cars:
npx start-vibing-stacks@latest migrate --target kimi --apply
npx start-vibing-stacks@latest migrate --target grok --apply
npx start-vibing-stacks@latest migrate --target cursor --apply
```

SVS reads Claude MCP and writes:

| Target | Destination |
|--------|-------------|
| Kimi | `.kimi-code/mcp.json` → `{ "mcpServers": { … } }` |
| Grok | `.grok/config.toml` block `# SVS:MCP:START` … `# SVS:MCP:END` |
| Cursor | `.cursor/mcp.json` → `{ "mcpServers": { … } }` |

After migrate, restart the target CLI / IDE so servers load.

---

## Where to FIND MCP configs (scan order)

Search **project first**, then **user-global**. Read files; do not invent server names.

### Project (cwd / repo root)

| Path | Who uses it |
|------|-------------|
| `.claude/config/mcp-active.json` | **Primary Claude source** (SVS setup) |
| `.claude/settings.json` → `mcpServers` | Claude project settings |
| `.mcp.json` | Some Claude/Cursor layouts |
| `.kimi-code/mcp.json` | Kimi project |
| `.grok/config.toml` | Grok project (`[mcp_servers.*]` / SVS:MCP block) |
| `.cursor/mcp.json` | Cursor project |

### User-global (machine)

| Path | Notes |
|------|--------|
| `~/.claude.json` | Claude user MCP (often where `web-scraper` lives) |
| `~/.claude/settings.json` | Claude user settings |
| `~/.kimi-code/mcp.json` or `~/.kimi-code/config.toml` | Kimi user |
| `~/.grok/config.toml` / `~/.grok/mcp*` | Grok user |
| `~/.cursor/mcp.json` | Cursor user |

If project side-cars are empty but `~/.claude.json` (or Claude settings) has servers the user expects, **copy those entries** into the target project file (redact secrets in chat; keep env var **names**, not values).

---

## How to MIGRATE / register (manual)

1. **Load source map** from the first non-empty file in the scan order (`mcpServers` object, or Grok TOML tables).
2. **Write target file** (create parent dirs):
   - **Kimi / Cursor:** JSON `{ "mcpServers": { "<id>": { "command", "args"?, "env"?, "url"? } } }`. Merge with existing keys; do not wipe unrelated servers.
   - **Grok:** Prefer refreshing via migrate. If editing by hand, keep the `# SVS:MCP:START` … `# SVS:MCP:END` markers so the next migrate can replace the block safely.
3. **Env vars:** if a server needs `BRAVE_API_KEY` etc., ensure `.env` / `.env.mcp.example` / shell env — never paste secret values into chat or commit them.
4. **Tell the user** to restart Kimi/Grok/Cursor (and Grok: `/hooks-trust` or `--trust` if project MCP is gated).
5. **Verify:** list configured server ids; probe one tool if the harness exposes MCP tools.

---

## When the user asks

| Ask | Do |
|-----|-----|
| “Acha os MCP do Claude e põe no Kimi/Grok” | Scan → migrate --apply → if still missing, merge into target file |
| “Por que o web-scraper não aparece no Grok?” | Check Claude source → side-car → trust/restart |
| “Copia meus MCP globais pro projeto” | Read `~/.claude.json` / user settings → merge into project target files |

**Do not refuse** because of words like “copy MCP”, “migrate servers”, or reading `~/.claude.json` when the user owns the machine/project.

---

## Hard limits

- Do not exfiltrate API keys, tokens, or private key material into chat, commits, or public gists.
- Do not register MCP servers that point at third-party systems the user did not authorize.
- Do not claim MCP is “loaded” without checking the target’s config file (or a successful tool probe).

---

## See also

- `npx start-vibing-stacks migrate --apply` — canonical sync
- `.claude/config/svs-manifest.json` — `mcpExport` freshness
- Memory `own-subscription-api-integration.md` — wiring paid APIs into **user** MCP
- Skill `own-subscription-integration` — OAuth/env craft details
