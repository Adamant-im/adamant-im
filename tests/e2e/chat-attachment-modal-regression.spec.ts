import { testPassphrase } from './helpers/env'
import { expect, test, type Locator } from '@playwright/test'
import { dismissAddressWarningIfVisible, loginWithPassphrase } from './helpers/auth'

const activeImageSlideSelector =
  '.v-window-item--active.a-chat-image-modal-item, .v-window-item--active .a-chat-image-modal-item'

type PreviewTarget = 'latest' | 'previous'

type PreviewCase = {
  chatPath: string
  target: PreviewTarget
}

test.describe('Chat attachment modal regressions', () => {
  test('closes image modal even on near-edge backdrop clicks for different image aspect ratios', async ({
    page
  }) => {
    test.setTimeout(240_000)
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await loginWithPassphrase(page, testPassphrase!)

    const modal = page.locator('.a-chat-image-modal__container')
    const modalContent = page.locator('.a-chat-image-modal__content')

    const findPreviewCases = async () => {
      await page.goto('/chats')
      await expect(page).toHaveURL(/\/chats$/)
      await dismissAddressWarningIfVisible(page, 12_000)

      const chatItems = page.locator('.chats-view__messages--chat .v-list-item')
      await expect(chatItems.first()).toBeVisible({ timeout: 15_000 })

      const visibleCount = await chatItems.count()
      const maxChatsToInspect = Math.min(visibleCount, 16)
      const preferredIndexes: number[] = []
      const fallbackIndexes: number[] = []
      const cases: PreviewCase[] = []

      for (let index = 0; index < maxChatsToInspect; index += 1) {
        const text = (
          (await chatItems
            .nth(index)
            .textContent()
            .catch(() => '')) ?? ''
        ).trim()

        if (/Attached:/i.test(text)) {
          preferredIndexes.push(index)
        } else {
          fallbackIndexes.push(index)
        }
      }

      for (const index of [...preferredIndexes, ...fallbackIndexes]) {
        await page.goto('/chats')
        await expect(page).toHaveURL(/\/chats$/)
        await dismissAddressWarningIfVisible(page, 3_000)
        await expect(chatItems.first()).toBeVisible({ timeout: 15_000 })

        await chatItems.nth(index).click()
        await page.waitForURL(/\/chats\/[^/?#]+$/, { timeout: 90_000 })
        await dismissAddressWarningIfVisible(page, 3_000)

        const chatPath = new URL(page.url()).pathname
        if (!chatPath.startsWith('/chats/')) {
          continue
        }

        const messagesContainer = page.locator('.a-chat__body-messages').first()
        await expect(messagesContainer).toBeVisible()
        await messagesContainer.evaluate((element) => {
          element.scrollTop = element.scrollHeight
        })
        await page.waitForTimeout(350)

        let previewCount = 0

        for (let attempt = 1; attempt <= 18; attempt += 1) {
          previewCount = await messagesContainer.locator('.a-chat__attachments .v-img').count()

          if (previewCount > 0) {
            break
          }

          await messagesContainer.evaluate((element) => {
            const step = Math.max(260, Math.floor(element.clientHeight * 0.9))
            element.scrollTop = Math.max(0, element.scrollTop - step)
          })
          await page.waitForTimeout(450)
        }

        if (previewCount > 0) {
          cases.push({ chatPath, target: 'latest' })

          if (previewCount > 1) {
            cases.push({ chatPath, target: 'previous' })
          }
        }

        if (cases.length >= 6) {
          return cases
        }
      }

      if (cases.length > 0) {
        return cases
      }

      throw new Error('Failed to find chats with image previews')
    }

    const previewCases = await findPreviewCases()

    const openTargetChat = async (chatPath: string) => {
      await page.goto(chatPath)
      await page.waitForURL(new RegExp(`${chatPath.replace('/', '\\/')}$`), {
        timeout: 90_000
      })
      await dismissAddressWarningIfVisible(page, 12_000)

      const messagesContainer = page.locator('.a-chat__body-messages').first()
      await expect(messagesContainer).toBeVisible()
      await messagesContainer.evaluate((element) => {
        element.scrollTop = element.scrollHeight
      })
      await page.waitForTimeout(300)

      return messagesContainer
    }

    const resolveTargetPreview = async (messagesContainer: Locator, target: PreviewTarget) => {
      const maxAttempts = 20

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const previews = await messagesContainer.locator('.a-chat__attachments .v-img').count()

        if (previews > 0) {
          const orderedIndexes = await messagesContainer.evaluate((container) => {
            return Array.from(container.querySelectorAll('.a-chat__attachments .v-img'))
              .map((preview, index) => ({
                index,
                top: preview.getBoundingClientRect().top
              }))
              .filter((item) => Number.isFinite(item.top))
              .sort((a, b) => b.top - a.top)
              .map((item) => item.index)
          })

          const targetIndex =
            target === 'previous' ? (orderedIndexes[1] ?? orderedIndexes[0]) : orderedIndexes[0]

          if (typeof targetIndex === 'number') {
            const locator = messagesContainer
              .locator('.a-chat__attachments .v-img')
              .nth(targetIndex)
            await expect(locator).toBeVisible({ timeout: 12_000 })
            return locator
          }
        }

        await messagesContainer.evaluate((element) => {
          const step = Math.max(260, Math.floor(element.clientHeight * 0.9))
          element.scrollTop = Math.max(0, element.scrollTop - step)
        })
        await page.waitForTimeout(500)
      }

      throw new Error(`Failed to resolve preview target: ${target}`)
    }

    const openPreviewModal = async (messagesContainer: Locator, target: PreviewTarget) => {
      const attempts = 4

      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        await dismissAddressWarningIfVisible(page, 8_000)
        const previewTrigger = await resolveTargetPreview(messagesContainer, target)
        await previewTrigger.click({ force: true, timeout: 6_000 })
        await dismissAddressWarningIfVisible(page, 2_000)

        try {
          await expect(modal).toBeVisible({ timeout: 8_000 })
          return
        } catch (error) {
          if (attempt === attempts) throw error

          await page.keyboard.press('Escape').catch(() => undefined)
          await page.waitForTimeout(350)
        }
      }
    }

    const parseAlpha = (color: string) => {
      if (color === 'transparent') return 0

      const rgbaMatch = color.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([0-9.]+)\)/)
      if (rgbaMatch) {
        return Number.parseFloat(rgbaMatch[1])
      }

      return 1
    }

    const getActiveImageRect = async () =>
      page.evaluate((selector) => {
        const activeSlide = document.querySelector(selector)
        if (!(activeSlide instanceof HTMLElement)) return null

        const imageContainer = activeSlide.querySelector('.v-img')
        const containerRect =
          imageContainer instanceof HTMLElement
            ? imageContainer.getBoundingClientRect()
            : activeSlide.getBoundingClientRect()

        const fitContainRect = (sourceWidth: number, sourceHeight: number) => {
          const containerWidth = containerRect.width
          const containerHeight = containerRect.height
          if (containerWidth <= 0 || containerHeight <= 0) return null
          if (sourceWidth <= 0 || sourceHeight <= 0) return null

          const sourceAspect = sourceWidth / sourceHeight
          const containerAspect = containerWidth / containerHeight
          let renderedWidth = containerWidth
          let renderedHeight = containerHeight

          if (sourceAspect > containerAspect) {
            renderedHeight = containerWidth / sourceAspect
          } else {
            renderedWidth = containerHeight * sourceAspect
          }

          const offsetX = (containerWidth - renderedWidth) / 2
          const offsetY = (containerHeight - renderedHeight) / 2

          return {
            left: containerRect.left + offsetX,
            right: containerRect.left + offsetX + renderedWidth,
            top: containerRect.top + offsetY,
            bottom: containerRect.top + offsetY + renderedHeight
          }
        }

        const pictureImage = activeSlide.querySelector('.v-img__picture img')
        if (
          pictureImage instanceof HTMLImageElement &&
          pictureImage.naturalWidth > 0 &&
          pictureImage.naturalHeight > 0
        ) {
          const containRect = fitContainRect(pictureImage.naturalWidth, pictureImage.naturalHeight)
          if (containRect) return containRect
        }

        const imageSurface = activeSlide.querySelector('.v-img__img')
        if (imageSurface instanceof HTMLElement) {
          const imageSurfaceRect = imageSurface.getBoundingClientRect()
          if (imageSurfaceRect.width > 0 && imageSurfaceRect.height > 0) {
            return {
              left: imageSurfaceRect.left,
              right: imageSurfaceRect.right,
              top: imageSurfaceRect.top,
              bottom: imageSurfaceRect.bottom
            }
          }
        }

        if (containerRect.width <= 0 || containerRect.height <= 0) return null

        return {
          left: containerRect.left,
          right: containerRect.right,
          top: containerRect.top,
          bottom: containerRect.bottom
        }
      }, activeImageSlideSelector)

    const getRightGutterPoint = (
      imageRect: { left: number; right: number; top: number; bottom: number },
      contentRect: { x: number; y: number; width: number; height: number }
    ) => {
      const modalRight = contentRect.x + contentRect.width
      const imageCenterY = Math.round((imageRect.top + imageRect.bottom) / 2)
      const rightGutter = modalRight - imageRect.right

      if (rightGutter < 16) {
        return null
      }

      return {
        x: Math.round(imageRect.right + Math.max(10, rightGutter / 2)),
        y: imageCenterY
      }
    }

    let surfaceChecked = false

    const assertBackdropClickClosesModal = async (previewCase: PreviewCase) => {
      const messagesContainer = await openTargetChat(previewCase.chatPath)
      await openPreviewModal(messagesContainer, previewCase.target)

      if (!surfaceChecked) {
        const surfaces = await page.evaluate(() => {
          const modalEl = document.querySelector(
            '.a-chat-image-modal__container'
          ) as HTMLElement | null
          const scrimEl = document.querySelector('.v-overlay__scrim') as HTMLElement | null

          return {
            modalBackground: modalEl ? getComputedStyle(modalEl).backgroundColor : null,
            scrimBackground: scrimEl ? getComputedStyle(scrimEl).backgroundColor : null,
            scrimBackdropFilter: scrimEl ? getComputedStyle(scrimEl).backdropFilter : null
          }
        })

        expect(surfaces.modalBackground).not.toBeNull()
        expect(parseAlpha(surfaces.modalBackground ?? '')).toBeLessThan(0.05)

        if (surfaces.scrimBackground) {
          const scrimAlpha = parseAlpha(surfaces.scrimBackground)
          expect(scrimAlpha).toBeGreaterThan(0.2)
          expect(scrimAlpha).toBeLessThan(0.9)
        }

        expect(surfaces.scrimBackdropFilter).toContain('blur(')
        surfaceChecked = true
      }

      const activeImageRect = await getActiveImageRect()
      expect(activeImageRect).not.toBeNull()
      if (!activeImageRect) return

      const imageCenter = {
        x: Math.round((activeImageRect.left + activeImageRect.right) / 2),
        y: Math.round((activeImageRect.top + activeImageRect.bottom) / 2)
      }

      await page.mouse.click(imageCenter.x, imageCenter.y)
      await expect(modal).toBeVisible()

      const contentBox = await modalContent.boundingBox()
      expect(contentBox).not.toBeNull()
      if (!contentBox) return

      const gutterPoint = getRightGutterPoint(activeImageRect, contentBox)
      if (!gutterPoint) {
        await page.keyboard.press('Escape').catch(() => undefined)
        await expect(modal).toBeHidden()
        return false
      }

      await modalContent.click({
        force: true,
        position: {
          x: Math.max(8, Math.min(contentBox.width - 8, gutterPoint.x - contentBox.x)),
          y: Math.max(8, Math.min(contentBox.height - 8, gutterPoint.y - contentBox.y))
        }
      })
      await expect(modal).toBeHidden()
      return true
    }

    let successfulCases = 0

    for (const previewCase of previewCases) {
      if (await assertBackdropClickClosesModal(previewCase)) {
        successfulCases += 1
      }

      if (successfulCases >= 2) {
        break
      }
    }

    expect(successfulCases).toBeGreaterThanOrEqual(2)
  })
})
