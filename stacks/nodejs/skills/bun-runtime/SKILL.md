---
name: bun-runtime
version: 1.1.0
---

# Bun Runtime — Fast JavaScript Runtime

**ALWAYS invoke when using Bun for scripts, packages, bundling, or testing.**

## Deploy-Time Asymmetry (READ FIRST)

> Bun's local install is generous (installs ALL deps by default). Vercel /
> CI builds are strict (`NODE_ENV=production` → devDeps stripped). A
> `package.json#scripts.build` that calls `tsx`, `ts-node`, `vitest`,
> `eslint`, or `tsc` directly will work locally and fail at deploy with
> `sh: line 1: <tool>: command not found / Error: Command "npm run build"
> exited with 127`.

**Rule.** Anything invoked from `scripts.build` / `prebuild` /
`postinstall` / `prepare` must be either:

- in `dependencies` (not `devDependencies`)
- prefixed with `bunx` / `npx` (slower, fragile)
- a plain Node script: `node scripts/foo.mjs`

For one-off utilities the `.mjs` route is best — see
`nextjs-app-router` skill, section "Build Script Hygiene". The stack
ships `scripts/check-build-scripts.mjs` to catch this statically.

## Package Management

```bash
bun install               # Install deps (replaces npm install)
bun add zod               # Add dependency
bun add -D vitest         # Add dev dependency
bun remove lodash         # Remove
bun update                # Update all
```

## Scripts

```bash
bun run dev               # Run script from package.json
bun run build
bun --watch src/index.ts  # Watch mode
```

## TypeScript (native, no config needed)

```typescript
// Bun runs .ts files directly — no tsc/tsx needed
// bun src/index.ts

import { serve } from 'bun';

serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/api/health') {
      return Response.json({ status: 'ok' });
    }
    return new Response('Not Found', { status: 404 });
  },
});
```

## File I/O (Bun APIs)

```typescript
// Fast file operations
const content = await Bun.file('data.json').text();
const parsed = await Bun.file('data.json').json();
await Bun.write('output.txt', 'Hello');

// Glob
const glob = new Bun.Glob('**/*.ts');
for await (const file of glob.scan('.')) { console.log(file); }
```

## Testing (built-in)

```typescript
// *.test.ts — bun test
import { describe, it, expect } from 'bun:test';

describe('math', () => {
  it('adds', () => expect(1 + 1).toBe(2));
});
```

```bash
bun test                  # Run all tests
bun test --coverage       # With coverage
bun test --watch          # Watch mode
```

## Environment Variables

```typescript
// .env loaded automatically
const apiKey = Bun.env['API_KEY'];      // Bun.env (recommended)
const dbUrl = process.env['DATABASE_URL']; // Also works
```

## FORBIDDEN

1. **`node` command when `bun` works** — prefer bun for speed
2. **`npx` when `bunx` works** — `bunx` is faster
3. **Manual .env loading** — Bun loads `.env` automatically
4. **CommonJS `require()`** — use ESM `import`
