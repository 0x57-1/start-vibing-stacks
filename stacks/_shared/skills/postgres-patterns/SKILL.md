---
name: postgres-patterns
version: 1.0.0
description: PostgreSQL design, security, and tuning at the SQL/operations layer — role separation, Row-Level Security (RLS), connection security, JSONB, partitioning, indexing strategy (BTREE/GIN/BRIN/partial/expression), EXPLAIN ANALYZE, isolation levels, locking, advisory locks, connection pool sizing. Stack-agnostic. Invoke when designing Postgres schemas, hardening database access, or debugging Postgres query performance. Complements per-stack ORM skills (Drizzle, SQLAlchemy, Eloquent, Mongoose) and the database-migrations skill.
---

# PostgreSQL — Design, Security, and Tuning

**Invoke when designing a Postgres schema, granting database access, picking an index, debugging a slow query, or hardening prod connection settings.**

> Postgres is the same on every stack. The application code differs. This skill covers the database side — what to ask of it, how to lock it down, and how to read its performance signals. For schema **deployment** (concurrent indexes, lock timeouts, backfills, parallel change), see `database-migrations`.

This skill assumes Postgres ≥ 15 (14 still supported but missing some features called out below). PG 16/17 add more — flagged where relevant.

---

## 1. Connection Security (do this on day 1)

### TLS — non-negotiable in production

```
# Connection string
postgresql://app_user:****@db.example.com:5432/app_db?sslmode=verify-full&sslrootcert=/etc/ssl/certs/postgres-ca.pem
```

| `sslmode` | Use |
|---|---|
| `disable` | Local dev only |
| `require` | Encryption only — does NOT verify cert (vulnerable to MITM) |
| `verify-ca` | Verifies cert is signed by trusted CA |
| `verify-full` | + verifies hostname matches cert. **Production minimum.** |

Server: set `ssl = on` and require TLS in `pg_hba.conf` with `hostssl` lines (not `host`). Reject plaintext.

### Credentials in env, never in code

Connection strings live in environment variables (`DATABASE_URL`), never in source. See `secrets-management`.

Connection strings should not appear in:
- application logs (mask before logging)
- error messages returned to clients
- crash dumps / Sentry breadcrumbs

---

## 2. Role Separation (least privilege)

**Never** connect the application as a `SUPERUSER` or as the database owner. Three roles minimum:

```sql
-- Owner: created tables. Used only by migrations.
CREATE ROLE app_owner LOGIN PASSWORD '...';

-- Application: runtime. SELECT/INSERT/UPDATE/DELETE on data tables, no DDL.
CREATE ROLE app_runtime LOGIN PASSWORD '...';

-- Read-only: analytics, BI, on-call investigation.
CREATE ROLE app_readonly LOGIN PASSWORD '...';

-- Schema, owned by the migration role
CREATE SCHEMA app AUTHORIZATION app_owner;
ALTER ROLE app_owner SET search_path = app, public;

-- Grants
GRANT USAGE ON SCHEMA app TO app_runtime, app_readonly;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO app_runtime;
GRANT SELECT ON ALL TABLES IN SCHEMA app TO app_readonly;

-- Apply to future tables (created by migrations)
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA app
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA app
  GRANT SELECT ON TABLES TO app_readonly;
```

Outcomes:
- An RCE in the app cannot `DROP TABLE` (no DDL grant)
- A leaked read-only credential cannot mutate
- Migrations get their own audit trail

**Lock down `public`:** remove the default `CREATE` privilege on the `public` schema (PG 15 already revokes it for non-owners — verify with `\dn+`). Untrusted users with table-creation rights in `public` enable function-search-path attacks.

---

## 3. Row-Level Security (RLS) — multi-tenant default

For any multi-tenant or per-user data, enable RLS so even a buggy `WHERE` clause can't leak across tenants.

```sql
-- Schema
CREATE TABLE app.documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  owner_id    uuid NOT NULL,
  title       text NOT NULL,
  body        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON app.documents (tenant_id, created_at DESC);

-- Enable RLS
ALTER TABLE app.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.documents FORCE ROW LEVEL SECURITY;  -- applies to table owner too

-- App-level policy: tenant set per session
CREATE POLICY tenant_isolation ON app.documents
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- App connects, then SETs the tenant from session-trusted context (JWT, cookie):
SET LOCAL app.tenant_id = '01HZ...';
SELECT * FROM app.documents;   -- automatically filtered
```

