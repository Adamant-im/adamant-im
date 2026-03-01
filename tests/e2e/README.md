# Playwright UI Smoke Checks

This folder contains dev-only Playwright smoke checks for public UI routes

## Scope

- Verify core public screens render without runtime regressions
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
