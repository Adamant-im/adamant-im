import { describe, expect, it, vi } from 'vitest'

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
  }
}))

import { useAdmTransactionQuery } from './useAdmTransactionQuery'

describe('useAdmTransactionQuery', () => {
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
    expect(utilsMock.refetchIntervalFactory).toHaveBeenCalledWith('ADM', 'pending', {
      status: 'PENDING',
      timestamp: 1_710_000_000
    })

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
})
