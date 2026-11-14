import { beforeEach, describe, expect, it, vi } from 'vitest'

const { chatsSaveAllMock, loggerErrorMock, modulesSaveAllMock, securitySaveAllMock } = vi.hoisted(
  () => ({
    chatsSaveAllMock: vi.fn(),
    loggerErrorMock: vi.fn(),
    modulesSaveAllMock: vi.fn(),
    securitySaveAllMock: vi.fn()
  })
)

vi.mock('./stores/Modules', () => ({
  default: { saveAll: modulesSaveAllMock }
}))

vi.mock('./stores/Chats', () => ({
  default: { saveAll: chatsSaveAllMock }
}))

vi.mock('./stores/Security', () => ({
  default: { saveAll: securitySaveAllMock }
}))

vi.mock('@/utils/devTools/logger', () => ({
  logger: { error: loggerErrorMock }
}))

const { saveState, toPersistedModule } = await vi.importActual('./state')

describe('toPersistedModule', () => {
  it('drops the transactions of a crypto module and the bottom that depends on them', () => {
    const doge = {
      address: 'D-address',
      transactions: { tx: { hash: 'tx' } },
      bottomReached: true,
      oldTxState: { node: 'https://indexer.example.com', generation: 1, offset: 40 },
      newTxCatchUp: { target: 'known', node: 'https://indexer.example.com' },
      historySession: { node: 'https://indexer.example.com', generation: 1 },
      balance: 5
    }

    expect(toPersistedModule('doge', doge)).toEqual({
      address: 'D-address',
      transactions: {},
      bottomReached: false,
      oldTxState: null,
      newTxCatchUp: null,
      historySession: null,
      balance: 5
    })
    // The live state is left alone
    expect(doge.bottomReached).toBe(true)
    expect(doge.oldTxState).toEqual({
      node: 'https://indexer.example.com',
      generation: 1,
      offset: 40
    })
    expect(doge.newTxCatchUp).toEqual({
      target: 'known',
      node: 'https://indexer.example.com'
    })
    expect(doge.historySession).toEqual({
      node: 'https://indexer.example.com',
      generation: 1
    })
    expect(doge.transactions).toEqual({ tx: { hash: 'tx' } })
  })

  it('keeps the height boundaries the modules reset themselves', () => {
    const eth = { transactions: {}, transactionsCount: 60, maxHeight: 5, minHeight: 1 }

    expect(toPersistedModule('eth', eth)).toMatchObject({
      transactionsCount: 60,
      maxHeight: 5,
      minHeight: 1
    })
  })

  it('does not add a bottom to a module that has none', () => {
    expect(toPersistedModule('eth', { transactions: {} })).not.toHaveProperty('bottomReached')
  })

  it('leaves a module that is not a crypto untouched', () => {
    const delegates = { delegates: { a: 1 }, bottomReached: true }

    expect(toPersistedModule('delegates', delegates)).toEqual(delegates)
  })
})

describe('IndexedDB state persistence', () => {
  beforeEach(() => {
    chatsSaveAllMock.mockReset().mockResolvedValue(undefined)
    loggerErrorMock.mockReset()
    modulesSaveAllMock.mockReset().mockResolvedValue(undefined)
    securitySaveAllMock.mockReset().mockResolvedValue(undefined)
  })

  it('persists crypto modules without the pagination state of their transactions', async () => {
    const store = {
      state: {
        chat: { chats: {} },
        doge: { transactions: { tx: { hash: 'tx' } }, bottomReached: true, address: 'D' },
        passphrase: '',
        balance: 0,
        address: '',
        publicKeys: {}
      },
      commit: vi.fn()
    }

    await saveState(store)

    const saved = modulesSaveAllMock.mock.calls[0][0]
    expect(saved.find((module) => module.name === 'doge').value).toEqual({
      transactions: {},
      bottomReached: false,
      address: 'D'
    })
  })

  it('rejects non-cloneable chat state and logs the affected module', async () => {
    const store = {
      state: {
        chat: {
          chats: {},
          transformMessage: () => undefined
        },
        passphrase: '',
        balance: 0,
        address: '',
        publicKeys: {}
      },
      commit: vi.fn()
    }

    await expect(saveState(store)).rejects.toMatchObject({ name: 'DataCloneError' })

    expect(loggerErrorMock).toHaveBeenCalledWith(
      'idb-state',
      'Failed to clone "chat" module for IndexedDB persistence',
      expect.objectContaining({ name: 'DataCloneError' })
    )
    expect(modulesSaveAllMock).not.toHaveBeenCalled()
    expect(chatsSaveAllMock).not.toHaveBeenCalled()
    expect(securitySaveAllMock).not.toHaveBeenCalled()
    expect(store.commit).not.toHaveBeenCalled()
  })
})
