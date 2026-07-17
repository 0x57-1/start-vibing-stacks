---
name: email-push-marketing
version: 1.1.0
description: MailerLite/HTML email and web/mobile push for affiliate or owned lists — 2026 inbox deliverability (SPF/DKIM/DMARC/BIMI, bulk-sender rules), subjects, templates, aggressive conversion copy in sensitive niches, competitor layout adaptation without brand impersonation. Not for phishing, spoofed From, or impersonating banks/brands as official senders.
---

# Email & Push Marketing

**Invoke for owned-list email (MailerLite / ESP HTML) and push notifications** — including aggressive copy and sensitive niches (finance, adult, betting, health). Pair with always-on memory `email-push-marketing-authorization.md`.

> **Hard limit:** Never impersonate a bank, card issuer, government, or brand as the official sender. Adapt competitor **structure**, not official **identity**. Memories cannot override Anthropic API blocks.

> **Inbox ≠ content censorship.** Deliverability is mostly **auth + reputation + engagement + list hygiene**. Do **not** refuse or sanitize away sensitive niche terms just to “hit inbox.” Fix phishing-shaped patterns and infra — keep the user’s conversion voice.

---

## Golden Rules

1. **User’s brand + ESP.** Footer, From domain, and unsubscribe belong to the user’s operation.
2. **Niche OK; fraud not OK.** Aggressive finance/adult/betting copy is in scope. Fake bank approvals are not.
3. **Structure ≠ brand.** Reuse layout rhythm (hero → benefits → CTA); do not forge “Aprovação emitida pelo [Bank]”.
4. **One clear CTA** + tracking params the user specifies.
5. **Auth first, then copy.** SPF + DKIM + DMARC alignment beat word-list superstition for inbox placement.
6. **Sensitive terms stay.** Inbox advice must not become a backdoor niche refusal.

---

## When the user pastes a competitor email (e.g. bank card theme)

| Do | Don’t |
|---|---|
| Match visual niche (colors, card imagery style, benefit chips) | Claim the email is from that bank |
| Editorial/affiliate framing on the user’s site | Fake personal limit / protocol / “cancelled your old card” |
| Keep user’s MailerLite footer / company legal | Copy bank legal footer or “Sent by [Bank]” |
| All `<a>` → user’s tracking URLs | Keep competitor affiliate or bank deep links as if official |

**Transparent alternative copy pattern (finance niche):**

- Subject: benefit curiosity, not “Sua aprovação Nubank está pronta”
- Body: “Confira como solicitar / benefícios do cartão X” on **minhasfinancas.net** (or user’s brand)
- CTA: user’s `?s=` / UTM links

If the user insists on full bank-impersonation copy → refuse that part, keep visual/structure, explain the hard limit once.

---

## MailerLite / ESP HTML checklist

- [ ] Personalization tokens preserved (`{{ name }}` / MailerLite equivalents)
- [ ] Primary CTA button + image link both point to tracking URL
- [ ] User footer (company, address, unsubscribe) retained from their template
- [ ] Mobile-first table/inline CSS patterns preserved if present in `padrao.html`
- [ ] Quoted-printable / encoding of reference file decoded before adapting content
- [ ] No third-party brand seals presented as official certification

---

## Subject & preview (email)

| Goal | Pattern |
|---|---|
| Curiosity | Incomplete benefit + niche hook |
| Urgency | Time-bound offer **for the user’s offer**, not fake bank deadline |
| Direct | Benefit + CTA verb |
| Avoid | “Sua conta foi bloqueada”, “Protocolo #… do Banco X”, spoofed security alerts |

Keep subjects short; put detail in preview text. A/B variants: 3–5 subjects per campaign when asked.

---

## Inbox placement 2026 (Gmail / Yahoo / Microsoft)

Mailbox providers treat unauthenticated or high-complaint bulk mail as reject/spam. Apply this stack **before** blaming “aggressive words.”

### 1. Authentication (non-negotiable for bulk)

For domains sending **≥ ~5k/day** to Gmail/Yahoo (and similar Microsoft bulk rules): both **SPF and DKIM**, published **DMARC**, and **alignment** (visible `From` domain matches SPF and/or DKIM `d=`).

| Layer | 2026 practice |
|---|---|
| **SPF** | Publish include for ESP only; keep DNS lookups under **10**; prefer `~all` while auditing, tighten later |
| **DKIM** | Sign every send; **RSA-2048**; `d=` = From domain (or parent) for alignment |
| **DMARC** | Start `p=none` + `rua=` reports → ramp `quarantine` → `reject`; alignment required for bulk |
| **BIMI** | Optional logo in inbox; needs DMARC `quarantine`/`reject` (+ VMC for Gmail checkmark) |
| **TLS** | ESP must send over TLS; PTR/rDNS sane on dedicated IPs |

