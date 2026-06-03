/**
 * Playwright: **Testflow-Pricing Template Search and Filtering Functionality.pdf**
 *
 * Admin → Pricing Templates → full name search → partial keyword → clear →
 * type filter Live Batch → Self-Guided → All Types →
 * no-results empty-state for an unmatched query.
 */

import { test, expect, type Page, type Locator } from '@playwright/test';
import { authenticateViaPassword } from '../../../utils/password-auth';
import { ensureAdminView } from '../../../utils/admin/ensure-admin-view';
import { openPricingTemplatesFromSidebar } from '../../../utils/admin/open-pricing-templates-from-sidebar';

function templateSearchInput(page: Page): Locator {
  return page.getByPlaceholder('Search templates...');
}

function typeFilterTrigger(page: Page): Locator {
  return page
    .locator('.flex.flex-col')
    .filter({ has: templateSearchInput(page) })
    .getByRole('combobox');
}

function templateNameCells(page: Page): Locator {
  return page.locator('table tbody tr td:first-child');
}

function liveBatchSectionTitle(page: Page): Locator {
  return page.getByText('Live Batch Templates', { exact: true });
}

function selfGuidedSectionTitle(page: Page): Locator {
  return page.getByText('Self-Guided Templates', { exact: true });
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
 * (list filters with includes, so short titles can match many rows).
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

async function waitForTemplateList(page: Page): Promise<void> {
  await expect(
    page
      .getByText('No pricing templates yet.')
      .or(page.locator('table tbody tr').first()),
  ).toBeVisible({ timeout: 60_000 });
}

async function selectTypeFilter(
  page: Page,
  label: 'All Types' | 'Live Batch' | 'Self-Guided',
): Promise<void> {
  const trigger = typeFilterTrigger(page);
  await trigger.click();
  await page.getByRole('option', { name: label, exact: true }).click();
  await expect(trigger).toContainText(label, { timeout: 10_000 });
}

const MONTHS_OF_YEAR = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const HOUR_BANDS = [
  'Midnight', 'Early Morning', 'Morning', 'Late Morning',
  'Midday', 'Afternoon', 'Evening', 'Night',
] as const;

const MINUTE_BANDS = ['At Start', 'Quarter Past', 'Half Past', 'Three Quarter'] as const;

function buildAbsentBatchName(now = new Date()): string {
  const month = MONTHS_OF_YEAR[now.getUTCMonth()]!;
  const hour = HOUR_BANDS[Math.min(Math.floor(now.getUTCHours() / 3), HOUR_BANDS.length - 1)]!;
  const minute = MINUTE_BANDS[Math.min(Math.floor(now.getUTCMinutes() / 15), MINUTE_BANDS.length - 1)]!;
  return `Imaginary ${month} ${hour} ${minute} Batch`;
}

test.describe('Admin — Pricing template search and filter', () => {
  test.describe.configure({ mode: 'serial', retries: 0, timeout: 180_000 });

  let page: Page | undefined;

  test.beforeAll(async ({ browser }) => {
    const session = await authenticateViaPassword(browser, 'admin');
    page = session.page;
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('No results — junk query shows empty-state copy', async () => {
    await ensureAdminView(page!);
    await openPricingTemplatesFromSidebar(page!);

    const searchInput = templateSearchInput(page!);
    await expect(searchInput).toBeVisible({ timeout: 30_000 });
    await waitForTemplateList(page!);

    const absentBatchName = buildAbsentBatchName();
    await searchInput.fill(absentBatchName);
    await expect(searchInput).toHaveValue(absentBatchName);

    const emptyState = page!.getByText(
      /No templates match your filters\.|No pricing templates yet\./,
    );
    await expect(emptyState).toBeVisible({ timeout: 15_000 });

    await expect(liveBatchSectionTitle(page!)).toHaveCount(0);
    await expect(selfGuidedSectionTitle(page!)).toHaveCount(0);
    await expect(page!.locator('table tbody tr')).toHaveCount(0);

    await searchInput.clear();
    await expect(searchInput).toHaveValue('');
  });

  test('Search and filter Pricing Templates', async () => {
    await ensureAdminView(page!);
    await openPricingTemplatesFromSidebar(page!);

    const searchInput = templateSearchInput(page!);
    await expect(searchInput).toBeVisible({ timeout: 30_000 });
    await waitForTemplateList(page!);

    const nameCells = templateNameCells(page!);
    const baselineCount = await nameCells.count();
    test.skip(baselineCount === 0, 'No pricing templates on list — seed data required for search test.');

    const allNamesRaw = await nameCells.allTextContents();
    const pickedFullTitle = pickDiscriminatingFullTitle(allNamesRaw);
    if (!pickedFullTitle) {
      test.skip(true, 'No template name uniquely filters the list — add a template with a distinct full name.');
    }
    const sampleFullTitle = pickedFullTitle!;

    const baselineLiveVisible = await liveBatchSectionTitle(page!).isVisible();
    const baselineSelfVisible = await selfGuidedSectionTitle(page!).isVisible();

    await test.step('Full title search — only matching template row(s)', async () => {
      await searchInput.fill(sampleFullTitle);
      await expect(searchInput).toHaveValue(sampleFullTitle);

      const visible = templateNameCells(page!);
      const n = await visible.count();
      expect(n, 'Expected at least one template after full-title search').toBeGreaterThanOrEqual(1);
      for (let i = 0; i < n; i++) {
        await expect(visible.nth(i)).toHaveText(sampleFullTitle);
      }
    });

    const partial = pickPartialKeyword(sampleFullTitle);

    await test.step('Partial keyword search — visible names contain keyword', async () => {
      await searchInput.clear();
      await searchInput.fill(partial);
      await expect(searchInput).toHaveValue(partial);

      const visible = templateNameCells(page!);
      const m = await visible.count();
      expect(m, 'Expected at least one template matching partial keyword').toBeGreaterThanOrEqual(1);
      expect(m, 'Partial search should not show more rows than unfiltered list').toBeLessThanOrEqual(baselineCount);

      const lower = partial.toLowerCase();
      for (let i = 0; i < m; i++) {
        const text = ((await visible.nth(i).textContent()) ?? '').toLowerCase();
        expect(text, `row ${i}: name should include "${partial}"`).toContain(lower);
      }
    });

    await test.step('Clear search — full template list visible again', async () => {
      await searchInput.clear();
      await expect(searchInput).toHaveValue('');

      await expect(templateNameCells(page!)).toHaveCount(baselineCount, { timeout: 15_000 });
    });

    await test.step('Type filter — Live Batch hides Self-Guided directory', async () => {
      test.skip(
        !baselineLiveVisible || !baselineSelfVisible,
        'Need both Live Batch and Self-Guided templates for type filter assertions.',
      );

      await selectTypeFilter(page!, 'Live Batch');
      await expect(liveBatchSectionTitle(page!)).toBeVisible({ timeout: 15_000 });
      await expect(selfGuidedSectionTitle(page!)).toBeHidden({ timeout: 15_000 });

      const bodyRows = page!.locator('table tbody tr');
      const count = await bodyRows.count();
      expect(count).toBeGreaterThanOrEqual(1);
      for (let i = 0; i < count; i++) {
        await expect(bodyRows.nth(i).getByText('Live Batch', { exact: true })).toBeVisible();
      }
    });

    await test.step('Type filter — Self-Guided hides Live Batch directory', async () => {
      await selectTypeFilter(page!, 'Self-Guided');
      await expect(selfGuidedSectionTitle(page!)).toBeVisible({ timeout: 15_000 });
      await expect(liveBatchSectionTitle(page!)).toBeHidden({ timeout: 15_000 });

      const bodyRows = page!.locator('table tbody tr');
      const count = await bodyRows.count();
      expect(count).toBeGreaterThanOrEqual(1);
      for (let i = 0; i < count; i++) {
        await expect(bodyRows.nth(i).getByText('Self-Guided', { exact: true })).toBeVisible();
      }
    });

    await test.step('Type filter — All Types restores both directories', async () => {
      await selectTypeFilter(page!, 'All Types');
      await expect(typeFilterTrigger(page!)).toContainText('All Types', { timeout: 10_000 });

      await expect(templateNameCells(page!)).toHaveCount(baselineCount, { timeout: 15_000 });
      if (baselineLiveVisible) {
        await expect(liveBatchSectionTitle(page!)).toBeVisible({ timeout: 15_000 });
      }
      if (baselineSelfVisible) {
        await expect(selfGuidedSectionTitle(page!)).toBeVisible({ timeout: 15_000 });
      }
    });
  });
});
