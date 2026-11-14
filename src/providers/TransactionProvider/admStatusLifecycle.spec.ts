import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import * as admApi from '@/lib/adamant-api'
import { normalizeMessage } from '@/lib/chat/helpers/normalizeMessage'
import TransactionStatusProvider from './TransactionStatusProvider.vue'
import AdmTransaction from '@/components/transactions/AdmTransaction.vue'
import TransactionListItem from '@/components/TransactionListItem.vue'
import { resetTransactionStatusSessionCache } from './sessionFinalStatusCache'

vi.mock('@/lib/adamant-api', () => ({
  getTransaction: vi.fn(),
  decodeTransaction: vi.fn((transaction) => transaction)
}))
// Wallet formatting imports legacy modules that initialize unrelated Bitcoin signing code.
vi.mock('ecpair', () => ({ ECPairFactory: () => ({}) }))
vi.mock('@/store', () => ({ default: { state: { options: {} }, getters: {} } }))
vi.mock('@/hooks/queries/useKVSCryptoAddress', () => ({
  useKVSCryptoAddress: () => ({
    data: computed(() => undefined),
    status: computed(() => 'pending')
  })
}))
vi.mock('@/hooks/address/useFormatADMAddress', () => ({
  useFormatADMAddress: () => computed(() => '')
}))
vi.mock('@/hooks/queries/useBlockHeight', () => ({
  useBlockHeight: () => computed(() => 500)
}))
vi.mock('@/config/utils', () => ({ getExplorerTxUrl: () => 'https://example.test/tx' }))
vi.mock('@/components/transactions/TransactionTemplate.vue', () => ({
  default: {
    props: ['transactionStatus', 'inconsistentStatus', 'confirmations'],
    template: '<div />'
  }
}))

const Template = defineComponent({
  props: ['transactionStatus', 'inconsistentStatus', 'confirmations'],
  setup: (props) => () =>
    h('div', {
      'data-details': '',
      'data-status': props.transactionStatus,
      'data-reason': props.inconsistentStatus,
      'data-confirmations': props.confirmations
    })
})

const cleanups: (() => void)[] = []
const raw = (type = 0) => ({
  id: 'adm-transfer',
  type,
  senderId: 'U222222',
  recipientId: 'U111111',
  amount: 10_000_000,
  fee: 50_000_000,
  timestamp: 285_000_000,
  confirmations: 0,
  height: 0,
  message: type === 8 ? 'transfer comment' : ''
})

function setup(type = 0, surface = 'chat', amount = 10_000_000) {
  const message = normalizeMessage(raw(type) as any)
  const store = createStore<any>({
    state: { address: 'U111111', adm: { address: 'U111111', transactions: {} } },
    getters: {
      'rate/historyRate': () => () => '0 USD',
      'partners/displayName': () => () => '',
      'chat/isPartnerInChatList': () => () => true
    },
    actions: { 'rate/getHistoryRates': () => {} },
    modules: {
      chat: {
        namespaced: true,
        state: { chats: { U222222: { messages: [message] } } },
        mutations: {
          updateCryptoTransferMessage(state, payload) {
            const tx = state.chats.U222222.messages[0]
            if (payload.status) tx.status = payload.status
            if (typeof payload.confirmations === 'number') tx.confirmations = payload.confirmations
          }
        }
      }
    }
  })
  const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })
  const Host = defineComponent({
    setup: () => () =>
      surface === 'details'
        ? h(AdmTransaction, { id: 'adm-transfer', crypto: 'ADM' })
        : surface === 'wallet'
          ? h(TransactionListItem, { ...raw(type), crypto: 'ADM', amount, status: 'CONFIRMED' })
          : h(
              'div',
              ['bubble', 'preview'].map((surface) =>
                h(
                  TransactionStatusProvider,
                  { transaction: store.state.chat.chats.U222222.messages[0] },
                  {
                    default: ({ status, inconsistentStatus }: any) =>
                      h('span', {
                        'data-surface': surface,
                        'data-status': status,
                        'data-reason': inconsistentStatus
                      })
                  }
                )
              )
            )
  })
  const wrapper = mount(Host, {
    global: {
      plugins: [store, [VueQueryPlugin, { queryClient }]],
      mocks: { $t: (key: string) => key },
      stubs: { TransactionTemplate: Template }
    }
  })
  cleanups.push(() => {
    wrapper.unmount()
    queryClient.clear()
  })
  return { wrapper, queryClient, message: store.state.chat.chats.U222222.messages[0] }
}

