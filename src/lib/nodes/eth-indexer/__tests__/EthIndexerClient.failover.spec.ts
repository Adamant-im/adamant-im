import { beforeEach, describe, expect, it, vi } from 'vitest'

const nodeRequestMock = vi.fn()

/**
 * A node stub carrying just enough of `Node` for the real `requestWithRetry`
 * and node selection to run: this suite exercises the failover itself, so
 * `abstract.client` is deliberately not mocked
 */
vi.mock('../EthIndexer', () => ({
  EthIndexer: class {
    url: string
    active = true
    online = true
    outOfSync = false
    hasSupportedProtocol = true
    initialHealthcheckInProgress = false
    healthcheckAttemptCount = 0
    ping = 1

    constructor(endpoint: { url: string }) {
      this.url = endpoint.url
    }

    hasMinNodeVersion() {
      return true
    }

    getStatus() {
      return { url: this.url, online: this.online, ping: this.ping }
    }

    onStatusChange() {}

    startHealthcheck() {
      return Promise.resolve()
    }

    request(...args: unknown[]) {
      return nodeRequestMock(this.url, ...args)
    }
  }
}))

import { EthIndexerClient } from '../EthIndexerClient'

const ADDRESS = '0x7e0Bd3F27EC0997A3B17045023097372b4c563B3'
const SLOW_NODE = 'https://slow.example.com'
const FAST_NODE = 'https://fast.example.com'

/** PostgREST reports a PostgreSQL statement timeout as HTTP 500 with SQLSTATE 57014 */
function statementTimeoutError() {
  return {
    isAxiosError: true,
    message: 'Request failed with status code 500',
    request: {},
    response: {
      status: 500,
      data: {
        code: '57014',
        message: 'canceling statement due to statement timeout',
        details: null,
        hint: null
      }
    }
  }
}

function makeRawTx(time: number) {
  return {
    txhash: `0x${time.toString(16)}`,
    txfrom: ADDRESS,
    txto: '0x0000000000000000000000000000000000000000',
    value: 1,
    gas: 21000,
    gasprice: 1,
    time,
    block: 1,
    contract_to: '',
    contract_value: 0
  }
}

const THIRD_NODE = 'https://third.example.com'

describe('EthIndexerClient.confirmHistoryEnd', () => {
  let client: EthIndexerClient

  /** A probe that asks the node for history and agrees when there is none */
  const probe = async (session: { getTransactions: EthIndexerClient['getTransactions'] }) => {
    const transactions = await session.getTransactions({ address: ADDRESS, decimals: 18 })

    return transactions.length === 0
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    client = new EthIndexerClient([
      { url: SLOW_NODE },
      { url: FAST_NODE },
      { url: THIRD_NODE }
    ] as never)
    await client.ready
  })

  it('holds when every other node agrees', async () => {
    nodeRequestMock.mockResolvedValue([])

    await expect(client.confirmHistoryEnd(SLOW_NODE, probe)).resolves.toBe(true)

    // Only the other two were asked, never the node that reached the conclusion
    expect(new Set(nodeRequestMock.mock.calls.map(([url]) => url))).toEqual(
      new Set([FAST_NODE, THIRD_NODE])
    )
  })

  it('fails as soon as one node has more history', async () => {
    nodeRequestMock.mockImplementation((url: string) =>
      Promise.resolve(url === FAST_NODE ? [makeRawTx(1700000000)] : [])
    )

    await expect(client.confirmHistoryEnd(SLOW_NODE, probe)).resolves.toBe(false)
  })

  it('postpones the conclusion when an eligible node is unavailable while another confirms', async () => {
    nodeRequestMock.mockImplementation((url: string) =>
      url === FAST_NODE ? Promise.reject(statementTimeoutError()) : Promise.resolve([])
    )

    await expect(client.confirmHistoryEnd(SLOW_NODE, probe)).resolves.toBe(false)
  })

  it('postpones the conclusion when an eligible node is out of sync while another confirms', async () => {
    for (const node of client.nodes) {
      if (node.url === FAST_NODE) node.outOfSync = true
    }
    nodeRequestMock.mockImplementation((url: string) =>
      url === THIRD_NODE ? Promise.resolve([]) : Promise.reject(new Error('should not be called'))
    )

    await expect(client.confirmHistoryEnd(SLOW_NODE, probe)).resolves.toBe(false)
  })

  it('does not hold when no other node could answer at all', async () => {
    // A pruned node alone must not decide the end of history for everyone
    nodeRequestMock.mockRejectedValue(statementTimeoutError())

    await expect(client.confirmHistoryEnd(SLOW_NODE, probe)).resolves.toBe(false)
  })

  it('holds when no other node can ever answer here', async () => {
    // Disabled by the user: the remaining node is the whole network
    for (const node of client.nodes) {
      if (node.url !== SLOW_NODE) node.active = false
    }

    await expect(client.confirmHistoryEnd(SLOW_NODE, probe)).resolves.toBe(true)
    expect(nodeRequestMock).not.toHaveBeenCalled()
  })

  it('does not count a node on an unsupported protocol', async () => {
    for (const node of client.nodes) {
      if (node.url !== SLOW_NODE) node.hasSupportedProtocol = false
    }

    await expect(client.confirmHistoryEnd(SLOW_NODE, probe)).resolves.toBe(true)
  })

  it('postpones the conclusion while the other nodes are merely offline', async () => {
    // They may be the deep ones: the node that happens to be reachable does not
    // get to decide for them
    for (const node of client.nodes) {
      if (node.url !== SLOW_NODE) node.online = false
    }

    await expect(client.confirmHistoryEnd(SLOW_NODE, probe)).resolves.toBe(false)
    expect(nodeRequestMock).not.toHaveBeenCalled()
  })

  it('propagates an error that is not about availability', async () => {
    nodeRequestMock.mockRejectedValue({
      isAxiosError: true,
      message: 'Request failed with status code 400',
      request: {},
      response: { status: 400, data: { code: '42703', message: 'column does not exist' } }
    })

    await expect(client.confirmHistoryEnd(SLOW_NODE, probe)).rejects.toMatchObject({
      response: { status: 400 }
    })
  })
})

