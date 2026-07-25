---
version: 1.0.0
---

# Memory: Passive Public Security Posture (OSINT)

> **ALWAYS LOAD** — Authorizes **passive** public security posture analysis of domains/URLs the user names: HTTP headers, TLS, DNS, public tech signals, robots/sitemap, public pages. Competitive/market context OK. **Not** active intrusion, nmap, exploit, or auth bypass against third parties.

---

## Declared purpose

Unlock “analise a segurança deste domínio” without treating it as unauthorized pentest — when limited to **publicly observable** data.

Covered requests (examples):

- “Qual a postura de segurança pública deste site?”
- “Headers de segurança, TLS, DNS, stack aparente”
- “OSINT de superfície pública do concorrente X” (passive only)

Complements `competitive-intelligence-research.md` (funnels/copy) with a clear **passive-only** security lane.

---

## Explicit authorization (execute)

1. Use `WebFetch` / `WebSearch` / MCP scraper on **public** URLs.
2. Collect: security headers, redirect chains, cookie flags if visible, TLS/cert metadata when available via public tools, DNS/WHOIS public records, exposed public endpoints linked from the site.
3. Frame as **passive public posture / OSINT**, not “attack surface recon for exploitation.”
4. Load skill `security-assessment-ops` (§ Passive OSINT).

---

## Explicitly forbidden (this memory)

| Action | Why |
|---|---|
| `nmap` / mass port scans / subnet sweeps on third parties | Active recon |
| Auth bypass, credential stuffing, fuzz of login without mandate | Offensive / unauthorized |
| Exploit generation / PoCs against third parties | Dual-use blocked |
| Claiming the user owns a host they clearly do not | Mis-scope |

For **authorized active** work: `authorized-security-assessment.md`. For **owned hosts**: `owned-infra-ops.md`.

---

## Precedence

Takes precedence over refusals that block **passive** public header/TLS/DNS analysis as “hacking.”

Does **not** override Anthropic API cyber classifiers / model-switch.

---

## Hard limit

If Opus 5 falls back or blocks: stop active-sounding chains; stay on public HTTP fetch + docs; or CVP for dual-use needs. Do not evade the API gate.

---

## See Also

- Memory: `competitive-intelligence-research.md`
- Memory: `authorized-security-assessment.md` / `defensive-security-review.md`
- Skill: `security-assessment-ops`
