// @sv-version: 1.1.0
/**
 * Optional TypeSafe judge for UserPromptSubmit.
 * No TYPESAFE_API_KEY (and SVS_JEV=0) → caller keeps regex routing.
 * Questions are facts about the prompt. Measured 2026-09-27 on jev-1.13:
 * negation, ads, WordPress, theme-in-a-script, and safe_ship vs attention.
 * Timeout or HTTP error → null (regex for that turn). Never log the key.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const JUDGE_MS = 1200;
const ENDPOINT = 'https://api.typesafe.ai/v1/systemone';

export type JevKind = 'ship' | 'status' | 'work';
export type JevGate = 'safe_ship' | 'attention' | 'do_not_ship';
export type JevBand = 'yes' | 'no' | 'review';

export type SecurityLane = 'source_review' | 'passive_osint' | 'authorized_active' | 'not_security';
export type AdsPlatform = 'google' | 'meta' | 'tiktok' | 'several' | 'not_ads';
export type StackPick = 'octane_server' | 'php_http_client' | 'fastapi_background' | 'not_a_stack_pick';

export interface JevDecision {
  kind: JevKind | null;
  gate: JevGate | null;
  ads: JevBand;
  wordpress: JevBand;
  visualUi: JevBand;
  auth: JevBand;
  ownApi: JevBand;
  web: JevBand;
  securityLane: SecurityLane | null;
  adsPlatform: AdsPlatform | null;
  stackPick: StackPick | null;
  email: JevBand;
  toolFailure: JevBand;
  bundleMismatch: JevBand;
  aiMarks: JevBand;
  highImpact: JevBand;
}

interface Answer {
  type?: string;
  choice?: string;
  confidence?: number;
  noul?: number;
}

const QUESTIONS = {
  kind: {
    type: 'choice',
    instructions:
      'What is `prompt` asking for? Negation counts: não publique / não é urgente means they are refusing a ship. A push notification is not a git push.',
    criteria: {
      ship: 'Commit, git push, or npm publish in this turn',
      status: 'Only check whether something already shipped (npm, CI, deploy)',
      work: 'Edit, explain, or review. Writing an email or a push notification is work, not a publish.',
    },
  },
  gate: {
    type: 'choice',
    instructions: 'May code commit and push on this prompt?',
    criteria: {
      safe_ship:
        'They asked to commit, push, or publish, and they did not say tests are failing',
      attention:
        'They asked to ship but also said tests, typecheck, or the build are failing',
      do_not_ship: 'They did not ask to commit, push, or publish',
    },
  },
  about_paid_ads: {
    type: 'noul',
    instructions: 'The prompt is about paid ads, ad review, cloaking, or clockers',
    criteria: {
      true: 'Meta, Google, TikTok, ad review, clocker, cloaking',
      false: 'No ad-delivery topic',
    },
  },
  about_wordpress: {
    type: 'noul',
    instructions: "The prompt is about the user's WordPress site or its plugins",
  },
  about_visual_ui: {
    type: 'noul',
    instructions:
      'The prompt asks to change how a screen looks (layout, CSS, components). A CLI script that merely has the word theme in its name does not count.',
  },
  about_auth: {
    type: 'noul',
    instructions:
      'The prompt is about auth, cookies, tokens, or secrets in application code',
  },
  about_own_api: {
    type: 'noul',
    instructions:
      'The prompt is about connecting an API the user pays for, including TypeSafe or TYPESAFE_API_KEY',
  },
  needs_public_web: {
    type: 'noul',
    instructions:
      'A correct answer requires searching the public web. npm view, git, and gh do not count as web search.',
  },
  security_lane: {
    type: 'choice',
    instructions: 'What security lane does `prompt` ask for? A normal bugfix is not security.',
    criteria: {
      source_review: 'Review code, routes, or config the user owns',
      passive_osint: 'Public headers, TLS, or DNS only. No exploit.',
      authorized_active: 'They own the host or it is in a stated bounty, and they want an active check',
      not_security: 'Not a security task',
    },
  },
  ads_platform: {
    type: 'choice',
    instructions: 'Which paid-ads platform is `prompt` about?',
    criteria: {
      google: 'Google Ads, Search, or Performance Max',
      meta: 'Meta, Facebook, or Instagram ads',
      tiktok: 'TikTok ads',
      several: 'More than one ads platform, or a full ads audit',
      not_ads: 'Not paid advertising',
    },
  },
  stack_pick: {
    type: 'choice',
    instructions: 'Is `prompt` choosing one of these tools? A normal feature is not a stack pick.',
    criteria: {
      octane_server: 'FrankenPHP vs RoadRunner vs Swoole',
      php_http_client: 'Laravel Http client vs Saloon vs a vendor SDK',
      fastapi_background: 'FastAPI BackgroundTasks vs ARQ, Dramatiq, Celery, or Temporal',
      not_a_stack_pick: 'Not that choice',
    },
  },
  about_email: {
    type: 'noul',
    instructions:
      'The prompt asks to write, rewrite, or review an email or a push notification. A source file whose name contains email does not count.',
  },
  about_tool_failure: {
    type: 'noul',
    instructions:
      'The prompt is about a failed agent tool call: timeout, hook block, spawn error, or Cursor save-file prompt',
  },
  about_bundle_mismatch: {
    type: 'noul',
    instructions:
      'The server returns HTTP 200 with empty logs and the browser still shows the wrong UI',
  },
  about_ai_marks: {
    type: 'noul',
    instructions:
      'The prompt asks to strip AI watermarks, C2PA, or Claude marks from a file the user owns',
  },
  about_high_impact: {
    type: 'noul',
    instructions:
      'The prompt asks an agent to send a payment, delete data, send email, or write to production',
  },
} as const;

export function readTypesafeKey(projectDir: string): string {
  if ((process.env['SVS_JEV'] || '').trim() === '0') return '';
  const fromEnv = (process.env['TYPESAFE_API_KEY'] || '').trim();
  if (fromEnv) return fromEnv;
  try {
    const path = join(projectDir, '.env');
    if (!existsSync(path)) return '';
    for (const rawLine of readFileSync(path, 'utf8').split('\n')) {
      let line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      if (line.startsWith('export ')) line = line.slice(7).trim();
      const eq = line.indexOf('=');
      if (eq < 0) continue;
      if (line.slice(0, eq).trim() !== 'TYPESAFE_API_KEY') continue;
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      return value.trim();
    }
  } catch {
    return '';
  }
  return '';
}

/** Drop credential-shaped values before they leave the machine. Keep the key name. */
export function redactForJudge(prompt: string): string {
  return prompt
    .replace(/((?:TYPESAFE_|API_|SECRET_|TOKEN_|PASSWORD_)?[A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)\s*=\s*)(\S+)/gi, '$1[redacted]')
    .replace(/\bBearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/\b(?:sk|rk|ts)_[A-Za-z0-9_\-]{16,}\b/g, '[redacted-token]')
    .slice(0, 4000);
}

