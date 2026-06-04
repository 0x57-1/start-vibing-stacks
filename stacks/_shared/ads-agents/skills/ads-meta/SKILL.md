---
name: ads-meta
version: 1.6.0
description: "Meta Ads deep analysis covering Facebook and Instagram advertising. Evaluates 50 checks across Pixel/CAPI health, creative diversity and fatigue, account structure, and audience targeting. Includes Advantage+ assessment. Use when user says Meta Ads, Facebook Ads, Instagram Ads, Advantage+, or Meta campaign."
user-invokable: false
---

<!-- Updated: 2026-05-14 | v1.6: Andromeda 2026 playbook (8-12 concepts × 2-3 variations, similarity <40%, 2-3 week fatigue, 20+ tests/month), Advantage+ creative 22% ROAS lift, single-ad-set consolidation -->

# Meta Ads Deep Analysis

## Andromeda AI Engine (2026)

Meta's Andromeda AI engine (global rollout complete Oct 2025) filters ads using
10,000x more complex retrieval models on the NVIDIA Grace Hopper Superchip. Creative
diversity is now the #1 performance lever, replacing targeting and bidding as the
primary optimization surface.

**Similarity Score thresholds (2026 verified):**
- **>60%** = retrieval suppression (ads collapsed under one Entity ID, compete with each other)
- **<40%** = recommended target across active assets (treated as distinct candidates)
- 100 minor variations (color swaps, text tweaks on same template) perform no better than 10 genuinely distinct concepts

**Creative volume reality (2026 data):**
- Top third of advertisers run ~395 live ads at any time; bottom third runs ~296 (33% gap)
- Brands testing 20+ new ads/month see 65% higher ROAS than brands testing <10
- Andromeda-aligned structures deliver 20-35% higher ROAS than legacy structures
- Advantage+ creative drives 22% ROAS lift over manual creative setups
- One ad set with 25 diverse creatives outperformed five ad sets with five each by 17% on conversions, 16% on cost

**The 2026 creative system (recommended workflow):**
1. Build **8-12 conceptually distinct concepts** per campaign (different hooks, formats, emotional triggers, visual treatments)
2. Produce **2-3 variations per concept** (the variations must differ on visual/audio/structural levels Andromeda actually parses, not just headline swaps)
3. Refresh on **2-3 week cycle** (fatigue window has shrunk from 6+ weeks pre-Andromeda)
4. Consolidate into fewer ad sets with more creatives (algorithm performs best when not fragmented)
5. Mix high-production brand assets with native UGC/founder-led content; neither alone wins

## Process

1. Collect Meta Ads data (Ads Manager export, Events Manager screenshot, EMQ scores)
2. Read `ads-agents/references/meta-audit.md` for full 50-check audit
3. Read `ads-agents/references/benchmarks.md` for Meta-specific benchmarks
4. Read `ads-agents/references/scoring-system.md` for weighted scoring
5. Evaluate all applicable checks as PASS, WARNING, or FAIL
6. Calculate Meta Ads Health Score (0-100)
7. Generate findings report with action plan

## What to Analyze

### Pixel / CAPI Health (30% weight)
- Meta Pixel installed and firing on all pages
- Conversions API (CAPI) active (30-40% data loss without it post-iOS 14.5)
- Event deduplication configured (event_id matching, ≥90% dedup rate)
- Event Match Quality (EMQ) ≥8.0 for Purchase event
- All standard events configured (ViewContent, AddToCart, Purchase, Lead)
- Custom conversions created for non-standard events
- Aggregated Event Measurement (AEM) configured for iOS
- Domain verification completed
- Server-side events include customer_information parameters
- Pixel fires with correct currency and value parameters

### Creative (30% weight)
- ≥3 creative formats active (image, video, carousel, collection)
- ≥5 creatives per ad set baseline; **target 8-12 distinct concepts** per campaign with 2-3 variations each (Andromeda 2026 standard)
- Creative fatigue detection: CTR drop >10% week-over-week OR >20% over 14 days = FAIL (Andromeda fatigue window: 2-3 weeks, down from 6+)
- Video creative: 15s max for Stories/Reels, 30s max for Feed
- UGC/testimonial creative tested AND mixed with polished brand assets (both belong in rotation)
- Advantage+ Creative enhancements enabled (drives ~22% ROAS lift over manual)
- Ad copy: headline under 40 chars, primary text under 125 chars
- Creative refresh cadence: every 2-3 weeks for high-spend (>$5K/month → 5-15 new creatives/week)
- Creative Similarity Score <40% across active ads (>60% triggers retrieval suppression)

