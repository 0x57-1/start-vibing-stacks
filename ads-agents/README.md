# ads-agents — Paid Advertising Intelligence System

> Multi-platform ad audit, strategy, and creative generation for 2026.
> **212 checks · 19 sub-skills · 10 agents · 25 reference files**
> Verified May 2026 with LLM-as-judge (Opus 4.7) and ≥2 source attribution per claim.

---

## Quick Start

```bash
# 1) Audit an existing account (parallel, all platforms)
/ads audit --platforms google,meta,linkedin,tiktok,microsoft

# 2) Extract brand DNA from a website (creates brand-profile.json)
/ads dna https://yourbrand.com

# 3) Generate campaign concepts + copy (creates campaign-brief.md)
/ads create --platforms meta,tiktok,linkedin

# 4) Generate ad images via banana MCP (creates ad-assets/ + manifest)
/ads generate

# 5) Validate generated assets against platform specs
/ads format

# 6) Strategic ad plan (e-commerce / B2B / SaaS templates)
/ads plan

# Specialised tools
/ads competitor    # spy on competitors across 6 platforms
/ads budget        # 70/20/10, 3x kill rule, 20% scaling
/ads math          # CPA / ROAS / break-even / MER calculator
/ads test          # A/B hypothesis + sample-size planner
/ads photoshoot    # 5 product photography styles via banana
```

---

## Structure

```
ads-agents/
├── README.md                       # This file
├── SKILL.md                        # Top-level skill manifest
├── RESEARCH-REPORT.md              # 2026 research evidence
├── SKILLS-UPDATE-REPORT.md         # Update changelog
│
├── agents/                         # 10 specialist subagents
│   ├── audit-google.md             # v1.6 · Google Ads 80 checks
│   ├── audit-meta.md               # v1.6 · Meta 50 checks (Andromeda)
│   ├── audit-tracking.md           # v1.6 · LinkedIn/TikTok/MS tracking
│   ├── audit-creative.md           # v1.6 · LinkedIn/TikTok/MS creative
│   ├── audit-budget.md             # v1.6 · LinkedIn/TikTok/MS budget
│   ├── audit-compliance.md         # v1.6 · GDPR/CCPA/Special Ad Cat
│   ├── creative-strategist.md      # v1.6 · campaign concepts (Opus)
│   ├── copy-writer.md              # v1.6 · platform-compliant copy
│   ├── visual-designer.md          # v1.6 · banana MCP image generation
│   └── format-adapter.md           # v1.6 · spec validator (Haiku)
│
├── skills/                         # 19 sub-skills (auto-injected)
│   ├── ads-audit/                  # Full multi-platform audit orchestrator
│   ├── ads-google/                 # Google Ads deep analysis
│   ├── ads-meta/                   # Meta Ads deep analysis
│   ├── ads-linkedin/               # LinkedIn deep analysis
│   ├── ads-tiktok/                 # TikTok deep analysis
│   ├── ads-microsoft/              # Microsoft/Bing deep analysis
│   ├── ads-apple/                  # Apple Ads (formerly Apple Search Ads)
│   ├── ads-youtube/                # YouTube + CTV + Demand Gen
│   ├── ads-creative/               # Cross-platform creative audit
│   ├── ads-landing/                # Landing page quality (INP/CWV 2026)
│   ├── ads-budget/                 # Budget + bidding strategy
│   ├── ads-competitor/             # Competitor ad intelligence
│   ├── ads-dna/                    # Brand DNA extractor
│   ├── ads-create/                 # Campaign concept generator
│   ├── ads-generate/               # AI image generation
│   ├── ads-photoshoot/             # Product photography styles
│   ├── ads-plan/                   # Strategic media plan
│   ├── ads-math/                   # PPC financial modeling
│   └── ads-test/                   # A/B test design + significance
│
└── references/                     # 25 evidence-backed reference files
    ├── benchmarks.md               # CPC/CTR/CVR by industry, all platforms
    ├── bidding-strategies.md       # Decision trees per platform
    ├── scoring-system.md           # 0-100 + A-F grading
    ├── compliance.md               # GDPR/CCPA, Special Ad Categories
    ├── conversion-tracking.md      # Pixel/CAPI/EMQ/Consent Mode V2
    ├── platform-specs.md           # All ad dimensions + limits 2026
    ├── budget-allocation.md        # 70/20/10, scaling rules
    ├── copy-frameworks.md          # AIDA / PAS / BAB / 4P / FAB / SSS
    ├── voice-to-style.md           # Brand voice → visual attribute map
    ├── brand-dna-template.md       # brand-profile.json schema
    ├── gaql-notes.md               # Google Ads Query Language tips
    ├── mcp-integration.md          # Google Ads MCP setup
    ├── image-providers.md          # banana / DALL-E / Imagen providers
    ├── additional-platforms.md     # Reddit / Pinterest / Snap / X
    ├── google-audit.md             # 80-check Google playbook
    ├── meta-audit.md               # 50-check Meta playbook
    ├── linkedin-audit.md           # 27-check LinkedIn playbook
    ├── tiktok-audit.md             # 28-check TikTok playbook
    ├── microsoft-audit.md          # 24-check Microsoft playbook
    ├── google-creative-specs.md    # PMax / Demand Gen / Shorts
    ├── meta-creative-specs.md      # Feed 4:5, Reels 9:16 safe zone
    ├── tiktok-creative-specs.md    # 9:16 safe box X:40-940 Y:150-1470
    ├── linkedin-creative-specs.md  # 1:1 primary, B2B tone
    ├── microsoft-creative-specs.md # Multimedia ads 1200×628
    └── youtube-creative-specs.md   # Shorts 1080×1420 safe zone
```