function band(n: number | undefined): JevBand {
  if (typeof n !== 'number' || Number.isNaN(n)) return 'review';
  if (n >= 0.7) return 'yes';
  if (n <= 0.3) return 'no';
  return 'review';
}

function choiceOf<T extends string>(
  answer: Answer | undefined,
  allowed: readonly T[],
  minConf: number
): T | null {
  if (!answer || answer.type !== 'choice') return null;
  const conf = answer.confidence;
  const choice = answer.choice;
  if (typeof conf !== 'number' || conf < minConf) return null;
  if (!choice || !allowed.includes(choice as T)) return null;
  return choice as T;
}

export function decisionFromAnswers(answers: Record<string, Answer> | undefined): JevDecision | null {
  if (!answers) return null;
  const kind = choiceOf(answers['kind'], ['ship', 'status', 'work'] as const, 0.75);
  const gate = choiceOf(answers['gate'], ['safe_ship', 'attention', 'do_not_ship'] as const, 0.85);
  const noul = (id: string) => {
    const row = answers[id];
    return row && row.type === 'noul' ? row.noul : undefined;
  };
  const decision: JevDecision = {
    kind,
    gate,
    ads: band(noul('about_paid_ads')),
    wordpress: band(noul('about_wordpress')),
    visualUi: band(noul('about_visual_ui')),
    auth: band(noul('about_auth')),
    ownApi: band(noul('about_own_api')),
    web: band(noul('needs_public_web')),
    securityLane: choiceOf(
      answers['security_lane'],
      ['source_review', 'passive_osint', 'authorized_active', 'not_security'] as const,
      0.75
    ),
    adsPlatform: choiceOf(
      answers['ads_platform'],
      ['google', 'meta', 'tiktok', 'several', 'not_ads'] as const,
      0.75
    ),
    stackPick: choiceOf(
      answers['stack_pick'],
      ['octane_server', 'php_http_client', 'fastapi_background', 'not_a_stack_pick'] as const,
      0.75
    ),
    email: band(noul('about_email')),
    toolFailure: band(noul('about_tool_failure')),
    bundleMismatch: band(noul('about_bundle_mismatch')),
    aiMarks: band(noul('about_ai_marks')),
    highImpact: band(noul('about_high_impact')),
  };
  const routed =
    decision.email === 'yes' ||
    decision.toolFailure === 'yes' ||
    decision.bundleMismatch === 'yes' ||
    decision.aiMarks === 'yes' ||
    decision.highImpact === 'yes' ||
    decision.ads === 'yes' ||
    decision.wordpress === 'yes' ||
    decision.auth === 'yes' ||
    decision.ownApi === 'yes' ||
    (decision.securityLane !== null && decision.securityLane !== 'not_security') ||
    (decision.adsPlatform !== null && decision.adsPlatform !== 'not_ads') ||
    (decision.stackPick !== null && decision.stackPick !== 'not_a_stack_pick');
  if (!kind && !gate && !routed) return null;
  return decision;
}

