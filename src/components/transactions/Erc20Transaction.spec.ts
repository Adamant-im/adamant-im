import { computed, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Erc20Transaction from './Erc20Transaction.vue'

const queryData = ref()
const admTransaction = ref<any>({
  senderId: 'U3716604363012166999',
  recipientId: 'U5587801118512880053'
})
const { useInconsistentStatusMock, capturedKnownAdmTransaction } = vi.hoisted(() => ({
  capturedKnownAdmTransaction: {
    current: undefined as { value: unknown } | undefined
  },
  useInconsistentStatusMock: vi.fn(
    (_transaction?: unknown, _crypto?: unknown, knownAdmTransaction?: { value: unknown }) => {
      capturedKnownAdmTransaction.current = knownAdmTransaction

      return computed(() => {
        return ''
      })
    }
  )
}))

vi.mock('vuex', () => ({
  useStore: () => ({
    state: {
      address: 'U3716604363012166999',
      eth: {
        address: '0x1111111111111111111111111111111111111111'
      }
    }
  })
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {
      from: '/chats/U5587801118512880053'
    }
  })
}))

vi.mock('./TransactionTemplate.vue', () => ({
  default: {
    name: 'TransactionTemplate',
    template: '<div />'
  }
}))

vi.mock('@/hooks/queries/transaction', () => ({
  useErc20TransactionQuery: vi.fn(() => () => ({
    status: ref('success'),
    isFetching: ref(false),
    isLoadingError: ref(false),
    isRefetchError: ref(false),
    error: ref(null),
    data: queryData,
    refetch: vi.fn()
  }))
}))

vi.mock('./hooks/useTransactionAdditionalStatus', () => ({
  useTransactionAdditionalStatus: vi.fn(() => computed(() => false))
}))

vi.mock('./hooks/useTransactionStatus', () => ({
  useTransactionStatus: vi.fn(() => computed(() => 'CONFIRMED'))
}))

vi.mock('./hooks/useInconsistentStatus', () => ({
  useInconsistentStatus: useInconsistentStatusMock
}))

vi.mock('./hooks/useFindAdmTransaction', () => ({
  useFindAdmTransaction: vi.fn(() => computed(() => admTransaction.value))
}))

vi.mock('./hooks/useFindAdmAddress', () => ({
  useFindAdmAddress: vi.fn(() => computed(() => ''))
}))

vi.mock('./hooks/useSyncChatTransferPendingStatus', () => ({
  useSyncChatTransferPendingStatus: vi.fn()
}))

vi.mock('./hooks/useClearPendingTransaction', () => ({
  useClearPendingTransaction: vi.fn()
}))

vi.mock('@/hooks/queries/useBlockHeight', () => ({
  useBlockHeight: vi.fn(() => computed(() => 100))
}))

vi.mock('./hooks/address', () => ({
  useCryptoAddressPretty: vi.fn(() => computed(() => 'formatted'))
}))

vi.mock('@/config/utils', () => ({
  getExplorerTxUrl: vi.fn(() => 'https://example.com')
}))

describe('Erc20Transaction.vue', () => {
  beforeEach(() => {
    useInconsistentStatusMock.mockClear()
    capturedKnownAdmTransaction.current = undefined
    admTransaction.value = {
      senderId: 'U3716604363012166999',
      recipientId: 'U5587801118512880053'
    }
    queryData.value = {
      id: '0x0a31625a6b7e9a227bbaba608f1a48d2bd515a733f2b5e6e3cf38191f9c8efdc',
      senderId: '0x1111111111111111111111111111111111111111',
      recipientId: '0x2222222222222222222222222222222222222222',
      amount: 1,
      fee: 0.1,
      status: 'CONFIRMED',
      confirmations: 1,
      blockNumber: 99
    }
  })

  it('passes the current chat ADM transaction into inconsistency checks', () => {
    mount(Erc20Transaction, {
      props: {
        id: '0x0a31625a6b7e9a227bbaba608f1a48d2bd515a733f2b5e6e3cf38191f9c8efdc',
        crypto: 'USDT'
      }
    })

    expect(useInconsistentStatusMock).toHaveBeenCalledTimes(1)
    expect(capturedKnownAdmTransaction.current?.value).toEqual(admTransaction.value)
  })
})
