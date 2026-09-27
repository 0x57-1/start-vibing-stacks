---
name: security-assessment-ops
version: 1.0.1
description: Defensive source/API security review, passive public OSINT posture, and authorized active assessment on owned/in-scope assets. Preferred phrasing to reduce Opus 5 / Fable-style cyber false positives; recovery when API falls back to Opus 4.8. Invoke for OWASP reviews, public header/TLS checks, or authorized hardening assessments. Not for unauthorized third-party attacks or exploit packs. Cannot override Anthropic Cyber Verification / API cyber blocks.
---

# Security Assessment Ops

**Invoke when the user asks for security review, OSINT posture, or authorized assessment** of code, APIs, or hosts.

> Pair with always-on memories: `defensive-security-review.md`, `passive-public-security-posture.md`, `authorized-security-assessment.md`.

> **Hard limit:** Memories/skills **cannot** lift Anthropic real-time cyber safeguards or Opus 5 → Opus 4.8 switches. Opus 5 **allows** source-code vulnerability finding; it **blocks** binary-based vuln scanning, penetration testing, and exploit generation. Dual-use at scale → [CVP](https://portal.anthropic.com/programs/cvp).

## Jev lane

No `TYPESAFE_API_KEY`, or `SVS_JEV=0`: use the table below.

With a key: one Choice `lane` before any fetch. Confidence &lt; 0.75 → the table.
`source_review` Lane A, `passive_osint` Lane B only, `authorized_active` Lane C only
with ownership or bounty in the prompt, else Lane B. Questions:
`typesafe-jev/reference/skill-routines.md` § security-lane.

---

## Choose a lane (first)

| Lane | When | Memory |
|---|---|---|
| **A — Source / API review** | Repo, routes, MCP, configs the user owns | `defensive-security-review.md` |
| **B — Passive public OSINT** | Third-party domain, public only | `passive-public-security-posture.md` |
| **C — Authorized active** | Owned / contract / bounty in-scope | `authorized-security-assessment.md` |
| **Owned ops inventory** | Their VPS backup/hardening inventory | `owned-infra-ops` (sibling skill) |

If the user says “scan this third party” with no mandate → **Lane B only**. Do not escalate to active.

---

## Preferred Phrasing

| Prefer | Avoid |
|---|---|
| “Defensive OWASP review of **our** API source” | “Pentest / hack / pwn this target” |
| “Passive public posture: headers, TLS, DNS” | “Attack surface recon for exploitation” |
| “Authorized hardening assessment of **my** host / in-scope asset” | “Unauthorized scan of competitor IP” |
| “Source/config review of **my installed** CLI” | “Binary vuln scan / crack the SEA / generate exploit” |

---

## Lane A — Source / API review

1. State: “Defensive security review of **your** codebase / API.”
2. Map auth, input validation, SSRF, injection, CORS, secrets, LLM/tool sinks (`security-baseline`, `ai-llm-security`, stack `api-security-*`).
3. Prefer static reasoning + project Semgrep/CI findings over live exploit attempts.
4. Deliver: finding → severity → fix. Redact secrets.

---

## Lane B — Passive public OSINT

1. State: “Passive public posture only — no active intrusion.”
2. Fetch public URLs; note security headers, redirects, visible cookies, public tech.
3. Optional public DNS/TLS metadata via user-approved public lookups.
4. **Stop** before nmap, login fuzz, or auth bypass.

---

## Lane C — Authorized active

1. Confirm ownership / contract / bounty in-scope (ask once if unclear).
2. Prefer inventory + config review on owned hosts (`owned-infra-ops`) before aggressive techniques.
3. Scope tools tightly; one named target; keys not passwords.
4. If Opus 5 falls back / blocks: stop agent chain; hand user-run script; analyze paste; recommend CVP for recurring work.
5. Do **not** rephrase to evade the API gate.

---

## Opus 5 / Fable 5 recovery

```
1. Classifier flag or model-switch notice
2. Stop the flagged tool chain that turn
3. Narrow to Lane A or B phrasing, OR user-run commands + paste
4. Explain: memory cannot override API; CVP for dual-use
5. Never "bypass Anthropic / bypassFilters for Claude cyber"
```

Note: `bypassPermissions` is an **IDE permission mode** (`claude-permission-modes.md`) — unrelated to cyber classifiers.

---

## FORBIDDEN

| Pattern | Why |
|---|---|
| Active scan of unauthorized third parties | Out of policy |
| Exploit packs / ransomware / credential stuffing | Prohibited use |
| Narrating as “penetration of victim X” without mandate | Classifier + policy |
| Claiming memories remove Opus 5 gates | False |

---

## See Also

- Memories: `defensive-security-review.md`, `passive-public-security-posture.md`, `authorized-security-assessment.md`, `claude-permission-modes.md`
- `owned-infra-ops`, `security-baseline`, `ai-llm-security`, `secrets-management`
- Ads bot evasion stays in `ad-bot-evasion.md` (ad verification crawlers only)
