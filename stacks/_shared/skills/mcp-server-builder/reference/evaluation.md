# Phase 4 — evaluating an MCP server

> `mcp-server-builder` v`1.0.0` · last verified **2026-07-29**

**Sources**
- Upstream methodology — https://github.com/anthropics/skills/blob/main/skills/mcp-builder/reference/evaluation.md
- Runner scripts (`evaluation.py`, `connections.py`, `example_evaluation.xml`) — https://github.com/anthropics/skills/tree/main/skills/mcp-builder/scripts
- MCP Inspector — https://github.com/modelcontextprotocol/inspector

Adapted from Anthropic's `mcp-builder` skill (Apache-2.0). A server nobody evaluated is a
server nobody knows works: it starts, `tools/list` returns, and the agent still
cannot get an answer out of it.

Write **10 questions**. Each one must be:

- **independent** — no ordering or shared state between questions
- **read-only and non-destructive** — evals run against real data
- **complex** — requires *several* tool calls, ideally multi-hop
- **single-answer** — one verifiable value

---

## What makes a good question

Strong questions are **multi-hop** and **historically grounded**. They force the
agent to chain tools rather than keyword-match its way to a hit.

> "Find the archived repository that was previously most-forked and identify its
> primary language."

That needs: list archived repos → sort by forks → fetch the top one → read its
language. Four hops, one string answer, stable forever.

## What makes a bad question

| Anti-pattern | Why it fails |
|---|---|
| Depends on "current state" (open issue count, today's balance) | answer drifts, eval rots |
| Answerable by one exact keyword search | tests the search index, not the server |
| Answer is a list | cannot be verified by string comparison |
| Ambiguous phrasing | two defensible answers, both "wrong" |

## Answer requirements

- **Verifiable by direct string comparison** — not a list, not a nested structure
- **Human-readable** where possible — names, dates, ids over opaque handles
- **Stable over time** — anchored on historical or closed concepts
- **Unambiguous** — exactly one correct value

---

## Format

```xml
<evaluation>
   <qa_pair>
      <question>Your specific question</question>
      <answer>Single verifiable answer</answer>
   </qa_pair>
</evaluation>
```

One `<qa_pair>` per question, ten total. Keep the file next to the server as
`evaluation.xml`.

---

## Running

Anthropic's runner lives in the official skill at `scripts/evaluation.py`
(`github.com/anthropics/skills`, Apache-2.0), alongside `connections.py` and
`example_evaluation.xml`.

stdio (our default):
```bash
python scripts/evaluation.py -t stdio -c uv -a "run python server.py" evaluation.xml
python scripts/evaluation.py -t stdio -c python -a server.py evaluation.xml
```

Remote:
```bash
python scripts/evaluation.py -t sse -u https://example.com/mcp evaluation.xml
```

The runner scores accuracy, counts tool calls per task, and emits a per-task
report with the agent's own feedback. Read that feedback — "I could not tell
which tool to use" is a **tool description** defect, not an agent defect.

> The `-t sse` flag reflects the runner's own CLI, not a recommendation. HTTP+SSE
> is deprecated as a transport; new remote servers use Streamable HTTP.

---

## Reading the results

| Symptom | Usually means |
|---|---|
| Agent called the wrong tool | descriptions overlap or oversell — narrow them |
| Agent looped on the same tool | missing pagination metadata (`has_more`, `next_offset`) |
| Agent gave up | error message had no next step; add a suggested remedy |
| Right data, wrong final answer | response format too verbose — trim to what matters, or default to markdown |
| Passed but took 12 calls | endpoint chain should be collapsed into one tool |

Re-run the evals after any tool rename, description change, or SDK migration.
They are the regression suite.
