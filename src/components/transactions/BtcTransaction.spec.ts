import { computed, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BtcTransaction from './BtcTransaction.vue'

const queryData = ref()
let mockStore: any
const admTransaction = ref<any>({
  senderId: 'U3716604363012166999',
  recipientId: 'U6386412615727665758'
})

vi.mock('vuex', () => ({
  useStore: () => mockStore
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {}
  })
}))

vi.mock('./TransactionTemplate.vue', () => ({
  default: {
    name: 'TransactionTemplate',
    template: '<div />',
    props: ['partner']
  }
}))

vi.mock('@/hooks/queries/transaction', () => ({
  useBtcTransactionQuery: vi.fn(() => ({
    status: ref('success'),
    isFetching: ref(false),
    isLoadingError: ref(false),
    isRefetchError: ref(false),
    error: ref(null),
    data: queryData,
    refetch: vi.fn()
  })),
  useDogeTransactionQuery: vi.fn(() => ({
    status: ref('success'),
    isFetching: ref(false),
    isLoadingError: ref(false),
    isRefetchError: ref(false),
    error: ref(null),
    data: queryData,
    refetch: vi.fn()
  })),
  useDashTransactionQuery: vi.fn(() => ({
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
  useInconsistentStatus: vi.fn(() => computed(() => ''))
}))

vi.mock('./hooks/useFindAdmTransaction', () => ({
  useFindAdmTransaction: vi.fn(() => computed(() => admTransaction.value))
}))

const fallbackAdmAddress = ref('')

vi.mock('./hooks/useFindAdmAddress', () => ({
  useFindAdmAddress: vi.fn(() => computed(() => fallbackAdmAddress.value))
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
  useBtcAddressPretty: vi.fn(() => computed(() => 'formatted'))
}))

vi.mock('@/config/utils', () => ({
  getExplorerTxUrl: vi.fn(() => 'https://example.com')
}))

describe('BtcTransaction.vue', () => {
  beforeEach(() => {
    fallbackAdmAddress.value = ''
    admTransaction.value = {
      senderId: 'U3716604363012166999',
      recipientId: 'U6386412615727665758'
    }
    mockStore = {
      state: {
        address: 'U3716604363012166999',
        doge: {
          address: 'DJYzxc6Rd3tknUmED7KB83ZoXV9NzhZxss'
        }
      }
    }

    queryData.value = {
      id: '723a8f9d1f0083b5da91c2aae1df6434d854828d8e9fac5f11b30f021af3ba86',
      senderId: 'DJYzxc6Rd3tknUmED7KB83ZoXV9NzhZxss',
      recipientId: 'DCh27PcKiPGFQSr92QLbVbcPZ1rJNVfqZH',
      amount: 1,
      fee: 1,
      status: 'CONFIRMED',
      confirmations: 1
    }
  })

  it('uses the current ADM address to compute continue-chat partner for DOGE details', () => {
    const wrapper = mount(BtcTransaction, {
      props: {
        id: '723a8f9d1f0083b5da91c2aae1df6434d854828d8e9fac5f11b30f021af3ba86',
        crypto: 'DOGE'
      }
    })

    expect(wrapper.vm.partnerAdmAddress).toBe('U6386412615727665758')
    expect(wrapper.findComponent({ name: 'TransactionTemplate' }).props('partner')).toBe(
      'U6386412615727665758'
    )
  })

  it('keeps continue-chat partner available from partners fallback when admTx is not in chat memory', () => {
    fallbackAdmAddress.value = 'U6386412615727665758'
    admTransaction.value = undefined

    const wrapper = mount(BtcTransaction, {
      props: {
        id: '723a8f9d1f0083b5da91c2aae1df6434d854828d8e9fac5f11b30f021af3ba86',
        crypto: 'DOGE'
      }
    })

    expect(wrapper.vm.partnerAdmAddress).toBe('U6386412615727665758')
    expect(wrapper.findComponent({ name: 'TransactionTemplate' }).props('partner')).toBe(
      'U6386412615727665758'
    )
  })
})
