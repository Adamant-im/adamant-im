import { config as loadEnv } from 'dotenv'
import { expect, test, type Page } from '@playwright/test'
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

  const readVisiblePickerBounds = async (page: Page) =>
    page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('.emoji-picker'))
        .filter((element): element is HTMLElement => element instanceof HTMLElement)
        .map((element) => ({
          element,
          rect: element.getBoundingClientRect(),
          style: window.getComputedStyle(element)
        }))
        .filter(({ rect, style }) => {
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            Number.parseFloat(style.opacity || '1') > 0
          )
        })

      const target = candidates.at(-1)
      if (!target) {
        return null
      }

      return {
        top: target.rect.top,
        left: target.rect.left,
        right: target.rect.right,
        bottom: target.rect.bottom,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      }
    })

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

    await expect(page.locator('.emoji-picker').last()).toBeVisible()

    await expect
      .poll(async () => {
        const bounds = await readVisiblePickerBounds(page)
        if (!bounds) {
          return null
        }

        return {
          withinHorizontalBounds: bounds.left >= 7 && bounds.right <= bounds.viewportWidth - 7,
          withinVerticalBounds: bounds.top >= 7 && bounds.bottom <= bounds.viewportHeight - 7
        }
      })
      .toEqual({
        withinHorizontalBounds: true,
        withinVerticalBounds: true
      })
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

    await expect(page.locator('.emoji-picker').last()).toBeVisible()

    await expect
      .poll(async () => {
        const bounds = await readVisiblePickerBounds(page)
        if (!bounds) {
          return null
        }

        return {
          withinHorizontalBounds: bounds.left >= 7 && bounds.right <= bounds.viewportWidth - 7,
          withinVerticalBounds: bounds.top >= 7 && bounds.bottom <= bounds.viewportHeight - 7
        }
      })
      .toEqual({
        withinHorizontalBounds: true,
        withinVerticalBounds: true
      })
  })
})
