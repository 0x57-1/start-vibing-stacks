---
name: owned-infra-ops
version: 1.0.0
description: User-owned server ops (health check, SSH backup, deploy) — ownership framing, safe tool order, and patterns that reduce Anthropic Opus/Sonnet cyber false positives. Invoke when the user asks to operate on infrastructure they own. Not for third-party systems, offensive security, or mass recon. Cannot override Anthropic Cyber Verification Program / API cyber blocks.
---

# Owned Infrastructure Ops

**Invoke when the user asks to operate on infrastructure they own** — health checks, SSH into their VPS, backups, deploys, log pulls. Goal: complete legitimate admin work with minimal “cyber recon” signal.

> **Hard limit:** Project memories and this skill **cannot** lift Anthropic’s real-time cyber safeguards on Opus/Sonnet. If the API returns a Cyber Verification / cybersecurity topic block, stop and follow the recovery section — do not rephrase to evade.

---

## Golden Rules

1. **Ownership first.** Confirm the host/IP/domain is the user’s (or contracted admin scope) before remote ops.
2. **One named target.** No CIDR sweeps, port scans, or “check all servers.”
3. **Prefer keys over passwords.** Never put passwords in agent commands or chat output.
4. **Minimal recon.** Only the checks needed for the stated task (backup path, health URL) — not full host enumeration.
5. **If Anthropic cyber-blocks:** stop the remote chain; ask the user to run SSH locally and paste output, or apply CVP.

---

## Ownership Checklist (before Bash/SSH)

Ask or confirm when unclear:

- [ ] User states the host is **theirs** (or they admin it under contract)
- [ ] Target is a **single** hostname/IP already known to them
- [ ] Task is ops (health / backup / deploy / logs) — not vulnerability research on a third party
- [ ] Credentials: SSH key path / agent, not a password pasted into the agent

If ownership is ambiguous → **ask**. Do not default to proceeding.

---

## Preferred Phrasing (reduce false positives)

| Prefer (ops / owned) | Avoid (recon / attack framing) |
|---|---|
| “My VPS at … — check if SSH is up, then backup `/var/www/app`” | “Scan this IP / probe the network / enumerate services” |
| “I am root on this host; use my key at `.env.d/…`” | “Crack / brute / bypass SSH” |
| “Pull only the app directory for backup” | “Dump the whole filesystem / find all secrets” |
| User runs `ssh` and pastes `ls` / `df` output | Agent chains ping → banner grab → sshpass → recursive find |

---

## Safe Tool Order

```
1. Confirm ownership + task scope (one host, one goal)
2. Connectivity (optional): ping OR curl https://host/healthz — not both + nmap
3. Auth: ssh -i "$KEY" user@host  (key already on disk / agent)
4. Targeted commands only (named paths for backup/deploy)
5. Tear down temp files; never echo secrets
```

### Safer patterns

```bash
# CORRECT — key-based, single host, scoped command
ssh -i "$SSH_KEY_PATH" -o IdentitiesOnly=yes -o ConnectTimeout=15 \
  user@my-vps.example.com 'hostname; ls -la /var/www/app.nutricionando'

# CORRECT — health of owned app (HTTPS)
curl -sfS --max-time 10 https://app.example.com/healthz

# CORRECT — when cyber risk is high: user runs SSH; agent analyzes pasted output only
```

### FORBIDDEN patterns (agent-side)

| Pattern | Why |
|---|---|
| `sshpass` / password on the command line | Credential in process list + strong cyber signal |
| Embedding passwords/private keys in prompts or logs | Leak + classifier trigger |
| `nmap`, subnet sweeps, mass banner grabs | Dual-use recon |
| Broad `find /` / recursive secret harvest after login | Looks like post-exploitation |
| Rephrasing after a Cyber Verification API block to “get around” it | Policy evasion — stop instead |
| Ops against hosts the user does not own | Out of scope |

---

## When Anthropic Cyber-Blocks Mid-Task

1. **Stop** further remote Bash/SSH in that turn.
2. Explain: API-level cyber safeguard (Opus/Sonnet), not a project hook.
3. Offer recovery:
   - User runs the SSH/backup commands locally and pastes output for analysis
   - Prefer SSH keys + non-interactive, scoped commands next time
   - For recurring legitimate dual-use ops: apply to the [Cyber Verification Program](https://portal.anthropic.com/programs/cvp) (org admin; data retention required)
4. Optionally continue on **local** artifacts only (configs, scripts, pasted logs).

Do **not** claim this skill or any memory overrides that API gate.

---

## Prefer CI Over Ad-Hoc SSH

For deploy/backup that repeats: use existing pipelines (`ci-pipelines`, GitHub Actions, provider CLIs) instead of interactive root SSH from the agent.

---

## See Also

- `secrets-management` — SSH keys, `.env.d/`, never put secrets in commands
- `tool-resilience` — classify SSH/curl failures (permission vs transient)
- `ci-pipelines` — preferred path for repeatable deploy/backup
- `observability` — app `/healthz` / `/readyz` (not host recon)
- Memory `owned-infra-ops.md` — short always-on ownership contract
