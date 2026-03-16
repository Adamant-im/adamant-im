/**
 * Tests for the usePublicKeyFetch composable.
 *
 * Covers:
 *   - Initial reactive state
 *   - createChat() success / failure paths (all error types)
 *   - shouldDisableInput computed reactivity
 *   - areAdmNodesOnline watcher retry logic (all branch conditions)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'

// vi.mock hoisted before any import of the mocked module
vi.mock('@/lib/vibrate', () => ({
  vibrate: { long: vi.fn() }
}))

import { vibrate } from '@/lib/vibrate'
import { usePublicKeyFetch } from '../composables/usePublicKeyFetch'

// ─── Constants ───────────────────────────────────────────────────────────────

const PARTNER_ID = 'U111111111111111111'
const WELCOME_CHAT_ID = 'chats.virtual.welcome_message_title'

/**
 * Must match what t('chats.no_public_key') returns inside the composable.
 * Defined once here so tests and the inline i18n fixture stay in sync.
 */
const NO_PUBLIC_KEY_MSG = 'This address is not active yet. Cannot start a chat'

// ─── i18n fixture ────────────────────────────────────────────────────────────

const i18nPlugin = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: { chats: { no_public_key: NO_PUBLIC_KEY_MSG } }
  }
})

// ─── Vuex store factory ──────────────────────────────────────────────────────

interface StoreOptions {
  publicKeys?: Record<string, string>
  createChatAction?: ReturnType<typeof vi.fn>
}

function makeStore({
  publicKeys = {},
  createChatAction = vi.fn().mockResolvedValue('pubkey')
}: StoreOptions = {}) {
  return createStore({
    state: { publicKeys: { ...publicKeys } },
    mutations: {
      setPublicKey(state: any, { address, key }: { address: string; key: string }) {
        state.publicKeys[address] = key
      }
    },
    modules: {
      nodes: {
        namespaced: true,
        state: () => ({ adm: [] as Array<{ url: string; status: string }> }),
        getters: { adm: (s: any) => s.adm },
        mutations: {
          setAdmNodes(s: any, nodes: Array<{ url: string; status: string }>) {
            s.adm = nodes
          }
        }
      },
      chat: {
        namespaced: true,
        getters: { getPartnerName: () => () => 'Test Partner' },
        actions: { createChat: createChatAction as any }
      }
    }
  })
}

type TestStore = ReturnType<typeof makeStore>

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setNodeStatus(store: TestStore, status: 'online' | 'offline') {
  store.commit('nodes/setAdmNodes', [{ url: 'https://node.example', status }])
}

function clearNodeStatus(store: TestStore) {
  store.commit('nodes/setAdmNodes', [])
}

