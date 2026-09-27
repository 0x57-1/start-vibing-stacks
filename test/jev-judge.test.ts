import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  decisionFromAnswers,
  judgeTurn,
  questionsFor,
  readTypesafeKey,
  redactForJudge,
  renderJevDirective,
} from '../stacks/_shared/hooks/jev-judge.ts';

let failed = 0;
function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`ok   ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`FAIL ${name}\n     ${(err as Error).message}`);
  }
}

const leaks: Array<[string, string]> = [
  ['openai', 'use sk-proj-abcdefghijklmnopqrstuvwx1234 here'],
  ['anthropic', 'key sk-ant-api03-abcdefghijklmnopqrstuv'],
  ['github', 'ghp_abcdefghijklmnopqrstuvwxyz0123456789'],
  ['github pat', 'github_pat_11ABCDEFG0123456789_abcdefghij'],
  ['xai', 'xai-abcdefghijklmnopqrstuvwxyz0123'],
  ['aws', 'AKIAIOSFODNN7EXAMPLE'],
  ['google', 'AIzaSyA-abcdefghijklmnopqrstuvwxyz12345'],
  ['slack', 'xoxb-1234567890-abcdefghij'],
  ['stripe webhook', 'whsec_abcdefghijklmnop1234'],
  ['jwt', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTYifQ.abcdefghijk123'],
  ['json', '{"apiKey": "live9f8e7d6c5b4a"}'],
  ['yaml', 'password: hunter2hunter2'],
  ['env', 'TYPESAFE_API_KEY=abc123'],
  ['env quoted', 'DB_PASSWORD="p4ss word"'],
  ['url', 'postgres://user:s3cretpass@db.host:5432/app'],
  ['bearer', 'Authorization: Bearer abc.def.ghi-jkl'],
  ['pem', '-----BEGIN RSA PRIVATE KEY-----\nMIIEow\n-----END RSA PRIVATE KEY-----'],
  ['long opaque', 'token value 9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a'],
];
const secrets = [
  'abcdefghijklmnopqrstuvwx1234',
  'api03-abcdefghijklmnopqrstuv',
  'abcdefghijklmnopqrstuvwxyz0123456789',
  '11ABCDEFG0123456789_abcdefghij',
  'abcdefghijklmnopqrstuvwxyz0123',
  'IOSFODNN7EXAMPLE',
  'SyA-abcdefghijklmnopqrstuvwxyz12345',
  '1234567890-abcdefghij',
  'abcdefghijklmnop1234',
  'eyJzdWIiOiIxMjM0NTYifQ',
  'live9f8e7d6c5b4a',
  'hunter2hunter2',
  'abc123',
  'p4ss',
  's3cretpass',
  'abc.def.ghi-jkl',
  'MIIEow',
  '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a',
];

leaks.forEach(([name, input], i) => {
  test(`redact ${name}`, () => {
    const out = redactForJudge(input);
    assert.ok(!out.includes(secrets[i]!), out);
  });
});

test('redact keeps routing words', () => {
  const p = 'não publique ainda, só corrige o typecheck do TYPESAFE_API_KEY do .env';
  assert.equal(redactForJudge(p), p);
});

test('redact keeps a short git sha and a path', () => {
  const p = 'reverte 97d3fd2 em stacks/_shared/hooks/jev-judge.ts';
  assert.equal(redactForJudge(p), p);
});

test('stack_pick only on php and python', () => {
  assert.ok(!('stack_pick' in questionsFor('nodejs')));
  assert.ok(!('stack_pick' in questionsFor('react-native')));
  const php = questionsFor('php')['stack_pick'] as { criteria: Record<string, string> };
  assert.deepEqual(Object.keys(php.criteria).sort(), ['not_a_stack_pick', 'octane_server', 'php_http_client']);
  const py = questionsFor('python')['stack_pick'] as { criteria: Record<string, string> };
  assert.deepEqual(Object.keys(py.criteria).sort(), ['fastapi_background', 'not_a_stack_pick']);
});

test('SVS_JEV_KEY wins over TYPESAFE_API_KEY; SVS_JEV=0 turns off', () => {
  const dir = mkdtempSync(join(tmpdir(), 'jev-'));
  writeFileSync(join(dir, '.env'), 'TYPESAFE_API_KEY=app\nexport SVS_JEV_KEY="agent"\n');
  const saved = { a: process.env['SVS_JEV_KEY'], b: process.env['TYPESAFE_API_KEY'], c: process.env['SVS_JEV'] };
  delete process.env['SVS_JEV_KEY'];
  delete process.env['TYPESAFE_API_KEY'];
  delete process.env['SVS_JEV'];
  try {
    assert.equal(readTypesafeKey(dir), 'agent');
    process.env['SVS_JEV'] = '0';
    assert.equal(readTypesafeKey(dir), '');
  } finally {
    for (const [k, v] of [['SVS_JEV_KEY', saved.a], ['TYPESAFE_API_KEY', saved.b], ['SVS_JEV', saved.c]] as const) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});

const choice = (c: string, conf = 1) => ({ type: 'choice', choice: c, confidence: conf });
const noul = (n: number) => ({ type: 'noul', noul: n });

test('plain work turn loads no skill', () => {
  const d = decisionFromAnswers({ kind: choice('work'), gate: choice('do_not_ship') } as never)!;
  const out = renderJevDirective(d, 'claude');
  assert.ok(!out.includes('LOAD skill'), out);
  assert.ok(out.includes('Do not load skill typesafe-jev'), out);
});

test('routed skill points at routines, not "do not load typesafe-jev"', () => {
  const d = decisionFromAnswers({ kind: choice('work'), about_email: noul(0.9) } as never)!;
  const out = renderJevDirective(d, 'claude');
  assert.ok(out.includes('.claude/skills/email-push-marketing/SKILL.md'), out);
  assert.ok(out.includes('skill-routines.md § email-hard-limit'), out);
  assert.ok(!out.includes('Do not load skill typesafe-jev'), out);
});

test('ads skills use the ads-agents path', () => {
  const d = decisionFromAnswers({
    kind: choice('work'),
    about_paid_ads: noul(0.95),
    ads_platform: choice('google'),
  } as never)!;
  const out = renderJevDirective(d, 'grok');
  assert.ok(out.includes('.claude/ads-agents/skills/ads-google/SKILL.md'), out);
});

test('routing survives a low-confidence kind', () => {
  const d = decisionFromAnswers({ kind: choice('ship', 0.5), about_tool_failure: noul(0.9) } as never);
  assert.ok(d, 'decision should not be null');
  assert.equal(d!.kind, null);
  assert.ok(renderJevDirective(d!, 'kimi').includes('tool-resilience'));
});

test('nothing confident → null', () => {
  assert.equal(decisionFromAnswers({ kind: choice('ship', 0.4) } as never), null);
});

async function statsTest(): Promise<void> {
  const name = 'stats count outcomes and never store the prompt';
  const dir = mkdtempSync(join(tmpdir(), 'jev-stats-'));
  mkdirSync(join(dir, '.claude'));
  const realFetch = globalThis.fetch;
  const savedKey = process.env['SVS_JEV_KEY'];
  const savedOff = process.env['SVS_JEV'];
  process.env['SVS_JEV_KEY'] = 'test-key';
  delete process.env['SVS_JEV'];
  let sentBody = '';
  globalThis.fetch = (async (_url: unknown, init?: { body?: unknown }) => {
    sentBody = String(init?.body ?? '');
    return new Response(
      JSON.stringify({ answers: { kind: choice('work'), about_email: noul(0.9) } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }) as typeof fetch;
  try {
    const d = await judgeTurn({
      projectDir: dir,
      prompt: 'reescreve o email, senha: segredo123',
      stack: 'nodejs',
    });
    assert.ok(d);
    assert.ok(!sentBody.includes('segredo123'), `secret reached the request body: ${sentBody.slice(0, 120)}`);
    assert.ok(!sentBody.includes('stack_pick'), 'nodejs request carried stack_pick');
    const raw = readFileSync(join(dir, '.claude', 'state', 'jev-stats.json'), 'utf8');
    const stats = JSON.parse(raw);
    assert.equal(stats.calls, 1);
    assert.equal(stats.outcomes.ok, 1);
    assert.equal(stats.routes['email-push-marketing'], 1);
    assert.ok(!raw.includes('reescreve'), 'prompt text in stats');
    console.log(`ok   ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`FAIL ${name}\n     ${(err as Error).message}`);
  } finally {
    globalThis.fetch = realFetch;
    if (savedKey === undefined) delete process.env['SVS_JEV_KEY'];
    else process.env['SVS_JEV_KEY'] = savedKey;
    if (savedOff !== undefined) process.env['SVS_JEV'] = savedOff;
  }
}

statsTest().then(() => {
  if (failed > 0) {
    console.log(`\n${failed} failed`);
    process.exit(1);
  }
  console.log('\nall passed');
});
