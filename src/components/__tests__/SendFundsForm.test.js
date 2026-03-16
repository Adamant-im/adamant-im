import { vi, describe, it, beforeEach, expect } from 'vitest'
global.config = new Proxy(
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

vi.mock('/img/adamant-logo-transparent-512x512.png', () => ({ default: 'logo' }))
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
      get: (target, prop) => {
        return client
      }
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
vi.mock('./__mocks__/plugins/i18n', () => ({ default: { t: (k) => k, tc: (k) => k } }))

import { shallowMount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'

import { Rates } from '@/lib/constants'
import { rateStateMock } from '@/components/__tests__/__mocks__/store/modules/rate'
import SendFundsForm from '@/components/SendFundsForm'

// this needs to prevent warnings in console
const DEFAULT_STUBS = {
  'v-select': true,
  'v-text-field': true,
  'v-checkbox': true,
  'v-btn': true,
  'v-icon': true,
  'v-menu': true,
  'v-list': true,
  'v-list-item': true,
  'v-list-item-title': true,
  'v-divider': true,
  'v-card': true,
  'v-card-title': true,
  'v-card-text': true,
  'v-card-actions': true,
  'v-spacer': true,
  'v-dialog': true,
  'v-progress-circular': true,
  'warning-on-partner-address-dialog': true,
  'v-form': { template: '<div><slot /></div>' }
}

const vuetify = createVuetify()

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

  const walletsModule = () => ({
    getters: {
      getVisibleOrderedWalletSymbols: () => [
        { symbol: 'ADM' },
        { symbol: 'ETH' },
        { symbol: 'BNB' }
      ]
    },
    namespaced: true
  })

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
    }),
    getters: {
      wasSendingFunds: () => false,
      savedAmountFromChat: () => '0',
      savedComment: () => '',
      currentRate: (state) => state.currentRate
    },
    namespaced: true
  })

  return {
    mainModule,
    admModule,
    ethModule,
    bnbModule,
    partnersModule,
    chatModule,
    rateModule,
    optionsModule,
    walletsModule
  }
}

