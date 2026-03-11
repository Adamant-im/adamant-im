import { config as loadEnv } from 'dotenv'
import { expect, test, type Page } from '@playwright/test'
import { loginWithPassphrase } from './helpers/auth'

loadEnv({ path: '.env.local' })

const testPassphrase = process.env.ADM_TEST_ACCOUNT_PK?.trim()
const testDetailsCrypto = 'DOGE'
const testListCrypto = 'ADM'
const testTransactionId = '723a8f9d1f0083b5da91c2aae1df6434d854828d8e9fac5f11b30f021af3ba86'

const openTransactionListFromHome = async (page: Page, crypto: string) => {
  await page.goto('/home', { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(/\/home(?:\/)?$/)

  const activeWalletTab = page.locator('[role="tab"][aria-selected="true"]').first()
  const activeTabText = (await activeWalletTab.textContent())?.trim() ?? ''

  if (!activeTabText.includes(crypto)) {
    await page.getByRole('tab', { name: new RegExp(crypto, 'i') }).click()
  }

  const activeWalletCard = page.locator('.v-window-item--active .wallet-card').first()
  await expect(activeWalletCard).toBeVisible()

  await activeWalletCard.locator('.wallet-card__tile').nth(1).click()
  await expect(page).toHaveURL(new RegExp(`/transactions/${crypto}$`))
}

const assertTransactionDetailsScreenGutter = async (page: Page) => {
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
      rowLeftInset: rowRect.left - listRect.left,
      rowRightInset: listRect.right - rowRect.right,
      rowPaddingLeft: Number.parseFloat(rowStyle.paddingLeft),
      rowPaddingRight: Number.parseFloat(rowStyle.paddingRight),
      titleLeftInset: titleRect.left - rowRect.left,
      valueRightInset: rowRect.right - valueRect.right
    }
  })

  expect(metrics).not.toBeNull()
  expect(Math.abs(metrics?.rowLeftInset ?? 99)).toBeLessThanOrEqual(1)
  expect(Math.abs(metrics?.rowRightInset ?? 99)).toBeLessThanOrEqual(1)
  expect(metrics?.rowPaddingLeft ?? 0).toBeGreaterThanOrEqual(23)
  expect(metrics?.rowPaddingLeft ?? 99).toBeLessThanOrEqual(25)
  expect(metrics?.rowPaddingRight ?? 0).toBeGreaterThanOrEqual(23)
  expect(metrics?.rowPaddingRight ?? 99).toBeLessThanOrEqual(25)
  expect(metrics?.titleLeftInset ?? 0).toBeGreaterThanOrEqual(23)
  expect(metrics?.titleLeftInset ?? 99).toBeLessThanOrEqual(25)
  expect(metrics?.valueRightInset ?? 0).toBeGreaterThanOrEqual(23)
  expect(metrics?.valueRightInset ?? 99).toBeLessThanOrEqual(25)
}

test.describe('Transactions layout regressions', () => {
  test('keeps transaction details aligned to the shared screen gutter on mobile', async ({
    page
  }) => {
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await page.setViewportSize({ width: 390, height: 844 })
    await loginWithPassphrase(page, testPassphrase!)

    await page.goto(`/transactions/${testDetailsCrypto}/${testTransactionId}`, {
      waitUntil: 'domcontentloaded'
    })
    await expect(page).toHaveURL(
      new RegExp(`/transactions/${testDetailsCrypto}/${testTransactionId}$`)
    )

    await assertTransactionDetailsScreenGutter(page)
  })

  test('keeps transaction details aligned to the shared screen gutter on desktop', async ({
    page
  }) => {
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await page.setViewportSize({ width: 1366, height: 900 })
    await loginWithPassphrase(page, testPassphrase!)

    await page.goto(`/transactions/${testDetailsCrypto}/${testTransactionId}`, {
      waitUntil: 'domcontentloaded'
    })
    await expect(page).toHaveURL(
      new RegExp(`/transactions/${testDetailsCrypto}/${testTransactionId}$`)
    )

    await assertTransactionDetailsScreenGutter(page)
  })

  test('keeps ADM transaction rows aligned to the shared screen gutter on desktop when route is available', async ({
    page
  }) => {
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await page.setViewportSize({ width: 1366, height: 900 })
    await loginWithPassphrase(page, testPassphrase!)

    await openTransactionListFromHome(page, testListCrypto)

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
      'The configured test account does not expose stable ADM list rows for e2e assertions'
    )

    const firstRow = transactions.first()
    await expect(firstRow).toBeVisible()

    const metrics = await page.evaluate(() => {
      const list = document.querySelector('.transactions-view__list') as HTMLElement | null
      const row = document.querySelector('.transaction-item__tile') as HTMLElement | null
      const title = row?.querySelector('.v-list-item-title') as HTMLElement | null
      if (!list || !row || !title) {
        return null
      }

      const listRect = list.getBoundingClientRect()
      const rowRect = row.getBoundingClientRect()
      const titleRect = title.getBoundingClientRect()
      const rowStyle = getComputedStyle(row)

      return {
        rowLeftInset: rowRect.left - listRect.left,
        rowRightInset: listRect.right - rowRect.right,
        rowPaddingLeft: Number.parseFloat(rowStyle.paddingLeft),
        rowPaddingRight: Number.parseFloat(rowStyle.paddingRight),
        titleLeftInset: titleRect.left - rowRect.left
      }
    })

    expect(metrics).not.toBeNull()
    expect(Math.abs(metrics?.rowLeftInset ?? 99)).toBeLessThanOrEqual(1)
    expect(Math.abs(metrics?.rowRightInset ?? 99)).toBeLessThanOrEqual(1)
    expect(metrics?.rowPaddingLeft ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.rowPaddingLeft ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.rowPaddingRight ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.rowPaddingRight ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.titleLeftInset ?? 0).toBeGreaterThanOrEqual(47)
    expect(metrics?.titleLeftInset ?? 99).toBeLessThanOrEqual(73)
  })
})