**Critical:** the `SET LOCAL` value comes from your **server-side authn**, never from a request header you didn't validate. RLS is enforced by the database; the trust boundary is whoever owns the connection setting.

With PgBouncer transaction pooling, use `SET LOCAL` (transaction-scoped), never `SET` (session-scoped — leaks to next pooled user).

---

## 4. Schema Design

### IDs

| Choice | When |
|---|---|
| `bigserial` / `bigint generated always as identity` | Internal, single-region; fastest |
| `uuid` (v4 random) | Distributed, public IDs; trades index locality for non-guessability |
| **`uuid` v7** (RFC 9562) | **2025 best practice** — time-ordered UUIDs; preserve insert locality + non-guessability |

Postgres 18 ships native `uuidv7()`. On older versions, use the `pg_uuidv7` extension or generate in app code (Drizzle's `uuid().defaultRandom()`, Python's `uuid_utils`).

Avoid `serial`/`integer` IDs for anything in URLs (4-byte counter exhausts at 2.1B; no privacy).

### Timestamps

```sql
created_at timestamptz NOT NULL DEFAULT now(),
updated_at timestamptz NOT NULL DEFAULT now()
```

`timestamptz` (= `timestamp with time zone`) — always. It stores UTC; the "with time zone" is misleading. `timestamp` (without) is a foot-gun: no offset info, time-zone-conversion bugs at every boundary.

### Constraints — push correctness into the DB

```sql
CREATE TABLE app.orders (
  id          uuid PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES app.users(id) ON DELETE RESTRICT,
  status      text NOT NULL,
  total_cents bigint NOT NULL,
  currency    text NOT NULL DEFAULT 'USD',
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_status CHECK (status IN ('pending','paid','shipped','cancelled')),
  CONSTRAINT chk_total_positive CHECK (total_cents > 0),
  CONSTRAINT chk_currency CHECK (currency ~ '^[A-Z]{3}$')
);
```

CHECK constraints catch bad data the application failed to. They cost almost nothing on insert.

### Money

**Always** integer cents (`bigint`) or `numeric(precision, scale)`. **Never** `float`/`double` for money — IEEE 754 rounding errors compound.

### Enums vs lookup tables

- **Postgres `ENUM`**: cheaper, rigid (adding values is `ALTER TYPE`, ordering matters)
- **Lookup table** (`status_codes (code text PK, label text)` + FK): flexible, joins required

Lookup tables age better for any value users might reorder/rename/translate.

### JSONB — when to use it

Use `jsonb` (not `json`) when:
- Truly heterogeneous attributes per row (settings blobs, audit details, integration payloads)
- Sparse fields where >80% of rows wouldn't have them
- External payloads stored as-is (Stripe events, webhook bodies)

**Don't** use JSONB for:
- Fields you'll filter or order on regularly (worse than indexed columns)
- Anything with a stable shape (use real columns + CHECK)
- Multi-row data (use a child table)

```sql
-- Indexing JSONB
CREATE INDEX ON app.events USING GIN (payload jsonb_path_ops);     -- good for @>, ?
CREATE INDEX ON app.events ((payload->>'user_id'));                -- expression index for one path
```

### Generated columns

```sql
CREATE TABLE app.users (
  id    uuid PRIMARY KEY,
  email citext NOT NULL UNIQUE,
  search_tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', email)) STORED
);
CREATE INDEX ON app.users USING GIN (search_tsv);
```

The DB keeps it consistent. Saves an UPDATE trigger or app-side maintenance.

---

## 5. Indexing Strategy

### Index types — choose by workload

| Type | Use For |
|---|---|
| **BTREE** (default) | Equality, range, ORDER BY |
| **GIN** | `@>`, `?`, `?|`, `?&` on JSONB; full-text search; arrays |
| **GIST** | Geometry (PostGIS), exclusion constraints, range types |
| **BRIN** | Huge append-only tables (events, logs) ordered by insertion time. Tiny index, range-scan focus |
| **HASH** | Equality only on large keys; rare — BTREE usually wins |

