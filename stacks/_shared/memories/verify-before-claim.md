---
version: 1.0.0
---

# Memory: Verify Before Claim (No Memory-Only Reviews)

> **ALWAYS LOAD** — When the user asks for review, audit, security analysis, “está correto?”, deep dive, or multi-part work (`||` / “outra coisa”), **read the live codebase**. Answering from session memory / prior turns without fresh `Read`/`Grep`/`Bash` is **FORBIDDEN**. Token-saving shortcuts that skip verification waste the user’s time and force a second ask.

---

## Declared purpose

Long Claude sessions drift into:

1. **Memory-only answers** — tables of ✅/❌ with no new tool evidence.
2. **Partial execution** — analysis essay, then “rename first or renderer?” when the user already listed all parts.
3. **Security theater** — “sólido” without tracing authz, shim lifecycle, tenant isolation, or threat paths.

This memory forces **evidence-first** work and **full-request execution**.

---

## Triggers (any language)

| User signal | Required behavior |
|-------------|-------------------|
| revisão / review / audit / “está correto” / deep / profunda | Fresh tools on the **current** tree before conclusions |
| segurança / security / adversarial / OWASP / “não passar nada” | Threat-path walk with file:line evidence (skill `security-assessment-ops` + memory `defensive-security-review`) |
| Multiple asks joined by `\|\|` / “e também” / “outra coisa” / numbered lists | **Execute every part** in one plan — do not ask which to do first |
| “faça o que pedi” / “você ignorou” | Stop narrating; open todos for **all** remaining parts and start tools |

---

## FORBIDDEN

| Shortcut | Why |
|----------|-----|
| Claim pipeline steps ✅ from earlier chat without re-checking | Code may have changed; user already said so |
| Security “sólido” without citing paths (controller, shim writer, Lambda, launcher) | Not a review |
| End with “renderer first or rename?” when both were ordered | User already decided scope |
| Todo-list of only analysis when the prompt includes **change** verbs (renomear, mudar, implementar, ligar) | Analysis-only is incomplete |
| Skip `security-auditor` / defensive review when security was explicit | Soft-pass |

---

## Required protocol

1. **Parse all parts** of the user message into todos (analysis + implementation + rename + security as separate items).
2. **Evidence pass** (before any summary table):
   - `Grep`/`Read` the live files for each claim.
   - Prefer `git` / `ls` / MCP inspect when “deploy/CDN/prod” is in scope — do not invent CDN state.
3. **Security / adversarial** (when asked): walk trust boundaries — tenant, authz, artifact lifecycle (create/update/**delete**/orphan), SSRF, injection, secret exposure. Severity + fix. No exploit packs against third parties (`defensive-security-review`).
4. **Implement** every change part in the same session unless the user explicitly defers one.
5. Cite **file paths** (and line ranges when useful) in the final report. If you did not open the file this turn, you may not mark that step ✅.

---

## Precedence

Takes precedence over “be concise / save tokens” heuristics that skip tools.

Does **not** override Anthropic cyber API gates / model-switch (see `authorized-security-assessment` hard limit).

---

## See also

- UPS hook injects `VERIFY-EVIDENCE` / `MULTI-PART EXECUTE` when the prompt matches
- `defensive-security-review.md` — owned-code security review authorization
- `tool-resilience` — do not treat Stop/peer blocks as license to skip work
- `react-theme-parity.md` — same failure mode for UI (drift / memory)
