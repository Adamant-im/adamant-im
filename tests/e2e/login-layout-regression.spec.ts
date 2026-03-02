import { expect, test } from '@playwright/test'

test.describe('Login layout regressions', () => {
  test('shows subtitle on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const subtitle = page.locator('.login-page__subtitle')
    await expect(subtitle).toBeVisible()
    await expect(subtitle).not.toHaveClass(/hidden-sm-and-down/)
  })

  test('keeps hero and passphrase field sizing consistent', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.login-page')).toBeVisible()
    await expect(page.locator('.login-page__logo')).toBeVisible()
    await expect(page.locator('.login-page__title')).toBeVisible()
    await expect(page.locator('.login-form')).toBeVisible()

    const metrics = await page.evaluate(() => {
      const root = document.querySelector('.login-page') as HTMLElement | null
      const logo = document.querySelector('.login-page__logo') as HTMLElement | null
      const title = document.querySelector('.login-page__title') as HTMLElement | null
      const subtitle = document.querySelector('.login-page__subtitle') as HTMLElement | null
      const passphraseRow = document.querySelector(
        '.login-page__passphrase-row'
      ) as HTMLElement | null
      const settingsButtonContainer = document.querySelector(
        '.login-page__settings-button-container'
      ) as HTMLElement | null
      const loginForm = document.querySelector('.login-form') as HTMLElement | null
      const createTitle = document.querySelector(
        '.passphrase-generator h3.a-text-regular'
      ) as HTMLElement | null
      const createButton = document.querySelector(
        '.passphrase-generator .a-btn-link'
      ) as HTMLElement | null
      const fieldInput = document.querySelector('.login-form .v-field__input') as HTMLElement | null
      const fieldAppendInner = document.querySelector(
        '.login-form .v-field__append-inner'
      ) as HTMLElement | null

      if (
        !root ||
        !logo ||
        !title ||
        !subtitle ||
        !passphraseRow ||
        !settingsButtonContainer ||
        !loginForm ||
        !createTitle ||
        !createButton ||
        !fieldInput ||
        !fieldAppendInner
      ) {
        return null
      }

      const rootStyle = getComputedStyle(root)
      const logoStyle = getComputedStyle(logo)
      const titleStyle = getComputedStyle(title)
      const subtitleStyle = getComputedStyle(subtitle)
      const passphraseRowStyle = getComputedStyle(passphraseRow)
      const settingsButtonContainerStyle = getComputedStyle(settingsButtonContainer)
      const loginFormStyle = getComputedStyle(loginForm)
      const createTitleStyle = getComputedStyle(createTitle)
      const createButtonStyle = getComputedStyle(createButton)
      const fieldInputStyle = getComputedStyle(fieldInput)
      const fieldAppendInnerStyle = getComputedStyle(fieldAppendInner)

      return {
        logoWidthVar: rootStyle.getPropertyValue('--a-login-logo-width').trim(),
        titleLineHeightVar: rootStyle.getPropertyValue('--a-login-title-line-height').trim(),
        inputPaddingVar: loginFormStyle
          .getPropertyValue('--a-login-form-passphrase-input-padding-inline')
          .trim(),
        logoWidth: Number.parseFloat(logoStyle.width),
        titleLineHeight: Number.parseFloat(titleStyle.lineHeight),
        titleLetterSpacing: Number.parseFloat(titleStyle.letterSpacing),
        subtitleMarginTop: Number.parseFloat(subtitleStyle.marginTop),
        subtitleFontWeight: Number.parseInt(subtitleStyle.fontWeight, 10),
        passphraseRowMarginTop: Number.parseFloat(passphraseRowStyle.marginTop),
        createTitleMarginBottom: Number.parseFloat(createTitleStyle.marginBottom),
        createButtonMarginTop: Number.parseFloat(createButtonStyle.marginTop),
        pagePaddingBottom: Number.parseFloat(rootStyle.paddingBottom),
        settingsMarginRight: Number.parseFloat(settingsButtonContainerStyle.marginRight),
        fieldInputPaddingLeft: Number.parseFloat(fieldInputStyle.paddingLeft),
        fieldInputPaddingRight: Number.parseFloat(fieldInputStyle.paddingRight),
        fieldAppendInnerMarginLeft: Number.parseFloat(fieldAppendInnerStyle.marginLeft)
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.logoWidthVar).not.toBe('')
    expect(metrics?.titleLineHeightVar).not.toBe('')
    expect(metrics?.inputPaddingVar).not.toBe('')
    expect(metrics?.logoWidth ?? 0).toBeGreaterThanOrEqual(298)
    expect(metrics?.logoWidth ?? 999).toBeLessThanOrEqual(302)
    expect(metrics?.titleLineHeight ?? 0).toBeGreaterThanOrEqual(39)
    expect(metrics?.titleLineHeight ?? 999).toBeLessThanOrEqual(41)
    expect(metrics?.titleLetterSpacing ?? 0).toBeGreaterThan(0)
    expect(metrics?.subtitleMarginTop ?? 0).toBeGreaterThanOrEqual(7)
    expect(metrics?.subtitleMarginTop ?? 999).toBeLessThanOrEqual(9)
    expect(metrics?.subtitleFontWeight ?? 999).toBeLessThanOrEqual(400)
    expect(metrics?.passphraseRowMarginTop ?? 0).toBeGreaterThanOrEqual(39)
    expect(metrics?.passphraseRowMarginTop ?? 999).toBeLessThanOrEqual(41)
    expect(metrics?.createTitleMarginBottom ?? 0).toBeGreaterThanOrEqual(3)
    expect(metrics?.createTitleMarginBottom ?? 999).toBeLessThanOrEqual(9)
    expect(metrics?.createButtonMarginTop ?? 0).toBeGreaterThanOrEqual(3)
    expect(metrics?.createButtonMarginTop ?? 999).toBeLessThanOrEqual(9)
    expect(
      (metrics?.createTitleMarginBottom ?? 0) + (metrics?.createButtonMarginTop ?? 0)
    ).toBeGreaterThanOrEqual(11)
    expect(metrics?.pagePaddingBottom ?? 0).toBeGreaterThanOrEqual(31)
    expect(metrics?.pagePaddingBottom ?? 999).toBeLessThanOrEqual(33)
    expect(metrics?.settingsMarginRight ?? 0).toBeGreaterThanOrEqual(7)
    expect(metrics?.settingsMarginRight ?? 999).toBeLessThanOrEqual(9)
    expect(metrics?.fieldInputPaddingLeft ?? 0).toBeGreaterThanOrEqual(31)
    expect(metrics?.fieldInputPaddingLeft ?? 999).toBeLessThanOrEqual(33)
    expect(metrics?.fieldInputPaddingRight ?? 0).toBeGreaterThanOrEqual(31)
    expect(metrics?.fieldInputPaddingRight ?? 999).toBeLessThanOrEqual(33)
    expect(metrics?.fieldAppendInnerMarginLeft ?? 0).toBeLessThanOrEqual(-27)
    expect(metrics?.fieldAppendInnerMarginLeft ?? -999).toBeGreaterThanOrEqual(-29)

    const createButton = page.locator('.passphrase-generator .a-btn-link').first()
    await createButton.click()
    const passphraseBox = page.locator('.passphrase-generator__box')
    await expect(passphraseBox).toBeVisible()

    const generatedMetrics = await page.evaluate(() => {
      const passphraseBoxElement = document.querySelector(
        '.passphrase-generator__box'
      ) as HTMLElement | null

      if (!passphraseBoxElement) {
        return null
      }

      const passphraseBoxStyle = getComputedStyle(passphraseBoxElement)

      return {
        passphraseBoxMarginTop: Number.parseFloat(passphraseBoxStyle.marginTop)
      }
    })

    expect(generatedMetrics).not.toBeNull()
    expect(generatedMetrics?.passphraseBoxMarginTop ?? 0).toBeGreaterThanOrEqual(31)
    expect(generatedMetrics?.passphraseBoxMarginTop ?? 999).toBeLessThanOrEqual(33)
  })
})
