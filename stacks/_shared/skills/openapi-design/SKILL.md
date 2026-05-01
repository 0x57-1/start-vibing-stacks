---
name: openapi-design
version: 1.0.0
description: OpenAPI 3.1 spec design — resource naming, status codes, problem+json (RFC 9457) errors, pagination, versioning, security schemes, idempotency, deprecation. Stack-agnostic. Invoke when designing or documenting any HTTP/REST API that publishes an OpenAPI spec, regardless of framework (Fastify, Hono, FastAPI, Laravel, Express, etc.).
---

# OpenAPI Design — Universal API Contract

**Invoke before adding a new endpoint, before publishing a public API, and during code review of any route handler.**

> The OpenAPI document is the contract. Code that drifts from it lies to clients. Generate the spec from code (Zod / Pydantic / DTO classes) — never write it by hand for a real service.

This skill covers **what the spec should look like**. For **how to generate it** in your stack, see the per-framework skill (`fastify-api`, `hono-api`, `fastapi-patterns`, `laravel-patterns`, etc.).

---

## 1. Resource Naming

| Rule | Good | Bad |
|---|---|---|
| Plural nouns | `/users`, `/orders` | `/user`, `/getUser` |
| No verbs in path | `POST /users` | `/createUser` |
| Kebab-case multi-word | `/payment-methods` | `/paymentMethods`, `/payment_methods` |
| Hierarchy via path | `/users/{id}/orders` | `/orders?userId=...` (only for filters) |
| Verbs only for actions | `POST /orders/{id}/cancel` | `PATCH /orders/{id}` with `action=cancel` |

The action sub-resource pattern (`/orders/{id}/cancel`) is the escape hatch when an operation is not a clean CRUD on a resource. Use sparingly.

---

## 2. HTTP Status Codes

| Code | Use For | Body |
|---|---|---|
| `200 OK` | Successful GET / PUT / PATCH | Resource representation |
| `201 Created` | Successful POST that creates | New resource + `Location` header |
| `202 Accepted` | Async work queued | Job ID + status URL |
| `204 No Content` | DELETE, or PUT/PATCH with no body | Empty |
| `400 Bad Request` | Malformed request | problem+json |
| `401 Unauthorized` | Missing / invalid credentials | problem+json + `WWW-Authenticate` header |
| `403 Forbidden` | Authenticated but not allowed | problem+json |
| `404 Not Found` | Resource not found OR not visible to caller | problem+json |
| `409 Conflict` | Version conflict, duplicate key, state mismatch | problem+json |
| `410 Gone` | Resource permanently removed | problem+json |
| `422 Unprocessable Entity` | Body parses but fails business validation | problem+json with field errors |
| `429 Too Many Requests` | Rate limited | problem+json + `Retry-After` |
| `5xx` | Server fault | problem+json (no internals) |

**Never** return `200` with `{ "success": false, "error": ... }`. That breaks every reverse proxy, CDN cache, and HTTP client retry policy. Use the right code.

`401` vs `403`: 401 = "I don't know who you are". 403 = "I know who you are and you can't do this". Resources you don't want to leak the existence of: return `404` even if authenticated (with a security review note in the spec).

---

## 3. Error Envelope — `application/problem+json` (RFC 9457)

One shape for every error response in the entire API. Codegen clients can match a single discriminator.

```json
{
  "type": "https://api.example.com/problems/validation-error",
  "title": "Validation failed",
  "status": 422,
  "detail": "The request body did not pass schema validation.",
  "instance": "/orders/01HZ.../validate",
  "errors": [
    { "field": "email", "code": "invalid_format", "message": "Must be a valid email." },
    { "field": "items[0].quantity", "code": "out_of_range", "message": "Must be ≥ 1." }
  ],
  "trace_id": "0af7651916cd43dd8448eb211c80319c"
}
```

| Field | Source | Notes |
|---|---|---|
| `type` | RFC | URI identifying the error class. Stable across versions; humans can read at the URL |
| `title` | RFC | Short, human, generic per `type` |
| `status` | RFC | Mirrors HTTP status — useful when only the body is logged |
| `detail` | RFC | Specific to **this occurrence**; safe to show to the user |
| `instance` | RFC | URI/path of the failing operation |
| `errors[]` | extension | Field-level validation errors (422 only) |
| `trace_id` | extension | Correlate with logs / observability |

**Never** put stack traces, raw SQL, file paths, or PII (email, name) in `detail`. Log those server-side, hand the user the `trace_id`.

OpenAPI declaration of the schema (reuse via `$ref` everywhere):

```yaml
components:
  schemas:
    Problem:
      type: object
      required: [type, title, status]
      properties:
        type: { type: string, format: uri }
        title: { type: string }
        status: { type: integer, minimum: 100, maximum: 599 }
        detail: { type: string }
        instance: { type: string, format: uri-reference }
        trace_id: { type: string }
    ValidationProblem:
      allOf:
        - $ref: '#/components/schemas/Problem'
        - type: object
          properties:
            errors:
              type: array
              items:
                type: object
                required: [field, code, message]
                properties:
                  field: { type: string }
                  code: { type: string }
                  message: { type: string }
```

