import { expect, test, type Page } from '@playwright/test'

import {
  DEPLOYMENT_TARGETS,
  type DeploymentTarget
} from '../../vite-config/plugins/cspDeploymentCheck'
import { readLiveEnv } from '../shared/liveEnv'

/**
 * Browser smoke check of production builds under the enforced CSP: the login screen must render,
 * and no module loading error or CSP violation may occur, except violations a host declares for
 * content it injects itself. The dev server injects no CSP, so the targets are production builds:
 *
 * - `ADM_LIVE_DEPLOYMENTS=1` checks the public deployment matrix (read-only)
 * - `ADM_PRODUCTION_BUILD_URL` checks a local build, for example `npm run build` followed by
 *   `npx vite preview --config vite-pwa.config.ts --host 127.0.0.1 --port 4174`
 */
const productionBuildUrl = readLiveEnv('ADM_PRODUCTION_BUILD_URL')
const targets: Pick<DeploymentTarget, 'url' | 'expectedViolations'>[] = [
  ...(productionBuildUrl ? [{ url: productionBuildUrl }] : []),
  ...(readLiveEnv('ADM_LIVE_DEPLOYMENTS') === '1' ? DEPLOYMENT_TARGETS : [])
]

// Console errors that mean the app could not load its code. CSP violations are collected from
// `securitypolicyviolation` events instead, so expected ones can be told apart.
const STARTUP_ERROR = /module script|MIME type|dynamically imported module/i
// Leaves time for the node health checks that run on the login screen.
const SETTLE_MS = 5_000

async function openLoginScreen(
  page: Page,
  url: string,
  expectedViolations: readonly string[] = []
) {
  const problems: string[] = []

  await page.addInitScript(() => {
    const violations: string[] = []

    Object.defineProperty(window, '__cspViolations', { value: violations })
    window.addEventListener('securitypolicyviolation', (event) => {
      violations.push(`${event.effectiveDirective} ${event.blockedURI}`)
    })
  })
  page.on('console', (message) => {
    if (message.type() === 'error' && STARTUP_ERROR.test(message.text())) {
      problems.push(message.text())
    }
  })
  page.on('pageerror', (error) => {
    if (STARTUP_ERROR.test(error.message)) problems.push(error.message)
  })

  await page.goto(url)

  return async () => {
    const violations = await page.evaluate(
      () => (window as unknown as { __cspViolations: string[] }).__cspViolations
    )

    const unexpected = violations
      .filter((violation) => !expectedViolations.some((prefix) => violation.startsWith(prefix)))
      .map((violation) => `CSP violation: ${violation}`)

    return [...problems, ...unexpected]
  }
}

test.describe('Production build CSP smoke', () => {
  test.skip(
    targets.length === 0,
    'Set ADM_LIVE_DEPLOYMENTS=1 or ADM_PRODUCTION_BUILD_URL to check production builds'
  )

  for (const { url, expectedViolations } of targets) {
    test(`${url} renders the login screen without CSP or module errors`, async ({ page }) => {
      const collectProblems = await openLoginScreen(page, url, expectedViolations)

      await expect(page.locator('.login-page__title')).toBeVisible()
      await expect(page.locator('input[autocomplete="current-password"]')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible()
      await page.waitForTimeout(SETTLE_MS)

      expect(await collectProblems()).toEqual([])
    })
  }

  test('detects a module served as HTML', async ({ page }) => {
    test.skip(!productionBuildUrl, 'Needs ADM_PRODUCTION_BUILD_URL')

    // Reproduces an SPA fallback that answers module requests with index.html and HTTP 200.
    await page.route(/\.js(?:\?.*)?$/, async (route) => {
      const response = await route.fetch({ url: productionBuildUrl })

      await route.fulfill({ response, contentType: 'text/html' })
    })

    const collectProblems = await openLoginScreen(page, productionBuildUrl!)

    await expect(page.locator('input[autocomplete="current-password"]')).toHaveCount(0)
    await expect.poll(collectProblems).toContainEqual(expect.stringMatching(/MIME type/))
  })

  test('detects a CSP violation', async ({ page }) => {
    test.skip(!productionBuildUrl, 'Needs ADM_PRODUCTION_BUILD_URL')

    await page.route(productionBuildUrl!, async (route) => {
      const response = await route.fetch()
      const body = (await response.text()).replace(
        '</head>',
        '<script src="https://example.com/injected.js"></script></head>'
      )

      await route.fulfill({ response, body })
    })

    const collectProblems = await openLoginScreen(page, productionBuildUrl!)

    await expect
      .poll(collectProblems)
      .toContain('CSP violation: script-src-elem https://example.com/injected.js')
  })
})
