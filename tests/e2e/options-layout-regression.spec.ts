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

test.describe('Options layout regressions', () => {
  test('keeps title and action list gutters consistent', async ({ page }) => {
    await loginWithNewAccount(page)

    await page.goto('/options')
    await expect(page).toHaveURL(/\/options$/)
    await expect(page.locator('.settings-view')).toBeVisible()

    const metrics = await page.evaluate(() => {
      const root = document.querySelector('.settings-view') as HTMLElement | null
      const title = document.querySelector('.settings-view__title') as HTMLElement | null
      const actionItem = document.querySelector('.actions-list .v-list-item') as HTMLElement | null

      if (!root || !title || !actionItem) {
        return null
      }

      const rootStyle = getComputedStyle(root)
      const titleStyle = getComputedStyle(title)
      const actionItemStyle = getComputedStyle(actionItem)

      return {
        gutterVar: rootStyle.getPropertyValue('--a-settings-gutter').trim(),
        rowMinHeightVar: rootStyle.getPropertyValue('--a-settings-actions-row-min-height').trim(),
        rowPaddingBlockVar: rootStyle
          .getPropertyValue('--a-settings-actions-row-padding-block')
          .trim(),
        titlePaddingTop: Number.parseFloat(titleStyle.paddingTop),
        actionPaddingInlineStart: Number.parseFloat(actionItemStyle.paddingInlineStart),
        actionPaddingInlineEnd: Number.parseFloat(actionItemStyle.paddingInlineEnd),
        actionMinHeight: Number.parseFloat(actionItemStyle.minHeight),
        actionPaddingTop: Number.parseFloat(actionItemStyle.paddingTop),
        actionPaddingBottom: Number.parseFloat(actionItemStyle.paddingBottom)
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.gutterVar).not.toBe('')
    expect(metrics?.rowMinHeightVar).not.toBe('')
    expect(metrics?.rowPaddingBlockVar).not.toBe('')
    expect(metrics?.titlePaddingTop ?? 0).toBeGreaterThanOrEqual(14)
    expect(metrics?.titlePaddingTop ?? 999).toBeLessThanOrEqual(16)
    expect(metrics?.actionPaddingInlineStart ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.actionPaddingInlineStart ?? 999).toBeLessThanOrEqual(25)
    expect(metrics?.actionPaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.actionPaddingInlineEnd ?? 999).toBeLessThanOrEqual(25)
    expect(metrics?.actionMinHeight ?? 0).toBeGreaterThanOrEqual(55)
    expect(metrics?.actionMinHeight ?? 999).toBeLessThanOrEqual(57)
    expect(metrics?.actionPaddingTop ?? 0).toBeGreaterThanOrEqual(7)
    expect(metrics?.actionPaddingTop ?? 999).toBeLessThanOrEqual(9)
    expect(metrics?.actionPaddingBottom ?? 0).toBeGreaterThanOrEqual(7)
    expect(metrics?.actionPaddingBottom ?? 999).toBeLessThanOrEqual(9)

    await assertNoDocumentScrollLeak(page)
  })
})
