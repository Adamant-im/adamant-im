import { expect, test, type Page } from '@playwright/test'
import { loginWithNewAccount } from './helpers/auth'

const assertNoDocumentScrollLeak = async (page: Page) => {
  const documentMetrics = await page.evaluate(() => {
    const root = document.documentElement
    const body = document.body

    return {
      scrollHeight: root.scrollHeight,
      clientHeight: root.clientHeight,
      scrollTop: root.scrollTop || body.scrollTop || 0
    }
  })

  expect(documentMetrics.scrollHeight - documentMetrics.clientHeight).toBeLessThanOrEqual(2)
  expect(documentMetrics.scrollTop).toBe(0)
}

test.describe('Wallets layout regressions', () => {
  test('keeps wallets list scrolling inside local pane', async ({ page }) => {
    await loginWithNewAccount(page)

    await page.goto('/options/wallets')
    await expect(page).toHaveURL(/\/options\/wallets$/)
    await expect(page.locator('.wallets-view')).toBeVisible()

    const walletsList = page.locator('.wallets-view__list')
    await expect(walletsList).toBeVisible()

    const overflow = await walletsList.evaluate((element) => {
      const style = getComputedStyle(element)

      return {
        overflowY: style.overflowY,
        overflowX: style.overflowX,
        overscrollBehavior: style.overscrollBehavior
      }
    })

    expect(['auto', 'scroll']).toContain(overflow.overflowY)
    expect(overflow.overflowX).toBe('hidden')
    expect(overflow.overscrollBehavior).toBe('contain')

    const canScroll = await walletsList.evaluate((element) => {
      return element.scrollHeight > element.clientHeight + 1
    })

    if (canScroll) {
      await walletsList.evaluate((element) => {
        element.scrollTop = 300
      })

      await expect
        .poll(() => walletsList.evaluate((element) => element.scrollTop))
        .toBeGreaterThan(0)
    }

    await assertNoDocumentScrollLeak(page)
  })

  test('keeps wallets search and list item sizing consistent', async ({ page }) => {
    await loginWithNewAccount(page)

    await page.goto('/options/wallets')
    await expect(page).toHaveURL(/\/options\/wallets$/)

    const searchField = page.locator('.wallets-view__search .v-field')
    const cryptoContent = page.locator('.wallets-view__crypto-content').first()
    const balance = page.locator('.wallet-balance').first()

    await expect(searchField).toBeVisible()
    await expect(cryptoContent).toBeVisible()
    await expect(balance).toBeVisible()

    const metrics = await page.evaluate(() => {
      const content = document.querySelector('.wallets-view__crypto-content') as HTMLElement | null
      const walletBalance = document.querySelector('.wallet-balance') as HTMLElement | null

      if (!content || !walletBalance) {
        return null
      }

      const contentStyle = getComputedStyle(content)
      const balanceStyle = getComputedStyle(walletBalance)

      return {
        cryptoContentHeight: Number.parseFloat(contentStyle.height),
        balanceHeight: Number.parseFloat(balanceStyle.height),
        balanceGap: Number.parseFloat(balanceStyle.gap),
        balanceIsSingleLine: walletBalance.classList.contains('wallet-balance--single-line')
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.cryptoContentHeight ?? 0).toBeGreaterThanOrEqual(39)
    expect(metrics?.cryptoContentHeight ?? 999).toBeLessThanOrEqual(41)
    expect(metrics?.balanceHeight ?? 0).toBeGreaterThanOrEqual(39)
    expect(metrics?.balanceHeight ?? 999).toBeLessThanOrEqual(41)

    if (metrics?.balanceIsSingleLine) {
      expect(metrics?.balanceGap ?? 999).toBeLessThanOrEqual(1)
    } else {
      expect(metrics?.balanceGap ?? 0).toBeGreaterThanOrEqual(7)
      expect(metrics?.balanceGap ?? 999).toBeLessThanOrEqual(9)
    }

    await assertNoDocumentScrollLeak(page)
  })

  test('keeps wallet tab content top-aligned when fiat line is absent', async ({ page }) => {
    await loginWithNewAccount(page)

    await page.goto('/home')
    await expect(page).toHaveURL(/\/home$/)
    await expect(page.locator('.account-view')).toBeVisible()
    await expect(page.locator('.wallet-tab__content').first()).toBeVisible()

    const metrics = await page.evaluate(() => {
      const placeholder = document.querySelector(
        '.wallet-tab__rates-placeholder'
      ) as HTMLElement | null
      const content =
        (placeholder?.closest('.wallet-tab__content') as HTMLElement | null) ??
        (document.querySelector('.wallet-tab__content') as HTMLElement | null)
      const networkLabel = content?.querySelector(
        '.wallet-tab__network-label'
      ) as HTMLElement | null
      const rates = content?.querySelector('.wallet-tab__rates') as HTMLElement | null

      if (!content || !rates) {
        return null
      }

      const contentStyle = getComputedStyle(content)
      const placeholderStyle = placeholder ? getComputedStyle(placeholder) : null
      const networkLabelStyle = networkLabel ? getComputedStyle(networkLabel) : null
      const ratesStyle = getComputedStyle(rates)

      return {
        contentJustify: contentStyle.justifyContent,
        contentMinHeight: Number.parseFloat(contentStyle.minHeight),
        hasPlaceholder: Boolean(placeholder),
        placeholderVisibility: placeholderStyle?.visibility ?? null,
        ratesMarginTop: Number.parseFloat(ratesStyle.marginTop),
        networkLabelFontSize: networkLabelStyle
          ? Number.parseFloat(networkLabelStyle.fontSize)
          : null
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.contentJustify).toBe('flex-start')
    expect(metrics?.contentMinHeight ?? 0).toBeGreaterThanOrEqual(40)

    if (metrics?.hasPlaceholder) {
      expect(metrics?.placeholderVisibility).toBe('hidden')
    }

    expect(metrics?.ratesMarginTop ?? 0).toBeGreaterThanOrEqual(3)
    expect(metrics?.ratesMarginTop ?? 999).toBeLessThanOrEqual(5)

    if (metrics?.networkLabelFontSize !== null) {
      expect(metrics?.networkLabelFontSize ?? 0).toBeGreaterThanOrEqual(9)
      expect(metrics?.networkLabelFontSize ?? 999).toBeLessThanOrEqual(11)
    }

    await assertNoDocumentScrollLeak(page)
  })
})
