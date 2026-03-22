import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import { defineComponent, nextTick } from 'vue'
import { mdiCheck, mdiClockCheckOutline } from '@mdi/js'

import AChatMessage from '../AChatMessage.vue'
import AChatAttachment from '../AChatAttachment/AChatAttachment.vue'
import AChatTransaction from '../AChatTransaction.vue'
import { TransactionStatus } from '@/lib/constants'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
;(globalThis as any).config = new Proxy(
  {},
  {
    get: () =>
      new Proxy(
        {},
        {
          get: () => ({
            list: [],
            map: () => [],
            forEach: () => []
          })
        }
      )
  }
)

vi.mock('tiny-secp256k1', () => ({
  isPoint: () => true,
  isOrderScalar: () => true,
  pointAdd: () => new Uint8Array(33),
  pointAddScalar: () => new Uint8Array(33),
  pointCompress: () => new Uint8Array(33),
  pointFromScalar: () => new Uint8Array(33),
  pointMultiply: () => new Uint8Array(33),
  sign: () => new Uint8Array(64),
  verify: () => true
}))

vi.mock('ecpair', () => ({
  ECPairFactory: () => ({
    fromSeed: vi.fn(),
    makeRandom: vi.fn(),
    fromPrivateKey: vi.fn(),
    fromPublicKey: vi.fn()
  })
}))

vi.mock('@/lib/nodes', () => {
  const client = {
    getNodes: () => [],
    onStatusUpdate: () => {},
    getNextNode: () => {},
    setNodes: () => {},
    useFastest: true
  }
  const nodesMap = {
    adm: client,
    btc: client,
    eth: client,
    dash: client,
    doge: client,
    lsk: client,
    bnb: client,
    ipfs: client,
    res: client
  }
  return {
    __esModule: true,
    nodes: nodesMap,
    ...nodesMap
  }
})

vi.mock('@/lib/nodes/services', () => {
  const client = {
    getNodes: () => [],
    onStatusUpdate: () => {},
    useFastest: true
  }

  const servicesProxy = new Proxy(
    {},
    {
      get: () => client
    }
  )

  return {
    __esModule: true,
    services: servicesProxy,
    default: servicesProxy
  }
})

vi.mock('@/lib/nodes/eth/index', () => ({
  eth: { getGasPrice: vi.fn() },
  default: { getGasPrice: vi.fn() }
}))
vi.mock('@/lib/nodes/dash/index', () => ({ dash: { getNodes: () => [] }, default: {} }))
vi.mock('@/lib/nodes/adm/index', () => ({ adm: { getNodes: () => [] }, default: {} }))
vi.mock('@/lib/nodes/eth-indexer/index', () => ({
  ethIndexer: { getNodes: () => [] },
  default: {}
}))
vi.mock('@/lib/nodes/btc-indexer/index', () => ({
  btcIndexer: { getNodes: () => [] },
  default: {}
}))
vi.mock('@/lib/nodes/doge-indexer/index', () => ({
  dogeIndexer: { getNodes: () => [] },
  default: {}
}))
vi.mock('@/lib/nodes/rate-info-service/index', () => ({
  rateInfoClient: { getNodes: () => [] },
  default: {}
}))
vi.mock('@/lib/bitcoin/btc-base-api', () => ({ default: vi.fn() }))

vi.mock('@/providers/TransactionProvider', () => ({
  TransactionProvider: defineComponent({
    name: 'TransactionProvider',
    props: {
      transaction: {
        type: Object,
        required: true
      }
    },
    setup(props, { slots }) {
      return () => slots.default?.({ status: props.transaction.status, refetch: vi.fn() })
    }
  })
}))

const VRowStub = defineComponent({
  name: 'VRowStub',
  inheritAttrs: false,
  template: '<div v-bind="$attrs"><slot /></div>'
})

