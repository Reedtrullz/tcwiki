import type { MDXComponents } from 'mdx/types';
import type { ReactNode } from 'react';
import { slugifyFragment } from '@/lib/utils';

function textFromChildren(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(textFromChildren).join(' ');
  }
  return '';
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: ({ children, ...props }) => (
      <h2 id={slugifyFragment(textFromChildren(children))} {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 id={slugifyFragment(textFromChildren(children))} {...props}>
        {children}
      </h3>
    ),
    ...components,
  };
}
