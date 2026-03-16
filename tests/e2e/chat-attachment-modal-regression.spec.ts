import { config as loadEnv } from 'dotenv'
import { expect, test, type Locator } from '@playwright/test'
import { dismissAddressWarningIfVisible, loginWithPassphrase } from './helpers/auth'

loadEnv({ path: '.env.local', quiet: true })

const testPassphrase = process.env.ADM_TEST_ACCOUNT_PK?.trim()
const testChatId = 'U6386412615727665758'
const activeImageSlideSelector =
  '.v-window-item--active.a-chat-image-modal-item, .v-window-item--active .a-chat-image-modal-item'
type PreviewTarget = 'incoming-latest' | 'outgoing-before-incoming'

test.describe('Chat attachment modal regressions', () => {
  test('closes image modal even on near-edge backdrop clicks for different image aspect ratios', async ({
    page
  }) => {
    test.setTimeout(180_000)
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await loginWithPassphrase(page, testPassphrase!)

    const modal = page.locator('.a-chat-image-modal__container')
    const openTargetChat = async () => {
      await page.goto(`/chats/${testChatId}`)
      await page.waitForURL(new RegExp(`/chats/${testChatId}$`), { timeout: 90_000 })
      await dismissAddressWarningIfVisible(page, 12_000)

      const messagesContainer = page.locator('.a-chat__body-messages').first()
      await expect(messagesContainer).toBeVisible()
      await messagesContainer.evaluate((element) => {
        element.scrollTop = element.scrollHeight
      })
      await page.waitForTimeout(300)

      return messagesContainer
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

    let surfaceChecked = false

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

    const resolveTargetPreview = async (messagesContainer: Locator, target: PreviewTarget) => {
      const maxAttempts = 8

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        if ((await messagesContainer.count()) === 0) {
          await openTargetChat()
          continue
        }

        let targetIndex: number | null = null

        try {
          targetIndex = await messagesContainer.evaluate(
            (container, targetName: PreviewTarget) => {
              const previews = Array.from(container.querySelectorAll('.a-chat__attachments .v-img'))
                .map((preview, index) => {
                  const messageContainer = preview.closest('.a-chat__message-container')
                  const timestamp = messageContainer
                    ?.querySelector('.a-chat__timestamp')
                    ?.textContent?.trim()
                  const rect = preview.getBoundingClientRect()

                  return {
                    index,
                    top: rect.top,
                    outgoing:
                      messageContainer?.classList.contains('a-chat__message-container--right') ??
                      false,
                    timestamp
                  }
                })
                .filter((item) => Number.isFinite(item.top))
                .sort((a, b) => b.top - a.top)

              const latestIncoming = previews.find((item) => !item.outgoing)
              const outgoingByKnownTimestamp = previews.find(
                (item) => item.outgoing && item.timestamp?.includes('07:43')
              )
              const outgoingBeforeIncoming = latestIncoming
                ? previews.find((item) => item.outgoing && item.top < latestIncoming.top - 1)
                : undefined

              const chosen =
                targetName === 'incoming-latest'
                  ? latestIncoming
                  : (outgoingByKnownTimestamp ??
                    outgoingBeforeIncoming ??
                    previews.find((item) => item.outgoing))

              return typeof chosen?.index === 'number' ? chosen.index : null
            },
            target,
            { timeout: 8_000 }
          )
        } catch {
          await openTargetChat()
          continue
        }

        if (targetIndex !== null) {
          const locator = messagesContainer.locator('.a-chat__attachments .v-img').nth(targetIndex)
          await expect(locator).toBeVisible({ timeout: 8_000 })
          return locator
        }

        await messagesContainer.evaluate((element) => {
          const step = Math.max(180, Math.floor(element.clientHeight * 0.6))
          element.scrollTop = Math.max(0, element.scrollTop - step)
        })
        await page.waitForTimeout(220)
      }

      throw new Error(`Failed to resolve preview target: ${target}`)
    }

    const assertNearRightBackdropClosesModal = async (target: PreviewTarget) => {
      const messagesContainer = await openTargetChat()

      // Make sure the message feed is hydrated before selecting target image previews.
      await expect
        .poll(async () => await messagesContainer.locator('.a-chat__attachments .v-img').count(), {
          timeout: 15_000
        })
        .toBeGreaterThan(0)

      await openPreviewModal(messagesContainer, target)

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

      const centerPoint = {
        x: Math.round((activeImageRect.left + activeImageRect.right) / 2),
        y: Math.round((activeImageRect.top + activeImageRect.bottom) / 2)
      }

      await page.mouse.click(centerPoint.x, centerPoint.y)
      await expect(modal).toBeVisible()

      const viewport = page.viewportSize()
      expect(viewport).not.toBeNull()

      const messagesContainerBox = await messagesContainer.boundingBox()
      const paneLeft = messagesContainerBox ? Math.round(messagesContainerBox.x) : 0

      let nearRightX = Math.round(activeImageRect.right + 4)
      if (nearRightX > (viewport?.width ?? 1280) - 4) {
        nearRightX = Math.max(paneLeft + 4, Math.round(activeImageRect.left - 4))
      }
      const nearRightBackdropPoint = {
        x: nearRightX,
        y: centerPoint.y
      }

      await page.mouse.click(nearRightBackdropPoint.x, nearRightBackdropPoint.y)
      await expect(modal).toBeHidden()
    }

    // Latest incoming image with cats
    await assertNearRightBackdropClosesModal('incoming-latest')
    // Previous outgoing image around 07:43 with different aspect ratio
    await assertNearRightBackdropClosesModal('outgoing-before-incoming')
  })
})
