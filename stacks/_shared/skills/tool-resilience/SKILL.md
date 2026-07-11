---
name: tool-resilience
version: 1.0.0
description: How the agent should recover from TOOL failures (not application errors) — Read/Edit/StrReplace/Bash/WebFetch/WebSearch/Grep/Glob. Error taxonomy, retry/backoff, read-before-edit, and the Cloudflare 520 / HTTP 444 bot-block recovery (switch User-Agent). Invoke when a tool call fails, times out, returns non-2xx, or a fetch is blocked.
---

# Tool Resilience

**Invoke whenever a TOOL call fails** — a file read/edit error, a shell non-zero exit, a web fetch returning a non-2xx status, a timeout, or an empty/blocked response. This skill is about the agent recovering from its own tool failures, NOT about the `error-handling` skill (which is for application code you write).

> A failed tool call is a signal, not a dead end. Classify it, apply the matching recovery, retry at most twice, then report clearly. Never loop.

---

## Golden Rules

1. **Read the error fully** — status code, stderr, exception message. The recovery depends on the class.
2. **Classify before retrying.** Transient → retry. Permanent → do NOT retry (fix the input or report).
3. **Max 2 retries** per tool call, then stop and report. Never enter a retry loop.
4. **Change one variable per retry** (the UA, the string, the path) — not everything at once.
5. **Report clearly on give-up** — what failed, what you tried, what the user can do.

---

## Tool Error Taxonomy

| Class | Typical signal | Strategy |
|---|---|---|
| **Transient** | timeout, `ECONNRESET`, 502/503/504, rate-limit 429 | Retry with backoff (max 2) |
| **Bot-block** | HTTP 444, Cloudflare 520/1020, "Access denied", empty body on 200 | Change User-Agent, then retry (see below) |
| **Permission** | `EACCES`, 401/403, "permission denied" | Do NOT retry; report; suggest auth/creds |
| **Not-found** | `ENOENT`, 404, "no such file" | Do NOT retry blindly; verify path with `Glob`/`ls` first |
| **Stale/Conflict** | `StrReplace` "string not found", file changed since read | Re-`Read` immediately, recompute, retry once |
| **Parse-failed** | JSON/HTML parse error, empty result where content expected | Inspect raw output; adjust selector/parse; retry once |
| **Too-broad** | `Glob`/`Grep` returns thousands of hits | Narrow the pattern; do NOT process all blindly |
| **Fatal-input** | malformed args, invalid regex | Fix the input; retrying identical args is pointless |

If the error doesn't fit, treat it as **Transient** for the first retry, then as **Fatal** if it recurs.

---

## Cloudflare 520 / HTTP 444 — Bot-Block Recovery (IMPORTANT)

