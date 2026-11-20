---
version: 1.0.0
---

# Memory: Model split

> **ALWAYS LOAD.** The session opens on Opus 5.5 with the Fable 5.2 advisor and ultracode on. A lookup, a doc read, a grep, or a test run does not get its own Opus agent.

## Who does the work

| Work | Model | Effort |
|---|---|---|
| Edit repo code, fix a finding, adversarial review, architecture | `claude-opus-5-5` | `high` |
| Read docs, search the web, grep, walk a page, run the suite and summarize, write docs from finished code, documenter, domain-updater | `claude-sonnet-5-5` | `low` |

If it edits code, use Opus. If it only reads, runs, and reports, use Sonnet.

## Ultracode

- A lookup is one Sonnet agent, or no agent: the parent turn reads it.
- Do not spawn a swarm of Opus agents to survey a repo, read documentation, or search.
- Do not start a workflow for a grep, a doc read, or a single-page check.
- Synthesis of what the Sonnet agents found stays on the Opus parent.
- A workflow already running keeps its models until the next phase boundary.
