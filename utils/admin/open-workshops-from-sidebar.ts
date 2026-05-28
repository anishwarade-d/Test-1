import { expect, type Page } from '@playwright/test';

/** Open Content → Workshops and wait for the list heading. */
export async function openWorkshopsFromSidebar(page: Page): Promise<void> {
  const contentBtn = page.getByRole('button', { name: /^Content$/i });
  const workshopsLink = page.getByRole('link', { name: /^Workshops$/i });
  if ((await contentBtn.getAttribute('aria-expanded')) === 'false') {
    await contentBtn.click();
  }
  await workshopsLink.waitFor({ state: 'visible', timeout: 15_000 });
  await workshopsLink.click();
  await expect(page).toHaveURL(/\/admin\/workshops/, { timeout: 30_000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  /** List shell can flash skeleton — wait for the primary CTA. */
  await expect(page.getByRole('button', { name: 'Create Workshop' })).toBeVisible({ timeout: 60_000 });
}