describe('SendFundsForm', () => {
  let i18n, store, main, adm, eth, bnb, partners, chat, rate, options, wrapper, wallets

  beforeEach(() => {
    const modules = mockupStore()

    main = modules.mainModule()
    adm = modules.admModule()
    eth = modules.ethModule()
    bnb = modules.bnbModule()
    partners = modules.partnersModule()
    chat = modules.chatModule()
    rate = modules.rateModule()
    options = modules.optionsModule()
    wallets = modules.walletsModule()

    store = createStore({
      state: main.state,
      modules: { adm, eth, bnb, partners, chat, rate, options, wallets }
    })

    i18n = createI18n({
      legacy: false,
      locale: 'en',
      messages: { en: {} },
      missingWarn: false,
      fallbackWarn: false
    })

    wrapper = shallowMount(SendFundsForm, {
      global: {
        plugins: [store, i18n, vuetify],
        mocks: {
          $route: {
            query: {}
          }
        },
        stubs: {
          ...DEFAULT_STUBS,
          'v-form': {
            props: ['modelValue'],
            // We emulate Vuetify form behavior
            methods: {
              validate: () => Promise.resolve({ valid: true })
            },
            // Prevent Vue warnings about a stub without a template
            template: '<div><slot /></div>'
          }
        }
      },

      props: {
        cryptoCurrency: 'ADM',
        recipientAddress: 'U111111',
        amountToSend: 100
      }
    })
  })

  it('renders the correct markup', () => {
    wrapper = shallowMount(SendFundsForm, {
      global: {
        plugins: [store, i18n],
        mocks: {
          $route: {
            query: {}
          }
        },
        stubs: DEFAULT_STUBS
      }
    })

    expect(wrapper.element).toMatchSnapshot()
  })

  it('check props', () => {
    wrapper = shallowMount(SendFundsForm, {
      global: {
        plugins: [store, i18n, vuetify],
        mocks: {
          $route: { query: {} }
        },
        stubs: {
          ...DEFAULT_STUBS,
          'v-form': {
            template: '<div><slot /></div>',
            methods: { validate: () => Promise.resolve({ valid: true }) }
          }
        }
      },
      props: {
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
        global: {
          plugins: [store, i18n, vuetify],
          mocks: {
            $route: {
              query: {}
            }
          },
          stubs: {
            ...DEFAULT_STUBS,
            'v-form': {
              template: '<div><slot /></div>',
              methods: { validate: () => Promise.resolve({ valid: true }) }
            }
          }
        },
        props: {
          cryptoCurrency: 'ETH'
        }
      })

      expect(wrapper.vm.transferFee).toBe(1)
      expect(wrapper.vm.transferFeeFixed).toBe('1')
    })

    it('should format tiny ETH fee without scientific notation', () => {
      const modules = mockupStore()
      const localStore = createStore({
        state: modules.mainModule().state,
        modules: {
          adm: modules.admModule(),
          eth: {
            ...modules.ethModule(),
            getters: {
              fee: () => () => 0.00000081
            }
          },
          bnb: modules.bnbModule(),
          partners: modules.partnersModule(),
          chat: modules.chatModule(),
          rate: modules.rateModule(),
          options: modules.optionsModule(),
          wallets: modules.walletsModule()
        }
      })

      wrapper = shallowMount(SendFundsForm, {
        global: {
          plugins: [localStore, i18n, vuetify],
          mocks: {
            $route: {
              query: {}
            }
          },
          stubs: {
            ...DEFAULT_STUBS,
            'v-form': {
              template: '<div><slot /></div>',
              methods: { validate: () => Promise.resolve({ valid: true }) }
            }
          }
        },
        props: {
          cryptoCurrency: 'ETH'
        }
      })

      wrapper.setData({
        amount: 0.00000001
      })

      expect(wrapper.vm.transferFee).toBe(0.00000081)
      expect(wrapper.vm.transferFeeFixed).toBe('0.00000081')
      expect(wrapper.vm.finalAmountFixed).toBe('0.00000082')
      expect(wrapper.vm.transferFeeFixed).not.toContain('e-')
      expect(wrapper.vm.finalAmountFixed).not.toContain('e-')
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
        global: {
          plugins: [store, i18n],
          mocks: {
            $route: {
              query: {}
            }
          },
          stubs: DEFAULT_STUBS
        },
        props: {
          cryptoCurrency: 'ADM'
        }
      })

      expect(wrapper.vm.balance).toBe(10000)
    })

    it('should return ETH balance', () => {
      wrapper = shallowMount(SendFundsForm, {
        global: {
          plugins: [store, i18n],
          mocks: {
            $route: {
              query: {}
            }
          },
          stubs: DEFAULT_STUBS
        },
        props: {
          cryptoCurrency: 'ETH'
        }
      })

      expect(wrapper.vm.balance).toBe(100)
    })
  })

  describe('computed.maxToTransfer', () => {
    it('should return `balance - fee`', async () => {
      store.state.balance = 10000
      await nextTick()
      expect(wrapper.vm.maxToTransfer).toBe(9999.5)
    })

    it('should return 0 when `balance < transferFee`', async () => {
      store.state.balance = 0.1
      await nextTick()
      expect(wrapper.vm.maxToTransfer).toBe(0)
    })
  })

  describe('computed.recipientName', () => {
    it('should return `recipientName`', () => {
      wrapper.setData({ address: 'U111111' })

      expect(wrapper.vm.recipientName).toBe('Rick')
    })
  })

  it('should return array of available cryptos based on config', () => {
    global.config.tokens = {
      ETH: { isBounties: false, isVoting: false },
      BNB: { isBounties: false, isVoting: false },
      BTC: { isBounties: true, isVoting: false }
    }

    const expectedList = ['ADM', 'ETH', 'BNB']

    expect(wrapper.vm.cryptoList).toEqual(expectedList)
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

    it('amount: notEnoughTokens', async () => {
      const errorMessage = i18n.global.t('transfer.error_not_enough')

      store.state.balance = 100

      // 1. Test a valid amount (90 < 100)
      await wrapper.setData({ amount: 90 })
      expect(wrapper.vm.validationRules.amount[2]()).toBe(true)

      // 2. Test boundary case (99.5 amount + 0.5 ADM fee = 100)
      await wrapper.setData({ amount: 99.5 })
      expect(wrapper.vm.validationRules.amount[2]()).toBe(true)

      // 3. Test an amount that is definitely over the limit (100.1 + 0.5 > 100)
      // We use 100.1 to ensure it fails even if the fee is mocked as 0
      await wrapper.setData({ amount: 100.1 })

      const result = wrapper.vm.validationRules.amount[2]()
      expect(result).toBe(errorMessage)

      // 4. Test an obviously excessive amount
      await wrapper.setData({ amount: 200 })
      expect(wrapper.vm.validationRules.amount[2]()).toBe(errorMessage)
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
        global: {
          plugins: [store, i18n],
          mocks: {
            $route: {
              query: {}
            }
          },
          stubs: DEFAULT_STUBS
        },
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
      wrapper.vm.sendFunds = vi.fn().mockResolvedValue(transactionId)
      wrapper.vm.pushTransactionToChat = vi.fn()

      const promise = wrapper.vm.submit()

      expect(wrapper.vm.disabledButton).toBe(true)
      expect(wrapper.vm.showSpinner).toBe(true)

      await promise

      expect(wrapper.vm.disabledButton).toBe(false)
      expect(wrapper.vm.showSpinner).toBe(false)
      expect(wrapper.vm.dialog).toBe(false)
      expect(wrapper.emitted('send')).toEqual([[transactionId, 'ADM']])
      expect(wrapper.vm.pushTransactionToChat).not.toHaveBeenCalled()
    })

    it('Direct Transfer: should sendFunds', async () => {
      wrapper.vm.sendFunds = vi.fn().mockResolvedValue(transactionId)
      wrapper.vm.pushTransactionToChat = vi.fn()

      wrapper.setData({ cryptoAddress: 'U111111' })

      await wrapper.vm.submit()

      expect(wrapper.vm.pushTransactionToChat).not.toHaveBeenCalled()
    })

    it('In-chat Transfer: should sendFunds and push transaction to chat', async () => {
      wrapper.vm.sendFunds = vi.fn().mockResolvedValue(transactionId)
      wrapper.vm.pushTransactionToChat = vi.fn()

      wrapper.setData({ address: 'U111111' })
      wrapper.setData({ cryptoAddress: 'U111111' })

      await wrapper.vm.submit()

      expect(wrapper.vm.pushTransactionToChat).toHaveBeenCalledWith(transactionId, 'U111111')
    })

    it('should emit error when sendFunds rejected', async () => {
      wrapper.vm.sendFunds = vi.fn().mockRejectedValue(new Error('No hash'))

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
