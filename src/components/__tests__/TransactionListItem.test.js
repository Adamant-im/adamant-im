import { shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import Vuex from 'vuex'
import VueI18n from 'vue-i18n'
import Vuetify from 'vuetify'

import currencyFilter from '@/filters/currency'
import { EPOCH } from '@/lib/constants'
import formatters from '@/lib/formatters'
import mockupI18n from './__mocks__/plugins/i18n'
import TransactionListItem from '@/components/TransactionListItem'

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
    getters: {
      isPartnerInChatList: () => () => fake.isPartnerInChatList
    },
    namespaced: true
  }

  const partners = {
    getters: {
      displayName: () => () => fake.partnerName
    },
    namespaced: true
  }

  const store = new Vuex.Store({
    modules: {
      chat,
      partners
    }
  })

  return {
    store,
    chat,
    partners
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

  beforeEach(() => {
    const vuex = mockupStore()

    store = vuex.store
    partners = vuex.partners
    chat = vuex.chat

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

  it('should return correct date based on props.timestamp', () => {
    const admTimestamp1 = 3600 * 24 // 1 day
    const admTimestamp2 = 3600 * 24 * 2 // 2 days

    const wrapper = shallowMount(TransactionListItem, {
      store,
      i18n,
      propsData: {
        ...validProps,
        timestamp: admTimestamp1
      }
    })

    // Sep 3, 2017, 20:00
    expect(wrapper.vm.createdAt).toBe(admTimestamp1 * 1000 + EPOCH)

    // Sep 4, 2017, 20:00
    wrapper.setProps({ timestamp: 3600 * 24 * 2 })
    expect(wrapper.vm.createdAt).toBe(admTimestamp2 * 1000 + EPOCH)
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