### Partial indexes — index only what you query

```sql
-- 90% of rows are status='inactive' — don't index them
CREATE INDEX idx_active_users_email ON app.users (email) WHERE status = 'active';

-- Soft-delete pattern
CREATE INDEX idx_orders_user ON app.orders (user_id) WHERE deleted_at IS NULL;
```

Partial indexes are smaller, faster to maintain, and the planner uses them when the query's `WHERE` matches.

### Expression indexes — index computed values

```sql
-- Case-insensitive email lookup without citext
CREATE UNIQUE INDEX idx_users_email_lower ON app.users (lower(email));
SELECT * FROM app.users WHERE lower(email) = lower($1);
```

### Composite ordering matters

```sql
-- Used by:  WHERE tenant_id=? ORDER BY created_at DESC
CREATE INDEX ON app.documents (tenant_id, created_at DESC);

-- DOES NOT serve:  WHERE created_at >= ?  (leftmost prefix rule)
```

Leftmost prefix rule: a composite index `(a, b, c)` serves queries on `(a)`, `(a, b)`, `(a, b, c)` — never on `(b)` alone.

### Unique constraints

```sql
-- One active subscription per user (partial UNIQUE)
CREATE UNIQUE INDEX one_active_sub_per_user
  ON app.subscriptions (user_id) WHERE status = 'active';
```

---

## 6. Reading Performance — `EXPLAIN ANALYZE`

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT)
SELECT u.id, count(o.id)
FROM app.users u
LEFT JOIN app.orders o ON o.user_id = u.id
WHERE u.created_at > now() - interval '7 days'
GROUP BY u.id;
```

What to look for:

| Signal | Meaning |
|---|---|
| `Seq Scan` on a big table | Missing or unusable index; or planner thinks scan is cheaper |
| `rows=10000 vs actual rows=10` | Planner stats are stale → `ANALYZE table_name` |
| `Buffers: shared read=...` huge | Cold cache or genuinely large scan |
| `Sort Method: external merge Disk: ...kB` | `work_mem` too small; bumps to disk |
| `Rows Removed by Filter: 99000` | Index is wrong shape; fetching too much |
| `Heap Fetches: 100000` | Index-only scan turned into heap fetch — visibility map stale, run `VACUUM` |

Always test with `ANALYZE` (real execution); plain `EXPLAIN` shows estimated plan, not actuals.

`pg_stat_statements` extension: enable in production. Sort by `total_exec_time DESC` to find the queries actually consuming the database.

---

## 7. Transactions and Locking

### Isolation levels

| Level | Postgres default | Phenomena prevented |
|---|---|---|
| `READ COMMITTED` | yes (default) | Dirty reads |
| `REPEATABLE READ` | | + non-repeatable reads, phantom reads |
| `SERIALIZABLE` | | + write skew (Serializable Snapshot Isolation) |

`SERIALIZABLE` is the safest and well-implemented in Postgres (SSI). The cost is occasional `40001` serialization-failure errors — your application **must** retry them. Worth it for financial/balance logic.

### Locking selects

```sql
-- Block other transactions from updating this row
SELECT * FROM app.invoices WHERE id = $1 FOR UPDATE;

-- Wait at most 5 seconds for the lock
SET LOCAL lock_timeout = '5s';
SELECT * FROM app.invoices WHERE id = $1 FOR UPDATE;

-- Job queue pattern: pick + lock + skip already-locked
SELECT * FROM app.jobs
WHERE status = 'pending'
ORDER BY priority, created_at
LIMIT 1
FOR UPDATE SKIP LOCKED;
```

`FOR UPDATE SKIP LOCKED` is the classic correct way to build a worker queue on top of Postgres. No external broker needed for many use cases.

### Advisory locks — coordinate without rows

```sql
-- App-level mutex, e.g. "only one cron at a time"
SELECT pg_try_advisory_lock(42);   -- returns true if got it
-- ... do work ...
SELECT pg_advisory_unlock(42);
```

Survives across rows; cheap. Useful for cross-instance leadership without Redis.

### Idempotent upsert

```sql
INSERT INTO app.users (id, email, name)
VALUES ($1, $2, $3)
ON CONFLICT (email) DO UPDATE
  SET name = EXCLUDED.name,
      updated_at = now()
