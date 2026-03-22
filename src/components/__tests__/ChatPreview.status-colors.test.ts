import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import { defineComponent } from 'vue'
import { TransactionStatus, tsColor } from '@/lib/constants'
import ChatPreview from '@/components/ChatPreview.vue'

vi.mock('@/components/Chat/ChatAvatar.vue', () => ({
  default: defineComponent({
    name: 'ChatAvatar',
    template: '<div class="chat-avatar-stub" />'
  })
}))

vi.mock('@/components/icons/AdmFill.vue', () => ({
  default: defineComponent({
    name: 'AdmFillIcon',
    template: '<div class="adm-fill-icon-stub" />'
  })
}))

vi.mock('@/components/icons/BaseIcon.vue', () => ({
  default: defineComponent({
    name: 'BaseIcon',
    template: '<div class="base-icon-stub"><slot /></div>'
  })
}))

vi.mock('@/components/AChat/hooks/useChatName', () => ({
  useChatName: () => 'Test chat'
}))

vi.mock('@/lib/chat/meta/utils', () => ({
  isAdamantChat: () => false,
  isWelcomeChat: () => false
}))

vi.mock('@/filters/currencyAmountWithSymbol', () => ({
  default: (amount: number, symbol: string) => `${amount} ${symbol}`
}))

vi.mock('@/filters/dateBrief', () => ({
  default: () => 'May 15'
}))

vi.mock('@/lib/markdown', () => ({
  formatChatPreviewMessage: (text: string) => text
}))

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
      return () => slots.default?.({ status: (props.transaction as any).status, refetch: vi.fn() })
    }
  })
}))

const VIconStub = defineComponent({
  name: 'VIconStub',
  props: {
    icon: {
      type: String,
      default: ''
    },
    color: {
      type: String,
      default: ''
    }
  },
  template: '<i class="v-icon" :data-icon="icon" :data-color="color" />'
})

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      chats: {
        sent_label: 'Sent',
        received_label: 'Received',
        you: 'You'
      }
    }
  }
})

function createStoreMock() {
  return createStore({
    state: {
      options: {
        formatMessages: false
      }
    },
    modules: {
      chat: {
        namespaced: true,
        getters: {
          numOfNewMessages: () => () => 0
        }
      }
    }
  })
}

function createTransaction(status: (typeof TransactionStatus)[keyof typeof TransactionStatus]) {
  return {
    id: 'tx-1',
    hash: 'tx-1',
    senderId: 'U1111111111111111111',
    recipientId: 'U2222222222222222222',
    admTimestamp: 1,
    timestamp: Date.now(),
    confirmations: 0,
    status,
    i18n: false,
    amount: 1,
    message: 'Color check',
    height: 1,
    asset: {
      type: 'doge_transaction',
      amount: '1',
      hash: 'tx-1',
      comments: 'Color check'
    },
    type: 'DOGE'
  }
}

function mountPreview(status: (typeof TransactionStatus)[keyof typeof TransactionStatus]) {
  const store = createStoreMock()

  return mount(ChatPreview, {
    props: {
      userId: 'U1111111111111111111',
      contactId: 'U2222222222222222222',
      transaction: createTransaction(status)
    },
    global: {
      plugins: [store, i18n],
      stubs: {
        VIcon: VIconStub,
        VListItem: defineComponent({ template: '<div><slot name="prepend" /><slot /></div>' }),
        VListItemTitle: defineComponent({ template: '<div><slot /></div>' }),
        VListItemSubtitle: defineComponent({ template: '<div><slot /></div>' }),
        VBadge: defineComponent({ template: '<div><slot /></div>' })
      }
    }
  })
}

describe('ChatPreview status colors', () => {
  it('colors transfer status icons in chat preview and keeps preview text compact', () => {
    const confirmedWrapper = mountPreview(TransactionStatus.CONFIRMED)
    const rejectedWrapper = mountPreview(TransactionStatus.REJECTED)
    const invalidWrapper = mountPreview(TransactionStatus.INVALID)

    expect(confirmedWrapper.find('.v-icon').attributes('data-color')).toBe(
      tsColor(TransactionStatus.CONFIRMED)
    )
    expect(rejectedWrapper.find('.v-icon').attributes('data-color')).toBe(
      tsColor(TransactionStatus.REJECTED)
    )
    expect(invalidWrapper.find('.v-icon').attributes('data-color')).toBe(
      tsColor(TransactionStatus.INVALID)
    )
    expect(confirmedWrapper.text()).toContain('Sent 1 DOGE')
    expect(confirmedWrapper.text()).not.toContain(' Sent 1 DOGE ')
  })
})
