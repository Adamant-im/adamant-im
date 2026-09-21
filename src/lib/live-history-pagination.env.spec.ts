// @vitest-environment node
import { Buffer } from 'buffer'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { readLiveEnv, warnMissingLiveEnv } from '../../tests/shared/liveEnv'

// The node environment is what lets the real address derivation run; the node
// clients still expect a few browser globals, same as in live-send-builders
vi.hoisted(() => {
  const createStorage = () => {
    const storage = new Map<string, string>()

    return {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, String(value)),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear()
    }
  }
  const localStorage = createStorage()
  const sessionStorage = createStorage()

  Object.assign(globalThis, {
    window: { localStorage, sessionStorage },
    localStorage,
    sessionStorage,
    location: { protocol: 'https:' }
  })
  Object.defineProperty(globalThis, 'navigator', {
    value: { onLine: true },
    configurable: true
  })
})

// Breaks the transitive import cycle: this module imports `@/store`
vi.mock('@/lib/store-crypto-address', () => ({
  storeCryptoAddress: vi.fn(),
  validateStoredCryptoAddresses: vi.fn(),
  flushCryptoAddresses: vi.fn()
}))

vi.unmock('@/lib/nodes')
vi.unmock('@/lib/nodes/adm/index')
vi.unmock('@/lib/nodes/adm')
vi.unmock('@/lib/nodes/eth/index')
vi.unmock('@/lib/nodes/btc-indexer/index')
vi.unmock('@/lib/nodes/doge-indexer/index')
vi.unmock('@/lib/nodes/eth-indexer/index')

import adamant from '@/lib/adamant'
import adm from '@/lib/nodes/adm'
import ethIndexer from '@/lib/nodes/eth-indexer'
import btcIndexer from '@/lib/nodes/btc-indexer'
import dogeIndexer from '@/lib/nodes/doge-indexer'
import { CryptosInfo } from '@/lib/constants'
import createEthActions from '@/store/modules/eth-base/eth-base-actions'
import ethMutations from '@/store/modules/eth-base/eth-base-mutations'
import ethBaseState from '@/store/modules/eth-base/eth-base-state'
import btcActions from '@/store/modules/btc/btc-actions'
import btcMutations from '@/store/modules/btc/btc-mutations'
import btcState from '@/store/modules/btc/btc-state'
import dogeActions from '@/store/modules/doge/doge-actions'
import dogeMutations from '@/store/modules/doge/doge-mutations'
import dogeState from '@/store/modules/doge/doge-state'
import btcBaseGetters from '@/store/modules/btc-base/btc-base-getters'

/**
 * End-to-end history pagination against the production indexers, driven through
 * the real store actions and mutations with an account that has a long history.
 *
 * The indexers legitimately disagree — one ETH indexer is pruned, DOGE indexers
 * order same-timestamp transactions differently and one lists an extra record —
 * so every assertion is made against what the indexers themselves report,
 * measured directly per node, rather than against fixed counts.
 */
const passphrase = readLiveEnv('ADM_TEST_ACCOUNT_PK_HISTORY')
const liveDescribe = passphrase ? describe : describe.skip

warnMissingLiveEnv(
  'live-history-pagination',
  ['ADM_TEST_ACCOUNT_PK_HISTORY'],
  'Add the history account passphrase to .env.local to run these checks.'
)

const USDT = CryptosInfo.USDT as unknown as { contractId: string; decimals: number }
const PAGE_BUDGET = 60

type AnyClient = {
  nodes: Array<{ url: string }>
  getNode: (excluded?: Set<string>) => { url: string }
  isActiveNode: (node: unknown) => boolean
}

/**
 * Serves every walk from `pick()` whenever that node is available, and falls back
 * to the client's own selection otherwise. Confirmation still asks every other
 * active node, exactly as in production
 */
function steer(client: unknown, pick: () => string) {
  const target = client as AnyClient
  const original = target.getNode.bind(target)

  target.getNode = (excluded = new Set<string>()) => {
    const url = pick()
    const node = target.nodes.find((candidate) => candidate.url === url)

    if (node && !excluded.has(url) && target.isActiveNode(node)) return node

    return original(excluded)
  }

  return () => {
    target.getNode = original
  }
}

