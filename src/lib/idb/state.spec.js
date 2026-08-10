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

const { saveState } = await vi.importActual('./state')

describe('IndexedDB state persistence', () => {
  beforeEach(() => {
    chatsSaveAllMock.mockReset().mockResolvedValue(undefined)
    loggerErrorMock.mockReset()
    modulesSaveAllMock.mockReset().mockResolvedValue(undefined)
    securitySaveAllMock.mockReset().mockResolvedValue(undefined)
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
