---
name: session-history
version: 1.1.0
description: >
  Find and read agent session history across Claude Code, Kimi Code, and Grok.
  Locate transcripts, list peers via .claude/state/, resume by id/title, and
  choose efficient context compaction (/compact vs project brain) without
  bloating the window. Use for past sessions, /resume, compact, or lost context.
---

# Session history (Claude / Kimi / Grok)

Three stores matter:

| Layer | Path | Purpose |
|-------|------|---------|
| **Coordination bus** | `<project>/.claude/state/` | Who is live, files touched, inbox (shared by SVS hooks) |
| **Claude transcripts** | `~/.claude/projects/<encoded-cwd>/` | Full Claude chat JSONL |
| **Native sessions** | `~/.kimi-code/sessions/…`, `~/.grok/sessions/…` | Kimi / Grok product history |

Do **not** commit any of these. Prefer Read / `rg` / small `python3` / `jq` — avoid dumping entire huge JSONL into context.

---

## 1. List live / recent peers (all targets)

```bash
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/peers.ts" list
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/peers.ts" locks --minutes 30
```

Or Read:

```
$CLAUDE_PROJECT_DIR/.claude/state/sessions/*.json
```

Each record may include `sessionId`, `title`, `transcriptPath`, `filesTouched`, `lastSeenAt`, `lastActivity`.

| `sessionId` shape | Likely product |
|-------------------|----------------|
| UUID (no prefix) | Claude or Grok |
| `session_<uuid>` | Kimi |
| UUIDv7-looking | Often Grok |

---

## 2. Claude Code — find a session & read history

### Encode project cwd → Claude folder

Absolute path with `/` → `-`:

```text
/Users/me/proj  →  ~/.claude/projects/-Users-me-proj/
```

```bash
# List recent transcripts for this project
ls -lt ~/.claude/projects/-$(pwd | sed 's|/|-|g' | sed 's|^-||')/*.jsonl | head
```

(If `pwd` is `/Users/f1sc4/.../agents-legolas`, folder is  
`~/.claude/projects/-Users-f1sc4-...-agents-legolas/`.)

### From SVS state

If `.claude/state/sessions/<id>.json` has `transcriptPath`, **Read that file** (or `rg` it).

### Resume in TUI

```bash
claude --resume                 # picker (titles ≈ SVS extractTitle)
claude --resume "<title-or-id>"
```

### Transcript JSONL (Claude)

Lines are JSON. Useful types: `user`, `assistant`, `system`, sometimes `summary` / title events.

```bash
# Last user + assistant snippets (safe preview)
python3 - <<'PY'
import json, sys
from pathlib import Path
p = Path(sys.argv[1])
for line in p.open():
    try: o = json.loads(line)
    except: continue
    t = o.get("type")
    if t not in ("user", "assistant", "summary"): continue
    text = o.get("summary") or ""
    msg = o.get("message") or o.get("content")
    if isinstance(msg, dict):
        content = msg.get("content")
        if isinstance(content, list):
            text = " ".join(
                (c.get("text") or "") for c in content if isinstance(c, dict)
            )[:200]
        elif isinstance(content, str):
            text = content[:200]
    elif isinstance(msg, str):
        text = msg[:200]
    if text.strip():
        print(f"{t}: {text[:180].replace(chr(10),' ')}")
PY
# pass path:  python3 … /path/to/<uuid>.jsonl
```

Sidecars (same stem as uuid): `<uuid>/subagents/`, `tool-results/`, `workflows/`.

---

## 3. Kimi Code — find a session & read history

### Index

```bash
rg -F "$(pwd)" ~/.kimi-code/session_index.jsonl | tail -20
```

Each line ≈ `{ sessionId, sessionDir, workDir }`.

### Session dir

```text
~/.kimi-code/sessions/wd_<slug>_<hash>/session_<uuid>/
  state.json
  agents/main/wire.jsonl    # conversation / tool stream
  logs/
```

```bash
# Preview wire (last messages)
tail -n 40 "$SESSION_DIR/agents/main/wire.jsonl" | head
```

Kimi sessions often register in `.claude/state/sessions/session_*.json` via SVS bridge (SessionStart) — use `peers list`, then open `sessionDir` from the index.

---

## 4. Grok — find a session & read history

### Active

```bash
cat ~/.grok/active_sessions.json
```

### On disk

```text
~/.grok/sessions/<url-encoded-cwd>/<session-id>/
  summary.json           # title, model, timestamps
  updates.jsonl          # authoritative conversation (/resume)
  chat_history.jsonl     # raw model messages
  events.jsonl           # mcp_/session.create diagnostics
```

Encode cwd like Grok: URL-encode path (`/` → `%2F`):