function createContext(mutations: Record<string, any>, state: Record<string, any>, getters = {}) {
  const context: any = {
    state,
    getters: {},
    commit: (name: string, payload: unknown) => mutations[name]?.(state, payload),
    dispatch: vi.fn(() => Promise.resolve())
  }

  for (const [name, getter] of Object.entries(getters)) {
    Object.defineProperty(context.getters, name, { get: () => (getter as any)(state) })
  }

  return context
}

async function publishedAddress(admAddress: string, key: string) {
  const response = await adm.get('/api/states/get', {
    senderId: admAddress,
    key,
    orderBy: 'timestamp:desc',
    limit: 20
  })

  return (response?.transactions ?? [])
    .map((tx: any) => tx?.asset?.state?.value)
    .find((value: unknown) => typeof value === 'string' && value.trim())
    ?.trim() as string | undefined
}

/** Every native (or ERC-20) transaction hash a given ETH indexer holds */
async function ethHashesOn(node: any, address: string, contract?: string) {
  const query = (and: string) =>
    node.request('GET /ethtxs', { and, order: 'time.desc', limit: 1000 }) as Promise<any[]>

  const rows = contract
    ? await query(
        `(txto.eq.${contract},or(txfrom.eq.${address},contract_to.eq.000000000000000000000000${address.replace('0x', '')}))`
      )
    : [
        ...(await query(`(txfrom.eq.${address},contract_to.eq.)`)),
        ...(await query(`(txto.eq.${address},contract_to.eq.)`))
      ]

  return new Set(rows.map((row) => row.txhash.replace(/^.*x/, '0x').toLowerCase()))
}

/** Every transaction hash a given BTC indexer holds, walking its whole chain */
async function btcHashesOn(node: any, address: string) {
  const hashes = new Set<string>()
  let cursor: string | undefined

  for (let page = 0; page < 200; page++) {
    const path = cursor ? `/address/${address}/txs/chain/${cursor}` : `/address/${address}/txs`
    const txs = (await node.request('GET', path)) as any[]
    if (txs.length === 0) break
    txs.forEach((tx) => hashes.add(tx.txid))
    cursor = txs[txs.length - 1].txid
    if (txs.length < 25) break
  }

  return hashes
}

/** Every transaction hash a given DOGE indexer lists, in its own order */
async function dogeHashesOn(node: any, address: string) {
  const hashes: string[] = []

  for (let from = 0; from < 5000; from += 50) {
    const page = await node.request('GET', `/api/addrs/${address}/txs`, { from, to: from + 50 })
    page.items.forEach((tx: any) => hashes.push(tx.txid))
    if (page.items.length === 0 || from + 50 >= page.totalItems) break
  }

  return hashes
}

/** Measures each node separately; a node that cannot answer is left out */
async function perNode<T>(client: { nodes: any[] }, measure: (node: any) => Promise<T>) {
  const results = new Map<string, T>()

  for (const node of client.nodes) {
    try {
      results.set(node.url, await measure(node))
    } catch {
      // Unavailable right now: it neither sets nor lowers the expectations
    }
  }

  return results
}

async function loadAllOlder(actions: any, context: any) {
  for (let call = 0; call < PAGE_BUDGET && !context.state.bottomReached; call++) {
    await actions.getOldTransactions(context)
  }
}