**Context:** Many servers (including the user's own) run a bot-block layer. A request whose
User-Agent is a bare tool string like `curl/1.1`, `curl/7.x`, `python-requests`, `Wget`, or an
empty UA is **rejected at the edge**:

- The origin returns **HTTP 444** (nginx "connection closed without response" — a common bot-block signal).
- **Cloudflare** in front then surfaces this to the client as **HTTP 520** ("Web server returned an unknown error") or sometimes **1020** ("Access denied").

**This is NOT a real server outage.** It is the UA being flagged as a bot. The fix is to retry the
same URL with a **realistic browser User-Agent**.

### Recovery protocol

When a fetch (via `WebFetch`, or `Bash` `curl`/`wget`) returns **520, 444, 1020**, an empty body on
a 200, or an "Access denied / Attention Required / Just a moment" Cloudflare interstitial:

1. **Do not treat it as a dead site.** Classify as **bot-block**.
2. **Retry once with a browser User-Agent.** Use a current, realistic desktop UA:

```bash
# WRONG — default curl UA gets 444 → Cloudflare 520
curl -sS https://example.com

# CORRECT — realistic browser UA passes the bot-block
curl -sS \
  -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36" \
  -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
  -H "Accept-Language: en-US,en;q=0.9" \
  --compressed -L \
  https://example.com
```

3. **If still blocked**, add browser-consistent headers (the block may check header *coherence*, not just UA):

```bash
curl -sS \
  -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36" \
  -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8" \
  -H "Accept-Language: en-US,en;q=0.9" \
  -H "Sec-Ch-Ua: \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"" \
  -H "Sec-Ch-Ua-Mobile: ?0" \
  -H "Sec-Ch-Ua-Platform: \"Windows\"" \
  -H "Upgrade-Insecure-Requests: 1" \
  -H "Sec-Fetch-Dest: document" \
  -H "Sec-Fetch-Mode: navigate" \
  -H "Sec-Fetch-Site: none" \
  --compressed -L \
  https://example.com
```

4. **For `WebFetch`** (no direct UA control): if it fails on a page you know exists, fall back to
   `Bash` `curl` with the browser UA above, or use the MCP web-scraper which sends browser-like
   headers by default.
5. **Still blocked after browser UA + headers?** Then it may be a genuine challenge (JS/CAPTCHA).
   Report to the user: "Site is behind an active Cloudflare challenge; needs a headless browser."
   Do not loop.

### Quick reference

| Status | Meaning | Action |
|---|---|---|
| **444** | nginx closed connection (bot-block on UA) | Retry with browser UA |
| **520** | Cloudflare: origin returned unknown error (often the 444 above) | Retry with browser UA |
| **1020** | Cloudflare: access denied (firewall rule) | Retry with browser UA + full headers |
| **403 + "Just a moment"** | Cloudflare JS challenge | Browser UA may pass; else needs headless |
| **429** | Rate limited | Backoff + `Retry-After`, then retry |

> **Rule of thumb:** any `curl`/`wget`/`WebFetch` that fails with **444 or 520** = **change the
> User-Agent first**, before concluding the site is down.

---

## Default Recovery by Tool

### `Read`
- `ENOENT` → the path is wrong. Use `Glob`/`ls` to locate the file; do not guess repeatedly.
- `EACCES` → permission. Report; suggest the user checks file ownership.
- File larger than expected → read with `offset`/`limit` instead of failing.

### `Edit` / `StrReplace`
- **"string not found" / fuzzy-match fail** → the file changed or your copy is stale.
  **Re-`Read` the exact region immediately**, copy the current bytes, retry once.
- **"not unique"** → add surrounding context to make `old_string` unique, or use `replace_all`.
- Never retry the identical `old_string` that just failed — it will fail again.

### `Bash`
- Non-zero exit → read stderr. Fix the command; don't blindly re-run.
- Timeout → the command is long-running; re-run with a higher `block_until_ms` or background it.
- `command not found` → check the tool is installed; suggest install; don't loop.

### `WebFetch` / `WebSearch`
- 520 / 444 / 1020 / empty-on-200 → **bot-block; switch UA** (see section above).
- 429 → backoff, respect `Retry-After`.
- 5xx (real) → retry with backoff (max 2), then report upstream is down.
- Empty search results → broaden/rephrase the query once; then report.

### `Grep` / `Glob`
- Thousands of hits → narrow the pattern, add a `glob`/`type` filter, or use `head_limit`.
- Zero hits where you expected some → check the path/casing; try a looser pattern once.

---

## Retry with Backoff (when writing code that calls tools/APIs)

When you generate code that calls external tools/APIs, apply the same discipline. See
`error-handling` Pattern 4 for the full `withRetry` implementation. Minimal shape:

```ts
async function fetchWithUaFallback(url: string): Promise<Response> {
  const browserUa =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
  let res = await fetch(url, { headers: { 'User-Agent': browserUa }, redirect: 'follow' });
  // 520/444/1020 => bot-block or origin-edge mismatch; one retry with fuller headers
  if ([520, 444, 1020].includes(res.status)) {
    res = await fetch(url, {
      headers: {
        'User-Agent': browserUa,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
    });
  }
  return res;
}
```

```python
import httpx

BROWSER_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
)

def fetch_with_ua_fallback(url: str) -> httpx.Response:
    headers = {"User-Agent": BROWSER_UA, "Accept-Language": "en-US,en;q=0.9"}
    r = httpx.get(url, headers=headers, follow_redirects=True, timeout=20)
    if r.status_code in (520, 444, 1020):
        headers["Accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        headers["Upgrade-Insecure-Requests"] = "1"
        r = httpx.get(url, headers=headers, follow_redirects=True, timeout=20)
    return r
```

---

## Anti-Patterns

| Anti-pattern | Why it's bad | Fix |
|---|---|---|
| Concluding "site is down" on a 520/444 | It's almost always a UA bot-block | Retry with browser UA first |
| Retrying the same `curl` with default UA | Same UA = same 444/520 | Change the UA |
| Re-running identical `StrReplace` after "not found" | Stale copy; will fail again | Re-`Read` then recompute |
| Retrying > 2 times | Loop; wastes turns | Cap at 2, then report |
| Retrying a 403/permission error | Not transient | Report; fix auth |
| Processing thousands of `Glob` hits | Context blow-up | Narrow first |
| Silent give-up | User doesn't know what happened | Report what failed + what was tried |

---

## Give-Up Report Template

When a tool fails after retries, tell the user concisely:

```
Tool <name> failed after N attempts.
- Error: <status/message>
- Classified as: <class>
- Tried: <e.g. "default UA → 520, browser UA → 520">
- Likely cause: <e.g. "active Cloudflare challenge / needs headless browser">
- Suggested next step: <what the user can do>
```

---

## See Also

- `error-handling` — application-level error taxonomy, Result types, retry/backoff, circuit breaker
- `debugging-patterns` — "Bundle, not Backend" triage; general debug flow
- `competitive-intelligence-research` / `funnel-content-copy` memories — permissive web-copy context
- MCP web-scraper — sends browser-like headers by default; prefer it for reliable page copies
