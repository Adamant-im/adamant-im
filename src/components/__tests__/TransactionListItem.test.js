import { shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import Vuex from 'vuex'
import VueI18n from 'vue-i18n'
import Vuetify from 'vuetify'

import formatters from '@/lib/formatters'
import mockupI18n from './__mocks__/plugins/i18n'
import TransactionListItem from '@/components/TransactionListItem'

Vue.use(Vuex)
Vue.use(VueI18n)
Vue.use(Vuetify)

// set $formatAmount & $formatDate prototype methods
formatters(Vue)

/**
 * Mockup store helper.
 */
function mockupStore () {
  const state = {
    chats: [
      {
        messages: []
      }
    ]
  }

  const modules = {
    partners: {
      getters: {
        displayName: () => () => 'Rick'
      },
      namespaced: true
    }
  }

  const store = new Vuex.Store({
    state,
    modules
  })

  return {
    store,
    modules
  }
}

/**
 * Mockup valid props.
 */
const validProps = {
  id: '123456789',
  userId: 'U123456',
  partnerId: 'U654321',
  senderId: 'U654321',
  timestamp: 37835483 // ADM timestamp?
}

// disable Vue console warnings when testings
// with invalid `propsData`
// jest.spyOn(global.console, 'error').mockImplementation(() => jest.fn())

describe('TransactionListItem', () => {
  let i18n = null
  let store = null
  let partners = null // vuex module

  beforeEach(() => {
    const vuex = mockupStore()

    store = vuex.store
    partners = vuex.modules.partners

    i18n = mockupI18n()
  })

  it('renders the correct markup', () => {
    const wrapper = shallowMount(TransactionListItem, {
      store,
      i18n,
      propsData: {
        ...validProps
      }
    })

    expect(wrapper.element).toMatchSnapshot()
  })

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
    const wrapper = shallowMount(TransactionListItem, {
      store,
      i18n,
      propsData: {
        ...validProps,
        timestamp: 3600 * 24 // adm timestamp
      }
    })

    // Sep 3, 20:00
    expect(wrapper.vm.timeAgo).toBe('Sep 3, 20:00')

    // Sep 4, 20:00
    wrapper.setProps({ timestamp: 3600 * 24 * 2 })
    expect(wrapper.vm.timeAgo).toBe('Sep 4, 20:00')
  })

  it('should display icon when transaction contains a message', () => {
    const wrapper = shallowMount(TransactionListItem, {
      store,
      i18n,
      propsData: {
        ...validProps
      }
    })

    // transaction without comment
    expect(wrapper.vm.hasMessages).toBe(false)

    // transaction contains a comment, to check (chat.messages.length > 0)
    // store.state.chats[0].messages = [{}]
    // @todo more tests after refactor store
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
