// @sv-version: 1.0.0
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

export interface JevDecision {
  kind: JevKind | null;
  gate: JevGate | null;
  ads: JevBand;
  wordpress: JevBand;
  visualUi: JevBand;
  auth: JevBand;
  ownApi: JevBand;
  web: JevBand;
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
      'What is `prompt` asking for? Negation counts: não publique / não é urgente means they are refusing a ship.',
    criteria: {
      ship: 'Commit, push, or publish in this turn',
      status: 'Only check whether something already shipped (npm, CI, deploy)',
      work: 'Edit, explain, or review. Not a publish.',
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
  if (!kind && !gate) return null;
  const noul = (id: string) => {
    const row = answers[id];
    return row && row.type === 'noul' ? row.noul : undefined;
  };
  return {
    kind,
    gate,
    ads: band(noul('about_paid_ads')),
    wordpress: band(noul('about_wordpress')),
    visualUi: band(noul('about_visual_ui')),
    auth: band(noul('about_auth')),
    ownApi: band(noul('about_own_api')),
    web: band(noul('needs_public_web')),
  };
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
  return lines.join('\n');
}
