---
version: 1.1.0
---

# Memory: Execute Ship Ops (No Hesitation on Push / Status)

> **ALWAYS LOAD** — Agents freeze when they (1) leave commits unpushed and wait for a second ask, (2) dump full TASK WORKFLOW on “foi publicado?”, or (3) get Stop-blocked by finalize while answering a status check. Ship and status are **ops**, not greenfield features.

---

## Declared purpose

After a production fix is committed, the user expects **push → CI watch → deploy/republish evidence**. Saying “push é ato seu” after you made the fix is forbidden when they asked for production urgency (or already asked to ship).

---

## Triggers

| User signal | Behavior |
|-------------|----------|
| urgente / produção / push / publique / republish / deploy agora / ship | **SHIP NOW** — push, `gh run watch`, run named ops, prove with curl/gh |
| “Veja se foi publicado” / check CDN / local vs origin | **STATUS** — git/gh/curl only; no finalize / UI agents / Playwright |
| “Está esperando o que?” after a local-only commit | Push immediately; do not narrate permission theater |

---

## FORBIDDEN

| Shortcut | Why |
|----------|-----|
| “Não dei push. Isso é seu.” after a prod fix | User hired the agent to close the loop |
| Waiting for a second “pode pushar?” when they said urgente/produção | Wastes incident time |
| Full TASK WORKFLOW + FINALIZE on a status question | Causes Stop blocks and fake todos |
| Stopping at “pushed” without CI/deploy evidence | Memory `post-push-ci-verification` |

---

## Protocol

1. **Status turn:** `git status -sb`, `git log origin..HEAD`, CDN/curl, `gh run` — answer. Do not Edit CLAUDE.md.
2. **Ship turn:** push scoped commits → watch Actions → run republish commands the user named → report live proof.
3. **Finalize debt:** documenter/domain-updater still required on the next **work** turn; Stop soft-passes finalize on **status** turns (UPS `lastPromptKind`).

---

## Duplicate UserPromptSubmit (global + project)

If Claude shows **two** `UserPromptSubmit says:` blocks (one “Stack: php”, one “English only” with Last Change / UI agents / Playwright), the **user-global** `~/.claude/hooks/user-prompt-submit.ts` is conflicting with the project SVS hook. Global UPS must **no-op** when the project has `.claude/hooks/user-prompt-submit.ts` with `@sv-version`.

Fix once:

```bash
cp stacks/_shared/config/user-prompt-submit.global.ts ~/.claude/hooks/user-prompt-submit.ts
```

## Out-of-project edits (scratchpads) — not finalize

Claude Write()s under `/private/tmp/claude-<uid>/…/scratchpad/` and sometimes
`~/.claude/skills|projects/…`. **SVS ≥ 2.81.0** does **not** record those in
`filesTouched`. They must not trigger FINALIZE / plan-gate / Stop CLAUDE.md blocks.

If you still see Stop blocked after only scratchpad work on an old session, prune:

```bash
# session json: drop absolute paths from filesTouched, or run any in-project Edit
# (post-tool-use 1.1.0 prunes on the next write)
```

## Duplicate Stop (global + project)

`~/.claude/settings.json` must **not** register a global `Stop` when projects use
SVS `stop-validator` (global `stop-validator.ts` is often `.disabled` but still
counts as “Ran N stop hooks”). Keep global UPS only; project owns Stop.

---

## Precedence

Takes precedence over generic “don’t push unless asked” heuristics **when the user already asked to ship, or marked production urgency**.

Does not authorize force-push to main.

---

## See also

- UPS **1.10.0** — `STATUS CHECK` / `SHIP NOW` injection
- Stop **1.9.0** — finalize soft-pass on `lastPromptKind=status`
- `post-push-ci-verification.md` — gh run after push
- `verify-before-claim.md` — evidence before ✅ tables
