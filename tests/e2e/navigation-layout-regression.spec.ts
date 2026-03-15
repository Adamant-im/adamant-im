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
      const activeButton = document.querySelector(
        '.app-navigation .v-btn.v-btn--active'
      ) as HTMLElement | null
      const inactiveButton = document.querySelector(
        '.app-navigation .v-btn:not(.v-btn--active)'
      ) as HTMLElement | null
      const activeLabel = activeButton?.querySelector(
        '.app-navigation__label'
      ) as HTMLElement | null
      const inactiveLabel = inactiveButton?.querySelector(
        '.app-navigation__label'
      ) as HTMLElement | null

      if (!navigation || !activeButton || !inactiveButton || !activeLabel || !inactiveLabel) {
        return null
      }

      const navigationStyle = getComputedStyle(navigation)
      const buttonStyle = getComputedStyle(activeButton)
      const activeLabelStyle = getComputedStyle(activeLabel)
      const inactiveLabelStyle = getComputedStyle(inactiveLabel)

      return {
        navigationHeight: Number.parseFloat(navigationStyle.height),
        buttonFontWeight: Number.parseFloat(buttonStyle.fontWeight),
        activeLabelFontSize: Number.parseFloat(activeLabelStyle.fontSize),
        inactiveLabelFontSize: Number.parseFloat(inactiveLabelStyle.fontSize)
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.navigationHeight ?? 0).toBeGreaterThanOrEqual(49)
    expect(metrics?.navigationHeight ?? 99).toBeLessThanOrEqual(51)
    expect(metrics?.buttonFontWeight ?? 0).toBeGreaterThanOrEqual(299)
    expect(metrics?.buttonFontWeight ?? 999).toBeLessThanOrEqual(301)
    expect(metrics?.activeLabelFontSize ?? 0).toBeGreaterThanOrEqual(13)
    expect(metrics?.activeLabelFontSize ?? 99).toBeLessThanOrEqual(15)
    expect(metrics?.inactiveLabelFontSize ?? 0).toBeGreaterThanOrEqual(11)
    expect(metrics?.inactiveLabelFontSize ?? 99).toBeLessThanOrEqual(13)
    expect((metrics?.inactiveLabelFontSize ?? 99) < (metrics?.activeLabelFontSize ?? 0)).toBe(true)
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
      const list = document.querySelector('.language-switcher__list') as HTMLElement | null
      const item = document.querySelector('.language-switcher__item') as HTMLElement | null
      const title = document.querySelector('.language-switcher__item-title') as HTMLElement | null

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

    expect(languageMetrics).not.toBeNull()
    expect(languageMetrics?.listPaddingTop ?? 0).toBeGreaterThanOrEqual(7)
    expect(languageMetrics?.listPaddingTop ?? 99).toBeLessThanOrEqual(9)
    expect(languageMetrics?.listPaddingBottom ?? 0).toBeGreaterThanOrEqual(7)
    expect(languageMetrics?.listPaddingBottom ?? 99).toBeLessThanOrEqual(9)
    expect(languageMetrics?.itemPaddingInlineStart ?? 0).toBeGreaterThanOrEqual(23)
    expect(languageMetrics?.itemPaddingInlineStart ?? 99).toBeLessThanOrEqual(25)
    expect(languageMetrics?.itemPaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(23)
    expect(languageMetrics?.itemPaddingInlineEnd ?? 99).toBeLessThanOrEqual(25)
    expect(languageMetrics?.itemMinHeight ?? 0).toBeGreaterThanOrEqual(43)
    expect(languageMetrics?.itemMinHeight ?? 99).toBeLessThanOrEqual(45)
    expect(languageMetrics?.itemPaddingTop ?? 0).toBeGreaterThanOrEqual(0)
    expect(languageMetrics?.itemPaddingTop ?? 99).toBeLessThanOrEqual(1)
    expect(languageMetrics?.itemPaddingBottom ?? 0).toBeGreaterThanOrEqual(0)
    expect(languageMetrics?.itemPaddingBottom ?? 99).toBeLessThanOrEqual(1)
    expect(languageMetrics?.titleFontSize ?? 0).toBeGreaterThanOrEqual(15)
    expect(languageMetrics?.titleFontSize ?? 99).toBeLessThanOrEqual(17)
    expect(languageMetrics?.titleLineHeight ?? 0).toBeGreaterThanOrEqual(23)
    expect(languageMetrics?.titleLineHeight ?? 99).toBeLessThanOrEqual(25)
    expect(languageMetrics?.titleFontWeight ?? 0).toBeGreaterThanOrEqual(299)
    expect(languageMetrics?.titleFontWeight ?? 999).toBeLessThanOrEqual(301)

    await page.keyboard.press('Escape')

    const currencyButton = page.locator('.currency-switcher__button')
    await expect(currencyButton).toBeVisible()
    await currencyButton.click()
    await expect(page.locator('.currency-switcher__list')).toBeVisible()

    const currencyMetrics = await page.evaluate(() => {
      const list = document.querySelector('.currency-switcher__list') as HTMLElement | null
      const item = document.querySelector('.currency-switcher__item') as HTMLElement | null
      const title = document.querySelector('.currency-switcher__item-title') as HTMLElement | null

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

    expect(currencyMetrics).toEqual(languageMetrics)
  })

  test('restores the last settings screen and scroll position after switching to chats and back', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginWithNewAccount(page)

    await page.goto('/options/nodes')
    await expect(page).toHaveURL(/\/options\/nodes$/)
    await expect(page.locator('.settings-table-shell')).toBeVisible()

    const targetScrollTop = await page.evaluate(async () => {
      const scrollPane = document.querySelector('.sidebar__layout') as HTMLElement | null

      if (!scrollPane) {
        return null
      }

      scrollPane.scrollTo({ top: 220 })
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))

      return Math.ceil(scrollPane.scrollTop)
    })

    expect(targetScrollTop).not.toBeNull()
    expect(targetScrollTop ?? 0).toBeGreaterThan(100)

    await page.locator('.app-navigation .v-btn').nth(1).click()
    await expect(page).toHaveURL(/\/chats(?:\/)?$/)

    await page.locator('.app-navigation .v-btn').nth(2).click()
    await expect(page).toHaveURL(/\/options\/nodes$/)

    const restoredMetrics = await page.evaluate(() => {
      const scrollPane = document.querySelector('.sidebar__layout') as HTMLElement | null

      return scrollPane ? Math.ceil(scrollPane.scrollTop) : null
    })

    expect(restoredMetrics).not.toBeNull()
    expect(Math.abs((restoredMetrics ?? 0) - (targetScrollTop ?? 0))).toBeLessThanOrEqual(4)
  })
})
