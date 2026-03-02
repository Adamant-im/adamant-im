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

test.describe('Transfer layout regressions', () => {
  test('keeps send funds form spacing and sizing stable', async ({ page }) => {
    await loginWithNewAccount(page)

    await page.goto('/transfer')
    await expect(page).toHaveURL(/\/transfer(?:\/)?$/)
    await expect(page.locator('.send-funds-form')).toBeVisible()

    const styles = await page.evaluate(() => {
      const button = document.querySelector('.send-funds-form__button') as HTMLElement | null
      const maxAmountLabel = document.querySelector(
        '.send-funds-form__amount-input .max-amount-label'
      ) as HTMLElement | null

      if (!button || !maxAmountLabel) {
        return null
      }

      return {
        buttonMarginTop: Number.parseFloat(getComputedStyle(button).marginTop),
        maxAmountLabelFontSize: Number.parseFloat(getComputedStyle(maxAmountLabel).fontSize)
      }
    })

    expect(styles).not.toBeNull()
    expect(styles?.buttonMarginTop ?? 0).toBeGreaterThanOrEqual(14)
    expect(styles?.buttonMarginTop ?? 999).toBeLessThanOrEqual(18)
    expect(styles?.maxAmountLabelFontSize ?? 0).toBeGreaterThanOrEqual(13)
    expect(styles?.maxAmountLabelFontSize ?? 999).toBeLessThanOrEqual(15)

    await assertNoDocumentScrollLeak(page)
  })
})
