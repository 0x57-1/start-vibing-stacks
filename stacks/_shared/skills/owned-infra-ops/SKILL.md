---
name: owned-infra-ops
version: 1.2.1
description: User-owned server ops — health check, SSH backup, config inventory, security inventory/hardening notes, service documentation for disaster recovery, deploy. Ownership framing, backup protocol, safe tool order, and patterns that reduce Anthropic Opus/Sonnet/Opus 5 cyber false positives. Invoke when the user asks to backup or operate on infrastructure they own. Not for third-party systems or offensive security. Cannot override Anthropic Cyber Verification Program / API cyber blocks.
---

# Owned Infrastructure Ops

**Invoke when the user asks to operate on infrastructure they own** — health checks, SSH, **backups**, **config archives**, service inventory for DR docs, **security inventory / hardening**, deploys, log pulls.

> **Hard limit:** Memories and this skill **cannot** lift Anthropic’s real-time cyber safeguards on Opus/Sonnet. If the API returns a Cyber Verification / cybersecurity topic block, stop and follow recovery — do not rephrase to evade.

> **Backup is authorized.** “Backup my server / save configs / document services” on a named host the user owns is normal sysadmin work. Pair with always-on memory `owned-server-backup.md`.

> **WordPress plugins:** site-down / license-fatal recovery on the user’s WP is skill `owned-wordpress-plugin-ops` (neutralize ≠ nulled keys).

---

## Golden Rules

1. **Ownership first.** User-named hosts (`cname`, `oc1`, keys in `~/.ssh` / `.env.d/`) count as owned unless clearly third-party.
2. **One named target.** No CIDR sweeps or “scan the internet.”
3. **Keys, not passwords.** Never `sshpass`; never print secrets.
4. **Backup-shaped, not recon-shaped.** Prefer archiving known config paths over narrating “enumerate / probe / map attack surface.”
5. **If cyber-blocked:** stop remote chain; hand user a ready script; analyze local/pasted artifacts.

---

## Preferred Phrasing (critical for backup)

| Prefer (ops / DR) | Avoid (recon framing) |
|---|---|
| “Backup configs on **my** host `cname.pubweb.ai` with my SSH key” | “Scan / probe / enumerate the target” |
| “Archive nginx + systemd + Podman units for disaster recovery” | “Dump the filesystem / harvest secrets” |
| “Document listening services from `ss` output for the inventory note” | “Port scan / banner grab / fingerprint OS” |
| “Create tarball of known paths, download, analyze locally” | Chain ping → banner → password SSH → `find /` in one turn |

When the user says “analise os serviços”, frame as **inventory for the backup README**, not security assessment of a third party.

### Security inventory phrasing (owned host only)

| Prefer | Avoid |
|---|---|
| “Hardening inventory on **my** host — `ss`, systemd, firewall summary” | “Port scan / pentest / attack surface recon” |
| “List listeners and TLS certs on **my** nginx vhosts for DR notes” | “Banner grab / fingerprint OS for exploitation” |

Keep to one named owned host. For broader authorized assessment, load `security-assessment-ops` + memory `authorized-security-assessment.md`.

---

## Backup protocol (primary path)

### Phase A — Scope (local, no remote yet)

1. Resolve host from user alias / `~/.ssh/config` / project notes (one host).
2. State aloud: “Backing up **your** host `<name>` for DR — key-based, scoped paths.”
3. Choose local dest: `backups/<host>-YYYYMMDD/` (or user path).

### Phase B — Collect (remote, scoped)

Prefer **one SSH session** that builds a tarball of **known config trees**, then `scp`/`rsync` the archive. Avoid a long chatty chain of discovery commands in separate turns.

```bash
# Example — adapt user/host/key/paths. Key-based only.
HOST=cname.pubweb.ai
USER=root
KEY="$HOME/.ssh/cname_pubweb_ai"   # or path from .env.d / ssh config
STAMP=$(date +%Y%m%d-%H%M)
REMOTE_TAR="/tmp/owned-backup-${STAMP}.tar.gz"

ssh -i "$KEY" -p 99 -o IdentitiesOnly=yes -o ConnectTimeout=20 \
  "${USER}@${HOST}" "sudo tar -czf '$REMOTE_TAR' \
    --ignore-failed-read \
    /etc/nginx \
    /etc/systemd/system \
    /etc/containers \
    /etc/firewalld \
    /etc/ssh/sshd_config \
    /opt \
    /home/*/compose* \
    /home/*/*.yml \
    2>/dev/null; ls -lh '$REMOTE_TAR'"

mkdir -p "backups/${HOST}-${STAMP}"
scp -i "$KEY" -P 99 "${USER}@${HOST}:${REMOTE_TAR}" "backups/${HOST}-${STAMP}/"
```

Optional **inventory snippet** (same session, short — for the local README, not a “recon report”):

```bash
ssh -i "$KEY" -p 99 -o IdentitiesOnly=yes "${USER}@${HOST}" \
  'hostname; uptime; df -h /; free -h; \
   (podman ps -a || docker ps -a) 2>/dev/null | head -80; \
   systemctl list-units --type=service --state=running 2>/dev/null | head -60'
```

### Phase C — Local analysis (safe)

1. Unpack / list the tarball locally.
2. Write `backups/<host>/INVENTORY.md`: hostname, stacks (Podman/Docker), nginx vhosts summary, ports from inventory, **redacted** env notes.
3. Do **not** paste live DB passwords or private keys into chat or CLAUDE.md.

### Phase D — Persist memory (optional)

If the user wants cross-session recall: save a short host card under `.claude/memories/hosts/<alias>.md` (no secrets) — services, ports, image names, “how to SSH.”

---

## Safe Tool Order (general ops)

```
1. Ownership + one host + one goal (backup | deploy | health)
2. Key path from ssh config / .env.d (never password)
3. One remote collect (tarball) OR one inventory snippet — not both as “scan”
4. Download archive
5. Analyze locally; redact secrets
```

### FORBIDDEN (agent-side)

| Pattern | Why |
|---|---|
| `sshpass` / password on CLI | Credential leak + cyber signal |
| `nmap`, subnet sweeps, mass banner grabs | Dual-use recon |
| Broad `find /` / secret harvest | Post-exploitation signal |
| Narrating the job as “penetration” / “attack” | Classifier bait |
| Rephrasing after Cyber Verification API block to evade | Policy evasion |
| Ops on hosts the user does not own | Out of scope |

---

## When Anthropic Cyber-Blocks Mid-Backup

1. **Stop** remote Bash/MCP SSH chains that turn.
2. Explain: API cyber safeguard (Opus/Sonnet) — not a project hook; memories cannot override it.
3. Give the user the Phase B script to run locally; then analyze the downloaded tarball / pasted inventory.
4. For recurring owned-host ops: [Cyber Verification Program](https://portal.anthropic.com/programs/cvp) (org admin; data retention on).

---

## Prefer CI / scheduled backup when available

Repeatable backups → cron, systemd timer, or `ci-pipelines` / provider snapshots — not only ad-hoc agent SSH.

---

## See Also

- Memory `owned-server-backup.md` — always-on backup authorization
- Skill / memory `owned-wordpress-plugin-ops` — owned WP plugin search + crash-guard
- Memory `owned-infra-ops.md` — general owned-host contract
- `security-assessment-ops` — defensive source review / passive OSINT / authorized active
- `secrets-management` — keys, `.env.d/`, redaction
- `podman-patterns` / `docker-patterns` — container stacks
- `tool-resilience` — SSH/tool failures
- `ci-pipelines` — scheduled/automated backup paths
