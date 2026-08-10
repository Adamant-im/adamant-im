import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { clearDbMock, loadDescriptorMock, modulesSetMock, routerPushMock } = vi.hoisted(() => ({
  clearDbMock: vi.fn(),
  loadDescriptorMock: vi.fn(),
  modulesSetMock: vi.fn(),
  routerPushMock: vi.fn()
}))

vi.mock('@/lib/idb', () => ({
  Modules: { set: modulesSetMock },
  Chats: { set: vi.fn(), saveAll: vi.fn() },
  Security: { set: vi.fn() },
  clearDb: clearDbMock
}))

vi.mock('@/lib/idb/passwordKdf', () => ({
  loadPasswordKdfDescriptor: loadDescriptorMock
}))

vi.mock('@/router', () => ({
  router: {
    push: routerPushMock
  }
}))

import indexedDbPlugin from './indexedDb'

function createStore() {
  let subscriber

  return {
    getters: {
      'options/isLoginViaPassword': true,
      isLogged: false
    },
    state: {
      password: '',
      IDBReady: false,
      chat: { chats: {} }
    },
    dispatch: vi.fn(),
    commit: vi.fn(),
    subscribe: vi.fn((callback) => {
      subscriber = callback
    }),
    notify(mutation) {
      subscriber(mutation, this.state)
    }
  }
}

describe('indexed DB password startup', () => {
  beforeEach(() => {
    clearDbMock.mockReset().mockResolvedValue(undefined)
    loadDescriptorMock.mockReset()
    modulesSetMock.mockReset().mockResolvedValue(undefined)
    routerPushMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('clears a legacy cache and returns to passphrase login when no KDF descriptor exists', async () => {
    loadDescriptorMock.mockReturnValue(null)
    const store = createStore()

    indexedDbPlugin(store)

    await vi.waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith('removePassword')
    })
    expect(store.commit).toHaveBeenCalledWith('reset')
    expect(routerPushMock).toHaveBeenCalledWith('/')
  })

  it('clears password state even when deleting the legacy cache fails', async () => {
    clearDbMock.mockRejectedValue(new Error('IndexedDB is unavailable'))
    loadDescriptorMock.mockReturnValue(null)
    const store = createStore()

    indexedDbPlugin(store)

    await vi.waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith('removePassword')
    })
    expect(store.commit).toHaveBeenCalledWith('reset')
    expect(routerPushMock).toHaveBeenCalledWith('/')
  })

  it('keeps a current encrypted cache ready for password entry after refresh', () => {
    loadDescriptorMock.mockReturnValue({ v: 1 })
    const store = createStore()

    indexedDbPlugin(store)

    expect(store.dispatch).not.toHaveBeenCalledWith('removePassword')
    expect(store.commit).not.toHaveBeenCalledWith('reset')
    expect(routerPushMock).not.toHaveBeenCalled()
  })

  it('persists one mutation exactly once within a password session', async () => {
    vi.useFakeTimers()
    loadDescriptorMock.mockReturnValue({ v: 1 })
    const store = createStore()

    indexedDbPlugin(store)

    store.state.password = '11'.repeat(32)
    store.state.IDBReady = true
    store.notify({ type: 'chat/setHeight' })

    await vi.runAllTicks()
    expect(modulesSetMock).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(60000)
    expect(modulesSetMock).toHaveBeenCalledTimes(1)
  })

  it('cancels writes queued under a password after that password session ends', async () => {
    vi.useFakeTimers()
    loadDescriptorMock.mockReturnValue({ v: 1 })
    const store = createStore()

    indexedDbPlugin(store)

    store.state.password = '11'.repeat(32)
    store.state.IDBReady = true
    store.notify({ type: 'chat/setHeight' })
    await vi.runAllTicks()
    expect(modulesSetMock).toHaveBeenCalledTimes(1)

    store.state.chat = { chats: {}, marker: 'must not persist' }
    store.notify({ type: 'chat/setHeight' })
    store.state.password = ''
    store.state.IDBReady = false
    store.notify({ type: 'resetPassword' })

    await vi.advanceTimersByTimeAsync(30000)
    expect(modulesSetMock).toHaveBeenCalledTimes(1)
  })
})
