import { expect, test } from '@playwright/test'
import { loginWithNewAccount } from './helpers/auth'

test.describe('Navigation layout regressions', () => {
  test('keeps bottom navigation sizing stable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginWithNewAccount(page)

    await page.goto('/chats')
    await expect(page).toHaveURL(/\/chats(?:\/)?$/)
    await expect(page.locator('.app-navigation')).toBeVisible()

    const metrics = await page.evaluate(() => {
      const navigation = document.querySelector('.app-navigation') as HTMLElement | null
      const button = document.querySelector('.app-navigation__button') as HTMLElement | null
      const label = document.querySelector('.app-navigation__label') as HTMLElement | null

      if (!navigation || !button || !label) {
        return null
      }

      const navigationStyle = getComputedStyle(navigation)
      const buttonStyle = getComputedStyle(button)
      const labelStyle = getComputedStyle(label)

      return {
        navigationHeight: Number.parseFloat(navigationStyle.height),
        buttonFontWeight: Number.parseFloat(buttonStyle.fontWeight),
        labelFontSize: Number.parseFloat(labelStyle.fontSize)
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.navigationHeight ?? 0).toBeGreaterThanOrEqual(49)
    expect(metrics?.navigationHeight ?? 99).toBeLessThanOrEqual(51)
    expect(metrics?.buttonFontWeight ?? 0).toBeGreaterThanOrEqual(299)
    expect(metrics?.buttonFontWeight ?? 999).toBeLessThanOrEqual(301)
    expect(metrics?.labelFontSize ?? 0).toBeGreaterThanOrEqual(13)
    expect(metrics?.labelFontSize ?? 99).toBeLessThanOrEqual(15)
  })

  test('keeps switcher dropdown rows stable on options screen', async ({ page }) => {
    await loginWithNewAccount(page)

    await page.goto('/options')
    await expect(page).toHaveURL(/\/options$/)
    await expect(page.locator('.settings-view')).toBeVisible()

    const languageButton = page.locator('.language-switcher__button')
    await expect(languageButton).toBeVisible()
    await languageButton.click()
    await expect(page.locator('.language-switcher__list')).toBeVisible()

    const languageMetrics = await page.evaluate(() => {
      const item = document.querySelector('.language-switcher__item') as HTMLElement | null
      const title = document.querySelector('.language-switcher__item-title') as HTMLElement | null

      if (!item || !title) {
        return null
      }

      const itemStyle = getComputedStyle(item)
      const titleStyle = getComputedStyle(title)

      return {
        itemPaddingInlineStart: Number.parseFloat(itemStyle.paddingInlineStart),
        itemPaddingInlineEnd: Number.parseFloat(itemStyle.paddingInlineEnd),
        itemMinHeight: Number.parseFloat(itemStyle.minHeight),
        itemPaddingTop: Number.parseFloat(itemStyle.paddingTop),
        itemPaddingBottom: Number.parseFloat(itemStyle.paddingBottom),
        titleFontSize: Number.parseFloat(titleStyle.fontSize),
        titleLineHeight: Number.parseFloat(titleStyle.lineHeight)
      }
    })

    expect(languageMetrics).not.toBeNull()
    expect(languageMetrics?.itemPaddingInlineStart ?? 0).toBeGreaterThanOrEqual(23)
    expect(languageMetrics?.itemPaddingInlineStart ?? 99).toBeLessThanOrEqual(25)
    expect(languageMetrics?.itemPaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(23)
    expect(languageMetrics?.itemPaddingInlineEnd ?? 99).toBeLessThanOrEqual(25)
    expect(languageMetrics?.itemMinHeight ?? 0).toBeGreaterThanOrEqual(55)
    expect(languageMetrics?.itemMinHeight ?? 99).toBeLessThanOrEqual(57)
    expect(languageMetrics?.itemPaddingTop ?? 0).toBeGreaterThanOrEqual(7)
    expect(languageMetrics?.itemPaddingTop ?? 99).toBeLessThanOrEqual(9)
    expect(languageMetrics?.itemPaddingBottom ?? 0).toBeGreaterThanOrEqual(7)
    expect(languageMetrics?.itemPaddingBottom ?? 99).toBeLessThanOrEqual(9)
    expect(languageMetrics?.titleFontSize ?? 0).toBeGreaterThanOrEqual(13)
    expect(languageMetrics?.titleFontSize ?? 99).toBeLessThanOrEqual(15)
    expect(languageMetrics?.titleLineHeight ?? 0).toBeGreaterThanOrEqual(19)
    expect(languageMetrics?.titleLineHeight ?? 99).toBeLessThanOrEqual(21)

    await page.keyboard.press('Escape')

    const currencyButton = page.locator('.currency-switcher__button')
    await expect(currencyButton).toBeVisible()
    await currencyButton.click()
    await expect(page.locator('.currency-switcher__list')).toBeVisible()

    const currencyMetrics = await page.evaluate(() => {
      const item = document.querySelector('.currency-switcher__item') as HTMLElement | null
      const title = document.querySelector('.currency-switcher__item-title') as HTMLElement | null

      if (!item || !title) {
        return null
      }

      const itemStyle = getComputedStyle(item)
      const titleStyle = getComputedStyle(title)

      return {
        itemPaddingInlineStart: Number.parseFloat(itemStyle.paddingInlineStart),
        itemPaddingInlineEnd: Number.parseFloat(itemStyle.paddingInlineEnd),
        itemMinHeight: Number.parseFloat(itemStyle.minHeight),
        itemPaddingTop: Number.parseFloat(itemStyle.paddingTop),
        itemPaddingBottom: Number.parseFloat(itemStyle.paddingBottom),
        titleFontSize: Number.parseFloat(titleStyle.fontSize),
        titleLineHeight: Number.parseFloat(titleStyle.lineHeight)
      }
    })

    expect(currencyMetrics).toEqual(languageMetrics)
  })
})
