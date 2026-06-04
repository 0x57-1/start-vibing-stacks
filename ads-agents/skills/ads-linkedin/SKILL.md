---
name: ads-linkedin
version: 1.6.0
description: "LinkedIn Ads deep analysis for B2B advertising. Evaluates 27 checks across technical setup, audience targeting, creative quality, lead gen forms, and bidding strategy. Includes Thought Leader Ads, ABM, and predictive audiences. Use when user says LinkedIn Ads, B2B ads, sponsored content, lead gen forms, InMail, or LinkedIn campaign."
user-invokable: false
---

<!-- Updated: 2026-05-14 | v1.6: TLA 6.9x CTR lift verified (Fractional Demand 15-month B2B SaaS portfolio, $3.5M spend), 25-40% budget allocation sweet spot, rotate at week 18 not 4-6 weeks, peak CTR weeks 8-12, 3-layer warm/retarget/convert playbook -->


# LinkedIn Ads Deep Analysis

**Terminology note (Oct 2025):** Campaign Groups are now called Campaigns, and
Campaigns are now called Ad Sets. This skill uses the new terminology.

## Process

1. Collect LinkedIn Ads data (Campaign Manager export, Insight Tag status)
2. Read `ads-agents/references/linkedin-audit.md` for full 27-check audit
3. Read `ads-agents/references/benchmarks.md` for LinkedIn-specific benchmarks
4. Read `ads-agents/references/scoring-system.md` for weighted scoring
5. Evaluate all applicable checks as PASS, WARNING, or FAIL
6. Calculate LinkedIn Ads Health Score (0-100)
7. Generate findings report with action plan

## What to Analyze

### Technical Setup (25% weight)
- Insight Tag installed and firing on all pages (L01)
- Conversions API (CAPI) active, launched 2025 (L02)
- Conversion events configured for full funnel
- Revenue attribution tracking enabled
- Salesforce/HubSpot CRM integration (June 2025) enables closed-loop impression-to-revenue reporting

### Audience Targeting (25% weight)
- Job title targeting uses specific titles, not just functions (L03)
- Company size filtering matches ICP (L04)
- Seniority level appropriate for offer (L05)
- Matched Audiences active: retargeting + contact lists (L06)
- ABM company lists uploaded (up to 300,000 companies) (L07)
- Audience expansion OFF for precision campaigns, ON for scale (L08)
- Predictive audiences tested, replaced Lookalikes Feb 2024 (L09)

### Creative Quality (20% weight)
- Thought Leader Ads active, **25-40% budget allocation sweet spot** for B2B (L10)
- Ad format diversity: ≥2 formats tested (L11)
- Video ads tested (L12)
- Creative refresh every 4-6 weeks for standard formats; **TLA-specific: do NOT rotate at 4-6 weeks** — let strong TLAs (CTR ≥2% at week 6) run; peak CTR is at weeks 8-12; rotate at week 18 (L13)

### Lead Gen & Performance (15% weight)
- Lead Gen Form ≤5 fields (13% CVR benchmark) (L14)
- Lead Gen Form synced to CRM in real-time (L15)
- Campaign objective matches funnel stage (L18)
- A/B testing active: creative or audience (L19)
- Message ad frequency ≤1 per 30-45 days (L20)

### Bidding & Budget (15% weight)
- Bid strategy: Start with Manual CPC. Maximum Delivery is the most expensive option. (L16)
- Daily budget ≥$50 for Sponsored Content (L17)
- CTR ≥0.44% for Sponsored Content (L21)
- CPC within benchmark: $5-7 average, senior $6.40+ (L22)
- Lead-to-opportunity rate tracked, not just CPL (L23)
- Attribution: 30-day click / 7-day view configured (L24)
- Demographics report reviewed monthly (L25)

## Thought Leader Ads (TLA) Assessment (2026 data)

Thought Leader Ads use employee/executive personal posts as sponsored content.
Non-employee members eligible since March 2025. **6.9x CTR lift** vs standard
formats verified by Fractional Demand's 15-month B2B SaaS portfolio (17.4M
impressions, 6,280 ads, $3.5M spend).

**TLA vs Standard Sponsored Content (verified 2026 benchmarks):**
- TLA average CTR: **4.65%** vs 0.68% standard (6.9x lift)
- TLA average CPC: **$0.51** vs $2.42 standard (~5x cheaper)
- Comment-to-Like ratio: 8.6% TLA vs 1.2% standard (7.2x more comments per like)
- Best-performing accounts hit 26-35% comment-to-like ratios

**Budget allocation sweet spot:**
| TLA Budget % | Avg CTR | Avg CPC |
|--------------|---------|---------|
| 0% | 1.48% | $13.84 |
| 1-10% | 0.69% | $1.16 (lowest CTR — running TLAs without supporting architecture is worse than none) |
| **25-50% (sweet spot)** | **5.08%** | **$0.84** |
| 50%+ | 3.69% | $6.25 (audience exhaustion above 40-50%) |

Practical: **25-40% allocation is the optimal range**. Above 40%, expand target account list first to avoid audience exhaustion. Optimal per-campaign budget: $2,000-$5,000/month.