---

## How to use

### Auditoria completa (full audit)

```bash
/ads audit --platforms google,meta,linkedin,tiktok,microsoft,apple
```

**O que acontece:**

1. `ads-audit` skill orquestra os subagentes em paralelo (1-3 minutos).
2. Cada agente lê os reference files necessários (`google-audit.md`, `meta-audit.md`, `benchmarks.md`, `scoring-system.md`).
3. Agentes em paralelo: `audit-google`, `audit-meta`, `audit-tracking`, `audit-creative`, `audit-budget`, `audit-compliance`.
4. Cada um grava seu `*-audit-results.md` no diretório atual.
5. Skill agrega tudo num `ADS-AUDIT-REPORT.md` final com score 0-100 + grade A-F por plataforma + aggregate.

**Output esperado:**
```
google-audit-results.md
meta-audit-results.md
tracking-audit-results.md
creative-audit-results.md
budget-audit-results.md
compliance-audit-results.md
ADS-AUDIT-REPORT.md   ← consolidated
```

### Auditoria por plataforma única

```bash
/ads google     # só Google Ads (80 checks: G01-G61 + G-AI + G-PM + G-DG + G-CT)
/ads meta       # só Meta (50 checks: M01-M40 + M-AN + M-CR + M-AT + M-IA + M-TH)
/ads linkedin   # só LinkedIn (27 checks: L01-L25 + L-TLA)
/ads tiktok     # só TikTok (28 checks: T01-T25)
/ads microsoft  # só Microsoft (24 checks: MS01-MS20)
/ads apple      # só Apple Ads (Custom Product Pages, MMP attribution)
/ads youtube    # só YouTube (Demand Gen, CTV, Shorts)
```

### Pipeline criativo

```bash
# Step 1: extract brand identity
/ads dna https://yourbrand.com
# → brand-profile.json (colors, voice axes, mood keywords, imagery)

# Step 2: generate campaign concepts + copy deck
/ads create --platforms meta,tiktok,linkedin --objective conversion
# → campaign-brief.md (3-12 concepts + Copy Deck per platform)

# Step 3: generate images via banana MCP
/ads generate
# → ad-assets/<platform>/<concept-slug>/<format>-<WxH>-v<N>.png
# → generation-manifest.json
# → 3 variants per brief (v1 base, v2 alt angle, v3 lighting variation)

# Step 4: validate specs + safe zones
/ads format
# → format-report.md (PASS/WARNING/FAIL/MISSING per asset)
```

**Andromeda 2026 awareness:** for Meta-heavy budgets, target 8-12 distinct concepts × 2-3 variations. Similarity Score >60% triggers Meta retrieval suppression; <40% is the target across active assets.

### Ferramentas de planejamento

