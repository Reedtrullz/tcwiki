export function slugifyDeepDiveHeading(value) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/\p{M}/gu, '')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

export function uniqueDeepDiveHeadingIds(headings) {
  const counts = new Map();
  const used = new Set();

  return headings.map(({ title, explicitId }) => {
    const base = (explicitId ?? slugifyDeepDiveHeading(title)) || 'section';
    let count = counts.get(base) ?? 0;
    let id = count === 0 ? base : `${base}-${count}`;
    while (used.has(id)) {
      count += 1;
      id = `${base}-${count}`;
    }
    counts.set(base, count + 1);
    used.add(id);
    return id;
  });
}
