import { expect, test } from '@playwright/test'

import { loginWithNewAccount } from './helpers/auth'
import { navigateInApp } from './helpers/navigation'

const TEST_PASSWORD = 'correct horse battery staple'
const PASSWORD_KDF_STORAGE_KEY = 'adm-password-kdf'

test.describe('Password session regressions', () => {
  test('requires the password again after a full reload and unlocks the same account', async ({
    page
  }) => {
    const invalidHashErrors: string[] = []
    page.on('pageerror', (error) => {
      if (error.message.includes('Invalid password hash')) invalidHashErrors.push(error.message)
    })

    await loginWithNewAccount(page)
    await navigateInApp(page, '/options')

    await page.getByLabel('Stay logged in').click()
    const passwordDialog = page.locator('.password-set-dialog')
    await expect(passwordDialog).toBeVisible()
    await passwordDialog.locator('input[autocomplete="new-password"]').fill(TEST_PASSWORD)
    await passwordDialog.getByRole('button', { name: 'Set', exact: true }).click()
    await expect(passwordDialog).toBeHidden({ timeout: 30_000 })

    const descriptorBeforeReload = await page.evaluate(
      (key) => localStorage.getItem(key),
      PASSWORD_KDF_STORAGE_KEY
    )
    expect(descriptorBeforeReload).not.toBeNull()

    await page.reload({ waitUntil: 'domcontentloaded' })

    const passwordInput = page.locator('.login-form input[autocomplete="new-password"]')
    await expect(passwordInput).toBeVisible()
    await expect(page.getByRole('button', { name: 'Unlock', exact: true })).toBeVisible()
    await passwordInput.fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Unlock', exact: true }).click()
    await page.waitForURL(/\/chats(?:\/.*)?$/, { timeout: 90_000 })

    expect(invalidHashErrors).toEqual([])
  })

  test('clears a legacy encrypted cache without a KDF descriptor and requires a passphrase', async ({
    page
  }) => {
    await page.goto('/')

    await page.evaluate(
      async ({ descriptorKey }) => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('adm', 1)
          request.onerror = () => reject(request.error)
          request.onsuccess = () => resolve(request.result)
          request.onupgradeneeded = () => {
            const openedDb = request.result
            for (const storeName of ['security', 'common', 'chatList']) {
              if (!openedDb.objectStoreNames.contains(storeName)) {
                openedDb.createObjectStore(storeName, { keyPath: 'name', autoIncrement: true })
              }
            }
          }
        })

        const transaction = db.transaction(['security', 'common', 'chatList'], 'readwrite')
        transaction.objectStore('security').put({ name: 'passphrase', value: new Uint8Array([1]) })
        transaction.objectStore('common').put({ name: 'adm', value: new Uint8Array([2]) })
        transaction.objectStore('chatList').put({ name: 'chat', value: new Uint8Array([3]) })
        await new Promise<void>((resolve, reject) => {
          transaction.oncomplete = () => resolve()
          transaction.onerror = () => reject(transaction.error)
          transaction.onabort = () => reject(transaction.error)
        })
        db.close()

        // Write the legacy persistence flag last. The already running application may persist its
        // current default while the asynchronous IndexedDB fixture is being prepared.
        localStorage.setItem('adm', JSON.stringify({ options: { stayLoggedIn: true } }))
        localStorage.removeItem(descriptorKey)
      },
      { descriptorKey: PASSWORD_KDF_STORAGE_KEY }
    )

    await page.reload({ waitUntil: 'domcontentloaded' })

    await expect(page.locator('input[autocomplete="current-password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Unlock', exact: true })).toHaveCount(0)

    await expect
      .poll(() =>
        page.evaluate(() => {
          const persisted = localStorage.getItem('adm')
          if (!persisted) return false

          return JSON.parse(persisted).options?.stayLoggedIn
        })
      )
      .toBe(false)

    await expect
      .poll(
        () =>
          page.evaluate(async () => {
            const db = await new Promise<IDBDatabase>((resolve, reject) => {
              const request = indexedDB.open('adm', 1)
              request.onerror = () => reject(request.error)
              request.onsuccess = () => resolve(request.result)
            })
            const transaction = db.transaction(['security', 'common', 'chatList'], 'readonly')
            const count = (storeName: string) =>
              new Promise<number>((resolve, reject) => {
                const request = transaction.objectStore(storeName).count()
                request.onerror = () => reject(request.error)
                request.onsuccess = () => resolve(request.result)
              })

            const counts = await Promise.all(['security', 'common', 'chatList'].map(count))
            db.close()
            return counts
          }),
        { timeout: 10_000 }
      )
      .toEqual([0, 0, 0])
  })
})
