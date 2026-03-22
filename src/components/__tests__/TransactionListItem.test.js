import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

let queryData
let queryIsFetching
let queryStatus

vi.mock('@/hooks/queries/transaction', () => {
  const createMockQuery = () => ({
    data: queryData,
    isFetching: queryIsFetching,
    status: queryStatus,
    refetch: vi.fn()
  })

  return {
    useTransactionQuery: vi.fn(() => createMockQuery()),
    useTransactionStatusQuery: vi.fn(() => createMockQuery()),
    useAdmTransactionQuery: vi.fn(() => createMockQuery()),
    useBtcTransactionQuery: vi.fn(() => createMockQuery()),
    useDogeTransactionQuery: vi.fn(() => createMockQuery()),
    useDashTransactionQuery: vi.fn(() => createMockQuery()),
    useEthTransactionQuery: vi.fn(() => createMockQuery()),
    useErc20TransactionQuery: vi.fn(() => () => createMockQuery())
  }
})

vi.mock('@/components/transactions/hooks/useClearPendingTransaction', () => ({
  useClearPendingTransaction: vi.fn()
}))

vi.mock('@/filters/date', () => ({
  default: vi.fn(() => 'Mar 09, 16:00')
}))

import TransactionListItem from '@/components/TransactionListItem.vue'

describe('TransactionListItem.vue', () => {
  beforeEach(() => {
    queryData = ref(undefined)
    queryIsFetching = ref(false)
    queryStatus = ref('success')
  })

  it('prefers live transaction fields over stale pending props and refetches history rates', async () => {
    const dispatchSpy = vi.fn()

    queryData.value = {
      id: 'tx-1',
      senderId: 'bc1sender',
      recipientId: 'bc1recipient',
      amount: 0.25,
      status: 'REGISTERED',
      timestamp: 1_710_000_000_000
    }

    const wrapper = mount(TransactionListItem, {
      shallow: true,
      props: {
        id: 'tx-1',
        senderId: 'bc1sender',
        recipientId: 'bc1recipient',
        amount: 0.1,
        status: 'PENDING',
        timestamp: 1_700_000_000_000,
        crypto: 'BTC'
      },
      global: {
        mocks: {
          $t: (key) => key,
          $te: () => false,
          $store: {
            state: {
              address: 'U1234567890',
              btc: {
                address: 'bc1sender'
              },
              chat: {
                chats: {}
              },
              adm: {
                transactions: {}
              }
            },
            getters: {
              'rate/historyRate': () => '42.00 USD',
              'partners/displayName': () => '',
              'chat/isPartnerInChatList': () => false
            },
            dispatch: dispatchSpy
          }
        }
      }
    })

    expect(wrapper.vm.resolvedStatus).toBe('REGISTERED')
    expect(wrapper.vm.resolvedAmount).toBe(0.25)
    expect(wrapper.vm.resolvedTimestamp).toBe(1_710_000_000_000)
    expect(dispatchSpy).toHaveBeenCalledWith('rate/getHistoryRates', {
      timestamp: 1_710_000_000
    })

    queryData.value = {
      ...queryData.value,
      status: 'CONFIRMED',
      timestamp: 1_710_000_600_000
    }
    await nextTick()

    expect(wrapper.vm.resolvedStatus).toBe('CONFIRMED')
    expect(wrapper.vm.isStatusVisibleTransaction).toBe(false)
    expect(dispatchSpy).toHaveBeenCalledWith('rate/getHistoryRates', {
      timestamp: 1_710_000_600
    })
  })
})
