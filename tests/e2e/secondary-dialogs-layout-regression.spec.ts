import { config as loadEnv } from 'dotenv'
import { expect, test } from '@playwright/test'

import { loginWithNewAccount, loginWithPassphrase } from './helpers/auth'

loadEnv({ path: '.env.local', quiet: true })

const testPassphrase = process.env.ADM_TEST_ACCOUNT_PK?.trim()

test.describe('Secondary dialogs layout regressions', () => {
  test('keeps share address and trade dialogs on the shared compact width', async ({ page }) => {
    await loginWithNewAccount(page)

    await page.goto('/home')
    await expect(page).toHaveURL(/\/home$/)
    await expect(page.locator('.wallet-card')).toBeVisible()

    await page.locator('.wallet-card__list .wallet-card__tile').first().click()
    await expect(page.locator('.share-uri-dialog .v-overlay__content')).toBeVisible()

    const shareMetrics = await page.evaluate(() => {
      const title = document.querySelector('.share-uri-dialog__dialog-title') as HTMLElement | null
      const item = document.querySelector('.share-uri-dialog__list-item') as HTMLElement | null
      const content = document.querySelector(
        '.share-uri-dialog .v-overlay__content'
      ) as HTMLElement | null

      if (!title || !item || !content) {
        return null
      }

      const titleStyle = getComputedStyle(title)
      const itemStyle = getComputedStyle(item)

      return {
        inlineWidth: content.style.width,
        width: content.getBoundingClientRect().width,
        titlePaddingInlineStart: Number.parseFloat(titleStyle.paddingInlineStart),
        titlePaddingInlineEnd: Number.parseFloat(titleStyle.paddingInlineEnd),
        itemPaddingInlineStart: Number.parseFloat(itemStyle.paddingInlineStart),
        itemPaddingInlineEnd: Number.parseFloat(itemStyle.paddingInlineEnd),
        itemMinHeight: Number.parseFloat(itemStyle.minHeight)
      }
    })

    expect(shareMetrics).not.toBeNull()
    expect(shareMetrics?.inlineWidth).toBe('var(--a-secondary-dialog-width-compact)')
    expect(shareMetrics?.width ?? 0).toBeGreaterThanOrEqual(280)
    expect(shareMetrics?.width ?? 999).toBeLessThanOrEqual(320)
    expect(shareMetrics?.titlePaddingInlineStart ?? 0).toBeGreaterThanOrEqual(23)
    expect(shareMetrics?.titlePaddingInlineStart ?? 99).toBeLessThanOrEqual(25)
    expect(shareMetrics?.titlePaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(23)
    expect(shareMetrics?.titlePaddingInlineEnd ?? 99).toBeLessThanOrEqual(25)
    expect(shareMetrics?.itemPaddingInlineStart ?? 0).toBeGreaterThanOrEqual(23)
    expect(shareMetrics?.itemPaddingInlineStart ?? 99).toBeLessThanOrEqual(25)
    expect(shareMetrics?.itemPaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(23)
    expect(shareMetrics?.itemPaddingInlineEnd ?? 99).toBeLessThanOrEqual(25)
    expect(shareMetrics?.itemMinHeight ?? 0).toBeGreaterThanOrEqual(55)
    expect(shareMetrics?.itemMinHeight ?? 99).toBeLessThanOrEqual(57)

    await page.keyboard.press('Escape')
    await expect(page.locator('.share-uri-dialog .v-overlay__content')).toBeHidden()

    await page.locator('.wallet-actions .v-list-item').filter({ hasText: /trade/i }).first().click()
    await expect(page.locator('.buy-tokens-dialog .v-overlay__content')).toBeVisible()

    const buyMetrics = await page.evaluate(() => {
      const title = document.querySelector('.buy-tokens-dialog__dialog-title') as HTMLElement | null
      const item = document.querySelector('.buy-tokens-dialog__list-item') as HTMLElement | null
      const content = document.querySelector(
        '.buy-tokens-dialog .v-overlay__content'
      ) as HTMLElement | null

      if (!title || !item || !content) {
        return null
      }

      const titleStyle = getComputedStyle(title)
      const itemStyle = getComputedStyle(item)

      return {
        inlineWidth: content.style.width,
        width: content.getBoundingClientRect().width,
        titlePaddingInlineStart: Number.parseFloat(titleStyle.paddingInlineStart),
        titlePaddingInlineEnd: Number.parseFloat(titleStyle.paddingInlineEnd),
        itemPaddingInlineStart: Number.parseFloat(itemStyle.paddingInlineStart),
        itemPaddingInlineEnd: Number.parseFloat(itemStyle.paddingInlineEnd),
        itemMinHeight: Number.parseFloat(itemStyle.minHeight)
      }
    })

    expect(buyMetrics).not.toBeNull()
    expect(buyMetrics?.inlineWidth).toBe('var(--a-secondary-dialog-width-compact)')
    expect(buyMetrics?.width ?? 0).toBeGreaterThanOrEqual(280)
    expect(buyMetrics?.width ?? 999).toBeLessThanOrEqual(320)
    expect(buyMetrics?.titlePaddingInlineStart ?? 0).toBeGreaterThanOrEqual(23)
    expect(buyMetrics?.titlePaddingInlineStart ?? 99).toBeLessThanOrEqual(25)
    expect(buyMetrics?.titlePaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(23)
    expect(buyMetrics?.titlePaddingInlineEnd ?? 99).toBeLessThanOrEqual(25)
    expect(buyMetrics?.itemPaddingInlineStart ?? 0).toBeGreaterThanOrEqual(23)
    expect(buyMetrics?.itemPaddingInlineStart ?? 99).toBeLessThanOrEqual(25)
    expect(buyMetrics?.itemPaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(23)
    expect(buyMetrics?.itemPaddingInlineEnd ?? 99).toBeLessThanOrEqual(25)
    expect(buyMetrics?.itemMinHeight ?? 0).toBeGreaterThanOrEqual(55)
    expect(buyMetrics?.itemMinHeight ?? 99).toBeLessThanOrEqual(57)
  })

  test('keeps qr renderer dialog on the shared qrcode width', async ({ page }) => {
    await loginWithNewAccount(page)

    await page.goto('/chats')
    await expect(page).toHaveURL(/\/chats$/)

    await page.locator('.chats-view__item').click()
    await expect(page.locator('.chat-start-dialog .v-overlay__content')).toBeVisible()

    await page.locator('.chat-start-dialog__btn-show-qrcode a').click()
    await expect(page.locator('.qrcode-renderer-dialog .v-overlay__content')).toBeVisible()

    const qrMetrics = await page.evaluate(() => {
      const body = document.querySelector('.qrcode-renderer-dialog__body') as HTMLElement | null
      const button = document.querySelector('.qrcode-renderer-dialog__button') as HTMLElement | null
      const content = document.querySelector(
        '.qrcode-renderer-dialog .v-overlay__content'
      ) as HTMLElement | null

      if (!body || !button || !content) {
        return null
      }

      const bodyStyle = getComputedStyle(body)
      const buttonStyle = getComputedStyle(button)

      return {
        inlineWidth: content.style.width,
        width: content.getBoundingClientRect().width,
        bodyPaddingInlineStart: Number.parseFloat(bodyStyle.paddingInlineStart),
        bodyPaddingInlineEnd: Number.parseFloat(bodyStyle.paddingInlineEnd),
        buttonMarginTop: Number.parseFloat(buttonStyle.marginTop),
        buttonMarginBottom: Number.parseFloat(buttonStyle.marginBottom)
      }
    })

    expect(qrMetrics).not.toBeNull()
    expect(qrMetrics?.inlineWidth).toBe('var(--a-secondary-dialog-width-qrcode)')
    expect(qrMetrics?.width ?? 0).toBeGreaterThanOrEqual(220)
    expect(qrMetrics?.width ?? 999).toBeLessThanOrEqual(250)
    expect(qrMetrics?.bodyPaddingInlineStart ?? 0).toBeGreaterThanOrEqual(23)
    expect(qrMetrics?.bodyPaddingInlineStart ?? 99).toBeLessThanOrEqual(25)
    expect(qrMetrics?.bodyPaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(23)
    expect(qrMetrics?.bodyPaddingInlineEnd ?? 99).toBeLessThanOrEqual(25)
    expect(qrMetrics?.buttonMarginTop ?? 0).toBeGreaterThanOrEqual(15)
    expect(qrMetrics?.buttonMarginTop ?? 99).toBeLessThanOrEqual(17)
    expect(qrMetrics?.buttonMarginBottom ?? 0).toBeGreaterThanOrEqual(7)
    expect(qrMetrics?.buttonMarginBottom ?? 99).toBeLessThanOrEqual(9)
  })

  test('keeps partner info dialog on the shared info width', async ({ page }) => {
    test.setTimeout(180_000)
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await loginWithPassphrase(page, testPassphrase!)

    await page.goto('/chats/U6386412615727665758')
    await page.waitForURL(/\/chats\/U6386412615727665758$/, { timeout: 90_000 })
    await expect(page.locator('.chat-toolbar .chat-avatar')).toBeVisible()

    await page.locator('.chat-toolbar .chat-avatar').click()
    await expect(page.locator('.partner-info-dialog .v-overlay__content')).toBeVisible()

    const metrics = await page.evaluate(() => {
      const title = document.querySelector(
        '.partner-info-dialog__dialog-title'
      ) as HTMLElement | null
      const listItem = document.querySelector(
        '.partner-info-dialog__list .v-list-item'
      ) as HTMLElement | null
      const content = document.querySelector(
        '.partner-info-dialog .v-overlay__content'
      ) as HTMLElement | null

      if (!title || !listItem || !content) {
        return null
      }

      const titleStyle = getComputedStyle(title)
      const itemStyle = getComputedStyle(listItem)

      return {
        inlineMaxWidth: content.style.maxWidth,
        width: content.getBoundingClientRect().width,
        titlePaddingInlineStart: Number.parseFloat(titleStyle.paddingInlineStart),
        titlePaddingInlineEnd: Number.parseFloat(titleStyle.paddingInlineEnd),
        itemPaddingInlineStart: Number.parseFloat(itemStyle.paddingInlineStart),
        itemPaddingInlineEnd: Number.parseFloat(itemStyle.paddingInlineEnd)
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.inlineMaxWidth).toBe('var(--a-secondary-dialog-width-info)')
    expect(metrics?.width ?? 0).toBeGreaterThanOrEqual(320)
    expect(metrics?.width ?? 999).toBeLessThanOrEqual(360)
    expect(metrics?.titlePaddingInlineStart ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.titlePaddingInlineStart ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.titlePaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.titlePaddingInlineEnd ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.itemPaddingInlineStart ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.itemPaddingInlineStart ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.itemPaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.itemPaddingInlineEnd ?? 99).toBeLessThanOrEqual(25)
  })
})
