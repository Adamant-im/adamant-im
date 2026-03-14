import { expect, test } from '@playwright/test'
import { loginWithNewAccount } from './helpers/auth'

test.describe('Feedback surfaces regressions', () => {
  test('keeps snackbar sizing and action layout stable', async ({ page }) => {
    await loginWithNewAccount(page)

    await page.evaluate(() => {
      const store = (
        window as typeof window & {
          store?: {
            dispatch: (type: string, payload?: unknown) => unknown
          }
        }
      ).store

      if (!store) {
        throw new Error('window.store is not available')
      }

      store.dispatch('snackbar/show', {
        message:
          'Tokenized feedback surfaces should keep a stable snackbar width and action spacing.',
        timeout: -1
      })
    })

    const snackbar = page.locator('.app-snackbar .v-snackbar__wrapper')
    const closeButton = page.locator('.app-snackbar .v-btn').last()
    await expect(snackbar).toBeVisible()
    await expect(closeButton).toBeVisible()

    const metrics = await page.evaluate(() => {
      const wrapper = document.querySelector('.app-snackbar .v-snackbar__wrapper')
      const content = document.querySelector('.app-snackbar .v-snackbar__content')
      const container = document.querySelector('.app-snackbar__container')
      const button = document.querySelector('.app-snackbar .v-btn')

      if (
        !(wrapper instanceof HTMLElement) ||
        !(content instanceof HTMLElement) ||
        !(container instanceof HTMLElement) ||
        !(button instanceof HTMLElement)
      ) {
        return null
      }

      const wrapperStyle = getComputedStyle(wrapper)
      const contentStyle = getComputedStyle(content)
      const containerStyle = getComputedStyle(container)
      const buttonRect = button.getBoundingClientRect()

      return {
        maxWidth: Number.parseFloat(wrapperStyle.maxWidth),
        fontSize: Number.parseFloat(contentStyle.fontSize),
        lineHeight: Number.parseFloat(contentStyle.lineHeight),
        gap: Number.parseFloat(containerStyle.gap),
        buttonWidth: buttonRect.width,
        buttonHeight: buttonRect.height
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.maxWidth ?? 0).toBeGreaterThanOrEqual(299)
    expect(metrics?.maxWidth ?? 999).toBeLessThanOrEqual(301)
    expect(metrics?.fontSize ?? 0).toBeGreaterThanOrEqual(15)
    expect(metrics?.fontSize ?? 999).toBeLessThanOrEqual(17)
    expect(metrics?.lineHeight ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.lineHeight ?? 999).toBeLessThanOrEqual(25)
    expect(metrics?.gap ?? 0).toBeGreaterThanOrEqual(7)
    expect(metrics?.gap ?? 999).toBeLessThanOrEqual(9)
    expect(metrics?.buttonWidth ?? 0).toBeGreaterThanOrEqual(28)
    expect(metrics?.buttonWidth ?? 999).toBeLessThanOrEqual(30.5)
    expect(metrics?.buttonHeight ?? 0).toBeGreaterThanOrEqual(28)
    expect(metrics?.buttonHeight ?? 999).toBeLessThanOrEqual(30.5)
  })

  test('keeps mobile chat loading overlay centered', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginWithNewAccount(page)

    const chatItems = page.locator('.chats-view__messages--chat .v-list-item')
    await expect(chatItems.first()).toBeVisible()
    await chatItems.first().click()
    await page.waitForURL(/\/chats\/[^/?#]+$/, { timeout: 90_000 })

    await page.evaluate(() => {
      const store = (
        window as typeof window & {
          store?: {
            commit: (type: string, payload?: unknown) => void
          }
        }
      ).store

      if (!store) {
        throw new Error('window.store is not available')
      }

      store.commit('chat/setFulfilled', false)
    })

    const overlay = page.locator('.progress-indicator')
    const spinner = page.locator('.progress-indicator__spinner')
    await expect(overlay).toBeVisible()
    await expect(spinner).toBeVisible()

    const metrics = await page.evaluate(() => {
      const overlay = document.querySelector('.progress-indicator')
      const spinner = document.querySelector('.progress-indicator__spinner')

      if (!(overlay instanceof HTMLElement) || !(spinner instanceof HTMLElement)) {
        return null
      }

      const overlayRect = overlay.getBoundingClientRect()
      const spinnerRect = spinner.getBoundingClientRect()
      const overlayStyle = getComputedStyle(overlay)

      return {
        centerDeltaX: Math.abs(
          overlayRect.left + overlayRect.width / 2 - (spinnerRect.left + spinnerRect.width / 2)
        ),
        centerDeltaY: Math.abs(
          overlayRect.top + overlayRect.height / 2 - (spinnerRect.top + spinnerRect.height / 2)
        ),
        zIndex: Number.parseFloat(overlayStyle.zIndex),
        backgroundColor: overlayStyle.backgroundColor
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.centerDeltaX ?? 999).toBeLessThanOrEqual(2)
    expect(metrics?.centerDeltaY ?? 999).toBeLessThanOrEqual(2)
    expect(metrics?.zIndex ?? 0).toBe(10)
    expect(metrics?.backgroundColor).toMatch(/^rgba?\(/)

    await page.evaluate(() => {
      const store = (
        window as typeof window & {
          store?: {
            commit: (type: string, payload?: unknown) => void
          }
        }
      ).store

      store?.commit('chat/setFulfilled', true)
    })
  })
})
