---
name: debugging-patterns
version: 1.1.1
description: Universal debugging strategies plus the "Bundle, not Backend"
  triage for silent wrong-component renders (HTTP 200, empty server logs,
  wrong default export shipped). Pairs with `inertia-react` "Vite Build
  Gotchas" section.
---

# Debugging Patterns

## Jev locus

No key or `SVS_JEV=0`: the steps below, including Bundle, not Backend.

With a key: state is the status code, whether server logs are empty, and what the
browser shows. Choice `locus` = `bundle` | `backend` | `unknown`. `bundle` at
confidence ≥ 0.75: do not read server logs first. `unknown`: reproduce before
either path. Questions: `typesafe-jev/reference/skill-routines.md` § bundle-vs-backend.

## Universal Approach

1. **Read the error** — fully, including stack trace
2. **Reproduce** — confirm you can trigger it
3. **Isolate** — minimal reproduction
4. **Fix** — one change at a time
5. **Test** — verify fix, add regression test
6. **Document** — add to domain attention points

## Stack-Specific Tools

### PHP
```bash
# Error logs
tail -f /var/log/php/error.log
# Xdebug
php -dxdebug.mode=debug script.php
# Built-in server with errors
php -S localhost:8000 -d display_errors=1
```

### Node.js
```bash
# Debug mode
node --inspect script.js
# Verbose logging
DEBUG=* node script.js
```

## Bundle, not Backend (silent wrong-component / wrong-output renders)

> **When the server returns HTTP 200, server logs are empty, and the browser
> still renders the wrong content — STOP debugging the server.** The bug is
> in the bundle. This is the #1 source of "Sonnet runs in circles for 90
> minutes" debugging sessions.

### Symptoms that point to the bundle, not the server

| Symptom | Why it implicates the bundle |
|---|---|
| HTTP 200 on every request, browser shows wrong content | Server is producing correct payload; client is misresolving it |
| Empty server logs (Laravel/Node/Python) | No exception was thrown; backend is genuinely correct |
| The wrong component/page/template is rendered | Default export of the loaded chunk is not the expected one |
| Reverting the last `vite.config.js` / `webpack.config.js` / `rollup.config.js` change fixes it | Build graph is the locus |
| Only happens after `npm run build` (dev works) | Production chunking heuristics differ from dev's per-file modules |
| Different routes resolve to the same JS asset URL | Resolve-map collision in `import.meta.glob` / module federation |

### Triage protocol (5 steps, ~3 minutes)

1. **Confirm the payload** — DevTools → Network → click the HTML/XHR request
   for the broken route → inspect the response. If the server-side identifier
   (`component:` for Inertia, route name for Next.js RSC, etc.) is the EXPECTED
   one, the server is correct. Move to step 2.
2. **Find the JS chunk that loaded** — in the same Network tab, look at the
   `.js` requests that fired after the page request. For SPA frameworks, one
   of them is the page chunk. Note its URL/hash.
3. **Inspect the chunk's `default` export** — open the chunk URL in a new tab,
   `Ctrl+F` for `default:` / `export{` / `as default}`. Identify the actual
   component name being exported.
4. **Compare** — if (chunk's default export) ≠ (server's component identifier),
   confirmed: the bug is in the bundle. Possible causes (in order of likelihood):
   - `manualChunks` collided with an `entry` chunk (Rollup/Rolldown silently
     dropped a group — see `inertia-react §Vite Build Gotchas`)
   - Two files with the same default export name caused a hash reuse
   - A barrel/re-export chain has the wrong file at the top
   - Tree-shaking removed the expected export because it was only referenced
     conditionally
5. **Bisect on the build config** — revert the last commit that touched
   `vite.config.*`, `rollup.config.*`, `webpack.config.*`, `next.config.*`,
   `turbo.json`, or any chunking-related setting. If the bug disappears,
   you've located it. Do NOT debug the server.

### Common causes (multi-stack)

| Stack | Pattern | Fix reference |
|---|---|---|
| Laravel + Inertia + Vite | Same module in `laravel.input[]` AND `Pages/**` glob | `inertia-react §Vite Build Gotchas` |
| Next.js App Router | Server/Client component boundary mis-resolved by bundler split | Check `'use client'` placement, then `next.config.mjs` |
| Module Federation | Remote chunk hash mismatch after redeploy | Force remote re-fetch, check `shared` deps versions |
| Webpack 5 | `splitChunks.cacheGroups` overlap with `entry` | Same class of bug as Vite manualChunks |
| esbuild | Two CJS modules with same `module.exports.default` deduped | Set `format: 'esm'` or use named exports |

### Validators that catch the bug at build time

If a `scripts/check-vite-manifest.mjs` exists in the project (shipped by
`start-vibing-stacks` for PHP/Laravel projects), run it after every build:

```bash
node scripts/check-vite-manifest.mjs
```

It cross-references `laravel.input[]` against `import.meta.glob` patterns and
fails the build if any module appears in both — which is the Laravel/Inertia
specific shape of "Bundle, not Backend."

## Anti-Patterns

| Don't | Do |
|-------|-----|
| `var_dump` / `console.log` everywhere | Use proper debugger |
| Fix symptom, not cause | Trace to root cause |
| Skip writing test for fix | Always add regression test |
| Leave debug code in commit | Clean before commit |
| Debug the server when HTTP 200 + empty logs + wrong content | Triage as "Bundle, not Backend" — start from the chunk graph |
| Trust that `manualChunks` / `splitChunks` always honors your grouping | Bundlers silently drop groups when they collide with entry chunks |
| Move on after one `npm run build` succeeded | Run the manifest validator; bundlers don't warn on collision |
