// mock these modules to avoid `indexedDb` execution
jest.mock('@/lib/idb', () => ({
  clearDb: () => Promise.resolve()
}))
jest.mock('@/lib/idb/state', () => ({
  modules: []
}))
jest.mock('@/lib/idb/crypto', () => {})
jest.mock('@/lib/idb/db', () => {})
jest.mock('@/lib/idb/stores/Chats', () => {})
jest.mock('@/lib/idb/stores/Modules', () => {})
jest.mock('@/lib/idb/stores/Security', () => {})
