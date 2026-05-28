import { defineConfig, devices } from '@playwright/test';
import { env } from './utils/env';

export default defineConfig({
  testDir: './tests',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 1,
  timeout: 180_000,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],

  use: {
    baseURL: env.BASE_URL,
    headless: env.HEADLESS,
    actionTimeout: env.ACTION_TIMEOUT,
    navigationTimeout: env.NAVIGATION_TIMEOUT,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'admin',
      testDir: './tests/admin',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
