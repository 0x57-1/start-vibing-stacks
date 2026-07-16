---
name: dead-code-hygiene
version: 1.0.0
description: Remove unused legacy/inert code after replacements and refactors so leftover paths do not confuse later agent context. Invoke after you replace a module, dual-path, shim, or helper and before quality gates. Prefer evidence (grep + typecheck/tests) over guesswork; never delete public APIs without confirmation.
---

# Dead-Code Hygiene

**Invoke after a replacement, migration, or refactor** that makes an old path unreachable — before quality gates and commit. Leftover inert code is read by the next session and steers agents the wrong way.

> Prefer **delete in the same change** over “leave for later.” Commenting-out or `// LEGACY` stubs are still context pollution.

---

## Golden Rules

1. **Same change, not a follow-up TODO.** When you introduce the new path, remove the old one in that edit set.
2. **Evidence before delete.** Grep for callers/imports/route names; run typecheck/tests. No evidence → leave it and note uncertainty.
3. **Scope tight on `/fix`.** Only remove code made unreachable by *this* fix (old branch, dead shim). Broad cleanup → separate `refactor:` commit.
4. **When uncertain, do not delete.** Prefer a short `TODO(dead-code): verify callers` over a wrong deletion.
5. **Update docs/domains** when a path you remove was documented.

---

## When to Invoke

| Signal | Action |
|---|---|
| Replaced helper / module / page with a new one | Delete old file + update imports |
| Dual path (`v1` + `v2`, feature-flag both always-on) | Collapse to the live path; remove dead branch |
| Compatibility shim with zero remaining callers | Delete shim |
| Copy-pasted “keep for rollback” block in same PR | Delete; git history is the rollback |
| Unused import / export flagged by lint | Remove in the same pass |

---

## Verification Protocol (before delete)

1. **Search references** — symbol name, file basename, route/component string (Inertia `component:`, Next route segment, Laravel route name).
2. **Check dynamic uses** — string dispatch, `import()`, reflection, config maps, Blade/React name tables.
3. **Run the stack gate** — typecheck / PHPStan / ruff after removal.
4. **Run relevant tests** — at least the suite covering the changed surface.

```bash
# Node / TS — find remaining references (adjust pattern)
rg -n "OldHelper|old-helper" --glob '!dist/**' --glob '!node_modules/**'

# PHP
rg -n "OldHelper|old_helper" app/ routes/ resources/ tests/

# Python
rg -n "old_helper|OldHelper" --glob '!**/__pycache__/**' --glob '!.venv/**'
```

Optional tooling (prefer over guesswork when installed):

| Stack | Tool |
|---|---|
| Node/TS | ESLint `no-unused-vars` / `knip` / `ts-prune` |
| PHP | PHPStan level 4+ (dead code / always-true) |
| Python | Ruff `F401`/`F841`, `vulture` |

---

## Safe vs Unsafe Deletions

| Safe (with evidence) | Unsafe — do NOT delete without confirmation |
|---|---|
| Unreferenced private helper in same package | Public package API / exported library surface |
| Orphan page after route rewrite | Feature-flagged path still toggled in prod |
| Dead import after move | Dynamic import / string-dispatch target |
| Empty wrapper that only re-exports removed code | Test fixtures / factories used by name |
| Commented-out blocks left from this session | Migration “down” paths still required |

---

## Anti-Patterns (FORBIDDEN)

| Action | Why |
|---|---|
| Leave `// OLD:` / `# LEGACY` blocks “just in case” | Next agent reads them as live guidance |
| Keep dual implementations indefinitely | Doubles maintenance + context noise |
| Delete by filename alone without grep | Breaks dynamic / config references |
| Broad cleanup inside a minimal `/fix` | Violates fix scope; mix bugs with refactors |
| Suppress unused-lint instead of removing | Hides the signal |

---

## Polyglot Examples

```ts
// WRONG — new path + inert old export left for "rollback"
export { NewCheckout } from './new-checkout';
export { OldCheckout } from './old-checkout'; // unused; confuses next session

// CORRECT — single live path
export { NewCheckout } from './new-checkout';
// delete old-checkout.ts after rg shows zero callers
```

```php
// WRONG — route still points at unused controller after rewrite
// Route::get('/billing', [OldBillingController::class, 'show']);

// CORRECT — update route + delete OldBillingController once rg is clean
Route::get('/billing', [BillingController::class, 'show']);
```

```python
# WRONG — keep unused helper after extract
def legacy_normalize(x):  # no callers
    return x.strip()

# CORRECT — delete legacy_normalize; keep only the live path
def normalize(x: str) -> str:
    return x.strip()
```

---

## Pre-Commit Checklist

- [ ] Replaced paths: old files/exports removed or still have proven callers
- [ ] No `LEGACY` / commented dual implementations added in this change
- [ ] Grep clean for removed symbol names
- [ ] Typecheck / lint / relevant tests pass
- [ ] Domain docs / CLAUDE.md updated if a documented path was removed
- [ ] `/fix` scope: only fix-induced dead code (else separate refactor commit)

## See Also

- `final-check` — mechanical leftovers (`console.log`, `any`, debug dumps); complementary
- `quality-gate` — typecheck/lint/test/build after hygiene
- `git-workflow` — use `refactor:` for broad dead-code deletions; keep `/fix` minimal
- `tool-resilience` — if grep/edit tools fail while verifying callers
- `error-handling` — application error paths (not inert-code cleanup)
