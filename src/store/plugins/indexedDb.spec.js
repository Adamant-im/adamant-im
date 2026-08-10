import { beforeEach, describe, expect, it, vi } from 'vitest'

const { clearDbMock, loadDescriptorMock, routerPushMock } = vi.hoisted(() => ({
  clearDbMock: vi.fn(),
  loadDescriptorMock: vi.fn(),
  routerPushMock: vi.fn()
}))

vi.mock('@/lib/idb', () => ({
  Modules: { set: vi.fn() },
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
  return {
    getters: {
      'options/isLoginViaPassword': true,
      isLogged: false
    },
    state: {
      password: '',
      IDBReady: false
    },
    dispatch: vi.fn(),
    commit: vi.fn(),
    subscribe: vi.fn()
  }
}

describe('indexed DB password startup', () => {
  beforeEach(() => {
    clearDbMock.mockReset().mockResolvedValue(undefined)
    loadDescriptorMock.mockReset()
    routerPushMock.mockReset()
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
})
