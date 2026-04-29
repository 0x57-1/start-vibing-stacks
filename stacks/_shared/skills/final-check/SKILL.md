---
name: final-check
version: 2.0.0
description: Final validator with VETO power. Now executable — runs `npx tsx .claude/hooks/final-check.ts` to scan for debug statements, secrets, .skip, any, RCE risks, SQL concat. Blocks completion on CRITICAL/HIGH findings.
---

# Final Check — Executable Validator

**ALWAYS run BEFORE completing ANY task. HAS VETO POWER.**

> v2.0+ promotes this from a manual checklist to an executable script. The script never trusts memory.

## How to Run

```bash
npx tsx .claude/hooks/final-check.ts
```

Exit codes:
- `0` — clean (or only LOW/MEDIUM warnings)
- `1` — at least one CRITICAL or HIGH finding → **task blocked**

## What It Scans

For every file in the diff (staged + unstaged + untracked) matching the active stack's source extensions, every line is checked against:

| Severity | Rule | Why blocking |
|---|---|---|
| CRITICAL | Hardcoded secret pattern (api key / token / password) | Leak risk |
| CRITICAL | Public env var with `*SECRET\|*TOKEN\|*PRIVATE\|*PASSWORD\|*CREDENTIAL` | Bundles into client |
| HIGH | Arbitrary code-execution function (`eval`, Python `exec`) | RCE |
| HIGH | `subprocess` with `shell=True` (Python) | Command injection |
| HIGH | SQL string concatenation / f-string SQL | SQL injection |
| HIGH | `it.only` / `test.only` / `describe.only` / `it.skip` in committed test | False green CI |
| MEDIUM | `console.log/debug/trace` outside tests | Debug leftover, log noise |
| MEDIUM | PHP `var_dump/dd/dump/print_r` | Debug leftover |
| MEDIUM | TypeScript `any` (without `/* ok */` escape) | Erodes strict mode |
| MEDIUM | `@ts-ignore` (use `@ts-expect-error` with comment) | Silently outdated |
| MEDIUM | `@pytest.mark.skip` | Hidden test gaps |
| LOW | `print()` outside tests (Python) | Use logger |
| LOW | TODO / FIXME / XXX / HACK | Track or remove |

Lines containing recognised placeholders (`<your...>`, `YOUR_X`, `placeholder`, `example.com`, `sk_test_`) are skipped to avoid false positives in `.env.example` and docs.

## Workflow

```
1. Implementation done
2. Run npx tsx .claude/hooks/final-check.ts
3. If exit 1 → fix, re-run
4. If exit 0 → proceed to quality-gate → commit
```

## Suppressing False Positives

When a finding is intentional (e.g. an `any` in well-justified glue code):

```ts
const result = (json as any) /* ok: external lib without types */;
```

Only `/* ok */` immediately after `: any` is recognised. For other rules, refactor — there is no general-purpose suppression by design.

## Hook Wiring (Optional)

To run automatically on Stop, add to `.claude/settings.json`:

```json
{
  "hooks": {
    "Stop": [{
      "matcher": "*",
      "hooks": [{ "type": "command", "command": "npx tsx ${CLAUDE_PROJECT_DIR}/.claude/hooks/final-check.ts" }]
    }]
  }
}
```

The default Stop is `stop-validator.ts` (git/branch/CLAUDE.md/secret scan). `final-check.ts` is complementary — runs before it as a code-quality gate.

## Rules

1. **VETO POWER** — exit 1 blocks task completion
2. **NEVER skip** — `--no-verify` style bypasses are forbidden
3. **RE-RUN after fixes** — don't trust memory
4. **One finding at a time** — fix CRITICAL first, then HIGH
5. **Refactor over suppress** — `/* ok */` is for extraordinary cases

## See Also

- `quality-gate` — typecheck/lint/test/build (different scope)
- `security-baseline` — what the secret/RCE rules enforce
- `stop-validator.ts` — git/branch/docs gate (sibling, complementary)
