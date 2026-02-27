# tRPC API — End-to-End Type Safety

**ALWAYS invoke when building type-safe API routes with tRPC.**

## Structure

```
server/
├── trpc.ts              # tRPC init + context
├── routers/
│   ├── _app.ts          # Root router (merges all)
│   ├── user.router.ts
│   └── post.router.ts
└── middleware/
    └── auth.ts          # Auth middleware
```

## Setup

```typescript
// server/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, user: ctx.session.user } });
});
```

## Router Pattern

```typescript
// server/routers/user.router.ts
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({ where: { id: ctx.user.id } });
  }),

  update: protectedProcedure
    .input(z.object({ name: z.string().min(2) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.user.id },
        data: input,
      });
    }),

  list: protectedProcedure
    .input(z.object({ page: z.number().min(1).default(1), limit: z.number().max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      const { page, limit } = input;
      return ctx.db.user.findMany({ skip: (page - 1) * limit, take: limit });
    }),
});
```

## Client Usage (React)

```tsx
import { trpc } from '@/utils/trpc';

function Profile() {
  const { data: user, isLoading } = trpc.user.me.useQuery();
  const updateMutation = trpc.user.update.useMutation({
    onSuccess: () => utils.user.me.invalidate(),
  });

  if (isLoading) return <Skeleton />;
  return <div>{user?.name}</div>;
}
```

## FORBIDDEN

1. **REST endpoints when tRPC covers it** — use tRPC procedures
2. **Unvalidated input** — always use Zod `.input()`
3. **Public procedures for auth-required data** — use `protectedProcedure`
4. **Direct DB access in client** — always through tRPC procedures
