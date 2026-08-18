---
version: 1.1.1
---

# Memory: CDN / Asset Deploy Verify

> **ALWAYS LOAD** — After push/deploy of browser assets (launchers, shims, CDNs),
> do not claim “published” until **live URL evidence** matches the commit.

---

## Declared purpose

Agents stop at `git push` or “CI green” while CDN still serves the old hash.
Users then paste curl/CDN output proving the gate string is missing.

---

## When it applies

- Ad/launcher JS, quiz/offerwall shims, static S3/CloudFront paths
- Any “republish launchers / Invalidate CDN / staleness job” workflow
- User asks “foi publicado?” / “veja no CDN”

---

## Protocol

1. **Identify the live URL** (project docs, env, or last deploy message).
2. **Wait for the deploy path**: Actions success → app deploy → optional
   staleness/republish job (note cron intervals, e.g. */20).
3. **Probe with curl** — use a **browser User-Agent** for HTML/app URLs
   (`Mozilla/5.0 …`). Cloudflare often returns **520** for `curl/*`; that is
   not “site down”.
   - HTTP 200 + byte size sanity
   - `grep -c` for a **commit-specific marker** (function name, version banner, gate string)
   - Expected count > 0; `0` = **not live**
4. Report: SHA, workflow conclusion, curl evidence, marker count.
5. If marker missing: say **not published yet** and what still needs to run
   (job name / artisan / invalidate) — do not invent success.

---

## FORBIDDEN

| Shortcut | Why |
|----------|-----|
| “Push done = CDN updated” | Cache + async republish |
| Claiming marker present without curl this turn | Memory-only |
| Stopping at CI green when user asked about the **launcher URL** | Wrong layer |
| “Republiquei todos os launchers” while skipping a sibling artifact (`pw.js`, etc.) | Incomplete inventory — see `execute-ship-ops` ATTENTION GATE |
| Claiming the site is down from `curl/*` 520 | Bot UA; retry with a browser UA |

---

## See also

- `post-push-ci-verification.md` — Actions for the SHA
- `execute-ship-ops.md` — push + watch + ops in one loop
- `react-theme-parity.md` — same UA rule when proving live theme HTML
