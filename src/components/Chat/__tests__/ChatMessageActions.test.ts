import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import { defineComponent } from 'vue'

import ChatMessageActions from '../ChatMessageActions.vue'
import AChatMessageActionsList from '@/components/AChat/AChatMessageActionsList.vue'
import AChatMessageActionsMenu from '@/components/AChat/AChatMessageActionsMenu.vue'
import { TransactionStatus } from '@/lib/constants'
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

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      chats: {
        chat_actions: {
          retry: 'Retry',
          reply: 'Reply',
          copy: 'Copy'
        },
        message_not_sent_status: 'Message not sent'
      }
    }
  }
})

const createStoreForAddress = (address = 'U111111') =>
  createStore({
    state: {
      address
    }
  })

const createMessage = (overrides: Record<string, unknown> = {}) => ({
  id: 'message-1',
  senderId: 'U111111',
  recipientId: 'U222222',
  confirmations: 0,
  height: 0,
  admTimestamp: 1_700_000_000,
  amount: 0,
  hash: '',
  message: 'Hello',
  status: TransactionStatus.REJECTED,
  timestamp: 1_700_000_000_000,
  type: 'message',
  isReply: false,
  i18n: false,
  showTime: true,
  showBubble: true,
  asset: {},
  ...overrides
})

const stubs = {
  'v-list': defineComponent({
    inheritAttrs: false,
    template: '<div v-bind="$attrs"><slot /></div>'
  }),
  'v-list-item': defineComponent({
    inheritAttrs: false,
    template:
      '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /><slot name="append" /></button>'
  }),
  'v-list-item-title': defineComponent({
    template: '<span><slot /></span>'
  }),
  'v-divider': true,
  'v-icon': defineComponent({
    props: {
      icon: {
        type: String,
        default: ''
      }
    },
    template: '<i class="v-icon" :data-icon="icon"></i>'
  })
}

describe('Chat rejected-message actions', () => {
  it('renders retry instead of reply in dropdown list for rejected outgoing text messages', async () => {
    const wrapper = mount(AChatMessageActionsList, {
      props: {
        transaction: createMessage()
      },
      global: {
        plugins: [createStoreForAddress(), i18n],
        stubs
      }
    })

    expect(wrapper.text()).toContain('Retry')
    expect(wrapper.text()).not.toContain('Reply')

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('click:retry')?.length).toBeGreaterThan(0)
    expect(wrapper.emitted('click:reply')).toBeUndefined()
  })

  it('renders retry instead of reply in overlay menu for rejected outgoing text messages', async () => {
    const wrapper = mount(AChatMessageActionsMenu, {
      props: {
        transaction: createMessage()
      },
      global: {
        plugins: [createStoreForAddress(), i18n],
        stubs
      }
    })

    expect(wrapper.text()).toContain('Retry')
    expect(wrapper.text()).not.toContain('Reply')

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('click:retry')?.length).toBeGreaterThan(0)
    expect(wrapper.emitted('click:reply')).toBeUndefined()
  })

  it('shows status note and hides reactions for rejected outgoing text messages', () => {
    const wrapper = mount(ChatMessageActions, {
      props: {
        transaction: createMessage(),
        open: true,
        showEmojiPicker: false
      },
      global: {
        plugins: [createStoreForAddress(), i18n],
        stubs: {
          AChatMessageActionsDropdown: defineComponent({
            template:
              '<div><div class="dropdown-top"><slot name="top" /></div><div class="dropdown-bottom"><slot name="bottom" /></div></div>'
          }),
          AChatReactionSelect: defineComponent({
            template: '<div data-test="reaction-select"></div>'
          }),
          AChatMessageStatusNote: defineComponent({
            template: '<div data-test="status-note">Message not sent</div>'
          }),
          AChatMessageActionsList: defineComponent({
            template: '<div data-test="actions-list"></div>'
          }),
          EmojiPicker: true
        }
      }
    })

    expect(wrapper.find('[data-test="status-note"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="reaction-select"]').exists()).toBe(false)
  })
})
