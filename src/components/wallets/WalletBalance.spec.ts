import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'

import WalletBalance from './WalletBalance.vue'

vi.mock('vuetify', () => ({
  useDisplay: () => ({
    xs: false
  })
}))

const createMockStore = (balance = 0) => {
  return createStore({
    state: {
      balance,
      options: {
        currentRate: 'USD'
      },
      rate: {
        rates: {
          'ADM/USD': 1
        }
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
        plugins: [createMockStore(0)]
      }
    })

    expect(wrapper.text()).toContain('0')
    expect(wrapper.find('.wallet-balance__status-title').exists()).toBe(true)
  })
})