```bash
/ads plan       # full strategic plan (platform mix + phased rollout)
/ads budget     # 70/20/10 rule + 3x kill + 20% scaling check
/ads competitor # ad library spy across 6 platforms
/ads math       # CPA / ROAS / break-even / impression share opportunity
/ads test       # A/B hypothesis + sample size + duration estimator
```

---

## Agentes disponíveis

| Agent | Model | maxTurns | Tools | Responsabilidade | Quando usar |
|-------|-------|----------|-------|------------------|-------------|
| `audit-google` | sonnet | 20 | Read, Bash, Write, Glob, Grep | Google Ads 80-check deep audit (tracking, wasted spend, PMax, AI Max, Demand Gen) | `/ads audit`, `/ads google` |
| `audit-meta` | sonnet | 20 | Read, Bash, Write, Glob, Grep | Meta 50-check audit (Pixel/CAPI, Andromeda creative diversity, Advantage+) | `/ads audit`, `/ads meta` |
| `audit-tracking` | sonnet | 20 | Read, Bash, Write, Glob, Grep | LinkedIn + TikTok + Microsoft tracking (CAPI, ttclid, UET, Consent Mode V2) | `/ads audit` |
| `audit-creative` | sonnet | 20 | Read, Bash, Write, Glob, Grep | LinkedIn + TikTok + Microsoft creative (TLA, Spark, Multimedia, safe zones) | `/ads audit` |
| `audit-budget` | sonnet | 20 | Read, Bash, Write, Glob, Grep | LinkedIn + TikTok + Microsoft budget/bidding (Smart+, TLA allocation) | `/ads audit`, `/ads budget` |
| `audit-compliance` | sonnet | 20 | Read, Bash, Write, Glob, Grep | GDPR/CCPA + Special Ad Categories + lead gen + deprecated features | `/ads audit` |
| `creative-strategist` | **opus** | 25 | Read, Write, Glob | Campaign concept generation (3-12 concepts per Andromeda guidance) | `/ads create` |
| `copy-writer` | sonnet | 20 | Read, Write, Glob | Platform-compliant copy with character validation (AIDA/PAS/BAB/4P/FAB/SSS) | `/ads create` |
| `visual-designer` | sonnet | 30 | Read, Write, Bash, Glob | banana MCP 5-component prompts, 3 variants/brief, hero anchor | `/ads generate` |
| `format-adapter` | **haiku** | 15 | Read, Write, Bash, Glob | Dimension + size + safe-zone validation, missing-format detection | `/ads format` |

---

## Sub-skills disponíveis (19)

| Skill | Plataforma | Checks | Output gerado | Trigger |
|-------|------------|--------|---------------|---------|
| `ads-audit` | All | 212 (orchestrator) | `ADS-AUDIT-REPORT.md` | audit, full ad check |
| `ads-google` | Google | 80 | `google-audit-results.md` | Google Ads, PMax |
| `ads-meta` | Meta | 50 | `meta-audit-results.md` | Meta, FB, IG, Advantage+ |
| `ads-linkedin` | LinkedIn | 27 | `linkedin-audit-results.md` | LinkedIn, B2B, TLA |
| `ads-tiktok` | TikTok | 28 | `tiktok-audit-results.md` | TikTok, Smart+, Spark |
| `ads-microsoft` | Microsoft | 24 | `microsoft-audit-results.md` | Bing, Copilot ads |
| `ads-apple` | Apple Ads | ~15 | `apple-audit-results.md` | Apple Ads, ASA, App Store |
| `ads-youtube` | YouTube | ~20 | `youtube-audit-results.md` | YouTube, Demand Gen, CTV |
| `ads-creative` | All | 21 | `creative-audit-results.md` | creative audit, fatigue |
| `ads-landing` | Cross | ~15 | `landing-audit-results.md` | landing page, CWV, INP |
| `ads-budget` | All | 24 | `budget-audit-results.md` | budget allocation, scaling |
| `ads-competitor` | All | n/a | `competitor-intel.md` | competitor ads, ad spy |
| `ads-dna` | n/a | n/a | `brand-profile.json` | brand DNA, brand profile |
| `ads-create` | All | n/a | `campaign-brief.md` | create campaign, ad concepts |
| `ads-generate` | All | n/a | `ad-assets/`, `generation-manifest.json` | generate ads, create images |
| `ads-photoshoot` | All | n/a | 5× product photos | product photo, photoshoot |
| `ads-plan` | All | n/a | `media-plan.md` | ad strategy, media plan |
| `ads-math` | n/a | n/a | calculated metrics | CPA calculator, break-even |
| `ads-test` | All | n/a | `test-plan.md` | A/B test, experiment design |

