import { createHash } from 'node:crypto';
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

export function buildReviewExceptionMap({ exceptions = [], today }) {
  dateAtUtcMidnight(today, 'today');
  if (!Array.isArray(exceptions)) throw new Error('Content review exceptions must be an array.');
  const map = new Map();
  for (const entry of exceptions) {
    for (const field of ['collection', 'id', 'owner', 'reason', 'followUp', 'expiresOn']) {
      if (typeof entry?.[field] !== 'string' || !entry[field].trim()) throw new Error(`Review exception needs ${field}.`);
    }
    dateAtUtcMidnight(entry.expiresOn, 'exception.expiresOn');
    if (new URL(entry.followUp).protocol !== 'https:') throw new Error('Review exception follow-up must use https.');
    const key = `${entry.collection}:${entry.id}`;
    if (map.has(key)) throw new Error(`Duplicate review exception ${key}.`);
    map.set(key, { ...entry, active: entry.expiresOn >= today });
  }
  return map;
}

export function buildContentReviewSchedule({ items, today, horizonDays = 30, exceptions = [] }) {
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
  const exceptionMap = buildReviewExceptionMap({ exceptions, today });
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
      owner: item.owner?.trim() || exceptionMap.get(key)?.owner || 'unassigned',
      sourceUrls: (item.sourceUrls ?? []).map(publicSourceUrl),
      ...(item.sourceChangeContext ? { sourceChangeContext: String(item.sourceChangeContext).slice(0, 500) } : {}),
      ...(item.recordHref ? { recordHref: publicSourceUrl(item.recordHref) } : {}),
      ...(exceptionMap.has(key) ? { reviewException: exceptionMap.get(key) } : {}),
    };
  }).sort(compareReviewItems);

  const summary = {
    total: normalizedItems.length,
    overdue: normalizedItems.filter((item) => item.status === 'overdue').length,
    dueToday: normalizedItems.filter((item) => item.status === 'due-today').length,
    dueSoon: normalizedItems.filter((item) => item.status === 'due-soon').length,
    later: normalizedItems.filter((item) => item.status === 'later').length,
    blockingOverdue: normalizedItems.filter((item) => item.status === 'overdue' && !item.reviewException?.active).length,
    exempted: normalizedItems.filter((item) => item.status === 'overdue' && item.reviewException?.active).length,
  };

  return {
    schemaVersion: 1,
    kind: 'tcwiki-content-review-schedule',
    generatedAt: new Date().toISOString(),
    today,
    horizonDays,
    horizon,
    status: summary.blockingOverdue > 0 ? 'overdue' : summary.exempted > 0 ? 'excepted' : 'current',
    summary,
    attentionItems: normalizedItems.filter((item) => item.status !== 'later' || item.sourceChangeContext),
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

  lines.push('', '| Due | Status | Record ID | Item / file | Owner | Sources | Why |', '| --- | --- | --- | --- | --- | --- | --- |');
  const exceptionLines = [];
  for (const item of schedule.attentionItems) {
    const file = item.recordHref ? `[${markdownCell(item.label)}](${item.recordHref})` : markdownCell(item.label);
    const sources = (item.sourceUrls ?? []).map((url, index) => `[source ${index + 1}](${url})`).join(', ') || 'source mapping unavailable';
    const reason = (item.status === 'overdue' ? 'due date passed' : item.status === 'due-today' ? 'review due today' : item.status === 'later' ? 'source context needs review before scheduled due date' : 'review due within horizon') + (item.sourceChangeContext ? '; ' + markdownCell(item.sourceChangeContext) : '');
    lines.push(`| ${item.nextReviewDue} | ${item.status} | ${markdownCell(item.collection)}:${markdownCell(item.id)} | ${file}; \`${markdownCell(item.path)}\` | ${markdownCell(item.owner ?? 'unassigned')} | ${sources} | ${reason} |`);
    if (item.reviewException) {
      const exception = item.reviewException;
      exceptionLines.push(`Exception ${exception.active ? 'active' : 'expired'} for ${item.collection}:${item.id}: owner ${exception.owner}; expires ${exception.expiresOn}; ${exception.reason}; follow-up ${exception.followUp}`);
    }
  }
  if (exceptionLines.length) lines.push('', '## Review exceptions', '', ...exceptionLines);
  return lines.join('\n');
}

export async function writeContentReviewSchedule(schedule, outputPath) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(schedule, null, 2)}\n`, 'utf8');
}

function markdownCell(value) { return String(value).replace(/\|/g, '\\|').replace(/[\r\n]/g, ' '); }
function publicSourceUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Review sources must use public HTTPS URLs');
  return url.href;
}

/** An explicit local draft. Never publishes, closes or changes an issue. */
export function buildReviewIssueDraft(item, existingIssues = []) {
  if (!Array.isArray(existingIssues) || existingIssues.length > 1000) throw new Error('Existing review issues must be a bounded array');
  const stableId = `${item.collection}:${item.id}`;
  const marker = `<!-- tcwiki-content-review:${createHash('sha256').update(stableId).digest('hex').slice(0, 24)} -->`;
  const title = `Review ${markdownCell(stableId).slice(0, 140)}`;
  const body = `${marker}\nRecord: ${stableId}\nFile: ${item.path}\n${item.recordHref ?? ''}\nOwner: ${item.owner ?? 'unassigned'}\nPrevious review: ${item.reviewedAt}; due: ${item.nextReviewDue}\nSource-change context: ${item.sourceChangeContext ?? 'not supplied'}\n\nSources:\n${(item.sourceUrls ?? []).slice(0, 6).map(url => publicSourceUrl(url)).join('\n') || 'Source mapping must be confirmed'}\n\n## Review decision and supporting evidence\nRecord exact source revision/observation date, claim scope, conflicting or missing evidence, and the proposed wording or review decision. A fetch does not certify the claim.\n\n## Verification\nRecord affected search/anchors/reader paths and focused checks. Do not reset unrelated review dates.\n`;
  const duplicate = existingIssues.find(issue => typeof issue?.body === 'string' && issue.body.includes(marker));
  if (duplicate) return { title, body, marker, duplicateUrl: duplicate.url ? publicSourceUrl(duplicate.url) : 'matching existing review task' };
  const newIssueUrl = `https://github.com/Reedtrullz/tcwiki/issues/new?${new URLSearchParams({ title, body })}`;
  if (newIssueUrl.length > 8000) throw new Error('Review draft exceeds prefilled URL limit');
  return { title, body, marker, newIssueUrl };
}
