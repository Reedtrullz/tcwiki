import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { gzipSync } from 'node:zlib';

// Pure helper only: no installed application graph or real Lunr index is loaded.
const [mode, sourcePath, baselinePath] = process.argv.slice(2);
assert.ok(mode === 'baseline' || mode === 'candidate');
const hash = (value) => createHash('sha256').update(value).digest('hex');
async function load(path, instrumented) {
  const source = readFileSync(path, 'utf8');
  let code = source;
  if (instrumented) {
    const replacements = [
      ['function getSafeFallbackQuery(query: string) {', 'function getSafeFallbackQuery(query: string) { counts.compilations++;'],
      ['export function getSearchQueryTerms(query: string) {', 'export function getSearchQueryTerms(query: string) { counts.tokenizations++;'],
      ['.flatMap((term) => [term, `${term}*`])', '.flatMap((term) => (counts.expansions++, [term, `${term}*`]))'],
    ];
    for (const [from, to] of replacements) {
      assert.equal(code.split(from).length, 2, `unique instrumentation site: ${from}`);
      code = code.replace(from, to);
    }
    code = 'export const counts = { compilations: 0, tokenizations: 0, expansions: 0 };\n' + code;
  }
  const importedModule = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(code)).toString('base64')}#${instrumented}`);
  return { module: importedModule, sourceHash: hash(source), instrumentationHash: hash(code),
    sourceBytes: Buffer.byteLength(source), sourceGzipBytes: gzipSync(source, { level: 9 }).length,
    strippedBytes: Buffer.byteLength(stripTypeScriptTypes(source)),
    strippedGzipBytes: gzipSync(stripTypeScriptTypes(source), { level: 9 }).length };
}

const hit = [{ ref: 'rune', score: 7 }, { ref: 'other', score: 2 }];
const fallbackHit = [{ ref: 'fallback', score: 3 }];
const fail = 'throw';
const long = 'a'.repeat(2048);
const cases = [
  ['empty', '', [], [], []],
  ['whitespace', ' \t\n ', [], [], []],
  ['ordinary-hit', ' RUNE settlement ', [hit], ['RUNE settlement'], hit],
  ['syntax-hit', 'BTC.BTC', [hit], ['BTC.BTC'], hit],
  ['plain-miss', 'unknown words', [[]], ['unknown words'], []],
  ['punctuation-miss', '!!!', [[]], ['!!!'], []],
  ['punctuation-error', '!!!', [fail], ['!!!'], []],
  ['unicode', 'RÜNE 日本', [[], fallbackHit], ['RÜNE 日本', 'ne ne*'], fallbackHit],
  ['unicode-only', '日本', [fail], ['日本'], []],
  ['asset-secure', 'SECURE+', [[], fallbackHit], ['SECURE+', 'secure secure*'], fallbackHit],
  ['asset-thor', 'THOR.RUNE', [[], fallbackHit], ['THOR.RUNE', 'thor thor* rune rune*'], fallbackHit],
  ['asset-btc', 'BTC.BTC', [[], fallbackHit], ['BTC.BTC', 'btc btc*'], fallbackHit],
  ['malformed', 'foo~x', [fail, []], ['foo~x', 'foo foo*'], []],
  ['raw-error', 'rune:', [fail, fallbackHit], ['rune:', 'rune rune*'], fallbackHit],
  ['plain-raw-error', 'rune', [fail, fallbackHit], ['rune', 'rune rune*'], fallbackHit],
  ['fallback-empty', 'title:', [fail, []], ['title:', 'title title*'], []],
  ['fallback-retry-success', 'rune:', [[], fail, fallbackHit], ['rune:', 'rune rune*', 'rune rune*'], fallbackHit],
  ['fallback-retry-failure', 'rune:', [[], fail, fail], ['rune:', 'rune rune*', 'rune rune*'], []],
  ['total-failure', 'rune:', [fail, fail], ['rune:', 'rune rune*'], []],
  ['duplicates', 'rune:rune btc', [[], fallbackHit], ['rune:rune btc', 'rune rune* btc btc*'], fallbackHit],
  ['long', `${long}:`, [[], fallbackHit], [`${long}:`, `${long} ${long}*`], fallbackHit],
  ['single-character', 'a:', [fail], ['a:'], []],
];

