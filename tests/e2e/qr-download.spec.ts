import { readFile } from 'node:fs/promises'
import { generateMnemonic } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { loginWithPassphrase } from './helpers/auth'

async function expectPngDownload(page: Page, trigger: Locator) {
  await expect(page.locator('.qrcode-renderer-dialog__preview-action img')).toBeVisible()
  const [download] = await Promise.all([page.waitForEvent('download'), trigger.click()])

  try {
    expect(download.suggestedFilename()).toBe('adamant-im.png')
    expect(await download.failure()).toBeNull()
    const png = await readFile(await download.path())
    expect(png.subarray(0, 8)).toEqual(Buffer.from('89504e470d0a1a0a', 'hex'))
  } finally {
    await download.delete()
  }
}

test('downloads the passphrase QR as a PNG', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /create new/i }).click()
  await page
    .locator('.passphrase-generator__icons svg')
    .filter({ has: page.locator('title', { hasText: 'Save passphrase as a QR code' }) })
    .click()

  await expectPngDownload(page, page.locator('.qrcode-renderer-dialog__preview-action'))
})

test('downloads the address QR as a PNG', async ({ page }) => {
  await loginWithPassphrase(page, generateMnemonic(wordlist))
  await page.locator('.chats-view__item').click()
  await page.locator('.chat-start-dialog__btn-show-qrcode a').click()

  await expectPngDownload(page, page.locator('.qrcode-renderer-dialog__button'))
})
