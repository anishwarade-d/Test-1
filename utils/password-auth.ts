import { type Browser, type Page, type BrowserContext } from '@playwright/test';
import { env } from './env';
import { mockGeoLocation } from './geo-mock';

export type TestRole = 'admin' | 'learner';

export interface AuthOverrides {
  email?: string;
  password?: string;
  /** ISO 3166-1 alpha-2 country code for frontend geo-mock (e.g. "IN", "US"). */
  countryCode?: string;
}

interface ResolvedCredentials {
  email: string;
  password: string;
}

const credentials: Record<TestRole, { email: string; password: string }> = {
  admin: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD },
  learner: { email: env.LEARNER_EMAIL, password: env.LEARNER_PASSWORD },
};

function resolveCredentials(role: TestRole, overrides?: AuthOverrides): ResolvedCredentials {
  const merged = { ...credentials[role], ...overrides };

  if (!merged.email || !merged.password) {
    const source = overrides ? 'the provided overrides' : 'environment variables (BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD)';
    throw new Error(
      `Missing email/password for role "${role}".\nCheck ${source}.`,
    );
  }

  return { email: merged.email, password: merged.password };
}

async function submitLoginForm(page: Page, creds: ResolvedCredentials, role: TestRole, source: string): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  const emailInput = page.locator('#login-email');
  await emailInput.waitFor({ state: 'visible', timeout: Math.max(env.NAVIGATION_TIMEOUT, 60_000) });
  await emailInput.fill(creds.email);
  await page.locator('#login-password').fill(creds.password);
  await page.getByRole('button', { name: /Sign in with Email/i }).click();

  await page
    .waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 })
    .catch(() => {});

  if (page.url().includes('/login')) {
    const errorText = await page
      .locator('[class*="destructive"]')
      .textContent()
      .catch(() => 'Unknown error');
    throw new Error(
      `Email/password login failed for role "${role}": ${errorText}\nCheck ${source}.`,
    );
  }
}

export async function authenticateViaPassword(
  browser: Browser,
  role: TestRole,
  overrides?: AuthOverrides,
): Promise<{ page: Page; context: BrowserContext }> {
  const creds = resolveCredentials(role, overrides);
  const context = await browser.newContext();

  if (overrides?.countryCode) {
    await mockGeoLocation(context, overrides.countryCode);
  }

  const page = await context.newPage();
  const source = overrides ? 'the provided overrides' : 'environment variables';

  try {
    await submitLoginForm(page, creds, role, source);
  } catch (err) {
    await context.close();
    throw err;
  }

  return { page, context };
}

export async function loginWithPasswordOnPage(
  page: Page,
  role: TestRole,
  overrides?: AuthOverrides,
): Promise<void> {
  const creds = resolveCredentials(role, overrides);

  if (overrides?.countryCode) {
    await mockGeoLocation(page.context(), overrides.countryCode);
  }

  const source = overrides ? 'the provided overrides' : 'environment variables';
  await submitLoginForm(page, creds, role, source);
}
