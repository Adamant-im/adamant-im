import { expect, type Page } from '@playwright/test'

export const openTransactionListFromHome = async (page: Page, crypto: string) => {
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
