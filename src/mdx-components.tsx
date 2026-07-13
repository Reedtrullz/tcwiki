import type { MDXComponents } from 'mdx/types';
import type { ReactNode } from 'react';
import { cn, slugifyFragment } from '@/lib/utils';

function textFromChildren(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(textFromChildren).join(' ');
  }
  return '';
}

function stripInvalidTableWhitespace(children: ReactNode): ReactNode {
  if (!Array.isArray(children)) {
    return children;
  }

  return children.filter((child) => typeof child !== 'string' || child.trim().length > 0);
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    table: ({ children, ...props }) => (
      <div className="my-6 max-w-full overflow-x-auto rounded-md border border-border" data-layout-scroll-container="horizontal">
        <table {...props}>{stripInvalidTableWhitespace(children)}</table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead {...props}>{stripInvalidTableWhitespace(children)}</thead>
    ),
    tbody: ({ children, ...props }) => (
      <tbody {...props}>{stripInvalidTableWhitespace(children)}</tbody>
    ),
    tfoot: ({ children, ...props }) => (
      <tfoot {...props}>{stripInvalidTableWhitespace(children)}</tfoot>
    ),
    tr: ({ children, ...props }) => (
      <tr {...props}>{stripInvalidTableWhitespace(children)}</tr>
    ),
    h2: ({ children, className, id, ...props }) => (
      <h2
        id={typeof id === 'string' ? id : slugifyFragment(textFromChildren(children))}
        className={cn('scroll-mt-24', className)}
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, className, id, ...props }) => (
      <h3
        id={typeof id === 'string' ? id : slugifyFragment(textFromChildren(children))}
        className={cn('scroll-mt-24', className)}
        {...props}
      >
        {children}
      </h3>
    ),
    ...components,
  };
}
