import { config as loadEnv } from 'dotenv'
import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { loginWithPassphrase } from './helpers/auth'

loadEnv({ path: '.env.local' })

const testPassphrase = process.env.ADM_TEST_ACCOUNT_PK?.trim()

const attachPageScreenshot = async (page: Page, testInfo: TestInfo, name: string) => {
  const body = await page.screenshot({ fullPage: true })

  await testInfo.attach(name, {
    body,
    contentType: 'image/png'
  })
}

const openControllableChat = async (page: Page) => {
  test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

  await loginWithPassphrase(page, testPassphrase!)

  await page.goto('/chats')
  await expect(page).toHaveURL(/\/chats$/)

  const chatItems = page.locator('.chats-view__messages--chat .v-list-item')
  await expect(chatItems.first()).toBeVisible()

  const selfChatItem = chatItems
    .filter({
      has: page.locator('.chat-brief__title', {
        hasText: /^You$/
      })
    })
    .first()

  if (await selfChatItem.count()) {
    await selfChatItem.click()
  } else {
    await chatItems.first().click()
  }

  await page.waitForURL(/\/chats\/[^/?#]+$/, { timeout: 90_000 })
  await expect(page.locator('.a-chat__body-messages').first()).toBeVisible()

  const partnerId = await page.evaluate(() => {
    return window.location.pathname.split('/').filter(Boolean).at(-1) || ''
  })

  if (!partnerId) {
    throw new Error('Failed to resolve opened chat partnerId')
  }

  return partnerId
}

type RuntimeMessage = {
  id: string
  senderId: string
  recipientId: string
  message: string
  status: 'PENDING' | 'REGISTERED' | 'REJECTED'
  timestamp: number
  type: string
  isReply?: boolean
  i18n?: boolean
  amount?: number
  hash?: string
  asset?: Record<string, unknown>
  recipientPublicKey?: string
  senderPublicKey?: string
}

const setChatScenario = async (
  page: Page,
  {
    partnerId,
    messages,
    pendingMessageIds = [],
    admOnline = false,
    ipfsOnline = false
  }: {
    partnerId: string
    messages: RuntimeMessage[]
    pendingMessageIds?: string[]
    admOnline?: boolean
    ipfsOnline?: boolean
  }
) => {
  await page.evaluate(
    ({ partnerId, messages, pendingMessageIds, admOnline, ipfsOnline }) => {
      const runtime = window as typeof window & {
        store?: {
          state: Record<string, any>
          commit: (type: string, payload?: unknown, options?: unknown) => void
        }
      }
      const store = runtime.store

      if (!store) {
        throw new Error('window.store is not available')
      }

      const userId = store.state.address
      const chatState = store.state.chat

      if (!chatState.chats[partnerId]) {
        store.commit('chat/createEmptyChat', partnerId)
      }

      chatState.chats[partnerId].messages = messages
      chatState.chats[partnerId].numOfNewMessages = 0
      chatState.chats[partnerId].offset = -1
      chatState.chats[partnerId].page = 0
      chatState.chats[partnerId].scrollPosition = 0
      chatState.pendingMessages = {}

      for (const messageId of pendingMessageIds) {
        chatState.pendingMessages[String(messageId)] = {
          recipientId: partnerId,
          timeout: window.setTimeout(() => {}, 60_000),
          type: 1
        }
      }

      chatState.isFulfilled = true
      store.state.options.useSocketConnection = false
      store.state.publicKeys[partnerId] = store.state.publicKeys[partnerId] || 'test-public-key'
      if (store.state.snackbar) {
        store.state.snackbar.show = false
        store.state.snackbar.message = ''
        store.state.snackbar.timeout = 0
      }

      store.state.nodes.adm = {
        'https://adm-e2e.local': {
          url: 'https://adm-e2e.local',
          type: 'adm',
          status: admOnline ? 'online' : 'offline',
          active: true
        }
      }
      store.state.nodes.ipfs = {
        'https://ipfs-e2e.local': {
          url: 'https://ipfs-e2e.local',
          type: 'ipfs',
          status: ipfsOnline ? 'online' : 'offline',
          active: true
        }
      }

      // keep route chat ours and clear any previous optimistic noise
      if (chatState.chats[userId]) {
        chatState.chats[userId].numOfNewMessages = 0
      }
    },
    { partnerId, messages, pendingMessageIds, admOnline, ipfsOnline }
  )
}

test.describe('Chat send status regressions', () => {
  test('shows grouped inline clock only for queued retry messages and keeps ungrouped text statuses in header', async ({
    page
  }, testInfo) => {
    const partnerId = await openControllableChat(page)
    const userId = await page.evaluate(() => (window as any).store.state.address as string)
    const base = Date.now() - 120_000

    await setChatScenario(page, {
      partnerId,
      messages: [
        {
          id: 'text-registered-head',
          senderId: userId,
          recipientId: partnerId,
          message: 'Registered head',
          status: 'REGISTERED',
          timestamp: base,
          type: 'message',
          isReply: false,
          i18n: false
        },
        {
          id: 'text-pending-grouped',
          senderId: userId,
          recipientId: partnerId,
          message: 'Grouped pending retry',
          status: 'PENDING',
          timestamp: base + 1_000,
          type: 'message',
          isReply: false,
          i18n: false
        },
        {
          id: 'text-rejected-single',
          senderId: userId,
          recipientId: partnerId,
          message: 'Rejected single',
          status: 'REJECTED',
          timestamp: base + 600_000,
          type: 'message',
          isReply: false,
          i18n: false
        },
        {
          id: 'text-pending-single',
          senderId: userId,
          recipientId: partnerId,
          message: 'Pending single',
          status: 'PENDING',
          timestamp: base + 1_200_000,
          type: 'message',
          isReply: false,
          i18n: false
        }
      ],
      pendingMessageIds: ['text-pending-grouped'],
      admOnline: false,
      ipfsOnline: false
    })

    await expect(page.locator('.a-chat__message[data-id="text-registered-head"]')).toBeVisible()
    await page.waitForTimeout(1_150)

    await expect(
      page.locator('.a-chat__message[data-id="text-rejected-single"] .a-chat__status .v-icon')
    ).toBeVisible()
    await expect(
      page.locator('.a-chat__message[data-id="text-pending-single"] .a-chat__status .v-icon')
    ).toBeVisible()

    await expect(
      page.locator('.a-chat__message[data-id="text-pending-grouped"] .a-chat__status .v-icon')
    ).toHaveCount(0)
    await expect(
      page.locator('.a-chat__message[data-id="text-pending-grouped"] .a-chat__message-card-header')
    ).toHaveCount(0)
    await expect(
      page.locator(
        '.a-chat__message-container:has(.a-chat__message[data-id="text-pending-grouped"]) .a-chat__inline-status--pending .v-icon'
      )
    ).toBeVisible()

    await attachPageScreenshot(page, testInfo, 'chat-send-status-text-states')
  })

  test('does not show grouped inline clock for normal fast pending messages outside retry queue', async ({
    page
  }) => {
    const partnerId = await openControllableChat(page)
    const userId = await page.evaluate(() => (window as any).store.state.address as string)
    const base = Date.now() - 120_000

    await setChatScenario(page, {
      partnerId,
      messages: [
        {
          id: 'text-fast-head',
          senderId: userId,
          recipientId: partnerId,
          message: 'Fast head',
          status: 'REGISTERED',
          timestamp: base,
          type: 'message',
          isReply: false,
          i18n: false
        },
        {
          id: 'text-fast-pending',
          senderId: userId,
          recipientId: partnerId,
          message: 'Fast grouped pending',
          status: 'PENDING',
          timestamp: base + 1_000,
          type: 'message',
          isReply: false,
          i18n: false
        }
      ],
      pendingMessageIds: [],
      admOnline: false,
      ipfsOnline: false
    })

    await expect(page.locator('.a-chat__message[data-id="text-fast-pending"]')).toBeVisible()
    await page.waitForTimeout(1_150)

    await expect(
      page.locator('.a-chat__message[data-id="text-fast-pending"] .a-chat__message-card-header')
    ).toHaveCount(0)
    await expect(
      page.locator(
        '.a-chat__message-container:has(.a-chat__message[data-id="text-fast-pending"]) .a-chat__inline-status--pending .v-icon'
      )
    ).toHaveCount(0)
  })

  test('opens rejected-message actions from both inline and header status icons without forcing snackbar', async ({
    page
  }, testInfo) => {
    const partnerId = await openControllableChat(page)
    const userId = await page.evaluate(() => (window as any).store.state.address as string)
    const base = Date.now() - 180_000

    await setChatScenario(page, {
      partnerId,
      messages: [
        {
          id: 'text-rejected-head',
          senderId: userId,
          recipientId: partnerId,
          message: 'Rejected head',
          status: 'REGISTERED',
          timestamp: base,
          type: 'message',
          isReply: false,
          i18n: false
        },
        {
          id: 'text-rejected-grouped',
          senderId: userId,
          recipientId: partnerId,
          message: 'Rejected grouped',
          status: 'REJECTED',
          timestamp: base + 1_000,
          type: 'message',
          isReply: false,
          i18n: false
        },
        {
          id: 'text-rejected-single',
          senderId: userId,
          recipientId: partnerId,
          message: 'Rejected single',
          status: 'REJECTED',
          timestamp: base + 90_000,
          type: 'message',
          isReply: false,
          i18n: false
        }
      ],
      pendingMessageIds: [],
      admOnline: false,
      ipfsOnline: false
    })

    await page.evaluate(() => {
      const runtime = window as typeof window & {
        store: {
          dispatch: (type: string, payload?: unknown) => unknown
        }
        __sendStatusSnackbarCalls?: unknown[]
      }

      runtime.__sendStatusSnackbarCalls = []

      const originalDispatch = runtime.store.dispatch.bind(runtime.store)

      runtime.store.dispatch = ((type: string, payload?: unknown) => {
        if (type === 'snackbar/show') {
          runtime.__sendStatusSnackbarCalls?.push(payload)
        }

        return originalDispatch(type, payload)
      }) as typeof runtime.store.dispatch
    })

    const getSnackbarCallCount = async () =>
      page.evaluate(() => ((window as any).__sendStatusSnackbarCalls as unknown[]).length)

    await expect(
      page.locator('.a-chat__message[data-id="text-rejected-grouped"] .a-chat__message-card-header')
    ).toHaveCount(0)
    await expect(
      page.locator(
        '.a-chat__message-container:has(.a-chat__message[data-id="text-rejected-grouped"]) .a-chat__inline-status--rejected .v-icon'
      )
    ).toBeVisible()
    await expect.poll(getSnackbarCallCount).toBe(0)

    await page
      .locator(
        '.a-chat__message-container:has(.a-chat__message[data-id="text-rejected-grouped"]) .a-chat__inline-status--rejected .v-icon'
      )
      .click()

    await expect(page.locator('.a-chat-message-status-note')).toBeVisible()
    await expect(page.locator('.message-actions-list')).toContainText('Retry')
    await expect(page.locator('.message-actions-list')).not.toContainText('Reply')
    await expect(page.locator('.a-chat-reaction-select')).toHaveCount(0)
    await expect.poll(getSnackbarCallCount).toBe(0)

    await page.keyboard.press('Escape')

    await page
      .locator('.a-chat__message[data-id="text-rejected-single"] .a-chat__status .v-icon')
      .click()

    await expect(page.locator('.a-chat-message-status-note')).toBeVisible()
    await expect(page.locator('.message-actions-list')).toContainText('Retry')
    await expect(page.locator('.message-actions-list')).not.toContainText('Reply')
    await expect(page.locator('.a-chat-reaction-select')).toHaveCount(0)
    await expect.poll(getSnackbarCallCount).toBe(0)

    await attachPageScreenshot(page, testInfo, 'chat-send-status-rejected-actions')
  })

  test('keeps grouped attachment messages showing header status and timestamp', async ({
    page
  }, testInfo) => {
    const partnerId = await openControllableChat(page)
    const userId = await page.evaluate(() => (window as any).store.state.address as string)
    const base = Date.now() - 90_000

    await setChatScenario(page, {
      partnerId,
      messages: [
        {
          id: 'attachment-head',
          senderId: userId,
          recipientId: partnerId,
          message: 'File one',
          status: 'REGISTERED',
          timestamp: base,
          type: 'attachment',
          isReply: false,
          asset: {
            files: [
              {
                cid: 'cid-head',
                name: 'report.pdf',
                extension: 'pdf',
                size: 128
              }
            ]
          },
          recipientPublicKey: 'pk',
          senderPublicKey: 'pk'
        },
        {
          id: 'attachment-grouped',
          senderId: userId,
          recipientId: partnerId,
          message: 'File two',
          status: 'PENDING',
          timestamp: base + 1_000,
          type: 'attachment',
          isReply: false,
          asset: {
            files: [
              {
                cid: 'cid-grouped',
                name: 'report-2.pdf',
                extension: 'pdf',
                size: 256
              }
            ]
          },
          recipientPublicKey: 'pk',
          senderPublicKey: 'pk'
        }
      ],
      pendingMessageIds: [],
      admOnline: false,
      ipfsOnline: false
    })

    await expect(page.locator('.a-chat__message[data-id="attachment-grouped"]')).toBeVisible()

    await expect(
      page.locator('.a-chat__message[data-id="attachment-grouped"] .a-chat__timestamp')
    ).toBeVisible()
    await expect(
      page.locator('.a-chat__message[data-id="attachment-grouped"] .a-chat__status .v-icon')
    ).toBeVisible()

    await attachPageScreenshot(page, testInfo, 'chat-send-status-attachments')
  })

  test('keeps grouped crypto messages showing header status and timestamp', async ({
    page
  }, testInfo) => {
    const partnerId = await openControllableChat(page)
    const userId = await page.evaluate(() => (window as any).store.state.address as string)
    const base = Date.now() - 90_000

    await setChatScenario(page, {
      partnerId,
      messages: [
        {
          id: 'crypto-head',
          senderId: userId,
          recipientId: partnerId,
          message: 'First crypto',
          status: 'REGISTERED',
          timestamp: base,
          type: 'ETH',
          isReply: false,
          amount: 0.1,
          hash: '0xabc123'
        },
        {
          id: 'crypto-grouped',
          senderId: userId,
          recipientId: partnerId,
          message: 'Second crypto',
          status: 'PENDING',
          timestamp: base + 1_000,
          type: 'ETH',
          isReply: false,
          amount: 0.2,
          hash: '0xabc456'
        }
      ],
      pendingMessageIds: [],
      admOnline: false,
      ipfsOnline: false
    })

    await expect(page.locator('.a-chat__message[data-id="crypto-grouped"]')).toBeVisible()

    await expect(
      page.locator('.a-chat__message[data-id="crypto-grouped"] .a-chat__timestamp')
    ).toBeVisible()
    await expect(
      page.locator('.a-chat__message[data-id="crypto-grouped"] .a-chat__status .v-icon')
    ).toBeVisible()

    await attachPageScreenshot(page, testInfo, 'chat-send-status-crypto')
  })

  test('renders a mixed send-status surface for text, attachment and crypto messages', async ({
    page
  }, testInfo) => {
    const partnerId = await openControllableChat(page)
    const userId = await page.evaluate(() => (window as any).store.state.address as string)
    const base = Date.now() - 300_000

    await setChatScenario(page, {
      partnerId,
      messages: [
        {
          id: 'matrix-text-head',
          senderId: userId,
          recipientId: partnerId,
          message: 'Matrix text head',
          status: 'REGISTERED',
          timestamp: base,
          type: 'message',
          isReply: false,
          i18n: false
        },
        {
          id: 'matrix-text-pending',
          senderId: userId,
          recipientId: partnerId,
          message: 'Matrix text pending',
          status: 'PENDING',
          timestamp: base + 1_000,
          type: 'message',
          isReply: false,
          i18n: false
        },
        {
          id: 'matrix-text-rejected',
          senderId: userId,
          recipientId: partnerId,
          message: 'Matrix text rejected',
          status: 'REJECTED',
          timestamp: base + 90_000,
          type: 'message',
          isReply: false,
          i18n: false
        },
        {
          id: 'matrix-attachment',
          senderId: userId,
          recipientId: partnerId,
          message: 'Matrix attachment',
          status: 'PENDING',
          timestamp: base + 150_000,
          type: 'attachment',
          isReply: false,
          asset: {
            files: [
              {
                cid: 'matrix-cid',
                name: 'statement.pdf',
                extension: 'pdf',
                size: 256
              }
            ]
          },
          recipientPublicKey: 'pk',
          senderPublicKey: 'pk'
        },
        {
          id: 'matrix-crypto',
          senderId: userId,
          recipientId: partnerId,
          message: 'Matrix crypto',
          status: 'PENDING',
          timestamp: base + 210_000,
          type: 'ETH',
          isReply: false,
          amount: 0.3,
          hash: '0xmatrix'
        }
      ],
      pendingMessageIds: ['matrix-text-pending'],
      admOnline: false,
      ipfsOnline: false
    })

    await page.waitForTimeout(1_150)

    await expect(page.locator('.a-chat__message[data-id="matrix-text-head"]')).toBeVisible()
    await expect(page.locator('.a-chat__message[data-id="matrix-text-rejected"]')).toBeVisible()
    await expect(page.locator('.a-chat__message[data-id="matrix-attachment"]')).toBeVisible()
    await expect(page.locator('.a-chat__message[data-id="matrix-crypto"]')).toBeVisible()
    await expect(
      page.locator(
        '.a-chat__message-container:has(.a-chat__message[data-id="matrix-text-pending"]) .a-chat__inline-status--pending .v-icon'
      )
    ).toBeVisible()

    await attachPageScreenshot(page, testInfo, 'chat-send-status-matrix')
  })
})