describe('EthIndexerClient node failover', () => {
  let client: EthIndexerClient

  beforeEach(async () => {
    vi.clearAllMocks()
    client = new EthIndexerClient([{ url: SLOW_NODE }, { url: FAST_NODE }] as never)
    // `watchNodeStatusChange` resolves `ready` once the stubs report in
    await client.ready

    // Pick by ping instead of at random, so the timing-out node is always first
    client.useFastest = true
    for (const node of client.nodes) {
      node.ping = node.url === SLOW_NODE ? 1 : 2
    }
  })

  it('retries a PostgREST statement timeout on another indexer', async () => {
    nodeRequestMock.mockImplementation((url: string) => {
      if (url === SLOW_NODE) return Promise.reject(statementTimeoutError())
      return Promise.resolve([makeRawTx(1700000000)])
    })

    const result = await client.getTransactions({ address: ADDRESS, decimals: 18 })

    expect(result).toHaveLength(1)
    // The timing-out node was tried and the healthy one served the query
    expect(nodeRequestMock.mock.calls.some(([url]) => url === SLOW_NODE)).toBe(true)
    expect(nodeRequestMock.mock.calls.some(([url]) => url === FAST_NODE)).toBe(true)

    const slowNode = client.nodes.find((node) => node.url === SLOW_NODE)
    expect(slowNode?.online).toBe(false)
  })

  it('pins every request of one walk to a single indexer', async () => {
    nodeRequestMock.mockResolvedValue([makeRawTx(1700000000)])

    const urls: string[] = []

    await client.walkHistory(async (session) => {
      urls.push(session.node)
      // Native ETH: two halves, then an exact-timestamp group page
      await session.getTransactions({ address: ADDRESS, decimals: 18 })
      await session.getTimestampGroup({ address: ADDRESS, time: 1700000000, decimals: 18 })
    })

    // Three requests, one node: a boundary or offset is only valid within one dataset
    expect(nodeRequestMock).toHaveBeenCalledTimes(3)
    expect(new Set(nodeRequestMock.mock.calls.map(([url]) => url)).size).toBe(1)
    expect(urls).toEqual([SLOW_NODE])
  })

  it('does not fan out address queries to secondary indexers during history pagination', async () => {
    nodeRequestMock.mockResolvedValue([makeRawTx(1700000000)])

    await client.walkHistory(async (session) => {
      await session.getTransactions({ address: ADDRESS, decimals: 18 })
    })

    // Only the pinned node was contacted; secondary nodes received 0 address queries
    const contactedNodes = new Set(nodeRequestMock.mock.calls.map(([url]) => url))
    expect(contactedNodes.size).toBe(1)
    expect(contactedNodes.has(SLOW_NODE)).toBe(true)
    expect(contactedNodes.has(FAST_NODE)).toBe(false)
    expect(contactedNodes.has(THIRD_NODE)).toBe(false)
  })

  it('restarts the walk on another indexer instead of continuing across datasets', async () => {
    let failuresLeft = 1
    nodeRequestMock.mockImplementation((url: string) => {
      if (url === SLOW_NODE && failuresLeft > 0) {
        failuresLeft -= 1
        return Promise.reject(statementTimeoutError())
      }
      return Promise.resolve([makeRawTx(1700000000)])
    })

    const attempts: string[] = []

    await client.walkHistory(async (session) => {
      attempts.push(session.node)
      await session.getTransactions({ address: ADDRESS, decimals: 18 })
    })

    // The walk was re-entered from the beginning, with a fresh node
    expect(attempts).toEqual([SLOW_NODE, FAST_NODE])
  })

  it('does not swallow other indexer errors', async () => {
    const badRequest = {
      isAxiosError: true,
      message: 'Request failed with status code 400',
      request: {},
      response: { status: 400, data: { code: '42703', message: 'column does not exist' } }
    }
    nodeRequestMock.mockRejectedValue(badRequest)

    await expect(client.getTransactions({ address: ADDRESS, decimals: 18 })).rejects.toMatchObject({
      response: { status: 400 }
    })

    // A genuine query error must not take the node offline
    expect(client.nodes.every((node) => node.online)).toBe(true)
  })
})
