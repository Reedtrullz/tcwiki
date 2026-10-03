import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import RouteError from '@/app/error';
import NotFound from '@/app/not-found';
import { getRouteRecoveryAction } from '@/components/features/RouteRecoveryPanel';

describe('route recovery fallbacks', () => {
  it('gives unmatched routes a focused, announced recovery view with useful destinations', () => {
    const html = renderToStaticMarkup(createElement(NotFound));

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('That page could not be found');
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/docs"');
    expect(html).toContain('href="/search"');
  });

  it('offers a retry action without rendering exception details', () => {
    const reset = vi.fn();
    const html = renderToStaticMarkup(createElement(RouteError, {
      error: new Error('private server detail'),
      reset,
    }));

    expect(html).toContain('Some page content failed to load');
    expect(html).toContain('Try again');
    expect(html).not.toContain('private server detail');
    expect(html).not.toContain('stack');
  });

  it('uses Next retry when present and the installed vinext reset callback otherwise', () => {
    const retry = vi.fn();
    const reset = vi.fn();

    getRouteRecoveryAction(retry, reset)?.();
    expect(retry).toHaveBeenCalledOnce();
    expect(reset).not.toHaveBeenCalled();

    getRouteRecoveryAction(undefined, reset)?.();
    expect(reset).toHaveBeenCalledOnce();
  });
});