const VIconStub = defineComponent({
  name: 'VIconStub',
  props: {
    icon: {
      type: String,
      default: ''
    },
    size: {
      type: [String, Number],
      default: ''
    },
    color: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: ''
    }
  },
  template:
    '<i class="v-icon" :data-icon="icon" :data-size="String(size)" :data-color="color" :title="title"></i>'
})

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      chats: {
        retry_message: 'Retry message',
        sent_label: 'Sent',
        received_label: 'Received',
        transaction_statuses: {
          PENDING: 'Pending',
          REGISTERED: 'Registered',
          REJECTED: 'Rejected'
        }
      }
    }
  }
})

const createTestStore = ({
  address = 'U111111',
  pendingMessages = {}
}: {
  address?: string
  pendingMessages?: Record<string, unknown>
} = {}) =>
  createStore({
    state: {
      address,
      options: {
        formatMessages: false
      },
      chat: {
        pendingMessages
      }
    },
    modules: {
      rate: {
        namespaced: true,
        getters: {
          historyRate: () => () => '$1'
        },
        actions: {
          getHistoryRates: vi.fn()
        }
      }
    }
  })

const globalMountOptions = (store: ReturnType<typeof createTestStore>) => ({
  plugins: [store, i18n],
  stubs: {
    'v-row': VRowStub,
    'v-icon': VIconStub,
    QuotedMessage: true,
    InlineLayout: true,
    ImageLayout: true,
    AChatImageModal: true,
    crypto: true
  },
  directives: {
    touch: {},
    longpress: {}
  }
})

const createTextTransaction = (overrides: Record<string, unknown> = {}): any => ({
  id: 'message-1',
  senderId: 'U111111',
  recipientId: 'U222222',
  confirmations: 0,
  height: 0,
  admTimestamp: 1_700_000_000,
  amount: 0,
  hash: '',
  message: 'Hello from chat',
  status: TransactionStatus.PENDING,
  timestamp: 1_700_000_000_000,
  type: 'message',
  isReply: false,
  i18n: false,
  showTime: false,
  showBubble: false,
  asset: {},
  ...overrides
})

const createAttachmentTransaction = (overrides: Record<string, unknown> = {}): any => ({
  id: 'attachment-1',
  senderId: 'U111111',
  recipientId: 'U222222',
  confirmations: 0,
  height: 0,
  admTimestamp: 1_700_000_000,
  amount: 0,
  hash: '',
  message: 'Document attached',
  status: TransactionStatus.PENDING,
  timestamp: 1_700_000_000_000,
  type: 'attachment',
  isReply: false,
  i18n: false,
  showTime: false,
  showBubble: false,
  asset: {
    files: [
      {
        id: 'cid-1',
        name: 'report',
        extension: 'pdf',
        size: 128,
        mimeType: 'application/pdf',
        nonce: 'nonce-1'
      }
    ]
  },
  recipientPublicKey: 'recipient-public-key',
  senderPublicKey: 'sender-public-key',
  ...overrides
})

const createCryptoTransaction = (overrides: Record<string, unknown> = {}): any => ({
  id: 'crypto-1',
  senderId: 'U111111',
  recipientId: 'U222222',
  confirmations: 0,
  height: 0,
  message: 'Transfer',
  status: TransactionStatus.PENDING,
  timestamp: 1_700_000_000_000,
  type: 'ETH',
  amount: 0.1,
  hash: '0xabc123',
  isReply: false,
  i18n: false,
  showTime: false,
  showBubble: false,
  asset: {},
  ...overrides
})