liveDescribe('live history pagination (history account)', () => {
  let ethAddress: string
  const ethActions = createEthActions({
    initTransaction: vi.fn(),
    createSpecificActions: () => ({})
  })

  beforeAll(async () => {
    const hash = new Uint8Array(
      Buffer.from(adamant.createPassphraseHash(passphrase!) as unknown as Uint8Array)
    )
    const keypair = adamant.makeKeypair(hash) as { publicKey: Uint8Array }
    const admAddress = adamant.getAddressFromPublicKey(new Uint8Array(keypair.publicKey))

    ethAddress = (await publishedAddress(admAddress, 'eth:address'))!
    expect(ethAddress).toBeTruthy()

    await Promise.all([ethIndexer.ready, btcIndexer.ready, dogeIndexer.ready])
  }, 120_000)

  const ethContext = (contractAddress?: string, decimals = 18) =>
    createContext(ethMutations, {
      ...ethBaseState(),
      crypto: contractAddress ? 'USDT' : 'ETH',
      address: ethAddress,
      contractAddress,
      decimals
    })

  it('loads the full native ETH history', async () => {
    const truth = await perNode(ethIndexer, (node) => ethHashesOn(node, ethAddress))
    const deepest = Math.max(...[...truth.values()].map((set) => set.size))
    const union = new Set([...truth.values()].flatMap((set) => [...set]))

    const context = ethContext()
    await ethActions.getNewTransactions(context)
    await loadAllOlder(ethActions, context)

    const loaded = new Set(Object.keys(context.state.transactions))
    expect(loaded.size).toBeGreaterThanOrEqual(deepest)
    for (const hash of union) expect(loaded.has(hash)).toBe(true)
    expect(context.state.bottomReached).toBe(true)
  }, 180_000)

  it('does not truncate ETH history when older pages come from a pruned indexer', async (ctx) => {
    const truth = await perNode(ethIndexer, (node) => ethHashesOn(node, ethAddress))
    const ranked = [...truth.entries()].sort((a, b) => a[1].size - b[1].size)
    const [prunedUrl, prunedSet] = ranked[0]
    const [fullUrl, fullSet] = ranked[ranked.length - 1]

    // Needs a node that really holds less; skip rather than pass vacuously
    if (prunedSet.size >= fullSet.size) ctx.skip()

    const context = ethContext()

    // The first chunk from the full node...
    let restore = steer(ethIndexer, () => fullUrl)
    await ethActions.getNewTransactions(context)
    restore()

    // ...and every older page served by the pruned one, which has nothing below
    // the full node's boundary
    restore = steer(ethIndexer, () => prunedUrl)
    try {
      await loadAllOlder(ethActions, context)
    } finally {
      restore()
    }

    const loaded = new Set(Object.keys(context.state.transactions))
    for (const hash of fullSet) expect(loaded.has(hash)).toBe(true)
    expect(context.state.bottomReached).toBe(true)
  }, 180_000)

  it('loads the full USDT history', async () => {
    const truth = await perNode(ethIndexer, (node) =>
      ethHashesOn(node, ethAddress, USDT.contractId)
    )
    const union = new Set([...truth.values()].flatMap((set) => [...set]))

    const context = ethContext(USDT.contractId, USDT.decimals)
    await ethActions.getNewTransactions(context)
    await loadAllOlder(ethActions, context)

    const loaded = new Set(Object.keys(context.state.transactions))
    for (const hash of union) expect(loaded.has(hash)).toBe(true)
    expect(context.state.bottomReached).toBe(true)
  }, 180_000)

  it('loads the full BTC history and closes a gap to known history', async () => {
    const context = createContext(btcMutations, btcState(), btcBaseGetters)
    btcActions.afterLogin.handler(context, passphrase!)

    const truth = await perNode(btcIndexer, (node) => btcHashesOn(node, context.state.address))
    const union = new Set([...truth.values()].flatMap((set) => [...set]))
    expect(union.size).toBeGreaterThan(25)

    // First visit: the newest page, then older history down to the bottom
    await btcActions.getNewTransactions(context)
    await loadAllOlder(btcActions, context)

    const loaded = new Set(Object.keys(context.state.transactions))
    for (const hash of union) expect(loaded.has(hash)).toBe(true)
    expect(context.state.bottomReached).toBe(true)

    // A later visit with transactions missing above the known history: only the
    // oldest part is kept, the rest has to be walked back to
    const all = Object.values(context.state.transactions) as any[]
    const sorted = all.sort((a, b) => b.timestamp - a.timestamp)
    const keep = sorted.slice(60)
    const revisit = createContext(btcMutations, btcState(), btcBaseGetters)
    btcActions.afterLogin.handler(revisit, passphrase!)
    for (const tx of keep) revisit.state.transactions[tx.hash] = tx

    for (let tick = 0; tick < 5; tick++) {
      await btcActions.getNewTransactions(revisit)
      if (!revisit.state.newTxCatchUp) break
    }

    const reloaded = new Set(Object.keys(revisit.state.transactions))
    for (const tx of sorted) expect(reloaded.has(tx.hash)).toBe(true)
    expect(revisit.state.newTxCatchUp).toBe(null)
  }, 300_000)

  it('loads the full DOGE history whichever indexer serves each window', async () => {
    const probe = createContext(dogeMutations, dogeState(), btcBaseGetters)
    dogeActions.afterLogin.handler(probe, passphrase!)
    const address = probe.state.address

    const truth = await perNode(dogeIndexer, (node) => dogeHashesOn(node, address))
    const lists = [...truth.values()]
    // Records every node lists; a record only some list may be a phantom entry
    const common = lists.reduce((acc, list) => acc.filter((hash) => list.includes(hash)), lists[0])
    expect(common.length).toBeGreaterThan(40)

    // Rotate the serving node window by window, once from every starting node.
    // The indexers order and list records differently, so a bare offset skips a
    // record whenever a boundary falls between two nodes that disagree there —
    // which boundary that is depends on the phase, so every phase is exercised
    const urls = [...truth.keys()]
    const missingByPhase: number[] = []

    for (let phase = 0; phase < urls.length; phase++) {
      const context = createContext(dogeMutations, dogeState(), btcBaseGetters)
      dogeActions.afterLogin.handler(context, passphrase!)

      let flip = phase
      const restore = steer(dogeIndexer, () => urls[flip++ % urls.length])

      try {
        await dogeActions.getNewTransactions(context)
        await loadAllOlder(dogeActions, context)
      } finally {
        restore()
      }

      const loaded = new Set(Object.keys(context.state.transactions))
      missingByPhase.push(common.filter((hash) => !loaded.has(hash)).length)
      expect(context.state.bottomReached).toBe(true)
    }

    expect(missingByPhase).toEqual(urls.map(() => 0))
  }, 900_000)

  it('survives a record one DOGE indexer flags as a double spend at a window start', async (ctx) => {
    const probe = createContext(dogeMutations, dogeState(), btcBaseGetters)
    dogeActions.afterLogin.handler(probe, passphrase!)
    const address = probe.state.address

    const truth = await perNode(dogeIndexer, (node) => dogeHashesOn(node, address))
    const lists = [...truth.entries()]
    const common = lists.reduce(
      (acc, [, list]) => acc.filter((hash) => list.includes(hash)),
      lists[0][1]
    )
    // A record only one node lists: `_mapTransaction` maps it to `undefined`
    const flagged = lists.find(([, list]) => list.some((hash) => !common.includes(hash)))
    if (!flagged) ctx.skip()

    const [flaggedUrl, flaggedList] = flagged!
    const at = flaggedList.findIndex((hash) => !common.includes(hash))

    // Real records to seed the store with, loaded the ordinary way
    await dogeActions.getNewTransactions(probe)
    await loadAllOlder(dogeActions, probe)

    // Seed exactly the records in front of it plus the overlap, so the next window
    // on that node starts at the flagged record itself
    const seed = flaggedList.filter((hash) => common.includes(hash)).slice(0, at + 5)
    const context = createContext(dogeMutations, dogeState(), btcBaseGetters)
    dogeActions.afterLogin.handler(context, passphrase!)
    for (const hash of seed) context.state.transactions[hash] = probe.state.transactions[hash]
    expect(Object.keys(context.state.transactions)).toHaveLength(at + 5)

    const restore = steer(dogeIndexer, () => flaggedUrl)
    try {
      await expect(dogeActions.getOldTransactions(context)).resolves.toBeUndefined()
    } finally {
      restore()
    }

    expect(Object.keys(context.state.transactions).length).toBeGreaterThan(at + 5)
  }, 600_000)
})
