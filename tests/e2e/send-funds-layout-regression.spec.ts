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
  test('keeps in-chat readonly fields underlined and leaves bottom room for send button', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 640 })
    await loginWithNewAccount(page)

    const address = await page.evaluate(() => {
      const runtime = window as typeof window & {
        store?: {
          state: {
            address: string
          }
        }
      }

      return runtime.store?.state.address ?? ''
    })

    expect(address).toMatch(/^U/i)

    await page.goto(`/transfer/ADM/${address}`)
    await expect(page).toHaveURL(new RegExp(`/transfer/ADM/${address}$`))
    await expect(page.locator('.send-funds-form')).toBeVisible()

    const sidebarPane = page.locator('.sidebar__layout.a-scroll-pane')
    await expect(sidebarPane).toBeVisible()

    const initialMetrics = await page.evaluate(() => {
      const fields = Array.from(
        document.querySelectorAll('.send-funds-form .v-field')
      ) as HTMLElement[]
      const actions = document.querySelector('.send-funds-form__actions') as HTMLElement | null
      const button = document.querySelector('.send-funds-form__button') as HTMLElement | null
      const pane = document.querySelector('.sidebar__layout.a-scroll-pane') as HTMLElement | null

      const coinField = fields[0] ?? null
      const toField = fields[1] ?? null

      if (!coinField || !toField || !actions || !button || !pane) {
        return null
      }

      const actionsStyle = getComputedStyle(actions)
      const buttonRect = button.getBoundingClientRect()
      const paneRect = pane.getBoundingClientRect()

      return {
        coinNotDisabled: !coinField.classList.contains('v-field--disabled'),
        toNotDisabled: !toField.classList.contains('v-field--disabled'),
        actionsPaddingBottom: Number.parseFloat(actionsStyle.paddingBottom),
        canScroll: pane.scrollHeight > pane.clientHeight + 1,
        buttonBottomGap: paneRect.bottom - buttonRect.bottom
      }
    })

    expect(initialMetrics).not.toBeNull()
    expect(initialMetrics?.coinNotDisabled).toBe(true)
    expect(initialMetrics?.toNotDisabled).toBe(true)
    expect(initialMetrics?.actionsPaddingBottom ?? 0).toBeGreaterThanOrEqual(23)
    expect(initialMetrics?.actionsPaddingBottom ?? 99).toBeLessThanOrEqual(25)
    expect(initialMetrics?.buttonBottomGap ?? 0).toBeGreaterThanOrEqual(20)

    if (initialMetrics?.canScroll) {
      await sidebarPane.evaluate((element) => {
        element.scrollTop = element.scrollHeight
      })

      await expect
        .poll(() => sidebarPane.evaluate((element) => element.scrollTop))
        .toBeGreaterThan(0)

      const scrolledMetrics = await page.evaluate(() => {
        const pane = document.querySelector('.sidebar__layout.a-scroll-pane') as HTMLElement | null
        const button = document.querySelector('.send-funds-form__button') as HTMLElement | null

        if (!pane || !button) {
          return null
        }

        const paneRect = pane.getBoundingClientRect()
        const buttonRect = button.getBoundingClientRect()

        return {
          buttonBottomGap: paneRect.bottom - buttonRect.bottom
        }
      })

      expect(scrolledMetrics).not.toBeNull()
      expect(scrolledMetrics?.buttonBottomGap ?? 0).toBeGreaterThanOrEqual(20)
    }

    await assertNoDocumentScrollLeak(page)
  })

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
      const menuList = Array.from(document.querySelectorAll('.send-funds-form__menu-list')).find(
        (element) => (element as HTMLElement).offsetParent !== null
      ) as HTMLElement | undefined
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
        !menuList ||
        !menuItem ||
        !menuItemTitle
      ) {
        return null
      }

      const menuListStyle = getComputedStyle(menuList)
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
        menuListPaddingTop: Number.parseFloat(menuListStyle.paddingTop),
        menuListPaddingBottom: Number.parseFloat(menuListStyle.paddingBottom),
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
    expect(styles?.menuListPaddingTop ?? 0).toBeGreaterThanOrEqual(7)
    expect(styles?.menuListPaddingTop ?? 99).toBeLessThanOrEqual(9)
    expect(styles?.menuListPaddingBottom ?? 0).toBeGreaterThanOrEqual(7)
    expect(styles?.menuListPaddingBottom ?? 99).toBeLessThanOrEqual(9)
    expect(styles?.menuItemPaddingInlineStart ?? 0).toBeGreaterThanOrEqual(23)
    expect(styles?.menuItemPaddingInlineStart ?? 99).toBeLessThanOrEqual(25)
    expect(styles?.menuItemPaddingInlineEnd ?? 0).toBeGreaterThanOrEqual(23)
    expect(styles?.menuItemPaddingInlineEnd ?? 99).toBeLessThanOrEqual(25)
    expect(styles?.menuItemMinHeight ?? 0).toBeGreaterThanOrEqual(43)
    expect(styles?.menuItemMinHeight ?? 99).toBeLessThanOrEqual(45)
    expect(styles?.menuItemPaddingTop ?? 0).toBeGreaterThanOrEqual(0)
    expect(styles?.menuItemPaddingTop ?? 99).toBeLessThanOrEqual(1)
    expect(styles?.menuItemPaddingBottom ?? 0).toBeGreaterThanOrEqual(0)
    expect(styles?.menuItemPaddingBottom ?? 99).toBeLessThanOrEqual(1)
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
