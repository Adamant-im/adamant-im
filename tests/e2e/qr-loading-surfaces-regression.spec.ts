import { expect, test } from '@playwright/test'

import { loginWithNewAccount } from './helpers/auth'

test.describe('QR and loading surfaces regressions', () => {
  test('keeps chats bootstrap spinner sizing stable', async ({ page }) => {
    await loginWithNewAccount(page)

    await page.goto('/chats')
    await expect(page).toHaveURL(/\/chats$/)

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

    const spinner = page.locator('.chat-spinner__spinner')
    const overlay = page.locator('.chat-spinner__overlay')
    await expect(spinner).toBeVisible()
    await expect(overlay).toBeVisible()

    const metrics = await page.evaluate(() => {
      const spinner = document.querySelector('.chat-spinner__spinner') as HTMLElement | null
      const overlay = document.querySelector('.chat-spinner__overlay') as HTMLElement | null

      if (!spinner || !overlay) {
        return null
      }

      const overlayStyle = getComputedStyle(overlay)
      const spinnerRect = spinner.getBoundingClientRect()
      const overlayRect = overlay.getBoundingClientRect()

      return {
        spinnerWidth: spinnerRect.width,
        spinnerHeight: spinnerRect.height,
        overlayPosition: overlayStyle.position,
        overlayWidth: overlayRect.width,
        overlayHeight: overlayRect.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.spinnerWidth ?? 0).toBeGreaterThanOrEqual(149)
    expect(metrics?.spinnerWidth ?? 999).toBeLessThanOrEqual(151)
    expect(metrics?.spinnerHeight ?? 0).toBeGreaterThanOrEqual(149)
    expect(metrics?.spinnerHeight ?? 999).toBeLessThanOrEqual(151)
    expect(metrics?.overlayPosition).toBe('fixed')
    expect(
      Math.abs((metrics?.overlayWidth ?? 0) - (metrics?.viewportWidth ?? 0))
    ).toBeLessThanOrEqual(1)
    expect(
      Math.abs((metrics?.overlayHeight ?? 0) - (metrics?.viewportHeight ?? 0))
    ).toBeLessThanOrEqual(1)

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

  test('keeps qrcode scanner dialog sizing stable from send funds address menu', async ({
    page
  }) => {
    await loginWithNewAccount(page)

    await page.goto('/transfer')
    await expect(page).toHaveURL(/\/transfer(?:\/)?$/)
    await expect(page.locator('.send-funds-form')).toBeVisible()

    await page.locator('.send-funds-form__menu-activator').first().click()
    const visibleMenu = page
      .locator('.send-funds-form__menu-list')
      .filter({ has: page.locator('.send-funds-form__menu-item') })
      .first()

    await expect(visibleMenu).toBeVisible()
    await visibleMenu.locator('.send-funds-form__menu-item').first().click()

    const dialog = page.locator('.qrcode-scanner-dialog .v-overlay__content')
    await expect(dialog).toBeVisible()

    await expect
      .poll(async () => {
        return page.evaluate(() => {
          return {
            hasStatus: !!document.querySelector('.qrcode-scanner-dialog__status'),
            hasState: !!document.querySelector('.qrcode-scanner-dialog__state'),
            hasCamera: !!document.querySelector('.qrcode-scanner-dialog__camera')
          }
        })
      })
      .toEqual(expect.objectContaining({ hasStatus: expect.any(Boolean) }))

    const metrics = await page.evaluate(() => {
      const content = document.querySelector(
        '.qrcode-scanner-dialog .v-overlay__content'
      ) as HTMLElement | null
      const status = document.querySelector('.qrcode-scanner-dialog__status') as HTMLElement | null
      const waitingSpinner = document.querySelector(
        '.qrcode-scanner-dialog__waiting-spinner'
      ) as HTMLElement | null
      const state = document.querySelector('.qrcode-scanner-dialog__state') as HTMLElement | null
      const camera = document.querySelector('.qrcode-scanner-dialog__camera') as HTMLElement | null
      const cameraSelectButton = document.querySelector(
        '.qrcode-scanner-dialog__camera-select .v-btn'
      ) as HTMLElement | null

      if (!content) {
        return null
      }

      const statusStyle = status ? getComputedStyle(status) : null
      const waitingSpinnerRect = waitingSpinner?.getBoundingClientRect() ?? null
      const waitingSpinnerStyle = waitingSpinner ? getComputedStyle(waitingSpinner) : null
      const stateStyle = state ? getComputedStyle(state) : null
      const cameraStyle = camera ? getComputedStyle(camera) : null
      const cameraSelectButtonStyle = cameraSelectButton
        ? getComputedStyle(cameraSelectButton)
        : null

      return {
        dialogInlineWidth: content.style.width,
        hasStatus: !!status,
        hasState: !!state,
        hasCamera: !!camera,
        statusPaddingInlineStart: statusStyle
          ? Number.parseFloat(statusStyle.paddingInlineStart)
          : null,
        waitingSpinnerSize: waitingSpinnerRect ? waitingSpinnerRect.width : null,
        waitingSpinnerMarginInlineStart: waitingSpinnerStyle
          ? Number.parseFloat(waitingSpinnerStyle.marginInlineStart)
          : null,
        statePaddingTop: stateStyle ? Number.parseFloat(stateStyle.paddingTop) : null,
        statePaddingInlineStart: stateStyle
          ? Number.parseFloat(stateStyle.paddingInlineStart)
          : null,
        cameraHeight: cameraStyle ? Number.parseFloat(cameraStyle.height) : null,
        cameraSelectPaddingInlineStart: cameraSelectButtonStyle
          ? Number.parseFloat(cameraSelectButtonStyle.paddingInlineStart)
          : null,
        cameraSelectPaddingInlineEnd: cameraSelectButtonStyle
          ? Number.parseFloat(cameraSelectButtonStyle.paddingInlineEnd)
          : null
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.dialogInlineWidth).toBe('var(--a-secondary-dialog-width)')
    expect(metrics?.hasStatus || metrics?.hasState || metrics?.hasCamera).toBe(true)

    if (metrics?.hasStatus) {
      expect(metrics?.statusPaddingInlineStart ?? 0).toBeGreaterThanOrEqual(23)
      expect(metrics?.statusPaddingInlineStart ?? 99).toBeLessThanOrEqual(25)
    }

    if (metrics?.waitingSpinnerSize !== null) {
      expect(metrics?.waitingSpinnerSize ?? 0).toBeGreaterThanOrEqual(30)
      expect(metrics?.waitingSpinnerSize ?? 99).toBeLessThanOrEqual(33)
    }

    if (metrics?.waitingSpinnerMarginInlineStart !== null) {
      expect(metrics?.waitingSpinnerMarginInlineStart ?? 0).toBeGreaterThanOrEqual(15)
      expect(metrics?.waitingSpinnerMarginInlineStart ?? 99).toBeLessThanOrEqual(17)
    }

    if (metrics?.hasState) {
      expect(metrics?.statePaddingTop ?? 0).toBeGreaterThanOrEqual(31)
      expect(metrics?.statePaddingTop ?? 99).toBeLessThanOrEqual(33)
      expect(metrics?.statePaddingInlineStart ?? 0).toBeGreaterThanOrEqual(23)
      expect(metrics?.statePaddingInlineStart ?? 99).toBeLessThanOrEqual(25)
    }

    if (metrics?.hasCamera) {
      expect(metrics?.cameraHeight ?? 0).toBeGreaterThanOrEqual(299)
      expect(metrics?.cameraHeight ?? 999).toBeLessThanOrEqual(301)
    }

    if (metrics?.cameraSelectPaddingInlineStart !== null) {
      expect(metrics?.cameraSelectPaddingInlineStart ?? 0).toBeGreaterThanOrEqual(7)
      expect(metrics?.cameraSelectPaddingInlineStart ?? 99).toBeLessThanOrEqual(9)
      expect(metrics?.cameraSelectPaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(7)
      expect(metrics?.cameraSelectPaddingInlineEnd ?? 99).toBeLessThanOrEqual(9)
    }
  })
})
