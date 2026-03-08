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

test.describe('Transfer layout regressions', () => {
  test('lets Escape close currency dropdown before leaving send funds screen', async ({ page }) => {
    const routerWarnings: string[] = []

    page.on('console', (message) => {
      if (message.type() !== 'warning') {
        return
      }

      const text = message.text()

      if (text.includes('Discarded invalid param(s)')) {
        routerWarnings.push(text)
      }
    })

    await loginWithNewAccount(page)

    await page.goto('/transfer', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/transfer(?:\/)?$/)
    await expect(page.locator('.send-funds-form')).toBeVisible()

    await page.locator('.send-funds-form .v-select .v-field').click()
    await expect(
      page.locator('.v-overlay .v-list-item-title').filter({ hasText: 'ADM' })
    ).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(page).toHaveURL(/\/transfer(?:\/)?$/)
    await expect(
      page.locator('.v-overlay .v-list-item-title').filter({ hasText: 'ADM' })
    ).toBeHidden()
    expect(routerWarnings).toEqual([])

    await assertNoDocumentScrollLeak(page)
  })

  test('keeps send funds form spacing and sizing stable', async ({ page }) => {
    await loginWithNewAccount(page)

    await page.goto('/transfer')
    await expect(page).toHaveURL(/\/transfer(?:\/)?$/)
    await expect(page.locator('.send-funds-form')).toBeVisible()
    await page.locator('.send-funds-form__menu-activator').nth(1).click()
    await expect(page.locator('.send-funds-form__menu-list').nth(1)).toBeVisible()

    const styles = await page.evaluate(() => {
      const button = document.querySelector('.send-funds-form__button') as HTMLElement | null
      const maxAmountLabel = document.querySelector(
        '.send-funds-form__amount-input .max-amount-label'
      ) as HTMLElement | null
      const fakeInput = document.querySelector('.send-funds-form .fake-input') as HTMLElement | null
      const fakeInputBox = document.querySelector(
        '.send-funds-form .fake-input__box'
      ) as HTMLElement | null
      const fakeInputValue = document.querySelector(
        '.send-funds-form .fake-input__value'
      ) as HTMLElement | null
      const fakeInputRate = document.querySelector(
        '.send-funds-form .fake-input__value--rate'
      ) as HTMLElement | null
      const menuItem = Array.from(document.querySelectorAll('.send-funds-form__menu-item')).find(
        (element) => (element as HTMLElement).offsetParent !== null
      ) as HTMLElement | undefined
      const menuItemTitle = Array.from(
        document.querySelectorAll('.send-funds-form__menu-item-title')
      ).find((element) => (element as HTMLElement).offsetParent !== null) as HTMLElement | undefined

      if (
        !button ||
        !maxAmountLabel ||
        !fakeInput ||
        !fakeInputBox ||
        !fakeInputValue ||
        !fakeInputRate ||
        !menuItem ||
        !menuItemTitle
      ) {
        return null
      }

      const fakeInputStyle = getComputedStyle(fakeInput)
      const fakeInputBoxStyle = getComputedStyle(fakeInputBox)
      const fakeInputRateStyle = getComputedStyle(fakeInputRate)
      const menuItemStyle = getComputedStyle(menuItem)
      const menuItemTitleStyle = getComputedStyle(menuItemTitle)

      return {
        buttonMarginTop: Number.parseFloat(getComputedStyle(button).marginTop),
        maxAmountLabelFontSize: Number.parseFloat(getComputedStyle(maxAmountLabel).fontSize),
        fakeInputPaddingTop: Number.parseFloat(fakeInputStyle.paddingTop),
        fakeInputMarginTop: Number.parseFloat(fakeInputStyle.marginTop),
        fakeInputFontSize: Number.parseFloat(fakeInputStyle.fontSize),
        fakeInputBoxPaddingBottom: Number.parseFloat(fakeInputBoxStyle.paddingBottom),
        fakeInputValueLineHeight: Number.parseFloat(getComputedStyle(fakeInputValue).lineHeight),
        fakeInputRatePaddingInlineStart: Number.parseFloat(fakeInputRateStyle.paddingInlineStart),
        menuItemPaddingInlineStart: Number.parseFloat(menuItemStyle.paddingInlineStart),
        menuItemPaddingInlineEnd: Number.parseFloat(menuItemStyle.paddingInlineEnd),
        menuItemMinHeight: Number.parseFloat(menuItemStyle.minHeight),
        menuItemPaddingTop: Number.parseFloat(menuItemStyle.paddingTop),
        menuItemPaddingBottom: Number.parseFloat(menuItemStyle.paddingBottom),
        menuItemTitleFontSize: Number.parseFloat(menuItemTitleStyle.fontSize),
        menuItemTitleLineHeight: Number.parseFloat(menuItemTitleStyle.lineHeight),
        menuItemTitleFontWeight: Number.parseFloat(menuItemTitleStyle.fontWeight)
      }
    })

    expect(styles).not.toBeNull()
    expect(styles?.buttonMarginTop ?? 0).toBeGreaterThanOrEqual(14)
    expect(styles?.buttonMarginTop ?? 999).toBeLessThanOrEqual(18)
    expect(styles?.maxAmountLabelFontSize ?? 0).toBeGreaterThanOrEqual(13)
    expect(styles?.maxAmountLabelFontSize ?? 999).toBeLessThanOrEqual(15)
    expect(styles?.fakeInputPaddingTop ?? 0).toBeGreaterThanOrEqual(11)
    expect(styles?.fakeInputPaddingTop ?? 99).toBeLessThanOrEqual(13)
    expect(styles?.fakeInputMarginTop ?? 0).toBeGreaterThanOrEqual(3)
    expect(styles?.fakeInputMarginTop ?? 99).toBeLessThanOrEqual(5)
    expect(styles?.fakeInputFontSize ?? 0).toBeGreaterThanOrEqual(15)
    expect(styles?.fakeInputFontSize ?? 99).toBeLessThanOrEqual(17)
    expect(styles?.fakeInputBoxPaddingBottom ?? 0).toBeGreaterThanOrEqual(19)
    expect(styles?.fakeInputBoxPaddingBottom ?? 99).toBeLessThanOrEqual(21)
    expect(styles?.fakeInputValueLineHeight ?? 0).toBeGreaterThanOrEqual(31)
    expect(styles?.fakeInputValueLineHeight ?? 99).toBeLessThanOrEqual(33)
    expect(styles?.fakeInputRatePaddingInlineStart ?? 0).toBeGreaterThanOrEqual(2)
    expect(styles?.fakeInputRatePaddingInlineStart ?? 99).toBeLessThanOrEqual(4)
    expect(styles?.menuItemPaddingInlineStart ?? 0).toBeGreaterThanOrEqual(23)
    expect(styles?.menuItemPaddingInlineStart ?? 99).toBeLessThanOrEqual(25)
    expect(styles?.menuItemPaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(23)
    expect(styles?.menuItemPaddingInlineEnd ?? 99).toBeLessThanOrEqual(25)
    expect(styles?.menuItemMinHeight ?? 0).toBeGreaterThanOrEqual(55)
    expect(styles?.menuItemMinHeight ?? 99).toBeLessThanOrEqual(57)
    expect(styles?.menuItemPaddingTop ?? 0).toBeGreaterThanOrEqual(7)
    expect(styles?.menuItemPaddingTop ?? 99).toBeLessThanOrEqual(9)
    expect(styles?.menuItemPaddingBottom ?? 0).toBeGreaterThanOrEqual(7)
    expect(styles?.menuItemPaddingBottom ?? 99).toBeLessThanOrEqual(9)
    expect(styles?.menuItemTitleFontSize ?? 0).toBeGreaterThanOrEqual(15)
    expect(styles?.menuItemTitleFontSize ?? 99).toBeLessThanOrEqual(17)
    expect(styles?.menuItemTitleLineHeight ?? 0).toBeGreaterThanOrEqual(23)
    expect(styles?.menuItemTitleLineHeight ?? 99).toBeLessThanOrEqual(25)
    expect(styles?.menuItemTitleFontWeight ?? 0).toBeGreaterThanOrEqual(299)
    expect(styles?.menuItemTitleFontWeight ?? 999).toBeLessThanOrEqual(301)

    await assertNoDocumentScrollLeak(page)
  })

  test('keeps symmetric mobile gutters on send funds screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginWithNewAccount(page)

    await page.goto('/transfer')
    await expect(page).toHaveURL(/\/transfer(?:\/)?$/)
    await expect(page.locator('.send-funds-form')).toBeVisible()

    const metrics = await page.evaluate(() => {
      const content = document.querySelector('.navigation-wrapper__content') as HTMLElement | null
      const field = document.querySelector('.send-funds-form .v-field') as HTMLElement | null

      if (!content || !field) {
        return null
      }

      const contentStyle = getComputedStyle(content)
      const fieldRect = field.getBoundingClientRect()

      return {
        contentPaddingInlineStart: Number.parseFloat(contentStyle.paddingInlineStart),
        contentPaddingInlineEnd: Number.parseFloat(contentStyle.paddingInlineEnd),
        fieldLeftGap: fieldRect.left,
        fieldRightGap: window.innerWidth - fieldRect.right
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.contentPaddingInlineStart ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.contentPaddingInlineStart ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.contentPaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.contentPaddingInlineEnd ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.fieldLeftGap ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.fieldLeftGap ?? 99).toBeLessThanOrEqual(25)
    expect(metrics?.fieldRightGap ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.fieldRightGap ?? 99).toBeLessThanOrEqual(25)

    await assertNoDocumentScrollLeak(page)
  })
})
