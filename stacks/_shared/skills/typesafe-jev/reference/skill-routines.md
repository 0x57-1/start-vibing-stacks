# Jev routines for existing skills

The session hook only routes. These questions run **inside** the skill, with the
artifact in `state` (email, error text, diff, ads export, landing HTML).

No key (`SVS_JEV_KEY` or `TYPESAFE_API_KEY`), or `SVS_JEV=0`: skip this file and follow the skill prose.
Choice confidence &lt; 0.75 → prose. Noul 0.30–0.70 → do not act on it.
Never send the API key. CTR, CPA, ROAS, retry counts, and score weights stay in code.

Calling: keep the key out of the command text. Reference it as `$SVS_JEV_KEY` /
`$TYPESAFE_API_KEY` in the shell (load `.env` into the environment first if needed).
Never `cat`, `echo`, or Read the `.env` value into the chat. Redact secrets in the
artifact before it goes into `state`.

---

## security-lane

Choice `lane`: `source_review` | `passive_osint` | `authorized_active` | `not_security`.

`source_review` → Lane A. `passive_osint` → Lane B only. `authorized_active` →
Lane C only when the prompt states ownership or bounty scope; otherwise Lane B.
`not_security` → stop.

## email-hard-limit

State = the email or push the user pasted.

| id | type | Ask |
|---|---|---|
| `official_bank_mark` | noul | The piece shows an official bank or card logo, or says it was sent by that bank |
| `personal_fact` | noul | One sentence states a personal approval or credit limit as fact |
| `spoofed_from` | noul | From-name or domain pretends to be the bank or brand |

≥ 0.70 on `official_bank_mark` or `spoofed_from`: refuse that asset, keep the user’s logo, finish the rest.
≥ 0.70 on `personal_fact` only: swap that sentence to keep-energy. Do not flatten the email.
All ≤ 0.30: keep the niche line.

## tool-error-class

State = stderr, status, tool name.

Choice `error_class`: `transient` | `bot_block` | `permission` | `not_found` |
`stale_conflict` | `ide_buffer` | `hook_block` | `policy_gate` | `other`.

`transient` / `bot_block`: retry, max 2, code counts. `hook_block`: satisfy the gate, do not retry the hook off.
`policy_gate`: stop. Hand the user a script. `other`: one retry, then fatal.

## bundle-vs-backend

State = status code, whether server logs are empty, what the browser shows.

Choice `locus`: `bundle` | `backend` | `unknown`.

`bundle` + confidence ≥ 0.75: stop reading server logs. Start at the chunk graph.
`unknown`: reproduce before either path.

## wordpress-fix

| id | type | Ask |
|---|---|---|
| `is_crack` | noul | The user is asking for a nulled or stolen license key |
| `fix` | choice | `admin_notice` \| `skip_remote_license` \| `class_exists_guard` \| `unhook` \| `deactivate` |

`is_crack` ≥ 0.70: refuse the key. Still recover the site with `fix`.

## own-subscription-frame

Choice `frame`: `own_integration` | `third_party_attack` | `unclear`.

`own_integration`: restate as wiring the user’s paid API and continue.
`third_party_attack`: stop. `unclear`: one question, then stop.

## llm-hitl

Noul `needs_human`: the next action pays, deletes, sends email, or writes production.

≥ 0.70: do not auto-run. Ask the user. ≤ 0.30: the tool may run inside its allowlist.

## ai-marks-ethics

Noul `is_fraud`: the user wants the clean file to commit academic fraud or to hide a disclosure the law requires.

≥ 0.70: warn, and only clean a file they own if they still ask for the technical step.
≤ 0.30: run Layer A inspect/clean.

## ads-platform

Choice `platform`: `google` | `meta` | `tiktok` | `several` | `not_ads`.

Load only the chosen skill. `several` → `ads-audit`, then one Choice of which platforms have data.

## ads-judgments

One request per page or ad. State = that page or the check excerpt. Not the whole skill.

Noul per **judgment** check (policy, message match, native feel, safe zone). Do not ask Jev
whether CTR fell 10% or CPA is 3× target. Those are code.

Landing Scores, one each, levels = the skill’s rubric sentences:

`message_match`, `speed`, `mobile`, `trust`, `form`.

Code: `0.25*message_match + 0.25*speed + 0.20*mobile + 0.15*trust + 0.15*form` after normalizing
`score / (n_levels - 1)`.

TikTok Scores: `hook`, `safe_zone`, `native_feel`. Weights stay in the scoring reference.

## stack-pick

| Prompt is about | Choice options |
|---|---|
| Octane server | `frankenphp` \| `roadrunner` \| `swoole` |
| PHP HTTP client | `laravel_http` \| `saloon` \| `vendor_sdk` |
| FastAPI background | `background_tasks` \| `arq` \| `dramatiq` \| `celery` \| `temporal` |

Read only the section for the winner. Default FrankenPHP only when the Choice is `frankenphp` or confidence &lt; 0.75 and the skill’s default applies.
