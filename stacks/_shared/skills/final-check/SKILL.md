# Final Check — Task Completion Validator

**ALWAYS invoke BEFORE completing ANY task. HAS VETO POWER.**

> ⚠️ **VETO POWER:** If any rule is violated → STOP, list violations, require fix, re-validate.

## Purpose

Last check before task completion. Ensures nothing was forgotten.

## Checklist

### 1. Code Quality
- [ ] Quality gates passed (PHPStan/TypeCheck, Tests, Lint)
- [ ] No `console.log` / `var_dump` left in code
- [ ] No TODO/FIXME left unresolved
- [ ] No hardcoded secrets or credentials

### 2. Documentation
- [ ] CLAUDE.md "Last Change" updated
- [ ] Affected domain files updated
- [ ] New patterns documented

### 3. Testing
- [ ] New code has tests
- [ ] Existing tests still pass
- [ ] Edge cases covered

### 4. Git
- [ ] On correct branch
- [ ] All files committed
- [ ] Conventional commit message
- [ ] Merged to main (if complete)

### 5. Skills Consulted
- [ ] Codebase knowledge checked before implementing
- [ ] Research cache checked before web search
- [ ] Security patterns applied

## Violation Response

```
BLOCKED: [Violation description]

Required fixes:
1. [Fix needed]
2. [Fix needed]

Re-run final-check after fixing.
```

## Rules

1. **VETO POWER** — can block task completion
2. **ALL CHECKS MUST PASS** — no partial approvals
3. **RE-VALIDATE AFTER FIXES** — don't trust "I fixed it"