### Account Structure (20% weight)
- Campaign Budget Optimization (CBO) vs Ad Set Budget (ABO) intentional
- Campaign consolidation: 1-3 campaigns total recommended
- Learning phase health: <30% ad sets in "Learning Limited" (FAIL >50%)
- Budget per ad set: ≥5x target CPA (minimum for learning phase exit)
- Ad set audience overlap <30% (Audience Overlap tool)
- Campaign naming conventions consistent and descriptive
- Advantage+ Sales Campaigns active for e-commerce
- Simplified campaign structure: 1-3 campaigns total (fewer, larger ad sets preferred)

### Audience & Targeting (20% weight)
- Prospecting frequency (7-day): <3.0 (WARNING 3-5, FAIL >5)
- Retargeting frequency (7-day): <8.0 (WARNING 8-12, FAIL >12)
- Custom Audiences: website visitors, customer lists, engagement
- Lookalike Audiences: multiple seed sizes tested (1%, 3%, 5%)
- Advantage+ Audience tested vs manual targeting
- Interest targeting: broad enough for algorithm optimization
- Exclusions: purchasers excluded from prospecting, overlap managed
- Location targeting reviewed for relevance

## Advantage+ Assessment

If Advantage+ features are in use:
- **Advantage+ Sales Campaigns**: catalog connected, existing customer cap set
- **Advantage+ Audience**: performance vs manual audience compared
- **Advantage+ Creative**: enhancements enabled (text, brightness, music)
- **Advantage+ Placements**: enabled (let Meta optimize placement mix)
- **Budget allocation**: Advantage+ campaigns getting fair test budget

## Special Ad Categories

If ads are in restricted categories:
- Special Ad Category declared before campaign creation
- Targeting restrictions verified (no ZIP, age 18-65+ only, no Lookalike)
- Creative compliance with category-specific policies
- Read `ads-agents/references/compliance.md` for full requirements

## EMQ Optimization Guide

| EMQ Score | Status | Action |
|-----------|--------|--------|
| 8.0-10.0 | Excellent | Maintain current setup |
| 6.0-7.9 | Good | Add more customer_information parameters |
| 4.0-5.9 | Fair | Implement CAPI, improve data quality |
| <4.0 | Poor | Critical: CAPI + Enhanced Matching required |

Key parameters to maximize EMQ:
- `em` (email): highest match rate signal
- `ph` (phone): second highest match signal
- `fn`, `ln` (first/last name): improves match accuracy
- `ct`, `st`, `zp` (city, state, zip): geographic matching
- `external_id`: CRM/user ID for cross-device matching

## Key Thresholds

| Metric | Pass | Warning | Fail |
|--------|------|---------|------|
| EMQ (Purchase) | ≥8.0 | 6.0-7.9 | <6.0 |
| Dedup rate | ≥90% | 70-90% | <70% |
| CTR | ≥1.0% | 0.5-1.0% | <0.5% |
| Creative formats | ≥3 | 2 | 1 |
| Creatives per ad set | ≥5 (target 8-12 distinct concepts × 2-3 variations per campaign) | 3-4 | <3 |
| Distinct concepts (Andromeda) | ≥10 genuinely distinct | 5-9 | <5 |
| Creative Similarity Score | <40% | 40-60% | >60% (suppression) |
| Fatigue: CTR WoW drop | <10% | 10-20% | >20% (kill) |
| Learning Limited | <30% | 30-50% | >50% |
| Budget per ad set | ≥5x CPA | 2-5x CPA | <2x CPA |

## Output

### Meta Ads Health Score

```
Meta Ads Health Score: XX/100 (Grade: X)

Pixel / CAPI Health: XX/100  ████████░░  (30%)
Creative:            XX/100  ██████████  (30%)
Account Structure:   XX/100  ███████░░░  (20%)
Audience:            XX/100  █████░░░░░  (20%)
```

### Deliverables
- `META-ADS-REPORT.md`: Full 50-check findings with pass/warning/fail
- EMQ improvement roadmap
- Creative fatigue alerts (any creative with CTR declining >20%)
- Quick Wins sorted by impact
- Advantage+ adoption recommendations

## Threads Placement

Threads placement GA Jan 2026, 400M+ MAU. Lower CPMs than Feed/Stories.
Currently ~0.04% of total spend. Emerging channel. Evaluate:
- Is Threads placement enabled in Advantage+ Placements?
- Monitor CPM and engagement vs other placements
- Early-mover advantage for brands with active Threads presence
