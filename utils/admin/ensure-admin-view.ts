import type { Page } from '@playwright/test';

/** If the session is on learner shell, switch to Admin via the top bar. */
export async function ensureAdminView(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  if (page.url().includes('/admin')) return;
  await page.getByRole('button', { name: /Admin/i }).click();
  await page.waitForURL(/\/admin/, { timeout: 20_000 });
}
