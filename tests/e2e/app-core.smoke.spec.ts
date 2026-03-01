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

    const accountLink = page.getByRole('link', { name: 'Account' })
    const chatsLink = page.getByRole('link', { name: 'Chats' })
    const settingsLink = page.getByRole('link', { name: 'Settings' })

    await expect(accountLink).toBeVisible()
    await expect(chatsLink).toBeVisible()
    await expect(settingsLink).toBeVisible()

    await accountLink.click()
    await expect(page).toHaveURL(/\/home$/)
    await expect(page.locator('.account-view')).toBeVisible()

    await settingsLink.click()
    await expect(page).toHaveURL(/\/options$/)
    await expect(page.locator('.settings-view')).toBeVisible()

    await chatsLink.click()
    await expect(page).toHaveURL(/\/chats$/)
    await expect(page.locator('.chats-view__messages--chat')).toBeVisible()

    await attachPageScreenshot(page, testInfo, 'app-core-navigation')
  })
})
