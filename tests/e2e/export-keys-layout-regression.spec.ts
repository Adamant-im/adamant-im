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

test.describe('Export keys layout regressions', () => {
  test('keeps export keys spacing and revealed state stable', async ({ page }) => {
    const passphrase = await loginWithNewAccount(page)

    await page.goto('/options/export-keys')
    await expect(page).toHaveURL(/\/options\/export-keys$/)
    await expect(page.locator('.export-keys-form')).toBeVisible()

    const initialMetrics = await page.evaluate(() => {
      const disclaimer = document.querySelector(
        '.export-keys-form__disclaimer'
      ) as HTMLElement | null
      const button = document.querySelector(
        '.export-keys-form__export_keys_button'
      ) as HTMLElement | null

      if (!disclaimer || !button) {
        return null
      }

      const disclaimerStyle = getComputedStyle(disclaimer)
      const buttonStyle = getComputedStyle(button)

      return {
        disclaimerMarginTop: Number.parseFloat(disclaimerStyle.marginTop),
        disclaimerMarginBottom: Number.parseFloat(disclaimerStyle.marginBottom),
        buttonMarginTop: Number.parseFloat(buttonStyle.marginTop),
        buttonMarginBottom: Number.parseFloat(buttonStyle.marginBottom)
      }
    })

    expect(initialMetrics).not.toBeNull()
    expect(initialMetrics?.disclaimerMarginTop ?? 0).toBeGreaterThanOrEqual(23)
    expect(initialMetrics?.disclaimerMarginTop ?? 999).toBeLessThanOrEqual(25)
    expect(initialMetrics?.disclaimerMarginBottom ?? 0).toBeGreaterThanOrEqual(23)
    expect(initialMetrics?.disclaimerMarginBottom ?? 999).toBeLessThanOrEqual(25)
    expect(initialMetrics?.buttonMarginTop ?? 0).toBeGreaterThanOrEqual(15)
    expect(initialMetrics?.buttonMarginTop ?? 999).toBeLessThanOrEqual(17)
    expect(initialMetrics?.buttonMarginBottom ?? 0).toBeGreaterThanOrEqual(23)
    expect(initialMetrics?.buttonMarginBottom ?? 999).toBeLessThanOrEqual(25)

    const passphraseInput = page.locator('.export-keys-form .v-field input').first()
    await expect(passphraseInput).toBeVisible()
    await passphraseInput.fill(passphrase)

    await page.locator('.export-keys-form__export_keys_button').click()
    await expect(page.locator('.export-keys-form__keys')).toBeVisible()
    await expect(page.locator('.export-keys-form input[readonly]')).toHaveCount(4)

    const revealedMetrics = await page.evaluate(() => {
      const keys = document.querySelector('.export-keys-form__keys') as HTMLElement | null
      const copyAllRow = document.querySelector(
        '.export-keys-form__copy-all-row'
      ) as HTMLElement | null
      const copyAllButton = document.querySelector(
        '.export-keys-form__copy_all_button'
      ) as HTMLElement | null

      if (!keys || !copyAllRow || !copyAllButton) {
        return null
      }

      const keysStyle = getComputedStyle(keys)
      const copyAllRowStyle = getComputedStyle(copyAllRow)
      const copyAllButtonStyle = getComputedStyle(copyAllButton)

      return {
        keysMarginTop: Number.parseFloat(keysStyle.marginTop),
        keysMarginBottom: Number.parseFloat(keysStyle.marginBottom),
        copyAllRowJustify: copyAllRowStyle.justifyContent,
        copyAllButtonMarginBottom: Number.parseFloat(copyAllButtonStyle.marginBottom)
      }
    })

    expect(revealedMetrics).not.toBeNull()
    expect(revealedMetrics?.keysMarginTop ?? 0).toBeGreaterThanOrEqual(23)
    expect(revealedMetrics?.keysMarginTop ?? 999).toBeLessThanOrEqual(25)
    expect(revealedMetrics?.keysMarginBottom ?? 0).toBeGreaterThanOrEqual(23)
    expect(revealedMetrics?.keysMarginBottom ?? 999).toBeLessThanOrEqual(25)
    expect(revealedMetrics?.copyAllRowJustify).toBe('flex-end')
    expect(revealedMetrics?.copyAllButtonMarginBottom ?? 0).toBeGreaterThanOrEqual(11)
    expect(revealedMetrics?.copyAllButtonMarginBottom ?? 999).toBeLessThanOrEqual(13)

    await assertNoDocumentScrollLeak(page)
  })

  test('keeps export keys mobile right gutter aligned with the left gutter', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginWithNewAccount(page)

    await page.goto('/options/export-keys')
    await expect(page).toHaveURL(/\/options\/export-keys$/)
    await expect(page.locator('.export-keys-form')).toBeVisible()

    const metrics = await page.evaluate(() => {
      const field = document.querySelector('.export-keys-form .v-field') as HTMLElement | null
      const disclaimer = document.querySelector(
        '.export-keys-form__disclaimer'
      ) as HTMLElement | null

      if (!field || !disclaimer) {
        return null
      }

      const fieldRect = field.getBoundingClientRect()
      const disclaimerRect = disclaimer.getBoundingClientRect()

      return {
        fieldLeftGap: fieldRect.left,
        fieldRightGap: window.innerWidth - fieldRect.right,
        disclaimerLeftGap: disclaimerRect.left,
        disclaimerRightGap: window.innerWidth - disclaimerRect.right
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.fieldLeftGap ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.fieldLeftGap ?? 999).toBeLessThanOrEqual(25)
    expect(metrics?.fieldRightGap ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.fieldRightGap ?? 999).toBeLessThanOrEqual(25)
    expect(metrics?.disclaimerLeftGap ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.disclaimerLeftGap ?? 999).toBeLessThanOrEqual(25)
    expect(metrics?.disclaimerRightGap ?? 0).toBeGreaterThanOrEqual(23)
    expect(metrics?.disclaimerRightGap ?? 999).toBeLessThanOrEqual(25)

    await assertNoDocumentScrollLeak(page)
  })
})
