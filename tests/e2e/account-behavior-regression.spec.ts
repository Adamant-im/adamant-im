import { config as loadEnv } from 'dotenv'
import { expect, test, type Page } from '@playwright/test'
import { loginWithNewAccount, loginWithPassphrase } from './helpers/auth'

loadEnv({ path: '.env.local', quiet: true })

const testPassphrase = process.env.ADM_TEST_ACCOUNT_PK?.trim()
const testDetailsCrypto = 'DOGE'
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
  await expect(page.locator('.transactions-view__list')).toBeVisible()
}

test.describe('Account behavior regressions', () => {
  test('shows cached transaction list without spinner when returning from chats', async ({
    page
  }) => {
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await page.setViewportSize({ width: 390, height: 844 })
    await loginWithPassphrase(page, testPassphrase!)

    await openTransactionListFromHome(page, 'ADM')

    const txCount = await page.locator('.transaction-item__tile').count()
    expect(txCount).toBeGreaterThan(0)

    await page.locator('.app-navigation .v-btn').nth(1).click()
    await expect(page).toHaveURL(/\/chats(?:\/)?$/)

    await page.locator('.app-navigation .v-btn').nth(0).click()
    await expect(page).toHaveURL(/\/transactions\/ADM$/)

    await expect(page.locator('.transactions-view__list')).toBeVisible()
    await expect(page.locator('.transactions-view__empty-state')).toHaveCount(0)

    // Verify no loading spinner appears during cached restore
    const spinnerVisibleDuringRestore = await page.evaluate(async () => {
      let sawSpinner = false

      const checkSpinner = () => {
        const spinner = document.querySelector(
          '.transactions-view__loading-item--recent'
        ) as HTMLElement | null

        if (spinner && spinner.offsetParent !== null) {
          sawSpinner = true
        }
      }

      checkSpinner()
      await new Promise((r) => requestAnimationFrame(() => r(undefined)))
      checkSpinner()
      await new Promise((r) => requestAnimationFrame(() => r(undefined)))
      checkSpinner()

      return sawSpinner
    })

    expect(spinnerVisibleDuringRestore).toBe(false)

    const txCountAfter = await page.locator('.transaction-item__tile').count()
    expect(txCountAfter).toBe(txCount)
  })

  test('refreshes transaction list when switching to a different wallet from home', async ({
    page
  }) => {
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await page.setViewportSize({ width: 390, height: 844 })
    await loginWithPassphrase(page, testPassphrase!)

    await openTransactionListFromHome(page, 'ADM')
    await expect(page.locator('.transaction-item__tile').first()).toBeVisible()

    await page.locator('.back-button').click()
    await expect(page).toHaveURL(/\/home(?:\/)?$/)

    await page.getByRole('tab', { name: /ETH/i }).click()

    const ethCard = page.locator('.v-window-item--active .wallet-card').first()
    await expect(ethCard).toBeVisible()
    await ethCard.locator('.wallet-card__tile').nth(1).click()

    await expect(page).toHaveURL(/\/transactions\/ETH$/)
    await expect(page.locator('.transactions-view__list')).toBeVisible()
  })

  test('highlights Balance action in sidebar when viewing transaction list on desktop', async ({
    page
  }) => {
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await page.setViewportSize({ width: 1366, height: 900 })
    await loginWithPassphrase(page, testPassphrase!)

    await page.goto('/home', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/home(?:\/)?$/)
    await expect(page.locator('.wallet-card')).toBeVisible()

    const activeCard = page.locator('.v-window-item--active .wallet-card').first()
    await activeCard.locator('.wallet-card__tile').nth(1).click()
    await expect(page).toHaveURL(/\/transactions\/ADM$/)

    const balanceTile = page
      .locator('.sidebar__aside .v-window-item--active .wallet-card__tile')
      .nth(1)
    await expect(balanceTile).toBeVisible()
    await expect(balanceTile).toHaveClass(/v-list-item--active/)
  })

  test('highlights Send action in sidebar when on send funds route on desktop', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1366, height: 900 })
    await loginWithNewAccount(page)

    await page.goto('/home', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/home(?:\/)?$/)
    await expect(page.locator('.wallet-card')).toBeVisible()

    const sendItem = page
      .locator('.sidebar__aside .v-window-item--active .wallet-actions .v-list-item')
      .first()
    await expect(sendItem).toBeVisible()
    await sendItem.click()

    await expect(page).toHaveURL(/\/transfer(?:\/ADM)?$/)

    await expect(sendItem).toHaveClass(/v-list-item--active/)
  })

  test('resets scroll to top when re-clicking Balance from home', async ({ page }) => {
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await page.setViewportSize({ width: 390, height: 600 })
    await loginWithPassphrase(page, testPassphrase!)

    await openTransactionListFromHome(page, 'ADM')

    const scrolledTop = await page.evaluate(async () => {
      const scrollPane = document.querySelector('.sidebar__layout') as HTMLElement | null
      if (!scrollPane) return 0

      scrollPane.scrollTo({ top: 400 })
      await new Promise((r) => requestAnimationFrame(() => r(undefined)))
      await new Promise((r) => requestAnimationFrame(() => r(undefined)))

      return Math.ceil(scrollPane.scrollTop)
    })

    expect(scrolledTop).toBeGreaterThan(100)

    await page.locator('.back-button').click()
    await expect(page).toHaveURL(/\/home(?:\/)?$/)

    const activeCard = page.locator('.v-window-item--active .wallet-card').first()
    await expect(activeCard).toBeVisible()
    await activeCard.locator('.wallet-card__tile').nth(1).click()
    await expect(page).toHaveURL(/\/transactions\/ADM$/)
    await expect(page.locator('.transactions-view__list')).toBeVisible()

    await page.evaluate(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(undefined)))
      await new Promise((r) => requestAnimationFrame(() => r(undefined)))
    })

    const restoredTop = await page.evaluate(() => {
      const scrollPane = document.querySelector('.sidebar__layout') as HTMLElement | null
      return scrollPane ? Math.ceil(scrollPane.scrollTop) : 999
    })

    expect(restoredTop).toBeLessThanOrEqual(1)
  })

  test('keeps Send highlight after changing crypto in SendFunds dropdown on desktop', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1366, height: 900 })
    await loginWithNewAccount(page)

    await page.goto('/home', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/home(?:\/)?$/)
    await expect(page.locator('.wallet-card')).toBeVisible()

    const sendItem = page
      .locator('.sidebar__aside .v-window-item--active .wallet-actions .v-list-item')
      .first()
    await expect(sendItem).toBeVisible()
    await sendItem.click()
    await expect(page).toHaveURL(/\/transfer(?:\/ADM)?$/)
    await expect(page.locator('.send-funds-form')).toBeVisible()

    const activeTabBefore = page
      .locator('.sidebar__aside [role="tab"][aria-selected="true"]')
      .first()
    await expect(activeTabBefore).toContainText('ADM')

    await page.locator('.send-funds-form .v-select .v-field').click()
    await expect(
      page.locator('.v-overlay .v-list-item-title').filter({ hasText: 'ETH' })
    ).toBeVisible()
    await page.locator('.v-overlay .v-list-item-title').filter({ hasText: 'ETH' }).click()

    const activeTabAfter = page
      .locator('.sidebar__aside [role="tab"][aria-selected="true"]')
      .first()
    await expect(activeTabAfter).toContainText('ETH')

    // Verify Send action stays highlighted after crypto switch
    const ethSendItem = page
      .locator('.sidebar__aside .v-window-item--active .wallet-actions .v-list-item')
      .first()
    await expect(ethSendItem).toHaveClass(/v-list-item--active/)
  })

  test('keeps Chats tab active in bottom navigation when viewing transaction from chat', async ({
    page
  }) => {
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await page.setViewportSize({ width: 390, height: 844 })
    await loginWithPassphrase(page, testPassphrase!)

    await page.goto(`/transactions/${testDetailsCrypto}/${testTransactionId}?fromChat=true`, {
      waitUntil: 'domcontentloaded'
    })
    await expect(page).toHaveURL(
      new RegExp(`/transactions/${testDetailsCrypto}/${testTransactionId}\\?fromChat=true$`)
    )

    const chatsButton = page.locator('.app-navigation .v-btn').nth(1)
    await expect(chatsButton).toHaveClass(/v-btn--active/)

    const walletButton = page.locator('.app-navigation .v-btn').nth(0)
    await expect(walletButton).not.toHaveClass(/v-btn--active/)
  })

  test('navigates to saved Account route when clicking Account from chat transaction details', async ({
    page
  }) => {
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await page.setViewportSize({ width: 390, height: 844 })
    await loginWithPassphrase(page, testPassphrase!)

    // First visit Account to establish a saved account route
    await page.goto('/home', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/home(?:\/)?$/)

    // Navigate to Chats then to transaction details from chat
    await page.locator('.app-navigation .v-btn').nth(1).click()
    await expect(page).toHaveURL(/\/chats(?:\/)?$/)

    await page.goto(`/transactions/${testDetailsCrypto}/${testTransactionId}?fromChat=true`, {
      waitUntil: 'domcontentloaded'
    })
    await expect(page).toHaveURL(
      new RegExp(`/transactions/${testDetailsCrypto}/${testTransactionId}\\?fromChat=true$`)
    )

    // Click Account tab — should navigate away from the fromChat transaction
    await page.locator('.app-navigation .v-btn').nth(0).click()
    await expect(page).not.toHaveURL(/fromChat/)
    await expect(page.locator('.app-navigation .v-btn').nth(0)).toHaveClass(/v-btn--active/)
  })

  test('restores Stake and Earn route when returning to Settings after switching tabs', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginWithNewAccount(page)

    await page.goto('/home', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/home(?:\/)?$/)
    await expect(page.locator('.wallet-card')).toBeVisible()

    // Navigate to Votes via the wallet card Stake action
    await page.goto('/votes', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/votes(?:\/)?$/)

    // Switch to Chats
    await page.locator('.app-navigation .v-btn').nth(1).click()
    await expect(page).toHaveURL(/\/chats(?:\/)?$/)

    // Switch back to Settings — should restore /votes
    await page.locator('.app-navigation .v-btn').nth(2).click()
    await expect(page).toHaveURL(/\/votes(?:\/)?$/)

    const settingsButton = page.locator('.app-navigation .v-btn').nth(2)
    await expect(settingsButton).toHaveClass(/v-btn--active/)
  })
})
