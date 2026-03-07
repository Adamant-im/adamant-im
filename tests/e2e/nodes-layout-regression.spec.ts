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

test.describe('Nodes layout regressions', () => {
  test('keeps nodes table gutters and row typography consistent', async ({ page }) => {
    await loginWithNewAccount(page)

    await page.goto('/options/nodes')
    await expect(page).toHaveURL(/\/options\/nodes$/)
    await expect(page.locator('.nodes-table')).toBeVisible()

    const firstTab = page.locator('.nodes-table .v-tab').first()
    await expect(firstTab).toBeVisible()
    await firstTab.click()

    const firstRow = page.locator('.nodes-table-container tbody tr').first()
    await expect(firstRow).toBeVisible()

    const metrics = await page.evaluate(() => {
      const root = document.querySelector('.nodes-table') as HTMLElement | null
      const table = document.querySelector('.nodes-table-container') as HTMLElement | null
      const headCell = document.querySelector('.nodes-table-head__th') as HTMLElement | null
      const dataCell = document.querySelector(
        '.nodes-table-container tbody tr td:nth-child(2)'
      ) as HTMLElement | null
      const statusText = document.querySelector('.node-status__status-text') as HTMLElement | null
      const toggle = document.querySelector('.node-toggle-status-checkbox') as HTMLElement | null

      if (!root || !table || !headCell || !dataCell || !statusText || !toggle) {
        return null
      }

      const rootStyle = getComputedStyle(root)
      const tableStyle = getComputedStyle(table)
      const headStyle = getComputedStyle(headCell)
      const dataStyle = getComputedStyle(dataCell)
      const statusTextStyle = getComputedStyle(statusText)
      const toggleStyle = getComputedStyle(toggle)

      return {
        gutterVar: rootStyle.getPropertyValue('--a-nodes-table-gutter').trim(),
        checkboxOffsetVar: rootStyle.getPropertyValue('--a-nodes-table-checkbox-offset').trim(),
        marginInlineStart: Number.parseFloat(rootStyle.marginInlineStart),
        marginInlineEnd: Number.parseFloat(rootStyle.marginInlineEnd),
        containerLineHeight: Number.parseFloat(tableStyle.lineHeight),
        headFontSize: Number.parseFloat(headStyle.fontSize),
        dataFontSize: Number.parseFloat(dataStyle.fontSize),
        dataPaddingInlineEnd: Number.parseFloat(dataStyle.paddingInlineEnd),
        statusFontSize: Number.parseFloat(statusTextStyle.fontSize),
        statusFontWeight: Number.parseFloat(statusTextStyle.fontWeight),
        checkboxOffset: Number.parseFloat(toggleStyle.marginInlineStart)
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.gutterVar).not.toBe('')
    expect(metrics?.checkboxOffsetVar).not.toBe('')
    expect(metrics?.marginInlineStart ?? 0).toBeLessThanOrEqual(-23)
    expect(metrics?.marginInlineStart ?? 0).toBeGreaterThanOrEqual(-25)
    expect(metrics?.marginInlineEnd ?? 0).toBeLessThanOrEqual(-23)
    expect(metrics?.marginInlineEnd ?? 0).toBeGreaterThanOrEqual(-25)
    expect(metrics?.containerLineHeight ?? 0).toBeGreaterThanOrEqual(13)
    expect(metrics?.containerLineHeight ?? 99).toBeLessThanOrEqual(15)
    expect(metrics?.headFontSize ?? 0).toBeGreaterThanOrEqual(11)
    expect(metrics?.headFontSize ?? 99).toBeLessThanOrEqual(13)
    expect(metrics?.dataFontSize ?? 0).toBeGreaterThanOrEqual(13)
    expect(metrics?.dataFontSize ?? 99).toBeLessThanOrEqual(15)
    expect(metrics?.dataPaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(7)
    expect(metrics?.dataPaddingInlineEnd ?? 99).toBeLessThanOrEqual(9)
    expect(metrics?.statusFontSize ?? 0).toBeGreaterThanOrEqual(11)
    expect(metrics?.statusFontSize ?? 99).toBeLessThanOrEqual(13)
    expect(metrics?.statusFontWeight ?? 0).toBeGreaterThanOrEqual(300)
    expect(metrics?.statusFontWeight ?? 999).toBeLessThanOrEqual(400)
    expect(metrics?.checkboxOffset ?? 0).toBeGreaterThanOrEqual(15)
    expect(metrics?.checkboxOffset ?? 99).toBeLessThanOrEqual(17)

    await assertNoDocumentScrollLeak(page)
  })
})
