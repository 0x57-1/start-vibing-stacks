---
name: ads-creative
version: 1.6.0
description: "Cross-platform creative quality audit covering ad copy, video, image, and format diversity across all platforms. Detects creative fatigue, evaluates platform-native compliance, and provides production priorities. Use when user says creative audit, ad creative, creative fatigue, ad copy, ad design, or creative review."
user-invokable: false
---

<!-- Updated: 2026-05-14 | v1.6: Andromeda 2026 (8-12 distinct concepts × 2-3 variations, similarity <40%, 2-3 week fatigue, 20+ tests/month), Meta Creative Similarity Score now visible in Ads Manager -->

# Cross-Platform Creative Quality Audit

## Process

1. Collect creative assets or performance data from active platforms
2. Read `ads-agents/references/platform-specs.md` for creative specifications
3. Read `ads-agents/references/benchmarks.md` for CTR/engagement benchmarks
4. Read `ads-agents/references/scoring-system.md` for weighted scoring algorithm
5. **Validate**: confirm at least one platform has creative data (assets or performance metrics) before proceeding
6. Evaluate creative quality per platform
7. Assess cross-platform creative consistency
8. **Validate**: verify fatigue signals reference actual performance trends, not assumptions
9. Generate production priority recommendations

## Per-Platform Assessment

### Google Ads Creative
- RSA: ≥8 unique headlines, ≥3 descriptions per ad group
- RSA ad strength: "Good" or "Excellent"
- Pin usage: minimal and strategic (over-pinning kills RSA flexibility)
- Extensions: sitelinks (≥4), callouts (≥4), structured snippets, image
- PMax asset groups: text + image + video + optional product feed
- YouTube: video quality, hook, subtitles (see ads-youtube sub-skill)

### Meta Ads Creative (Andromeda 2026)
- Format diversity: ≥3 formats active (image, video, carousel, collection)
- Creative volume: **target 8-12 conceptually distinct concepts** per campaign × 2-3 variations each (Andromeda standard). Top-third advertisers run ~395 live ads at any time
- Fatigue detection: CTR declining >10% week-over-week OR >20% over 14 days = FAIL. **Andromeda fatigue window: 2-3 weeks** (down from 6+ pre-Andromeda)
- High-spend accounts (>$5K/month): 5-15 new creatives/week required
- Creative Similarity Score (visible in Ads Manager): keep **<40%** across active assets; >60% triggers retrieval suppression
- Video length: 15s max Stories/Reels, 30s max Feed
- UGC/testimonial content tested AND mixed with polished brand assets (both belong in rotation)
- Advantage+ Creative enhancements enabled (~22% ROAS lift vs manual)
- Headline under 40 chars, primary text under 125 chars
- Variations must differ at visual/audio/structural level (not just headline swaps)

### LinkedIn Creative
- Thought Leader Ads active, ≥30% budget for B2B
- Format diversity: ≥2 formats tested (single image, carousel, video, document)
- Video ads tested
- Creative refresh: every 4-6 weeks
- Professional tone appropriate for platform

### TikTok Creative
- ≥6 creatives per ad group (Critical requirement)
- All video 9:16 vertical 1080x1920 (non-negotiable)
- Native-looking content (not corporate)
- Hook in first 1-2 seconds
- No creative active >7 days with declining CTR
- Spark Ads tested (~3% CTR vs ~2% standard)
- Sound-on optimization (never silent)
- Safe zone compliance: X:40-940, Y:150-1470
- Trending audio used

### Microsoft Creative
- RSA: ≥8 headlines, ≥3 descriptions
- Multimedia Ads tested (unique rich format)
- Ad copy optimized for Bing demographics (older, higher income, professional)
- Action Extension utilized (unique to Microsoft)
- Filter Link Extension tested

## Creative Fatigue Detection

### Signals of Fatigue
| Signal | Threshold | Action |
|--------|-----------|--------|
| CTR declining | >20% over 14 days | Refresh creative |
| Frequency (Meta) | >5.0 prospecting, >12.0 retargeting | New audience or creative |
| Watch time declining (TikTok) | <3s average | New hook needed |
| QS declining (Google) | Drop of 2+ points | Refresh ad copy |
| Engagement rate drop | >30% decline | Full creative overhaul |

### Refresh Cadence by Platform (2026 — Andromeda compressed Meta windows)
| Platform | Recommended Refresh |
|----------|-------------------|
| TikTok | Every 7-10 days (fastest fatigue) |
| Meta | Every 2-3 weeks (Andromeda compressed; was 14-21d) |
| Meta (high spend >$5K/mo) | 5-15 new creatives per week |
| LinkedIn Standard | Every 4-6 weeks |
| LinkedIn Thought Leader Ads | Let winners run — peak CTR weeks 8-12, rotate ~week 18 |
| Google Search | Every 8-12 weeks |
| Microsoft | Every 8-12 weeks |
| YouTube | Every 4-8 weeks |

