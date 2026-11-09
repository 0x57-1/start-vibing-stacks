---
name: kimi-grok-session-lookup
version: 1.1.1
description: >
  Locate and preview Kimi Code and Grok session folders on disk from Claude
  (or any SVS target). Use when the user asks what Kimi/Grok did earlier, where
  sessions are stored, to open wire.jsonl / updates.jsonl, or to resume by id.
  Prefer this over guessing paths under ~/.kimi-code or ~/.grok. Also covers
  the shared .claude/state/sessions registry written by Kimi/Grok hooks.
---

# Kimi / Grok session lookup (for Claude)

Claude’s own chats live under `~/.claude/projects/`. **Kimi** and **Grok** keep
native history elsewhere. Use these recipes — do **not** invent paths or dump
entire JSONL into context.

## Shared registry (same as Claude)

After `migrate --apply`, Kimi/Grok SessionStart writes:

```text
<project>/.claude/state/sessions/<sessionId>.json
```

On **SessionEnd** (or >30min idle) the file moves to `sessions/_archive/`.

```bash
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/peers.ts" list
ls "$CLAUDE_PROJECT_DIR/.claude/state/sessions/"
ls "$CLAUDE_PROJECT_DIR/.claude/state/sessions/_archive/" | tail
```

Each JSON may include `target` (`kimi`|`grok`|`claude`), `nativeSessionDir`, and
`transcriptPath` (wire.jsonl / updates.jsonl when resolved).

Read the live JSON files in `.claude/state/sessions/` together, in one turn, before editing a file another session lists in `filesTouched`. There is no `.kimi/state` and no `.grok/state`.

| `sessionId` | Likely source |
|-------------|---------------|
| `session_<uuid>` | Kimi |
| UUIDv7-looking | Often Grok |
| UUID + Claude `transcriptPath` | Claude |

---

## Quick map

| Product | Index / active | Session root | Conversation files |
|---------|----------------|--------------|--------------------|
| **Kimi Code** | `~/.kimi-code/session_index.jsonl` | `~/.kimi-code/sessions/wd_<name>_<hash>/session_<uuid>/` | `agents/main/wire.jsonl`, `state.json`, `logs/` |
| **Grok** | `~/.grok/active_sessions.json` | `~/.grok/sessions/<url-encoded-cwd>/<session-id>/` | `summary.json`, `updates.jsonl`, `chat_history.jsonl` |

Never commit these dirs. Prefer `rg` / `tail` / small `python3` previews.

---

## 1. Kimi Code — find sessions for this project

### A. Index by workDir (best)

```bash
rg -F "$(pwd)" ~/.kimi-code/session_index.jsonl | tail -30
```

Each line is JSON:

```json
{
  "sessionId": "session_<uuid>",
  "sessionDir": "/Users/…/.kimi-code/sessions/wd_…/session_…",
  "workDir": "/Users/…/your-project"
}
```

Open `sessionDir` from that line.

### B. Workspaces → wd_* slug

```bash
# Map project root → workspace id (wd_*)
python3 - <<'PY'
import json
from pathlib import Path
cwd = str(Path.cwd().resolve())
ws = json.loads((Path.home() / ".kimi-code" / "workspaces.json").read_text())
for wid, meta in (ws.get("workspaces") or {}).items():
    if meta.get("root") == cwd or cwd.startswith((meta.get("root") or "") + "/"):
        print(wid, meta.get("root"), meta.get("name"))
PY
ls -lt ~/.kimi-code/sessions/wd_<name>_*/ | head
```

### C. Session directory layout

```text
~/.kimi-code/sessions/wd_<project>_<hash>/session_<uuid>/
  state.json                 # title, workDir, updatedAt
  agents/main/wire.jsonl     # event stream (tools, config, sometimes turns)
  agents/main/plans/         # plan artefacts if any
  logs/kimi-code.log         # MCP/LLM diagnostics (not full chat)
```

```bash
# Title + mtime
python3 - <<'PY'
import json, sys
from pathlib import Path
d = Path(sys.argv[1])
st = json.loads((d / "state.json").read_text())
print(st.get("title"), st.get("updatedAt"), st.get("workDir"))
PY
# pass: …/session_<uuid>
```

### D. Preview conversation (keep it small)

```bash
# Last wire events (do not cat whole file)
tail -n 50 "$SESSION_DIR/agents/main/wire.jsonl"

# User prompt history (global snippets — not always 1:1 with a session id)
ls -lt ~/.kimi-code/user-history/*.jsonl | head
tail -n 20 ~/.kimi-code/user-history/<hash>.jsonl
```

