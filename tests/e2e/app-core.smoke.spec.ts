import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { loginWithNewAccount } from './helpers/auth'

const attachPageScreenshot = async (page: Page, testInfo: TestInfo, name: string) => {
  const body = await page.screenshot({ fullPage: true })

  await testInfo.attach(name, {
    body,
    contentType: 'image/png'
  })
}

test.describe('App core smoke checks', () => {
  test('navigates between Account, Chats and Settings', async ({ page }, testInfo) => {
    await loginWithNewAccount(page)

    const accountButton = page.getByRole('button', { name: 'Account' })
    const chatsButton = page.getByRole('button', { name: 'Chats' })
    const settingsButton = page.getByRole('button', { name: 'Settings' })

    await expect(accountButton).toBeVisible()
    await expect(chatsButton).toBeVisible()
    await expect(settingsButton).toBeVisible()

    await accountButton.click()
    await expect(page).toHaveURL(/\/home$/)
    await expect(page.locator('.account-view')).toBeVisible()

    await settingsButton.click()
    await expect(page).toHaveURL(/\/options$/)
    await expect(page.locator('.settings-view')).toBeVisible()

    await chatsButton.click()
    await expect(page).toHaveURL(/\/chats$/)
    await expect(page.locator('.chats-view__messages--chat')).toBeVisible()

    await attachPageScreenshot(page, testInfo, 'app-core-navigation')
  })
})
