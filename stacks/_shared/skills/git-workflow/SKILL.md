---
name: git-workflow
version: 2.1.0
description: "Git workflow conventions used by commit-manager v3.2.0+: Conventional Commits (no AI-attribution footers), branch naming, direct-to-main vs feature-branch flow, end-on-main rule, push policy, post-push GitHub Actions verification (gh run list/watch), never force-push main, signed commits encouraged. Invoke when starting a feature, creating commits, pushing, or wiring git-related hooks."
---

# Git Workflow

**ALWAYS invoke when starting work, creating commits, pushing, or wiring `pre-commit` / `Stop` hooks that touch git.**

> The git history is documentation. A reader six months from now should understand *why*, not just *what*. The commit-manager agent enforces the message format below; this skill defines what counts as compliant.

## 1. Branch naming

```
feature/<short-kebab-description>
fix/<bug-id-or-description>
refactor/<area-changed>
chore/<maintenance-task>
docs/<scope>
ci/<workflow-area>
```

Rules:
- Always kebab-case, never spaces or underscores.
- ≤ 50 chars; longer goes in the PR description.
- One feature per branch.

## 2. Conventional Commits — required format

```
<type>(<scope>): <subject>

<body — wrapped at ~72 cols; bullets when ≥ 3 files affected>
```

| Type | When |
|---|---|
| `feat` | New user-visible capability |
| `fix` | Bug fix |
| `refactor` | Internal change, no behavior change |
| `perf` | Performance improvement |
| `test` | Tests added/changed only |
| `docs` | Documentation only |
| `chore` | Build, deps, tooling — nothing user-visible |
| `ci` | CI/CD config |
| `style` | Formatting only |
| `revert` | Reverts a prior commit |
| `build` | Build system / bundler config |

Subject:
- ≤ 50 chars
- imperative ("add login retry", not "added", not "adds")
- no trailing period
- lowercase first word (after the type/scope prefix)

Body (only when ≥ 3 files or non-obvious *why*):
- explain motivation, trade-offs, links to issues
- bullet list when summarizing multiple changes

### Example

```
feat(auth): add session refresh with rotating cookies

- Issue rotated session id on each login + every 7 days
- Persist previous id for 30s grace window to avoid races
- Drop legacy cookie name `sid` from response set; honor on read
```

### **No AI-attribution footers** *(commit-manager v2.0.0+ rule)*

Do **not** append:
```
Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

The commit message describes the change. Tooling provenance lives in CI artifacts, signed commits, or release metadata — not in every commit body.

## 3. Two valid flows

The repo's CLAUDE.md (or `git-workflow` overlay) declares which is in effect.

### Flow A — direct-to-main (small repos, single contributor, fast iteration)

```
1. Pull main, ensure clean tree
2. Make changes
3. Quality gate green
4. Commit → push to main
```

### Flow B — feature branch + merge (multi-contributor, CI gates required)

```
1. From clean main, create branch:    git checkout -b feature/<name>
2. Work, commit incrementally
3. Quality gate green
4. Push branch:                       git push -u origin HEAD
5. Open PR; CI must pass
6. Merge (squash or rebase — never merge commit on main)
7. Delete branch local + remote
8. Checkout main, pull
```

End state in **both flows**: clean tree, on `main`, in sync with `origin/main`. The Stop validator enforces this.

## 4. Push policy

| Operation | Allowed | Notes |
|---|---|---|
| `git push` to feature branch | ✅ Always | Force-push only if branch is yours and not yet reviewed |
| `git push` to main | ✅ When tree clean and CI green locally | Branch protection should reject otherwise |
| `git push --force-with-lease` to feature branch | ✅ Preferred over `--force` | Refuses if remote moved since your last fetch |
| `git push --force` to main | ❌ Never | Re-writes shared history |
| `git push --no-verify` | ❌ Never | Bypasses hooks intentionally configured to gate |

## 5. Pre-flight checklist (commit-manager runs this internally)

- [ ] Working tree status reviewed (`git status -sb`)
- [ ] Diff reviewed (`git diff --stat HEAD` then `git diff` if needed)
- [ ] Quality gate passed (typecheck / lint / tests / build)
- [ ] Security gate passed (`security-auditor` clean)
- [ ] No secrets in diff (gitleaks)
- [ ] CLAUDE.md `## Recent Changes` updated (PREPEND a new `### YYYY-MM-DD · branch · vX.Y.Z` block — append-only LIFO, cap 10; `domain-updater` v3.0.0+ does this automatically post-commit)
- [ ] Conventional commit message drafted
- [ ] Push target confirmed (`origin main` vs `origin feature/*`)

## 5.5. Post-push CI verification (GitHub Actions)

**After every successful `git push` to a GitHub remote**, verify Actions for that commit. Local gates ≠ remote CI. Majority of projects here use GitHub Actions. See memory `post-push-ci-verification.md` and `commit-manager` Step 5.5.

```bash
SHA=$(git rev-parse HEAD)

# List runs for this commit
gh run list --commit "$SHA" --limit 10

# Watch incomplete runs until they finish (fail the shell if a run fails)
for id in $(gh run list --commit "$SHA" --json databaseId,status \
  --jq '.[] | select(.status != "completed") | .databaseId'); do
  gh run watch "$id" --exit-status
done

# Summarize conclusions
gh run list --commit "$SHA" --json name,conclusion,url \
  --jq '.[] | "\(.conclusion)\t\(.name)\t\(.url)"'
```

On failure:

```bash
gh run view <run-id> --log-failed   # or open the URL from gh run list
```

| Skip when | Report as |
|---|---|
| `origin` is not GitHub | `CI: skipped (non-GitHub remote)` |
| `gh` missing / not authenticated | `CI: skipped (gh unavailable)` |
| No `.github/workflows/` | `CI: skipped (no workflows)` |

Never claim **deploy / release / npm publish** success unless the matching workflow job concluded `success` (or the user confirmed outside CI).

## 6. Tags & releases

```bash
# Annotated tags only — lightweight tags are stripped by some hosts
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3
```

Semver: bump `MAJOR.MINOR.PATCH` per breaking/feature/fix.

## 7. Recovering from mistakes

| Situation | Fix |
|---|---|
| Bad commit not pushed | `git reset --soft HEAD~1`, fix, re-commit |
| Bad commit pushed to feature branch | `git commit --amend` then `git push --force-with-lease` |
| Bad commit pushed to main | `git revert <sha>` and push the revert (NEVER force-push main) |
| Pushed a secret | Revoke at provider FIRST, then `git filter-repo` + force-push (one-time, document it) |
| Wrong branch | `git stash`, `git checkout <correct>`, `git stash pop` |

## Rules

- **NEVER** force-push `main` / `master`
- **NEVER** `--no-verify` to bypass hooks
- **ALWAYS** Conventional Commits, no AI-attribution footers
- **ALWAYS** end on `main` with a clean tree (Stop validator enforces)
- **ALWAYS** verify GitHub Actions after push (or document an explicit skip)
- **ONE** feature per branch (or per direct-to-main commit batch)

## See Also

- `commit-manager` agent — drives the message + push + **CI verify** pipeline
- Memory `post-push-ci-verification.md` — always-on post-push checklist
- `quality-gate` — the local gate the commit-manager waits for before commit
- `secrets-management` — gitleaks 3-layer (pre-commit, CI, push protection)
- `ci-pipelines` — workflow authorship + failing-job triage
