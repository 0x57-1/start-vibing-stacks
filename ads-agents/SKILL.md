---
name: ads
version: 1.6.0
description: "Multi-platform paid advertising audit and optimization skill. Analyzes Google, Meta, YouTube, LinkedIn, TikTok, Microsoft, and Apple Ads. 250+ checks with scoring, parallel agents, industry templates, and AI creative generation."
argument-hint: "audit | google | meta | youtube | linkedin | tiktok | microsoft | apple | creative | landing | budget | plan <type> | competitor | dna <url> | create | generate | photoshoot"
user-invokable: true
---

<!-- Updated: 2026-05-14 | v1.6: 2026 verified strategies — Google AI Max GA April 2026 (7% lift, DSA upgrades Sept 2026), Meta Andromeda 2026 playbook (8-12 concepts × 2-3 variations, similarity <40%), TikTok Smart+ Catalog Ads 29% CPA improvement, LinkedIn TLA 25-40% budget sweet spot + rotate week 18, Microsoft Copilot 15-25% CTR lift (recalibrated), Apple CPP limit 70 confirmed, Apple Maximize Conversions GA Feb 26 2026 -->

# Ads: Multi-Platform Paid Advertising Audit & Optimization

Comprehensive ad account analysis across all major platforms (Google, Meta,
LinkedIn, TikTok, Microsoft). Orchestrates 17 specialized sub-skills and
10 agents (6 audit + 4 creative).

## Quick Reference

| Command | What it does |
|---------|-------------|
| `/ads audit` | Full multi-platform audit with parallel subagent delegation |
| `/ads google` | Google Ads deep analysis (Search, PMax, YouTube) |
| `/ads meta` | Meta Ads deep analysis (FB, IG, Advantage+) |
| `/ads youtube` | YouTube Ads specific analysis |
| `/ads linkedin` | LinkedIn Ads deep analysis (B2B, Lead Gen) |
| `/ads tiktok` | TikTok Ads deep analysis (Creative, Shop, Smart+) |
| `/ads microsoft` | Microsoft/Bing Ads deep analysis (Copilot, Import) |
| `/ads creative` | Cross-platform creative quality audit |
| `/ads landing` | Landing page quality assessment for ad campaigns |
| `/ads budget` | Budget allocation and bidding strategy review |
| `/ads plan <business-type>` | Strategic ad plan with industry templates |
| `/ads apple` | Apple Ads deep analysis |
| `/ads competitor` | Competitor ad intelligence analysis |
| `/ads math` | PPC financial calculator (CPA, ROAS, break-even, budget forecasting) |
| `/ads test` | A/B test design (hypothesis, significance, duration, sample size) |
| `/ads dna <url>` | Extract brand DNA from website, outputs `brand-profile.json` |
| `/ads create` | Generate campaign concepts + copy briefs, outputs `campaign-brief.md` |
| `/ads generate` | Generate AI ad images from brief, outputs to `ad-assets/` |

## Context Intake (Required: Always Do This First)

Before any audit or analysis, collect this context. Without it, benchmarks will
be generic and recommendations may be wrong for the user's situation.

Ask these questions upfront (combine into one message):

1. **Industry / Business type**: Which best describes you?
   SaaS · E-commerce · Local Service · B2B Enterprise · Info Products · Mobile App ·
   Real Estate · Healthcare · Finance · Agency · Other
2. **Monthly ad spend**: Total budget and per-platform breakdown (approximate is fine)
3. **Primary goal**: Sales / Revenue · Leads / Demos · App Installs · Calls · Brand
4. **Active platforms**: Which platforms are you advertising on?

If the user provides data upfront (e.g. "audit my Google Ads, I spend $5k/mo on SaaS"),
extract context from that and proceed without re-asking.

Use the provided context to:
- Select the correct industry benchmarks from `ads-agents/references/benchmarks.md`
- Apply budget-appropriate recommendations (e.g. Smart Bidding requires 15+ conv/month)
- Calibrate severity scoring (a $500/mo account has different priorities than $50k/mo)

## Orchestration Logic

