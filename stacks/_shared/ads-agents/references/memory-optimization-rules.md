# Memory Optimization Pipeline Rules

> **Status:** Auto-loaded memory via `memory-optimization.md`.

---

## When to Suggest MOP

The agent should suggest running the Memory Optimization Pipeline when any of the following objective signals are detected:

- 3 or more redundant chunks across different memory files
- 5 or more generic chunks (low specificity)
- `CLAUDE.md` exceeding 35,000 characters
- A static memory not updated for more than 30 days
- Repeated "forgetting" of decisions or patterns during a session

## How to Suggest

Always suggest, never execute automatically:

> "I detected X redundant/generic chunks in the memories. I recommend running:
> `npx start-vibing-stacks memory optimize --dry-run`"

## Safety Rules

- Never propose modifying original `.md` files directly.
- Always recommend reviewing the generated report first.
- GEPA mode should only be suggested for very large or long-lived projects.
- The MOP is a maintenance tool, not an autonomous agent.