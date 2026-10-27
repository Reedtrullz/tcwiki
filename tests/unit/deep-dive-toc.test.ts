import { describe, expect, it } from 'vitest';
import { findDeepDiveTocTitleMismatches } from '../../scripts/lib/deep-dive-toc.mjs';
import { parseDeepDiveSource } from '../../scripts/lib/deep-dive-toc.mjs';

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

  it('derives stable unique anchors and bounded sections from MDX headings', () => {
    const parsed = parseDeepDiveSource([
      '# Unicode — Article',
      '',
      '## **Café** & 東京!',
      '',
      'A section about the unique protocol sentinel.',
      '',
      '### Repeated heading',
      '',
      'Nested detail.',
      '',
      '## Cafe & 東京!',
      '',
      'Another section.',
      '',
      '<h2 id="public-fragment">Explicit target</h2>',
      '',
      'This section keeps its authored anchor.',
    ].join('\n'));

    expect(parsed.title).toBe('Unicode — Article');
    expect(parsed.headings.map(({ title, id }) => [title, id])).toEqual([
      ['Unicode — Article', 'unicode-article'],
      ['Café & 東京!', 'cafe-and-東京'],
      ['Repeated heading', 'repeated-heading'],
      ['Cafe & 東京!', 'cafe-and-東京-1'],
      ['Explicit target', 'public-fragment'],
    ]);
    expect(parsed.sections).toEqual(expect.arrayContaining([
      expect.objectContaining({
        title: 'Café & 東京!',
        id: 'cafe-and-東京',
        content: expect.stringContaining('unique protocol sentinel'),
      }),
      expect.objectContaining({ title: 'Repeated heading', id: 'repeated-heading' }),
      expect.objectContaining({ title: 'Cafe & 東京!', id: 'cafe-and-東京-1' }),
      expect.objectContaining({ title: 'Explicit target', id: 'public-fragment' }),
    ]));
    expect(parsed.sections.every(({ content }) => content.length <= 1200)).toBe(true);
  });
});
