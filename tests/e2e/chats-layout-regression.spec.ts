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

    const chatsOverflow = await chatsList.evaluate((el) => {
      const style = getComputedStyle(el)

      return {
        overflowY: style.overflowY,
        overflowX: style.overflowX,
        overscrollBehavior: style.overscrollBehavior
      }
    })
    expect(['auto', 'scroll']).toContain(chatsOverflow.overflowY)
    expect(chatsOverflow.overflowX).toBe('hidden')
    expect(chatsOverflow.overscrollBehavior).toBe('contain')

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
      const spinner = document.querySelector(
        '.chats-view__connection-spinner'
      ) as HTMLElement | null
      const avatarOrIcon = document.querySelector(
        '.chats-view__messages--chat .chat-brief__chat-avatar, .chats-view__messages--chat .chat-brief__icon'
      ) as HTMLElement | null

      if (!row || !button) {
        return null
      }

      const rowRect = row.getBoundingClientRect()
      const buttonRect = button.getBoundingClientRect()
      const markRead = document.querySelector('.chats-view__mark-read-btn') as HTMLElement | null
      const markReadRect = markRead?.getBoundingClientRect() ?? null
      let spinnerToAvatarAxisDeltaX = null as number | null

      if (spinner && avatarOrIcon) {
        // Spinner can be hidden by v-show when nodes are online. Temporarily reveal it
        // to validate horizontal axis alignment against chat avatar/icon column.
        const previousDisplay = spinner.style.display
        const previousVisibility = spinner.style.visibility
        spinner.style.display = 'inline-flex'
        spinner.style.visibility = 'hidden'

        const spinnerRect = spinner.getBoundingClientRect()
        const avatarRect = avatarOrIcon.getBoundingClientRect()
        spinnerToAvatarAxisDeltaX = Math.abs(
          spinnerRect.left + spinnerRect.width / 2 - (avatarRect.left + avatarRect.width / 2)
        )

        spinner.style.display = previousDisplay
        spinner.style.visibility = previousVisibility
      }

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
          : null,
        spinnerToAvatarAxisDeltaX
      }
    })

    expect(geometry).not.toBeNull()
    expect(geometry?.rowHeight ?? 0).toBeGreaterThan(0)
    expect(geometry?.buttonHeight ?? 0).toBeGreaterThanOrEqual((geometry?.rowHeight ?? 0) - 1)
    expect(geometry?.centerDelta ?? 999).toBeLessThanOrEqual(2)

    if (geometry?.markReadCenterDelta !== null) {
      expect(geometry?.markReadCenterDelta ?? 999).toBeLessThanOrEqual(2)
    }

    if (geometry?.spinnerToAvatarAxisDeltaX !== null) {
      expect(geometry?.spinnerToAvatarAxisDeltaX ?? 999).toBeLessThanOrEqual(2)
    }
  })

  test('keeps chat toolbar sizing and typography tokenized when chat is opened', async ({
    page
  }) => {
    await loginWithNewAccount(page)

    const chatItems = page.locator('.chats-view__messages--chat .v-list-item')
    await expect(chatItems.first()).toBeVisible()

    await chatItems.first().click()
    await page.waitForURL(/\/chats\/[^/?#]+$/, { timeout: 90_000 })
    await expect(page.locator('.chat-toolbar')).toBeVisible()

    const metrics = await page.evaluate(() => {
      const toolbar = document.querySelector('.chat-toolbar') as HTMLElement | null
      const toolbarContent = toolbar?.querySelector('.v-toolbar__content') as HTMLElement | null
      const fieldLabel = document.querySelector(
        '.chat-toolbar .v-text-field .v-field__field .v-label.v-field-label'
      ) as HTMLElement | null
      const fieldInput = document.querySelector(
        '.chat-toolbar .v-text-field .v-field__input'
      ) as HTMLElement | null
      const admChatName = document.querySelector(
        '.chat-toolbar__adm-chat-name'
      ) as HTMLElement | null

      if (!toolbar || !toolbarContent) {
        return null
      }

      const toolbarStyle = getComputedStyle(toolbar)
      const toolbarContentStyle = getComputedStyle(toolbarContent)
      const fieldLabelStyle = fieldLabel ? getComputedStyle(fieldLabel) : null
      const fieldInputStyle = fieldInput ? getComputedStyle(fieldInput) : null
      const admChatNameStyle = admChatName ? getComputedStyle(admChatName) : null

      return {
        labelFontSizeVar: toolbarStyle.getPropertyValue('--a-chat-toolbar-label-font-size').trim(),
        inputPaddingTopVar: toolbarStyle
          .getPropertyValue('--a-chat-toolbar-input-padding-top')
          .trim(),
        contentHeight: Number.parseFloat(toolbarContentStyle.height),
        contentGap: Number.parseFloat(toolbarContentStyle.columnGap || toolbarContentStyle.gap),
        labelFontSize: fieldLabelStyle ? Number.parseFloat(fieldLabelStyle.fontSize) : null,
        inputPaddingTop: fieldInputStyle ? Number.parseFloat(fieldInputStyle.paddingTop) : null,
        admNameLetterSpacing: admChatNameStyle
          ? Number.parseFloat(admChatNameStyle.letterSpacing)
          : null
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.labelFontSizeVar).not.toBe('')
    expect(metrics?.inputPaddingTopVar).not.toBe('')
    expect(metrics?.contentHeight ?? 0).toBeGreaterThanOrEqual(55)
    expect(metrics?.contentHeight ?? 999).toBeLessThanOrEqual(57)
    expect(metrics?.contentGap ?? 0).toBeGreaterThanOrEqual(7)
    expect(metrics?.contentGap ?? 999).toBeLessThanOrEqual(9)

    if (metrics?.labelFontSize !== null) {
      expect(metrics?.labelFontSize ?? 0).toBeGreaterThanOrEqual(15)
      expect(metrics?.labelFontSize ?? 999).toBeLessThanOrEqual(17)
    }

    if (metrics?.inputPaddingTop !== null) {
      expect(metrics?.inputPaddingTop ?? 0).toBeGreaterThanOrEqual(19)
      expect(metrics?.inputPaddingTop ?? 999).toBeLessThanOrEqual(21)
    }

    if (metrics?.admNameLetterSpacing !== null) {
      expect(metrics?.admNameLetterSpacing ?? 0).toBeGreaterThan(0)
    }
  })

  test('keeps chat preview spacing and subtitle clamping stable in chats list', async ({
    page
  }) => {
    await loginWithNewAccount(page)

    const preview = page.locator('.chats-view__messages--chat .chat-brief').first()
    await expect(preview).toBeVisible()

    const metrics = await page.evaluate(() => {
      const previewItem = document.querySelector(
        '.chats-view__messages--chat .chat-brief'
      ) as HTMLElement | null
      const subtitle = previewItem?.querySelector('.chat-brief__subtitle') as HTMLElement | null
      const date = previewItem?.querySelector('.chat-brief__date') as HTMLElement | null
      const avatar = previewItem?.querySelector(
        '.chat-brief__chat-avatar, .chat-brief__icon'
      ) as HTMLElement | null

      if (!previewItem || !subtitle || !avatar) {
        return null
      }

      const previewStyle = getComputedStyle(previewItem)
      const subtitleStyle = getComputedStyle(subtitle)
      const avatarStyle = getComputedStyle(avatar)
      const dateStyle = date ? getComputedStyle(date) : null

      return {
        avatarGapVar: previewStyle.getPropertyValue('--a-chat-brief-avatar-gap').trim(),
        dateGapVar: previewStyle.getPropertyValue('--a-chat-brief-date-gap').trim(),
        subtitleLineHeightVar: previewStyle
          .getPropertyValue('--a-chat-brief-subtitle-line-height')
          .trim(),
        subtitleLineHeight: Number.parseFloat(subtitleStyle.lineHeight),
        subtitleWhiteSpace: subtitleStyle.whiteSpace,
        subtitleOverflow: subtitleStyle.overflow,
        subtitleTextOverflow: subtitleStyle.textOverflow,
        avatarMarginRight: Number.parseFloat(avatarStyle.marginRight),
        dateMarginLeft: dateStyle ? Number.parseFloat(dateStyle.marginLeft) : null
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.avatarGapVar).not.toBe('')
    expect(metrics?.dateGapVar).not.toBe('')
    expect(metrics?.subtitleLineHeightVar).not.toBe('')
    expect(metrics?.subtitleLineHeight ?? 0).toBeGreaterThanOrEqual(20)
    expect(metrics?.subtitleLineHeight ?? 999).toBeLessThanOrEqual(22)
    expect(metrics?.subtitleWhiteSpace).toBe('nowrap')
    expect(metrics?.subtitleOverflow).toBe('hidden')
    expect(metrics?.subtitleTextOverflow).toBe('ellipsis')
    expect(metrics?.avatarMarginRight ?? 0).toBeGreaterThanOrEqual(15)
    expect(metrics?.avatarMarginRight ?? 999).toBeLessThanOrEqual(17)

    if (metrics?.dateMarginLeft !== null) {
      expect(metrics?.dateMarginLeft ?? 0).toBeGreaterThanOrEqual(15)
      expect(metrics?.dateMarginLeft ?? 999).toBeLessThanOrEqual(17)

      test('keeps opened chat message bubble spacing and paddings stable', async ({ page }) => {
        await loginWithNewAccount(page)

        const chatItems = page.locator('.chats-view__messages--chat .v-list-item')
        await expect(chatItems.first()).toBeVisible()
        await chatItems.first().click()

        await page.waitForURL(/\/chats\/[^/?#]+$/, { timeout: 90_000 })

        const firstMessageBubble = page
          .locator('.a-chat__message-container .a-chat__message')
          .first()
        await expect(firstMessageBubble).toBeVisible()

        const metrics = await page.evaluate(() => {
          const chatRoot = document.querySelector('.a-chat') as HTMLElement | null
          const containers = Array.from(
            document.querySelectorAll('.a-chat__message-container')
          ) as HTMLElement[]
          const container = containers[0] ?? null
          const bubble = container?.querySelector('.a-chat__message') as HTMLElement | null

          if (!chatRoot || !container || !bubble) {
            return null
          }

          const rootStyle = getComputedStyle(chatRoot)
          const containerStyle = getComputedStyle(container)
          const bubbleStyle = getComputedStyle(bubble)

          return {
            containerGapVar: rootStyle.getPropertyValue('--a-chat-message-container-gap').trim(),
            groupedGapVar: rootStyle
              .getPropertyValue('--a-chat-message-container-grouped-gap')
              .trim(),
            paddingBlockVar: rootStyle.getPropertyValue('--a-chat-message-padding-block').trim(),
            paddingInlineVar: rootStyle.getPropertyValue('--a-chat-message-padding-inline').trim(),
            hasMultipleBubbles: containers.length > 1,
            isGrouped:
              container.classList.contains('a-chat__message-container--grouped') ||
              container.classList.contains('a-chat__message-container--grouped-left'),
            isLast: container.matches(':last-child'),
            marginBottom: Number.parseFloat(containerStyle.marginBottom),
            paddingTop: Number.parseFloat(bubbleStyle.paddingTop),
            paddingRight: Number.parseFloat(bubbleStyle.paddingRight),
            paddingBottom: Number.parseFloat(bubbleStyle.paddingBottom),
            paddingLeft: Number.parseFloat(bubbleStyle.paddingLeft)
          }
        })

        expect(metrics).not.toBeNull()
        expect(metrics?.containerGapVar).not.toBe('')
        expect(metrics?.groupedGapVar).not.toBe('')
        expect(metrics?.paddingBlockVar).not.toBe('')
        expect(metrics?.paddingInlineVar).not.toBe('')

        if (metrics?.isLast) {
          expect(metrics?.marginBottom ?? 999).toBeLessThanOrEqual(1)
        } else if (metrics?.isGrouped) {
          expect(metrics?.marginBottom ?? 0).toBeGreaterThanOrEqual(3)
          expect(metrics?.marginBottom ?? 999).toBeLessThanOrEqual(5)
        } else if (metrics?.hasMultipleBubbles) {
          expect(metrics?.marginBottom ?? 0).toBeGreaterThanOrEqual(15)
          expect(metrics?.marginBottom ?? 999).toBeLessThanOrEqual(17)
        }

        expect(metrics?.paddingTop ?? 0).toBeGreaterThanOrEqual(7)
        expect(metrics?.paddingTop ?? 999).toBeLessThanOrEqual(9)
        expect(metrics?.paddingBottom ?? 0).toBeGreaterThanOrEqual(7)
        expect(metrics?.paddingBottom ?? 999).toBeLessThanOrEqual(9)
        expect(metrics?.paddingRight ?? 0).toBeGreaterThanOrEqual(15)
        expect(metrics?.paddingRight ?? 999).toBeLessThanOrEqual(17)
        expect(metrics?.paddingLeft ?? 0).toBeGreaterThanOrEqual(15)
        expect(metrics?.paddingLeft ?? 999).toBeLessThanOrEqual(17)
      })
    }
  })
})
