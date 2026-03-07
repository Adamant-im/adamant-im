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

  test('keeps symmetric mobile gutters on send funds screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginWithNewAccount(page)

    await page.goto('/transfer')
    await expect(page).toHaveURL(/\/transfer(?:\/)?$/)
    await expect(page.locator('.send-funds-form')).toBeVisible()

    const metrics = await page.evaluate(() => {
      const content = document.querySelector('.navigation-wrapper__content') as HTMLElement | null
      const field = document.querySelector('.send-funds-form .v-field') as HTMLElement | null

      if (!content || !field) {
        return null
      }

      const contentStyle = getComputedStyle(content)
      const fieldRect = field.getBoundingClientRect()

      return {
        contentPaddingInlineStart: Number.parseFloat(contentStyle.paddingInlineStart),
        contentPaddingInlineEnd: Number.parseFloat(contentStyle.paddingInlineEnd),
        fieldLeftGap: fieldRect.left,
        fieldRightGap: window.innerWidth - fieldRect.right
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.contentPaddingInlineStart ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.contentPaddingInlineStart ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.contentPaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.contentPaddingInlineEnd ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.fieldLeftGap ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.fieldLeftGap ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.fieldRightGap ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.fieldRightGap ?? 99).toBeLessThanOrEqual(25)

    await assertNoDocumentScrollLeak(page)
  })
})
