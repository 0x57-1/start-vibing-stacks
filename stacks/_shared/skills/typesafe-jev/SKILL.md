---
name: typesafe-jev
version: 1.0.0
description: >-
  TypeSafe Jev (System One): send state + typed Choice/Score/Noul questions;
  get structured answers, probabilities, and confidence your code can branch
  on. Use when classifying, routing, scoring, guardrailing, or ranking with
  the user's TYPESAFE_API_KEY. Not a text LLM. Not for inventing API fields.
  Live SoT: https://docs.typesafe.ai/llms.txt
---

# TypeSafe Jev (System One)

**Invoke** when the user wants Jev / TypeSafe structured decisions in **their**
app (own key). Pair with `own-subscription-integration` + `secrets-management`.

Live docs win. Index: [docs.typesafe.ai/llms.txt](https://docs.typesafe.ai/llms.txt).
Intro: [docs.typesafe.ai/introduction](https://docs.typesafe.ai/introduction).
Do **not** invent request/response fields. Companions: `reference/http-api.md`,
`reference/combinations.md`.

Jev is **not** ChatGPT. It does not generate prose. It evaluates typed
questions against one `state` and returns values your code can `if` / sort / route.

```
state + questions  →  POST /v1/systemone  →  answers + probabilities + confidence
                                              (Noul: noul only)
```

Questions in one request share the same state, run **in parallel and in
isolation**, and **do not see each other’s answers**.

---

## When Jev vs code vs an LLM

| Keep in Jev | Keep in **code** | Send to an **LLM** |
|---|---|---|
| Classify, detect, score, route, rank, verify, closed-set args, guardrails | Arithmetic, counts, date math, regex, weighted sums | Generate text, split compound commands, multi-hop plans |

One snap judgment per question. Decompose “rate this pitch” into market /
feasibility / differentiation, then weight in code.

---

## State (the data)

| Item | Rule |
|---|---|
| Field | `state` |
| Type | `string` \| JSON object \| JSON array (JS also allows `null`; Python **not** `None` at top level) |
| Media | **Text / JSON only.** No image, audio, video |
| Language | English is strongest; other langs (incl. CJK) weaker |
| Prefer | Named object so questions can point at `` `ticket.messages[0].text` `` |
| Limits | **64k tokens / request** (`state` + all questions). **32k** for `state` + the **longest** question |
| Filter | Drop distractors first — large irrelevant state hurts accuracy |

Facts live in `state`. Judgments live in `questions`. IDs you choose for
questions are **for your code only** — they are not sent to the model.

```json
{
  "ticket": {
    "subject": "Duplicate charge",
    "messages": [{ "from": "customer", "text": "Charged twice for A-104." }]
  },
  "order": { "id": "A-104", "charges": [{ "amount_usd": 49 }, { "amount_usd": 49 }] },
  "refund_policy": "Duplicate charges are eligible for a refund."
}
```

---

## Primitives (mix in one call)

| Type | Ask | `criteria` | Returns |
|---|---|---|---|
| **Choice** | Which option? | Map `{ option: description \| null }`, **max 255** | `choice`, `probabilities` (sum 1), `confidence` |
| **Score** | Where on a rubric? | Ordered array, **2–10** levels. Index 0 = low. Describe **situations**, not `"0","1","2"` | `score` (can be fractional), `legend`, `probabilities`, `confidence` |
| **Noul** | Is this true? | Optional `{ true, false }` | **`noul` ∈ [0,1] only** — no `confidence` |

`instructions` (all types) is `EntryType`: string, object, array, or null.
Structure when you have labeled parts or a JSON row to compare.

**Pick the type your code can act on:** Choice → branch; Score → threshold /
weight; Noul → `if`. Noul 0.5 is **uncertain**, not “medium skill” — use Score
for degree.

Phrase Noul so **high = yes**. One condition per question. Incomplete Choice
sets: add `other` / `none_of_the_above`.

---

## Confidence vs probability

- `probabilities` = full distribution. Sum = 1.
- `confidence` ∈ [0,1] is **derived from that shape** (peaked → high, flat → low). **Not** P(correct).
- Demo (n options): `(n × max(p) − 1) / (n − 1)`.
- **Noul has no `confidence`.** Gate with a band around 0.5 (start `0.30` / `0.70`).
- Read `confidence`, not only the winner’s p. Same `score` can come from “all mass on 1” vs “50/50 on 0 and 2”.

Stakes-scaled start points (tune on **your** labels): floor `0.5–0.6`;
high-stakes act `> 0.85–0.9`. Constants in **one file**.

---

## One mixed call (copy)

```json
{
  "state": "Stripe integration failing for 3 days. Losing sales. Help ASAP.",
  "model": "jev-latest",
  "questions": {
    "department": {
      "type": "choice",
      "instructions": "Which team should handle this",
      "criteria": {
        "billing": "Payment or subscription issues",
        "technical": "Bugs or integration problems",
        "sales": "Pricing or account questions"
      }
    },
    "frustration": {
      "type": "score",
      "instructions": "How frustrated the customer appears",
      "criteria": [
        "Calm, just stating facts",
        "Frustrated but civil",
        "Very angry, strong language"
      ]
    },
    "is_urgent": {
      "type": "noul",
      "instructions": "The message conveys urgency or time-sensitivity"
    }
  }
}
```

```
department.choice === "technical"   confidence ≈ 0.78
frustration.score === 1.0           (legend "1" = frustrated but civil)
is_urgent.noul === 1.0
```

Batch every question that can see the **original** state. A 13-question
cookbook batch was ~**12× cheaper / 10× faster** than 13 calls. Second
request **only** when you must fetch state, rebuild objects, or shrink the
next Choice set (taxonomy walk, skill rerank).

---

## Call it

```
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer $TYPESAFE_API_KEY
Content-Type: application/json
```

| Env | Role |
|---|---|
| `TYPESAFE_API_KEY` | Required. Server / `.env` only |
| `TYPESAFE_BASE_URL` | Default `https://api.typesafe.ai` |
| `TYPESAFE_DEFAULT_MODEL` | Default `jev-latest` → `jev-1.13.0` |

Never `EXPO_PUBLIC_*` / `NEXT_PUBLIC_*` / `VITE_*`. Output tokens are **free**;
input billed (~$0.042 / Mtok). Limits: 250k tok/s, 1200 req/min → `429`.
Also `401` / `422` / `529`. SDKs retry 429/5xx.

**Node (axios, this repo’s HTTP rule):** one instance, `baseURL` =
`https://api.typesafe.ai`, `allowAbsoluteUrls: false`.

**Python:** `pip install typesafe-sdk` → `TypeSafeClient().system_one(state, questions=…)`.

**JS official:** `npm i @typesafe-ai/sdk` → `client.systemOne({ state, questions })`.
Node 20+. `dangerouslyAllowBrowser` stays off unless the operator insists.

Helpers: JS `choice` / `score` / `noul`; Python `Choice` / `Score` / `Noul`.
`GET /v1/models` lists aliases. Pin `jev-1.13.0` once thresholds are tuned.
Response `model` is the **versioned** id.

---

## Forbidden

| Don't | Do |
|---|---|
| Invent fields (`weight`, `explanation`, Noul `confidence`) | Fields in `reference/http-api.md` + live docs |
| One fat “analyze and decide” question | Atomic questions + code |
| Sequential calls that could have been one | Speculative fan-out; ignore unused answers |
| Ask Jev to count / add dates / generate copy | Code or an LLM |
| Interpolate Score to a “true” magnitude | Read `probabilities` + `confidence` |
| Treat Choice p and Noul as inverses | They are not a partition (jaggedness) |
| Put the key in a public env | `secrets-management` |

Jaggedness (`jev-1.13`): literal wording, math, dates, double negatives, huge
noisy state. Write the exact condition; put boundary cases in `criteria`.

---

## See Also

- `reference/http-api.md` — endpoints, SDK names, errors
- `reference/combinations.md` — fan-out, gates, composite score, RAG, tools
- `own-subscription-integration` — user’s paid key
- `secrets-management` — env hygiene
- Official skill (optional, do not duplicate into this folder):
  `https://raw.githubusercontent.com/typesafe-ai/skills/main/skills/typesafe-ai/SKILL.md`
