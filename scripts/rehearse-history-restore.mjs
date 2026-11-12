import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, cpSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Bounded synthetic export/backup/restore rehearsal for #200. This is not
// production storage; it proves the path before the owner approves one.
// Run with: node --experimental-sqlite scripts/rehearse-history-restore.mjs [dir]
const sha = (value) => createHash('sha256').update(value).digest('hex');

if (process.argv[2] === '--verify-bundle') {
  const bundlePath = process.argv[3];
  if (!bundlePath) throw new Error('Usage: node --experimental-sqlite scripts/rehearse-history-restore.mjs --verify-bundle <bundle-dir>');
  const manifest = JSON.parse(readFileSync(join(bundlePath, 'manifest.json'), 'utf8'));
  const database = join(resolve(bundlePath), '..', 'restored-verify.sqlite');
  const db = new DatabaseSync(database);
  db.exec('DROP TABLE IF EXISTS captures');
  db.exec('CREATE TABLE captures (capture_id TEXT PRIMARY KEY, observed_at TEXT NOT NULL, schema_version INTEGER NOT NULL, bytes INTEGER NOT NULL, sha256 TEXT NOT NULL, json TEXT NOT NULL)');
  const insert = db.prepare('INSERT INTO captures VALUES (?, ?, ?, ?, ?, ?)');
  for (const entry of manifest.captures) {
    const bytes = readFileSync(join(bundlePath, 'snapshots', entry.captureId + '.json'));
    if (sha(bytes) !== entry.sha256 || bytes.length !== entry.bytes) throw new Error('checksum mismatch for ' + entry.captureId);
    const parsed = JSON.parse(bytes.toString('utf8'));
    if (parsed.schemaVersion !== 1) throw new Error('unsupported schema in ' + entry.captureId);
    insert.run(parsed.captureId, parsed.timestamps.observedAt, parsed.schemaVersion, bytes.length, sha(bytes), bytes.toString('utf8'));
  }
  const rows = db.prepare('SELECT * FROM captures ORDER BY capture_id').all();
  console.log(JSON.stringify({ bundle: bundlePath, manifestCaptures: manifest.captures.length, rows: rows.length, rowsSha256: sha(JSON.stringify(rows)), database }, null, 2));
  process.exit(0);
}

const root = resolve(process.argv[2] ?? '.artifacts/history-restore');
mkdirSync(root, { recursive: true });
const dir = (path) => { mkdirSync(join(root, path), { recursive: true }); return join(root, path); };

const AS_OF = Date.parse('2026-11-12T09:00:00.000Z');
const MAX_CAPTURE_BYTES = 65536;
const MAX_PER_DAY = 12;
const MAX_TOTAL_BYTES = 5505024;
const RETENTION_MS = 7 * 86400000;

