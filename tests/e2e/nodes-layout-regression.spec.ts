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

    const firstRow = page.locator('.settings-data-table tbody tr').first()
    await expect(firstRow).toBeVisible()

    const metrics = await page.evaluate(() => {
      const content = document.querySelector('.navigation-wrapper__content') as HTMLElement | null
      const root = document.querySelector('.settings-table-shell') as HTMLElement | null
      const bleed = document.querySelector('.settings-table-shell__bleed') as HTMLElement | null
      const section = document.querySelector('.settings-table-shell__section') as HTMLElement | null
      const table = document.querySelector('.settings-data-table') as HTMLElement | null
      const headCell = document.querySelector('.nodes-table-head__th') as HTMLElement | null
      const dataCell = document.querySelector(
        '.settings-data-table tbody tr td:nth-child(2)'
      ) as HTMLElement | null
      const statusText = document.querySelector('.node-status__status-text') as HTMLElement | null
      const toggle = document.querySelector('.node-toggle-status-checkbox') as HTMLElement | null

      if (
        !content ||
        !root ||
        !bleed ||
        !section ||
        !table ||
        !headCell ||
        !dataCell ||
        !statusText ||
        !toggle
      ) {
        return null
      }

      const contentRect = content.getBoundingClientRect()
      const bleedRect = bleed.getBoundingClientRect()
      const tableRect = table.getBoundingClientRect()
      const rootStyle = getComputedStyle(root)
      const contentStyle = getComputedStyle(content)
      const bleedStyle = getComputedStyle(bleed)
      const sectionStyle = getComputedStyle(section)
      const tableStyle = getComputedStyle(table)
      const headStyle = getComputedStyle(headCell)
      const dataStyle = getComputedStyle(dataCell)
      const statusTextStyle = getComputedStyle(statusText)
      const toggleStyle = getComputedStyle(toggle)

      return {
        bleedInlineStartVar: rootStyle
          .getPropertyValue('--a-settings-table-shell-bleed-inline-start')
          .trim(),
        bleedInlineEndVar: rootStyle
          .getPropertyValue('--a-settings-table-shell-bleed-inline-end')
          .trim(),
        checkboxOffsetVar: rootStyle
          .getPropertyValue('--a-settings-table-shell-checkbox-offset')
          .trim(),
        marginInlineStart: Number.parseFloat(bleedStyle.marginInlineStart),
        marginInlineEnd: Number.parseFloat(bleedStyle.marginInlineEnd),
        sectionPaddingInlineStart: Number.parseFloat(sectionStyle.paddingInlineStart),
        sectionPaddingInlineEnd: Number.parseFloat(sectionStyle.paddingInlineEnd),
        contentPaddingInlineStart: Number.parseFloat(contentStyle.paddingInlineStart),
        contentPaddingInlineEnd: Number.parseFloat(contentStyle.paddingInlineEnd),
        bleedLeftGap: bleedRect.left - contentRect.left,
        bleedRightGap: contentRect.right - bleedRect.right,
        tableBleedLeftGap: tableRect.left - bleedRect.left,
        tableBleedRightGap: bleedRect.right - tableRect.right,
        tableLineHeight: Number.parseFloat(tableStyle.lineHeight),
        headFontSize: Number.parseFloat(headStyle.fontSize),
        dataFontSize: Number.parseFloat(dataStyle.fontSize),
        dataPaddingInlineEnd: Number.parseFloat(dataStyle.paddingInlineEnd),
        statusFontSize: Number.parseFloat(statusTextStyle.fontSize),
        statusFontWeight: Number.parseFloat(statusTextStyle.fontWeight),
        checkboxOffset: Number.parseFloat(toggleStyle.marginInlineStart)
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.bleedInlineStartVar).not.toBe('')
    expect(metrics?.bleedInlineEndVar).not.toBe('')
    expect(metrics?.checkboxOffsetVar).not.toBe('')
    expect(metrics?.marginInlineStart ?? 0).toBeLessThanOrEqual(-23)
    expect(metrics?.marginInlineStart ?? 0).toBeGreaterThanOrEqual(-25)
    expect(metrics?.marginInlineEnd ?? 0).toBeLessThanOrEqual(-23)
    expect(metrics?.marginInlineEnd ?? 0).toBeGreaterThanOrEqual(-25)
    expect(metrics?.sectionPaddingInlineStart ?? 99).toBeLessThanOrEqual(1)
    expect(metrics?.sectionPaddingInlineEnd ?? 99).toBeLessThanOrEqual(1)
    expect(metrics?.contentPaddingInlineStart ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.contentPaddingInlineStart ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.contentPaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.contentPaddingInlineEnd ?? 99).toBeLessThanOrEqual(25)
    expect(Math.abs(metrics?.bleedLeftGap ?? 99)).toBeLessThanOrEqual(1)
    expect(Math.abs(metrics?.bleedRightGap ?? 99)).toBeLessThanOrEqual(1)
    expect(Math.abs(metrics?.tableBleedLeftGap ?? 99)).toBeLessThanOrEqual(1)
    expect(Math.abs(metrics?.tableBleedRightGap ?? 99)).toBeLessThanOrEqual(1)
    expect(metrics?.tableLineHeight ?? 0).toBeGreaterThanOrEqual(13)
    expect(metrics?.tableLineHeight ?? 99).toBeLessThanOrEqual(15)
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

  test('keeps nodes table truly edge-to-edge on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginWithNewAccount(page)

    await page.goto('/options/nodes')
    await expect(page).toHaveURL(/\/options\/nodes$/)
    await expect(page.locator('.nodes-table')).toBeVisible()
    await expect(page.locator('.settings-data-table')).toBeVisible()

    const metrics = await page.evaluate(() => {
      const root = document.querySelector('.settings-table-shell') as HTMLElement | null
      const bleed = document.querySelector('.settings-table-shell__bleed') as HTMLElement | null
      const table = document.querySelector('.settings-data-table') as HTMLElement | null

      if (!root || !bleed || !table) {
        return null
      }

      const rootStyle = getComputedStyle(root)
      const bleedStyle = getComputedStyle(bleed)
      const tableRect = table.getBoundingClientRect()

      return {
        bleedInlineStartVar: rootStyle
          .getPropertyValue('--a-settings-table-shell-bleed-inline-start')
          .trim(),
        bleedInlineEndVar: rootStyle
          .getPropertyValue('--a-settings-table-shell-bleed-inline-end')
          .trim(),
        marginInlineStart: Number.parseFloat(bleedStyle.marginInlineStart),
        marginInlineEnd: Number.parseFloat(bleedStyle.marginInlineEnd),
        tableLeft: tableRect.left,
        tableRightGap: window.innerWidth - tableRect.right
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.bleedInlineStartVar).not.toBe('')
    expect(metrics?.bleedInlineEndVar).not.toBe('')
    expect(metrics?.marginInlineStart ?? 0).toBeLessThanOrEqual(-23)
    expect(metrics?.marginInlineStart ?? 0).toBeGreaterThanOrEqual(-25)
    expect(metrics?.marginInlineEnd ?? 0).toBeLessThanOrEqual(-15)
    expect(metrics?.marginInlineEnd ?? 0).toBeGreaterThanOrEqual(-17)
    expect(Math.abs(metrics?.tableLeft ?? 99)).toBeLessThanOrEqual(1)
    expect(Math.abs(metrics?.tableRightGap ?? 99)).toBeLessThanOrEqual(1)

    await assertNoDocumentScrollLeak(page)
  })
})
