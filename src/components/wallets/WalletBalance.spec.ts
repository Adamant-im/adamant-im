import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'

import WalletBalance from './WalletBalance.vue'

vi.mock('vuetify', () => ({
  useDisplay: () => ({
    xs: false
  })
}))

const createMockStore = ({
  admBalance = 0,
  admBalanceActualUntil = Date.now() + 60_000,
  rates = {
    'ADM/USD': 1
  }
} = {}) => {
  return createStore({
    state: {
      balance: admBalance,
      balanceActualUntil: admBalanceActualUntil,
      options: {
        currentRate: 'USD'
      },
      rate: {
        rates
      }
    }
  })
}

describe('WalletBalance', () => {
  it('renders zero ADM balance without throwing BigNumber error', () => {
    const wrapper = shallowMount(WalletBalance, {
      props: {
        symbol: 'ADM'
      },
      global: {
        plugins: [createMockStore()]
      }
    })

    expect(wrapper.text()).toContain('0')
    expect(wrapper.find('.wallet-balance__status-title').exists()).toBe(true)
    expect(wrapper.find('.wallet-balance--single-line').exists()).toBe(true)
    expect(wrapper.find('.wallet-balance__status-text').exists()).toBe(false)
  })

  it('renders loading dots instead of zero before the wallet balance becomes valid', () => {
    const wrapper = shallowMount(WalletBalance, {
      props: {
        symbol: 'ADM'
      },
      global: {
        plugins: [
          createMockStore({
            admBalance: 0,
            admBalanceActualUntil: Date.now() - 60_000
          })
        ]
      }
    })

    expect(wrapper.find('.wallet-balance__status-loading').exists()).toBe(true)
    expect(wrapper.find('.wallet-balance__status-title').exists()).toBe(false)
    expect(wrapper.find('.wallet-balance__status-text').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('USD 0')
  })
})