Total: 212 audit checks across the deep-platform skills + 21 in `ads-creative` is folded into the platform totals.

---

## Arquivos de referência (25)

| Arquivo | Conteúdo | Usado por |
|---------|----------|-----------|
| `benchmarks.md` | CPC/CTR/CVR por indústria + plataforma 2026 | Todos os audits |
| `bidding-strategies.md` | Decision tree de estratégia por plataforma | audit-budget, ads-budget |
| `scoring-system.md` | Fórmula 0-100 + grade A-F + multiplicadores | Todos os audits |
| `compliance.md` | GDPR/CCPA, Special Ad Categories, three-strike | audit-compliance |
| `conversion-tracking.md` | Pixel/CAPI/EMQ/Consent Mode V2/ttclid | audit-tracking, audit-google, audit-meta |
| `platform-specs.md` | Dimensions + char limits master chart | copy-writer, format-adapter |
| `budget-allocation.md` | 70/20/10, 3x kill, 20% scaling, platform mix | audit-budget, ads-plan |
| `copy-frameworks.md` | AIDA / PAS / BAB / 4P / FAB / Star-Story-Solution | copy-writer, creative-strategist |
| `voice-to-style.md` | Brand voice axes → camera/lighting/color attrs | visual-designer |
| `brand-dna-template.md` | brand-profile.json schema | ads-dna, creative-strategist |
| `gaql-notes.md` | Google Ads Query Language quick reference | audit-google |
| `mcp-integration.md` | Google Ads MCP server setup | audit-google (optional) |
| `image-providers.md` | banana / DALL-E / Imagen comparison | visual-designer |
| `additional-platforms.md` | Reddit / Pinterest / Snap / X (overflow) | ads-plan |
| `google-audit.md` | 80-check Google playbook (G01-G61 + extensions) | audit-google |
| `meta-audit.md` | 50-check Meta playbook (M01-M40 + Andromeda) | audit-meta |
| `linkedin-audit.md` | 27-check LinkedIn playbook (L01-L25 + TLA) | audit-tracking, audit-creative, audit-budget, audit-compliance |
| `tiktok-audit.md` | 28-check TikTok playbook (T01-T25) | audit-tracking, audit-creative, audit-budget, audit-compliance |
| `microsoft-audit.md` | 24-check Microsoft playbook (MS01-MS20) | audit-tracking, audit-creative, audit-budget, audit-compliance |
| `google-creative-specs.md` | PMax + Demand Gen + Shorts dimensions | visual-designer, format-adapter |
| `meta-creative-specs.md` | Feed 4:5, Reels 9:16 safe zone, carousel | visual-designer, format-adapter |
| `tiktok-creative-specs.md` | 9:16 only, safe box X:40-940 Y:150-1470 | visual-designer, format-adapter |
| `linkedin-creative-specs.md` | 1:1 primary, B2B tone constraints | visual-designer, format-adapter |
| `microsoft-creative-specs.md` | Multimedia Ads 1200×628, vertical video Apr 2025 | visual-designer, format-adapter |
| `youtube-creative-specs.md` | Shorts 1080×1420 safe zone, thumbnail rules | visual-designer, format-adapter |

---

## Fluxo de auditoria completa