RETURNING *;
```

Atomic. Use this everywhere you'd otherwise SELECT-then-INSERT.

---

## 8. Connection Pooling

Postgres connections are heavyweight (each fork = ~10MB + planner state). Pool, but understand the modes.

| Tool | Modes |
|---|---|
| **PgBouncer** | session, transaction, statement |
| **Pgpool-II** | similar; also load-balancing |
| In-app pool (drizzle/pg-pool, SQLAlchemy, etc.) | session |

### Sizing

```
total_pool_size ≈ (cores * 2) + spindle_count
```

Real-world starting point per Postgres instance: 50–200. **Never** size your app pool * replica count > server `max_connections` — you'll get `too many clients already` outages.

Run multiple app instances? Use PgBouncer. Each app's local pool = ~5–10 connections to PgBouncer; PgBouncer multiplexes onto fewer real connections.

### PgBouncer transaction-mode caveats

In transaction-pooling mode, a single backend connection serves many clients across transactions. Things that break:

| Feature | Why it breaks | Workaround |
|---|---|---|
| `SET` (session-scope) | Leaks to next user | Use `SET LOCAL` inside a tx |
| Prepared statements (server-side) | Cached on the wrong backend | `pgbouncer.ini`: `max_prepared_statements`; PG ≥ 16 + PgBouncer ≥ 1.21 supports protocol-level prepared in transaction mode |
| `LISTEN`/`NOTIFY` | Notification listeners survive across pooling | Use a dedicated connection outside PgBouncer |
| Temporary tables | Live for the connection, not your transaction | Don't, or use `ON COMMIT DROP` |
| Advisory **session** locks | Leak | Use `pg_advisory_xact_lock` (transaction-scoped) |

If your stack uses a lot of session state, run PgBouncer in **session** mode and accept fewer connection-multiplexing wins, or rely on the in-app pool only.

---

## 9. Timeouts (set everywhere)

In every connection or session:

```sql
SET statement_timeout      = '15s';   -- kill any single statement past 15s
SET lock_timeout           = '5s';    -- kill any wait-on-lock past 5s
SET idle_in_transaction_session_timeout = '60s';   -- kill stuck transactions
```

Without these, one slow query holding a lock cascades into a database-wide stall. Set per-role defaults so nobody forgets:

```sql
ALTER ROLE app_runtime SET statement_timeout = '15s';
ALTER ROLE app_runtime SET lock_timeout = '5s';
ALTER ROLE app_runtime SET idle_in_transaction_session_timeout = '60s';
```

Migrations need different timeouts (longer; less concurrent traffic). Set them in the migration role only.

---

## 10. Maintenance

### Autovacuum — leave it on, tune for hot tables

Autovacuum is enabled by default and good. But hot-write tables (`>10k upserts/min`) often need:

```sql
ALTER TABLE app.events SET (
  autovacuum_vacuum_scale_factor = 0.05,   -- vacuum at 5% dead tuples (default 20%)
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_cost_limit = 1000      -- vacuum more aggressively
);
```

Without this, dead tuples accumulate, indexes bloat, planner stats stale, queries slow.

### `VACUUM ANALYZE` after large data change

After a big migration, backfill, or import, run `VACUUM ANALYZE table_name;` so the planner re-stats the table.

### Bloat monitoring

`pgstattuple` extension or `pg_repack` to repack tables online without taking write locks. See `database-migrations` §8.

---

## 11. Encryption at Rest (column-level)

For specific PII fields, use `pgcrypto`:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Symmetric: stores ciphertext in column; key stays in app
INSERT INTO app.kyc_documents (user_id, ssn_enc)
VALUES ($1, pgp_sym_encrypt($2, current_setting('app.encryption_key')));

SELECT pgp_sym_decrypt(ssn_enc, current_setting('app.encryption_key'))
FROM app.kyc_documents WHERE user_id = $1;
```

