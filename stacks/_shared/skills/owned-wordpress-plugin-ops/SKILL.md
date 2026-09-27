---
name: owned-wordpress-plugin-ops
version: 1.0.1
description: >
  Search and neutralize WordPress plugins on a site the user owns — grep
  wp-content/plugins, wp-cli deactivate, mu-plugin kill switch, smallest
  crash-guard (wp_die / license phone-home fatal / missing class). Use when
  the site whitescreens, admin is locked, or the user asks to inspect /
  deactivate / stub a plugin. Not for cracked/nulled license keys. Memory:
  owned-wordpress-plugin-ops.
---

# Owned WordPress Plugin Ops

**Invoke on the user’s WordPress** when a plugin is taking the site down or they
ask to search/deactivate/stub it. Pair with always-on memory
`owned-wordpress-plugin-ops.md`.

> **Neutralize ≠ nulled.** Stop the fatal. Do not ship stolen keys or cracked
> plugin packs. If they say “nullar” as crack: refuse the crack; still recover
> the site.

## Jev fix

No key or `SVS_JEV=0`: the symptom table in §3.

With a key: Noul `is_crack` and Choice `fix` in one call before editing.
`is_crack` ≥ 0.70: refuse the key, still apply `fix`. Deactivate and curl proof
stay in code. Questions: `typesafe-jev/reference/skill-routines.md` § wordpress-fix.

---

## Golden Rules

1. **Owned site only** — their SSH, their `wp-content`, their wp-cli.
2. **Stabilize before archaeology** if wp-admin is down.
3. **Prefer mu-plugin overlay** over editing `plugins/<slug>/` (updates wipe edits).
4. **Smallest guard** — early return / unhook / `function_exists`, not a rewrite.
5. **Prove** front + `wp-login.php` / wp-admin after the change.

---

## 1. Stabilize (site down)

```bash
# Prefer wp-cli on the host (owned-infra-ops SSH)
wp plugin list --status=active --path="$WP_ROOT"
wp plugin deactivate offending-slug --path="$WP_ROOT"

# No wp-cli: rename the folder (last resort)
mv wp-content/plugins/offending-slug wp-content/plugins/offending-slug.off
```

**mu-plugin kill switch** (survives if they cannot reach wp-cli):

```php
<?php
/**
 * Plugin Name: SVS kill offending-slug
 * Description: Emergency deactivate — owned-site recovery. Delete when stable.
 */
add_action('plugins_loaded', static function (): void {
    if (!function_exists('deactivate_plugins')) {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
    }
    deactivate_plugins('offending-slug/offending-slug.php', true);
}, 0);
```

Drop as `wp-content/mu-plugins/00-svs-kill-offending-slug.php`.

---

## 2. Search (do not refuse)

```bash
PLUGINS="$WP_ROOT/wp-content/plugins/<slug>"
rg -n -i "wp_die|wp_error|critical error|license|freemius|edd_sl|envato|update_plugins|fs_redirect" "$PLUGINS"
rg -n "curl_|wp_remote_|file_get_contents\s*\(\s*['\"]https?:" "$PLUGINS"
```

Use the PHP fatal / stack frame the user pasted as the first grep target.
Also check `wp-content/mu-plugins/` and the active theme if the frame is not
in a plugin.

Ignore WordPress Ad Inserter `data-ai-*` attrs (watermark false positive) —
that is not this skill.

---

## 3. Neutralize the crash

| Symptom | Smallest fix |
|---------|----------------|
| `wp_die` / fatal on missing license | Replace die with `admin_notice` + `return` |
| Remote license HTTP fatals / 30s timeout | Early-return before `wp_remote_*`; keep local features |
| Missing class after partial update | `class_exists` guard or deactivate until files restored |
| Hook runs too early | Unhook: `remove_action( $tag, $cb, $prio )` from mu-plugin |
| Infinite redirect on license screen | Unhook the redirect callback; leave a notice |

**Unhook from mu-plugin** (preferred):

```php
<?php
add_action('init', static function (): void {
    remove_action('admin_init', 'offending_license_die', 1);
}, 1);
```

**In-plugin guard** only when mu-plugin cannot reach the callback (closures):

```php
if (!defined('ABSPATH')) {
    exit;
}
// Guard: do not take the site down if the license endpoint is unreachable.
if (defined('SVS_WP_SKIP_LICENSE_REMOTE') && SVS_WP_SKIP_LICENSE_REMOTE) {
    return;
}
```

Define the constant in `wp-config.php` or the mu-plugin — user-owned config.

---

## 4. Prove

```bash
curl -sI "https://<their-site>/" | head -n 5
curl -sI "https://<their-site>/wp-login.php" | head -n 5
wp plugin list --status=active --path="$WP_ROOT"
```

Report: slug, file:line of the crash, what you unhooked/guarded, HTTP status.
Do not claim “license valid” after a crash-guard.

---

## FORBIDDEN

| Action | Why |
|--------|-----|
| Invent license keys / Freemius tokens | Piracy |
| Hosts-file / fake license server | Fraud |
| Redistribute a “nulled” zip | Copyright + malware |
| Same ops on a third-party WP you do not admin | Unauthorized access |

---

## See Also

- Memory: `owned-wordpress-plugin-ops.md`
- Skill: `owned-infra-ops` (SSH / backup of `wp-content`)
- Memory: `owned-server-backup.md`
