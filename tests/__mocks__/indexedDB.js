import { vi } from 'vitest'

vi.mock('@/lib/idb', () => ({
  clearDb: () => Promise.resolve()
}))
vi.mock('@/lib/idb/state', () => ({
  modules: [],
  restoreState: vi.fn(() => Promise.resolve()),
  saveState: vi.fn(() => Promise.resolve())
}))
vi.mock('@/lib/idb/crypto', () => ({
  encryptPassword: vi.fn(),
  decryptPassword: vi.fn()
}))
vi.mock('@/lib/idb/db', () => ({}))
vi.mock('@/lib/idb/stores/Chats', () => ({}))
vi.mock('@/lib/idb/stores/Modules', () => ({
  default: {
    getAll: vi.fn(() => Promise.resolve([])),
    saveAll: vi.fn(() => Promise.resolve())
  }
}))
vi.mock('@/lib/idb/stores/Security', () => ({}))
