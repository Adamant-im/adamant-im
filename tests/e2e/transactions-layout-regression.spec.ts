import { config as loadEnv } from 'dotenv'
import { expect, test, type Page } from '@playwright/test'
import { loginWithPassphrase } from './helpers/auth'

loadEnv({ path: '.env.local', quiet: true })

const testPassphrase = process.env.ADM_TEST_ACCOUNT_PK?.trim()
const testDetailsCrypto = 'DOGE'
const testListCrypto = 'ADM'
const testRestorableListCrypto = testDetailsCrypto
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
  test('restores the transaction list route and scroll after switching to chats and back', async ({
    page
  }) => {
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await page.setViewportSize({ width: 390, height: 600 })
    await loginWithPassphrase(page, testPassphrase!)

    await openTransactionListFromHome(page, testRestorableListCrypto)

    const routeState = await page.evaluate(async () => {
      const scrollPane = document.querySelector('.sidebar__layout') as HTMLElement | null
      const rows = document.querySelectorAll('.transaction-item__tile')

      if (!scrollPane || rows.length === 0) {
        return { hasRows: rows.length > 0, canScroll: false, top: 0 }
      }

      scrollPane.scrollTo({ top: 220 })
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))

      return {
        hasRows: true,
        canScroll: scrollPane.scrollHeight - scrollPane.clientHeight > 120,
        top: Math.ceil(scrollPane.scrollTop)
      }
    })

    await page.locator('.app-navigation .v-btn').nth(1).click()
    await expect(page).toHaveURL(/\/chats(?:\/)?$/)

    const savedTopAfterLeaving = await page.evaluate((path) => {
      const store = (
        window as Window & {
          store?: { getters?: Record<string, unknown> }
        }
      ).store

      const getter = store?.getters?.['options/accountScrollPosition'] as
        | ((routePath: string) => number)
        | undefined

      return getter ? getter(path) : null
    }, `/transactions/${testRestorableListCrypto}`)

    await page.locator('.app-navigation .v-btn').nth(0).click()
    await expect(page).toHaveURL(new RegExp(`/transactions/${testRestorableListCrypto}$`))
    await expect(page.locator('.transactions-view__list')).toBeVisible()

    const restoredState = await page.evaluate(async (path) => {
      const scrollPane = document.querySelector('.sidebar__layout') as HTMLElement | null
      const store = (
        window as Window & {
          store?: { getters?: Record<string, unknown> }
        }
      ).store

      if (!scrollPane) {
        return null
      }

      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))

      return {
        top: Math.ceil(scrollPane.scrollTop),
        savedTop:
          (
            store?.getters?.['options/accountScrollPosition'] as
              | ((routePath: string) => number)
              | undefined
          )?.(path) ?? null
      }
    }, `/transactions/${testRestorableListCrypto}`)

    expect(restoredState).not.toBeNull()

    if (routeState.canScroll) {
      expect(routeState.top).toBeGreaterThan(100)
      expect(savedTopAfterLeaving).toBe(routeState.top)
      expect(Math.abs((restoredState?.top ?? 0) - routeState.top)).toBeLessThanOrEqual(1)
    } else {
      expect(restoredState?.top ?? 999).toBeLessThanOrEqual(1)
    }
  })

  test('keeps the transaction list mounted and restores its scroll after opening a transaction and going back', async ({
    page
  }) => {
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await page.setViewportSize({ width: 390, height: 600 })
    await loginWithPassphrase(page, testPassphrase!)

    await openTransactionListFromHome(page, testRestorableListCrypto)

    const listState = await page.evaluate(async () => {
      const scrollPane = document.querySelector('.sidebar__layout') as HTMLElement | null
      const rows = Array.from(document.querySelectorAll('.transaction-item__tile')) as HTMLElement[]

      if (!scrollPane || rows.length === 0) {
        return null
      }

      scrollPane.scrollTo({ top: 240 })
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))

      return {
        top: Math.ceil(scrollPane.scrollTop),
        visibleTransactionIndex: rows.findIndex((row) => {
          const rect = row.getBoundingClientRect()
          return rect.top >= 80 && rect.bottom <= window.innerHeight
        })
      }
    })

    expect(listState).not.toBeNull()
    expect(listState?.visibleTransactionIndex ?? -1).toBeGreaterThanOrEqual(0)

    await page
      .locator('.transaction-item__tile')
      .nth(listState?.visibleTransactionIndex ?? 0)
      .click()
    await expect(page).toHaveURL(new RegExp(`/transactions/${testRestorableListCrypto}/[^/]+$`))

    await page.locator('.back-button').click()
    await expect(page).toHaveURL(new RegExp(`/transactions/${testRestorableListCrypto}$`))
    await expect(page.locator('.transactions-view__list')).toBeVisible()

    const restoredState = await page.evaluate(async () => {
      const scrollPane = document.querySelector('.sidebar__layout') as HTMLElement | null

      if (!scrollPane) {
        return null
      }

      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))

      return {
        top: Math.ceil(scrollPane.scrollTop)
      }
    })

    expect(restoredState).not.toBeNull()
    expect(Math.abs((restoredState?.top ?? 0) - (listState?.top ?? 0))).toBeLessThanOrEqual(1)
  })

  test('restores the transaction details route and scroll after switching to chats and back', async ({
    page
  }) => {
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await page.setViewportSize({ width: 390, height: 600 })
    await loginWithPassphrase(page, testPassphrase!)

    await page.goto(`/transactions/${testDetailsCrypto}/${testTransactionId}`, {
      waitUntil: 'domcontentloaded'
    })
    await expect(page).toHaveURL(
      new RegExp(`/transactions/${testDetailsCrypto}/${testTransactionId}$`)
    )

    const detailState = await page.evaluate(async () => {
      const scrollPane = document.querySelector('.sidebar__layout') as HTMLElement | null

      if (!scrollPane) {
        return { canScroll: false, top: 0 }
      }

      scrollPane.scrollTo({ top: 180 })
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))

      return {
        canScroll: scrollPane.scrollHeight - scrollPane.clientHeight > 80,
        top: Math.ceil(scrollPane.scrollTop)
      }
    })

    await page.locator('.app-navigation .v-btn').nth(1).click()
    await expect(page).toHaveURL(/\/chats(?:\/)?$/)

    await page.locator('.app-navigation .v-btn').nth(0).click()
    await expect(page).toHaveURL(
      new RegExp(`/transactions/${testDetailsCrypto}/${testTransactionId}$`)
    )

    const restoredTop = await page.evaluate(async () => {
      const scrollPane = document.querySelector('.sidebar__layout') as HTMLElement | null

      if (!scrollPane) {
        return null
      }

      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))

      return Math.ceil(scrollPane.scrollTop)
    })

    expect(restoredTop).not.toBeNull()

    if (detailState.canScroll) {
      expect(detailState.top).toBeGreaterThan(40)
      expect(Math.abs((restoredTop ?? 0) - detailState.top)).toBeLessThanOrEqual(1)
    } else {
      expect(restoredTop ?? 999).toBeLessThanOrEqual(1)
    }
  })

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

  test('keeps transaction details stable when recent loader appears on top', async ({ page }) => {
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await page.setViewportSize({ width: 1366, height: 900 })
    await loginWithPassphrase(page, testPassphrase!)

    await page.goto(`/transactions/${testDetailsCrypto}/${testTransactionId}`, {
      waitUntil: 'domcontentloaded'
    })
    await expect(page).toHaveURL(
      new RegExp(`/transactions/${testDetailsCrypto}/${testTransactionId}$`)
    )

    const firstRow = page.locator('.transaction-view__list .transaction-list-item').first()
    await expect(firstRow).toBeVisible()

    const before = await firstRow.boundingBox()
    expect(before).not.toBeNull()

    await page.evaluate(() => {
      const store = (
        window as Window & { store?: { commit: (type: string, payload: boolean) => void } }
      ).store

      if (!store) {
        throw new Error('window.store is not available')
      }

      store.commit('doge/areRecentLoading', true)
    })

    const recentLoader = page.locator('.transactions-view__loading-item--recent')
    await expect(recentLoader).toBeVisible()

    const after = await firstRow.boundingBox()
    expect(after).not.toBeNull()
    expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThanOrEqual(1)

    const loaderBox = await recentLoader.boundingBox()
    expect(loaderBox).not.toBeNull()
    expect(loaderBox?.y ?? 0).toBeGreaterThan((before?.y ?? 0) - 40)
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
