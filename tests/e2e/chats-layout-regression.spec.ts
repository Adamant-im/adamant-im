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
      const rowStyle = getComputedStyle(row)
      const markRead = document.querySelector('.chats-view__mark-read-btn') as HTMLElement | null
      const markReadRect = markRead?.getBoundingClientRect() ?? null
      let spinnerToAvatarAxisDeltaX = null as number | null
      let spinnerSize = null as number | null

      if (spinner && avatarOrIcon) {
        // Spinner can be hidden by v-show when nodes are online. Temporarily reveal it
        // to validate horizontal axis alignment against chat avatar/icon column.
        const previousDisplay = spinner.style.display
        const previousVisibility = spinner.style.visibility
        spinner.style.display = 'inline-flex'
        spinner.style.visibility = 'hidden'

        const spinnerRect = spinner.getBoundingClientRect()
        const avatarRect = avatarOrIcon.getBoundingClientRect()
        spinnerSize = spinnerRect.width
        spinnerToAvatarAxisDeltaX = Math.abs(
          spinnerRect.left + spinnerRect.width / 2 - (avatarRect.left + avatarRect.width / 2)
        )

        spinner.style.display = previousDisplay
        spinner.style.visibility = previousVisibility
      }

      return {
        rowHeight: rowRect.height,
        buttonHeight: buttonRect.height,
        rowPaddingLeft: Number.parseFloat(rowStyle.paddingLeft),
        rowPaddingRight: Number.parseFloat(rowStyle.paddingRight),
        centerDelta: Math.abs(
          rowRect.top + rowRect.height / 2 - (buttonRect.top + buttonRect.height / 2)
        ),
        markReadCenterDelta: markReadRect
          ? Math.abs(
              rowRect.top + rowRect.height / 2 - (markReadRect.top + markReadRect.height / 2)
            )
          : null,
        spinnerSize,
        spinnerToAvatarAxisDeltaX
      }
    })

    expect(geometry).not.toBeNull()
    expect(geometry?.rowHeight ?? 0).toBeGreaterThan(0)
    expect(geometry?.buttonHeight ?? 0).toBeGreaterThanOrEqual((geometry?.rowHeight ?? 0) - 1)
    expect(geometry?.rowPaddingLeft ?? 0).toBeGreaterThanOrEqual(19)
    expect(geometry?.rowPaddingLeft ?? 99).toBeLessThanOrEqual(21)
    expect(geometry?.rowPaddingRight ?? 0).toBeGreaterThanOrEqual(23)
    expect(geometry?.rowPaddingRight ?? 99).toBeLessThanOrEqual(25)
    expect(geometry?.centerDelta ?? 999).toBeLessThanOrEqual(2)

    if (geometry?.markReadCenterDelta !== null) {
      expect(geometry?.markReadCenterDelta ?? 999).toBeLessThanOrEqual(2)
    }

    if (geometry?.spinnerSize !== null) {
      expect(geometry?.spinnerSize ?? 0).toBeGreaterThanOrEqual(31)
      expect(geometry?.spinnerSize ?? 999).toBeLessThanOrEqual(33)
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
        toolbarPaddingInlineStart: Number.parseFloat(toolbarStyle.paddingInlineStart),
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
    expect(metrics?.toolbarPaddingInlineStart ?? 0).toBeGreaterThanOrEqual(15)
    expect(metrics?.toolbarPaddingInlineStart ?? 999).toBeLessThanOrEqual(17)
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
      const heading = previewItem?.querySelector('.chat-brief__heading') as HTMLElement | null
      const subtitle = previewItem?.querySelector('.chat-brief__subtitle') as HTMLElement | null
      const date = previewItem?.querySelector('.chat-brief__date') as HTMLElement | null
      const avatar = previewItem?.querySelector(
        '.chat-brief__chat-avatar, .chat-brief__icon'
      ) as HTMLElement | null

      if (!previewItem || !heading || !subtitle || !avatar) {
        return null
      }

      const previewStyle = getComputedStyle(previewItem)
      const subtitleStyle = getComputedStyle(subtitle)
      const avatarStyle = getComputedStyle(avatar)
      const dateStyle = date ? getComputedStyle(date) : null
      const headingRect = heading.getBoundingClientRect()
      const subtitleRect = subtitle.getBoundingClientRect()
      const avatarRect = avatar.getBoundingClientRect()

      return {
        previewPaddingLeft: Number.parseFloat(previewStyle.paddingLeft),
        previewPaddingRight: Number.parseFloat(previewStyle.paddingRight),
        avatarGapVar: previewStyle.getPropertyValue('--a-chat-brief-avatar-gap').trim(),
        dateGapVar: previewStyle.getPropertyValue('--a-chat-brief-date-gap').trim(),
        headingGapVar: previewStyle.getPropertyValue('--a-chat-brief-heading-gap').trim(),
        subtitleLineHeightVar: previewStyle
          .getPropertyValue('--a-chat-brief-subtitle-line-height')
          .trim(),
        subtitleLineHeight: Number.parseFloat(subtitleStyle.lineHeight),
        subtitleWhiteSpace: subtitleStyle.whiteSpace,
        subtitleOverflow: subtitleStyle.overflow,
        subtitleTextOverflow: subtitleStyle.textOverflow,
        avatarWidth: avatarRect.width,
        avatarMarginRight: Number.parseFloat(avatarStyle.marginRight),
        dateMarginLeft: dateStyle ? Number.parseFloat(dateStyle.marginLeft) : null,
        headingGap: subtitleRect.top - headingRect.bottom
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.avatarGapVar).not.toBe('')
    expect(metrics?.dateGapVar).not.toBe('')
    expect(metrics?.headingGapVar).not.toBe('')
    expect(metrics?.previewPaddingLeft ?? 0).toBeGreaterThanOrEqual(19)
    expect(metrics?.previewPaddingLeft ?? 99).toBeLessThanOrEqual(21)
    expect(metrics?.previewPaddingRight ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.previewPaddingRight ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.subtitleLineHeightVar).not.toBe('')
    expect(metrics?.subtitleLineHeight ?? 0).toBeGreaterThanOrEqual(20)
    expect(metrics?.subtitleLineHeight ?? 999).toBeLessThanOrEqual(22)
    expect(metrics?.subtitleWhiteSpace).toBe('nowrap')
    expect(metrics?.subtitleOverflow).toBe('hidden')
    expect(metrics?.subtitleTextOverflow).toBe('ellipsis')
    expect(metrics?.avatarWidth ?? 0).toBeGreaterThanOrEqual(51)
    expect(metrics?.avatarWidth ?? 999).toBeLessThanOrEqual(53)
    expect(metrics?.avatarMarginRight ?? 0).toBeGreaterThanOrEqual(15)
    expect(metrics?.avatarMarginRight ?? 999).toBeLessThanOrEqual(17)
    expect(metrics?.headingGap ?? 0).toBeGreaterThanOrEqual(1)
    expect(metrics?.headingGap ?? 99).toBeLessThanOrEqual(3)

    if (metrics?.dateMarginLeft !== null) {
      expect(metrics?.dateMarginLeft ?? 0).toBeGreaterThanOrEqual(15)
      expect(metrics?.dateMarginLeft ?? 999).toBeLessThanOrEqual(17)
    }

    await assertNoDocumentScrollLeak(page)
  })

  test('keeps chats list edge-to-edge on mobile while action row stays aligned', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginWithNewAccount(page)

    await page.goto('/chats')
    await expect(page).toHaveURL(/\/chats$/)
    await expect(page.locator('.chats-view__messages--chat')).toBeVisible()

    const metrics = await page.evaluate(() => {
      const row = document.querySelector('.chats-view__chats-actions') as HTMLElement | null
      const preview = document.querySelector(
        '.chats-view__messages--chat .chat-brief'
      ) as HTMLElement | null
      const spinner = document.querySelector(
        '.chats-view__connection-spinner'
      ) as HTMLElement | null
      const avatar = document.querySelector(
        '.chats-view__messages--chat .chat-brief__chat-avatar, .chats-view__messages--chat .chat-brief__icon'
      ) as HTMLElement | null
      const title = preview?.querySelector('.chat-brief__title') as HTMLElement | null
      const subtitle = preview?.querySelector('.chat-brief__subtitle') as HTMLElement | null
      const heading = preview?.querySelector('.chat-brief__heading') as HTMLElement | null

      if (!row || !preview || !avatar || !title || !subtitle || !heading) {
        return null
      }

      let spinnerToAvatarAxisDeltaX = null as number | null
      let spinnerSize = null as number | null

      if (spinner && avatar) {
        const previousDisplay = spinner.style.display
        const previousVisibility = spinner.style.visibility
        spinner.style.display = 'inline-flex'
        spinner.style.visibility = 'hidden'

        const spinnerRect = spinner.getBoundingClientRect()
        const avatarRect = avatar.getBoundingClientRect()
        spinnerSize = spinnerRect.width
        spinnerToAvatarAxisDeltaX = Math.abs(
          spinnerRect.left + spinnerRect.width / 2 - (avatarRect.left + avatarRect.width / 2)
        )

        spinner.style.display = previousDisplay
        spinner.style.visibility = previousVisibility
      }

      const rowRect = row.getBoundingClientRect()
      const previewRect = preview.getBoundingClientRect()
      const rowStyle = getComputedStyle(row)
      const previewStyle = getComputedStyle(preview)
      const avatarRect = avatar.getBoundingClientRect()
      const titleRect = title.getBoundingClientRect()
      const subtitleRect = subtitle.getBoundingClientRect()
      const headingRect = heading.getBoundingClientRect()

      return {
        rowLeft: rowRect.left,
        rowRightGap: window.innerWidth - rowRect.right,
        rowPaddingLeft: Number.parseFloat(rowStyle.paddingLeft),
        rowPaddingRight: Number.parseFloat(rowStyle.paddingRight),
        previewLeft: previewRect.left,
        previewRightGap: window.innerWidth - previewRect.right,
        previewPaddingLeft: Number.parseFloat(previewStyle.paddingLeft),
        previewPaddingRight: Number.parseFloat(previewStyle.paddingRight),
        avatarLeft: avatarRect.left,
        avatarWidth: avatarRect.width,
        titleLeft: titleRect.left,
        subtitleLeft: subtitleRect.left,
        headingGap: subtitleRect.top - headingRect.bottom,
        spinnerSize,
        spinnerToAvatarAxisDeltaX
      }
    })

    expect(metrics).not.toBeNull()
    expect(Math.abs(metrics?.rowLeft ?? 99)).toBeLessThanOrEqual(1)
    expect(Math.abs(metrics?.rowRightGap ?? 99)).toBeLessThanOrEqual(1)
    expect(Math.abs(metrics?.previewLeft ?? 99)).toBeLessThanOrEqual(1)
    expect(Math.abs(metrics?.previewRightGap ?? 99)).toBeLessThanOrEqual(1)
    expect(metrics?.rowPaddingLeft ?? 0).toBeGreaterThanOrEqual(19)
    expect(metrics?.rowPaddingLeft ?? 99).toBeLessThanOrEqual(21)
    expect(metrics?.rowPaddingRight ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.rowPaddingRight ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.previewPaddingLeft ?? 0).toBeGreaterThanOrEqual(19)
    expect(metrics?.previewPaddingLeft ?? 99).toBeLessThanOrEqual(21)
    expect(metrics?.previewPaddingRight ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.previewPaddingRight ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.avatarLeft ?? 0).toBeGreaterThanOrEqual(19)
    expect(metrics?.avatarLeft ?? 99).toBeLessThanOrEqual(21)
    expect(metrics?.avatarWidth ?? 0).toBeGreaterThanOrEqual(51)
    expect(metrics?.avatarWidth ?? 999).toBeLessThanOrEqual(53)
    expect(metrics?.titleLeft ?? 0).toBeGreaterThanOrEqual(87)
    expect(metrics?.titleLeft ?? 999).toBeLessThanOrEqual(89)
    expect(metrics?.subtitleLeft ?? 0).toBeGreaterThanOrEqual(87)
    expect(metrics?.subtitleLeft ?? 999).toBeLessThanOrEqual(89)
    expect(metrics?.headingGap ?? 0).toBeGreaterThanOrEqual(1)
    expect(metrics?.headingGap ?? 99).toBeLessThanOrEqual(3)

    if (metrics?.spinnerSize !== null) {
      expect(metrics?.spinnerSize ?? 0).toBeGreaterThanOrEqual(31)
      expect(metrics?.spinnerSize ?? 999).toBeLessThanOrEqual(33)
    }

    if (metrics?.spinnerToAvatarAxisDeltaX !== null) {
      expect(metrics?.spinnerToAvatarAxisDeltaX ?? 999).toBeLessThanOrEqual(2)
    }

    await assertNoDocumentScrollLeak(page)
  })

  test('keeps chat start dialog secondary spacing stable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginWithNewAccount(page)

    await page.goto('/chats')
    await expect(page).toHaveURL(/\/chats$/)

    const newChatButton = page.locator('.chats-view__item')
    await expect(newChatButton).toBeVisible()
    await newChatButton.click()

    const dialog = page.locator('.chat-start-dialog')
    await expect(dialog).toBeVisible()
    await expect(page.locator('.chat-start-dialog__body')).toBeVisible()

    const metrics = await page.evaluate(() => {
      const title = document.querySelector('.chat-start-dialog__card-title') as HTMLElement | null
      const body = document.querySelector('.chat-start-dialog__body') as HTMLElement | null
      const field = body?.querySelector('.v-field') as HTMLElement | null
      const menuActivator = body?.querySelector(
        '.chat-start-dialog__menu-activator'
      ) as HTMLElement | null
      const startButton = document.querySelector(
        '.chat-start-dialog__btn-start-chat'
      ) as HTMLElement | null
      const qrLink = document.querySelector(
        '.chat-start-dialog__btn-show-qrcode'
      ) as HTMLElement | null
      const overlayContent = document.querySelector(
        '.chat-start-dialog .v-overlay__content'
      ) as HTMLElement | null

      if (
        !title ||
        !body ||
        !field ||
        !menuActivator ||
        !startButton ||
        !qrLink ||
        !overlayContent
      ) {
        return null
      }

      const titleStyle = getComputedStyle(title)
      const bodyStyle = getComputedStyle(body)
      const startButtonStyle = getComputedStyle(startButton)
      const qrLinkStyle = getComputedStyle(qrLink)
      const bodyRect = body.getBoundingClientRect()
      const fieldRect = field.getBoundingClientRect()

      return {
        dialogInlineWidth: overlayContent.style.width,
        dialogWidth: overlayContent.getBoundingClientRect().width,
        titlePaddingInlineStart: Number.parseFloat(titleStyle.paddingInlineStart),
        titlePaddingInlineEnd: Number.parseFloat(titleStyle.paddingInlineEnd),
        bodyPaddingInlineStart: Number.parseFloat(bodyStyle.paddingInlineStart),
        bodyPaddingInlineEnd: Number.parseFloat(bodyStyle.paddingInlineEnd),
        fieldLeftGap: fieldRect.left - bodyRect.left,
        fieldRightGap: bodyRect.right - fieldRect.right,
        startButtonMarginTop: Number.parseFloat(startButtonStyle.marginTop),
        qrLinkMarginTop: Number.parseFloat(qrLinkStyle.marginTop),
        qrLinkMarginBottom: Number.parseFloat(qrLinkStyle.marginBottom)
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.dialogInlineWidth).toBe('var(--a-secondary-dialog-width)')
    expect(metrics?.dialogWidth ?? 0).toBeGreaterThanOrEqual(330)
    expect(metrics?.dialogWidth ?? 999).toBeLessThanOrEqual(500)
    expect(metrics?.titlePaddingInlineStart ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.titlePaddingInlineStart ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.titlePaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.titlePaddingInlineEnd ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.bodyPaddingInlineStart ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.bodyPaddingInlineStart ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.bodyPaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.bodyPaddingInlineEnd ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.fieldLeftGap ?? 0).toBeGreaterThanOrEqual(21)
    expect(metrics?.fieldLeftGap ?? 99).toBeLessThanOrEqual(24)
    expect(metrics?.fieldRightGap ?? 0).toBeGreaterThanOrEqual(21)
    expect(metrics?.fieldRightGap ?? 99).toBeLessThanOrEqual(24)
    expect(metrics?.startButtonMarginTop ?? 0).toBeGreaterThanOrEqual(14)
    expect(metrics?.startButtonMarginTop ?? 99).toBeLessThanOrEqual(16)
    expect(metrics?.qrLinkMarginTop ?? 0).toBeGreaterThanOrEqual(14)
    expect(metrics?.qrLinkMarginTop ?? 99).toBeLessThanOrEqual(16)
    expect(metrics?.qrLinkMarginBottom ?? 0).toBeGreaterThanOrEqual(14)
    expect(metrics?.qrLinkMarginBottom ?? 99).toBeLessThanOrEqual(16)

    await page.locator('.chat-start-dialog__menu-activator').click()
    await expect(page.locator('.chat-start-dialog__menu-list')).toBeVisible()

    const menuMetrics = await page.evaluate(() => {
      const list = document.querySelector('.chat-start-dialog__menu-list') as HTMLElement | null
      const item = document.querySelector('.chat-start-dialog__menu-item') as HTMLElement | null
      const title = document.querySelector(
        '.chat-start-dialog__menu-item-title'
      ) as HTMLElement | null

      if (!list || !item || !title) {
        return null
      }

      const listStyle = getComputedStyle(list)
      const itemStyle = getComputedStyle(item)
      const titleStyle = getComputedStyle(title)

      return {
        listPaddingTop: Number.parseFloat(listStyle.paddingTop),
        listPaddingBottom: Number.parseFloat(listStyle.paddingBottom),
        itemPaddingInlineStart: Number.parseFloat(itemStyle.paddingInlineStart),
        itemPaddingInlineEnd: Number.parseFloat(itemStyle.paddingInlineEnd),
        itemMinHeight: Number.parseFloat(itemStyle.minHeight),
        itemPaddingTop: Number.parseFloat(itemStyle.paddingTop),
        itemPaddingBottom: Number.parseFloat(itemStyle.paddingBottom),
        titleFontSize: Number.parseFloat(titleStyle.fontSize),
        titleLineHeight: Number.parseFloat(titleStyle.lineHeight),
        titleFontWeight: Number.parseFloat(titleStyle.fontWeight)
      }
    })

    expect(menuMetrics).not.toBeNull()
    expect(menuMetrics?.listPaddingTop ?? 0).toBeGreaterThanOrEqual(7)
    expect(menuMetrics?.listPaddingTop ?? 99).toBeLessThanOrEqual(9)
    expect(menuMetrics?.listPaddingBottom ?? 0).toBeGreaterThanOrEqual(7)
    expect(menuMetrics?.listPaddingBottom ?? 99).toBeLessThanOrEqual(9)
    expect(menuMetrics?.itemPaddingInlineStart ?? 0).toBeGreaterThanOrEqual(23)
    expect(menuMetrics?.itemPaddingInlineStart ?? 99).toBeLessThanOrEqual(25)
    expect(menuMetrics?.itemPaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(23)
    expect(menuMetrics?.itemPaddingInlineEnd ?? 99).toBeLessThanOrEqual(25)
    expect(menuMetrics?.itemMinHeight ?? 0).toBeGreaterThanOrEqual(43)
    expect(menuMetrics?.itemMinHeight ?? 99).toBeLessThanOrEqual(45)
    expect(menuMetrics?.itemPaddingTop ?? 0).toBeGreaterThanOrEqual(0)
    expect(menuMetrics?.itemPaddingTop ?? 99).toBeLessThanOrEqual(1)
    expect(menuMetrics?.itemPaddingBottom ?? 0).toBeGreaterThanOrEqual(0)
    expect(menuMetrics?.itemPaddingBottom ?? 99).toBeLessThanOrEqual(1)
    expect(menuMetrics?.titleFontSize ?? 0).toBeGreaterThanOrEqual(15)
    expect(menuMetrics?.titleFontSize ?? 99).toBeLessThanOrEqual(17)
    expect(menuMetrics?.titleLineHeight ?? 0).toBeGreaterThanOrEqual(23)
    expect(menuMetrics?.titleLineHeight ?? 99).toBeLessThanOrEqual(25)
    expect(menuMetrics?.titleFontWeight ?? 0).toBeGreaterThanOrEqual(299)
    expect(menuMetrics?.titleFontWeight ?? 999).toBeLessThanOrEqual(301)

    await assertNoDocumentScrollLeak(page)
  })

  test('keeps opened chat message bubble spacing and paddings stable', async ({ page }) => {
    await loginWithNewAccount(page)

    const chatItems = page.locator('.chats-view__messages--chat .v-list-item')
    await expect(chatItems.first()).toBeVisible()
    await chatItems.first().click()

    await page.waitForURL(/\/chats\/[^/?#]+$/, { timeout: 90_000 })

    const firstMessageBubble = page.locator('.a-chat__message-container .a-chat__message').first()
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
        groupedGapVar: rootStyle.getPropertyValue('--a-chat-message-container-grouped-gap').trim(),
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

    await assertNoDocumentScrollLeak(page)
  })
})