```
┌──────────────────────────────────────────────────────────────────────┐
│  /ads audit --platforms google,meta,linkedin,tiktok,microsoft        │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
                                 ▼
                  ┌─────────────────────────────┐
                  │  ads-audit skill            │
                  │  (orchestrator)             │
                  └──────────────┬──────────────┘
                                 │
        ┌───────────┬────────────┼────────────┬───────────┬───────────┐
        ▼           ▼            ▼            ▼           ▼           ▼
  ┌──────────┐┌──────────┐┌──────────────┐┌─────────────┐┌──────────┐┌────────────┐
  │ audit-   ││ audit-   ││ audit-       ││ audit-      ││ audit-   ││ audit-     │
  │ google   ││ meta     ││ tracking     ││ creative    ││ budget   ││ compliance │
  │ (80)     ││ (50)     ││ (LI+TT+MS:7) ││ (LI+TT+MS:21)││ (24)    ││ (18 + X)   │
  └─────┬────┘└─────┬────┘└──────┬───────┘└──────┬──────┘└─────┬────┘└──────┬─────┘
        │           │            │               │             │            │
        ▼           ▼            ▼               ▼             ▼            ▼
  google-     meta-       tracking-       creative-      budget-     compliance-
  audit-      audit-      audit-          audit-         audit-      audit-
  results.md  results.md  results.md      results.md     results.md  results.md
        │           │            │               │             │            │
        └───────────┴────────────┴───────┬───────┴─────────────┴────────────┘
                                         │
                                         ▼
                         ┌──────────────────────────────┐
                         │ Aggregation by ads-audit     │
                         │   - Per-platform 0-100 score │
                         │   - Aggregate score          │
                         │   - Grade A-F                │
                         │   - Quick Wins list          │
                         │   - Critical issues          │
                         └──────────────┬───────────────┘
                                        │
                                        ▼
                              ADS-AUDIT-REPORT.md
                                  (final)
```

Subagentes rodam em **paralelo** (Read-only acesso aos references + dados do usuário, escrita isolada de output files), reduzindo audit completo para ~2-3 minutos com 5 plataformas.

---

## Scoring

Cada plataforma recebe um score 0-100 calculado por:

```
score = Σ(check_weight × multiplier × result_value) / max_possible × 100

result_value: PASS = 1.0 | WARNING = 0.5 | FAIL = 0.0
multiplier:   Critical = 5.0 | High = 3.0 | Medium = 2.0 | Low = 1.0
category weights: per skill (e.g. Conversion Tracking 25%, Wasted Spend 20%...)
```

**Grade scale:**

| Grade | Score | Interpretação |
|-------|-------|---------------|
| A | 90-100 | Health excelente, otimizações marginais |
| B | 80-89 | Saudável, alguns ajustes específicos |
| C | 70-79 | Performance OK, opportunities significativas |
| D | 60-69 | Sérios gaps, refactor recomendado |
| F | <60 | Quebrado em fundamentals (tracking/budget/structure) |

Detalhe em `references/scoring-system.md`.

---

## Thresholds rápidos (2026)

### Conversion tracking (universais)

| Métrica | Pass | Warning | Fail |
|---------|------|---------|------|
| EMQ Meta (Purchase) | ≥8.0 | 6.0-7.9 | <6.0 |
| Dedup rate Meta | ≥90% | 70-90% | <70% |
| Consent Mode V2 (EEA) | Implementado | Basic mode | Não implementado |
| LinkedIn CAPI | Ativo (GA 2025) | Insight Tag only | Sem tracking |
| TikTok ttclid passback | Ativo | Parcial | Ausente |

### Creative (Andromeda + cross-platform)

| Platform | Distinct concepts | Variations | Refresh cadence |
|----------|-------------------|------------|-----------------|
| Meta | 8-12 (similarity <40%) | 2-3 por concept | 2-3 semanas |
| TikTok | 6-10 | 2-3 + Symphony AI | 7-10 dias |
| LinkedIn | 4-6 | 1-2 | 4-6 semanas (TLA: 8-12 weeks peak) |
| Google/Microsoft | 3-5 | RSA 8+ headlines | 8-12 semanas |
| YouTube | 6-10 (Demand Gen: creative drives 70-80%) | thumbnail + hook + middle + payoff | 2-4 semanas |

### Performance benchmarks (Pass thresholds)

| Plataforma | Good CTR | Good CPC | Notas |
|------------|----------|----------|-------|
| Google Search | ≥3.0% | varies | Branded ≥10% |
| Google PMax | ≥1.0% | varies | Ad Strength Good/Excellent |
| Meta | ≥1.0% | $0.50-2.00 | EMQ ≥8 obrigatório |
| LinkedIn (SC) | ≥0.44% | $5-7 | TLA: ≥2.68% mediana |
| TikTok | ≥1.0% | $0.50-1.00 | 40-60% mais barato que Meta CPM |
| Microsoft | ≥2.83% | $1.20-1.55 | 20-35% mais barato que Google |
| YouTube Shorts | varies | varies | View-through rate ≥30% |

### Budget thresholds