function exercise(module) {
  const rows = [];
  // Two rounds on the same module detect cross-call state and order dependence.
  for (let round = 0; round < 2; round++) for (const [id, query, responses, expectedCalls, expectedResult] of cases) {
    if (module.counts) Object.keys(module.counts).forEach(key => { module.counts[key] = 0; });
    const calls = [], errors = [];
    let cursor = 0;
    const index = { search(argument) {
      calls.push(argument);
      assert.ok(cursor < responses.length, `${id}: unexpected retry`);
      const response = responses[cursor++];
      if (response === fail) {
        errors.push(`failure-${cursor}`);
        throw new Error(`failure-${cursor}`);
      }
      return response;
    } };
    const result = module.runSafeLunrSearch(index, query);
    assert.deepEqual(calls, expectedCalls, id);
    assert.deepEqual(result, expectedResult, id);
    if (expectedResult.length) assert.equal(result, expectedResult, `${id}: result identity`);
    if (responses.length && responses.at(-1) !== fail) assert.equal(result, responses.at(-1), `${id}: empty/nonempty response identity`);
    const work = module.counts ? { work: { ...module.counts } } : {};
    rows.push({ round, id, query, calls, errors, result, ...work, terms: module.getSearchQueryTerms(query) });
  }
  assert.deepEqual(module.getSearchQueryTerms('RUNE settlement'), ['rune settlement', 'settlement', 'rune']);
  assert.deepEqual(module.getSearchQueryTerms('BTC.BTC'), ['btc.btc', 'btc']);
  assert.deepEqual(module.getSearchQueryTerms('  '), []);
  return rows;
}

const plain = await load(sourcePath, false);
const measured = await load(sourcePath, true);
const semantics = exercise(plain.module);
const rows = exercise(measured.module);
assert.deepEqual(rows.map(row => {
  const observation = { ...row };
  delete observation.work;
  return observation;
}), semantics, 'instrumentation preserves observations');
const termInputs = [
  ...cases.map(([, query]) => query),
  ...Array.from({ length: 128 }, (_, i) => `  RUNE${String.fromCharCode(i)}BTC rune AB12 a  `),
  'İ K RÜNE', 'ẞ STRAẞE', 'Σ σ ς', 'ＡＢＣ ABC', 'e\u0301 É café', '日本😀rune',
];
const termMatrix = termInputs.map(query => ({ query, terms: plain.module.getSearchQueryTerms(query) }));
if (baselinePath) {
  const baseline = await load(baselinePath, false);
  assert.deepEqual(semantics, exercise(baseline.module), 'baseline/candidate exact semantic parity');
  assert.deepEqual(termMatrix, termInputs.map(query => ({ query, terms: baseline.module.getSearchQueryTerms(query) })), 'complete authored term matrix parity');
}
const supported = rows.filter(row => ['ordinary-hit', 'syntax-hit', 'plain-miss'].includes(row.id));
for (const row of rows) {
  const needed = row.query.trim() ? 1 : 0;
  const expected = mode === 'candidate' && supported.includes(row) ? 0 : needed;
  assert.equal(row.work.compilations, expected, `${row.id}: actual compilation count`);
  assert.equal(row.work.tokenizations, expected, `${row.id}: actual tokenization count`);
}
const work = supported.reduce((total, row) => {
  for (const key of Object.keys(total)) total[key] += row.work[key];
  return total;
}, { compilations: 0, tokenizations: 0, expansions: 0 });
console.log(JSON.stringify({ mode, runtime: process.version, sourcePath, sourceHash: plain.sourceHash,
  helperBytes: { source: plain.sourceBytes, sourceGzipLevel9: plain.sourceGzipBytes,
    nativeStripped: plain.strippedBytes, nativeStrippedGzipLevel9: plain.strippedGzipBytes },
  instrumentationHash: measured.instrumentationHash, scriptHash: hash(readFileSync(new URL(import.meta.url))),
  semanticCases: semantics.length, rows, termMatrix, primary: { calls: supported.length, work },
  secondary: { indexAttempts: rows.reduce((sum, row) => sum + row.calls.length, 0) },
  limitations: 'Authored scripted index only; no timing, real Lunr, ranking, browser, full graph, or emitted route bytes.' }, null, 2));
assert.deepEqual(work, { compilations: 0, tokenizations: 0, expansions: 0 }, 'successful/plain-miss calls must skip fallback work');
console.log('GREEN: exact helper parity and zero unnecessary fallback work');