When the user invokes `/ads audit`, delegate to subagents in parallel:
1. **Collect context** (see Context Intake above; do this first)
2. Collect account data (exports, screenshots, or pasted metrics)
3. Detect business type and identify active platforms
4. Spawn subagents via Task tool with `context: fork`: audit-google, audit-meta, audit-creative, audit-tracking, audit-budget, audit-compliance
5. **Validate**: verify each subagent returned valid JSON scores with required fields before aggregating
6. Collect results and generate unified report with Ads Health Score (0-100)
7. Create prioritized action plan with Quick Wins

For individual commands (`/ads google`, `/ads meta`, etc.), load the relevant
sub-skill directly. Still collect context first if not already provided.

## Creative Workflow

Sequential pipeline (each step is independently runnable):
1. `/ads dna <url>` → `brand-profile.json` in current directory
2. `/ads create` → reads profile + optional audit results → `campaign-brief.md`
3. `/ads generate` → reads brief + profile → `ad-assets/` directory

Requires `GOOGLE_API_KEY` (Gemini default) or `ADS_IMAGE_PROVIDER` + matching key.
If API key is missing, `/ads generate` displays setup instructions and exits; never fails silently.

## Industry Detection

Detect business type from ad account signals:
- **SaaS**: trial_start/demo_request events, pricing page targeting, long attribution windows
- **E-commerce**: purchase events, product catalog/feed, Shopping/PMax campaigns
- **Local Service**: call extensions, location targeting, store visits, directions events
- **B2B Enterprise**: LinkedIn Ads active, ABM lists, high CPA tolerance ($50+), long sales cycle
- **Info Products**: webinar/course funnels, lead gen forms, low-ticket offers
- **Mobile App**: app install campaigns, in-app events, deep linking
- **Real Estate**: listing feeds, property-specific landing pages, geo-heavy targeting
- **Healthcare**: HIPAA compliance flags, healthcare-specific ad policies
- **Finance**: Special Ad Categories declared, financial products compliance
- **Agency**: multiple client accounts, white-label reporting needs

## Quality Gates

Hard rules (never violate these):
- Never recommend Broad Match without Smart Bidding (Google)
- 3x Kill Rule: flag any ad group/campaign with CPA >3x target for pause
- Budget sufficiency: Meta ≥5x CPA per ad set, TikTok ≥50x CPA per ad group
- Learning phase: never recommend edits during active learning phase
- Compliance: always check Special Ad Categories for housing/employment/credit/finance
- Creative: never run silent video ads on TikTok (sound-on platform)
- Attribution: default to 7-day click / 1-day view (Meta), data-driven (Google)
- Andromeda creative diversity: Flag Meta accounts with <10 genuinely distinct creatives
- Privacy infrastructure gate: Always verify tracking stack (Consent Mode V2, CAPI, Events API, AdAttributionKit) before making optimization recommendations

## Reference Files

Load these on-demand as needed; do NOT load all at startup.

All references are at `ads-agents/references/` within this repository.

- `ads-agents/references/scoring-system.md`: Weighted scoring algorithm and grading thresholds
- `ads-agents/references/benchmarks.md`: Industry benchmarks by platform (CPC, CTR, CVR, ROAS)
- `ads-agents/references/bidding-strategies.md`: Bidding decision trees per platform
- `ads-agents/references/budget-allocation.md`: Platform selection matrix, scaling rules, MER
- `ads-agents/references/platform-specs.md`: Creative specifications across all platforms
- `ads-agents/references/conversion-tracking.md`: Pixel, CAPI, EMQ, ttclid implementation
- `ads-agents/references/compliance.md`: Regulatory requirements, ad policies, privacy
- `ads-agents/references/google-audit.md`: 80-check Google Ads audit checklist
- `ads-agents/references/meta-audit.md`: 50-check Meta Ads audit checklist
- `ads-agents/references/linkedin-audit.md`: 27-check LinkedIn Ads audit checklist
- `ads-agents/references/tiktok-audit.md`: 28-check TikTok Ads audit checklist
- `ads-agents/references/microsoft-audit.md`: 24-check Microsoft Ads audit checklist
- `ads-agents/references/brand-dna-template.md`: Brand DNA schema and extraction guide
- `ads-agents/references/image-providers.md`: Provider config (Gemini/OpenAI/Stability/Replicate)
- `ads-agents/references/google-creative-specs.md`: PMax/RSA/YouTube generation-ready specs
- `ads-agents/references/meta-creative-specs.md`: Feed/Reels/Stories specs + safe zones
- `ads-agents/references/linkedin-creative-specs.md`: Single image/video B2B constraints
- `ads-agents/references/tiktok-creative-specs.md`: 9:16 only + safe zone overlay
- `ads-agents/references/youtube-creative-specs.md`: Skippable/Bumper/Shorts/Thumbnail
- `ads-agents/references/microsoft-creative-specs.md`: Multimedia Ads + RSA subset
- `ads-agents/references/gaql-notes.md`: GAQL field compatibility, deduplication patterns, filter scope best practices
- `ads-agents/references/voice-to-style.md`: Brand voice axis to visual attribute mapping for image generation
- `ads-agents/references/copy-frameworks.md`: 6 ad copy frameworks (AIDA, PAS, BAB, 4P, FAB, Star-Story-Solution)
- `ads-agents/references/additional-platforms.md`: Supplementary platform guidance
- `ads-agents/references/mcp-integration.md`: MCP server integration for live API data