function mountComposable(partnerId: string, store: TestStore) {
  const Comp = defineComponent({
    setup() {
      return usePublicKeyFetch(partnerId)
    },
    template: '<div />'
  })
  return mount(Comp, { global: { plugins: [store, i18nPlugin] } })
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('usePublicKeyFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Initial state ──────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('isGettingPublicKey starts as false', () => {
      const wrapper = mountComposable(PARTNER_ID, makeStore())
      expect(wrapper.vm.isGettingPublicKey).toBe(false)
    })

    it('isKeyMissing starts as false', () => {
      const wrapper = mountComposable(PARTNER_ID, makeStore())
      expect(wrapper.vm.isKeyMissing).toBe(false)
    })

    it('shouldDisableInput is true when public key is absent from store', () => {
      const wrapper = mountComposable(PARTNER_ID, makeStore())
      expect(wrapper.vm.shouldDisableInput).toBe(true)
    })

    it('shouldDisableInput is false when public key already exists in store', () => {
      const store = makeStore({ publicKeys: { [PARTNER_ID]: 'abc123pubkey' } })
      const wrapper = mountComposable(PARTNER_ID, store)
      expect(wrapper.vm.shouldDisableInput).toBe(false)
    })
  })

  // ── createChat() ──────────────────────────────────────────────────────────

  describe('createChat()', () => {
    it('sets isGettingPublicKey to true synchronously on call', async () => {
      const store = makeStore({ createChatAction: vi.fn(() => new Promise(() => {})) })
      const wrapper = mountComposable(PARTNER_ID, store)

      wrapper.vm.createChat()

      // isGettingPublicKey.value = true is set synchronously before dispatch settles
      expect(wrapper.vm.isGettingPublicKey).toBe(true)
    })

    it('resets isGettingPublicKey to false after a successful dispatch', async () => {
      const store = makeStore({ createChatAction: vi.fn().mockResolvedValue('pubkey') })
      const wrapper = mountComposable(PARTNER_ID, store)

      wrapper.vm.createChat()
      expect(wrapper.vm.isGettingPublicKey).toBe(true)

      await flushPromises()

      expect(wrapper.vm.isGettingPublicKey).toBe(false)
    })

    it('keeps isKeyMissing false after a successful dispatch', async () => {
      const store = makeStore({ createChatAction: vi.fn().mockResolvedValue('pubkey') })
      const wrapper = mountComposable(PARTNER_ID, store)

      wrapper.vm.createChat()
      await flushPromises()

      expect(wrapper.vm.isKeyMissing).toBe(false)
    })

    it('does NOT call vibrate.long on success', async () => {
      const store = makeStore({ createChatAction: vi.fn().mockResolvedValue('pubkey') })
      const wrapper = mountComposable(PARTNER_ID, store)

      wrapper.vm.createChat()
      await flushPromises()

      expect(vibrate.long).not.toHaveBeenCalled()
    })

    // ── no_public_key error ──────────────────────────────────────────────────

    it('resets isGettingPublicKey to false on no_public_key error', async () => {
      const store = makeStore({
        createChatAction: vi.fn().mockRejectedValue(new Error(NO_PUBLIC_KEY_MSG))
      })
      const wrapper = mountComposable(PARTNER_ID, store)

      wrapper.vm.createChat()
      await flushPromises()

      expect(wrapper.vm.isGettingPublicKey).toBe(false)
    })

    it('sets isKeyMissing to true on no_public_key error', async () => {
      const store = makeStore({
        createChatAction: vi.fn().mockRejectedValue(new Error(NO_PUBLIC_KEY_MSG))
      })
      const wrapper = mountComposable(PARTNER_ID, store)

      wrapper.vm.createChat()
      await flushPromises()

      expect(wrapper.vm.isKeyMissing).toBe(true)
    })

    it('calls vibrate.long on no_public_key error', async () => {
      const store = makeStore({
        createChatAction: vi.fn().mockRejectedValue(new Error(NO_PUBLIC_KEY_MSG))
      })
      const wrapper = mountComposable(PARTNER_ID, store)

      wrapper.vm.createChat()
      await flushPromises()

      expect(vibrate.long).toHaveBeenCalledOnce()
    })

    // ── arbitrary network / transient error (the fixed bug path) ────────────

    it('resets isGettingPublicKey to false on any unrelated error (bug fix)', async () => {
      const store = makeStore({
        createChatAction: vi.fn().mockRejectedValue(new Error('Network timeout'))
      })
      const wrapper = mountComposable(PARTNER_ID, store)

      wrapper.vm.createChat()
      await flushPromises()

      expect(wrapper.vm.isGettingPublicKey).toBe(false)
    })

    it('keeps isKeyMissing false on an unrelated error (bug fix)', async () => {
      const store = makeStore({
        createChatAction: vi.fn().mockRejectedValue(new Error('Request timeout'))
      })
      const wrapper = mountComposable(PARTNER_ID, store)

      wrapper.vm.createChat()
      await flushPromises()

      expect(wrapper.vm.isKeyMissing).toBe(false)
    })

    it('calls vibrate.long on any dispatch error', async () => {
      const store = makeStore({
        createChatAction: vi.fn().mockRejectedValue(new Error('Some network error'))
      })
      const wrapper = mountComposable(PARTNER_ID, store)

      wrapper.vm.createChat()
      await flushPromises()

      expect(vibrate.long).toHaveBeenCalledOnce()
    })

    it('dispatches with the provided partnerName', async () => {
      const createChatSpy = vi.fn().mockResolvedValue('pubkey')
      const store = makeStore({ createChatAction: createChatSpy })
      const wrapper = mountComposable(PARTNER_ID, store)

      wrapper.vm.createChat('Alice')
      await flushPromises()

      const payload = createChatSpy.mock.calls[0][1]
      expect(payload).toMatchObject({ partnerId: PARTNER_ID, partnerName: 'Alice' })
    })

    it('dispatches with empty partnerName when none provided', async () => {
      const createChatSpy = vi.fn().mockResolvedValue('pubkey')
      const store = makeStore({ createChatAction: createChatSpy })
      const wrapper = mountComposable(PARTNER_ID, store)

      wrapper.vm.createChat()
      await flushPromises()

      const payload = createChatSpy.mock.calls[0][1]
      expect(payload).toMatchObject({ partnerId: PARTNER_ID, partnerName: '' })
    })
  })

  // ── shouldDisableInput reactive computed ──────────────────────────────────

  describe('shouldDisableInput reactivity', () => {
    it('is true when isGettingPublicKey is true', async () => {
      const store = makeStore({ createChatAction: vi.fn(() => new Promise(() => {})) })
      const wrapper = mountComposable(PARTNER_ID, store)

      wrapper.vm.createChat()

      expect(wrapper.vm.shouldDisableInput).toBe(true)
    })

    it('remains true while isGettingPublicKey is true even when key is already in store', async () => {
      const store = makeStore({
        publicKeys: { [PARTNER_ID]: 'existing-key' },
        createChatAction: vi.fn(() => new Promise(() => {}))
      })
      const wrapper = mountComposable(PARTNER_ID, store)

      wrapper.vm.createChat()

      expect(wrapper.vm.isGettingPublicKey).toBe(true)
      expect(wrapper.vm.shouldDisableInput).toBe(true)
    })

    it('is true when isKeyMissing is true', async () => {
      const store = makeStore({
        createChatAction: vi.fn().mockRejectedValue(new Error(NO_PUBLIC_KEY_MSG))
      })
      const wrapper = mountComposable(PARTNER_ID, store)

      wrapper.vm.createChat()
      await flushPromises()

      expect(wrapper.vm.shouldDisableInput).toBe(true)
    })

    it('remains true when isKeyMissing is true regardless of key in store', async () => {
      const store = makeStore({
        publicKeys: { [PARTNER_ID]: 'some-key' },
        createChatAction: vi.fn().mockRejectedValue(new Error(NO_PUBLIC_KEY_MSG))
      })
      const wrapper = mountComposable(PARTNER_ID, store)

      wrapper.vm.createChat()
      await flushPromises()

      expect(wrapper.vm.isKeyMissing).toBe(true)
      expect(wrapper.vm.shouldDisableInput).toBe(true)
    })

    it('becomes false when public key is committed to the store', async () => {
      const store = makeStore()
      const wrapper = mountComposable(PARTNER_ID, store)

      expect(wrapper.vm.shouldDisableInput).toBe(true)

      store.commit('setPublicKey', { address: PARTNER_ID, key: 'abc123' })
      await flushPromises()

      expect(wrapper.vm.shouldDisableInput).toBe(false)
    })

    it('becomes false after successful createChat and key committed to store', async () => {
      const store = makeStore({
        createChatAction: vi.fn().mockResolvedValue('pubkey')
      })
      const wrapper = mountComposable(PARTNER_ID, store)

      wrapper.vm.createChat()
      await flushPromises()

      // Simulate the real action committing the key
      store.commit('setPublicKey', { address: PARTNER_ID, key: 'abc123' })
      await flushPromises()

      expect(wrapper.vm.shouldDisableInput).toBe(false)
    })
  })

  // ── areAdmNodesOnline watcher ─────────────────────────────────────────────

  describe('areAdmNodesOnline watcher', () => {
    it('retries createChat when isGettingPublicKey is true and nodes come online', async () => {
      const createChatSpy = vi.fn(() => new Promise(() => {})) // never resolves
      const store = makeStore({ createChatAction: createChatSpy })
      const wrapper = mountComposable(PARTNER_ID, store)

      // Start a stuck in-flight fetch
      wrapper.vm.createChat()
      expect(wrapper.vm.isGettingPublicKey).toBe(true)

      createChatSpy.mockClear()

      // Nodes come back online
      setNodeStatus(store, 'online')
      await flushPromises()

      expect(createChatSpy).toHaveBeenCalledOnce()
    })

    it('retries createChat when key is absent from store and nodes come online (needsKeyFetch)', async () => {
      const createChatSpy = vi.fn().mockResolvedValue('pubkey')
      const store = makeStore({ createChatAction: createChatSpy })
      const wrapper = mountComposable(PARTNER_ID, store)

      // Preconditions: no key in store, not already fetching
      expect(wrapper.vm.shouldDisableInput).toBe(true)
      expect(wrapper.vm.isGettingPublicKey).toBe(false)

      setNodeStatus(store, 'online')
      await flushPromises()

      expect(createChatSpy).toHaveBeenCalledOnce()
    })

    it('passes correct partnerId and partnerName to the retried dispatch', async () => {
      const createChatSpy = vi.fn<(ctx: unknown, payload: unknown) => Promise<never>>(
        () => new Promise(() => {})
      )
      const store = makeStore({ createChatAction: createChatSpy as any })
      const wrapper = mountComposable(PARTNER_ID, store)

      wrapper.vm.createChat()
      createChatSpy.mockClear()

      setNodeStatus(store, 'online')
      await flushPromises()

      expect(createChatSpy).toHaveBeenCalledOnce()
      const payload = createChatSpy.mock.calls[0][1]
      expect(payload).toMatchObject({ partnerId: PARTNER_ID, partnerName: 'Test Partner' })
    })

    it('does NOT retry createChat when isKeyMissing is true (permanent failure)', async () => {
      const createChatSpy = vi.fn().mockRejectedValueOnce(new Error(NO_PUBLIC_KEY_MSG))
      const store = makeStore({ createChatAction: createChatSpy })
      const wrapper = mountComposable(PARTNER_ID, store)

      // Mark key as permanently missing
      wrapper.vm.createChat()
      await flushPromises()
      expect(wrapper.vm.isKeyMissing).toBe(true)

      createChatSpy.mockClear()

      setNodeStatus(store, 'online')
      await flushPromises()

      expect(createChatSpy).not.toHaveBeenCalled()
    })

    it('does NOT retry createChat when public key is already in store', async () => {
      const createChatSpy = vi.fn().mockResolvedValue('pubkey')
      const store = makeStore({
        publicKeys: { [PARTNER_ID]: 'existing-key' },
        createChatAction: createChatSpy
      })
      mountComposable(PARTNER_ID, store)

      setNodeStatus(store, 'online')
      await flushPromises()

      expect(createChatSpy).not.toHaveBeenCalled()
    })

    it('does NOT retry createChat for the welcome chat partner', async () => {
      const createChatSpy = vi.fn().mockResolvedValue('pubkey')
      const store = makeStore({ createChatAction: createChatSpy })
      mountComposable(WELCOME_CHAT_ID, store)

      setNodeStatus(store, 'online')
      await flushPromises()

      expect(createChatSpy).not.toHaveBeenCalled()
    })

    it('does nothing when nodes go offline (watcher guard returns early)', async () => {
      const createChatSpy = vi.fn().mockResolvedValue('pubkey')
      const store = makeStore({ createChatAction: createChatSpy })

      // Start with online nodes so the transition is offline
      setNodeStatus(store, 'online')
      mountComposable(PARTNER_ID, store)
      createChatSpy.mockClear()

      setNodeStatus(store, 'offline')
      await flushPromises()

      expect(createChatSpy).not.toHaveBeenCalled()
    })

    it('does not retry after key is stored (offline → online cycle, second transition)', async () => {
      const createChatSpy = vi.fn().mockResolvedValue('pubkey')
      const store = makeStore({ createChatAction: createChatSpy })
      mountComposable(PARTNER_ID, store)

      // First online: key is missing → creates chat
      setNodeStatus(store, 'online')
      await flushPromises()
      expect(createChatSpy).toHaveBeenCalledOnce()

      // Simulate the action having committed the key
      store.commit('setPublicKey', { address: PARTNER_ID, key: 'abc123' })
      createChatSpy.mockClear()

      // Go offline then online again
      clearNodeStatus(store)
      await flushPromises()
      setNodeStatus(store, 'online')
      await flushPromises()

      expect(createChatSpy).not.toHaveBeenCalled()
    })

    it('retries when previously stuck (isGettingPublicKey=true) regardless of store key absence', async () => {
      // Scenario: two concurrent conditions are true simultaneously —
      // isGettingPublicKey AND no public key in store.
      // The watcher should still call createChat exactly once.
      const createChatSpy = vi.fn(() => new Promise(() => {}))
      const store = makeStore({ createChatAction: createChatSpy })
      const wrapper = mountComposable(PARTNER_ID, store)

      wrapper.vm.createChat() // stuck
      createChatSpy.mockClear()

      setNodeStatus(store, 'online')
      await flushPromises()

      expect(createChatSpy).toHaveBeenCalledOnce()
    })
  })
})
