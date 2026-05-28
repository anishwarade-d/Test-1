/**
 * Playwright: **Testflow-Workshop Search Functionality.pdf**
 *
 * Admin → Workshops → search bar ("Search workshops...") → full title match →
 * partial keyword → clear restores list.
 */

import { test, expect, type Page } from '@playwright/test';
import { authenticateViaPassword } from '../../../utils/password-auth';
import { ensureAdminView } from '../../../utils/admin/ensure-admin-view';
import { openWorkshopsFromSidebar } from '../../../utils/admin/open-workshops-from-sidebar';

/** Title link on each workshop card (see CourseListPage). */
function workshopTitleLinks(page: Page) {
  return page.locator('a.text-lg.font-bold');
}

function workshopSearchInput(page: Page) {
  return page.getByPlaceholder('Search workshops...');
}

/** Pick a substring likely to match multiple titles when possible. */
function pickPartialKeyword(fullTitle: string): string {
  const trimmed = fullTitle.trim();
  const words = trimmed.split(/\s+/).filter((w) => w.length >= 3);
  if (words.length >= 1) return words[0]!;
  return trimmed.slice(0, Math.min(4, trimmed.length)) || trimmed;
}

/**
 * Longest-first title that uniquely matches itself under substring search
 * (admin list filters with includes, so short titles can match many rows).
 */
function pickDiscriminatingFullTitle(titles: readonly string[]): string | null {
  const trimmed = titles.map((t) => t.trim()).filter(Boolean);
  if (trimmed.length === 0) return null;
  const sorted = [...trimmed].sort((a, b) => b.length - a.length);
  for (const candidate of sorted) {
    const lower = candidate.toLowerCase();
    const matchCount = trimmed.filter((u) => u.toLowerCase().includes(lower)).length;
    if (matchCount === 1) return candidate;
  }
  return null;
}

test.describe('Admin — Workshop search', () => {
  test.describe.configure({ mode: 'serial', retries: 0, timeout: 180_000 });

  let page: Page | undefined;

  test.beforeAll(async ({ browser }) => {
    const session = await authenticateViaPassword(browser, 'admin');
    page = session.page;
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('Search Workshops by title and keyword', async () => {
    await ensureAdminView(page!);
    await openWorkshopsFromSidebar(page!);

    const searchInput = workshopSearchInput(page!);
    await expect(searchInput).toBeVisible({ timeout: 30_000 });

    const titleLinks = workshopTitleLinks(page!);
    await expect(titleLinks.first()).toBeVisible({ timeout: 60_000 });
    const baselineCount = await titleLinks.count();
    test.skip(baselineCount === 0, 'No workshops on list — seed data required for search test.');

    const allTitlesRaw = await titleLinks.allTextContents();
    const pickedFullTitle = pickDiscriminatingFullTitle(allTitlesRaw);
    if (!pickedFullTitle) {
      test.skip(true, 'No workshop title uniquely filters the list — add a workshop with a distinct full title.');
    }
    const sampleFullTitle = pickedFullTitle!;

    await test.step('Full title search — list narrows to matching workshop(s)', async () => {
      await searchInput.fill(sampleFullTitle);
      await expect(searchInput).toHaveValue(sampleFullTitle);

      const visibleAfterFull = workshopTitleLinks(page!);
      const n = await visibleAfterFull.count();
      expect(n, 'Expected at least one workshop after full-title search').toBeGreaterThanOrEqual(1);
      for (let i = 0; i < n; i++) {
        await expect(visibleAfterFull.nth(i)).toHaveText(sampleFullTitle);
      }
    });

    const partial = pickPartialKeyword(sampleFullTitle);

    await test.step('Partial keyword search — visible titles contain keyword', async () => {
      await searchInput.clear();
      await searchInput.fill(partial);
      await expect(searchInput).toHaveValue(partial);

      const visibleAfterPartial = workshopTitleLinks(page!);
      const m = await visibleAfterPartial.count();
      expect(m, 'Expected at least one workshop matching partial keyword').toBeGreaterThanOrEqual(1);
      expect(m, 'Partial search should not show more workshops than unfiltered list').toBeLessThanOrEqual(baselineCount);

      const lower = partial.toLowerCase();
      for (let i = 0; i < m; i++) {
        const text = ((await visibleAfterPartial.nth(i).textContent()) ?? '').toLowerCase();
        expect(text, `row ${i}: title should include "${partial}"`).toContain(lower);
      }
    });

    await test.step('Clear search — full workshop list visible again', async () => {
      await searchInput.clear();
      await expect(searchInput).toHaveValue('');

      await expect(workshopTitleLinks(page!)).toHaveCount(baselineCount, { timeout: 15_000 });
    });
  });
});
