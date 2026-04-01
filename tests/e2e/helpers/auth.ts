import { expect, type Page } from '@playwright/test'

export const dismissAddressWarningIfVisible = async (page: Page, timeoutMs = 10_000) => {
  const deadline = Date.now() + timeoutMs
  const warningDialog = page.locator('.warning-on-addresses-dialog')

  while (Date.now() < deadline) {
    if (await warningDialog.isVisible()) {
      const gotItButton = warningDialog.locator('.warning-on-addresses-dialog__btn-hide')
      await expect(gotItButton).toBeVisible()
      await gotItButton.click()
      await expect(warningDialog).toBeHidden()
      return true
    }

    await page.waitForTimeout(250)
  }

  return false
}

export const loginWithNewAccount = async (page: Page) => {
  await page.goto('/')

  const createNewButton = page.getByRole('button', { name: /create new/i })
  await expect(createNewButton).toBeVisible()
  await createNewButton.click()

  const passphraseBox = page.locator('.passphrase-generator__box')
  await expect(passphraseBox).toBeVisible()

  await page.getByRole('img', { name: /copy/i }).first().click()
  const copiedPassphrase = await page.evaluate(async () => navigator.clipboard.readText())
  const words = copiedPassphrase.trim().split(/\s+/)
  expect(words.length).toBe(12)

  const loginInput = page.locator('input[autocomplete="current-password"]')
  await expect(loginInput).toBeVisible()
  await loginInput.fill(copiedPassphrase)

  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await page.waitForURL(/\/chats(?:\/.*)?$/, { timeout: 90_000 })
  await dismissAddressWarningIfVisible(page, 8_000)

  return copiedPassphrase
}

export const loginWithPassphrase = async (page: Page, passphrase: string) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  const loginInput = page.locator('input[autocomplete="current-password"]')

  if (!(await loginInput.isVisible().catch(() => false))) {
    const currentPath = new URL(page.url()).pathname

    if (/^\/(?:chats|home|account|settings|transfer)(?:\/.*)?$/.test(currentPath)) {
      await dismissAddressWarningIfVisible(page, 8_000)
      return
    }
  }

  await expect(loginInput).toBeVisible()
  await loginInput.fill(passphrase)

  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await page.waitForURL(/\/chats(?:\/.*)?$/, { timeout: 90_000 })
  await dismissAddressWarningIfVisible(page, 8_000)
}