```bash
python3 - <<'PY'
from pathlib import Path
from urllib.parse import quote
cwd = Path.cwd().resolve()
enc = quote(str(cwd), safe="")
print(Path.home() / ".grok" / "sessions" / enc)
PY
ls -lt "$(python3 -c 'from pathlib import Path; from urllib.parse import quote; print(Path.home()/".grok"/"sessions"/quote(str(Path.cwd().resolve()), safe=""))')" | head
```

### Resume

```text
/resume
grok --resume <session-id-or-title>
```

Prefer `updates.jsonl` + `summary.json` over dumping full `chat_history.jsonl`.

---

## 5. Cross-target workflow (recommended)

When the user asks “what did Claude/Kimi/Grok do earlier?”:

1. `peers list` + Read matching `.claude/state/sessions/<id>.json`
2. If `transcriptPath` → Claude JSONL
3. Else branch by id:
   - `session_*` → Kimi `session_index.jsonl` → `wire.jsonl`
   - else try Claude `~/.claude/projects/.../<id>.jsonl`
   - else try Grok `~/.grok/sessions/<encoded>/…/updates.jsonl`
4. Summarize; do not paste secrets from transcripts into new commits or public docs

---

## 6. Shared `.claude/state` (communication bus)

SVS does **not** create `.kimi/state` or `.grok/state`. All targets share:

```text
.claude/state/
  sessions/          registry + heartbeat
  inbox/             peers notify
  file-touches.jsonl edit log
```

| Target | How it joins the bus |
|--------|----------------------|
| Claude | Native hooks in `.claude/settings.json` |
| Kimi | Full hook set via `svs-bridge` (SessionStart → Stop) |
| Grok | Native `.grok/hooks/svs.json` via bridge (incl. SessionStart/End when exported) |

Messaging:

```bash
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/peers.ts" notify <short-id> "message"
```

Requires the peer to run UserPromptSubmit/SessionStart drains (Kimi yes; Grok SessionStart registers — inbox drain on prompt if UserPromptSubmit is wired).

---

## Context compaction (efficient — do not explode the window)

### What Claude has today (SVS)

| Mechanism | Role |
|-----------|------|
| Product `/compact` | Summarizes transcript inside the model window |
| `PreCompact` hook | Stamps `.claude/brain/tasks/<branch>.md` before compress |
| SessionStart brief | Re-injects branch + Next step + Recent Change (~1.2 KB) after startup/resume/compact |
| `claude-md-compactor` | Keeps **CLAUDE.md / skills** small (instruction budget), not chat history |
| Domains + ADRs | Settled knowledge via grep — not pasted every turn |

Nested `CLAUDE.md` does **not** survive `/compact` — promote critical bits to rules.

### Kimi Code

| Tool | Notes |
|------|--------|
| Auto-compact | When context nears limit (`loop_control.compaction_trigger_ratio`, default ~0.85) |
| `/compact [hint]` | Manual; pass focus e.g. `/compact keep migration plan` |
| `/clear` | Wipes conversation context (session state like approvals may remain) |
| `-c` / `-S` | Continue / resume session from disk |
| Status bar | Watch % before compacting |

**Efficient pattern:** compact with a **hint** pointing at the brain Next step; do not re-attach full memories or skill trees after compact — SessionStart brief + Read one domain/ADR is enough.

### Grok

| Tool | Notes |
|------|--------|
| Auto-compact | Near context limit (`context_window` / model config) |
| `/compact [context]` | Manual; optional preserve instructions |
| `compaction_checkpoints/` | Under session dir after compact |
| `/session-info` | Token usage |
| `--experimental-memory` / `[memory] enabled` | Cross-session recall (experimental, **off by default**) |
| `/new` | Fresh conversation |

**Efficient pattern:** prefer **project brain + domains** over enabling experimental memory for every session (memory indexes grow and can add noise). Use `/compact keep Next step from .claude/brain` then trust SessionStart brief. `grok memory` is optional for personal facts — not a substitute for committed `docs/decisions/` / domains.

### Shared SVS strategy (all three)

1. **Before** long work: ensure `.claude/brain/tasks/<branch>.md` has a one-line Next step  
2. **When** context > ~70–85%: product `/compact` with a short preserve hint  
3. **After** compact/resume: rely on SessionStart brain brief — do **not** reload 20 memories or huge skills  
4. **Never** use `compat.claude.skills=true` on Grok to “restore context”  
5. Journal at SessionEnd: `.claude/brain/journal/YYYY-MM.md` (hook-written)

## Guardrails

- Never `git add` `.claude/state/`, `~/.claude/projects/`, `~/.kimi-code/sessions/`, `~/.grok/sessions/`
- **Do** commit `.claude/brain/` (in-flight) and `docs/decisions/` (why)
- Fail-open: missing transcript ≠ invent history
- Huge JSONL: sample with `tail` / typed filters

## See Also

- `multi-instance-coordination` — live collision / `/peers` protocol
- `decision-records` — durable why
- Agent `long-session-consistency` — brain architecture
- `.claude/state/README.md` (copied from hooks `_state.README.md`)
