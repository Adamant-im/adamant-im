import { shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import Vuex from 'vuex'
import VueI18n from 'vue-i18n'
import Vuetify from 'vuetify'

import currencyFilter from '@/filters/currencyAmountWithSymbol'
import { EPOCH } from '@/lib/constants'
import formatters from '@/lib/formatters'
import mockupI18n from './__mocks__/plugins/i18n'
import TransactionListItem from '@/components/TransactionListItem'
import admState from '@/store/modules/adm/adm-state'

jest.mock('@/store', () => ({
  state: {
    options: {
      useFullDate: false
    }
  }
}))

Vue.filter('currency', currencyFilter)
Vue.use(Vuex)
Vue.use(VueI18n)
Vue.use(Vuetify)

// set $formatAmount & $formatDate prototype methods
formatters(Vue)

let fake = createFakeVars()

function createFakeVars () {
  return {
    partnerName: 'Rick',
    isPartnerInChatList: false
  }
}

/**
 * Mockup store helper.
 */
function mockupStore () {
  const chat = {
    state: {
      chats: {},
    },
    getters: {
      isPartnerInChatList: () => () => fake.isPartnerInChatList,
      isAdamantChat: () => () => true,
      historyRate: () => () => true,
    },
    namespaced: true
  }

  const partners = {
    getters: {
      displayName: () => () => fake.partnerName
    },
    namespaced: true
  }

  const adm = {
    state: admState
  }

  const rate = {
    state: () => ({
      rates: {
        'ADM/BTC': 4.1e-7,
        'ADM/CNY': 0.05501093,
        'ADM/ETH': 0.00000484,
        'ADM/EUR': 0.00795434,
        'ADM/JPY': 1.07871806,
        'ADM/RUB': 0.48095777,
        'ADM/USD': 0.00789119
      },
      isLoaded: false,
      historyRates: {}
    }),
    actions: {
      getHistoryRates: () => Promise.resolve({})
    },
    getters: {
      historyRate: () => () => '~13.25 USD'
    },
    namespaced: true
  }

  const store = new Vuex.Store({
    state: {
      address: "U3716604363012166999"
    },
    modules: {
      chat,
      partners,
      adm,
      rate
    }
  })

  return {
    store,
    chat,
    partners,
    adm,
    rate
  }
}

/**
 * Mockup valid props.
 */
const validProps = {
  id: '123456789',
  senderId: 'U654321',
  recipientId: 'U123456',
  timestamp: 37835483, // ADM timestamp
  amount: 100000000 // 1 ADM
}

// disable Vue console warnings when testings
// with invalid `propsData`
// jest.spyOn(global.console, 'error').mockImplementation(() => jest.fn())

describe('TransactionListItem', () => {
  let i18n = null
  let store = null
  let partners = null // vuex module
  let chat = null // vuex module
  let adm = null
  let rate = null

  beforeEach(() => {
    const vuex = mockupStore()

    store = vuex.store
    partners = vuex.partners
    chat = vuex.chat
    adm = vuex.adm
    rate = vuex.rate

    i18n = mockupI18n()
    fake = createFakeVars()
  })

  // it('renders the correct markup', () => {
  //   const wrapper = shallowMount(TransactionListItem, {
  //     store,
  //     i18n,
  //     propsData: {
  //       ...validProps
  //     }
  //   })
  //
  //   expect(wrapper.element).toMatchSnapshot()
  // })

  it('should return computed.partnerName', () => {
    const wrapper = shallowMount(TransactionListItem, {
      store,
      i18n,
      propsData: {
        ...validProps
      }
    })

    expect(wrapper.vm.partnerName).toBe('Rick')
  })

  it('should return correct date based on props.timestamp (1 day)', () => {
    const admTimestamp = 3600 * 24 // 1 day

    const wrapper = shallowMount(TransactionListItem, {
      store,
      i18n,
      propsData: {
        ...validProps,
        timestamp: admTimestamp
      }
    })

    // Sep 3, 2017, 20:00
    expect(wrapper.vm.createdAt).toBe(admTimestamp * 1000 + EPOCH)
  })

  it('should return correct date based on props.timestamp (2 days)', () => {
    const admTimestamp = 3600 * 24 * 2 // 2 days

    const wrapper = shallowMount(TransactionListItem, {
      store,
      i18n,
      propsData: {
        ...validProps,
        timestamp: admTimestamp
      }
    })

    // Sep 4, 2017, 20:00
    expect(wrapper.vm.createdAt).toBe(admTimestamp * 1000 + EPOCH)
  })

  it('should not display icon when transaction contains a message', () => {
    const wrapper = shallowMount(TransactionListItem, {
      store,
      i18n,
      propsData: {
        ...validProps
      }
    })

    // transaction without comment
    expect(wrapper.vm.isPartnerInChatList).toBe(false)
  })

  it('should display icon when transaction contains a message', () => {
    fake.isPartnerInChatList = true

    const wrapper = shallowMount(TransactionListItem, {
      store,
      i18n,
      propsData: {
        ...validProps
      }
    })

    expect(wrapper.vm.isPartnerInChatList).toBe(true)
  })

  it('should emit events', () => {
    const wrapper = shallowMount(TransactionListItem, {
      store,
      i18n,
      propsData: {
        ...validProps
      }
    })

    wrapper.vm.onClickTransaction()
    wrapper.vm.onClickIcon()

    expect(wrapper.emitted()['click:transaction']).toEqual([[wrapper.vm.id]]) // emit with transactionId
    expect(wrapper.emitted()['click:icon']).toBeTruthy()
  })
})
