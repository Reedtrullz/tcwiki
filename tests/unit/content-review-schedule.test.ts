import { describe, expect, it } from 'vitest';

const { buildContentReviewSchedule, formatContentReviewSchedule } = await import('../../scripts/lib/content-review-schedule.mjs') as {
  buildContentReviewSchedule: (input: {
    today: string;
    horizonDays?: number;
    exceptions?: Array<{ collection: string; id: string; owner: string; reason: string; followUp: string; expiresOn: string }>;
    items: Array<{
      id: string;
      collection: string;
      label: string;
      path: string;
      reviewedAt: string;
      nextReviewDue: string;
      owner?: string;
      sourceUrls?: string[];
      recordHref?: string;
      sourceChangeContext?: string;
    }>;
  }) => {
    status: string;
    horizon: string;
    summary: { total: number; overdue: number; dueToday: number; dueSoon: number; later: number; blockingOverdue: number; exempted: number };
    attentionItems: Array<{ id: string; status: string; reviewException?: { active: boolean; owner: string; reason: string; followUp: string; expiresOn: string } }>;
  };
  formatContentReviewSchedule: (schedule: unknown) => string;
};

function item(id: string, nextReviewDue: string) {
  return {
    id,
    collection: 'TEST_RECORDS',
    label: `Item ${id}`,
    path: `src/test.ts#${id}`,
    reviewedAt: '2026-07-01',
    nextReviewDue,
  };
}

describe('content review schedule', () => {
  it('classifies overdue, due-today, due-soon, and later items deterministically', () => {
    const schedule = buildContentReviewSchedule({
      today: '2026-07-13',
      horizonDays: 30,
      items: [
        item('later', '2026-09-01'),
        item('soon', '2026-08-05'),
        item('today', '2026-07-13'),
        item('overdue', '2026-07-12'),
      ],
    });

    expect(schedule.status).toBe('overdue');
    expect(schedule.horizon).toBe('2026-08-12');
    expect(schedule.summary).toEqual({ total: 4, overdue: 1, dueToday: 1, dueSoon: 1, later: 1, blockingOverdue: 1, exempted: 0 });
    expect(schedule.attentionItems).toEqual([
      expect.objectContaining({ id: 'overdue', status: 'overdue' }),
      expect.objectContaining({ id: 'today', status: 'due-today' }),
      expect.objectContaining({ id: 'soon', status: 'due-soon' }),
    ]);
    expect(formatContentReviewSchedule(schedule)).toContain('| 2026-08-05 | due-soon |');
  });

  it('rejects duplicate collection identifiers and invalid calendar dates', () => {
    expect(() => buildContentReviewSchedule({
      today: '2026-07-13',
      items: [item('same', '2026-08-01'), item('same', '2026-08-02')],
    })).toThrow(/Duplicate content review item/);

    expect(() => buildContentReviewSchedule({
      today: '2026-02-30',
      items: [],
    })).toThrow(/valid calendar date/);
  });
});

const exemption = { collection: 'TEST_RECORDS', id: 'selected', owner: 'editor', reason: 'Source review scheduled; historical record only', followUp: 'https://github.com/Reedtrullz/tcwiki/issues/193', expiresOn: '2026-07-15' };
it('discloses an active scoped exception while unrelated overdue content still blocks', () => {
  const schedule = buildContentReviewSchedule({ today: '2026-07-13', items: [item('selected', '2026-07-12'), item('other', '2026-07-12')], exceptions: [exemption] });
  expect(schedule.summary.blockingOverdue).toBe(1);
  expect(schedule.summary.exempted).toBe(1);
  expect(schedule.status).toBe('overdue');
  expect(formatContentReviewSchedule(schedule)).toContain('editor');
  expect(formatContentReviewSchedule(schedule)).toContain('2026-07-15');
});
it('expires an exception without changing its reviewed date', () => {
  const active = buildContentReviewSchedule({ today: '2026-07-15', items: [item('selected', '2026-07-12')], exceptions: [exemption] });
  expect(active.status).toBe('excepted');
  expect(active.summary.blockingOverdue).toBe(0);
  const expired = buildContentReviewSchedule({ today: '2026-07-16', items: [item('selected', '2026-07-12')], exceptions: [exemption] });
  expect(expired.summary.blockingOverdue).toBe(1);
  expect(expired.attentionItems[0].reviewException?.active).toBe(false);
});
it('rejects exceptions without a real owner/reason or with duplicate scopes', () => {
  for (const exceptions of [[{ ...exemption, owner: '' }], [{ ...exemption, reason: ' ' }], [exemption, exemption]]) {
    expect(() => buildContentReviewSchedule({ today: '2026-07-13', items: [item('selected', '2026-07-12')], exceptions })).toThrow();
  }
});

