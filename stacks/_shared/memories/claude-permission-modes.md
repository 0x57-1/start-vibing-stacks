---
version: 1.0.0
---

# Memory: Claude / Cursor Permission Modes

> **ALWAYS LOAD** — Clarifies **IDE/agent permission modes** (`plan`, `acceptEdits`, `bypassPermissions`) vs Anthropic **cyber classifiers**. These are unrelated systems.

---

## Declared purpose

When the user asks to “montar bypassPermissions” / reduce permission prompts, treat it as **local settings configuration**, not security filter evasion or cyber unlock.

---

## Facts

1. Project default from start-vibing-stacks: `permissions.defaultMode: "plan"` in `.claude/settings.json` (sessions start read-only).
2. Local override (gitignored): copy `.claude/settings.local.example.json` → `.claude/settings.local.json` and set `acceptEdits` or `bypassPermissions` as needed.
3. Cursor “Opened changes / Save file to continue” is **buffer sync**, not Bypass failure — see `cursor-ide-edit-sync.md` + skill `tool-resilience`.
4. Extension tip: both `claudeCode.allowDangerouslySkipPermissions` and `claudeCode.initialPermissionMode: "bypassPermissions"` may be required for Bypass to stick across chats.

---

## Explicit non-goals

| Not what this memory does |
|---|
| Does **not** bypass Anthropic cyber classifiers / Opus 5 model-switch |
| Does **not** unlock pentest / exploit / third-party scanning |
| Does **not** mean “bypassFilters” for ad platforms (use ads memories) |

---

## See Also

- Memory: `cursor-ide-edit-sync.md`
- Config: `.claude/settings.local.example.json`
- Skill: `tool-resilience` (§ IDE-buffer-conflict)