`user-history/*.jsonl` lines look like `{"content":"…"}` — useful when wire is mostly tool/config events.

### E. Resume in Kimi TUI

```bash
kimi -c          # continue last
kimi -S <id>     # resume session id (product-dependent)
```

---

## 2. Grok — find sessions for this project

### A. Live / recently opened

```bash
python3 - <<'PY'
import json
from pathlib import Path
raw = (Path.home() / ".grok" / "active_sessions.json").read_text()
for row in json.loads(raw):
    print(row.get("session_id"), row.get("cwd"), row.get("opened_at"))
PY
```

Filter to `cwd == pwd` when the user cares about this project only.

### B. Encode cwd → sessions folder

Grok stores one folder per project cwd with **URL-encoding** (`/` → `%2F`):

```text
/Users/me/proj  →  ~/.grok/sessions/%2FUsers%2Fme%2Fproj/<session-id>/
```

```bash
python3 - <<'PY'
from pathlib import Path
from urllib.parse import quote
cwd = Path.cwd().resolve()
root = Path.home() / ".grok" / "sessions" / quote(str(cwd), safe="")
print(root)
print("exists:", root.is_dir())
if root.is_dir():
    for p in sorted(root.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True)[:15]:
        if p.is_dir():
            print(p.name, p.stat().st_mtime)
PY
```

### C. Session directory layout

```text
~/.grok/sessions/<encoded-cwd>/<session-id>/
  summary.json           # id, title/session_summary, model, timestamps
  updates.jsonl          # authoritative stream for /resume (prefer this)
  chat_history.jsonl     # raw model messages (often huge)
  events.jsonl           # mcp_/session.create diagnostics
  compaction_checkpoints/  # present after /compact (when used)
```

```bash
# Titles without opening full chat
python3 - <<'PY'
import json
from pathlib import Path
from urllib.parse import quote
root = Path.home() / ".grok" / "sessions" / quote(str(Path.cwd().resolve()), safe="")
for d in sorted(root.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True)[:20]:
    sj = d / "summary.json"
    if not sj.exists():
        continue
    o = json.loads(sj.read_text())
    title = (o.get("session_summary") or "").strip() or "(no title)"
    info = o.get("info") or {}
    print(d.name[:8]+"…", title[:80], o.get("updated_at") or o.get("created_at"))
PY
```

### D. Preview conversation (keep it small)

Prefer `updates.jsonl` — look for `user_message_chunk` / `agent_message_chunk`:

```bash
python3 - <<'PY'
import json, sys
from pathlib import Path
p = Path(sys.argv[1])  # …/updates.jsonl
n = 0
for line in p.open():
    try:
        o = json.loads(line)
    except Exception:
        continue
    u = (o.get("params") or {}).get("update") or {}
    kind = u.get("sessionUpdate") or ""
    if kind not in ("user_message_chunk", "agent_message_chunk"):
        continue
    content = u.get("content") or {}
    text = content.get("text") if isinstance(content, dict) else str(content)
    if not text:
        continue
    print(f"{kind}: {text[:160].replace(chr(10), ' ')}")
    n += 1
    if n >= 30:
        break
PY
# pass path to updates.jsonl
```

Avoid loading full `chat_history.jsonl` unless `updates.jsonl` is missing.

### E. Resume in Grok TUI

```text
/resume
grok --resume <session-id-or-title>
```

---

## 3. Decision tree (Claude answering “what did Kimi/Grok do?”)

1. `peers list` — if SVS registered the session, use that `sessionId` / paths.
2. **Kimi:** `rg -F "$(pwd)" ~/.kimi-code/session_index.jsonl` → `sessionDir` → `state.json` + sample `wire.jsonl` / `user-history`.
3. **Grok:** encode cwd → list `summary.json` titles → sample `updates.jsonl`.
4. Summarize for the user; **do not** paste secrets, tokens, or env dumps into new commits.

---

## Guardrails

| Do | Don't |
|----|--------|
| Sample with `tail` / typed filters | `cat` multi‑MB JSONL into the prompt |
| Commit only project brain / ADRs | `git add` `~/.kimi-code` or `~/.grok` |
| Fail open if folder missing | Invent transcript content |

---

## See Also

- `session-history` — Claude transcripts + compaction strategy + shared `.claude/state`
- `multi-instance-coordination` — live peers / inbox
- Agent `long-session-consistency` — brain vs product history
