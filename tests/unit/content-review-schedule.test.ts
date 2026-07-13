import { describe, expect, it } from 'vitest';

const { buildContentReviewSchedule, formatContentReviewSchedule } = await import('../../scripts/lib/content-review-schedule.mjs') as {
  buildContentReviewSchedule: (input: {
    today: string;
    horizonDays?: number;
    items: Array<{
      id: string;
      collection: string;
      label: string;
      path: string;
      reviewedAt: string;
      nextReviewDue: string;
    }>;
  }) => {
    status: string;
    horizon: string;
    summary: { total: number; overdue: number; dueToday: number; dueSoon: number; later: number };
    attentionItems: Array<{ id: string; status: string }>;
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
    expect(schedule.summary).toEqual({ total: 4, overdue: 1, dueToday: 1, dueSoon: 1, later: 1 });
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
