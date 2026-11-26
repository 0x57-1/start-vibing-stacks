---
name: laravel-page-layout
version: 1.0.0
description: PHP stack. A page is Inertia::render. A Laravel tree that arrived
  from outside this package is corrected into that layout before a new feature.
---

# Laravel page layout

A page is `routes/web.php` → a thin controller → `Inertia::render('Area/Page', props)`.

- The query is `app/Services/<Domain>Service.php`. A Service does not build HTML, a `<head>`, or an Inertia response.
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
