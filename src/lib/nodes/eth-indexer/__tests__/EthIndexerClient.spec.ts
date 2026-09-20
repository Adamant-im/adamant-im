import { beforeEach, describe, expect, it, vi } from 'vitest'

const requestMock = vi.fn()

vi.mock('../EthIndexer', () => ({
  EthIndexer: class {
    onStatusChange() {}
    startHealthcheck() {
      return Promise.resolve()
    }
  }
}))

vi.mock('@/lib/nodes/abstract.client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/nodes/abstract.client')>()

  return {
    Client: class extends actual.Client<any> {
      // Bypass node selection and health-check wiring in tests
      async requestWithRetry<T>(request: (node: unknown) => Promise<T>): Promise<T> {
        return request({})
      }
    }
  }
})

import { EthIndexerClient } from '../EthIndexerClient'
import type { Transaction } from '../types/api/get-transactions/transaction'

const ADDRESS = '0x7e0Bd3F27EC0997A3B17045023097372b4c563B3'
const TOKEN_CONTRACT = '0xdAC17F958D2ee523a2206206994597C13D831ec7'

let txCounter = 0

function makeRawTx(overrides: Partial<Transaction> = {}): Transaction {
  txCounter += 1
  const uniqueHash = `0x${txCounter.toString(16).padStart(64, '0')}`

  return {
    txhash: uniqueHash,
    txfrom: ADDRESS,
    txto: '0x0000000000000000000000000000000000000000',
    value: 1,
    gas: 21000,
    gasprice: 1,
    time: 1700000000,
    block: 1,
    contract_to: '',
    contract_value: 0,
    ...overrides
  } as Transaction
}

describe('EthIndexerClient.getTransactions', () => {
  let client: EthIndexerClient

  beforeEach(() => {
    vi.clearAllMocks()
    client = new EthIndexerClient([])
    // Accessing the private `request` in tests is intentional: it is the
    // single seam through which HTTP requests pass
    ;(client as unknown as { request: unknown }).request = requestMock
  })

  it('always sends limit for ERC-20 history', async () => {
    requestMock.mockResolvedValue([])

    await client.getTransactions({
      address: ADDRESS,
      contract: TOKEN_CONTRACT,
      decimals: 6
    })

    expect(requestMock).toHaveBeenCalledTimes(1)
    const [, params] = requestMock.mock.calls[0]
    expect(params.limit).toBe(25)
    expect(params.and).toContain(`txto.eq.${TOKEN_CONTRACT}`)
    expect(params.and).toContain(`txfrom.eq.${ADDRESS}`)
    expect(params.order).toBe('time.desc')
  })

  it('respects explicit limit for ERC-20 history', async () => {
    requestMock.mockResolvedValue([])

    await client.getTransactions({
      address: ADDRESS,
      contract: TOKEN_CONTRACT,
      limit: 10,
      decimals: 6
    })

    const [, params] = requestMock.mock.calls[0]
    expect(params.limit).toBe(10)
  })

  it('splits native ETH history into two bounded queries and merges them', async () => {
    requestMock.mockImplementation((_endpoint, params) => {
      if (params.and.includes('txfrom')) {
        return Promise.resolve([makeRawTx({ time: 1700000001 }), makeRawTx({ time: 1700000000 })])
      }
      return Promise.resolve([makeRawTx({ time: 1700000002 })])
    })

    const result = await client.getTransactions({ address: ADDRESS, decimals: 18 })

    expect(requestMock).toHaveBeenCalledTimes(2)

    const [senderParams, recipientParams] = requestMock.mock.calls.map((c) => c[1])
    expect(senderParams.and).toBe(`(txfrom.eq.${ADDRESS},contract_to.eq.)`)
    expect(recipientParams.and).toBe(`(txto.eq.${ADDRESS},contract_to.eq.)`)
    expect(senderParams.limit).toBe(25)
    expect(recipientParams.limit).toBe(25)

    // Merged in descending time order regardless of which side responded first
    expect(result.map((tx) => tx.time)).toEqual([1700000002, 1700000001, 1700000000])
  })

  it('applies from/to time filters to both native ETH queries', async () => {
    requestMock.mockResolvedValue([])

    await client.getTransactions({
      address: ADDRESS,
      decimals: 18,
      from: 1700000000,
      to: 1700000100
    })

    expect(requestMock).toHaveBeenCalledTimes(2)
    for (const call of requestMock.mock.calls) {
      const params = call[1]
      expect(params.and).toContain('time.gte.1700000000')
      expect(params.and).toContain('time.lte.1700000100')
    }
  })

  it('caps the merged result at the requested limit', async () => {
    requestMock.mockImplementation((_endpoint, params) => {
      const isSender = params.and.includes('txfrom')
      return Promise.resolve(
        Array.from({ length: 15 }, (_, i) =>
          makeRawTx({ time: 1700000000 - i + (isSender ? 0 : 0.5) })
        )
      )
    })

    const result = await client.getTransactions({ address: ADDRESS, decimals: 18, limit: 20 })

    expect(result).toHaveLength(20)
  })

  it('slices results to limit when both sides return full chunks', async () => {
    requestMock.mockImplementation((_endpoint, params) => {
      const isSender = params.and.includes('txfrom')
      const base = isSender ? 100 : 0
      return Promise.resolve(
        Array.from({ length: 15 }, (_, i) =>
          makeRawTx({
            time: 1700000000 - i - base,
            txhash: `0x${(base + i).toString(16).padStart(64, '0')}`
          })
        )
      )
    })

    const result = await client.getTransactions({ address: ADDRESS, decimals: 18, limit: 5 })

    expect(result).toHaveLength(5)
    // Strictly descending times: merged, deduplicated and sorted
    const times = result.map((tx) => tx.time)
    expect([...times].sort((a, b) => (b as number) - (a as number))).toEqual(times)
  })

  it('forwards the requested order to both native ETH queries', async () => {
    requestMock.mockResolvedValue([])

    await client.getTransactions({ address: ADDRESS, decimals: 18, order: 'time.asc' })

    expect(requestMock).toHaveBeenCalledTimes(2)
    for (const call of requestMock.mock.calls) {
      expect(call[1].order).toBe('time.asc')
    }
  })

  it('forwards the requested order to the ERC-20 query', async () => {
    requestMock.mockResolvedValue([])

    await client.getTransactions({
      address: ADDRESS,
      contract: TOKEN_CONTRACT,
      decimals: 6,
      order: 'time.asc'
    })

    const [, params] = requestMock.mock.calls[0]
    expect(params.order).toBe('time.asc')
  })

  it('keeps the oldest records when an ascending result is capped by limit', async () => {
    // Both sides return their own oldest chunk; the merged page must be the
    // oldest records overall, otherwise forward pagination skips history
    requestMock.mockImplementation((_endpoint, params) => {
      const isSender = params.and.includes('txfrom')
      const base = isSender ? 1700000000 : 1700000100

      return Promise.resolve(Array.from({ length: 5 }, (_, i) => makeRawTx({ time: base + i })))
    })

    const result = await client.getTransactions({
      address: ADDRESS,
      decimals: 18,
      limit: 3,
      order: 'time.asc'
    })

    expect(result.map((tx) => tx.time)).toEqual([1700000000, 1700000001, 1700000002])
  })

  it('deduplicates self-transfers returned by both sender and recipient queries', async () => {
    requestMock.mockResolvedValue([
      makeRawTx({ txhash: '0xself', time: 1700000001 }),
      makeRawTx({ txhash: '0xother', time: 1700000000 })
    ])

    const result = await client.getTransactions({ address: ADDRESS, decimals: 18 })

    expect(result.map((tx) => tx.hash)).toEqual(['0xself', '0xother'])
  })
})