## Scoring Methodology

### Ads Health Score (0-100)

Per-platform score using weighted algorithm from `ads-agents/references/scoring-system.md`.
Cross-platform aggregate weighted by budget share:

```
Aggregate = Sum(Platform_Score x Platform_Budget_Share)
```

### Grading

| Grade | Score | Action Required |
|-------|-------|-----------------|
| A | 90-100 | Minor optimizations only |
| B | 75-89 | Some improvement opportunities |
| C | 60-74 | Notable issues need attention |
| D | 40-59 | Significant problems present |
| F | <40 | Urgent intervention required |

### Priority Levels

- **Critical**: Revenue/data loss risk (fix immediately)
- **High**: Significant performance drag (fix within 7 days)
- **Medium**: Optimization opportunity (fix within 30 days)
- **Low**: Best practice, minor impact (backlog)

## Sub-Skills

This skill orchestrates 17 specialized sub-skills:

1. **ads-audit**: Full multi-platform audit with parallel delegation
2. **ads-google**: Google Ads deep analysis (Search, PMax, YouTube)
3. **ads-meta**: Meta Ads deep analysis (FB, IG, Advantage+)
4. **ads-youtube**: YouTube Ads specific analysis
5. **ads-linkedin**: LinkedIn Ads deep analysis
6. **ads-tiktok**: TikTok Ads deep analysis
7. **ads-microsoft**: Microsoft/Bing Ads deep analysis
8. **ads-creative**: Cross-platform creative quality audit
9. **ads-landing**: Landing page quality for ad campaigns
10. **ads-budget**: Budget allocation and bidding strategy
11. **ads-plan**: Strategic ad planning with industry templates
12. **ads-competitor**: Competitor ad intelligence
13. **ads-apple**: Apple Ads deep analysis
14. **ads-dna**: Brand DNA extraction from website URL
15. **ads-create**: Campaign concepts, copy decks, creative briefs
16. **ads-generate**: AI image generation with pluggable providers
17. **ads-math**: PPC financial calculator
18. **ads-test**: A/B test design and experiment planning

## Subagents

For parallel analysis during full audits:
- `audit-google`: Google Ads checks (G01-G80)
- `audit-meta`: Meta Ads checks (M01-M50)
- `audit-creative`: Creative quality for LinkedIn, TikTok, Microsoft
- `audit-tracking`: Conversion tracking health across all platforms
- `audit-budget`: Budget, bidding, structure for LinkedIn, TikTok, Microsoft
- `audit-compliance`: Compliance, settings, performance across all platforms
- `creative-strategist`: Campaign concepts from brand profile + audit results (Opus, maxTurns: 25)
- `visual-designer`: Image generation with brand injection (Sonnet, maxTurns: 30)
- `copy-writer`: Headlines, CTAs, primary text within platform limits (Sonnet, maxTurns: 20)
- `format-adapter`: Asset dimension validation and spec compliance reporting (Haiku, maxTurns: 15)

All subagent files are at `ads-agents/agents/`.
