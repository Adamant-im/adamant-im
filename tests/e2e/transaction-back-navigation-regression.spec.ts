import { testPassphrase } from './helpers/env'
import { expect, test, type Page } from '@playwright/test'
import { loginWithPassphrase } from './helpers/auth'

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
  await expect(page.locator('.transactions-view__list')).toBeVisible()
}

test.describe('Transaction back-navigation regressions', () => {
  test('browser back from transaction details stays on transaction list', async ({ page }) => {
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await page.setViewportSize({ width: 390, height: 844 })
    await loginWithPassphrase(page, testPassphrase!)

    await openTransactionListFromHome(page, 'ADM')

    const firstTx = page.locator('.transaction-item__tile').first()
    await expect(firstTx).toBeVisible()

    // Navigate into transaction details
    await firstTx.click()
    await expect(page).toHaveURL(/\/transactions\/ADM\/.+$/)

    // Simulate iOS swipe-right / browser Back button
    await page.goBack()

    // Must land back on the transaction list, not skip to /home
    await expect(page).toHaveURL(/\/transactions\/ADM$/)
    await expect(page.locator('.transactions-view__list')).toBeVisible()

    // Stay stable — no delayed second navigation to /home
    await page.waitForTimeout(2500)
    await expect(page).toHaveURL(/\/transactions\/ADM$/)
  })

  test('browser back from transaction details does not navigate to /home', async ({ page }) => {
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await page.setViewportSize({ width: 390, height: 844 })
    await loginWithPassphrase(page, testPassphrase!)

    await openTransactionListFromHome(page, 'ADM')

    const firstTx = page.locator('.transaction-item__tile').first()
    await expect(firstTx).toBeVisible()

    await firstTx.click()
    await expect(page).toHaveURL(/\/transactions\/ADM\/.+$/)

    // Track all URL changes after the goBack
    const urlsAfterBack: string[] = []
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        urlsAfterBack.push(frame.url())
      }
    })

    await page.goBack()
    await page.waitForTimeout(3000)

    const homeNavigations = urlsAfterBack.filter(
      (url) => url.includes('/home') && !url.includes('/transactions')
    )
    expect(homeNavigations).toHaveLength(0)
    await expect(page).toHaveURL(/\/transactions\/ADM$/)
  })
})
