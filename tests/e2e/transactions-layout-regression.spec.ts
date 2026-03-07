import { config as loadEnv } from 'dotenv'
import { expect, test } from '@playwright/test'
import { loginWithPassphrase } from './helpers/auth'

loadEnv({ path: '.env.local' })

const testPassphrase = process.env.ADM_TEST_ACCOUNT_PK?.trim()
const testCrypto = 'DOGE'
const testTransactionId = '723a8f9d1f0083b5da91c2aae1df6434d854828d8e9fac5f11b30f021af3ba86'

test.describe('Transactions layout regressions', () => {
  test('keeps transaction details aligned to the shared mobile screen gutter', async ({ page }) => {
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await page.setViewportSize({ width: 390, height: 844 })
    await loginWithPassphrase(page, testPassphrase!)

    await page.goto(`/transactions/${testCrypto}/${testTransactionId}`, {
      waitUntil: 'domcontentloaded'
    })
    await expect(page).toHaveURL(new RegExp(`/transactions/${testCrypto}/${testTransactionId}$`))

    const firstRow = page.locator('.transaction-view__list .transaction-list-item').first()
    await expect(firstRow).toBeVisible()

    const metrics = await page.evaluate(() => {
      const list = document.querySelector('.transaction-view__list') as HTMLElement | null
      const row = document.querySelector(
        '.transaction-view__list .transaction-list-item'
      ) as HTMLElement | null
      const title = row?.querySelector('.transaction-list-item__title') as HTMLElement | null
      const value = row?.querySelector('.transaction-list-item__value') as HTMLElement | null

      if (!list || !row || !title || !value) {
        return null
      }

      const listRect = list.getBoundingClientRect()
      const rowRect = row.getBoundingClientRect()
      const titleRect = title.getBoundingClientRect()
      const valueRect = value.getBoundingClientRect()
      const rowStyle = getComputedStyle(row)

      return {
        listLeft: listRect.left,
        listRightGap: window.innerWidth - listRect.right,
        rowLeft: rowRect.left,
        rowRightGap: window.innerWidth - rowRect.right,
        rowPaddingLeft: Number.parseFloat(rowStyle.paddingLeft),
        rowPaddingRight: Number.parseFloat(rowStyle.paddingRight),
        titleLeft: titleRect.left,
        valueRightGap: window.innerWidth - valueRect.right
      }
    })

    expect(metrics).not.toBeNull()
    expect(Math.abs(metrics?.listLeft ?? 99)).toBeLessThanOrEqual(1)
    expect(Math.abs(metrics?.listRightGap ?? 99)).toBeLessThanOrEqual(1)
    expect(Math.abs(metrics?.rowLeft ?? 99)).toBeLessThanOrEqual(1)
    expect(Math.abs(metrics?.rowRightGap ?? 99)).toBeLessThanOrEqual(1)
    expect(metrics?.rowPaddingLeft ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.rowPaddingLeft ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.rowPaddingRight ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.rowPaddingRight ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.titleLeft ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.titleLeft ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.valueRightGap ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.valueRightGap ?? 99).toBeLessThanOrEqual(25)
  })

  test('keeps DOGE transaction rows aligned to the shared mobile screen gutter when present', async ({
    page
  }) => {
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await page.setViewportSize({ width: 390, height: 844 })
    await loginWithPassphrase(page, testPassphrase!)

    await page.goto(`/transactions/${testCrypto}`, { waitUntil: 'domcontentloaded' })
    test.skip(
      !new RegExp(`/transactions/${testCrypto}$`).test(page.url()),
      'The configured test account redirects DOGE list route to a different screen'
    )

    const transactions = page.locator('.transaction-item__tile')
    const emptyState = page.getByText(/no transactions/i)

    let routeState: 'transactions' | 'empty' | 'loading' = 'loading'
    const deadline = Date.now() + 15_000

    while (Date.now() < deadline && routeState === 'loading') {
      if ((await transactions.count()) > 0) {
        routeState = 'transactions'
        break
      }

      if (await emptyState.isVisible().catch(() => false)) {
        routeState = 'empty'
        break
      }

      await page.waitForTimeout(500)
    }

    test.skip(
      routeState !== 'transactions',
      'The configured test account does not expose stable DOGE list rows for e2e assertions'
    )

    const firstRow = transactions.first()
    await expect(firstRow).toBeVisible()

    const metrics = await firstRow.evaluate((row) => {
      const title = row.querySelector('.v-list-item-title') as HTMLElement | null
      const rowRect = row.getBoundingClientRect()
      const titleRect = title?.getBoundingClientRect()
      const rowStyle = getComputedStyle(row)

      return {
        rowLeft: rowRect.left,
        rowRightGap: window.innerWidth - rowRect.right,
        rowPaddingLeft: Number.parseFloat(rowStyle.paddingLeft),
        rowPaddingRight: Number.parseFloat(rowStyle.paddingRight),
        titleLeft: titleRect?.left ?? null
      }
    })

    expect(Math.abs(metrics.rowLeft)).toBeLessThanOrEqual(1)
    expect(Math.abs(metrics.rowRightGap)).toBeLessThanOrEqual(1)
    expect(metrics.rowPaddingLeft).toBeGreaterThanOrEqual(23)
    expect(metrics.rowPaddingLeft).toBeLessThanOrEqual(25)
    expect(metrics.rowPaddingRight).toBeGreaterThanOrEqual(23)
    expect(metrics.rowPaddingRight).toBeLessThanOrEqual(25)
    expect(metrics.titleLeft ?? 0).toBeGreaterThanOrEqual(47)
    expect(metrics.titleLeft ?? 99).toBeLessThanOrEqual(73)
  })
})
