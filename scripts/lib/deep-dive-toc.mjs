import { unified } from 'unified';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { uniqueDeepDiveHeadingIds } from '../../src/lib/deep-dive-heading-id.mjs';

function normalizeHeadingTitle(value) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function headingInfo(node) {
  if (node.type === 'heading') {
    return { level: node.depth, children: node.children };
  }
  const match = ['mdxJsxFlowElement', 'mdxJsxTextElement'].includes(node.type)
    && /^h([1-6])$/.exec(node.name ?? '');
  if (!match) {
    return null;
  }
  const id = node.attributes?.find((attribute) => attribute.name === 'id')?.value;
  return {
    level: Number(match[1]),
    children: node.children ?? [],
    explicitId: typeof id === 'string' ? id : undefined,
  };
}

function textFromNodes(nodes) {
  return nodes
    .flatMap((node) => {
      if (node.type === 'code' || node.type === 'mdxjsEsm' || node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression') {
        return [];
      }
      if (typeof node.value === 'string') {
        return [node.value];
      }
      return node.children ? [textFromNodes(node.children)] : [];
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function applyHeadingIds(tree) {
  const headings = [];
  const visit = (node, index) => {
    const info = headingInfo(node);
    if (info) {
      headings.push({ node, index, ...info, title: textFromNodes(info.children) });
      return;
    }
    node.children?.forEach((child) => visit(child, index));
  };
  tree.children.forEach((node, index) => visit(node, index));
  const ids = uniqueDeepDiveHeadingIds(headings.map(({ title, explicitId }) => ({ title, explicitId })));

  headings.forEach(({ node }, index) => {
    const id = ids[index];
    if (node.type === 'heading') {
      node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } };
      return;
    }
    const idAttribute = node.attributes.find((attribute) => attribute.name === 'id');
    if (idAttribute && typeof idAttribute.value === 'string') {
      idAttribute.value = id;
    } else if (!idAttribute) {
      node.attributes.push({ type: 'mdxJsxAttribute', name: 'id', value: id });
    }
  });

  return headings;
}

export function remarkDeepDiveHeadingIds() {
  return (tree) => {
    applyHeadingIds(tree);
  };
}

export default remarkDeepDiveHeadingIds;

const SECTION_CONTENT_LIMIT = 1200;

export function parseDeepDiveSource(source) {
  const tree = unified().use(remarkParse).use(remarkMdx).use(remarkGfm).parse(source);
  const headings = applyHeadingIds(tree).map(({ title, level, node, index }) => ({
    title,
    level,
    id: node.type === 'heading'
      ? node.data.hProperties.id
      : node.attributes.find((attribute) => attribute.name === 'id').value,
    index,
  }));
  const title = headings.find((heading) => heading.level === 1)?.title;
  const sections = headings.flatMap((heading, headingIndex) => {
    if (heading.level < 2) {
      return [];
    }
    const following = headings.slice(headingIndex + 1).find((candidate) => candidate.level <= heading.level);
    const endIndex = following?.index ?? tree.children.length;
    const sectionText = textFromNodes([
      ...tree.children.slice(heading.index, heading.index + 1),
      ...tree.children.slice(heading.index + 1, endIndex),
    ]).slice(0, SECTION_CONTENT_LIMIT).trim();
    return [{ title: heading.title, id: heading.id, level: heading.level, content: sectionText }];
  });

  return { title, headings, sections };
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
