# Bun Runtime — Fast JavaScript Runtime

**ALWAYS invoke when using Bun for scripts, packages, bundling, or testing.**

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