**Creative lifespan (DO NOT rotate at 4-6 weeks for TLA):**
- Week 1 CTR: ~3.9%
- Week 8-12 peak: 8%+ CTR
- Week 19: real drop-off (rotation cliff)
- **Rotation rules:**
  - CTR >2% at week 6 → keep running (peak ahead)
  - CTR 1-2% at week 6 → monitor weekly
  - CTR <1% at any point → rotate immediately
  - Still strong at week 18 → rotate proactively (cliff incoming)

**Seasonal pattern (auction dynamics, not audience behavior):**
- July-September = TLA peak season (CPC $0.16-$0.38, cheapest of year as enterprise advertisers pull back)
- December = worst month (2.64% CTR, $2.12 CPC — reduce spend)
- January-February = relaunch + test window (low competition)

**3-Layer Playbook (run as stack, not standalone):**
1. **Warm (50% TLA budget):** Days 1-30, target account list + job title, pure value content, zero CTA, let ICP see creator 3-5x before asking
2. **Retarget engagers (30%):** Days 31-60, anyone who engaged with Layer 1 moves to retargeting audience
3. **Convert (20%):** Ongoing, direct CTA (case study, demo, event), they already know who you are

**What works in 2026 TLA copy:**
- Contrarian takes ("Everyone says X. We tested it.")
- Transparent failures
- Specific numbers ("We cut CPL 34% doing this one thing")
- Process reveals (step-by-step)
- Hooks under 150 words before "see more" cutoff
- Raw phone video under 90 seconds
- Promoted organic posts > purpose-built ads

**What is dying:**
- Long-form storytelling as hook (algorithm punishes it)
- Company milestone posts repurposed as TLA
- Generic authority content ("leadership is about…")
- Polished listicle formats
- Links in post body (LinkedIn penalizes)
- CTA-heavy copy in post text
- Same creator past 18 weeks without rotation

Evaluate:
- Are TLAs being used? (If not, HIGH priority recommendation)
- Are they getting **25-40%** of total LinkedIn budget?
- Are the right employees selected (industry credibility, active posters)?
- Is post content authentic and valuable (not salesy)?
- Are TLAs run as a 3-layer stack or as a standalone campaign?

## Ad Format Benchmarks

| Format | Key Metric |
|--------|-----------|
| Document Ads | 7.00% engagement rate |
| Conversation Ads | 50-60% open rate |

**Note:** EU Sponsored Messaging (InMail/Conversation Ads) discontinued since Jan 2022.

## LinkedIn Audience Network

Expert consensus is OFF. Quality is poor, and it dilutes campaign performance data.
Disable LinkedIn Audience Network unless specifically testing with isolated budget.

## ABM Strategy Assessment

For B2B Enterprise accounts:
- Company list uploaded and segmented by tier (Tier 1, 2, 3)
- Custom content per tier (personalized messaging)
- Account penetration tracking (contacts reached per target account)
- Integration with CRM/ABM platform (Demandbase, 6sense, etc.)

## LinkedIn Context

| Setting | Value |
|---------|-------|
| Minimum audience size | 500 (for ads to run) |
| Lead Gen Form CVR benchmark | 13% |
| TLA CPC (verified 2026, B2B SaaS) | $0.51 avg, $0.16 in Aug peak |
| Standard SC CPC (verified 2026) | $2.42 avg |
| TLA vs standard CTR | 6.9x lift (4.65% vs 0.68%) |
| Hierarchy rename | Oct 2025 (Campaign Group → Campaign → Ad) |
| Predictive Audiences | Replaced Lookalikes Feb 2024 |

## Key Thresholds

| Metric | Pass | Warning | Fail |
|--------|------|---------|------|
| CTR (Sponsored Content) | ≥0.44% | 0.30-0.44% | <0.30% |
| CPC (average) | ≤$7.00 | $7-10 | >$10.00 |
| Lead Gen CVR | ≥10% | 5-10% | <5% |
| Message frequency | ≤1/30 days | 1/15-30 days | >1/15 days |
| TLA budget share | 25-40% (sweet spot) | 15-24% or 41-50% | <15% or >50% (audience exhaustion) |
| TLA CTR | ≥4% | 2-4% | <2% |
| TLA CPC | ≤$1.00 | $1.00-$2.00 | >$2.00 |
| TLA creative lifespan | 8-18 weeks | 4-8 weeks | <4 weeks |

## Output

### LinkedIn Ads Health Score

```
LinkedIn Ads Health Score: XX/100 (Grade: X)

Technical Setup:   XX/100  ████████░░  (25%)
Audience:          XX/100  ██████████  (25%)
Creative:          XX/100  ███████░░░  (20%)
Lead Gen:          XX/100  █████░░░░░  (15%)
Budget & Bidding:  XX/100  ████████░░  (15%)
```

### Deliverables
- `LINKEDIN-ADS-REPORT.md`: Full 27-check findings with pass/warning/fail
- TLA adoption roadmap (if not using)
- ABM strategy recommendations (for B2B)
- Lead Gen Form optimization priorities
- Quick Wins sorted by impact
