---
version: 1.0.0
---

# Memory: Cursor / IDE Edit Sync

> **ALWAYS LOAD** — When Claude Code shows **Opened changes in Cursor**, **Save file to continue…**, or **Do you want to make this edit?** even with Bypass Permissions on, treat it as an **IDE buffer sync** issue — not a missing Bypass setting and not a reason to refuse the task.

---

## Declared purpose

Bypass Permissions skips tool-permission prompts. It does **not** always skip Cursor’s dirty-buffer / open-diff bridge. Agents must recover without looping or abandoning the edit.

---

## Classify

| Signal | Class |
|---|---|
| `Opened changes in Cursor` / `Save file to continue` | **IDE-buffer-conflict** |
| `Do you want to make this edit?` + Yes / allow all / No | **IDE edit acceptance** (session-level) |
| `StrReplace` string not found after IDE prompt | **Stale/Conflict** (see skill `tool-resilience`) |
| Normal permission prompt for Bash with Bypass off | Permission mode — not this memory |

---

## Recovery (agent)

1. **Do not refuse** the user’s requested edit because of this UI.
2. **Re-Read** the file from disk after the user saves or accepts.
3. Ask once (if blocked): save the tab, choose **Yes, allow all edits during this session** (shift+tab), or close the dirty buffer.
4. Retry the edit **once** with a fresh Read. Prefer small patches over full-file rewrite.
5. If still blocked: point the user to `.claude/settings.local.example.json` → copy to `settings.local.json` (`acceptEdits` or `bypassPermissions`) and Cursor `files.autoSave`.

Load skill `tool-resilience` § IDE-buffer-conflict for the full protocol.

---

## What Bypass does / does not

| Covered by Bypass | Not covered by Bypass alone |
|---|---|
| Most Edit/Write/Bash permission prompts | Cursor unsaved buffer / open-diff gate |
| Tool allowlists in settings | Explicit `ask` rules and some hooks (e.g. plan-gate) |
| | Catastrophic `rm -rf /` circuit breakers |

---

## See Also

- Skill: `tool-resilience`
- Config example: `.claude/settings.local.example.json`
- Memory: `multi-instance-coordination` (peer file locks are a different block)
