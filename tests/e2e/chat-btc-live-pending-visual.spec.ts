import { createHash } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import { loginWithPassphrase } from './helpers/auth'
import { testPassphrase } from './helpers/env'

const LIVE_TIMEOUT = 120_000
const RECIPIENT_ADM = 'U6386412615727665758'
const PENDING_TRANSACTION_STORAGE_KEY = 'PENDING_TRANSACTIONS'
const KEEP_OPEN = process.env.PLAYWRIGHT_KEEP_OPEN === '1'

const waitForBtcWalletReady = async (page: Page) => {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const runtime = window as Window & {
            store?: {
              state: Record<string, any>
            }
          }
          const store = runtime.store

          if (!store) {
            throw new Error('window.store is not available')
          }

          return {
            address: String(store.state.btc?.address ?? ''),
            balanceStatus: String(store.state.btc?.balanceStatus ?? '')
          }
        }),
      { timeout: LIVE_TIMEOUT }
    )
    .toMatchObject({
      balanceStatus: 'success'
    })

  return page.evaluate(() => {
    const runtime = window as Window & {
      store?: {
        state: Record<string, any>
      }
    }
    const store = runtime.store

    if (!store) {
      throw new Error('window.store is not available')
    }

    return {
      admAddress: String(store.state.address ?? ''),
      btcAddress: String(store.state.btc?.address ?? '')
    }
  })
}

const sendFraudBtcTransferMessage = async (
  page: Page,
  {
    hash,
    amount,
    comments
  }: {
    hash: string
    amount: string
    comments: string
  }
) => {
  const success = await page.evaluate(
    async ({ recipientId, hash, amount, comments }) => {
      const runtime = window as Window & {
        store?: {
          dispatch: (type: string, payload?: unknown) => Promise<unknown>
        }
      }
      const store = runtime.store

      if (!store) {
        throw new Error('window.store is not available')
      }

      return store.dispatch('sendCryptoTransferMessage', {
        address: recipientId,
        crypto: 'BTC',
        amount,
        hash,
        comments
      })
    },
    {
      recipientId: RECIPIENT_ADM,
      hash,
      amount,
      comments
    }
  )

  expect(success).toBe(true)
}

const saveBrowserPendingBtc = async (
  page: Page,
  {
    hash,
    senderId,
    recipientId,
    amount
  }: {
    hash: string
    senderId: string
    recipientId: string
    amount: number
  }
) => {
  await page.evaluate(
    ({ hash, senderId, recipientId, amount, storageKey }) => {
      const rawState = window.sessionStorage.getItem(storageKey)
      const state = rawState ? JSON.parse(rawState) : {}

      state.BTC = {
        id: hash,
        hash,
        senderId,
        recipientId,
        amount,
        fee: 0,
        status: 'PENDING',
        direction: 'from',
        timestamp: Date.now()
      }

      window.sessionStorage.setItem(storageKey, JSON.stringify(state))
    },
    {
      hash,
      senderId,
      recipientId,
      amount,
      storageKey: PENDING_TRANSACTION_STORAGE_KEY
    }
  )
}

const getChatTransferStatus = async (page: Page, comments: string) => {
  return page.evaluate(
    ({ partnerId, comments }) => {
      const runtime = window as Window & {
        store?: {
          state: Record<string, any>
        }
      }
      const store = runtime.store

      if (!store) {
        throw new Error('window.store is not available')
      }

      const messages = store.state.chat?.chats?.[partnerId]?.messages ?? []
      const transaction = [...messages]
        .reverse()
        .find(
          (message: Record<string, any>) =>
            message.type === 'BTC' && String(message.message) === comments
        )

      return transaction
        ? {
            id: String(transaction.id ?? ''),
            hash: String(transaction.hash ?? ''),
            status: String(transaction.status ?? ''),
            message: String(transaction.message ?? '')
          }
        : null
    },
    { partnerId: RECIPIENT_ADM, comments }
  )
}

test.describe('Live BTC pending chat status', () => {
  test('keeps a newly sent invalid BTC rich message pending in the live browser session when browser PendingTxStore knows it', async ({
    page
  }) => {
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    test.slow()

    await loginWithPassphrase(page, testPassphrase!)

    const { admAddress, btcAddress } = await waitForBtcWalletReady(page)
    expect(admAddress).not.toBe('')
    expect(btcAddress).not.toBe('')

    await page.goto(`/chats/${RECIPIENT_ADM}`, { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(new RegExp(`/chats/${RECIPIENT_ADM}$`))
    await expect(page.locator('.a-chat__body-messages').first()).toBeVisible()

    const hash = createHash('sha256')
      .update(`playwright-live-btc-pending-${Date.now()}`)
      .digest('hex')
    const comments = `Playwright live BTC pending ${Date.now()}`

    await saveBrowserPendingBtc(page, {
      hash,
      senderId: btcAddress,
      recipientId: btcAddress,
      amount: 1
    })

    await sendFraudBtcTransferMessage(page, {
      hash,
      amount: '1',
      comments
    })

    await expect
      .poll(() => getChatTransferStatus(page, comments), {
        timeout: LIVE_TIMEOUT
      })
      .toMatchObject({
        hash,
        status: 'PENDING'
      })

    const messageBody = page
      .locator('.a-chat__message-card-body')
      .filter({ hasText: comments })
      .last()
    await expect(messageBody).toBeVisible({ timeout: LIVE_TIMEOUT })

    await page.waitForTimeout(6_000)

    await expect
      .poll(() => getChatTransferStatus(page, comments), {
        timeout: 15_000
      })
      .toMatchObject({
        hash,
        status: 'PENDING'
      })

    if (KEEP_OPEN) {
      await page.pause()
      await new Promise(() => {})
    }
  })
})
