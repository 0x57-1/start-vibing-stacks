---
name: supermemory-local
version: 1.1.0
description: >-
  Install Supermemory Local in Podman on a Mac or Windows, then use that
  one server as optional memory across the user's projects. Use when the
  user asks to install it, to share memory across repos, or when
  http://127.0.0.1:6767/v3/health is already up. If they did not ask and
  the health check fails, do not install. Claude, Grok, and Kimi.
---

# Supermemory Local

One server in the user home, shared by every project. Each repo is its own namespace. The repo files stay the default when this server is down.

Documented compose release: `server-v0.0.9`. If that download 404s, read https://supermemory.ai/docs/self-hosting/docker and use the compose file that page names. Do not invent a newer tag.

## Do not install until they ask

A failed health check is not a request. Tell them the current files still work, and that this skill can put a server on `127.0.0.1:6767` when they want cross-project memory.

When they ask, say what will happen: a Podman machine if needed, a compose file and a private `.env` in `~/supermemory`, one LLM provider key they type, and a local API key that stays out of the repo and out of chat.

## Podman

Mac or Windows, the containers run in a Linux machine. Skill `podman-patterns` owns the machine. Do not install Podman unless they asked for this server.

Mac, when `podman` is missing and Homebrew is the package manager:

```bash
brew install podman
podman machine init --now
```

Windows: install Podman from https://podman.io/docs/installation, then the same machine commands.

```bash
podman machine start
podman info
```

`podman compose` is the wrapper. On a Mac, a missing provider is `brew install docker-compose` (Compose v2, not Docker Desktop). On Windows, install Compose v2 the way that Podman page documents. Do not install Docker Desktop for this.

## Server

Empty directory in the home folder, not inside a git repo. Skip the download when `compose.yaml` is already there.

```bash
mkdir -p "$HOME/supermemory"
cd "$HOME/supermemory"
curl -fL "https://github.com/supermemoryai/supermemory/releases/download/server-v0.0.9/compose.yaml" -o compose.yaml
```

`.env` beside it. One provider key, theirs, typed into the file. `OPENAI_API_KEY`, or `ANTHROPIC_API_KEY`, or `GEMINI_API_KEY`, or `GROQ_API_KEY`. Plus:

```dotenv
SUPERMEMORY_VERSION=0.0.9
```

`chmod 600 .env`. Do not commit it. Do not print the provider key. Do not copy it into the project.

```bash
unset SUPERMEMORY_VERSION
podman compose pull
podman compose up -d --wait --wait-timeout 180
curl --fail http://127.0.0.1:6767/v3/health
```

The image binds `6767` to `127.0.0.1`. The first start downloads a local embedding model and needs network.

The local API key is a second secret, created inside the volume:

```bash
podman compose exec -T supermemory cat /data/api-key
```

The user puts that value in their own environment as `SUPERMEMORY_API_KEY`. Do not write it into a project file. Do not paste it into the chat. Repeat the command only so they can copy it locally.

`podman compose down -v` deletes the store. Do not run it. `podman machine stop` stops every container on the machine. Use it only when they ask to shut the machine down.

## Use it

Base URL `http://127.0.0.1:6767`. Header `Authorization: Bearer` from `SUPERMEMORY_API_KEY`. Namespace is the repo directory name.

Confirmed paths, SDK 5 or the HTTP API. Re-read https://supermemory.ai/docs/llms.txt before adding a path that is not here.

| Call | Path |
|---|---|
| Write | `POST /ns/{namespace}/document` |
| Search | `POST /ns/{namespace}/search` |
| Profile | `POST /ns/{namespace}/profile` |

Search that mixes derived facts and source chunks uses `searchMode: "hybrid"`. A document that must not become a personal fact uses `taskType: "superrag"`.

A changed fact: forget the old one by the memories API in those docs, then write the new one. Do not leave both as current.

Code, rules, and secrets stay in the repo. This server is for a fact that changed and must be visible from another project on this machine. The one exception is the seed below: one project summary when that namespace is empty.

## Seed an existing project

Once per namespace. On the first turn of a session, when health is ok and `SUPERMEMORY_API_KEY` is set, the parent writes it and then continues the user's task. Do not ask. Do not spawn. Do not install anything in this step. Claude, Grok, and Kimi each do this themselves.

```bash
NS=$(basename "$(git rev-parse --show-toplevel)")
curl --fail --max-time 5 \
  -H "Authorization: Bearer ${SUPERMEMORY_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"query":"svs-project-seed","searchMode":"hybrid"}' \
  "http://127.0.0.1:6767/ns/${NS}/search"
```

A hit whose text contains `svs-project-seed` means this repo is already stored. Stop. Do not write again.

No hit: summarize what the repo already wrote about itself.

- `CLAUDE.md`: overview, stack, architecture, critical rules, NRY, recent changes.
- Domain files under `.claude/skills/codebase-knowledge/domains/`: Attention Points and Last Update only.
- `MEMORY.md`: the index lines, not every topic file.

Do not walk the source tree. Leave out `.env`, tokens, API keys, and the authorization memories. Those stay in the repo and still load every turn.

One document. `taskType` is `superrag`, so this is project knowledge and not a personal fact. The first line of `content` is `svs-project-seed` plus the namespace, then the summary in plain sentences.

```bash
curl --fail --max-time 20 \
  -H "Authorization: Bearer ${SUPERMEMORY_API_KEY}" \
  -H "Content-Type: application/json" \
  --data-binary @seed.json \
  "http://127.0.0.1:6767/ns/${NS}/document"
```

`seed.json` is `{"content":"...","taskType":"superrag"}`. Write it outside the repo, delete it after the call, and do not commit it. Do not print `SUPERMEMORY_API_KEY`.

A 4xx on that write: re-read https://supermemory.ai/docs/llms.txt once, match the documented document fields, and retry once. Then continue the user's task either way.

A later change still follows forget-then-write. Do not post this seed again.

## See also

- `podman-patterns` — the machine on a Mac
- `supermemory-local` memory — the on/off check
- `session-speed` — what stays in the prompt