describe('AChat sending status UI', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows inline pending status for grouped queued outgoing text messages only after the delay', async () => {
    const store = createTestStore({
      pendingMessages: {
        'message-1': {
          recipientId: 'U222222'
        }
      }
    })
    const wrapper = mount(AChatMessage, {
      props: {
        transaction: createTextTransaction()
      },
      global: globalMountOptions(store)
    })

    expect(wrapper.find('.a-chat__inline-status--pending').exists()).toBe(false)

    await wait(600)
    await nextTick()

    expect(wrapper.find('.a-chat__inline-status--pending').exists()).toBe(false)

    await wait(500)
    await nextTick()

    expect(wrapper.find('.a-chat__inline-status--pending').exists()).toBe(true)
    expect(wrapper.find('.a-chat__message-card-header').exists()).toBe(false)

    store.state.chat.pendingMessages = {}
    await wrapper.setProps({
      transaction: createTextTransaction({
        status: TransactionStatus.REGISTERED
      })
    })
    await nextTick()

    expect(wrapper.find('.a-chat__inline-status--pending').exists()).toBe(false)
  })

  it('does not show inline pending status for grouped text messages outside the retry queue', async () => {
    const store = createTestStore()
    const wrapper = mount(AChatMessage, {
      props: {
        transaction: createTextTransaction()
      },
      global: globalMountOptions(store)
    })

    await wait(1_100)
    await nextTick()

    expect(wrapper.find('.a-chat__inline-status--pending').exists()).toBe(false)
  })

  it('keeps header status visible for ungrouped outgoing text messages across pending and rejected states', async () => {
    const store = createTestStore()
    const wrapper = mount(AChatMessage, {
      props: {
        transaction: createTextTransaction({
          showTime: true,
          showBubble: true,
          status: TransactionStatus.PENDING
        })
      },
      global: globalMountOptions(store)
    })

    expect(wrapper.find('.a-chat__message-card-header').exists()).toBe(true)
    expect(wrapper.find('.a-chat__status .v-icon').exists()).toBe(true)

    await wrapper.setProps({
      transaction: createTextTransaction({
        showTime: true,
        showBubble: true,
        status: TransactionStatus.REJECTED
      })
    })

    expect(wrapper.find('.a-chat__message-card-header').exists()).toBe(true)
    expect(wrapper.find('.a-chat__status .v-icon').exists()).toBe(true)

    await wrapper.find('.a-chat__status .v-icon').trigger('click')

    expect(wrapper.emitted('click:status')).toHaveLength(1)
  })

  it('shows inline rejected status for grouped outgoing text messages and opens status actions on click', async () => {
    const store = createTestStore()
    const wrapper = mount(AChatMessage, {
      props: {
        transaction: createTextTransaction({
          status: TransactionStatus.REJECTED
        })
      },
      global: globalMountOptions(store)
    })

    expect(wrapper.find('.a-chat__message-card-header').exists()).toBe(false)
    expect(wrapper.find('.a-chat__inline-status--rejected .v-icon').exists()).toBe(true)

    await wrapper.find('.a-chat__inline-status--rejected .v-icon').trigger('click')

    expect(wrapper.emitted('click:status')).toHaveLength(1)
  })

  it('keeps grouped attachment messages showing header status and timestamp', () => {
    const store = createTestStore()
    const wrapper = mount(AChatAttachment, {
      props: {
        transaction: createAttachmentTransaction(),
        partnerId: 'U222222'
      },
      global: globalMountOptions(store)
    })

    expect(wrapper.find('.a-chat__message-card-header').exists()).toBe(true)
    expect(wrapper.find('.a-chat__timestamp').exists()).toBe(true)
    expect(wrapper.find('.a-chat__status .v-icon').exists()).toBe(true)
  })

  it('keeps grouped crypto messages showing header status and timestamp', () => {
    const store = createTestStore()
    const wrapper = mount(AChatTransaction, {
      props: {
        transaction: createCryptoTransaction()
      },
      global: globalMountOptions(store)
    })

    expect(wrapper.find('.a-chat__message-card-header').exists()).toBe(true)
    expect(wrapper.find('.a-chat__timestamp').exists()).toBe(true)
    expect(wrapper.find('.a-chat__status .v-icon').exists()).toBe(true)
  })

  it('renders registered outgoing text messages with a plain check icon', () => {
    const store = createTestStore()
    const wrapper = mount(AChatMessage, {
      props: {
        transaction: createTextTransaction({
          showTime: true,
          showBubble: true,
          status: TransactionStatus.REGISTERED
        })
      },
      global: globalMountOptions(store)
    })

    expect(wrapper.find('.a-chat__status .v-icon').attributes('data-icon')).toBe(mdiCheck)
    expect(wrapper.find('.a-chat__status .v-icon').attributes('data-icon')).not.toBe(
      mdiClockCheckOutline
    )
  })
})
