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

test.describe('Chats layout regressions', () => {
  test('keeps list scroll isolated and renders empty right pane logo', async ({ page }) => {
    await loginWithNewAccount(page)

    const chatsList = page.locator('.chats-view__messages--chat')
    await expect(chatsList).toBeVisible()
    await expect(page.locator('.sidebar__router-view--logo img')).toBeVisible()

    const chatsOverflowY = await chatsList.evaluate((el) => getComputedStyle(el).overflowY)
    expect(['auto', 'scroll']).toContain(chatsOverflowY)

    const chatsHeight = await chatsList.evaluate((el) => el.clientHeight)
    expect(chatsHeight).toBeGreaterThan(0)

    const canScrollChats = await chatsList.evaluate((el) => el.scrollHeight > el.clientHeight + 1)

    if (canScrollChats) {
      await chatsList.evaluate((el) => {
        el.scrollTop = 300
      })

      await expect.poll(() => chatsList.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
    }

    await assertNoDocumentScrollLeak(page)
  })
})
