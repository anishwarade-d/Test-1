import { type BrowserContext } from '@playwright/test';

/**
 * Intercept Cloudflare's `/cdn-cgi/trace` endpoint on every page opened
 * in the given context, returning a mocked response with the specified
 * ISO 3166-1 alpha-2 country code (e.g. "IN", "US").
 */
export async function mockGeoLocation(
  context: BrowserContext,
  countryCode: string,
): Promise<void> {
  const upper = countryCode.toUpperCase();

  await context.route('**/cdn-cgi/trace', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: [
        'fl=1f1',
        'h=localhost',
        'ip=127.0.0.1',
        'ts=0',
        'visit_scheme=https',
        'uag=PlaywrightTest',
        'colo=TEST',
        'sliver=none',
        'http=http/2',
        `loc=${upper}`,
        'tls=TLSv1.3',
        'sni=plaintext',
        'warp=off',
        'gateway=off',
        'rbi=off',
        'kex=X25519',
      ].join('\n'),
    }),
  );
}
