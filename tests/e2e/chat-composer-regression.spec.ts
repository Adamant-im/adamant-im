import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'
import { loginWithNewAccount } from './helpers/auth'

const attachPageScreenshot = async (page: Page, testInfo: TestInfo, name: string) => {
  const body = await page.screenshot({ fullPage: true })

  await testInfo.attach(name, {
    body,
    contentType: 'image/png'
  })
}

const getMessagesBottomOffset = async (messagesContainer: Locator) => {
  return messagesContainer.evaluate((element) => {
    return element.scrollHeight - Math.ceil(element.scrollTop) - element.clientHeight
  })
}

const ensureMessagesScrollable = async (textarea: Locator, messagesContainer: Locator) => {
  const isScrollable = async () =>
    messagesContainer.evaluate((element) => element.scrollHeight - element.clientHeight > 24)

  if (await isScrollable()) {
    return
  }

  await expect(textarea).toBeEditable()

  await messagesContainer.evaluate((element) => {
    if (element.scrollHeight - element.clientHeight > 24) {
      return
    }

    const hasFiller = element.querySelector('[data-e2e-scroll-filler="1"]')
    if (hasFiller) {
      return
    }

    // Keep test deterministic on fresh/short chats: create hidden overflow content
    // so we can assert bottom anchoring when composer height changes
    const filler = document.createElement('div')
    filler.setAttribute('data-e2e-scroll-filler', '1')
    filler.style.height = '1400px'
    filler.style.opacity = '0'
    filler.style.pointerEvents = 'none'
    filler.style.userSelect = 'none'

    element.appendChild(filler)
  })

  await expect.poll(isScrollable, { timeout: 5_000 }).toBe(true)
}

