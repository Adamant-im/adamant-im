import { expect, type Page } from '@playwright/test'

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
}