const capture = (id, observedAt, height, controls, extra = {}) => ({
  schemaVersion: 1,
  captureId: id,
  collector: { id: 'tcwiki-readiness-collector', version: '1' },
  source: { provider: 'Liquify THORNode', url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain' },
  heights: { actual: height, requested: height, verified: height },
  timestamps: {
    observedAt,
    requestStartedAt: new Date(Date.parse(observedAt) - 900).toISOString(),
    collectionCompletedAt: new Date(Date.parse(observedAt) + 400).toISOString(),
    deliveryAt: new Date(Date.parse(observedAt) + 1200).toISOString(),
  },
  controls,
  applicability: { thornodeVersion: '3.21.1', scope: 'app-operations' },
  quality: { warnings: [], unknowns: [] },
  ...extra,
});

function validate(item, previousObserved) {
  const json = JSON.stringify(item);
  const bytes = Buffer.byteLength(json);
  const errors = [];
  const warnings = [];
  if (bytes > MAX_CAPTURE_BYTES) errors.push('capture exceeds ' + MAX_CAPTURE_BYTES + ' bytes (' + bytes + ')');
  if (item.schemaVersion !== 1) errors.push('unsupported schemaVersion');
  const observed = Date.parse(item.timestamps?.observedAt);
  if (!Number.isFinite(observed)) errors.push('invalid observedAt');
  else if (AS_OF - observed > RETENTION_MS) errors.push('capture is older than the 7-day retention');
  if (Number.isFinite(observed) && previousObserved && observed < previousObserved) {
    warnings.push('backward wall clock preserved, not normalized');
  }
  return { errors, warnings, bytes, json };
}

const cohort = [
  capture('cap-20261112-0800', '2026-11-12T08:00:00.000Z', 28640001, { HALTTRADING: 0, PAUSELOANS: 0, HALTMEMOLESS: 1 }),
  capture('cap-20261112-0830', '2026-11-12T08:30:00.000Z', 28640010, { HALTTRADING: 0, PAUSELOANS: 0, HALTMEMOLESS: 1 }),
  capture('cap-20261112-0900', '2026-11-12T09:00:00.000Z', 28640020, { HALTTRADING: 1, PAUSELOANS: 0, HALTMEMOLESS: 1 }),
];

const failures = [];
let previousObserved = 0;
let totalBytes = 0;
const dayCounts = new Map();
const prepared = [];
for (const item of cohort) {
  const result = validate(item, previousObserved);
  if (result.errors.length) failures.push({ id: item.captureId, errors: result.errors });
  const day = item.timestamps.observedAt.slice(0, 10);
  dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
  totalBytes += result.bytes;
  previousObserved = Date.parse(item.timestamps.observedAt);
  prepared.push({ item, ...result });
}
for (const [day, count] of dayCounts) {
  if (count > MAX_PER_DAY) failures.push({ id: 'day:' + day, errors: ['more than ' + MAX_PER_DAY + ' captures in a UTC day'] });
}
if (totalBytes > MAX_TOTAL_BYTES) failures.push({ id: 'cohort', errors: ['cohort exceeds ' + MAX_TOTAL_BYTES + ' bytes'] });
if (failures.length) throw new Error('Synthetic cohort failed admission: ' + JSON.stringify(failures));

const sourceDb = new DatabaseSync(join(root, 'source.sqlite'));
sourceDb.exec('DROP TABLE IF EXISTS captures');
sourceDb.exec('CREATE TABLE captures (capture_id TEXT PRIMARY KEY, observed_at TEXT NOT NULL, schema_version INTEGER NOT NULL, bytes INTEGER NOT NULL, sha256 TEXT NOT NULL, json TEXT NOT NULL)');
const insert = sourceDb.prepare('INSERT INTO captures VALUES (?, ?, ?, ?, ?, ?)');
for (const row of prepared) {
  insert.run(row.item.captureId, row.item.timestamps.observedAt, row.item.schemaVersion, row.bytes, sha(row.json), row.json);
}

const bundleDir = dir('bundle');
const snapshotsDir = dir('bundle/snapshots');
const manifestCaptures = [];
for (const row of prepared) {
  writeFileSync(join(snapshotsDir, row.item.captureId + '.json'), row.json);
  manifestCaptures.push({
    captureId: row.item.captureId,
    observedAt: row.item.timestamps.observedAt,
    bytes: row.bytes,
    sha256: sha(row.json),
  });
}
const manifest = {
  schemaVersion: 1,
  generatedAt: '2026-11-12T09:05:00.000Z',
  captureCount: manifestCaptures.length,
  totalBytes,
  limits: { maxCaptureBytes: MAX_CAPTURE_BYTES, maxPerDay: MAX_PER_DAY, maxTotalBytes: MAX_TOTAL_BYTES },
  captures: manifestCaptures,
};
writeFileSync(join(bundleDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
const checksumLines = [];
for (const stone of readdirSync(snapshotsDir).sort()) {
  checksumLines.push(sha(readFileSync(join(snapshotsDir, stone))) + '  snapshots/' + stone);
}
writeFileSync(join(bundleDir, 'checksums.sha256'), checksumLines.join('\n') + '\n');

const backupDir = dir('backup');
cpSync(bundleDir, backupDir, { recursive: true });
const backupManifest = JSON.parse(readFileSync(join(backupDir, 'manifest.json'), 'utf8'));
const backupVerification = backupManifest.captures.map((entry) => {
  const bytes = readFileSync(join(backupDir, 'snapshots', entry.captureId + '.json'));
  return { captureId: entry.captureId, ok: sha(bytes) === entry.sha256 && bytes.length === entry.bytes };
});
if (backupVerification.some((entry) => !entry.ok)) throw new Error('Backup checksum verification failed.');

const restoredDb = new DatabaseSync(join(root, 'restored.sqlite'));
restoredDb.exec('DROP TABLE IF EXISTS captures');
restoredDb.exec('CREATE TABLE captures (capture_id TEXT PRIMARY KEY, observed_at TEXT NOT NULL, schema_version INTEGER NOT NULL, bytes INTEGER NOT NULL, sha256 TEXT NOT NULL, json TEXT NOT NULL)');
const restoredInsert = restoredDb.prepare('INSERT INTO captures VALUES (?, ?, ?, ?, ?, ?)');
for (const entry of backupManifest.captures) {
  const bytes = readFileSync(join(backupDir, 'snapshots', entry.captureId + '.json'));
  if (sha(bytes) !== entry.sha256) throw new Error('Restore checksum mismatch for ' + entry.captureId);
  const parsed = JSON.parse(bytes.toString('utf8'));
  if (parsed.schemaVersion !== 1) throw new Error('Unsupported schema in ' + entry.captureId);
  restoredInsert.run(parsed.captureId, parsed.timestamps.observedAt, parsed.schemaVersion, bytes.length, sha(bytes), bytes.toString('utf8'));
}
const sourceRows = sourceDb.prepare('SELECT * FROM captures ORDER BY capture_id').all();
const restoredRows = restoredDb.prepare('SELECT * FROM captures ORDER BY capture_id').all();
const rowsEqual = JSON.stringify(sourceRows) === JSON.stringify(restoredRows);
if (!rowsEqual) throw new Error('Restored rows differ from the source database.');

const overLimit = capture('cap-overlimit', '2026-11-12T08:10:00.000Z', 28640002, { PAD: 'x'.repeat(66000) });
const expired = capture('cap-expired', '2026-11-04T08:00:00.000Z', 28630000, { HALTTRADING: 0 });
const backward = capture('cap-backward', '2026-11-12T07:00:00.000Z', 28639900, { HALTTRADING: 0 });
const tamperedPath = join(root, 'tampered.json');
writeFileSync(tamperedPath, readFileSync(join(bundleDir, 'snapshots', prepared[0].item.captureId + '.json'), 'utf8').replace('HALTTRADING', 'HALTTRADINX'));

const negatives = {
  overLimit: validate(overLimit, 0).errors,
  expired: validate(expired, 0).errors,
  backwardClock: validate(backward, Date.parse('2026-11-12T08:00:00.000Z')).warnings,
  tampered: sha(readFileSync(tamperedPath)) === manifestCaptures[0].sha256 ? [] : ['checksum mismatch rejected'],
};
if (!negatives.overLimit.length || !negatives.expired.length || !negatives.backwardClock.length || !negatives.tampered.length) {
  throw new Error('A negative control did not fail as expected: ' + JSON.stringify(negatives));
}

console.log(JSON.stringify({
  asOf: new Date(AS_OF).toISOString(),
  cohort: { captures: prepared.length, totalBytes, maxCaptureBytes: Math.max(...prepared.map((row) => row.bytes)) },
  source: { rows: sourceRows.length, sha256: sha(JSON.stringify(sourceRows)) },
  export: { bundleFiles: readdirSync(bundleDir), manifestCaptures: manifestCaptures.length, checksums: checksumLines.length },
  backup: { destination: 'backup (local stand-in; owner destination unset)', verified: backupVerification },
  restore: { rows: restoredRows.length, rowsEqual, integrity: 'rows and per-row checksums match' },
  negatives,
  result: 'PASS',
}, null, 2));
