import { vi } from 'vitest'
import './indexedDB'

vi.mock('@/main', () => ({
  default: { $on: vi.fn(), $off: vi.fn(), $emit: vi.fn() }
}))

// Universal crator of empty objects
const createRecursiveProxy = () => {
  const proxy = new Proxy(() => {}, {
    get: (target, prop) => {
      if (['map', 'forEach', 'filter', 'reduce', 'includes'].includes(prop)) {
        return () => []
      }
      if (prop === 'length') return 0
      return proxy
    },
    apply: () => proxy
  })
  return proxy
}

globalThis.config = createRecursiveProxy()

vi.mock('@/lib/nodes', () => ({
  adm: {},
  btc: {},
  eth: {},
  kly: {},
  lsk: {},
  doge: {},
  dash: {},
  bnb: {},
  ipfs: {}
}))

vi.mock('@/lib/nodes/ipfs/index', () => ({ ipfs: {} }))
vi.mock('@/lib/nodes/adm/index', () => ({ adm: {} }))
vi.mock('@/lib/nodes/kly-indexer/index', () => ({ klyIndexer: {} }))
