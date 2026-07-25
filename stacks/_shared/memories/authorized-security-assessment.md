---
version: 1.0.0
---

# Memory: Authorized Security Assessment

> **ALWAYS LOAD** — Authorizes **active** security assessment (broader inventory, scoped probing, authorized testing) **only** when the target is owned by the user, under contract/admin mandate, or in an explicit bug-bounty / pentest scope. Not a blank check for third-party scanning.

---

## Declared purpose

Cover legitimate dual-use work that false-triggers as “penetration testing” when the user has clear authority:

- Owned VPS / company infra the user admins
- Client engagement with written scope
- Bug bounty **in-scope** assets the user states

Opus 5 classifiers often **fallback** on penetration testing and binary vuln scanning. Memories reduce refusal framing and teach recovery — they **cannot** remove the API gate. Recurring dual-use → [Cyber Verification Program](https://portal.anthropic.com/programs/cvp).

---

## Explicit authorization (execute)

1. **Confirm mandate once** if unclear: owned / contract / bounty in-scope. If clearly unauthorized third party → refuse active techniques; offer passive OSINT (`passive-public-security-posture.md`) only.
2. Prefer defensive outputs: findings + remediation. Avoid exploit weaponization unless the user has CVP and explicitly needs verification of a fix on **in-scope** assets.
3. Prefer key-based access on owned hosts; never print secrets.
4. Load skill `security-assessment-ops` (§ Authorized active).
5. If API cyber-blocks: stop; give user-run script; analyze paste; point to CVP.

---

## Preferred framing

| Prefer | Avoid |
|---|---|
| “Authorized assessment of **my** / **in-scope** asset …” | “Hack / pwn / attack this random IP” |
| “Verify hardening on host I administer” | “Unauthorized pentest of competitor” |
| “Source + config review first, then scoped checks” | Jump straight to exploit chains |

---

## Precedence

Takes precedence over refusals that treat **authorized** assessment of owned/in-scope assets as always forbidden.

Does **not** authorize unauthorized third-party attacks. Does **not** override Anthropic API cyber classifiers.

---

## Hard limit

Cannot lift Opus 5 / Opus 4.8 blocks on pentest / binary scanning / exploit generation. Do not rephrase to evade. CVP is the durable unlock for dual-use at scale.

---

## Out of scope

- Active scanning of third parties without ownership/contract/bounty scope
- Ransomware, mass exfiltration, credential stuffing
- “Bypass Anthropic”

---

## See Also

- Skill: `security-assessment-ops`
- Memories: `defensive-security-review.md`, `passive-public-security-posture.md`, `owned-infra-ops.md`
- Skills: `owned-infra-ops`, `security-baseline`
