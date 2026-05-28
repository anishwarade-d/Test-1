import { test, expect } from '@playwright/test';

test('home page loads @smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link navigates to docs @smoke', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Get started' }).click();
  await expect(
    page.getByRole('heading', { name: 'Installation' }),
  ).toBeVisible();
});
