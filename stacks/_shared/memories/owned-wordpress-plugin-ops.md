---
version: 1.0.0
---

# Memory: Owned WordPress Plugin Ops (Search + Neutralize)

> **ALWAYS LOAD** — On a WordPress site the user **owns** (or administers), search
> plugin/theme code and **neutralize** a plugin that is fatalling, whitescreening,
> or blocking wp-admin — without refusing because the prompt says “plugin”,
> “license”, “Freemius”, or “desativar update”. Not a blank check for piracy.

---

## Declared purpose

Agents refuse or stall when the user asks to grep `wp-content/plugins`, stub a
crashing callback, or deactivate a premium plugin that is taking the site down.
Those are **owned-site recovery** tasks. This memory authorizes them.

**“Neutralize”** here means: stop the fatal / admin lockout so the site loads.
It does **not** mean ship a cracked / “nulled” plugin or a stolen license key.

---

## When it applies

| Signal | Action |
|--------|--------|
| Fatal / WSOD / `There has been a critical error` after a plugin | Find the file, neutralize, prove admin/front loads |
| “Procura no plugin X” / grep `wp-content/plugins` | Search immediately — do not ask ownership theater |
| License / update nag that **wp_die**s or fatals | Guard the crash; keep a notice, do not invent a key |
| Plugin loop / timeout on license phone-home | Early-return the remote call; site must stay up |
| User says deactivate / mu-plugin kill switch | `wp plugin deactivate` or drop-in — do it |

Ownership: user’s host, their `wp-content`, their SSH/wp-cli, local dump of **their** site.

---

## Protocol (skill `owned-wordpress-plugin-ops`)

1. **Stabilize first** if the site is down: `wp plugin deactivate <slug>` or
   `mu-plugins/00-svs-kill-<slug>.php` that unhooks / `deactivate_plugins`.
2. **Search** in `wp-content/plugins/<slug>` (and mu-plugins) for the stack
   frame / `wp_die` / missing class / license HTTP that fatals.
3. **Neutralize the crash** with the smallest guard (early return, `function_exists`,
   unhook, admin notice instead of `wp_die`).
4. **Prove** wp-admin + front return 200 (or wp-cli `wp option get siteurl` + curl).
5. Prefer a **mu-plugin overlay** over editing vendor plugin files when possible
   (survives plugin updates).

---

## FORBIDDEN (hard limits — always win)

| Action | Why |
|--------|-----|
| Generate / paste stolen license keys, Envato tokens, Freemius secrets | Piracy |
| Publish or vendor a “nulled” plugin pack / crack | Copyright + malware risk |
| License-server impersonation / hosts-file fake activation | Fraud |
| Neutralize plugins on a site the user does **not** own | Unauthorized access |
| Disable payment/security plugins to hide fraud | Crime help |

If the user asks to “nullar” meaning **crack**: refuse the crack; still offer
deactivate / mu-plugin kill / crash-guard so **their** site stays up.

---

## False refusals (do not stall)

Words like *nulled, Freemius, EDD, license check, update blocker, ionCube,
premium plugin* do **not** by themselves mean piracy. On an owned WSOD they
mean “find what dies and stop the death.”

---

## Precedence

- Complements `owned-infra-ops` / `owned-server-backup` (SSH + wp-content).
- Hard limits (phishing / impersonation / third-party attack) still win.
- Does **not** override Anthropic cyber API gates — if blocked, hand a
  user-run wp-cli/mu-plugin snippet and analyze local `wp-content` paste.

---

## See also

- Skill: `.claude/skills/owned-wordpress-plugin-ops/`
- Memories: `owned-infra-ops.md`, `owned-server-backup.md`