## Format Diversity Matrix

Evaluate which formats are active per platform:

| Format | Google | Meta | LinkedIn | TikTok | Microsoft |
|--------|--------|------|----------|--------|-----------|
| Static Image | RSA image ext | ✅ | ✅ | ❌ | Multimedia |
| Video | YouTube, PMax | ✅ | ✅ | ✅ (required) | ✅ (9:16 vertical, April 2025) |
| Carousel | ❌ | ✅ | ✅ | ❌ | ❌ |
| Collection | ❌ | ✅ | ❌ | ❌ | ❌ |
| Document | ❌ | ❌ | ✅ | ❌ | ❌ |
| Shopping | PMax, Shopping | Catalog | ❌ | Shop | Shopping |

**Apple Ads Format Support:**

| Format | Apple Ads |
|--------|-----------|
| Static Image | ✅ (Custom Product Pages) |
| Video | ✅ (App preview videos) |
| Search Tab | ✅ (banner) |
| Today Tab | ✅ (editorial-style) |

## Andromeda Creative Similarity Score (Meta — 2026)

Meta's Andromeda engine (global rollout complete October 2025) clusters ads with
>60% similarity under a single Entity ID and suppresses delivery. 100 minor
variations (color swaps, small text changes) perform no better than 10 genuinely
distinct creatives. **Creative Similarity Score is now visible in Ads Manager.**

**Thresholds:**
- >60% similarity = retrieval suppression (ads compete with each other, not expand reach)
- <40% similarity = recommended target across active assets
- Variations must register at visual / audio / structural level, not just copy

**Evaluate:**
- Are creatives genuinely diverse in concept, angle, and format?
- Are creatives passing the **8-12 distinct concepts × 2-3 variations** test?
- Flag accounts relying on iterative variations rather than distinct concepts
- Recommend testing fundamentally different hooks, formats, emotional triggers, and value propositions (not just A/B'd copy)
- Are brands testing 20+ new ads/month? (Below 10 = 65% lower ROAS vs above 20)

## Symphony Automation Awareness (TikTok, 2025)

TikTok's Symphony AI (2025) generates creative variations from product URLs. Assess:
- Whether account uses AI-generated vs original creatives
- Quality and performance comparison of Symphony vs manual creatives
- Impact on creative refresh strategy (Symphony can accelerate iteration)

## Creative Health Scoring Weights

```
Format Diversity:      25%  ████████░░
Fatigue Signals:       25%  ████████░░
Platform Compliance:   20%  ██████░░░░
Refresh Cadence:       15%  █████░░░░░
Volume:                15%  █████░░░░░
```

Grade: A (90-100), B (75-89), C (60-74), D (40-59), F (<40).

## Creative Check IDs

| ID | Check | Severity |
|----|-------|----------|
| CR-01 | Format diversity: >=3 formats per platform | High |
| CR-02 | Creative volume: meets platform minimums | High |
| CR-03 | Fatigue detection: CTR/engagement declining past thresholds | Critical |
| CR-04 | Refresh cadence: within platform-recommended cycle | High |
| CR-05 | Platform compliance: specs, safe zones, text limits | Critical |
| CR-06 | Hook quality: first 1-5s engagement (video) or headline impact (static) | High |
| CR-07 | UGC ratio: UGC/testimonial content tested on Meta and TikTok | Medium |
| CR-08 | Video specs: codec, resolution, aspect ratio per platform | Medium |
| CR-09 | Safe zone compliance: critical elements within 900x1000px usable area | Medium |
| CR-10 | Andromeda diversity: genuinely distinct concepts, not iterative variations (Meta) | High |

## Universal Creative Best Practices

### Cross-Platform Safe Zone
- 900x1000px usable area works across all vertical placements
- Keep critical elements centered and within safe margins
- Test on mobile devices (75%+ of ad impressions are mobile)

### Ad Copy Principles
- Lead with benefit, not feature
- Include clear CTA (what should they do next?)
- Match ad message to landing page (message match)
- Use numbers and specifics over vague claims
- Test emotional vs rational appeals

### Video Production Standards
- H.264 codec, AAC audio, MP4 container
- Minimum 720p (1080p preferred)
- Subtitles/captions always (accessibility + sound-off viewing)
- Brand mention within first 5s (awareness) or at CTA (performance)

## Output

### Creative Quality Report

```
Cross-Platform Creative Health

Google:     ████████░░  X/X checks passing
Meta:       ██████████  X/X checks passing
LinkedIn:   ███████░░░  X/X checks passing
TikTok:     █████░░░░░  X/X checks passing
Microsoft:  ████████░░  X/X checks passing
```

### Deliverables
- `CREATIVE-AUDIT-REPORT.md`: Per-platform creative assessment
- Fatigue alerts (any creative past refresh cadence)
- Format diversity gaps per platform
- Production priority list (most impactful creative to produce next)
- Quick Wins (format conversions, CTA changes, Spark Ads setup)
