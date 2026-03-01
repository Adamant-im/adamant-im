import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { loginWithNewAccount } from './helpers/auth'

const attachPageScreenshot = async (page: Page, testInfo: TestInfo, name: string) => {
  const body = await page.screenshot({ fullPage: true })

  await testInfo.attach(name, {
    body,
    contentType: 'image/png'
  })
}

test.describe('Chats core smoke checks', () => {
  test('opens a chat and renders core chat UI', async ({ page }, testInfo) => {
    await loginWithNewAccount(page)

    const chatItems = page.locator('.chats-view__messages--chat .v-list-item')
    await expect(chatItems.first()).toBeVisible()

    await chatItems.first().click()
    await page.waitForURL(/\/chats\/[^/?#]+$/, { timeout: 90_000 })

    await expect(page.locator('.chat-toolbar')).toBeVisible()
    await expect(page.locator('.a-chat__body-messages')).toBeVisible()
    await expect(page.locator('.a-chat__form')).toBeVisible()
    await expect(page.locator('.sidebar__router-view--logo img')).toBeHidden()

    await attachPageScreenshot(page, testInfo, 'chat-opened')
  })

  test('returns to chats list and shows empty right pane logo', async ({ page }, testInfo) => {
    await loginWithNewAccount(page)

    await page.goto('/chats')
    await expect(page).toHaveURL(/\/chats$/)

    await expect(page.locator('.chats-view__messages--chat')).toBeVisible()
    await expect(page.locator('.sidebar__router-view--logo img')).toBeVisible()

    await attachPageScreenshot(page, testInfo, 'chats-list-empty-pane')
  })
})