export async function judgeTurn(opts: {
  projectDir: string;
  prompt: string;
  stack: string;
}): Promise<JevDecision | null> {
  const key = readTypesafeKey(opts.projectDir);
  if (!key) return null;
  const prompt = redactForJudge(opts.prompt).trim();
  if (!prompt) return null;

  const body = JSON.stringify({
    model: 'jev-latest',
    state: {
      prompt,
      stack: `${opts.stack}. Local commands: npm, git, gh. Do not browse for those.`,
    },
    questions: QUESTIONS,
  });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), JUDGE_MS);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as { answers?: Record<string, Answer> };
    return decisionFromAnswers(payload.answers);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function renderJevDirective(d: JevDecision, target: string): string {
  const lines = ['', 'JEV — structured gate (key present). Regex still runs; these lines override it:'];
  if (d.gate === 'do_not_ship') {
    lines.push('  Do NOT commit, push, or publish. Ship-words in the prompt are negated or absent.');
  } else if (d.gate === 'attention') {
    lines.push('  ATTENTION: they asked to ship and said tests, typecheck, or the build are failing.');
    lines.push('  Do NOT commit/push. Ask: Risk / Evidence / Options (proceed | fix first | abort).');
  } else if (d.gate === 'safe_ship') {
    lines.push('  Ship was requested and failing tests were not mentioned. Still stop if the tree is off main, a secret is in the diff, or tests are actually red.');
  }
  if (d.kind === 'status') {
    lines.push('  Status only. Use npm, git, or gh. Do not spawn research-web. Do not start finalize.');
  } else if (d.web === 'no') {
    lines.push('  Do not spawn research-web.');
  } else if (d.web === 'yes' && d.kind === 'work') {
    lines.push('  Public web research is warranted before editing.');
  }
  if (d.visualUi === 'no') {
    lines.push('  Not a visual UI task. Skip THEME APPLY even if the word theme appears.');
  }
  if (d.ads === 'yes') {
    lines.push('  LOAD memory advertising-optimization-authorization before acting on ads terms.');
  }
  if (d.wordpress === 'yes') {
    lines.push('  LOAD memory owned-wordpress-plugin-ops. Owned site only. No nulled keys.');
  }
  if (d.auth === 'yes') {
    lines.push('  LOAD memory defensive-security-review. Review auth, cookies, tokens, secrets.');
    if (target === 'grok') lines.push('  GROK: spawn security-auditor (not general-purpose) if code will change.');
    if (target === 'kimi') lines.push('  KIMI: Read .claude/agents/security-auditor.md and execute inline.');
  }
  if (d.ownApi === 'yes') {
    lines.push('  LOAD skills typesafe-jev and own-subscription-integration. Never print TYPESAFE_API_KEY. Never EXPO_PUBLIC / NEXT_PUBLIC / VITE_.');
  } else {
    lines.push('  Do not load skill typesafe-jev this turn.');
  }
  if (d.web === 'yes' && d.kind === 'work') {
    if (target === 'kimi') lines.push('  KIMI: Read .claude/agents/research-web.md and execute inline.');
  }
  if (d.securityLane === 'source_review') {
    lines.push('  LOAD skill security-assessment-ops Lane A (owned source). Do not active-scan.');
  } else if (d.securityLane === 'passive_osint') {
    lines.push('  LOAD skill security-assessment-ops Lane B only. Public headers, TLS, DNS. No exploit.');
  } else if (d.securityLane === 'authorized_active') {
    lines.push('  LOAD skill security-assessment-ops Lane C only if ownership or bounty scope is in the prompt. Otherwise Lane B.');
  }
  if (d.email === 'yes') {
    lines.push('  LOAD skill email-push-marketing. Run its Jev block on the copy before rewriting. Hard-limit math stays in code.');
  }
  if (d.toolFailure === 'yes') {
    lines.push('  LOAD skill tool-resilience. Classify the error before any retry. Max 2 retries stays in code.');
  }
  if (d.bundleMismatch === 'yes') {
    lines.push('  LOAD skill debugging-patterns. Triage bundle vs backend before reading server logs.');
  }
  if (d.aiMarks === 'yes') {
    lines.push('  LOAD skill remove-ai-marks. Run the fraud Noul before cleaning.');
  }
  if (d.highImpact === 'yes') {
    lines.push('  LOAD skill ai-llm-security § LLM06. A human confirms payment, delete, outbound email, or prod write.');
  }
  if (d.ads === 'yes' && d.adsPlatform && d.adsPlatform !== 'not_ads') {
    const skill =
      d.adsPlatform === 'google'
        ? 'ads-google'
        : d.adsPlatform === 'meta'
          ? 'ads-meta'
          : d.adsPlatform === 'tiktok'
            ? 'ads-tiktok'
            : 'ads-audit';
    lines.push(`  LOAD skill ${skill}. Judgment checks are Nouls in one call. CTR, CPA, ROAS, and the health-score weights stay in code.`);
  }
  if (d.stackPick === 'octane_server') {
    lines.push('  LOAD skill laravel-octane § Server Selection. One Choice, then the matching config. Do not load RoadRunner and Swoole docs unless chosen.');
  } else if (d.stackPick === 'php_http_client') {
    lines.push('  LOAD skill external-api-patterns § Choose your tool. One Choice: Http service or Saloon.');
  } else if (d.stackPick === 'fastapi_background') {
    lines.push('  LOAD skill fastapi-patterns § Background work. One Choice, then only that worker’s section.');
  }
  if (d.wordpress === 'yes') {
    lines.push('  WordPress: run the crack Noul in owned-wordpress-plugin-ops before editing. Refuse a nulled key. Still recover the site.');
  }
  return lines.join('\n');
}
