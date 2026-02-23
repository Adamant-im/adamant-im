import { expect, vi } from 'vitest'
import vueSnapshotSerializer from 'jest-serializer-vue'
import '../__mocks__/globals'

const createMemoryStorage = () => {
  const storage = new Map()

  return {
    get length() {
      return storage.size
    },
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null
    },
    setItem(key, value) {
      storage.set(String(key), String(value))
    },
    removeItem(key) {
      storage.delete(String(key))
    },
    clear() {
      storage.clear()
    },
    key(index) {
      return [...storage.keys()][index] ?? null
    }
  }
}

// In Node-based test runners localStorage/sessionStorage can be present but incomplete.
const ensureStorageApi = (name) => {
  const candidate = globalThis[name]
  const hasStorageApi =
    candidate &&
    typeof candidate.getItem === 'function' &&
    typeof candidate.setItem === 'function' &&
    typeof candidate.removeItem === 'function' &&
    typeof candidate.clear === 'function'

  if (hasStorageApi) {
    return
  }

  Object.defineProperty(globalThis, name, {
    value: createMemoryStorage(),
    configurable: true,
    writable: true
  })
}

ensureStorageApi('localStorage')
ensureStorageApi('sessionStorage')

expect.addSnapshotSerializer(vueSnapshotSerializer)
globalThis.jest = vi
