import './require-node22.mjs';
import { appendFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';
import {
  buildContentReviewSchedule,
  formatContentReviewSchedule,
  writeContentReviewSchedule,
} from './lib/content-review-schedule.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const jiti = createJiti(import.meta.url, {
  alias: { '@': join(root, 'src') },
  moduleCache: false,
});

function optionValue(args, name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) {
    return fallback;
  }
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value.`);
  }
  return value;
}

function itemIdentity(value, fallback) {
  for (const field of ['id', 'chain', 'name', 'term', 'title', 'label']) {
    if (typeof value?.[field] === 'string' && value[field].trim() !== '') {
      return value[field];
    }
  }
  return fallback;
}

function addFreshnessRecords(items, collection, records) {
  if (!Array.isArray(records)) {
    return;
  }
  records.forEach((record, index) => {
    if (!record?.freshness?.checkedAt || !record?.freshness?.nextReviewDue) {
      return;
    }
    const id = itemIdentity(record.data, String(index));
    items.push({
      id,
      collection,
      label: itemIdentity(record.data, id),
      path: `src/lib/data/static.ts#${collection}[${id}]`,
      reviewedAt: record.freshness.checkedAt,
      nextReviewDue: record.freshness.nextReviewDue,
    });
  });
}

function addReviewEntries(items, collection, entries, sourcePath) {
  if (!Array.isArray(entries)) {
    return;
  }
  entries.forEach((entry, index) => {
    if (!entry?.reviewedAt || !entry?.nextReviewDue) {
      return;
    }
    const id = itemIdentity(entry, String(index));
    items.push({
      id,
      collection,
      label: itemIdentity(entry, id),
      path: `${sourcePath}#${collection}[${id}]`,
      reviewedAt: entry.reviewedAt,
      nextReviewDue: entry.nextReviewDue,
    });
  });
}

function dedupeItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.collection}:${item.id}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

const args = process.argv.slice(2);
const today = optionValue(args, '--today', process.env.CONTENT_CHECK_TODAY ?? new Date().toISOString().slice(0, 10));
const horizonDays = Number(optionValue(args, '--horizon-days', process.env.CONTENT_REVIEW_HORIZON_DAYS ?? '30'));
const artifactPath = optionValue(args, '--artifact', process.env.CONTENT_REVIEW_ARTIFACT ?? '.artifacts/content-reviews/content-review-schedule.json');
const allowOverdue = args.includes('--allow-overdue') || process.env.ALLOW_OVERDUE_CONTENT === '1';

const staticData = await jiti.import(join(root, 'src/lib/data/static.ts'));
const contentRegistry = await jiti.import(join(root, 'src/lib/content/registry.ts'));
const glossary = await jiti.import(join(root, 'src/lib/content/glossary.ts'));
const items = [];

for (const [name, value] of Object.entries(staticData)) {
  if (name.endsWith('_RECORDS')) {
    addFreshnessRecords(items, name, value);
  }
}
addReviewEntries(items, 'CONTENT_ENTRIES', [contentRegistry.HOME_PAGE_ENTRY, contentRegistry.SEARCH_PAGE_ENTRY, ...contentRegistry.CONTENT_ENTRIES], 'src/lib/content/registry.ts');
addReviewEntries(items, 'DEEP_DIVE_READER_PATHS', contentRegistry.DEEP_DIVE_READER_PATHS, 'src/lib/content/registry.ts');
addReviewEntries(items, 'TASK_INTENT_GUIDES', contentRegistry.TASK_INTENT_GUIDES, 'src/lib/content/registry.ts');
addReviewEntries(items, 'GLOSSARY_DEFINITION_PATHS', glossary.GLOSSARY_DEFINITION_PATHS, 'src/lib/content/glossary.ts');
addReviewEntries(items, 'GLOSSARY_TERMS', glossary.GLOSSARY_TERMS, 'src/lib/content/glossary.ts');

const schedule = buildContentReviewSchedule({
  items: dedupeItems(items),
  today,
  horizonDays,
});
const markdown = formatContentReviewSchedule(schedule);
await writeContentReviewSchedule(schedule, artifactPath);
console.log(markdown);
console.log(`\nContent review evidence written to ${artifactPath}`);

if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`, 'utf8');
}

if (!allowOverdue && schedule.summary.overdue > 0) {
  console.error(`Content review schedule has ${schedule.summary.overdue} overdue item(s).`);
  process.exit(1);
}
