import { expect, test, type Page, type TestInfo } from '@playwright/test'

const attachPageScreenshot = async (page: Page, testInfo: TestInfo, name: string) => {
  const body = await page.screenshot({ fullPage: true })

  await testInfo.attach(name, {
    body,
    contentType: 'image/png'
  })
}

test.describe('Public UI smoke checks', () => {
  test('renders login essentials', async ({ page }, testInfo) => {
    await page.goto('/')

    await expect(page.locator('.login-page__title')).toBeVisible()
    await expect(page.locator('input[autocomplete="current-password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible()

    await attachPageScreenshot(page, testInfo, 'login-page')
  })

  test('creates a new account and logs in with copied passphrase', async ({ page }, testInfo) => {
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
    await expect(page).toHaveURL(/\/chats(?:\/.*)?$/)

    await attachPageScreenshot(page, testInfo, 'logged-in-chats')
  })

  test('opens language switcher menu on login page', async ({ page }, testInfo) => {
    await page.goto('/')

    const switcherButton = page.locator('.a-switcher-button').first()
    await expect(switcherButton).toBeVisible()
    await switcherButton.click()

    const languageItems = page.locator('.v-overlay .v-list-item-title')
    await expect(languageItems.first()).toBeVisible()
    const itemsCount = await languageItems.count()
    expect(itemsCount).toBeGreaterThan(1)

    await attachPageScreenshot(page, testInfo, 'language-switcher-menu')
  })

  test('renders public Vibro route', async ({ page }, testInfo) => {
    await page.goto('/vibro')

    await expect(page.locator('.vibro-view__custom-input')).toBeVisible()
    await expect(page.locator('.vibro-view__preset-button').first()).toBeVisible()

    await attachPageScreenshot(page, testInfo, 'vibro-page')
  })
})
