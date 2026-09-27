import { expect, test, type Page } from '@playwright/test'
import { testPassphrase } from './helpers/env'
import { loginWithPassphrase } from './helpers/auth'
import { navigateInApp } from './helpers/navigation'

// Read-only: the test only opens existing chats and never sends messages or reactions.

const INCOMING = '.a-chat__message-container:not(.a-chat__message-container--right)'
const OUTGOING = '.a-chat__message-container--right'

const switchToArabic = async (page: Page) => {
  await navigateInApp(page, '/options')
  await page.locator('.language-switcher__button').first().click()
  await page.locator('.language-switcher__item', { hasText: 'العربية' }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
}

/** Opens the first chat that shows both incoming and outgoing bubbles */
const openChatWithBothDirections = async (page: Page) => {
  const chatItems = page.locator('.chats-view__messages--chat .v-list-item')
  await navigateInApp(page, '/chats')
  await expect(chatItems.first()).toBeVisible({ timeout: 90_000 })
  const count = Math.min(await chatItems.count(), 8)

  for (let index = 0; index < count; index++) {
    await navigateInApp(page, '/chats')
    await chatItems.nth(index).click()
    await page.waitForURL(/\/chats\/[^/?#]+$/, { timeout: 90_000 })
    await expect(page.locator('.a-chat__body-messages').first()).toBeVisible()

    const hasBoth = await expect
      .poll(
        async () =>
          (await page.locator(INCOMING).count()) > 0 && (await page.locator(OUTGOING).count()) > 0,
        { timeout: 15_000 }
      )
      .toBe(true)
      .then(() => true)
      .catch(() => false)

    if (hasBoth) return
  }

  throw new Error('No chat with both incoming and outgoing messages')
}

const readBubbleGeometry = (page: Page) =>
  page.evaluate(
    ({ incomingSelector, outgoingSelector }) => {
      const lastVisible = (selector: string) => {
        const elements = [...document.querySelectorAll<HTMLElement>(selector)]
        return elements.filter((element) => element.offsetParent !== null).at(-1) ?? null
      }

      const incoming = lastVisible(incomingSelector)
      const outgoing = lastVisible(outgoingSelector)

      if (!incoming || !outgoing) return null

      const tail = (container: HTMLElement) => {
        const bubble = container.querySelector('.a-chat__message')
        if (!bubble) return null
        const style = window.getComputedStyle(bubble, '::after')
        return { left: style.left, right: style.right }
      }

      const incomingRect = incoming.getBoundingClientRect()
      const outgoingRect = outgoing.getBoundingClientRect()

      return {
        incoming: { left: incomingRect.left, right: incomingRect.right },
        outgoing: { left: outgoingRect.left, right: outgoingRect.right },
        incomingTail: incoming.matches('.a-chat__message-container--grouped-left')
          ? null
          : tail(incoming),
        outgoingTail: outgoing.matches('.a-chat__message-container--grouped')
          ? null
          : tail(outgoing)
      }
    },
    { incomingSelector: INCOMING, outgoingSelector: OUTGOING }
  )

test.describe('Chat RTL layout regressions', () => {
  test('mirrors chat bubbles, tails and message actions in Arabic', async ({ page }) => {
    test.setTimeout(240_000)
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await loginWithPassphrase(page, testPassphrase!)
    await switchToArabic(page)
    await openChatWithBothDirections(page)

    const geometry = await readBubbleGeometry(page)
    expect(geometry).not.toBeNull()

    // Incoming messages sit at the start of the line (right), outgoing ones at the end (left)
    expect(geometry!.incoming.right).toBeGreaterThan(geometry!.outgoing.right)
    expect(geometry!.incoming.left).toBeGreaterThan(geometry!.outgoing.left)

    if (geometry!.incomingTail) {
      expect(geometry!.incomingTail.right).toBe('-6px')
    }
    if (geometry!.outgoingTail) {
      expect(geometry!.outgoingTail.left).toBe('-6px')
    }

    // The actions button sits in the top corner at the end of the line, and the reaction
    // picker with the reply menu opens aligned to the outgoing bubble's end edge (left)
    const outgoingMessage = page.locator(OUTGOING).last()
    await outgoingMessage.scrollIntoViewIfNeeded()
    await outgoingMessage.hover({ force: true })
    const actionsButton = outgoingMessage.locator('.a-chat__message-actions-icon').first()
    await expect
      .poll(() => actionsButton.evaluate((element) => window.getComputedStyle(element).visibility))
      .toBe('visible')
    await actionsButton.click()

    const dropdown = page.locator('.message-actions-dropdown').first()
    await expect(dropdown).toBeVisible()

    const bubbleBox = await outgoingMessage.locator('.a-chat__message').first().boundingBox()
    const buttonBox = await actionsButton.boundingBox()
    const dropdownBox = await dropdown.boundingBox()

    expect(bubbleBox && buttonBox && dropdownBox).toBeTruthy()
    expect(Math.abs(buttonBox!.x - bubbleBox!.x)).toBeLessThan(2)
    expect(Math.abs(dropdownBox!.x - bubbleBox!.x)).toBeLessThan(8)

    await page.keyboard.press('Escape')
  })
})
