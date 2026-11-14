import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TransactionStatus } from '@/lib/constants'
import * as admApi from '@/lib/adamant-api'

const useQueryMock = vi.hoisted(() => vi.fn((options) => options))
const utilsMock = vi.hoisted(() => ({
  retryFactory: vi.fn(() => 'retry-sentinel'),
  retryDelayFactory: vi.fn(() => 'retry-delay-sentinel'),
  refetchIntervalFactory: vi.fn(() => 4321),
  refetchOnMountFn: vi.fn(() => true)
}))

vi.mock('@tanstack/vue-query', () => ({
  useQuery: useQueryMock
}))

vi.mock('vuex', () => ({
  useStore: () => ({
    state: {
      address: 'U123456789'
    }
  })
}))

vi.mock('./utils', () => utilsMock)
vi.mock('@/lib/adamant-api', () => ({
  getTransaction: vi.fn(),
  decodeTransaction: vi.fn()
}))
vi.mock('@/lib/constants', () => ({
  Cryptos: {
    ADM: 'ADM'
  },
  TransactionStatus: {
    CONFIRMED: 'CONFIRMED',
    REGISTERED: 'REGISTERED'
  }
}))

import { useAdmTransactionQuery } from './useAdmTransactionQuery'

describe('useAdmTransactionQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects an empty REST transaction instead of treating it as confirmed data', async () => {
    vi.mocked(admApi.getTransaction).mockResolvedValueOnce({} as any)
    useAdmTransactionQuery('adm-tx-id')
    const query = useQueryMock.mock.calls[0]?.[0]
    await expect(query.queryFn()).rejects.toThrow('missing ID')
  })

  it('polls pending ADM transactions and re-fetches them on remount until finalized', () => {
    useAdmTransactionQuery('adm-tx-id')
    const query = useQueryMock.mock.calls[0]?.[0]

    expect(useQueryMock).toHaveBeenCalledTimes(1)
    expect(query.queryKey).toEqual(['transaction', 'ADM', 'adm-tx-id'])
    expect(query.retry).toBe('retry-sentinel')
    expect(query.retryDelay).toBe('retry-delay-sentinel')
    expect(query.refetchOnWindowFocus).toBe(false)

    const refetchInterval = query.refetchInterval({
      state: {
        status: 'pending',
        data: {
          status: 'PENDING',
          timestamp: 1_710_000_000
        }
      }
    })
    expect(refetchInterval).toBe(4321)
    expect(utilsMock.refetchIntervalFactory).toHaveBeenCalledWith(
      'ADM',
      'pending',
      {
        status: 'PENDING',
        timestamp: 1_710_000_000
      },
      undefined
    )

    const refetchOnMount = query.refetchOnMount({
      state: {
        data: {
          status: 'REGISTERED'
        }
      }
    })
    expect(refetchOnMount).toBe(true)
    expect(utilsMock.refetchOnMountFn).toHaveBeenCalledWith({
      status: 'REGISTERED'
    })
  })

  it('derives live ADM statuses when node responses omit the status field', async () => {
    const confirmedTransaction = {
      id: 'confirmed-adm-tx',
      height: 42,
      confirmations: 3,
      amount: 200_000_000,
      fee: 50_000_000
    }
    vi.mocked(admApi.getTransaction).mockResolvedValueOnce(confirmedTransaction as any)
    vi.mocked(admApi.decodeTransaction).mockReturnValueOnce(confirmedTransaction as any)

    useAdmTransactionQuery('confirmed-adm-tx')
    const confirmedQuery = useQueryMock.mock.calls[0]?.[0]

    await expect(confirmedQuery.queryFn()).resolves.toMatchObject({
      status: TransactionStatus.CONFIRMED,
      amount: 2,
      fee: 0.5
    })

    vi.clearAllMocks()

    const registeredTransaction = {
      id: 'registered-adm-tx',
      height: 42,
      confirmations: 0,
      amount: 100_000_000,
      fee: 50_000_000
    }
    vi.mocked(admApi.getTransaction).mockResolvedValueOnce(registeredTransaction as any)
    vi.mocked(admApi.decodeTransaction).mockReturnValueOnce(registeredTransaction as any)

    useAdmTransactionQuery('registered-adm-tx')
    const registeredQuery = useQueryMock.mock.calls[0]?.[0]

    await expect(registeredQuery.queryFn()).resolves.toMatchObject({
      status: TransactionStatus.REGISTERED,
      amount: 1,
      fee: 0.5
    })
  })
})
