import { defineComponent, h, PropType } from 'vue'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TransactionStatus } from '@/lib/constants'
import TransactionStatusProvider from './TransactionStatusProvider.vue'
import {
  makeTransactionStatusSessionKey,
  rememberTransactionFinalStatus,
  resetTransactionStatusSessionCache,
  syncTransactionStatusSession
} from './sessionFinalStatusCache'

const {
  queryStatusRef,
  liveStatusRef,
  transactionRef,
  additionalStatusRef,
  inconsistentStatusRef,
  refetch,
  useTransactionStatusQueryMock
} = vi.hoisted(() => {
  const queryStatusRef = { value: 'pending' as 'pending' | 'error' | 'success' }
  const liveStatusRef = { value: 'PENDING' }
  const transactionRef = { value: undefined as Record<string, any> | undefined }
  const additionalStatusRef = { value: false as string | boolean }
  const inconsistentStatusRef = { value: '' }
  const refetch = vi.fn()
  const useTransactionStatusQueryMock = vi.fn(
    (_transactionId?: unknown, _crypto?: unknown, _params?: unknown) => ({
      transaction: transactionRef,
      queryStatus: queryStatusRef,
      status: liveStatusRef,
      additionalStatus: additionalStatusRef,
      inconsistentStatus: inconsistentStatusRef,
      refetch
    })
  )

  return {
    queryStatusRef,
    liveStatusRef,
    transactionRef,
    additionalStatusRef,
    inconsistentStatusRef,
    refetch,
    useTransactionStatusQueryMock
  }
})

vi.mock('@/hooks/queries/transaction', () => ({
  useTransactionStatusQuery: useTransactionStatusQueryMock
}))

const slotHost = defineComponent({
  props: {
    transaction: {
      type: Object as PropType<Record<string, any>>,
      required: true
    }
  },
  setup(props) {
    return () =>
      h(
        TransactionStatusProvider as any,
        { transaction: props.transaction },
        {
          default: ({ status, refetch }: { status: string; refetch: () => void }) =>
            h('div', [
              h('div', { 'data-status': status }, status),
              h('button', { 'data-refetch': '', onClick: refetch }, 'refetch')
            ])
        }
      )
  }
})

const createStoreMock = () => {
  const store = createStore({
    state: {
      address: 'U111111'
    },
    modules: {
      chat: {
        namespaced: true,
        mutations: {
          updateCryptoTransferMessage() {}
        }
      }
    }
  })

  const commit = vi.spyOn(store, 'commit')

  return { store, commit }
}

