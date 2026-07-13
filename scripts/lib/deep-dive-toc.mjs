function normalizeHeadingTitle(value) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function findDeepDiveTocTitleMismatches({ headingsByAnchor, tocItems }) {
  const mismatches = [];

  for (const item of tocItems) {
    if (!item || typeof item !== 'object' || typeof item.href !== 'string' || !item.href.startsWith('#')) {
      continue;
    }

    const anchor = item.href.slice(1);
    const expectedTitle = headingsByAnchor.get(anchor);
    if (!expectedTitle || typeof item.title !== 'string') {
      continue;
    }

    const actualTitle = item.title.trim();
    if (normalizeHeadingTitle(actualTitle) !== normalizeHeadingTitle(expectedTitle)) {
      mismatches.push({
        anchor,
        expectedTitle,
        actualTitle,
      });
    }
  }

  return mismatches;
}
