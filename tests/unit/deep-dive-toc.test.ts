import { describe, expect, it } from 'vitest';
import { findDeepDiveTocTitleMismatches } from '../../scripts/lib/deep-dive-toc.mjs';

describe('deep-dive TOC validation helpers', () => {
  it('detects TOC labels that drift from the heading behind the same anchor', () => {
    const mismatches = findDeepDiveTocTitleMismatches({
      headingsByAnchor: new Map([
        ['what-this-page-can-prove', 'What This Page Can Prove'],
        ['evidence-ladder', 'Evidence Ladder'],
      ]),
      tocItems: [
        { title: 'What This Page Proves', href: '#what-this-page-can-prove' },
        { title: 'Evidence Ladder', href: '#evidence-ladder' },
      ],
    });

    expect(mismatches).toEqual([
      {
        anchor: 'what-this-page-can-prove',
        expectedTitle: 'What This Page Can Prove',
        actualTitle: 'What This Page Proves',
      },
    ]);
  });

  it('ignores case and whitespace differences that do not change the visible heading words', () => {
    const mismatches = findDeepDiveTocTitleMismatches({
      headingsByAnchor: new Map([
        ['source-roles', 'Source Roles'],
        ['non-claims', 'Non-Claims'],
      ]),
      tocItems: [
        { title: ' source roles ', href: '#source-roles' },
        { title: 'Non Claims', href: '#non-claims' },
      ],
    });

    expect(mismatches).toEqual([]);
  });
});
