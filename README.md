# Test-1 — Playwright + GitHub Actions POC

Minimal proof-of-concept showing how Playwright tests can be run on every
push / PR via GitHub Actions, and how the HTML report is published as a
downloadable artifact.

## Run locally

```bash
npm ci
npx playwright install --with-deps
npm test
```

Open the report:

```bash
npm run report
```

## CI

Pushing to `main` or opening a PR triggers `.github/workflows/e2e.yml`.
You can also trigger it manually from the **Actions** tab → **E2E** → **Run workflow**.

After a run finishes, scroll to the bottom of the run page and download
the `playwright-report` artifact, unzip it, and open `index.html`.

## What's in the suite

Two smoke tests against `https://playwright.dev` (no auth, no proxies):

1. Home page title matches `/Playwright/`.
2. "Get started" link navigates to the Installation docs.

Override the target with `BASE_URL` env var, e.g.:

```bash
BASE_URL=https://your-app.example.com npm test
```
