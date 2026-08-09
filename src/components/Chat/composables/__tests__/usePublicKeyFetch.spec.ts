import { describe, expect, it, vi, beforeEach } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'

const MISMATCH = 'The node returned a public key that does not match this address.'
const NO_KEY = 'No public key'

const publicKeys: Record<string, string | undefined> = {}
const nodes = ref([{ status: 'online' }])
const dispatch = vi.fn()

vi.mock('vuex', () => ({
  useStore: () => ({
    state: { publicKeys },
    getters: {
      'nodes/adm': nodes.value,
      'chat/getPartnerName': () => 'Partner'
    },
    dispatch
  })
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => (key === 'chats.public_key_mismatch' ? MISMATCH : NO_KEY)
  })
}))

vi.mock('@/lib/chat/meta/utils', () => ({ isWelcomeChat: () => false }))
vi.mock('@/lib/vibrate', () => ({ vibrate: { long: vi.fn() } }))

const { usePublicKeyFetch } = await import('../usePublicKeyFetch')

const PARTNER = 'U1234567890'

/** Mounts the composable so its refs and watcher live in a real component scope */
const setup = () => {
  let api: ReturnType<typeof usePublicKeyFetch>

  const wrapper = mount(
    defineComponent({
      setup() {
        api = usePublicKeyFetch(PARTNER)
        return () => h('div')
      }
    })
  )

  return { api: api!, wrapper }
}

beforeEach(() => {
  dispatch.mockReset()
  delete publicKeys[PARTNER]
})

describe('usePublicKeyFetch — public key mismatch', () => {
  it('blocks the composer and shows a persistent message', async () => {
    dispatch.mockRejectedValueOnce(new Error(MISMATCH))

    const { api } = setup()
    api.createChat()
    await nextTick()
    await nextTick()

    expect(api.isKeyMismatch.value).toBe(true)
    expect(api.shouldDisableInput.value).toBe(true)
    expect(dispatch).toHaveBeenCalledWith('snackbar/show', {
      message: MISMATCH,
      timeout: 0
    })
  })

  it('does not mark the account as missing a key', async () => {
    dispatch.mockRejectedValueOnce(new Error(MISMATCH))

    const { api } = setup()
    api.createChat()
    await nextTick()
    await nextTick()

    // `isKeyMissing` drives the "account is not activated" placeholder and permanently
    // suppresses retries. A wrong answer from one node is neither of those things.
    expect(api.isKeyMissing.value).toBe(false)
  })

  it('can be retried, so "try another node" is actionable', async () => {
    dispatch.mockRejectedValueOnce(new Error(MISMATCH))

    const { api } = setup()
    api.createChat()
    await nextTick()
    await nextTick()
    expect(api.isKeyMismatch.value).toBe(true)

    // A second attempt, as the node watcher would make after the node set changes
    dispatch.mockResolvedValueOnce(undefined)
    api.createChat()
    await nextTick()

    expect(api.isKeyMismatch.value).toBe(false)

    await nextTick()
    expect(api.isKeyMismatch.value).toBe(false)
  })

  it('still treats a missing on-chain key as permanent', async () => {
    dispatch.mockRejectedValueOnce(new Error(NO_KEY))

    const { api } = setup()
    api.createChat()
    await nextTick()
    await nextTick()

    expect(api.isKeyMissing.value).toBe(true)
    expect(api.isKeyMismatch.value).toBe(false)
    // No snackbar: the placeholder already explains this case
    expect(dispatch).not.toHaveBeenCalledWith('snackbar/show', expect.anything())
  })
})
