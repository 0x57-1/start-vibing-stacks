---
version: 1.5.0
---

# Memory: Execute Ship Ops (No Hesitation on Push / Status)

> **ALWAYS LOAD** — Agents freeze when they (1) leave commits unpushed and wait for a second ask, (2) dump full TASK WORKFLOW on “foi publicado?”, or (3) get Stop-blocked by finalize while answering a status check. Ship and status are **ops**, not greenfield features.

---

## Declared purpose

After a production fix is committed, the user expects **push → CI watch → deploy/republish evidence**. Saying “push é ato seu” after you made the fix is forbidden when they asked for production urgency (or already asked to ship).

**Ship decision (v1.3):** classify the pending change as **SAFE SHIP** or **ATTENTION GATE** before commit/push. Safe → execute the full loop without re-asking. Attention → stop and ask the user **with a clear argument for not committing yet**.

---

## Triggers

| User signal | Behavior |
|-------------|----------|
| urgente / produção / push / publique / republish / deploy agora / ship | **SHIP NOW** — but still run SAFE vs ATTENTION first |
| “Veja se foi publicado” / check CDN / local vs origin | **STATUS** — git/gh/curl only; no finalize / UI agents / Playwright |
| “Está esperando o que?” after a local-only commit | Re-classify; if SAFE → push immediately |

---

## SAFE SHIP vs ATTENTION GATE (mandatory before commit/push)

### SAFE SHIP → commit (scoped) → push → watch deploy → run named ops → prove live

All of the following hold:

| Check | Pass means |
|-------|------------|
| Scope | Only this session’s files (`scope.ts`); no peer conflict on same paths |
| Branch | HEAD is `main` or `master` (memory `multi-instance-main-only`) — shared cwd peers share one HEAD |
| Intent | Matches what the user already asked (fix/feature already authorized) |
| Risk | No secrets/`.env`/credentials in the diff; no destructive migration / data wipe |
| Quality | Stack tests green when source under test changed (`quality-gate-before-push`) |
| Deploy targets | Every artifact the user named (or the change touches) has a known republish command — including separate ones (e.g. launchers **and** `pw.js`) |
| Git | Normal push; no force-push / history rewrite |

When SAFE: **do not** re-ask “posso pushar?”. Multi-instance memories (`feedback_multiinstance_*`, GitHub Desktop autostash) mean **use scoped commit/push**, not **freeze**.

### start-vibing-stacks package repo (standing order — 2026-08-19)

When `package.json#name` is `start-vibing-stacks` (developing this npm package):

After a versioned change (`package.json` bump + Recent Changes), **commit on main → push → watch auto-release → confirm npm**. Do **not** ask “quer commitar?” / “quer publicar?” / “posso pushar?”.

ATTENTION GATE still wins (secrets, off-main, `npm run build` red). Not a consumer-project rule.

User authorization for a **workflow** (`commit → push → acompanhar prod → republish X`) lasts until that loop closes — it is **not** one-commit permission.

### ATTENTION GATE → do **not** commit/push yet; ask the user

If **any** of these apply, stop and present a short decision:

| Trigger | Why not commit yet |
|---------|-------------------|
| Secrets / tokens / `.env` in diff | Leak risk |
| Off `main`/`master` (or peer just ran `checkout -b` in shared cwd) | Deploy would hit the wrong branch — `multi-instance-main-only` |
| Destructive DB / irreversible data change | Needs explicit OK |
| Peer active on same files (multi-instance) | Stomp / wrong author |
| Tests red or required suite not run | `quality-gate-before-push` veto |
| Blast radius unclear (huge unrelated diff) | User may not want this ship |
| Deploy inventory incomplete | e.g. “all launchers” but change also touches `pw.js` / another job — list missing ops |
| Would need force-push / amend of others’ commits | Dangerous |

**Ask format (keep tight):**

```
ATTENTION GATE — not committing yet:
- Risk: <one line>
- Evidence: <path / test output / peer session>
- Options: (A) proceed anyway (B) split/fix first (C) abort
```

Do **not** use ATTENTION as cover for generic hesitation (“push é seu”, “melhor você revisar no GitHub Desktop”). Only real risk above.

---

## FORBIDDEN

| Shortcut | Why |
|----------|-----|
| “Não dei push. Isso é seu.” after a prod fix | User hired the agent to close the loop |
| Waiting for a second “pode pushar?” when SAFE + ship/urgency | Wastes incident time |
| Treating workflow auth as one-commit auth | Reopens the same ask 3× |
| Claiming “republiquei todos” while skipping a separate artifact (`pw.js`, etc.) | Incomplete ops |
| Full TASK WORKFLOW + FINALIZE on a status question | Causes Stop blocks and fake todos |
| Stopping at “pushed” without CI/deploy evidence | Memory `post-push-ci-verification` |
| Fake ATTENTION (“multi-instance exists somewhere”) with no file conflict | Cowardice, not caution |

---

## Protocol

1. **Status turn:** `git status -sb`, `git log origin..HEAD`, CDN/curl, `gh run` — answer. Do not Edit CLAUDE.md.
2. **Ship turn:** classify SAFE vs ATTENTION → if SAFE: push scoped commits → watch Actions → run **every** republish command for touched/named artifacts → report live proof (`cdn-asset-deploy-verify`).
3. **Finalize debt:** documenter/domain-updater still required on the next **work** turn; Stop soft-passes finalize on **status** turns and after finalize **anti-thrash** (2 hard blocks).
4. **COMMIT-FIRST:** if UPS shows `STOP-RECOVERY — COMMIT-FIRST`, run `scope.ts commit` before any other answer. Dirty-tree Stop loops are the #1 session waste.

---

## Stop recovery (UPS 1.11+)

| `lastStopKind` | Do this first |
|----------------|---------------|
| `dirty` | `scope.ts commit` then re-Stop |
| `finalize` | documenter → domain-updater |
| `size` | claude-md-compactor (soft 36k / hard 40k) |

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

Takes precedence over generic “don’t push unless asked” heuristics **when the user already asked to ship, or marked production urgency**, and the change is **SAFE SHIP**.

ATTENTION GATE takes precedence over SHIP NOW: ask first; do not push.

Does not authorize force-push to main.

---

## See also

- UPS **1.12.0** — `STATUS CHECK` / `SHIP NOW` + SAFE vs ATTENTION nudge
- Stop **1.10.0** — finalize soft-pass on `lastPromptKind=status`
- `post-push-ci-verification.md` — gh run after push
- `quality-gate-before-push.md` — tests red → ATTENTION / veto
- `cdn-asset-deploy-verify.md` — evidence before ✅ published
- `verify-before-claim.md` — evidence before ✅ tables