describe('TransactionStatusProvider', () => {
  beforeEach(() => {
    resetTransactionStatusSessionCache()
    queryStatusRef.value = 'pending'
    liveStatusRef.value = TransactionStatus.PENDING
    transactionRef.value = undefined
    additionalStatusRef.value = false
    inconsistentStatusRef.value = ''
    refetch.mockReset()
    useTransactionStatusQueryMock.mockClear()
  })

  it('keeps the local pending status in chat preview while the live query is still pending', () => {
    const { store } = createStoreMock()
    const wrapper = mount(slotHost, {
      props: {
        transaction: {
          id: 'local-id',
          hash: 'dash-hash',
          type: 'DASH',
          status: TransactionStatus.PENDING
        }
      },
      global: {
        plugins: [store]
      }
    })

    expect(wrapper.find('[data-status]').attributes('data-status')).toBe(TransactionStatus.PENDING)
  })

  it('uses the live rejected status when the query layer resolves the transfer as failed', () => {
    queryStatusRef.value = 'error'
    liveStatusRef.value = TransactionStatus.REJECTED
    const { store } = createStoreMock()

    const wrapper = mount(slotHost, {
      props: {
        transaction: {
          id: 'local-id',
          hash: 'doge-hash',
          type: 'DOGE',
          status: TransactionStatus.REGISTERED
        }
      },
      global: {
        plugins: [store]
      }
    })

    expect(wrapper.find('[data-status]').attributes('data-status')).toBe(TransactionStatus.REJECTED)
  })

  it('uses the live success status once it is available', () => {
    queryStatusRef.value = 'success'
    liveStatusRef.value = TransactionStatus.CONFIRMED
    const { store } = createStoreMock()

    const wrapper = mount(slotHost, {
      props: {
        transaction: {
          id: 'local-id',
          hash: 'dash-hash',
          type: 'DASH',
          status: TransactionStatus.PENDING
        }
      },
      global: {
        plugins: [store]
      }
    })

    expect(wrapper.find('[data-status]').attributes('data-status')).toBe(
      TransactionStatus.CONFIRMED
    )
  })

  it('skips auto-query on the next chat remount in the same session once an invalid status was remembered', () => {
    const { store } = createStoreMock()
    syncTransactionStatusSession('U111111')
    rememberTransactionFinalStatus(
      makeTransactionStatusSessionKey('U111111', 'BTC', 'btc-hash'),
      TransactionStatus.INVALID
    )

    queryStatusRef.value = 'pending'
    liveStatusRef.value = TransactionStatus.PENDING
    transactionRef.value = undefined
    inconsistentStatusRef.value = ''

    const wrapper = mount(slotHost, {
      props: {
        transaction: {
          id: 'local-id',
          hash: 'btc-hash',
          type: 'BTC',
          senderId: 'U111111',
          recipientId: 'U222222',
          status: TransactionStatus.INVALID
        }
      },
      global: {
        plugins: [store]
      }
    })

    const params = useTransactionStatusQueryMock.mock.calls[0]?.[2] as
      | { enabled: { value: boolean } }
      | undefined

    expect(params?.enabled.value).toBe(false)
    expect(wrapper.find('[data-status]').attributes('data-status')).toBe(TransactionStatus.INVALID)
  })

  it('skips auto-query on the next chat remount in the same session once a rejected status was remembered', () => {
    const { store } = createStoreMock()
    syncTransactionStatusSession('U111111')
    rememberTransactionFinalStatus(
      makeTransactionStatusSessionKey('U111111', 'DOGE', 'doge-hash'),
      TransactionStatus.REJECTED
    )

    queryStatusRef.value = 'pending'
    liveStatusRef.value = TransactionStatus.PENDING

    const wrapper = mount(slotHost, {
      props: {
        transaction: {
          id: 'local-id',
          hash: 'doge-hash',
          type: 'DOGE',
          senderId: 'U111111',
          recipientId: 'U222222',
          status: TransactionStatus.REJECTED
        }
      },
      global: {
        plugins: [store]
      }
    })

    const params = useTransactionStatusQueryMock.mock.calls[0]?.[2] as
      | { enabled: { value: boolean } }
      | undefined

    expect(params?.enabled.value).toBe(false)
    expect(wrapper.find('[data-status]').attributes('data-status')).toBe(TransactionStatus.REJECTED)
  })

  it('keeps live queries enabled for crypto transfers that are locally marked as rejected', () => {
    const { store } = createStoreMock()
    mount(slotHost, {
      props: {
        transaction: {
          id: 'local-id',
          hash: 'btc-hash',
          type: 'BTC',
          status: TransactionStatus.REJECTED
        }
      },
      global: {
        plugins: [store]
      }
    })

    const params = useTransactionStatusQueryMock.mock.calls[0]?.[2] as
      | { knownStatus: { value: string }; enabled: { value: boolean } }
      | undefined

    expect(params?.knownStatus.value).toBe(TransactionStatus.REJECTED)
    expect(params?.enabled.value).toBe(true)
  })

  it('keeps live queries enabled for crypto transfers that are locally marked as confirmed', () => {
    const { store } = createStoreMock()
    mount(slotHost, {
      props: {
        transaction: {
          id: 'local-id',
          hash: 'btc-hash',
          type: 'BTC',
          status: TransactionStatus.CONFIRMED
        }
      },
      global: {
        plugins: [store]
      }
    })

    const params = useTransactionStatusQueryMock.mock.calls[0]?.[2] as
      | { knownStatus: { value: string }; enabled: { value: boolean } }
      | undefined

    expect(params?.knownStatus.value).toBe(TransactionStatus.CONFIRMED)
    expect(params?.enabled.value).toBe(true)
  })

  it('clears the remembered final status and sets chat transfer back to pending on manual refetch', async () => {
    const { store, commit } = createStoreMock()
    syncTransactionStatusSession('U111111')
    rememberTransactionFinalStatus(
      makeTransactionStatusSessionKey('U111111', 'DASH', 'dash-hash'),
      TransactionStatus.REJECTED
    )

    const wrapper = mount(slotHost, {
      props: {
        transaction: {
          id: 'local-id',
          hash: 'dash-hash',
          type: 'DASH',
          senderId: 'U111111',
          recipientId: 'U222222',
          status: TransactionStatus.REJECTED
        }
      },
      global: {
        plugins: [store]
      }
    })

    await wrapper.find('[data-refetch]').trigger('click')

    expect(commit).toHaveBeenCalledWith('chat/updateCryptoTransferMessage', {
      partnerId: 'U222222',
      hash: 'dash-hash',
      status: TransactionStatus.PENDING
    })
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})
