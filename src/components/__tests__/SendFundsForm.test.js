import { shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import Vuex from 'vuex'
import VueI18n from 'vue-i18n'
import Vuetify from 'vuetify'

import SendFundsForm from '@/components/SendFundsForm'
import mockupI18n from './__mocks__/plugins/i18n'

Vue.use(Vuex)
Vue.use(VueI18n)
Vue.use(Vuetify)

/**
 * Mockup store helper.
 */
function mockupStore () {
  // mockup sendTokens action
  function sendTokens ({ admAddress }) {
    return new Promise((resolve, reject) => {
      if (admAddress === 'U111111') {
        return resolve('1') // transactionId
      }

      reject(new Error('Invalid address'))
    })
  }

  const mainModule = {
    state: {
      balance: 10000
    }
  }

  const admModule = {
    actions: {
      sendTokens
    },
    namespaced: true
  }

  const ethModule = {
    state: {
      balance: 100
    },
    getters: {
      fee: () => 1
    },
    actions: {
      sendTokens
    },
    namespaced: true
  }

  const bnbModule = {
    state: {
      balance: 1000
    },
    getters: {
      fee: () => 1
    },
    actions: {
      sendTokens
    },
    namespaced: true
  }

  const partnersModule = {
    getters: {
      cryptoAddress: state => (userId, cryptoCurrency) => {
        if (cryptoCurrency === 'ETH') {
          return 'ETH123456'
        } else if (cryptoCurrency === 'BTB') {
          return 'BNB123456'
        }
      },
      displayName: state => (partnerId) => 'Rick'
    },
    actions: {
      fetchAddress () {
        return new Promise((resolve) => {
          resolve('0x111111111111111111')
        })
      }
    },
    namespaced: true
  }

  const store = new Vuex.Store({
    ...mainModule,
    modules: {
      adm: admModule,
      eth: ethModule,
      bnb: bnbModule,
      partners: partnersModule
    }
  })

  return {
    store,
    mainModule,
    admModule,
    ethModule,
    bnbModule,
    partnersModule
  }
}

describe('SendFundsForm', () => {
  let i18n = null
  let store = null
  let adm = null
  let eth = null
  let bnb = null
  let partners = null

  beforeEach(() => {
    const vuex = mockupStore()

    store = vuex.store
    adm = vuex.admModule
    eth = vuex.ethModule
    bnb = vuex.bnbModule
    partners = vuex.partners

    i18n = mockupI18n()
  })

  it('renders the correct markup', () => {
    const wrapper = shallowMount(SendFundsForm, {
      store,
      i18n
    })

    expect(wrapper.element).toMatchSnapshot()
  })

  /** ADM Transfer **/
  describe('ADM transfer', () => {
    it('mount with default props', () => {
      const wrapper = shallowMount(SendFundsForm, {
        store,
        i18n
      })

      expect(wrapper.vm.currency).toBe('ADM')
      expect(wrapper.vm.address).toBe('')
      expect(wrapper.vm.amount).toBe(undefined)
    })

    it('mount with `address` & `amount` props', () => {
      const wrapper = shallowMount(SendFundsForm, {
        store,
        i18n,
        propsData: {
          recipientAddress: 'U111111',
          amountToSend: 100
        }
      })

      expect(wrapper.vm.currency).toBe('ADM')
      expect(wrapper.vm.address).toBe('U111111')
      expect(wrapper.vm.amount).toBe(100)
    })

    describe('`transferFee` method', () => {
      it('should return ADM fee', () => {
        const wrapper = shallowMount(SendFundsForm, {
          store,
          i18n,
          propsData: {
            cryptoCurrency: 'ADM',
            recipientAddress: 'U111111'
          }
        })

        expect(wrapper.vm.transferFee).toBe(0.5)
      })
    })

    describe('`finalAmount` method', () => {
      it('should return 1.50 when `this.amount = 1`', () => {
        const wrapper = shallowMount(SendFundsForm, {
          store,
          i18n,
          propsData: {
            cryptoCurrency: 'ADM'
          }
        })

        wrapper.vm.amount = 1

        expect(wrapper.vm.amount).toBe(1)
        expect(wrapper.vm.finalAmount).toBe(1.50)
      })
    })
  })

  /** props **/
  describe('props', () => {
    it('should set `currency`, `address`, `amount` when created', () => {
      const wrapper = shallowMount(SendFundsForm, {
        store,
        i18n,
        propsData: {
          cryptoCurrency: 'ETH',
          recipientAddress: 'U111111',
          amountToSend: 100
        }
      })

      expect(wrapper.vm.currency).toBe('ETH')
      expect(wrapper.vm.address).toBe('U111111')
      expect(wrapper.vm.amount).toBe(100)
    })
  })

  // @todo more tests
  it('should send ADM tokens', () => {})
  it('should send ETH tokens', () => {})
  it('should send BNB tokens', () => {})
})