Disk-level encryption (LUKS, EBS, RDS-default) protects against backup theft and disposal. Column encryption protects against DB-admin access and SQL injection. They are **not** substitutes — use both for sensitive PII.

For audit trails, prefer storage in a separate, write-only-by-app schema with `app_runtime` having only `INSERT` (not `UPDATE`/`DELETE`).

---

## 12. SQL Injection — Postgres specifics

Generic SQL injection defense lives in `security-baseline` §A03. Postgres-specific gotchas:

| Gotcha | Defense |
|---|---|
| String concat in dynamic SQL (`EXECUTE 'SELECT ' || user_input`) | Use `EXECUTE ... USING ($1, $2)` with bindings — even in `plpgsql` |
| `quote_ident()` / `quote_literal()` | Use **only** when truly building dynamic identifiers; never for user data |
| `search_path` hijacking — function calls resolve via search_path | Schema-qualify everywhere in functions: `SELECT app.users.id`; set `SET search_path = pg_catalog, app` at function definition |
| `LIKE` patterns | Escape `%` and `_` in user input: `replace(replace(input, '%', '\\%'), '_', '\\_')` then bind |
| ORM "raw" escape hatches | Audit every call site; treat as guilty until proven safe |

---

## 13. Backups

| Tool | Use |
|---|---|
| `pg_basebackup` + WAL archiving | Point-in-time recovery (PITR), production standard |
| `pg_dump --format=custom` | Logical, portable across versions; use for schema migration / small DBs |
| Cloud provider (RDS, Cloud SQL, Neon, Supabase) snapshots | Convenient, verify retention/region |

Three rules:
1. **Test restores monthly.** A backup nobody has restored is not a backup.
2. **Store off-region.** A region failure that takes the DB also takes co-located backups.
3. **Encrypt and rotate** the backup encryption keys; treat them as production secrets.

---

## 14. Pre-Deploy Checklist

- [ ] App connects as a non-superuser role with only the privileges it needs
- [ ] `sslmode=verify-full` against a known CA
- [ ] `statement_timeout`, `lock_timeout`, `idle_in_transaction_session_timeout` set per role
- [ ] RLS enabled on every multi-tenant table; `FORCE ROW LEVEL SECURITY` on
- [ ] Multi-tenant policies tested with a non-bypass role
- [ ] PgBouncer mode matches what the ORM/driver expects (transaction vs session)
- [ ] Autovacuum tuned for known hot tables
- [ ] `pg_stat_statements` enabled with retention configured
- [ ] Backup + restore drill within last 30 days
- [ ] Slow-query log threshold set (`log_min_duration_statement = '500ms'`)

---

## FORBIDDEN

| Pattern | Reason |
|---|---|
| App connects as `postgres` superuser | RCE = `DROP DATABASE`; no audit boundary |
| `sslmode=require` (no `verify-full`) | MITM-vulnerable |
| Multi-tenant table without RLS | One bad WHERE → cross-tenant leak |
| Tenant ID derived from request header app didn't authenticate | RLS becomes attacker-controlled |
| `float`/`double precision` for money | Rounding errors |
| `timestamp` (no time zone) for events | DST/UTC bugs |
| Sequential `serial` IDs in public URLs | Enumeration; existence leaks |
| Connection pool sized > server `max_connections` | Outage on traffic spike |
| `SET` (session) on PgBouncer transaction-mode | Leaks to next pooled user |
| No `statement_timeout` | One runaway query can stall the cluster |
| String concat for dynamic SQL in `plpgsql` functions | SQL injection inside the database |
| Column encryption keys in the same DB / same secret | Defeats the purpose |
| Untested backups | Not backups |

---

## See Also

- `database-migrations` — safe DDL: concurrent indexes, parallel-change pattern, lock-aware migrations
- `security-baseline` — A01 (authz), A03 (SQL injection generic), A09 (audit logging)
- `secrets-management` — DATABASE_URL hygiene, key rotation
- `observability` — slow-query log shipping, `pg_stat_statements` to APM
- `performance-patterns` — generic perf: caching, N+1, response compression
- per-stack ORM skill — Drizzle (Node), SQLAlchemy/asyncpg (Python), Eloquent (PHP), Mongoose (only if you accidentally added Postgres to a Mongo project — don't)