it('requires a concrete safe follow-up reference for exemptions', () => {
  for (const followUp of ['', 'javascript:alert(1)']) {
    expect(() => buildContentReviewSchedule({ today: '2026-07-13', items: [item('selected', '2026-07-12')], exceptions: [{ ...exemption, followUp }] })).toThrow();
  }
});

const { buildReviewIssueDraft } = await import('../../scripts/lib/content-review-schedule.mjs') as { buildReviewIssueDraft: (item: { id: string; collection: string; label: string; path: string; nextReviewDue: string; reviewedAt: string; owner?: string; sourceUrls?: string[]; recordHref?: string }, existing?: Array<{ body: string; url?: string }>) => { duplicateUrl?: string; marker: string; body: string; title: string; newIssueUrl?: string } };

it('renders an actionable source and ownership queue without fabricating a reviewer', () => {
  const schedule = buildContentReviewSchedule({ today: '2026-07-13', items: [{ ...item('source-change', '2026-07-12'), sourceChangeContext: 'memos: changed (fetch/diff is not review)', sourceUrls: ['https://docs.thorchain.org'], recordHref: 'https://github.com/Reedtrullz/tcwiki/blob/main/src/test.ts#L12' }] });
  const markdown = formatContentReviewSchedule(schedule);
  expect(markdown).toContain('unassigned');
  expect(markdown).toContain('https://docs.thorchain.org');
  expect(markdown).toContain('src/test.ts#L12');
  expect(markdown).toContain('source-change');
  expect(markdown).toContain('due date passed');
  expect(markdown).toContain('memos: changed (fetch/diff is not review)');
});

it('exports one stable review draft and recognizes an existing matching task', () => {
  const record = { ...item('source-change', '2026-07-12'), sourceUrls: ['https://docs.thorchain.org'] };
  const draft = buildReviewIssueDraft(record);
  expect(draft.marker).toBe(buildReviewIssueDraft(record).marker);
  expect(draft.body).toContain('Review decision and supporting evidence');
  expect(draft.body).toContain('Do not reset unrelated review dates');
  expect(draft.newIssueUrl).toContain('https://github.com/Reedtrullz/tcwiki/issues/new?');
  const duplicate = buildReviewIssueDraft(record, [{ body: draft.body, url: 'https://github.com/Reedtrullz/tcwiki/issues/123' }]);
  expect(duplicate.duplicateUrl).toBe('https://github.com/Reedtrullz/tcwiki/issues/123');
  expect(duplicate.newIssueUrl).toBeUndefined();
});

it('surfaces a changed source before the editorial due date without resetting that date', () => {
  const schedule = buildContentReviewSchedule({ today: '2026-07-13', items: [{ ...item('future', '2026-09-01'), sourceChangeContext: 'memos: changed (fetch/diff is not review)' }] });
  expect(schedule.attentionItems).toHaveLength(1);
  expect(schedule.attentionItems[0].status).toBe('later');
  expect(formatContentReviewSchedule(schedule)).toContain('before scheduled due date');
  expect(formatContentReviewSchedule(schedule)).toContain('2026-09-01');
});
