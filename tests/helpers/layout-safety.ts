import { expect, type Page } from '@playwright/test';

export async function readLayoutSafety(page: Page) {
  return page.locator('body').evaluate(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const pageWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const isInsideHorizontalScroller = (element: Element) => {
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent);
        const canScroll = /(auto|scroll|overlay)/.test(style.overflowX) && parent.scrollWidth > parent.clientWidth + 2;
        if (canScroll || parent.getAttribute('data-layout-scroll-container') === 'horizontal') {
          return true;
        }
        parent = parent.parentElement;
      }
      return false;
    };
    const overflowing = Array.from(document.querySelectorAll('body *'))
      .flatMap((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0 || rect.right <= viewportWidth + 2 || isInsideHorizontalScroller(element)) {
          return [];
        }
        const id = element.id ? `#${element.id}` : '';
        const className = typeof element.className === 'string'
          ? `.${element.className.trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.')}`
          : '';
        return [`${element.tagName.toLowerCase()}${id}${className} right=${Math.round(rect.right)}`];
      })
      .slice(0, 5);

    return {
      hasFrameworkOverlay: /Application error|Unhandled Runtime Error|Hydration failed/i.test(document.body.textContent ?? ''),
      overflowing,
      pageWidth,
      viewportHeight,
      viewportWidth,
    };
  });
}

export async function expectRouteVisualSafety(page: Page, path: string, heading: string | RegExp) {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });

  const routeHeading = page.getByRole('heading', { name: heading }).first();
  await expect(routeHeading).toBeVisible({ timeout: 15_000 });

  const layout = await readLayoutSafety(page);

  expect(layout.hasFrameworkOverlay, `${path} must not render a framework error overlay`).toBe(false);
  expect(
    layout.pageWidth,
    `${path} horizontal overflow ${JSON.stringify({ viewportWidth: layout.viewportWidth, overflowing: layout.overflowing })}`
  ).toBeLessThanOrEqual(layout.viewportWidth + 2);
  expect(
    layout.overflowing,
    `${path} has clipped elements ${JSON.stringify({ viewportWidth: layout.viewportWidth, overflowing: layout.overflowing })}`
  ).toEqual([]);

  const headingBox = await routeHeading.boundingBox();
  expect(headingBox, `${path} heading must be measurable`).not.toBeNull();
  expect(headingBox?.y ?? Number.POSITIVE_INFINITY, `${path} heading should be in the first viewport`).toBeLessThan(layout.viewportHeight);
}

export async function expectAnchorTargetVisualSafety(page: Page, href: string, selector: string, settleMs = 0) {
  await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });

  const target = page.locator(selector);
  await expect(target).toBeVisible({ timeout: 15_000 });
  if (settleMs > 0) {
    await page.waitForTimeout(settleMs);
  }

  const layout = await readLayoutSafety(page);
  expect(layout.hasFrameworkOverlay, `${href} must not render a framework error overlay`).toBe(false);
  expect(
    layout.pageWidth,
    `${href} horizontal overflow ${JSON.stringify({ viewportWidth: layout.viewportWidth, overflowing: layout.overflowing })}`
  ).toBeLessThanOrEqual(layout.viewportWidth + 2);
  expect(
    layout.overflowing,
    `${href} has clipped elements ${JSON.stringify({ viewportWidth: layout.viewportWidth, overflowing: layout.overflowing })}`
  ).toEqual([]);

  const targetBox = await target.boundingBox();
  expect(targetBox, `${href} target must be measurable`).not.toBeNull();
  expect(targetBox?.y ?? -1, `${href} target should clear the fixed header`).toBeGreaterThanOrEqual(52);
  expect(targetBox?.y ?? Number.POSITIVE_INFINITY, `${href} target should land in the first viewport`).toBeLessThan(layout.viewportHeight);
}
