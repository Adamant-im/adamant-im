import { shallowMount } from '@vue/test-utils'
import Vue, { nextTick } from 'vue'
import Vuex from 'vuex'
import VueI18n from 'vue-i18n'
import Vuetify from 'vuetify'
import sinon from 'sinon'

import { Cryptos, Rates } from '@/lib/constants'
import { rateStateMock } from '@/components/__tests__/__mocks__/store/modules/rate'
import SendFundsForm from '@/components/SendFundsForm'
import mockupI18n from './__mocks__/plugins/i18n'

Vue.use(Vuex)
Vue.use(VueI18n)
Vue.use(Vuetify)

// Because Node.js is not supporting Promise.finally.
// In the future, polyfill can be added.
// eslint-disable-next-line
Promise.prototype.finally =
  Promise.prototype.finally ||
  {
    finally(fn) {
      const onFinally = (cb) => Promise.resolve(fn()).then(cb)
      return this.then(
        (result) => onFinally(() => result),
        (reason) =>
          onFinally(() => {
            throw reason
          })
      )
    }
  }.finally

// Mock console.error
global.console = {
  ...global.console,
  error: () => {}
}

/** Mockup store helper **/
function mockupStore() {
  // mockup sendTokens action
  function sendTokens({ admAddress }) {
    return new Promise((resolve, reject) => {
      if (admAddress === 'U111111') {
        return resolve('1') // transactionId
      }

      reject(new Error('Invalid address'))
    })
  }

  const mainModule = () => ({
    state: {
      balance: 10000
    }
  })

  const admModule = () => ({
    state: {
      address: 'U123456'
    },
    getters: {
      fee: () => () => 0.5
    },
    actions: {
      sendTokens
    },
    namespaced: true
  })

  const ethModule = () => ({
    state: {
      balance: 100,
      address: '0x0000000000000000000000000000000000000000'
    },
    getters: {
      fee: () => () => 1
    },
    actions: {
      sendTokens
    },
    namespaced: true
  })

  const bnbModule = () => ({
    state: {
      balance: 1000
    },
    getters: {
      fee: () => () => 2
    },
    actions: {
      sendTokens
    },
    namespaced: true
  })

  const partnersModule = () => ({
    getters: {
      cryptoAddress: (state) => (userId, cryptoCurrency) => {
        if (cryptoCurrency === 'ETH') {
          return 'ETH123456'
        } else if (cryptoCurrency === 'BNB') {
          return 'BNB123456'
        }
      },
      displayName: (state) => (partnerId) => {
        if (partnerId === 'U111111') {
          return 'Rick'
        } else if (partnerId === 'U222222') {
          return 'Morty'
        }
      }
    },
    actions: {
      fetchAddress() {
        return new Promise((resolve) => {
          resolve('0x111111111111111111')
        })
      }
    },
    namespaced: true
  })

  const chatModule = () => ({
    getters: {
      isPartnerInChatList: (state) => (partnerId) => {
        if (partnerId === 'U111111') {
          return true
        }

        return false
      },
      isAdamantChat: () => () => true
    },
    namespaced: true
  })

  const rateModule = () => ({
    state: rateStateMock,
    namespaced: true
  })

  const optionsModule = () => ({
    state: () => ({
      currentRate: Rates.USD
    })
  })

  return {
    mainModule,
    admModule,
    ethModule,
    bnbModule,
    partnersModule,
    chatModule,
    rateModule,
    optionsModule
  }
}

