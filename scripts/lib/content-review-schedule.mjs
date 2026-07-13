import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function dateAtUtcMidnight(value, label) {
  if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value)) {
    throw new Error(`${label} must be YYYY-MM-DD.`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} must be a valid calendar date.`);
  }
  return date;
}

function addUtcDays(date, days) {
  return new Date(date.getTime() + days * 86_400_000);
}

function compareReviewItems(left, right) {
  return left.nextReviewDue.localeCompare(right.nextReviewDue) ||
    left.collection.localeCompare(right.collection) ||
    left.label.localeCompare(right.label);
}

export function buildContentReviewSchedule({ items, today, horizonDays = 30 }) {
  if (!Array.isArray(items)) {
    throw new Error('items must be an array.');
  }
  if (!Number.isSafeInteger(horizonDays) || horizonDays < 0 || horizonDays > 366) {
    throw new Error('horizonDays must be an integer from 0 to 366.');
  }

  const todayDate = dateAtUtcMidnight(today, 'today');
  const horizonDate = addUtcDays(todayDate, horizonDays);
  const horizon = horizonDate.toISOString().slice(0, 10);
  const seen = new Set();
  const normalizedItems = items.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`items[${index}] must be an object.`);
    }

    for (const field of ['id', 'collection', 'label', 'path', 'reviewedAt', 'nextReviewDue']) {
      if (typeof item[field] !== 'string' || item[field].trim() === '') {
        throw new Error(`items[${index}].${field} must be a non-empty string.`);
      }
    }
    dateAtUtcMidnight(item.reviewedAt, `items[${index}].reviewedAt`);
    dateAtUtcMidnight(item.nextReviewDue, `items[${index}].nextReviewDue`);
    if (item.nextReviewDue < item.reviewedAt) {
      throw new Error(`items[${index}].nextReviewDue must not be before reviewedAt.`);
    }

    const key = `${item.collection}:${item.id}`;
    if (seen.has(key)) {
      throw new Error(`Duplicate content review item ${key}.`);
    }
    seen.add(key);

    const status = item.nextReviewDue < today
      ? 'overdue'
      : item.nextReviewDue === today
        ? 'due-today'
        : item.nextReviewDue <= horizon
          ? 'due-soon'
          : 'later';

    return {
      id: item.id,
      collection: item.collection,
      label: item.label,
      path: item.path,
      reviewedAt: item.reviewedAt,
      nextReviewDue: item.nextReviewDue,
      status,
    };
  }).sort(compareReviewItems);

  const summary = {
    total: normalizedItems.length,
    overdue: normalizedItems.filter((item) => item.status === 'overdue').length,
    dueToday: normalizedItems.filter((item) => item.status === 'due-today').length,
    dueSoon: normalizedItems.filter((item) => item.status === 'due-soon').length,
    later: normalizedItems.filter((item) => item.status === 'later').length,
  };

  return {
    schemaVersion: 1,
    kind: 'tcwiki-content-review-schedule',
    generatedAt: new Date().toISOString(),
    today,
    horizonDays,
    horizon,
    status: summary.overdue > 0 ? 'overdue' : 'current',
    summary,
    attentionItems: normalizedItems.filter((item) => item.status !== 'later'),
    items: normalizedItems,
  };
}

export function formatContentReviewSchedule(schedule) {
  const lines = [
    '# Content review schedule',
    '',
    `Checked ${schedule.today}; reporting through ${schedule.horizon}.`,
    `Total ${schedule.summary.total}; overdue ${schedule.summary.overdue}; due today ${schedule.summary.dueToday}; due soon ${schedule.summary.dueSoon}.`,
  ];

  if (schedule.attentionItems.length === 0) {
    lines.push('', 'No reviews are due within the reporting horizon.');
    return lines.join('\n');
  }

  lines.push('', '| Due | Status | Collection | Item | Source path |', '| --- | --- | --- | --- | --- |');
  for (const item of schedule.attentionItems) {
    lines.push(`| ${item.nextReviewDue} | ${item.status} | ${item.collection} | ${item.label.replace(/\|/g, '\\|')} | \`${item.path}\` |`);
  }
  return lines.join('\n');
}

export async function writeContentReviewSchedule(schedule, outputPath) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(schedule, null, 2)}\n`, 'utf8');
}