describe('EthIndexerClient.getTimestampGroup', () => {
  let client: EthIndexerClient

  beforeEach(() => {
    vi.clearAllMocks()
    client = new EthIndexerClient([])
    ;(client as unknown as { request: unknown }).request = requestMock
  })

  it('queries one exact timestamp with a deterministic total order', async () => {
    requestMock.mockResolvedValue([])

    await client.getTimestampGroup({ address: ADDRESS, time: 1700000000, decimals: 18 })

    // A single query: an offset into one direction is not an offset into the merge
    expect(requestMock).toHaveBeenCalledTimes(1)
    const [, params] = requestMock.mock.calls[0]
    expect(params.and).toBe(
      `(contract_to.eq.,or(txfrom.eq.${ADDRESS},txto.eq.${ADDRESS}),time.gte.1700000000,time.lte.1700000000)`
    )
    expect(params.order).toBe('time.asc,txhash.asc')
    expect(params.limit).toBe(25)
    expect(params.offset).toBe(0)
  })

  it('forwards limit and offset for group paging', async () => {
    requestMock.mockResolvedValue([])

    await client.getTimestampGroup({
      address: ADDRESS,
      time: 1700000000,
      limit: 10,
      offset: 30,
      decimals: 18
    })

    const [, params] = requestMock.mock.calls[0]
    expect(params.limit).toBe(10)
    expect(params.offset).toBe(30)
  })

  it('constrains an ERC-20 group by the token contract', async () => {
    requestMock.mockResolvedValue([])

    await client.getTimestampGroup({
      address: ADDRESS,
      contract: TOKEN_CONTRACT,
      time: 1700000000,
      decimals: 6
    })

    const [, params] = requestMock.mock.calls[0]
    expect(params.and).toContain(`txto.eq.${TOKEN_CONTRACT}`)
    expect(params.and).toContain('time.gte.1700000000')
    expect(params.and).toContain('time.lte.1700000000')
  })

  it('returns normalized transactions', async () => {
    requestMock.mockResolvedValue([makeRawTx({ txhash: '0xabc', time: 1700000000 })])

    const result = await client.getTimestampGroup({
      address: ADDRESS,
      time: 1700000000,
      decimals: 18
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ hash: '0xabc', time: 1700000000 })
  })
})
