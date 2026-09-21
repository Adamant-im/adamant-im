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
