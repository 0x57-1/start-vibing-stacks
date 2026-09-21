---
name: typesafe-jev-combinations
---

# Jev combinations (code owns the tree)

SoT: [Patterns](https://docs.typesafe.ai/patterns.md),
[How to build](https://docs.typesafe.ai/concepts/how-to-build-with-system-one.md),
cookbooks via [llms.txt](https://docs.typesafe.ai/llms.txt).
Jaggedness: [jev-1.13](https://docs.typesafe.ai/model-jaggedness/jev-1.13.md).

Siblings in **one** `system_one` do not see each other. Compose in **code**.

Thresholds below are **starting points**. Keep them next to the questions.

---

## A — Speculative fan-out

Ask every branch now. Switch on `category.choice`; ignore unused answers.

```
Choice category
Score  bug_severity          (only if bug)
Noul   has_repro             (only if bug)
Noul   refund_requested      (only if billing)
Score  frustration           (always)
```

Do **not** call category first, then severity. Extra questions barely change
latency; the document is paid once.

## B — Composite Score (weights in code)

One dimension per Score. Normalize `score / (n_levels - 1)`, then:

```
ic = 0.40*python + 0.10*lead + 0.40*arch + 0.10*general
```

Retune coefficients without rewriting prompts. Do **not** interpolate a Score
to recover an exact number (weak numeric calibration).

## C — Confidence-gated routing

Choice/Score → `.confidence`. Noul → band around 0.5 (no `.confidence`).

```
if confidence < 0.6:           human
elif choice == check_balance:  act          # low stakes
elif choice == approve_xfer:
     if confidence > 0.85: act
     else: confirm
```

Noul band (start): `< 0.30` no · `0.30–0.70` review · `> 0.70` yes.

Abstain on Choice if `max(p) < 0.60` when flip-flopping is costly (moderation
cookbook). Hierarchical / SIC: if `confidence < 0.9` report the **parent**
label, not the 75-way leaf.

`confidence` is **not** the winner’s probability. A 0.45/0.44 tie ≠ a 0.45
with the rest scattered.

## D — Ordered Noul router (RAG / safety)

First match wins. **Security before usefulness.**

```
if injection > 0.70:     drop
if contradicts > 0.70:   conflict
if relevant < 0.45:      drop
if evidence > 0.55:      include
else:                    drop
```

Guardrails: several hazard Nouls + one harm Score in **one** request. Docs
precedence example: `support > block > review > pass`. Per-passage RAG =
**one request per query–passage pair**, not one mega-batch of passages.

## E — Choice + Noul on the same shortlist

- Choice is **relative** — some option always wins (p sum 1).
- Noul is **absolute** — every option can be low.

Do not treat `P(yes) + P(not yes) = 1` (jaggedness: they can sum ≠ 1).
Do not copy a Noul threshold onto a Choice.

Skill-suggestion shape: call 1 = Choice over the catalog + gate Nouls; call 2
only after you load the top-3 full texts.

## F — Closed-set function calling

One request: `__tool__` Choice + per-arg Choice + `stated?` Noul + set-member
Nouls. `call.confidence = min(all judgments)` — **not** the product (products
punish long signatures).

Ints, free text, dates: **no Jev question** — defaults + code.

## G — Second request (rare)

Justified only to **fetch state, build new objects, or change the next option
set**:

| Cookbook | Why 2+ calls |
|---|---|
| Skill suggestion | Rank on one-liners, then re-read top 3 |
| Hierarchical classification | Children of the winner become the next Choice |
| Structure recovery | First call creates blocks that did not exist |

If it could have seen the original `state`, it belongs in request 1.

---

## Path + structured instructions

```python
Noul(instructions="Does `ticket.messages[0].text` request a refund?")
Noul(instructions={
    "potential_duplicate": {"name": "…", "location": "…"},
    "question": "Is the resume the same person as `potential_duplicate`?",
})
```

Choice/Score/Noul `criteria` values may be objects (`what` / `not_for` /
`examples`). Field names are **yours** — not reserved.

Deep taxonomies: one Choice per **level** (direct children only). Beam-search
`probabilities` in code (`exp(mean(log p))` if depth > 10).

---

## Worked ticket (compose)

```
spam_risk = 0.45*asks_secrets + 0.30*sender_mismatch + 0.25*unexpected_reward

if 0.4 < spam_risk < 0.6 or topic.confidence < 0.75: human
if spam_risk >= 0.6: quarantine
if topic == billing and refund_requested.noul >= 0.7: refund_flow
if frustration.confidence >= 0.7 and frustration.score >= 1.5: priority
```

Weighted Noul quality:

```
0.4*answers_request + 0.4*citations_ok + 0.2*(1 - contradicts)
```

---

## Cookbook map (when to open the live page)

| Need | Cookbook |
|---|---|
| Many facts, one fat doc | `parallel_questions` |
| NL → typed functions | `function_calling` |
| LLM in/out screen | `llm_guardrails` |
| Keep / drop RAG hits | `classifying_rag_passages` |
| Quote vs source | `citation_check` |
| Line-level search + “not in doc” | `semantic_find` |
| Huge agent roster | `skill_suggestion` |
| Deep taxonomy | `hierarchical_classification` |
| Flat labels + parent rollup | `classification_using_confidence` |
| Flip-flop yes/no or labels | `consistency_noul` / `consistency_choice` |

Official cookbooks: `https://console.typesafe.ai/docs/cookbooks` and
`https://docs.typesafe.ai/llms.txt`.
