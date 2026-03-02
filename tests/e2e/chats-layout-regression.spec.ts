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

  test('keeps chats action row controls aligned and inside toolbar height', async ({ page }) => {
    await loginWithNewAccount(page)
    await page.goto('/chats')
    await expect(page).toHaveURL(/\/chats$/)

    const actionsRow = page.locator('.chats-view__chats-actions')
    const newChatButton = page.locator('.chats-view__item')
    await expect(actionsRow).toBeVisible()
    await expect(newChatButton).toBeVisible()

    const geometry = await page.evaluate(() => {
      const row = document.querySelector('.chats-view__chats-actions') as HTMLElement | null
      const button = document.querySelector('.chats-view__item') as HTMLElement | null

      if (!row || !button) {
        return null
      }

      const rowRect = row.getBoundingClientRect()
      const buttonRect = button.getBoundingClientRect()
      const markRead = document.querySelector('.chats-view__mark-read-btn') as HTMLElement | null
      const markReadRect = markRead?.getBoundingClientRect() ?? null

      return {
        rowHeight: rowRect.height,
        buttonHeight: buttonRect.height,
        centerDelta: Math.abs(
          rowRect.top + rowRect.height / 2 - (buttonRect.top + buttonRect.height / 2)
        ),
        markReadCenterDelta: markReadRect
          ? Math.abs(
              rowRect.top + rowRect.height / 2 - (markReadRect.top + markReadRect.height / 2)
            )
          : null
      }
    })

    expect(geometry).not.toBeNull()
    expect(geometry?.rowHeight ?? 0).toBeGreaterThan(0)
    expect(geometry?.buttonHeight ?? 0).toBeGreaterThanOrEqual((geometry?.rowHeight ?? 0) - 1)
    expect(geometry?.centerDelta ?? 999).toBeLessThanOrEqual(2)

    if (geometry?.markReadCenterDelta !== null) {
      expect(geometry?.markReadCenterDelta ?? 999).toBeLessThanOrEqual(2)
    }
  })
})
