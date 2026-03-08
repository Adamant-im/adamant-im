import { config as loadEnv } from 'dotenv'
import { expect, test } from '@playwright/test'
import { loginWithPassphrase } from './helpers/auth'

loadEnv({ path: '.env.local' })

const testPassphrase = process.env.ADM_TEST_ACCOUNT_PK?.trim()

test.describe('Chat self reactions regressions', () => {
  test('keeps outgoing reactions in self-chat on the left side of the outgoing bubble', async ({
    page
  }) => {
    test.setTimeout(180_000)
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

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

    const readReactionGeometry = () =>
      page.evaluate(() => {
        const messagesContainer = document.querySelector('.a-chat__body-messages')

        if (!(messagesContainer instanceof HTMLElement)) return null

        const outgoingWithReactions = Array.from(
          messagesContainer.querySelectorAll('.a-chat__message-container--right')
        ).filter(
          (element): element is HTMLElement =>
            element instanceof HTMLElement && !!element.querySelector('.a-chat-reactions')
        )

        const targetMessage = outgoingWithReactions.at(-1)
        const reactions = targetMessage?.querySelector('.a-chat-reactions')

        if (!(targetMessage instanceof HTMLElement) || !(reactions instanceof HTMLElement)) {
          return null
        }

        targetMessage.scrollIntoView({
          block: 'center'
        })

        const containerRect = messagesContainer.getBoundingClientRect()
        const messageRect = targetMessage.getBoundingClientRect()
        const reactionsRect = reactions.getBoundingClientRect()

        return {
          containerLeft: containerRect.left,
          containerRight: containerRect.right,
          messageLeft: messageRect.left,
          reactionsLeft: reactionsRect.left,
          reactionsRight: reactionsRect.right
        }
      })

    await expect.poll(readReactionGeometry, { timeout: 15_000 }).not.toBeNull()

    const geometry = await readReactionGeometry()

    expect(geometry).not.toBeNull()
    expect(geometry!.reactionsLeft).toBeLessThan(geometry!.messageLeft)
    expect(geometry!.reactionsLeft).toBeGreaterThanOrEqual(geometry!.containerLeft - 1)
    expect(geometry!.reactionsRight).toBeLessThanOrEqual(geometry!.containerRight + 1)
  })
})
