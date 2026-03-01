import { expect, test, type Locator, type Page } from '@playwright/test'

const loginWithNewAccount = async (page: Page) => {
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

const assertSplitShellVisible = async (page: Page) => {
  await expect(page.locator('.sidebar')).toBeVisible()
  await expect(page.locator('.sidebar__aside')).toBeVisible()
  await expect(page.locator('.sidebar__layout')).toBeVisible()

  const paneMetrics = await page.evaluate(() => {
    const aside = document.querySelector<HTMLElement>('.sidebar__aside')
    const layout = document.querySelector<HTMLElement>('.sidebar__layout')

    return {
      asideHeight: aside?.clientHeight ?? 0,
      layoutHeight: layout?.clientHeight ?? 0
    }
  })

  expect(paneMetrics.asideHeight).toBeGreaterThan(0)
  expect(paneMetrics.layoutHeight).toBeGreaterThan(0)
  expect(Math.abs(paneMetrics.asideHeight - paneMetrics.layoutHeight)).toBeLessThanOrEqual(2)
}

const getOverflowY = async (locator: Locator) => {
  return locator.evaluate((el) => getComputedStyle(el).overflowY)
}

test.describe('Split-view layout regressions', () => {
  test('keeps independent pane scrolling on chats, account and settings', async ({ page }) => {
    await loginWithNewAccount(page)

    const chatsList = page.locator('.chats-view__messages--chat')
    await expect(chatsList).toBeVisible()
    await expect(page.locator('.sidebar__router-view--logo img')).toBeVisible()
    expect(['auto', 'scroll']).toContain(await getOverflowY(chatsList))

    await assertSplitShellVisible(page)
    await assertNoDocumentScrollLeak(page)

    await page.goto('/home')
    await expect(page).toHaveURL(/\/home$/)
    await expect(page.locator('.account-view')).toBeVisible()

    await assertSplitShellVisible(page)
    await assertNoDocumentScrollLeak(page)

    await page.goto('/options')
    await expect(page).toHaveURL(/\/options$/)
    await expect(page.locator('.settings-view')).toBeVisible()

    const layout = page.locator('.sidebar__layout')
    const layoutCanScroll = await layout.evaluate((el) => el.scrollHeight > el.clientHeight + 1)

    if (layoutCanScroll) {
      await layout.evaluate((el) => {
        el.scrollTop = 400
      })

      await expect.poll(() => layout.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
    }

    await assertSplitShellVisible(page)
    await assertNoDocumentScrollLeak(page)
  })
})