---

## 4. Pagination

Pick **one** strategy per endpoint and document it. Mixing breaks clients.

### Cursor-based (preferred for large/realtime sets)

```http
GET /events?limit=50&cursor=eyJpZCI6IjAxSFoifQ
```
```json
{
  "data": [ ... ],
  "next_cursor": "eyJpZCI6IjAxSFAifQ",
  "has_more": true
}
```

Pros: stable under writes (no skipped/duplicated rows when items are inserted), unbounded depth. Cons: no random access, no total count.

### Offset-based (only for small, finite sets — admin, archives)

```http
GET /users?page=2&page_size=50
```
```json
{ "data": [ ... ], "page": 2, "page_size": 50, "total": 1247 }
```

Cap `page_size` at 100. Cap `page * page_size` (deep pagination is expensive on every database).

### Link header alternative (RFC 8288)

```http
Link: </users?cursor=eyJ...>; rel="next", </users?cursor=eyI...>; rel="prev"
```

Useful when the body is a bare array. Most teams prefer the JSON envelope above.

---

## 5. Versioning

Pick one strategy at the API level. Don't mix.

| Strategy | Example | When |
|---|---|---|
| URI segment | `/v1/users` | Public APIs, mobile clients (most common, simplest) |
| Header | `Accept: application/vnd.example.v1+json` | Hypermedia APIs, content negotiation purists |
| Query param | `/users?api_version=2024-10-01` | Date-based versioning (Stripe-style) |

Date-based (`api_version=2024-10-01`) lets you ship breaking changes more gracefully than `/v2`: clients pin a date, you accumulate changes, deprecate per change. Higher cognitive load to operate.

**Never** version internal microservice contracts the same way as public ones. Internal: SemVer the package, deploy in lockstep. Public: dated or `/vN`, kept stable for years.

---

## 6. Deprecation Lifecycle (RFC 8594, RFC 9745)

```http
HTTP/1.1 200 OK
Deprecation: @1735689600
Sunset: Wed, 01 Jan 2026 00:00:00 GMT
Link: <https://docs.example.com/migration/v2>; rel="deprecation"
```

| Stage | Action | Communicate via |
|---|---|---|
| Announce | Mark `deprecated: true` in OpenAPI; document replacement | spec, docs, CHANGELOG |
| Headers | Add `Deprecation` + `Sunset` headers on every response | runtime |
| Monitor | Track usage by client (User-Agent, API key) | observability |
| Sunset | Return `410 Gone` after the published date | runtime |

Rule of thumb: announce at least 6 months for paid B2B, 12 months for free public APIs.

---

## 7. Idempotency

Required for any unsafe retry-able operation: payments, signups, write webhooks.

```http
POST /orders
Idempotency-Key: 7f9c2bd6-1f3a-4b9e-8a4d-1e2d3a4b5c6d
Content-Type: application/json
```

Server contract:
1. Hash the request (method + path + body) and store it under the key for ≥ 24h
2. Same key + same hash → return the original response
3. Same key + **different** hash → `409 Conflict` (client bug)
4. Reject keys longer than 255 chars; require client-generated UUIDs

Document in the spec which endpoints require it (the IETF `Idempotency-Key` draft is widely adopted: Stripe, Square, PayPal).

---

## 8. Security Schemes

Declare every auth method. Multiple are fine — clients pick.

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    apiKey:
      type: apiKey
      in: header
      name: X-API-Key
    oauth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://auth.example.com/authorize
          tokenUrl: https://auth.example.com/token
          scopes:
            read:orders: Read user's orders
            write:orders: Create and update orders
    cookieSession:
      type: apiKey
      in: cookie
      name: session

security:
  - bearerAuth: []
  # OR per-operation:
  #   security:
  #     - oauth2: [read:orders]
```

| Scheme | Use For | Caveats |
|---|---|---|
| `bearer` JWT | Service-to-service, mobile/SPA | Short expiry (≤15min), refresh flow |
| `apiKey` (header) | Server-to-server with rotation | Never in query string (logs leak) |
| `oauth2` | Third-party access on user's behalf | PKCE for public clients |
| `cookieSession` | First-party browser session | `HttpOnly`, `Secure`, `SameSite` |

**Never** declare `security: []` globally and forget to re-add per operation. Easier to declare globally and override `security: []` only on truly public endpoints (health, login, public docs).

---

## 9. Document Hygiene

### `operationId` matters

Codegen uses it as the function name. Make it stable, snake_case or camelCase, descriptive:

```yaml
paths:
  /users/{id}/orders:
    get:
      operationId: listUserOrders   # → client.listUserOrders(...)
```

Renaming an `operationId` is a breaking change for SDK users. Treat it like a public symbol.

### Reuse via `$ref`

Define schemas once, reference everywhere. Avoid repeating field shapes inline — codegen produces ugly anonymous types.

```yaml
components:
  schemas:
    User: { ... }
    UserList:
      type: object
      properties:
        data: { type: array, items: { $ref: '#/components/schemas/User' } }