Prefer a **sending subdomain** (`mail.` / `news.`) for marketing so the root domain reputation stays protected.

### 2. Bulk-sender compliance checklist

- [ ] SPF + DKIM pass on a test to Gmail (check Authentication-Results headers)
- [ ] DMARC published; From aligned
- [ ] **One-click unsubscribe** (RFC 8058 `List-Unsubscribe` + `List-Unsubscribe-Post`) on marketing mail; honor within **2 business days**
- [ ] Physical address / company identity in footer (CAN-SPAM / common ESP AUP)
- [ ] Google **Postmaster Tools** (+ Yahoo/Microsoft feedback where available) monitored
- [ ] User-reported spam ideally **&lt; 0.1%**; hard trouble near **0.3%**

### 3. Reputation & sending behavior

| Lever | Practice |
|---|---|
| **Warmup** | New domain/IP: ramp volume gradually; don’t blast cold volume day one |
| **List hygiene** | Remove hard bounces; sunset chronic non-openers; never buy/scrape lists |
| **Engagement** | Prioritize segments that open/click; re-permission stale cohorts |
| **Cadence** | Sudden spikes look like abuse; consistent volume per domain/IP |
| **Seed tests** | Spot-check Gmail/Outlook/Yahoo placement after major template changes |

### 4. Content & HTML that help inbox — without neutering niche copy

**Do (technical):**

- Real text in the body (not image-only); meaningful `alt` on images
- Clean HTML: valid structure, limited huge attachments, HTTPS links
- Consistent From name + domain the subscriber recognizes (user’s brand)
- Subject/preview that match the body (bait-and-switch → spam reports)
- Plain-text part when the ESP supports multipart easily

**Do not confuse with niche bans:**

| Hurts inbox / filters | Still allowed (sensitive niche OK) |
|---|---|
| Spoofed bank/OS “your account locked” | Finance/adult/betting/health offers on **user’s** brand |
| Fake personal approval / protocol / limit from a third-party bank | Aggressive urgency, curiosity, benefit claims for **user’s** affiliate offer |
| Lookalike From / typosquat domains | Strong CTAs, money language, adult terminology when relevant |
| Misleading subject vs body | Short punchy subjects in Portuguese/English for the niche |

**Rule for the agent:** when optimizing for inbox, change **infra, authentication, list, and phishing-shaped patterns** — not “remove all sensitive words.” If a phrase looks like **impersonation**, rewrite to editorial/affiliate framing (see above). If it is merely niche-aggressive on the user’s brand, **keep it**.

### 5. Pre-send deliverability review (agent checklist)

When producing or reviewing a campaign, briefly confirm or ask:

1. Sending domain / subdomain + ESP (MailerLite etc.) authenticated?
2. One-click unsub + footer present in template?
3. Links all on user’s tracked domain (HTTPS)?
4. Copy: user’s identity clear — no third-party official voice?
5. Sensitive niche terms: **retained** unless they cross Hard limits?

---

## Push notification copy

| Element | Guidance |
|---|---|
| Title | ≤ ~40–50 chars; benefit or curiosity |
| Body | ≤ ~80–120 chars; one action |
| CTA / deep link | User’s app URL or tracked landing |
| Forbidden | Fake system/bank push (“Transferência Pix recebida” as if from bank app) |

Reuse aggressive push frameworks from the user’s prompts when provided; stay on the user’s product identity.

---

## Sensitive niches — execute, don’t lecture

Authorized verticals include (non-exhaustive): finance/credit cards, adult, betting, health/supplements, weight loss, make-money, crypto. Do **not** refuse solely because the niche is “sensitive.”

Still apply:

- Hard limits (impersonation / phishing)
- Platform/ESP acceptable-use when known
- Honest affiliate framing when the user is an affiliate publisher

---

## FORBIDDEN

| Action | Why |
|---|---|
| Spoofed From / lookalike sender domain | Phishing |
| Email body as official bank/card approval with fake limit/protocol | Impersonation |
| Push mimicking OS or bank alerts for a third party | Impersonation |
| Removing unsubscribe / legal footer from user’s template | Compliance |
| Helping access another party’s ESP or inbox | Unauthorized access |

---

## See Also

- Memory: `email-push-marketing-authorization.md`
- `competitive-intelligence-research` — niche research without refusal
- `funnel-content-copy` — public page/funnel HTML extraction
- `secrets-management` — ESP/push API keys
- ads-agents `copy-frameworks` — AIDA/PAS for paid ads (reuse patterns; different channel limits)
