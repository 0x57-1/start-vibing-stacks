---
name: database-migrations
version: 1.0.0
description: Safe database migrations under load — backfills, concurrent indexes, lock timeouts, parallel-change pattern, rollback strategy. Invoke before writing or running any schema migration.
---

# Database Migrations — Safety Patterns

**ALWAYS invoke before writing or executing a schema migration on any environment with data.**

> A migration that locks the table for 90 seconds at 1k writes/sec creates a 90,000-request outage. The only safe migration is one that ships in pieces.

## The Cardinal Rule: Parallel Change

For any non-trivial schema change, deploy in **at least two releases**:

```
Release N   → expand:  add new column/table, dual-write, leave old
Release N+1 → migrate: backfill data
Release N+2 → contract: drop old, switch reads
```

Never combine expand + contract in one deploy. You will regret it the moment you need to roll back.

---

## 1. Adding a Column

### NOT NULL with default

PostgreSQL ≥ 11 / MySQL 8 / MariaDB 10.5+: `ADD COLUMN ... NOT NULL DEFAULT ...` is fast (metadata-only). On older versions or other engines, it rewrites the whole table.

**Safe pattern (works on any version):**
```sql
-- Step 1 (release N): nullable, no default → instant
ALTER TABLE users ADD COLUMN plan VARCHAR(20);

-- Step 2 (release N): app dual-writes — sets plan on every INSERT/UPDATE
-- Step 3 (release N+1): backfill in chunks (see §3)
-- Step 4 (release N+2): set NOT NULL + default
ALTER TABLE users ALTER COLUMN plan SET NOT NULL;
ALTER TABLE users ALTER COLUMN plan SET DEFAULT 'free';
```

### Generated columns
Prefer over backfilling derived data when possible — DB keeps it consistent.

---

## 2. Adding an Index

Indexes lock the table during build on most engines.

### PostgreSQL
```sql
-- WRONG — exclusive lock for the duration
CREATE INDEX idx_users_email ON users(email);

-- CORRECT — non-blocking
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
-- Caveats: cannot run inside a transaction; on failure leaves invalid index — drop with `DROP INDEX CONCURRENTLY`
```

### MySQL / MariaDB
InnoDB ≥ 5.6 supports `ALGORITHM=INPLACE, LOCK=NONE` for most index types:
```sql
ALTER TABLE users ADD INDEX idx_email (email), ALGORITHM=INPLACE, LOCK=NONE;
```

If `LOCK=NONE` fails, the engine tells you why (e.g. fulltext, spatial). Don't override — the lock is real.

### MongoDB
```js
db.users.createIndex({ email: 1 }, { background: true })   // 4.2 default; deprecated in 6+ where it's always non-blocking
```

### Tooling
- **Postgres**: `pg_repack` for table-rewrite migrations without long locks
- **MySQL**: `pt-online-schema-change` (Percona) or `gh-ost` (GitHub) — both work via shadow tables + triggers
- **Mongo**: rolling builds across replica set members

---

## 3. Backfilling — Chunked

Single `UPDATE` over millions of rows = long transaction = long lock = replication lag = page.

### SQL (chunked, app-driven)
```sql
-- pseudo: loop in app code
UPDATE users
SET plan = COALESCE(plan, 'free')
WHERE id BETWEEN :start AND :end
  AND plan IS NULL;
-- Sleep 50ms between batches; chunk size 1k–10k rows
```

### Laravel
```php
User::whereNull('plan')->chunkById(1000, function ($users) {
    foreach ($users as $user) {
        $user->update(['plan' => 'free']);
    }
    usleep(50_000);   // 50ms breathing room
});
```

### Mongoose
```ts
const cursor = User.find({ plan: { $exists: false } }).cursor();
for await (const user of cursor) {
  await User.updateOne({ _id: user._id }, { $set: { plan: 'free' } });
}
```

### Django
Use `RunPython` migration with `atomic=False` and chunk:
```python
class Migration(migrations.Migration):
    atomic = False
    operations = [migrations.RunPython(backfill, reverse_code=migrations.RunPython.noop)]

def backfill(apps, schema_editor):
    User = apps.get_model("app", "User")
    qs = User.objects.filter(plan__isnull=True).only("id")
    for batch in chunked(qs.iterator(), 1000):
        User.objects.filter(id__in=[u.id for u in batch]).update(plan="free")
```

