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

test.describe('Votes layout regressions', () => {
  test('keeps delegates screen aligned to shared settings table shell on desktop', async ({
    page
  }) => {
    await loginWithNewAccount(page)

    await page.goto('/votes')
    await expect(page).toHaveURL(/\/votes$/)
    await expect(page.locator('.delegates-view')).toBeVisible()
    await expect(page.locator('.settings-data-table')).toBeVisible()

    const metrics = await page.evaluate(() => {
      const content = document.querySelector('.navigation-wrapper__content') as HTMLElement | null
      const shell = document.querySelector('.settings-table-shell') as HTMLElement | null
      const bleed = document.querySelector('.settings-table-shell__bleed') as HTMLElement | null
      const sections = document.querySelectorAll('.settings-table-shell__section')
      const beforeSection = sections[0] as HTMLElement | undefined
      const afterSection = sections[1] as HTMLElement | undefined
      const table = document.querySelector('.settings-data-table') as HTMLElement | null
      const pagination = document.querySelector('.delegates-view__pagination') as HTMLElement | null

      if (
        !content ||
        !shell ||
        !bleed ||
        !beforeSection ||
        !afterSection ||
        !table ||
        !pagination
      ) {
        return null
      }

      const contentRect = content.getBoundingClientRect()
      const shellStyle = getComputedStyle(shell)
      const contentStyle = getComputedStyle(content)
      const bleedStyle = getComputedStyle(bleed)
      const beforeStyle = getComputedStyle(beforeSection)
      const afterStyle = getComputedStyle(afterSection)
      const bleedRect = bleed.getBoundingClientRect()
      const paginationRect = pagination.getBoundingClientRect()
      const tableRect = table.getBoundingClientRect()

      return {
        bleedInlineStartVar: shellStyle
          .getPropertyValue('--a-settings-table-shell-bleed-inline-start')
          .trim(),
        bleedInlineEndVar: shellStyle
          .getPropertyValue('--a-settings-table-shell-bleed-inline-end')
          .trim(),
        marginInlineStart: Number.parseFloat(bleedStyle.marginInlineStart),
        marginInlineEnd: Number.parseFloat(bleedStyle.marginInlineEnd),
        contentPaddingInlineStart: Number.parseFloat(contentStyle.paddingInlineStart),
        contentPaddingInlineEnd: Number.parseFloat(contentStyle.paddingInlineEnd),
        beforePaddingInlineStart: Number.parseFloat(beforeStyle.paddingInlineStart),
        beforePaddingInlineEnd: Number.parseFloat(beforeStyle.paddingInlineEnd),
        afterPaddingInlineStart: Number.parseFloat(afterStyle.paddingInlineStart),
        afterPaddingInlineEnd: Number.parseFloat(afterStyle.paddingInlineEnd),
        bleedLeftGap: bleedRect.left - contentRect.left,
        bleedRightGap: contentRect.right - bleedRect.right,
        paginationLeftGap: paginationRect.left - contentRect.left,
        tableBleedLeftGap: tableRect.left - bleedRect.left,
        tableBleedRightGap: bleedRect.right - tableRect.right
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.bleedInlineStartVar).not.toBe('')
    expect(metrics?.bleedInlineEndVar).not.toBe('')
    expect(metrics?.marginInlineStart ?? 0).toBeLessThanOrEqual(-23)
    expect(metrics?.marginInlineStart ?? 0).toBeGreaterThanOrEqual(-25)
    expect(metrics?.marginInlineEnd ?? 0).toBeLessThanOrEqual(-23)
    expect(metrics?.marginInlineEnd ?? 0).toBeGreaterThanOrEqual(-25)
    expect(metrics?.contentPaddingInlineStart ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.contentPaddingInlineStart ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.contentPaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.contentPaddingInlineEnd ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.beforePaddingInlineStart ?? 99).toBeLessThanOrEqual(1)
    expect(metrics?.beforePaddingInlineEnd ?? 99).toBeLessThanOrEqual(1)
    expect(metrics?.afterPaddingInlineStart ?? 99).toBeLessThanOrEqual(1)
    expect(metrics?.afterPaddingInlineEnd ?? 99).toBeLessThanOrEqual(1)
    expect(metrics?.paginationLeftGap ?? 0).toBeGreaterThanOrEqual(7)
    expect(metrics?.paginationLeftGap ?? 999).toBeLessThanOrEqual(9)
    expect(Math.abs(metrics?.bleedLeftGap ?? 99)).toBeLessThanOrEqual(1)
    expect(Math.abs(metrics?.bleedRightGap ?? 99)).toBeLessThanOrEqual(1)
    expect(Math.abs(metrics?.tableBleedLeftGap ?? 99)).toBeLessThanOrEqual(1)
    expect(Math.abs(metrics?.tableBleedRightGap ?? 99)).toBeLessThanOrEqual(1)

    await assertNoDocumentScrollLeak(page)
  })

  test('keeps the review voting button anchored to the right when search hides pagination', async ({
    page
  }) => {
    await loginWithNewAccount(page)

    await page.goto('/votes')
    await expect(page).toHaveURL(/\/votes$/)

    const reviewButton = page.getByRole('button', { name: /review voting/i })
    const searchInput = page.locator('.delegates-view input').first()

    await expect(reviewButton).toBeVisible()
    await expect(searchInput).toBeVisible()

    const initialRightGap = await reviewButton.evaluate((button) => {
      return window.innerWidth - button.getBoundingClientRect().right
    })

    await searchInput.fill('zzzzzzzz')
    await expect(page.locator('.delegates-view__pagination')).toHaveCount(0)

    const filteredRightGap = await reviewButton.evaluate((button) => {
      return window.innerWidth - button.getBoundingClientRect().right
    })

    expect(Math.abs(filteredRightGap - initialRightGap)).toBeLessThanOrEqual(1)
  })

  test('keeps delegate details expander compact spacing tokenized on desktop', async ({ page }) => {
    await loginWithNewAccount(page)

    await page.goto('/votes')
    await expect(page).toHaveURL(/\/votes$/)

    const firstRow = page.locator('.delegates-table-item').first()
    await expect(firstRow).toBeVisible()
    await firstRow.click()

    const metrics = await page.evaluate(() => {
      const expander = document.querySelector('.delegate-details-expander') as HTMLElement | null
      const listItem = document.querySelector(
        '.delegate-details-expander__list-item'
      ) as HTMLElement | null

      if (!expander || !listItem) {
        return null
      }

      const expanderStyle = getComputedStyle(expander)
      const listItemStyle = getComputedStyle(listItem)

      return {
        marginTop: Number.parseFloat(expanderStyle.marginTop),
        marginInlineStart: Number.parseFloat(expanderStyle.marginInlineStart),
        itemMinHeight: Number.parseFloat(listItemStyle.minHeight),
        itemPaddingLeft: Number.parseFloat(listItemStyle.paddingLeft),
        itemPaddingRight: Number.parseFloat(listItemStyle.paddingRight)
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.marginTop ?? 0).toBeGreaterThanOrEqual(9)
    expect(metrics?.marginTop ?? 999).toBeLessThanOrEqual(11)
    expect(metrics?.marginInlineStart ?? 0).toBeGreaterThanOrEqual(25)
    expect(metrics?.marginInlineStart ?? 999).toBeLessThanOrEqual(27)
    expect(metrics?.itemMinHeight ?? 0).toBeGreaterThanOrEqual(35)
    expect(metrics?.itemMinHeight ?? 999).toBeLessThanOrEqual(37)
    expect(metrics?.itemPaddingLeft ?? 0).toBeGreaterThanOrEqual(19)
    expect(metrics?.itemPaddingLeft ?? 999).toBeLessThanOrEqual(21)
    expect(metrics?.itemPaddingRight ?? 0).toBeGreaterThanOrEqual(19)
    expect(metrics?.itemPaddingRight ?? 999).toBeLessThanOrEqual(21)
  })

  test('keeps delegates table edge-to-edge on mobile while padded content stays on shared gutters', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginWithNewAccount(page)

    await page.goto('/votes')
    await expect(page).toHaveURL(/\/votes$/)
    await expect(page.locator('.delegates-view')).toBeVisible()
    await expect(page.locator('.settings-data-table')).toBeVisible()

    const metrics = await page.evaluate(() => {
      const shell = document.querySelector('.settings-table-shell') as HTMLElement | null
      const bleed = document.querySelector('.settings-table-shell__bleed') as HTMLElement | null
      const beforeSection = document.querySelector(
        '.settings-table-shell__section'
      ) as HTMLElement | null
      const table = document.querySelector('.settings-data-table') as HTMLElement | null

      if (!shell || !bleed || !beforeSection || !table) {
        return null
      }

      const shellStyle = getComputedStyle(shell)
      const bleedStyle = getComputedStyle(bleed)
      const beforeStyle = getComputedStyle(beforeSection)
      const tableRect = table.getBoundingClientRect()

      return {
        bleedInlineStartVar: shellStyle
          .getPropertyValue('--a-settings-table-shell-bleed-inline-start')
          .trim(),
        bleedInlineEndVar: shellStyle
          .getPropertyValue('--a-settings-table-shell-bleed-inline-end')
          .trim(),
        marginInlineStart: Number.parseFloat(bleedStyle.marginInlineStart),
        marginInlineEnd: Number.parseFloat(bleedStyle.marginInlineEnd),
        beforePaddingInlineStart: Number.parseFloat(beforeStyle.paddingInlineStart),
        beforePaddingInlineEnd: Number.parseFloat(beforeStyle.paddingInlineEnd),
        tableLeft: tableRect.left,
        tableRightGap: window.innerWidth - tableRect.right
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.bleedInlineStartVar).not.toBe('')
    expect(metrics?.bleedInlineEndVar).not.toBe('')
    expect(metrics?.marginInlineStart ?? 0).toBeLessThanOrEqual(-23)
    expect(metrics?.marginInlineStart ?? 0).toBeGreaterThanOrEqual(-25)
    expect(metrics?.marginInlineEnd ?? 0).toBeLessThanOrEqual(-23)
    expect(metrics?.marginInlineEnd ?? 0).toBeGreaterThanOrEqual(-25)
    expect(metrics?.beforePaddingInlineStart ?? 99).toBeLessThanOrEqual(1)
    expect(metrics?.beforePaddingInlineEnd ?? 99).toBeLessThanOrEqual(1)
    expect(Math.abs(metrics?.tableLeft ?? 99)).toBeLessThanOrEqual(1)
    expect(Math.abs(metrics?.tableRightGap ?? 99)).toBeLessThanOrEqual(1)

    await assertNoDocumentScrollLeak(page)
  })
})