const openChatWithEditableComposer = async (page: Page): Promise<Locator> => {
  await loginWithNewAccount(page)

  await page.goto('/chats')
  await expect(page).toHaveURL(/\/chats$/)

  const chatItems = page.locator('.chats-view__messages--chat .v-list-item')
  await expect(chatItems.first()).toBeVisible()
  const chatCount = await chatItems.count()

  expect(chatCount).toBeGreaterThan(0)

  for (let index = 0; index < chatCount; index += 1) {
    await chatItems.nth(index).click()
    await page.waitForURL(/\/chats\/[^/?#]+$/, { timeout: 30_000 })

    const textarea = page.locator('.a-chat__form textarea').first()
    let isEditable = false

    try {
      await expect.poll(() => textarea.isEditable(), { timeout: 12_000 }).toBe(true)
      isEditable = true
    } catch {
      isEditable = await textarea.isEditable()
    }

    if (isEditable) {
      return textarea
    }

    await page.goto('/chats')
    await expect(page).toHaveURL(/\/chats$/)
  }

  throw new Error('No chats with editable composer were found')
}

test.describe('Chat composer regressions', () => {
  test('blurs composer on first Escape and leaves chat on second Escape', async ({ page }) => {
    const textarea = await openChatWithEditableComposer(page)

    const chatUrl = page.url()
    await textarea.focus()
    await expect(textarea).toBeFocused()

    await page.keyboard.press('Escape')

    await expect(textarea).not.toBeFocused()
    await expect(page).toHaveURL(chatUrl)

    await page.keyboard.press('Escape')

    await expect(page).toHaveURL(/\/chats(?:\/)?$/, { timeout: 15_000 })
  })

  test('collapses back to one row after deleting second-line content', async ({
    page
  }, testInfo) => {
    const textarea = await openChatWithEditableComposer(page)

    await textarea.fill('line1')
    const oneRowHeight = await textarea.evaluate((el) => el.clientHeight)

    await textarea.press('Shift+Enter')
    await textarea.type('line2')

    await expect
      .poll(() => textarea.evaluate((el) => el.clientHeight), { timeout: 5_000 })
      .toBeGreaterThan(oneRowHeight)

    const twoRowsHeight = await textarea.evaluate((el) => el.clientHeight)

    for (const _ of 'line2') {
      await textarea.press('Backspace')
    }

    await expect
      .poll(() => textarea.evaluate((el) => (el as HTMLTextAreaElement).value), { timeout: 5_000 })
      .toBe('line1')

    await expect
      .poll(() => textarea.evaluate((el) => el.clientHeight), { timeout: 5_000 })
      .toBeLessThan(twoRowsHeight)

    await attachPageScreenshot(page, testInfo, 'composer-collapsed-after-delete-second-line')
  })

  test('collapses from three rows to two after deleting an empty third line', async ({
    page
  }, testInfo) => {
    const textarea = await openChatWithEditableComposer(page)

    await textarea.fill('line1')
    await textarea.press('Shift+Enter')
    await textarea.type('line2')

    const twoRowsHeight = await textarea.evaluate((el) => el.clientHeight)

    await textarea.press('Shift+Enter')

    await expect
      .poll(() => textarea.evaluate((el) => el.clientHeight), { timeout: 5_000 })
      .toBeGreaterThan(twoRowsHeight)

    const threeRowsHeight = await textarea.evaluate((el) => el.clientHeight)

    await textarea.press('Backspace')

    await expect
      .poll(() => textarea.evaluate((el) => (el as HTMLTextAreaElement).value), { timeout: 5_000 })
      .toBe('line1\nline2')

    await expect
      .poll(() => textarea.evaluate((el) => el.clientHeight), { timeout: 5_000 })
      .toBeLessThan(threeRowsHeight)

    await attachPageScreenshot(
      page,
      testInfo,
      'composer-collapsed-from-three-to-two-empty-third-line'
    )
  })

  test('collapses from three rows to two after deleting third-line content', async ({
    page
  }, testInfo) => {
    const textarea = await openChatWithEditableComposer(page)

    await textarea.fill('line1')
    await textarea.press('Shift+Enter')
    await textarea.type('line2')
    await textarea.press('Shift+Enter')
    await textarea.type('line3')

    const threeRowsHeight = await textarea.evaluate((el) => el.clientHeight)

    for (const _ of 'line3') {
      await textarea.press('Backspace')
    }
    await textarea.press('Backspace')

    await expect
      .poll(() => textarea.evaluate((el) => (el as HTMLTextAreaElement).value), { timeout: 5_000 })
      .toBe('line1\nline2')

    await expect
      .poll(() => textarea.evaluate((el) => el.clientHeight), { timeout: 5_000 })
      .toBeLessThan(threeRowsHeight)

    await attachPageScreenshot(
      page,
      testInfo,
      'composer-collapsed-from-three-to-two-third-line-content'
    )
  })

  test('removes only one empty trailing line when two empty lines are present (Backspace)', async ({
    page
  }, testInfo) => {
    const textarea = await openChatWithEditableComposer(page)

    await textarea.fill('line1')
    const oneRowHeight = await textarea.evaluate((el) => el.clientHeight)

    await textarea.press('Shift+Enter')
    await textarea.press('Shift+Enter')

    await expect
      .poll(() => textarea.evaluate((el) => el.clientHeight), { timeout: 5_000 })
      .toBeGreaterThan(oneRowHeight)

    const threeRowsHeight = await textarea.evaluate((el) => el.clientHeight)

    await textarea.press('Backspace')

    await expect
      .poll(() => textarea.evaluate((el) => (el as HTMLTextAreaElement).value), { timeout: 5_000 })
      .toBe('line1\n')

    await expect
      .poll(() => textarea.evaluate((el) => el.clientHeight), { timeout: 5_000 })
      .toBeLessThan(threeRowsHeight)

    await expect
      .poll(() => textarea.evaluate((el) => el.clientHeight), { timeout: 5_000 })
      .toBeGreaterThan(oneRowHeight)

    await attachPageScreenshot(
      page,
      testInfo,
      'composer-removes-only-one-empty-trailing-line-backspace'
    )
  })

  test('removes only one empty trailing line when two empty lines are present (Delete)', async ({
    page
  }, testInfo) => {
    const textarea = await openChatWithEditableComposer(page)

    await textarea.fill('line1')
    const oneRowHeight = await textarea.evaluate((el) => el.clientHeight)

    await textarea.press('Shift+Enter')
    await textarea.press('Shift+Enter')

    await expect
      .poll(() => textarea.evaluate((el) => el.clientHeight), { timeout: 5_000 })
      .toBeGreaterThan(oneRowHeight)

    const threeRowsHeight = await textarea.evaluate((el) => el.clientHeight)

    await textarea.press('ArrowLeft')
    await textarea.press('Delete')

    await expect
      .poll(() => textarea.evaluate((el) => (el as HTMLTextAreaElement).value), { timeout: 5_000 })
      .toBe('line1\n')

    await expect
      .poll(() => textarea.evaluate((el) => el.clientHeight), { timeout: 5_000 })
      .toBeLessThan(threeRowsHeight)

    await expect
      .poll(() => textarea.evaluate((el) => el.clientHeight), { timeout: 5_000 })
      .toBeGreaterThan(oneRowHeight)

    await attachPageScreenshot(
      page,
      testInfo,
      'composer-removes-only-one-empty-trailing-line-delete'
    )
  })

  test('collapses back to one row after deleting an empty second line', async ({
    page
  }, testInfo) => {
    const textarea = await openChatWithEditableComposer(page)

    await textarea.fill('line1')
    const oneRowHeight = await textarea.evaluate((el) => el.clientHeight)

    await textarea.press('Shift+Enter')

    await expect
      .poll(() => textarea.evaluate((el) => el.clientHeight), { timeout: 5_000 })
      .toBeGreaterThan(oneRowHeight)

    const twoRowsHeight = await textarea.evaluate((el) => el.clientHeight)

    await textarea.press('Backspace')

    await expect
      .poll(() => textarea.evaluate((el) => (el as HTMLTextAreaElement).value), { timeout: 5_000 })
      .toBe('line1')

    await expect
      .poll(() => textarea.evaluate((el) => el.clientHeight), { timeout: 5_000 })
      .toBeLessThan(twoRowsHeight)

    await attachPageScreenshot(page, testInfo, 'composer-collapsed-after-delete-empty-second-line')
  })

  test('collapses back to one row after deleting an empty second line with Delete', async ({
    page
  }, testInfo) => {
    const textarea = await openChatWithEditableComposer(page)

    await textarea.fill('line1')
    const oneRowHeight = await textarea.evaluate((el) => el.clientHeight)

    await textarea.press('Shift+Enter')

    await expect
      .poll(() => textarea.evaluate((el) => el.clientHeight), { timeout: 5_000 })
      .toBeGreaterThan(oneRowHeight)

    const twoRowsHeight = await textarea.evaluate((el) => el.clientHeight)

    await textarea.press('ArrowLeft')
    await textarea.press('Delete')

    await expect
      .poll(() => textarea.evaluate((el) => (el as HTMLTextAreaElement).value), { timeout: 5_000 })
      .toBe('line1')

    await expect
      .poll(() => textarea.evaluate((el) => el.clientHeight), { timeout: 5_000 })
      .toBeLessThan(twoRowsHeight)

    await attachPageScreenshot(
      page,
      testInfo,
      'composer-collapsed-after-delete-empty-second-line-with-delete'
    )
  })

  test('keeps one-line height stable after collapsing from two lines and deleting a character', async ({
    page
  }, testInfo) => {
    const textarea = await openChatWithEditableComposer(page)

    await textarea.fill('line1234')
    await textarea.press('Shift+Enter')
    await textarea.press('Backspace')

    await expect
      .poll(() => textarea.evaluate((el) => (el as HTMLTextAreaElement).value), { timeout: 5_000 })
      .toBe('line1234')

    const oneRowHeightAfterCollapse = await textarea.evaluate((el) => el.clientHeight)

    await textarea.press('Backspace')

    await expect
      .poll(() => textarea.evaluate((el) => (el as HTMLTextAreaElement).value), { timeout: 5_000 })
      .toBe('line123')

    await expect
      .poll(() => textarea.evaluate((el) => el.clientHeight), { timeout: 5_000 })
      .toBe(oneRowHeightAfterCollapse)

    await attachPageScreenshot(
      page,
      testInfo,
      'composer-one-line-height-stable-after-two-lines-collapse'
    )
  })

  test('keeps one-line height stable after collapsing from three lines and deleting a character', async ({
    page
  }, testInfo) => {
    const textarea = await openChatWithEditableComposer(page)

    await textarea.fill('line1234')
    await textarea.press('Shift+Enter')
    await textarea.press('Shift+Enter')
    await textarea.press('Backspace')
    await textarea.press('Backspace')

    await expect
      .poll(() => textarea.evaluate((el) => (el as HTMLTextAreaElement).value), { timeout: 5_000 })
      .toBe('line1234')

    const oneRowHeightAfterCollapse = await textarea.evaluate((el) => el.clientHeight)

    await textarea.press('Backspace')

    await expect
      .poll(() => textarea.evaluate((el) => (el as HTMLTextAreaElement).value), { timeout: 5_000 })
      .toBe('line123')

    await expect
      .poll(() => textarea.evaluate((el) => el.clientHeight), { timeout: 5_000 })
      .toBe(oneRowHeightAfterCollapse)

    await attachPageScreenshot(
      page,
      testInfo,
      'composer-one-line-height-stable-after-three-lines-collapse'
    )
  })
})

test.describe('Chat composer mobile scrolling regressions', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  })

  test('keeps messages list pinned to bottom after removing empty second line', async ({
    page
  }, testInfo) => {
    const textarea = await openChatWithEditableComposer(page)
    const messagesContainer = page.locator('.a-chat__body-messages').first()

    await expect(messagesContainer).toBeVisible()
    await ensureMessagesScrollable(textarea, messagesContainer)

    await messagesContainer.evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })

    await expect
      .poll(() => getMessagesBottomOffset(messagesContainer), { timeout: 5_000 })
      .toBeLessThanOrEqual(2)

    await textarea.fill('line1')
    await textarea.press('Shift+Enter')
    await textarea.press('Backspace')

    await expect
      .poll(() => textarea.evaluate((el) => (el as HTMLTextAreaElement).value), { timeout: 5_000 })
      .toBe('line1')

    await expect
      .poll(() => getMessagesBottomOffset(messagesContainer), { timeout: 5_000 })
      .toBeLessThanOrEqual(2)

    await attachPageScreenshot(
      page,
      testInfo,
      'mobile-composer-keeps-scroll-at-bottom-after-collapse'
    )
  })
})
