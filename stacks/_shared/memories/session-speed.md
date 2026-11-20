---
version: 1.1.0
---

# Memory: Session speed

> **ALWAYS LOAD.** Anthropic loads `CLAUDE.md` and the first 200 lines (or 25 KB) of auto-memory `MEMORY.md` on every turn. A long always-on file makes every later turn slower and easier to ignore.

## What stays short

- Project `CLAUDE.md`: under 200 lines. Commands, layout, and rules that apply every session. A procedure goes in a skill. A rule for one directory goes in `.claude/rules/` with `paths:`, so it loads when that path is touched.
- An `@import` still loads at session start. It does not make the file cheaper.
- An HTML comment in `CLAUDE.md` is stripped before the prompt. Notes for people go there.
- `MEMORY.md` stays an index. Detail goes in a topic file. Past the first 200 lines, or 25 KB, the rest does not load.

## What stays out of this turn

- A large file or a noisy command goes to one Sonnet 5.5 agent (`model-split`). This session keeps the summary.
- Do not re-read a file already in the turn.
- Do not switch model or effort mid-session. The prompt cache drops.
- Unrelated next task: the user runs `/clear`. The same task, earlier turns finished: `/compact` with a focus. Do not run either unless asked.
- A local Supermemory on `127.0.0.1:6767` is optional (`supermemory-local`). Health down means these files stay the memory.
