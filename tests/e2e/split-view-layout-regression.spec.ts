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

const assertSplitShellVisible = async (page: Page) => {
  await expect(page.locator('.sidebar')).toBeVisible()
  await expect(page.locator('.sidebar__aside')).toBeVisible()
  await expect(page.locator('.sidebar__layout')).toBeVisible()

  const paneMetrics = await page.evaluate(() => {
    const aside = document.querySelector<HTMLElement>('.sidebar__aside')
    const layout = document.querySelector<HTMLElement>('.sidebar__layout')

    return {
      asideHeight: aside?.clientHeight ?? 0,
      layoutHeight: layout?.clientHeight ?? 0
    }
  })

  expect(paneMetrics.asideHeight).toBeGreaterThan(0)
  expect(paneMetrics.layoutHeight).toBeGreaterThan(0)
  expect(Math.abs(paneMetrics.asideHeight - paneMetrics.layoutHeight)).toBeLessThanOrEqual(2)
}

const assertPaneScrollContract = async (page: Page) => {
  const layoutOverflow = await page.locator('.sidebar__layout').evaluate((element) => {
    const style = getComputedStyle(element)

    return {
      overflowY: style.overflowY,
      overflowX: style.overflowX,
      overscrollBehavior: style.overscrollBehavior
    }
  })

  expect(['auto', 'scroll']).toContain(layoutOverflow.overflowY)
  expect(layoutOverflow.overflowX).toBe('hidden')
  expect(layoutOverflow.overscrollBehavior).toBe('contain')
}

test.describe('Split-view layout regressions', () => {
  test('keeps independent pane scrolling on account and settings', async ({ page }) => {
    await loginWithNewAccount(page)

    await page.goto('/home')
    await expect(page).toHaveURL(/\/home$/)
    await expect(page.locator('.account-view')).toBeVisible()

    await assertSplitShellVisible(page)
    await assertPaneScrollContract(page)
    await assertNoDocumentScrollLeak(page)

    await page.goto('/options')
    await expect(page).toHaveURL(/\/options$/)
    await expect(page.locator('.settings-view')).toBeVisible()

    const layout = page.locator('.sidebar__layout')
    const layoutCanScroll = await layout.evaluate((el) => el.scrollHeight > el.clientHeight + 1)

    if (layoutCanScroll) {
      await layout.evaluate((el) => {
        el.scrollTop = 400
      })

      await expect.poll(() => layout.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
    }

    await assertSplitShellVisible(page)
    await assertPaneScrollContract(page)
    await assertNoDocumentScrollLeak(page)
  })
})
