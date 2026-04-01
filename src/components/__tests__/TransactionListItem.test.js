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

  it('renders Dash InstantSend transactions as successful in the list while details keep polling', () => {
    queryData.value = {
      id: 'dash-tx-1',
      senderId: 'Xsender',
      recipientId: 'Xrecipient',
      amount: 0.0013,
      status: 'REGISTERED',
      instantsend: true,
      timestamp: 1_710_000_000_000
    }

    const wrapper = mount(TransactionListItem, {
      shallow: true,
      props: {
        id: 'dash-tx-1',
        senderId: 'Xsender',
        recipientId: 'Xrecipient',
        amount: 0.0013,
        status: 'PENDING',
        timestamp: 1_710_000_000_000,
        crypto: 'DASH'
      },
      global: {
        mocks: {
          $t: (key) => key,
          $te: () => false,
          $store: {
            state: {
              address: 'U1234567890',
              dash: {
                address: 'Xsender'
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
            dispatch: vi.fn()
          }
        }
      }
    })

    expect(wrapper.vm.resolvedStatus).toBe('CONFIRMED')
    expect(wrapper.vm.isStatusVisibleTransaction).toBe(false)
  })

  it('falls back to known partner crypto addresses to resolve ADM chat links in transaction lists', async () => {
    const wrapper = mount(TransactionListItem, {
      shallow: true,
      props: {
        id: 'doge-tx-1',
        senderId: 'DPartnerAddress',
        recipientId: 'DMyAddress',
        amount: 1,
        status: 'CONFIRMED',
        timestamp: 1_710_000_000_000,
        crypto: 'DOGE'
      },
      global: {
        mocks: {
          $t: (key) => key,
          $te: () => false,
          $store: {
            state: {
              address: 'UMyAdamantAddress',
              partners: {
                list: {
                  UPartnerAdamantAddress: {
                    DOGE: 'DPartnerAddress'
                  }
                }
              },
              doge: {
                address: 'DMyAddress'
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
              'partners/displayName': (address) =>
                address === 'UPartnerAdamantAddress' ? 'Doge Partner' : '',
              'chat/isPartnerInChatList': (address) => address === 'UPartnerAdamantAddress'
            },
            dispatch: vi.fn()
          }
        }
      }
    })

    expect(wrapper.vm.partnerAdmId).toBe('UPartnerAdamantAddress')
    expect(wrapper.vm.partnerName).toBe('Doge Partner')
    expect(wrapper.vm.isClickIcon).toBe(true)

    await wrapper.vm.onClickIcon()

    expect(wrapper.emitted('click:icon')).toEqual([['UPartnerAdamantAddress']])
  })

  it('does not divide ADM live amounts twice when the transaction query already returns ADM units', () => {
    queryData.value = {
      id: 'adm-tx-1',
      senderId: 'U1234567890',
      recipientId: 'U0987654321',
      amount: 0.5,
      status: 'REGISTERED',
      timestamp: 269_282_595
    }

    const historyRateGetter = vi.fn(() => '42.00 USD')

    const wrapper = mount(TransactionListItem, {
      shallow: true,
      props: {
        id: 'adm-tx-1',
        senderId: 'U1234567890',
        recipientId: 'U0987654321',
        amount: 50_000_000,
        status: 'PENDING',
        timestamp: 269_282_595,
        crypto: 'ADM'
      },
      global: {
        mocks: {
          $t: (key) => key,
          $te: () => false,
          $store: {
            state: {
              address: 'U1234567890',
              partners: {
                list: {}
              },
              chat: {
                chats: {}
              },
              adm: {
                transactions: {}
              }
            },
            getters: {
              'rate/historyRate': historyRateGetter,
              'partners/displayName': () => '',
              'chat/isPartnerInChatList': () => false
            },
            dispatch: vi.fn()
          }
        }
      }
    })

    expect(wrapper.text()).toContain('0.5 ADM')
    expect(wrapper.text()).not.toContain('0.000000005 ADM')
    expect(historyRateGetter).toHaveBeenCalledWith(1_773_654_195, '0.5', 'ADM')
  })
})
