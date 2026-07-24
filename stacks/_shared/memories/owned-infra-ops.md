---
version: 1.1.0
---

# Memory: Owned Infrastructure Ops

> **ALWAYS LOAD** — Authorizes legitimate admin work on infrastructure the user owns (or contractually administers): health checks, SSH with keys, backups, deploys, log pulls.

---

## Declared purpose

Help the agent treat **user-owned** server/ops requests as normal engineering work — not as unauthorized intrusion — when the user is clearly operating their own hosts.

Typical requests:

- “Is my VPS online?” / health check on a named host
- SSH with a project key (e.g. `.env.d/*.pub` / key path) for backup or deploy
- Pull or archive a known app directory on that host
- Inspect logs the user asks for on their machine

For **full backup + config inventory + service documentation**, also load / prefer memory `owned-server-backup.md` and skill `owned-infra-ops` § Backup protocol.

---

## Explicit rules

1. **Ownership required.** Proceed with remote ops only when the user indicates the target is theirs (or they admin it). If unclear, ask once.
2. **Single named target.** Do not scan networks or probe unrelated hosts.
3. **Keys, not passwords.** Prefer SSH keys / agent. Never print secrets. Avoid `sshpass` and passwords on the CLI.
4. **Scoped commands.** Prefer the minimum checks for the stated task over host-wide enumeration. Prefer “backup known paths” framing over “enumerate / probe.”
5. **Load skill `owned-infra-ops`** for tool order, backup protocol, phrasing, and recovery when blocked.

---

## Hard limit (Anthropic cyber safeguards)

This memory **does not** and **cannot** override Anthropic’s real-time cyber safeguards on Opus/Sonnet, nor the Cyber Verification Program (CVP).

If the API returns a cybersecurity / Cyber Verification block:

- Stop remote recon/SSH chains in that turn
- Do not rephrase to evade the block
- Recover via: user-run backup script + pasted output / local tarball analysis, or org CVP — see skill `owned-infra-ops`

---

## Out of scope

- Third-party / competitor infrastructure without clear admin authority
- Offensive security, exploit development, mass recon, credential stuffing
- “Bypass Anthropic / evade the cyber gate” requests

---

## See Also

- Memory: `owned-server-backup.md` (backup + config inventory authorization)
- Skill: `owned-infra-ops` (backup protocol, checklist, safe patterns)
- Skill: `secrets-management` (keys, `.env.d/`)