---

## 4. Lock Timeouts (Critical)

Set a short timeout so a stuck migration fails fast instead of blocking the app:

```sql
-- Postgres
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '15s';
ALTER TABLE users ADD COLUMN x INT;

-- MySQL / MariaDB
SET SESSION lock_wait_timeout = 5;
SET SESSION innodb_lock_wait_timeout = 5;
```

Without this, an `ALTER` waiting for a long-running `SELECT` will block every subsequent write behind it (Postgres queue).

---

## 5. Renaming — Never Direct in Prod

Never `ALTER TABLE users RENAME COLUMN email TO email_address` in a single deploy. The old code on the previous release will break.

```
Release N:   add new column, dual-write
Release N+1: backfill, switch reads to new column
Release N+2: drop old column
```

Same for table renames, type changes (often disguised renames + casts), enum value removal.

---

## 6. Foreign Keys

Adding a FK validates every existing row. On large tables this locks.

### Postgres
```sql
-- Two-step
ALTER TABLE orders ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) NOT VALID;  -- fast
-- Validate when load is low; takes only SHARE UPDATE EXCLUSIVE lock
ALTER TABLE orders VALIDATE CONSTRAINT fk_user;
```

### MySQL — no equivalent; use offline tooling (`gh-ost`).

---

## 7. Dropping — Always Soft First

```
Release N:   stop writing to column (deploy)
Release N+1: stop reading from column (deploy)  ← observe metrics
Release N+2: drop column
```

Add a feature flag for the new code path so you can roll back without a schema change.

---

## 8. Migration Tooling Per Stack

| Stack | Tool | Notes |
|---|---|---|
| Node + SQL | Drizzle / Kysely / Knex / TypeORM | Drizzle is the modern choice; uses `meta` snapshots |
| Node + Mongo | Mongoose schema versioning | No DDL — but evolve with backfills |
| Python + SQL | Alembic (SQLAlchemy), Django migrations | |
| PHP | Laravel migrations + `doctrine/dbal` for DDL | |

Rules regardless of tool:
- Migration files are **append-only** once merged. Edit = rewrite history = production drift.
- Each migration has both `up` and `down` (or a documented "no rollback" reason).
- Migrations run idempotently (safe to re-run).
- Never include data migrations in schema migrations on huge tables — separate scripts.

---

## 9. Rollback Strategy

For every migration ask: **"How do I undo this in 5 minutes if prod breaks?"**

| Operation | Rollback |
|---|---|
| Add nullable column | `DROP COLUMN` (instant) |
| Add NOT NULL column with default | `DROP COLUMN` |
| Add index | `DROP INDEX [CONCURRENTLY]` |
| Rename column | None — that's why parallel change |
| Drop column | Restore from backup. **Don't.** |
| Backfill | Run inverse update OR accept the data is now correct |

If you can't write a 5-minute rollback, the migration is too risky for one release. Split it.

---

## 10. Pre-Deploy Checklist

- [ ] Migration runs in < 5s OR is concurrent / non-blocking
- [ ] Lock + statement timeouts set
- [ ] Tested on a copy of prod-sized data (or a representative subset)
- [ ] Backfills are chunked with breathing room
- [ ] No combined expand + contract in same deploy
- [ ] App code on previous release survives if migration runs first
- [ ] App code on next release survives if migration is delayed
- [ ] Rollback plan written (or "no rollback" justified)
- [ ] DBA / on-call notified for high-risk migrations

## FORBIDDEN

| Pattern | Reason |
|---|---|
| `ALTER TABLE` without lock timeout in prod | Single bad query = full outage |
| `CREATE INDEX` without `CONCURRENTLY` (Postgres) | Locks writes |
| Renaming a column in one deploy | Breaks rolling deploys |
| Single huge `UPDATE` | Replication lag, locks, redo bloat |
| Editing a merged migration file | Prod drift, dev/prod mismatch |
| Dropping a column without two prior soft-delete deploys | No rollback |
| Migrations running automatically on every deploy without gates | Surprise outage |
| Mixing schema and data migrations on hot tables | Single-tx behavior unpredictable |

## See Also

- `observability` — track migration duration and lag during runs
- `error-handling` — service-side feature flags for parallel change
- `ci-pipelines` — gate migrations behind manual approval for production
