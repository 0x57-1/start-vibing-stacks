---
name: project-ui-standard
version: 1.1.0
description: >-
  Create and protect the project design-system skill for Claude, Grok, and
  Kimi. Use when the repo has frontend/layout, a first UI task, Preline vs
  another kit, or design-system is missing. Read existing style guides first.
  Never delete design-system. Preline markup comes from ~/.claude/skills/preline-moon
  only when the project uses Preline.
---

# Project UI standard (multi-agent)

The **central** skill is always:

```
.claude/skills/design-system/SKILL.md
```

Kimi loads it via `extra_skill_dirs` → `.claude/skills`. Grok gets a **copy**
at `.grok/skills/design-system/` (never a symlink). `migrate` must not
overwrite or delete either file.

## Order (do not skip)

1. **Frontend / layout?** If the repo has no UI (`frontend: none`, no
   React/Vue/Inertia/Tailwind/Expo, no `resources/js` / `src/components` /
   `app/_layout.tsx`), stop.
1b. **Native (`frontend: native` / Expo)?** Seed `design-system` with
    `View` / `Text` / StyleSheet. Load `react-native-theme`. Do **not**
    load Preline or memory `react-theme-parity`.
2. **Read what already exists** before writing a skill:
   - `.claude/skills/design-system/` and `.grok/skills/design-system/`
   - `docs/design/**`, `docs/style-guide.md`, `DESIGN.md`
   - recipe files (`uiStyles.js`, theme CSS)
   - `.claude/config/project-ui.json`
3. **If `design-system` is missing** — create it from those sources. Lift
   decisions already made. Do not invent a new look. Seed via
   `npx start-vibing-stacks migrate --apply` or write the skill yourself.
4. **Mirror** the same `SKILL.md` to `.grok/skills/design-system/` if that
   copy is missing. Do not replace a Grok copy that already exists.
5. **Preline?**
   - New project: the operator chooses (setup prompt).
   - Existing project: `package.json` `preline`, `data-theme="theme-moon"`,
     or `project-ui.json#prelineMoon`.
   - If **yes** and `$HOME/.claude/skills/preline-moon` has `INDEX.md` +
     `examples/` (or `data/index.json`): Read that global tree. Keep only a
     thin pointer in the repo. Never copy the ~100 MB dump. Never symlink.
   - If **no**: do not install `preline-moon` / `preline-ui`. This skill +
     `design-system` are the SoT.
6. **On every later UI change** — append the decision to `design-system` in
   the same commit. A standard that lives only in the diff is not a standard.

## Do not

| Action | Why |
|---|---|
| Delete or regenerate `design-system` on migrate / `--force` | Operator + project history |
| Register the name only in `.svs-managed.json` | Old prune deleted it |
| Symlink `~/.claude/skills/preline-moon` into the repo | migrate writes through the link |
| Prefer a project 4.2.0 dump over the global 5.x capture | Stale SoT |
| Mix Preline paste with a second kit mid-page | One system per project |

## See Also

- `design-system` — the project file this protocol creates
- `preline-moon` — pointer; global corpus when Preline is on
- `react-theme-apply` + memory `react-theme-parity` + `project-design-system` (web)
- `react-native-theme` + memory `react-native-theme.md` (Expo)
