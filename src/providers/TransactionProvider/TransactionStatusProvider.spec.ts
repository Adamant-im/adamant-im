import { defineComponent, h, PropType } from 'vue'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TransactionStatus } from '@/lib/constants'
import TransactionStatusProvider from './TransactionStatusProvider.vue'

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
          default: ({ status }: { status: string }) => h('div', { 'data-status': status }, status)
        }
      )
  }
})

const createStoreMock = () => {
  const store = createStore({
    state: {
      address: 'U111111'
    },
    mutations: {
      noop() {}
    }
  })

  const commit = vi.spyOn(store, 'commit')

  return { store, commit }
}

describe('TransactionStatusProvider', () => {
  beforeEach(() => {
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

  it('keeps the local registered status when the live query errors before the transaction is indexed', () => {
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

    expect(wrapper.find('[data-status]').attributes('data-status')).toBe(
      TransactionStatus.REGISTERED
    )
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
})
