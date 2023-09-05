import { Browser, BrowserContext, chromium, expect, Page } from '@playwright/test'
import { afterAll, beforeAll, describe, test } from 'vitest'

describe('playwright meets vitest', () => {
  let page: Page
  let browser: Browser
  let context: BrowserContext

  beforeAll(async () => {
    browser = await chromium.launch()
    let context = await browser.newContext()
    page = await context.newPage()
  })

  afterAll(async () => {
    await browser.close()
  })

  test('has document title', async () => {
    await page.goto('https://dev.adamant.im/')

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/ADAMANT Messenger/)
  })

  test('display passphrase generator when clicking on "Create new"', async () => {
    await page.goto('https://dev.adamant.im/')

    // Click the get started link.
    await page.getByRole('button', { name: 'Create new' }).click()

    // Expects page to have a heading with the name of Installation.
    await expect(
      page.getByText(
        'Save the passphrase for your new wallet and account. You must use the passphrase only. If you lose it, there will be no way to recover it'
      )
    ).toBeVisible()
  })
})
