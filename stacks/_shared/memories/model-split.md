---
version: 1.2.0
---

# Memory: Model split

> **ALWAYS LOAD.** The session opens on Opus 5.5 with ultracode on. The advisor stays off. Do not call it.

## Who does the work

| Work | Model | Effort |
|---|---|---|
| Edit repository code | `claude-opus-5-5` | `high` |
| Read, search, grep, draft from sources, check a finding by reading, run the suite and summarize, documenter, domain-updater | `claude-sonnet-5-5` | `low` |

If the agent edits code, use Opus. If it only reads, runs, and reports, use Sonnet.

## Ultracode

`agent()` with no `model` inherits this session, which is Opus 5.5. The workflow reference says to omit `model`. Do not omit it.

Every `agent()` that does not edit repository code passes `model: 'claude-sonnet-5-5'` and `effort: 'low'`. A research fan-out, a doc read, a grep, a page walk, a test run, and a read-only review are Sonnet. A phase that only reads also sets `model: 'claude-sonnet-5-5'` on that phase.

Pass `model: 'claude-opus-5-5'` and `effort: 'high'` only on the agent that edits code.

Do not spawn a swarm of Opus agents. The parent keeps the synthesis. Do not change the parent model or effort in the middle of the session.
