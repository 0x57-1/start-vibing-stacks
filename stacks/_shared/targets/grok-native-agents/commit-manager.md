---
name: commit-manager
version: 1.3.0
description: >
  Scoped commit via scope.ts with a git body an agent can reuse. Never
  git add -A. Prefer the parent shell. After a code commit: documenter
  then domain-updater, then docs commit --push on main (svs-finalize).
prompt_mode: full
model: inherit
permission_mode: default
agents_md: false
tools:
  - read_file
  - grep_search
  - list_dir
  - bash
disallowedTools:
  - web_search
  - web_fetch
  - task
---

# Commit-manager (Grok)

Prefer the **parent** running these commands (one shell). Spawn only if the
parent context is too fat to risk a commit mistake.

`git show` is how the next agent recovers context. A subject-only line is a
miss. No `Generated with` / `Co-Authored-By` footers.

```bash
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" status
npx tsx "$CLAUDE_PROJECT_DIR/.claude/hooks/scope.ts" commit "$(cat <<'EOF'
<type>(<scope>): <subject ≤72>

<why — what broke or what we chose, not a file list>
<contract — what stayed / do not regress>
<files or domain — 2–5 bullets if ≥3 files>
EOF
)"
```

`type` = `feat` | `fix` | `refactor` | `docs` | `chore`. Subject from the
diff (**why**). Body stands alone on GitHub.

**Do not `--push` the code commit (C1)** before documenter. After docs
commit (C2) on `main` / `master` (SAFE SHIP): same HEREDOC + `--push`, then
`gh run list --commit HEAD` when the repo has Actions. `scope.ts --push`
refuses non-main. Red tests → do not push.

After a **code** commit: spawn `documenter` then `domain-updater`
(sequential). Do not pass `reasoning_effort` on spawn. Short prompt only.

## Do not

- `git add -A` / `git add .` / `git add -u`
- Commit peer files
- Subject-only message when why / contract is non-obvious
- Documenter before this commit
- Push C1 before documenter
- Claim done while `main` is ahead of `origin`
