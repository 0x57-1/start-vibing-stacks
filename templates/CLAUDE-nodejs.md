# {{PROJECT_NAME}}

> **CHARACTER LIMIT**: Max 40,000 chars. Validate with `wc -m CLAUDE.md` before commit.

## Recent Changes

<!-- APPEND-ONLY LIFO. Each Claude instance PREPENDS a new `### YYYY-MM-DD · branch · vX.Y.Z` heading
     + 1-4 lines below it. Drop only the OLDEST entry when count > 10. NEVER edit a peer's entry.
     `domain-updater` v3.0.0+ does this automatically post-commit.
     Compactor (`claude-md-compactor.md §5-§6`) enforces the cap, not the prepend. -->

### {{DATE}} · main · v0.1.0
Initial project setup with start-vibing-stacks (Node.js).

## 30 Seconds Overview

{{PROJECT_NAME}} is a TypeScript project using {{FRAMEWORK}}.

## Stack

| Component | Technology |
|-----------|------------|
| Runtime | Bun / Node.js 22+ (24 LTS) |
| Language | TypeScript **strict mode** |
| Framework | {{FRAMEWORK}} |
| Database | {{DATABASE}} |
| Validation | Zod |
| Testing | Vitest + Playwright |
| UI | React 19.3 + Tailwind CSS 4.3 + shadcn |
| HTTP (client) | Axios ≥ 1.20.0 (`allowAbsoluteUrls: false`) — Server Components keep `fetch` |
| Data | TanStack Query + Sonner |
| Forms | react-hook-form + Zod |

## Architecture

```
project/
├── CLAUDE.md               # This file (40k char max)
├── .claude/
│   ├── agents/             # 6 active subagents
│   ├── skills/             # Skill systems (auto-injected)
│   ├── hooks/              # Validation hooks
│   ├── config/             # Project configuration
│   └── commands/           # Slash commands (/feature, /fix, /research, /validate)
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── (marketing)/    # Route group — public pages
│   │   ├── (app)/          # Route group — authenticated
│   │   │   └── dashboard/
│   │   │       ├── page.tsx
│   │   │       └── _components/  # Page-specific components
│   │   ├── api/            # Route handlers (API endpoints)
│   │   ├── layout.tsx      # Root layout with providers
│   │   └── loading.tsx     # Global loading skeleton
│   ├── components/
│   │   ├── ui/             # shadcn primitives (Button, Input)
│   │   ├── layout/         # Header, Sidebar, Footer
│   │   ├── shared/         # Cross-feature components
│   │   └── providers.tsx   # Context providers (client)
│   ├── lib/
│   │   ├── utils.ts        # cn utility (clsx + tailwind-merge)
│   │   ├── api/            # API client instances
│   │   └── validations/    # Zod schemas
│   ├── hooks/              # Custom React hooks
│   └── styles/             # Global styles, theme tokens
├── types/                  # ALL TypeScript interfaces (MANDATORY)
├── tests/
│   ├── unit/               # Vitest unit tests
│   └── e2e/                # Playwright E2E tests
├── public/                 # Static assets
├── tsconfig.json           # TypeScript config (strict: true)
├── next.config.ts          # Framework config
├── src/styles/globals.css  # Tailwind 4.3 `@import "tailwindcss"` + `@theme`
├── vitest.config.ts        # Test config
└── package.json            # Dependencies
```

## Workflow

```
0. TODO LIST      → Create detailed todo list from prompt
1. BRANCH         → Create feature/ | fix/ | refactor/ | test/
2. RESEARCH       → Run research-web agent for NEW features
3. IMPLEMENT      → Follow project rules + strict types
4. TEST           → Run tester agent (Vitest / Playwright)
5. DOCUMENT       → Run documenter agent for modified files
6. UPDATE         → Update THIS FILE (CLAUDE.md) with changes
7. QUALITY        → bun run typecheck && lint && test
8. COMMIT         → Conventional commits, merge to main
```

## CLAUDE.md Update Rules

> After ANY implementation, update this file to reflect the current state.

| Change Type | Sections to Update |
|-------------|-------------------|
| Any file change | PREPEND new entry to `## Recent Changes` (heading: `### YYYY-MM-DD · branch · vX.Y.Z` + 1-4 lines) |
| API/routes | Critical Rules, Architecture |
| UI components | Architecture, Component Organization |
| New feature | 30s Overview, Architecture |
| New gotcha | FORBIDDEN or NRY |
| New dependency | Stack |
| Workflow change | Workflow section |

