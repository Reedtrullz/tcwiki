import { describe, expect, it } from 'vitest';
import {
  ecosystemDirectoryPosture,
  ecosystemDirectoryPostureLabel,
} from '@/lib/ecosystem-directory';

describe('ecosystem directory posture', () => {
  it('treats official and curated evidence as catalog presence, not live activity', () => {
    expect(ecosystemDirectoryPosture('official')).toBe('listed');
    expect(ecosystemDirectoryPosture('curated')).toBe('listed');
    expect(ecosystemDirectoryPostureLabel('listed')).toBe('Catalog listed');
  });

  it('keeps source-review records visibly unresolved', () => {
    expect(ecosystemDirectoryPosture('needs-review')).toBe('needs-review');
    expect(ecosystemDirectoryPostureLabel('needs-review')).toBe('Needs source review');
  });

  it('keeps future historical records out of the current catalog posture', () => {
    expect(ecosystemDirectoryPosture('historical')).toBe('historical');
    expect(ecosystemDirectoryPostureLabel('historical')).toBe('Historical reference');
  });
});