beforeEach(() => {
  vi.clearAllMocks()
  resetTransactionStatusSessionCache()
})
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup())
})

describe('ADM status lifecycle with real query observers', () => {
  it('keeps details registered while REST loads and does not invent confirmations from cached height', async () => {
    let resolve!: (transaction: any) => void
    vi.mocked(admApi.getTransaction).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    const { wrapper, message } = setup(0, 'details')
    await nextTick()
    expect(wrapper.find('[data-details]').attributes('data-status')).toBe('REGISTERED')
    expect(message.status).toBe('REGISTERED')
    resolve({ ...raw(), height: 100, confirmations: 0 })
    await flushPromises()
    expect(wrapper.find('[data-details]').attributes('data-status')).toBe('REGISTERED')
    expect(wrapper.find('[data-details]').attributes('data-confirmations')).toBe('NaN')
    expect(message.confirmations).toBe(0)
  })

  it.each([10_000_000, 20_000_000])(
    'compares an ADM wallet row without requiring chat-only REST fields (%s)',
    async (amount) => {
      const { wrapper } = setup(0, 'wallet', amount)
      await flushPromises()
      const row = wrapper.findComponent(TransactionListItem)
      expect(row.vm.resolvedStatus).toBe(amount === 10_000_000 ? 'CONFIRMED' : 'INVALID')
      expect(row.vm.inconsistentStatus).toBe(amount === 10_000_000 ? '' : 'wrong_amount')
      expect(admApi.getTransaction).not.toHaveBeenCalled()
    }
  )
  it.each([0, 8])(
    'keeps type %s registered until REST arrives and confirms only after one confirmation',
    async (type) => {
      let resolve!: (transaction: any) => void
      vi.mocked(admApi.getTransaction).mockImplementation(
        () =>
          new Promise((done) => {
            resolve = done
          })
      )
      const { wrapper, queryClient, message } = setup(type)
      await nextTick()
      expect(
        wrapper.findAll('[data-status]').map((item) => item.attributes('data-status'))
      ).toEqual(['REGISTERED', 'REGISTERED'])
      expect(message.status).toBe('REGISTERED')
      expect(admApi.getTransaction).toHaveBeenCalledTimes(1)

      resolve({ ...raw(type), height: 100, confirmations: 0 })
      await flushPromises()
      expect(message.status).toBe('REGISTERED')
      expect(wrapper.find('[data-reason]').attributes('data-reason')).toBe('')

      queryClient.setQueryData(['transaction', 'ADM', 'adm-transfer'], {
        ...raw(type),
        amount: 0.1,
        fee: 0.5,
        height: 100,
        confirmations: 1,
        status: 'CONFIRMED'
      })
      await flushPromises()
      expect(
        wrapper.findAll('[data-status]').map((item) => item.attributes('data-status'))
      ).toEqual(['CONFIRMED', 'CONFIRMED'])
      expect(message.confirmations).toBe(1)
    }
  )

  it('marks a real REST amount mismatch invalid only after the response arrives', async () => {
    let resolve!: (transaction: any) => void
    vi.mocked(admApi.getTransaction).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    const { wrapper, message } = setup()
    await nextTick()
    expect(message.status).toBe('REGISTERED')
    resolve({ ...raw(), amount: 20_000_000, confirmations: 1 })
    await flushPromises()
    expect(wrapper.findAll('[data-status]').map((item) => item.attributes('data-status'))).toEqual([
      'INVALID',
      'INVALID'
    ])
    expect(wrapper.find('[data-reason]').attributes('data-reason')).toBe('wrong_amount')
    expect(message.amount).toBe(10_000_000)
  })
})