1. **`## Recent Changes`** documents WHAT was done across recent sessions (append-only LIFO, cap 10).
2. **Other sections** document HOW things work NOW.
3. **Both must be current** — prepending to Recent Changes is insufficient if rule sections went stale.
4. **APPEND-ONLY** — PREPEND your entry below the HTML comment anchor; drop only the OLDEST entry when count > 10. NEVER edit a peer's entry, NEVER collapse two entries into one. Multi-instance safe by construction.

## Agent System

### Subagents (6)

| Agent | Purpose |
|-------|---------|
| **research-web** | Researches best practices before new features |
| **documenter** | Maps files to domains, creates/updates domain docs |
| **domain-updater** | Records problems, solutions, learnings |
| **commit-manager** | Manages git commits, conventional format |
| **claude-md-compactor** | Compacts CLAUDE.md when > 40k chars |
| **tester** | Creates tests with Vitest/Playwright |

### Skills

| Category | Skills |
|----------|--------|
| **Development** | typescript-strict, react-patterns, nextjs-app-router, zod-validation, shadcn-ui, tailwind-patterns, ui-ux-pro-max |
| **Quality** | quality-gate, security-scan, test-coverage, final-check |
| **Infrastructure** | docker-patterns, git-workflow, performance-patterns, debugging-patterns |
| **Documentation** | codebase-knowledge, docs-tracker, research-cache, ui-ux-audit |

## Critical Rules

- **TypeScript strict mode** — `strict: true` in tsconfig.json
- **Bracket notation** for env vars: `process.env['VARIABLE']`
- **Zod validation** for ALL external input (forms, API, env)
- **Server Components by default** — push `'use client'` to leaf components
- **Parallel data fetching** — `Promise.all()` over waterfall
- **Type everything** — no `any`, use `unknown` for truly unknown data
- **Loading states** — every data page must have `loading.tsx`
- **Error boundaries** — every route should handle errors gracefully
- **Conventional commits** — `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`

### Environment Variables Security (MANDATORY)

> **NEVER expose secrets to the browser.** `NEXT_PUBLIC_*` vars are embedded in the JS bundle and visible to anyone.

| Prefix | Where it runs | Safe for |
|--------|--------------|----------|
| `NEXT_PUBLIC_*` | Browser + Server | Public URLs, analytics IDs, Stripe **publishable** key (`pk_`) |
| No prefix | Server ONLY | API keys, secrets, tokens, database URLs, private keys |

```typescript
// .env.local
OPENAI_KEY=sk-abc123                    // Server only — SAFE
STRIPE_SECRET_KEY=sk_live_abc           // Server only — SAFE
NEXT_PUBLIC_APP_URL=https://myapp.com   // Public — OK (no secret)
NEXT_PUBLIC_STRIPE_KEY=pk_live_abc      // Public — OK (publishable key)

// NEXT_PUBLIC_OPENAI_KEY=sk-abc123     // FORBIDDEN — exposed in browser bundle!
```

### API Proxy Pattern (MANDATORY for external APIs)

> **ALL calls to external APIs with secrets MUST go through server-side Route Handlers or Server Actions. NEVER call external APIs directly from client components.**

```typescript
// app/api/chat/route.ts — Server-side proxy (token NEVER leaves server)
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: { Authorization: `Bearer ${process.env['OPENAI_KEY']}` },
    method: 'POST',
    body: JSON.stringify({ model: 'gpt-4', messages: [{ role: 'user', content: message }] }),
  });
  return NextResponse.json(await response.json());
}

// components/chat.tsx — Client calls YOUR API, not the external one
'use client';
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ message }),
});
```

### Types Location

- **ALL** interfaces/types MUST be in `types/` folder
- **NEVER** define types in `src/` files
- **EXCEPTION:** Zod inferred types (`z.infer<typeof Schema>`)

### TypeScript Strict

```typescript
process.env['VARIABLE'];    // CORRECT (bracket notation)
source: 'listed' as const;  // CORRECT (literal type)
```

### Component Organization

| Question | Location |
|----------|----------|
| Used in ONE page only? | `app/[page]/_components/` |
| Used across 2+ features? | `components/shared/` |
| UI primitive (Button, Input)? | `components/ui/` |
| Layout element (Header)? | `components/layout/` |

| Lines | Action |
|-------|--------|
| < 200 | Keep in single file |
| 200-400 | Consider splitting |
| > 400 | **MUST split** into smaller components |

