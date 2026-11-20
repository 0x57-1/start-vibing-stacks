---
version: 1.0.0
---

# Memory: Local Supermemory

> **ALWAYS LOAD** on Claude, Grok, and Kimi. Optional. The files in this repo stay the default.

One Podman server on the machine can remember facts that change across this user's projects. It is not a replacement for `CLAUDE.md`, the always-on memories, the domain files, or `MEMORY.md`.

## Which store

Check once per session. Do not install anything in this check.

```bash
curl --fail --max-time 2 http://127.0.0.1:6767/v3/health
```

| Result | Do |
|---|---|
| Health fails, and the user did not ask to install | Current model. Repo files and `MEMORY.md`. One sentence that a local server is available if they want it. |
| Health fails, and the user asked to install or to share memory across projects | Skill `supermemory-local`. Guide Mac or Windows. Wait for a yes and for their provider key. |
| Health ok, and `SUPERMEMORY_API_KEY` is in the environment | Use the local server for a fact that changed and must survive another project or another machine. |

The cloud MCP `mcp.supermemory.ai` is a different account. Do not treat it as this pod.

## What goes in the local server

Namespace is the git repo name, one namespace per project, one server for all of them.

- A preference, a correction, or a decision that changed. Forget the old fact. The docs are the source for the forget call. Do not invent the path.
- "What did we decide?" when it is not in a domain file or in `CLAUDE.md`.

Leave in the repo: code facts, authorization rules, secrets, tokens, and `.env`. The local server is not the system of record.

Grok and Kimi call it from the parent turn. Do not spawn an agent to reach it.

## See

Skill `supermemory-local`. Podman machine: skill `podman-patterns`.
