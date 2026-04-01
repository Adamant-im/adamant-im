# Playwright UI Smoke Checks

This folder contains dev-only Playwright smoke and regression checks for public and core authenticated routes

## Scope

- Verify core public screens render without runtime regressions
- Verify core authenticated chat routes render and navigate without runtime regressions
- Verify core authenticated app navigation routes (`/home`, `/chats`, `/options`)
- Catch critical UI breakages early (missing form controls, broken menu interactions, route rendering issues)
- Provide screenshots in Playwright reports for quick visual review

## Local run

1. Install Chromium once

```bash
npm run test:e2e:install
```

2. Run smoke checks

```bash
npm run test:e2e
```

3. Run smoke checks with extended artifacts (manual mode)

```bash
npm run test:e2e:detailed
```

4. Open latest HTML report

```bash
npm run test:e2e:report
```

## Notes

- Playwright is used as a development and CI quality gate only
- It is not bundled into production artifacts
- Tests intentionally focus on stable, high-value checks to reduce flaky runs
- Every run is stored under `playwright-report/YYYY-MM-DD HH:MM/`
- If the same minute is reused, a numeric suffix is appended: `YYYY-MM-DD HH:MM (2)`
- Default mode keeps only failure artifacts, detailed mode keeps artifacts for all tests
- For transaction list routes like `/transactions/ADM` or `/transactions/DOGE`, open them through `Home -> Balance` for the target wallet
- Do not use direct `page.goto('/transactions/:crypto')` for transaction list e2e flows because those routes can redirect to `/home`

## Stable UI Test Practices

- Prefer route and interaction flows that match real user behavior instead of shortcut URLs when those URLs have redirects or auth side effects
- Prefer assertions on stable layout contracts such as spacing, viewport fit, row height, control visibility, and route persistence
- Avoid brittle thresholds when component width depends on shared dialog constraints or runtime viewport rounding; use realistic bounds that reflect the actual shared tokens
- If a combined Playwright run fails but the isolated scenario passes, treat it as a flake first and record that distinction in the change summary
