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
})
