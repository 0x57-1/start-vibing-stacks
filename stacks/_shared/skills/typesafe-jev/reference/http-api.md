---
name: typesafe-jev-http
---

# TypeSafe HTTP + SDK (scraped 2026-09-21)

SoT: [API](https://docs.typesafe.ai/api.md), [Models](https://docs.typesafe.ai/models.md),
[JS SDK](https://docs.typesafe.ai/sdk/javascript.md),
[Python SDK](https://docs.typesafe.ai/sdk/python.md).
**No OpenAPI** is published. Do not invent error-body field names.

## Endpoints

| Method | URL | Body / notes |
|---|---|---|
| `POST` | `https://api.typesafe.ai/v1/systemone` | `{ state, model, questions }` |
| `GET` | `https://api.typesafe.ai/v1/models` | Bearer only. Lists **aliases**. Versioned ids still accepted |

Auth: `Authorization: Bearer <key>`. POST: `Content-Type: application/json`.
Request id header: `x-typesafe-request-id`. Retry: `Retry-After`, `retry-after-ms`.

## Request

```json
{
  "state": "<string | object | array>",
  "model": "jev-latest",
  "questions": {
    "<id>": { "type": "noul|choice|score", "instructions": "…", "criteria": "…" }
  }
}
```

| Field | Required | Notes |
|---|---|---|
| `state` | yes | Text or JSON. JS `EntryType` allows `null`. Python top-level cannot be `None` |
| `model` | yes on raw HTTP | SDKs default `jev-latest` |
| `questions` | yes | Nonempty map. Keys are yours |

`instructions`: string \| object \| array \| null. Point at nested state with
backticks: `` `ticket.messages[0].text` ``.

### Question criteria

| `type` | `criteria` |
|---|---|
| `noul` | Optional `{ "true": …, "false": … }` |
| `choice` | **Required** map, max **255** options. Value may be `null` |
| `score` | **Required** ordered array, **2–10** levels |

## Response

```json
{
  "model": "jev-1.13.0",
  "answers": { "<id>": { "type": "…" } },
  "usage": { "input_tokens": 0, "output_tokens": 0 }
}
```

| Answer | Fields |
|---|---|
| Noul | `type`, `noul` (0–1) |
| Choice | `type`, `choice`, `probabilities`, `confidence` |
| Score | `type`, `score`, `legend`, `probabilities`, `confidence` |

HTTP Score `legend` / `probabilities` keys are **strings** `"0"`, `"1"`, ….
Python SDK types those keys as **ints**. JS keeps string keys on Choice
options; Score keys follow the SDK types.

## Models / money / limits

| Alias | Points to (2026-09) |
|---|---|
| `jev-latest` | `jev-1.13.0` (SDK + docs default) |
| `jev-preview` | currently same as latest |

- Price: **$42 / Btok** = **$0.042 / Mtok** **input**. Output tokens free (still reported).
- Rate: 250,000 tok/s and 1,200 req/min → `429`. Limits “can change without notice”.
- Context: 64k / request; 32k for `state` + longest question.
- Training: not on customer traffic (docs).

## Errors

| Status | Meaning |
|---|---|
| `401` | Bad/missing key |
| `422` | Validation (missing / malformed question) |
| `429` | Rate limit — backoff |
| `529` | Overloaded — backoff |

SDKs also map 400 / 403 / 404 / 5xx. Default retries: 2 after first try;
statuses 408, 429, 500–599.

## Env

| Var | Default |
|---|---|
| `TYPESAFE_API_KEY` | — |
| `TYPESAFE_BASE_URL` | `https://api.typesafe.ai` |
| `TYPESAFE_DEFAULT_MODEL` | `jev-latest` |
| `TYPESAFE_LOG_LEVEL` | JS `warn`; Python unset until import |

Ctor options override env. Empty env values ignored. Some cookbooks say
`TYPESAFE_ENDPOINT` — official SDK env is `TYPESAFE_BASE_URL`.

## SDK name map

| Concern | HTTP | JS `@typesafe-ai/sdk` | Python `typesafe-sdk` |
|---|---|---|---|
| Evaluate | `POST /v1/systemone` | `client.systemOne({ state, questions, model? })` | `client.system_one(state, questions, *, model=)` |
| List models | `GET /v1/models` | `client.models.list()` → `ModelCard[]` | `client.models.list()` → `{ models }` |
| Default model | `model` | ctor `defaultModel` | ctor `model` |
| Builders | raw `type` | `choice` / `score` / `noul` | `Choice` / `Score` / `Noul` |
| Timeout | — | **ms**, default 10000 / attempt | **seconds**, default 10 / HTTP op; retry budget 30s |
| Extra JSON | body | extra keys on request object | `extra_body=` |
| Browser | — | `dangerouslyAllowBrowser` default **false** | n/a |

JS: Node **20+**, shipped VERSION noted in docs as `0.6.0` (check npm).
Python: ≥ 3.10. `TypeSafeClient` / `AsyncTypeSafeClient` context managers.

JS errors: `TypeSafeError` → `APIError` (400/401/403/404/422/429/5xx) /
`APIConnectionError` / `APITimeoutError` / `APIUserAbortError`.

Python errors: `TypeSafeAPIError` subclasses + `TypeSafeAPIConnectionError` /
`TypeSafeAPITimeoutError` / `TypeSafeAPIResponseValidationError`.

## Node axios (SVS HTTP rule)

```ts
import axios from 'axios';

export const typesafe = axios.create({
  baseURL: process.env['TYPESAFE_BASE_URL'] ?? 'https://api.typesafe.ai',
  allowAbsoluteUrls: false,
  timeout: 10_000,
  headers: {
    Authorization: `Bearer ${process.env['TYPESAFE_API_KEY'] ?? ''}`,
    Accept: 'application/json',
  },
});

export async function systemOne(body: {
  state: unknown;
  questions: Record<string, unknown>;
  model?: string;
}) {
  const { data } = await typesafe.post('/v1/systemone', {
    model: process.env['TYPESAFE_DEFAULT_MODEL'] ?? 'jev-latest',
    ...body,
  });
  return data;
}
```

Log `usage` and `x-typesafe-request-id`. Never log the Bearer token or full
`state` if it has PII.