| Regra | Valor |
|-------|-------|
| 70/20/10 rule | 70% proven, 20% scaling, 10% testing |
| 20% Rule | Nunca aumentar budget mais de 20%/vez |
| 3× Kill Rule | Pausar tudo com CPA >3× target |
| LinkedIn min budget | $50/dia Sponsored Content |
| TikTok learning phase | ≥50 conversões/7 dias por ad group |
| Meta learning phase | <30% ad sets em Learning Limited |
| Google Demand Gen min | $100/dia Max Conv ou 10× target CPA |

### Char limits (2026 verificado)

| Plataforma / Formato | Headline | Primary | Description |
|----------------------|----------|---------|-------------|
| Google RSA | 30 chars × 3-15 | n/a | 90 chars × 2-4 |
| Meta Feed | 40 chars | 125 chars | n/a |
| Meta Video | 27 chars | 125 chars | n/a |
| Meta Carousel card | 32 chars | 125 chars | 18-20 chars |
| Meta Reels primary | n/a | 72 chars visible | n/a |
| LinkedIn SC | 70 chars (200 max) | 150 chars (600 max) | 100 chars (desktop) |
| TikTok | n/a | 100 chars ad text | 25 chars display name |
| Microsoft RSA | 30 chars | n/a | 90 chars |
| YouTube companion | 15 chars | 35 chars × 2 lines | n/a |

---

## Dependências externas

### Obrigatórias

- **Python 3.12+** com `Pillow>=11.0.0` para validação de dimensões (`format-adapter` agent).
- **`bash`, `git`, `grep`, `glob`** standard tools (Read/Write via Claude Code).

### Opcionais (por funcionalidade)

| Feature | Dependência | Tipo | Fallback |
|---------|-------------|------|----------|
| Image generation (`/ads generate`, `/ads photoshoot`) | **banana MCP** server | MCP externo | `scripts/generate_image.py` (deprecated, requer `GOOGLE_API_KEY`, 2 variantes em vez de 3, sem reference anchor) |
| Google Ads automated data pull | **Google Ads MCP** | MCP externo (oficial Google) | Manual export upload pelo usuário |
| Brand DNA scraping (`/ads dna`) | `mcp__web-scraper__scrape_url` + `mcp__web-scraper__take_screenshot` | MCP | Input manual do usuário |
| Competitor intel (`/ads competitor`) | `mcp__web-scraper__facebook_adlib_search`, `google_search`, `scrape_url` | MCP | Input manual de URLs de competidores |
| Apple Ads data | Apple Search Ads API + MMP (Adjust/AppsFlyer/Singular) | API externa | Manual CSV upload |

### Variáveis de ambiente

```bash
# banana MCP (custom Gemini wrapper)
BANANA_MCP_HOST=...
BANANA_PRESETS_DIR=.banana/presets/

# Google Ads (se rodando data pull automatizado)
GOOGLE_ADS_CLIENT_ID=...
GOOGLE_ADS_CLIENT_SECRET=...
GOOGLE_ADS_DEVELOPER_TOKEN=...
GOOGLE_ADS_CUSTOMER_ID=...

# Fallback image generation
GOOGLE_API_KEY=...

# (Opcional) Web scraper MCP key
BRAVE_API_KEY=...
```

---

## Versionamento

- **Agents**: v1.5.0 → v1.6.0 (May 2026 verification pass, LLM-as-judge Opus 4.7 ≥98% confidence + ≥2 sources)
- **Skills**: v1.5 → v1.6 (Andromeda 2026, AI Max GA, Smart+ Catalog Ads, TLA playbook)
- **References**: incrementally updated, marked with `<!-- Updated: YYYY-MM-DD | vX.Y -->` headers

Ver `SKILLS-UPDATE-REPORT.md` para changelog detalhado.

---

## Manutenção

- Os agentes leem arquivos de `references/` on-demand — **nunca cole o conteúdo de references dentro do agent prompt**. Mantém o context window limpo.
- Para adicionar uma nova plataforma: criar `references/<platform>-audit.md`, criar `skills/ads-<platform>/SKILL.md`, e adicionar checks ao agente apropriado (`audit-tracking`, `audit-creative`, `audit-budget`, `audit-compliance` para plataformas não-Google/Meta).
- Para atualizar thresholds: editar **somente** o reference file relevante — agents são thresholds-agnósticos por design.