describe('SendFundsForm', () => {
  let i18n, store, main, adm, eth, bnb, partners, chat, rate, options, wrapper

  beforeEach(() => {
    const {
      mainModule,
      admModule,
      ethModule,
      bnbModule,
      partnersModule,
      chatModule,
      rateModule,
      optionsModule
    } = mockupStore()

    main = mainModule()
    adm = admModule()
    eth = ethModule()
    bnb = bnbModule()
    partners = partnersModule()
    chat = chatModule()
    rate = rateModule()
    options = optionsModule()

    store = createStore({
      ...main,
      modules: {
        adm,
        eth,
        bnb,
        partners,
        chat,
        rate,
        options
      }
    })

    i18n = mockupI18n()

    wrapper = shallowMount(SendFundsForm, {
      store,
      i18n
    })
  })

  it('renders the correct markup', () => {
    wrapper = shallowMount(SendFundsForm, {
      store,
      i18n
    })

    expect(wrapper.element).toMatchSnapshot()
  })

  it('check props', () => {
    wrapper = shallowMount(SendFundsForm, {
      store,
      i18n,
      propsData: {
        cryptoCurrency: 'ADM',
        recipientAddress: 'U111111',
        amountToSend: 100
      }
    })

    expect(wrapper.vm.currency).toBe('ADM')
    expect(wrapper.vm.address).toBe('U111111')
    expect(wrapper.vm.amount).toBe(100)
  })

  /** computed **/
  describe('computed.transferFee', () => {
    it('should return ADM fee', () => {
      wrapper.setProps({
        cryptoCurrency: 'ADM'
      })

      expect(wrapper.vm.transferFee).toBe(0.5)
      expect(wrapper.vm.transferFeeFixed).toBe('0.5')
    })

    it('should return ETH fee', () => {
      wrapper = shallowMount(SendFundsForm, {
        store,
        i18n,
        propsData: {
          cryptoCurrency: 'ETH'
        }
      })

      expect(wrapper.vm.transferFee).toBe(1)
      expect(wrapper.vm.transferFeeFixed).toBe('1')
    })
  })

  describe('computed.finalAmount', () => {
    it('should sum `transferFee` & `amount`', () => {
      wrapper.setData({
        amount: 100
      })

      expect(wrapper.vm.finalAmount).toBe(100 + 0.5)
      expect(wrapper.vm.finalAmountFixed).toBe(String(100 + 0.5))
    })
  })

  describe('computed.balance', () => {
    it('should return ADM balance', () => {
      wrapper = shallowMount(SendFundsForm, {
        store,
        i18n,
        propsData: {
          cryptoCurrency: 'ADM'
        }
      })

      expect(wrapper.vm.balance).toBe(10000)
    })

    it('should return ETH balance', () => {
      wrapper = shallowMount(SendFundsForm, {
        store,
        i18n,
        propsData: {
          cryptoCurrency: 'ETH'
        }
      })

      expect(wrapper.vm.balance).toBe(100)
    })
  })

  describe('computed.maxToTransfer', () => {
    it('should return `balance - fee`', () => {
      expect(wrapper.vm.maxToTransfer).toBe(10000 - 0.5)
    })

    it('should return 0 when `balance < transferFee`', () => {
      main.state.balance = 0 // 0 < 0.5 (ADM_FEE)

      expect(wrapper.vm.maxToTransfer).toBe(0)
    })
  })

  describe('computed.recipientName', () => {
    it('should return `recipientName`', () => {
      wrapper.setData({ address: 'U111111' })

      expect(wrapper.vm.recipientName).toBe('Rick')
    })
  })

  describe('computed.cryptoList', () => {
    it('should return array of available cryptos', () => {
      expect(wrapper.vm.cryptoList).toEqual(Object.keys(Cryptos))
    })
  })

  describe('computed.validationRules', () => {
    it('cryptoAddress: validateAddress', () => {
      const validateAddress = wrapper.vm.validationRules.cryptoAddress[0].bind(wrapper.vm)
      const errorMessage = i18n.global.t('transfer.error_incorrect_address', { crypto: 'ADM' })

      wrapper.setData({ currency: 'ADM' })

      expect(validateAddress()).toBe(errorMessage)
      expect(validateAddress('U1')).toBe(errorMessage)
      expect(validateAddress('U654321')).toBe(true)
    })

    it('cryptoAddress: same recipient should be allowed when is an ADM address', async () => {
      const validateSameRecipient = wrapper.vm.validationRules.cryptoAddress[1].bind(wrapper.vm)

      wrapper.setData({ currency: 'ADM' })

      expect(validateSameRecipient('U123456')).toBe(true)
    })

    it('cryptoAddress: same recipient should be forbidden when is ETH address', async () => {
      const validateSameRecipient = wrapper.vm.validationRules.cryptoAddress[1].bind(wrapper.vm)
      const errorMessage = i18n.global.t('transfer.error_same_recipient')

      wrapper.setData({ currency: 'ETH' })

      expect(validateSameRecipient('0x0000000000000000000000000000000000000000')).toBe(errorMessage)
    })

    it('amount: incorrectAmount', () => {
      const correctAmount = wrapper.vm.validationRules.amount[0].bind(wrapper.vm)
      const errorMessage = i18n.global.t('transfer.error_incorrect_amount')

      expect(correctAmount('100')).toBe(true)
      expect(correctAmount('0')).toBe(errorMessage)
      expect(correctAmount('-1')).toBe(errorMessage)
      expect(correctAmount('no number')).toBe(errorMessage)
    })

    it('amount: notEnoughTokens', () => {
      const hasEnoughTokens = wrapper.vm.validationRules.amount[1].bind(wrapper.vm)
      const errorMessage = i18n.global.t('transfer.error_not_enough')

      main.state.balance = 100

      wrapper.setData({ amount: 90 })
      expect(hasEnoughTokens()).toBe(true)

      wrapper.setData({ amount: 99.5 }) // +0.5 ADM transfer fee
      expect(hasEnoughTokens()).toBe(true)

      wrapper.setData({ amount: 100 })
      expect(hasEnoughTokens()).toBe(errorMessage)

      wrapper.setData({ amount: 200 })
      expect(hasEnoughTokens()).toBe(errorMessage)
    })
  })

  describe('computed.confirmMessage', () => {
    it('confirm message without `recipientName`', () => {
      wrapper.setData({
        amount: 1,
        cryptoAddress: 'U333333' // no recipient in `partners` module
      })

      expect(wrapper.vm.confirmMessage).toBe(
        i18n.global.t('transfer.confirm_message', { amount: 1, address: 'U333333', crypto: 'ADM' })
      )
    })

    it('should confirm message with `recipientName`', async () => {
      wrapper.setProps({
        addressReadonly: true
      })
      wrapper.setData({
        amount: 1,
        cryptoAddress: 'U111111',
        address: 'U111111'
      })

      await nextTick()

      expect(wrapper.vm.confirmMessage).toBe(
        i18n.global.t('transfer.confirm_message_with_name', {
          amount: 1,
          name: 'Rick',
          address: 'U111111',
          crypto: 'ADM'
        })
      )
    })
  })

  /** methods **/
  describe('methods.submit', () => {
    const transactionId = 'T1'

    beforeEach(() => {
      wrapper = shallowMount(SendFundsForm, {
        store,
        i18n,
        stubs: {
          vForm: {
            render: (h) => h('div'),
            methods: {
              validate: () => true
            }
          }
        }
      })
    })

    it('should sendFunds and resolve promise', async () => {
      wrapper.setMethods({
        sendFunds: () => Promise.resolve(transactionId),
        pushTransactionToChat: jest.fn()
      })

      const promise = wrapper.vm.submit()

      expect(wrapper.vm.disabledButton).toBe(true)
      expect(wrapper.vm.showSpinner).toBe(true)
      expect(await promise).toBe(undefined)
      expect(wrapper.vm.disabledButton).toBe(false)
      expect(wrapper.vm.showSpinner).toBe(false)
      expect(wrapper.vm.dialog).toBe(false)
      expect(wrapper.emitted('send')).toEqual([[transactionId, 'ADM']])
      expect(wrapper.vm.pushTransactionToChat).not.toHaveBeenCalled()
    })

    it('In-chat Transfer: should sendFunds and push transaction to chat', async () => {
      wrapper.setMethods({
        sendFunds: () => Promise.resolve(transactionId),
        pushTransactionToChat: sinon.spy()
      })
      wrapper.setData({ address: 'U111111' })
      wrapper.setData({ cryptoAddress: 'U111111' })

      await wrapper.vm.submit()

      expect(wrapper.vm.pushTransactionToChat.args).toEqual([[transactionId, 'U111111']])
    })

    it('Direct Transfer: should sendFunds', async () => {
      wrapper.setMethods({
        sendFunds: () => Promise.resolve(transactionId),
        pushTransactionToChat: sinon.spy()
      })
      wrapper.setData({ cryptoAddress: 'U111111' })

      await wrapper.vm.submit()

      expect(wrapper.vm.pushTransactionToChat.args).toEqual([])
    })

    it('should emit error when sendFunds rejected', async () => {
      wrapper.setMethods({
        sendFunds: () => Promise.reject(new Error('No hash'))
      })

      await wrapper.vm.submit()

      expect(wrapper.emitted('error')).toEqual([['Error: No hash']])
    })
  })

  describe('methods.sendFunds', () => {
    it('should send ADM with message', () => {})
    it('should send ADM without message', () => {})
    it('should send OTHER crypto', () => {})
  })

  describe('methods.pushTransactionToChat', () => {
    it('should push ADM transaction', () => {})
    it('should push OTHER crypto transaction', () => {})
  })

  describe('methods.fetchUserCryptoAddress', () => {
    it('should resolve with ADM address', () => {})
    it('should fetch and resolve OTHER crypto address', () => {})
  })

  describe('methods.validateNaturalUnits', () => {
    it('should validate natural units of `amount`', () => {
      const validateNaturalUnits = wrapper.vm.validateNaturalUnits.bind(wrapper.vm)

      expect(validateNaturalUnits(0.00000001, 'ADM')).toBe(true)
      expect(validateNaturalUnits(0.000000001, 'ADM')).toBe(false)
      expect(validateNaturalUnits(1, 'ADM')).toBe(true)
    })
  })
})
