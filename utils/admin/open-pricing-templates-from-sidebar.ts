import { expect, type Page } from '@playwright/test';

/** Open Commerce → Pricing Templates and wait for the list shell. */
export async function openPricingTemplatesFromSidebar(page: Page): Promise<void> {
  const commerceBtn = page.getByRole('button', { name: /^Commerce$/i });
  const pricingLink = page.getByRole('link', { name: /^Pricing Templates$/i });
  if ((await commerceBtn.getAttribute('aria-expanded')) === 'false') {
    await commerceBtn.click();
  }
  await pricingLink.waitFor({ state: 'visible', timeout: 15_000 });
  await pricingLink.click();
  await expect(page).toHaveURL(/\/admin\/pricing-templates/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'Pricing Templates' })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole('button', { name: 'Create Template' })).toBeVisible({ timeout: 60_000 });
}
