import { config as loadEnv } from 'dotenv'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { loginWithPassphrase } from './helpers/auth'

loadEnv({ path: '.env.local' })

const testPassphrase = process.env.ADM_TEST_ACCOUNT_PK?.trim()

test.describe('Chat message emoji picker regressions', () => {
  const openSelfChatAndWaitForMessages = async (page: Page) => {
    await loginWithPassphrase(page, testPassphrase!)

    await page.goto('/chats')
    await expect(page).toHaveURL(/\/chats$/)

    const chatItems = page.locator('.chats-view__messages--chat .v-list-item')
    const selfChatItem = chatItems
      .filter({
        has: page.locator('.chat-brief__title', {
          hasText: /^You$/
        })
      })
      .first()

    if (await selfChatItem.count()) {
      await selfChatItem.click()
    } else {
      await chatItems.nth(1).click()
    }

    await page.waitForURL(/\/chats\/[^/?#]+$/, { timeout: 90_000 })
    await expect(page.locator('.a-chat__body-messages').first()).toBeVisible()
  }

  const readPickerBounds = async (picker: Locator) => {
    return picker.evaluate((element) => {
      if (!(element instanceof HTMLElement)) {
        return null
      }

      const rect = element.getBoundingClientRect()
      return {
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      }
    })
  }

  test('keeps the message emoji picker inside the viewport near the right edge', async ({
    page
  }) => {
    test.setTimeout(180_000)
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await page.setViewportSize({ width: 1366, height: 900 })
    await openSelfChatAndWaitForMessages(page)

    const outgoingMessage = page.locator('.a-chat__message-container--right').last()
    await expect(outgoingMessage).toBeVisible()
    await outgoingMessage.scrollIntoViewIfNeeded()
    await outgoingMessage.hover()

    const actionsButton = outgoingMessage.locator('.a-chat__message-actions-icon').first()
    await expect(actionsButton).toBeVisible()
    await actionsButton.click()

    const moreButton = page.locator('.a-chat-reaction-select__more-button').last()
    await expect(moreButton).toBeVisible()
    await moreButton.click()

    const picker = page.locator('.emoji-picker').last()
    await expect(picker).toBeVisible()

    const bounds = await readPickerBounds(picker)

    expect(bounds).not.toBeNull()
    expect(bounds!.top).toBeGreaterThanOrEqual(7)
    expect(bounds!.left).toBeGreaterThanOrEqual(7)
    expect(bounds!.right).toBeLessThanOrEqual(bounds!.viewportWidth - 7)
    expect(bounds!.bottom).toBeLessThanOrEqual(bounds!.viewportHeight - 7)
  })

  test('keeps the message emoji picker inside the viewport near the top edge', async ({ page }) => {
    test.setTimeout(180_000)
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await page.setViewportSize({ width: 1366, height: 900 })
    await openSelfChatAndWaitForMessages(page)

    const messagesBody = page.locator('.a-chat__body-messages').first()
    await messagesBody.evaluate((element) => {
      element.scrollTop = 0
    })
    await page.waitForTimeout(500)

    const topMessage = page.locator('.a-chat__message-container').first()
    await expect(topMessage).toBeVisible()
    await topMessage.hover()

    const actionsButton = topMessage.locator('.a-chat__message-actions-icon').first()
    await expect(actionsButton).toBeVisible()
    await actionsButton.click()

    const moreButton = page.locator('.a-chat-reaction-select__more-button').last()
    await expect(moreButton).toBeVisible()
    await moreButton.click()

    const picker = page.locator('.emoji-picker').last()
    await expect(picker).toBeVisible()

    const bounds = await readPickerBounds(picker)

    expect(bounds).not.toBeNull()
    expect(bounds!.top).toBeGreaterThanOrEqual(7)
    expect(bounds!.left).toBeGreaterThanOrEqual(7)
    expect(bounds!.right).toBeLessThanOrEqual(bounds!.viewportWidth - 7)
    expect(bounds!.bottom).toBeLessThanOrEqual(bounds!.viewportHeight - 7)
  })
})
