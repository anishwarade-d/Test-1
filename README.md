# Test-1 — Playwright + GitHub Actions POC

Proof-of-concept showing how a real Gurukula LMS admin Playwright test
can be run on every push / PR via GitHub Actions, and how the HTML
report is published as a downloadable artifact.

## What's in here

A copy of the `workshop-admin-search` admin spec from the main
`remix-of-gurukula-lms` repo, plus the minimal helper files it needs.
The test logs in as admin, opens **Content → Workshops**, and verifies
the search bar (full title, partial keyword, clear) against the public
Gurukula dev environment.

## Run locally

Create a `.env` file at the repo root with:

```
BASE_URL=https://lms-dev.mahabharatastory.com
HEADLESS=true
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
```

Then:

```bash
npm ci
npx playwright install --with-deps chromium
npm run test:admin
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

### Required GitHub repository secrets

Set these under **Settings → Secrets and variables → Actions → New repository secret**:

| Name | Value |
|---|---|
| `BASE_URL` | `https://lms-dev.mahabharatastory.com` |
| `ADMIN_EMAIL` | the Playwright admin email |
| `ADMIN_PASSWORD` | the Playwright admin password |