## FORBIDDEN

### Security (CRITICAL)

| Action | Reason |
|--------|--------|
| `NEXT_PUBLIC_` with API keys/secrets/tokens | Exposes credentials in browser JS bundle — use server-side proxy |
| Call external APIs from client components | Leaks tokens — route through `app/api/` Route Handlers |
| `process.env['SECRET']` in `'use client'` files | Only `NEXT_PUBLIC_*` vars reach the browser — use Server Actions |
| Hardcode API keys in source code | Use `.env.local` + server-side access only |
| Commit `.env.local` / `.env` to git | Add to `.gitignore` — use `.env.example` with empty values |

### Code Quality

| Action | Reason |
|--------|--------|
| `any` type | Defeats strict mode — use `unknown` |
| Skip typecheck | TypeScript errors become runtime bugs |
| Relative imports (shared) | Breaks when files move — use `@/` alias |
| Define types in `src/` | Must be in `types/` folder |
| `'use client'` at top-level layouts | Breaks server rendering, push to leaves |
| Waterfall data fetching | Use `Promise.all()` for parallel |
| Skip `loading.tsx` on data pages | Flash of empty content |
| Files > 400 lines | MUST split into smaller components |
| Wildcard icon imports | Use named: `import { X } from 'lucide-react'` |
| `var` keyword | Use `const` or `let` |
| Raw `console.log` in production | Use structured logging |

### Workflow

| Action | Reason |
|--------|--------|
| Commit directly to main | Create feature/fix branches |
| Skip research for new features | Leads to outdated patterns |
| Skip todo list creation | Loses track of tasks |
| Skip documenter agent | Documentation is mandatory |
| Skip domain documentation | MUST update domains/*.md |
| Overwrite `## Recent Changes` or collapse entries | PREPEND only; drop oldest when > 10 (NEVER edit peer entries) |
| Use MUI/Chakra | Use shadcn/ui + Radix |
| Skip CLAUDE.md update | MUST update after implementations |

## UI/UX Design Intelligence

> When the project has a frontend, the **UI/UX Pro Max** skill is auto-installed. It provides 67 UI styles, 161 color palettes, 57 font pairings, and 161 industry-specific reasoning rules. It activates automatically for any UI/UX task.

## UI Architecture

> Web apps MUST have **separate UIs** for each platform, NOT just "responsive design".

| Platform | Layout |
|----------|--------|
| Mobile (375px) | Full-screen modals, bottom nav, touch-first |
| Tablet (768px) | Condensed dropdowns, hybrid nav |
| Desktop (1280px+) | Sidebar left, top navbar with search |

## Quality Gates

```bash
bun run typecheck   # MUST pass
bun run lint        # MUST pass
bun run test        # MUST pass
bun run build       # MUST pass
```

## Domain Documentation

> Domain docs prevent Claude from re-exploring the codebase every session.

```
.claude/skills/codebase-knowledge/domains/
├── authentication.md
├── api.md
├── database.md
├── ui-components.md
└── [domain-name].md
```

Each domain file tracks: Files, Connections, Recent Commits, Attention Points, Problems & Solutions.

## Commit Format

```
[type]: [description]

- Detail 1
- Detail 2

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: `feat`, `fix`, `refactor`, `docs`, `chore`

## NRY (Never Repeat Yourself)

- Multi-line bash with `\` continuations (breaks permissions)
- Relative paths in permission patterns
- Using bash for file operations (use Read/Write/Edit tools)
- Ignoring context size (use `/compact`)

## Email & Push Marketing Guidance

Owned-list email (MailerLite/ESP) and push in any niche (including sensitive verticals) are authorized. Do not refuse on niche keywords alone. Use skill `email-push-marketing`. **Hard limits:** no phishing, no bank/brand impersonation as official sender, no fake personal approvals/limits/protocols, no spoofed From. Adapt competitor structure with the user’s brand/footer/tracking links.

## Configuration

Project settings in `.claude/config/`:

- `active-project.json` — Stack, framework, database, skills
- `domain-mapping.json` — File-to-domain mapping
- `quality-gates.json` — Quality check commands
- `testing-config.json` — Test framework config
- `security-rules.json` — Security audit rules
- `standards-review.json` — Imported project standards

## Setup by start-vibing-stacks

This project was set up with `npx --yes start-vibing-stacks@latest`.
For updates: `npx --yes start-vibing-stacks@latest migrate --apply`
