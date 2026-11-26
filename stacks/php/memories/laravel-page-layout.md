---
name: laravel-page-layout
version: 1.1.0
description: PHP stack. A page is Inertia::render. Services and jobs share a
  domain folder. Heavy work is a job when a worker consumes that queue, and
  the same service still runs one bounded step when no worker is up.
---

# Laravel page layout

A page is `routes/web.php` → a thin controller → `Inertia::render('Area/Page', props)`.

- The query is `app/Services/<Domain>/`. One domain, one folder, the classes of that domain beside each other. A Service does not build HTML, a `<head>`, or an Inertia response.
- A job is `app/Jobs/<Domain>/`, the same domain name. The job calls the service. The query does not live in the job.
- Work that waits on a third party, a file, or a batch is a job. The job names a queue a worker on that host consumes. The name lives in one place, the same string the worker is started with. Dispatch after commit.
- When a worker is up, it runs the job. When the host has no queue worker, the request runs one bounded call of the same service, so the user is not left waiting on a queue nobody reads. When a worker is already running, that request path is a no-op (a lock, or the row is not stale).
- Input is `app/Http/Requests`.
- Shared props and the document head are `app/Http/Middleware/HandleInertiaRequests.php`.
- The React page is `resources/js/Pages`.
- A fixed table is `config/`.
- `routes/api.php` returns a Resource. It is not how a page loads.
- There is no `app/Data`. `app/Support` is not a drawer for page chrome, queries, or tables.

When the task touches `app/`, `routes/`, or `resources/js` on a PHP project, run:

```bash
node scripts/check-laravel-layout.mjs
```

If it prints findings, fix those files into this layout before the new feature. Keep the behavior. Do not add a parallel folder. Do not copy another repository's tree. Skill `laravel-patterns` is the standard. Skill `inertia-react` is the page contract.