```

### Examples — always

Every schema and parameter should have at least one realistic `example`. Tools like Swagger UI, Redoc, Stoplight render them; mock servers serve them. Empty examples → empty SDK fixtures → no testing.

Use **placeholder data only**. Never copy production payloads with real emails, names, IDs.

### Tags

Group by resource, not by handler file. ≤ 10 tags total — more becomes navigational soup.

```yaml
tags:
  - { name: Users, description: User accounts and profiles }
  - { name: Orders, description: Order lifecycle }
```

### Servers

List every environment so the spec is usable as-is in tooling:

```yaml
servers:
  - url: https://api.example.com/v1
    description: Production
  - url: https://api.staging.example.com/v1
    description: Staging
  - url: http://localhost:3000/v1
    description: Local dev
```

---

## 10. Content Types & Negotiation

| Content | Type |
|---|---|
| Standard JSON request/response | `application/json` |
| Errors | `application/problem+json` |
| File upload | `multipart/form-data` |
| Streaming events | `text/event-stream` (SSE) or `application/x-ndjson` |
| Large file download | `application/octet-stream` with `Content-Disposition` |
| Patch | `application/merge-patch+json` (RFC 7396) or `application/json-patch+json` (RFC 6902) |

Don't invent new content types unless you genuinely need to. `application/json` covers 95% of APIs.

---

## 11. CORS

Document expected `Access-Control-Allow-Origin`/`Methods`/`Headers` in the OpenAPI description **and** enforce them in middleware. Mismatch between spec and reality is a top integration bug.

For browser clients: every endpoint must have CORS configured. Don't rely on a wildcard reverse-proxy default — origin allowlists must be explicit.

---

## 12. What NOT to Put in OpenAPI

| Don't | Why | Where instead |
|---|---|---|
| Internal/admin endpoints | Spec is shipped to SDK consumers | Separate `internal-openapi.yaml`, not deployed |
| Experimental endpoints | Tagged `x-internal` is brittle; consumers see them anyway | Feature flag + private spec |
| Secret schemas | Auth payloads / signed tokens internals | Document only the contract, not the implementation |
| Real production data in examples | PII leak | Synthetic fixtures |
| Implementation details in `description` | Rot when you refactor | API behavior only — not the database schema |

---

## 13. Spec-First or Code-First?

Both are valid; pick one and be consistent.

| Approach | Pro | Con | Tooling |
|---|---|---|---|
| **Code-first** (generate spec from Zod / Pydantic / DTO) | Spec never drifts; types are the source of truth | Coupled to framework; spec PRs noisy in diff | `fastify-type-provider-zod`, `@hono/zod-openapi`, FastAPI built-in, drf-spectacular |
| **Spec-first** (write YAML, generate stubs) | Design conversation in PR; multiple impls | Discipline required; easy for code to drift | OpenAPI Generator, Stoplight, Redocly |

For most product APIs in 2025, code-first with Zod/Pydantic wins on velocity. Spec-first is better for: cross-team contracts, public APIs with multiple SDK targets, regulated environments.

**Mandatory for code-first:** lock the generated spec into version control and CI-diff it. A breaking change to a route should produce a spec diff in the PR — that's your review checkpoint.

---

## 14. Pre-Merge Checklist

- [ ] Every operation has `operationId`, `summary`, response schema, error responses (at least 400, 401/403 if auth, 404 if path param)
- [ ] All 4xx responses use `application/problem+json` schema
- [ ] Schemas defined in `components/schemas` and `$ref`'d
- [ ] Examples present and synthetic (no real PII)
- [ ] Pagination strategy documented
- [ ] Security scheme set (global or per-op)
- [ ] Spec checked into git; CI fails on uncommitted regeneration
- [ ] Linted with Spectral or Redocly (`oas-3.1-*` rules)

---

## FORBIDDEN

| Pattern | Reason |
|---|---|
| `200 OK` with `{ "error": ... }` | Breaks every HTTP-aware tool in the chain |
| Plain-text error bodies on 4xx/5xx | Codegen can't model it; client retries break |
| Hand-written OpenAPI for a real service | Drifts within one sprint |
| Renaming `operationId` without major version bump | Breaks every generated SDK |
| Mixing pagination styles in one API | Client code has to special-case |
| Real PII in examples | GDPR violation, PR review surface area |
| Stack traces / SQL / file paths in `detail` | Information disclosure |
| `security: []` global + forgotten per-op | Endpoints ship publicly unauthenticated |
| Versioning by both URI and header | Cache fragmentation, doc confusion |
| Deprecating without `Sunset` header | Clients can't plan migration |

---

## See Also

- `security-baseline` — auth patterns, problem+json complements `A03 Injection` defense
- `fastify-api` (Node) — generate this spec via `@fastify/swagger` + `fastify-type-provider-zod`
- `fastapi-patterns` (Python) — FastAPI generates 3.1 spec automatically; this skill says **what shape** it should have
- `laravel-patterns` / `api-design` (PHP) — Laravel + L5-Swagger / Scribe
- `database-migrations` — coordinate spec deprecation with backwards-compat schema migrations
