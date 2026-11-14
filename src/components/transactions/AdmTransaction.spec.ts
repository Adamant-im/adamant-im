import { computed, defineComponent, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Cryptos, TransactionStatus } from '@/lib/constants'

const queryStatus = ref<'pending' | 'success'>('success')
const isFetching = ref(false)
const inconsistentStatus = ref('wrong_amount')
const transaction = ref<any>()
const chatTransaction = ref<any>()

const useInconsistentStatus = vi.fn((..._args: unknown[]) => inconsistentStatus)

vi.mock('@/hooks/queries/transaction', () => ({
  useAdmTransactionQuery: () => ({
    status: queryStatus,
    isFetching,
    isLoadingError: ref(false),
    isRefetchError: ref(false),
    error: ref(undefined),
    data: transaction,
    refetch: vi.fn()
  })
}))

vi.mock('./hooks/useFindAdmTransaction', () => ({
  useFindAdmTransaction: () => chatTransaction
}))

vi.mock('./hooks/useInconsistentStatus', () => ({
  useInconsistentStatus: (...args: unknown[]) => useInconsistentStatus(...args)
}))

vi.mock('./hooks/useTransactionStatus', () => ({
  useTransactionStatus: (
    _isFetching: unknown,
    _queryStatus: unknown,
    transactionStatus: { value?: string },
    inconsistency: { value?: string }
  ) => computed(() => (inconsistency.value ? TransactionStatus.INVALID : transactionStatus.value))
}))

vi.mock('./hooks/useTransactionAdditionalStatus', () => ({
  useTransactionAdditionalStatus: () => ref(false)
}))

vi.mock('./hooks/useSyncChatTransferPendingStatus', () => ({
  useSyncChatTransferPendingStatus: vi.fn()
}))

vi.mock('@/hooks/address/useFormatADMAddress', () => ({
  useFormatADMAddress: () => ref('')
}))

vi.mock('@/hooks/queries/useBlockHeight', () => ({
  useBlockHeight: () => ref(101)
}))

vi.mock('@/config/utils', () => ({
  getExplorerTxUrl: () => 'https://explorer.example/tx'
}))

import AdmTransaction from './AdmTransaction.vue'

const TransactionTemplateStub = defineComponent({
  props: {
    transactionStatus: String,
    inconsistentStatus: String
  },
  template:
    '<div data-template :data-status="transactionStatus" :data-inconsistent-status="inconsistentStatus" />'
})

describe('AdmTransaction status synchronization', () => {
  beforeEach(() => {
    queryStatus.value = 'success'
    isFetching.value = false
    inconsistentStatus.value = 'wrong_amount'
    transaction.value = {
      id: 'adm-transfer-id',
      senderId: 'U222222',
      recipientId: 'U111111',
      amount: 0.1,
      fee: 0.5,
      height: 100,
      confirmations: 1,
      status: TransactionStatus.CONFIRMED
    }
    chatTransaction.value = {
      id: 'adm-transfer-id',
      hash: 'adm-transfer-id',
      senderId: 'U222222',
      recipientId: 'U111111',
      amount: 20_000_000,
      confirmations: 0,
      status: TransactionStatus.REGISTERED,
      type: Cryptos.ADM
    }
    useInconsistentStatus.mockClear()
  })

  it('shows the shared invalid status and writes it back to the chat store', async () => {
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

    const wrapper = mount(AdmTransaction, {
      props: {
        id: 'adm-transfer-id',
        crypto: Cryptos.ADM
      },
      global: {
        plugins: [store],
        stubs: {
          TransactionTemplate: TransactionTemplateStub
        }
      }
    })
    await nextTick()

    expect(useInconsistentStatus).toHaveBeenCalledWith(transaction, Cryptos.ADM, chatTransaction)
    expect(wrapper.find('[data-template]').attributes('data-status')).toBe(
      TransactionStatus.INVALID
    )
    expect(wrapper.find('[data-template]').attributes('data-inconsistent-status')).toBe(
      'wrong_amount'
    )
    expect(commit).toHaveBeenCalledWith('chat/updateCryptoTransferMessage', {
      partnerId: 'U222222',
      hash: 'adm-transfer-id',
      status: TransactionStatus.INVALID,
      confirmations: 1
    })
  })
})
