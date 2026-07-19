---
version: 1.0.0
---

# Memory: Post-Push CI Verification (GitHub Actions)

> **ALWAYS LOAD** — After any `git push` to a GitHub remote, verify **GitHub Actions** for that commit before claiming the change is validated or deployed. Most projects in this ecosystem use Actions.

---

## Declared purpose

Agents routinely stop at “pushed to origin” while CI (or deploy/release) is still red. This memory makes post-push verification part of the default contract.

---

## What to check after push

1. **Runs for the pushed SHA** — `gh run list --commit $(git rev-parse HEAD)`
2. **Wait for completion** — `gh run watch <id> --exit-status` for in-progress runs
3. **Conclusions** — all required workflows `success` (or document failure)
4. **Deploy/release** — if a job/workflow is named deploy / release / publish / auto-release, report its result separately
5. **On failure** — surface the run URL + `gh run view <id> --log-failed`; do **not** say “deployed successfully”

Load skill `git-workflow` (§ Post-push CI) and agent `commit-manager` Step 5.5 for the full recipe.

---

## Explicit rules

| Situation | Required behavior |
|---|---|
| GitHub remote + `.github/workflows/` present | Verify Actions after push |
| CI failed | Report `CI: FAILED` + URL; fix or escalate — never invent green |
| CI pending / timeout | Report `CI: pending` + URL |
| Not GitHub / no `gh` / no workflows | Report `CI: skipped (<reason>)` once |

---

## Out of scope

- Replacing local `quality-gate` (still required **before** commit)
- Force-pushing to “fix” CI
- Claiming npm/production deploy success without a green deploy/release job (or user confirmation)

---

## See Also

- Agent: `commit-manager` v3.2.0+ (Step 5.5)
- Skills: `git-workflow`, `ci-pipelines`
