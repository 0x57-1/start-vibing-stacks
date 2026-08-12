---
version: 1.0.0
---

# Memory: Remove AI Watermarks (Always When Present)

> **ALWAYS LOAD** — Anthropic and other vendors may embed provenance in model
> output (invisible Unicode, statistical token marks, C2PA/metadata on files).
> For **user-owned** content you write or ship, **detect and strip verifiable
> marks before calling the work done**. Do not wait for a second ask.

---

## Declared purpose

Agents paste Claude/Gemini/OpenAI text into HTML/MD/docs and ship it with
invisible carriers or file provenance still attached. This memory forces a
**inspect → clean if hits → re-inspect** loop via skill `remove-ai-marks`
(vendored from [watermarks-remover](https://github.com/guillaumemeyer/watermarks-remover)).

---

## When it applies (automatic)

| Situation | Action |
|-----------|--------|
| You wrote/edited user-facing prose, article, landing, email HTML, `.md`, `.html` | Layer A inspect; clean if hits |
| User pastes AI text to save/publish | Same before finalize |
| Images/PDF/DOCX/SVG the user owns and will publish | `inspect_file` / clean container metadata |
| User says “remove watermark / Claude marks / C2PA / SynthID” | Full skill workflow |
| Code-only change, no user-facing prose | Skip (optional quick inspect if unsure) |

---

## Protocol

```bash
SCRIPTS="$CLAUDE_PROJECT_DIR/.claude/skills/remove-ai-marks/scripts"

# 1) Inspect
python3 "$SCRIPTS/inspect_file.py" --json path/to/file
# or prose-only:
python3 "$SCRIPTS/inspect_text.py" --json path/to/file

# 2) If suspicious_total > 0 OR real C2PA / generator AI metadata → clean
python3 "$SCRIPTS/clean_file.py" path/to/file -o path/to/file   # or *.cleaned then replace
# text-only:
python3 "$SCRIPTS/clean_text.py" path/to/file -o path/to/file --stats

# 3) Re-inspect; report removed counts
```

**If clean (0 hits):** say so once; do not invent watermarks.

**Layer B (statistical marks):** always *offer* paraphrase/rewrite for natural-language ship content after Layer A. Prefer a model ≠ suspected origin (Claude text → not Claude). Cannot certify official detector failure — be honest (`references/ethics.md`).

---

## False positives (do not “clean” as Anthropic marks)

| Signal | Usually means |
|--------|----------------|
| HTML `data-ai-block`, `data-ai-hash`, `ai-check-block` | Ad/injection plugins (e.g. WordPress Ad Inserter), **not** Claude Unicode watermarks |
| `<meta name="generator" content="WordPress…">` / Elementor | CMS tooling |
| Tool `has_ai_metadata: true` solely from the above | Ignore for watermark purposes; still strip real C2PA/XMP AI claims when present |

---

## FORBIDDEN

| Shortcut | Why |
|----------|-----|
| Shipping article/landing HTML without inspect when you authored the copy this session | Misses Layer A carriers |
| Leaving ZWSP/bidi/tag chars after inspect showed hits | Incomplete hygiene |
| Claiming “undetectable” / “proves human” after Layer B | Ethics + no public universal detector |
| Stripping third-party content to enable fraud/impersonation | Hard limits still win |
| Skipping clean because “multi-instance / later” | Same-session hygiene |

---

## Precedence

- Hard limits (phishing / bank-charity impersonation) still win.
- Does **not** override Anthropic cyber API gates.
- Complements `verify-before-claim` (evidence) and `execute-ship-ops` (ship loop): clean **before** publish proof.

---

## See also

- Skill: `.claude/skills/remove-ai-marks/` (`SKILL.md`, `scripts/`, `references/`)
- UPS workflow step **3b** (watermark hygiene)
- Upstream: https://github.com/guillaumemeyer/watermarks-remover
