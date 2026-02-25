import { expect, vi } from 'vitest'
import { config as testUtilsConfig } from '@vue/test-utils'
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

const ensureMediaDevicesApi = () => {
  if (!globalThis.navigator) {
    return
  }

  const hasMediaDevices =
    globalThis.navigator.mediaDevices &&
    typeof globalThis.navigator.mediaDevices.enumerateDevices === 'function'

  if (hasMediaDevices) return

  Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    value: {
      enumerateDevices: vi.fn(async () => []),
      getUserMedia: vi.fn(async () => ({
        getTracks: () => []
      }))
    },
    configurable: true
  })
}

const ensureCanvasContextApi = () => {
  const context2d = {
    createImageData: vi.fn((width = 1, height = 1) => ({
      data: new Uint8ClampedArray(width * height * 4)
    })),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: vi.fn(),
    drawImage: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    setTransform: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 }))
  }

  if (!globalThis.HTMLCanvasElement) {
    return
  }

  Object.defineProperty(globalThis.HTMLCanvasElement.prototype, 'getContext', {
    value: vi.fn(() => context2d),
    configurable: true
  })
}

const knownVueNoise = [
  'Failed to resolve component: v-',
  'injection "Symbol(router)" not found',
  'Invalid watch source:',
  'Missing required prop:'
]
const knownIntlifyNoise = ['Legacy API mode has been deprecated in v11', 'Detected HTML in']
const knownRuntimeNoise = [
  "Not implemented: HTMLCanvasElement's getContext() method",
  "Cannot read properties of undefined (reading 'enumerateDevices')",
  'Failed setting prop "prefix" on <v-textarea-stub>',
  'Could not parse CSS stylesheet'
]

const shouldIgnoreLog = (args) => {
  const message = args
    .map((arg) => (typeof arg === 'string' ? arg : arg?.message || String(arg)))
    .join(' ')

  return [...knownVueNoise, ...knownIntlifyNoise, ...knownRuntimeNoise].some((sample) =>
    message.includes(sample)
  )
}

const originalWarn = console.warn.bind(console)
const originalError = console.error.bind(console)

console.warn = (...args) => {
  if (shouldIgnoreLog(args)) return
  originalWarn(...args)
}

console.error = (...args) => {
  if (shouldIgnoreLog(args)) return
  originalError(...args)
}

testUtilsConfig.global.config = {
  ...(testUtilsConfig.global.config || {}),
  warnHandler: (message) => {
    if (shouldIgnoreLog([message])) return
    originalWarn(`[Vue warn]: ${message}`)
  }
}

ensureMediaDevicesApi()
ensureCanvasContextApi()

expect.addSnapshotSerializer(vueSnapshotSerializer)
globalThis.jest = vi
