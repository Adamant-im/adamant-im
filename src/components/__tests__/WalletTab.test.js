import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'

import WalletTab from '@/components/WalletTab.vue'

const mountWalletTab = (wallet) =>
  mount(WalletTab, {
    props: {
      wallet: {
        address: '0x0000000000000000000000000000000000000001',
        balance: 12.5,
        cryptoName: 'Tether',
        erc20: false,
        rate: 12.5,
        cryptoCurrency: 'USDT',
        ...wallet
      },
      fiatCurrency: 'USD',
      isBalanceValid: true,
      isRefreshing: false
    },
    global: {
      plugins: [createStore({ state: { rate: { isLoaded: true } } })],
      stubs: { CryptoIcon: true, 'v-icon': true }
    }
  })

describe('WalletTab.vue', () => {
  it('keeps a space between the ticker and the token network', () => {
    const wrapper = mountWalletTab({ erc20: true })

    expect(wrapper.find('.wallet-tab__network-row').text()).toBe('USDT ERC20')
  })

  it('isolates the balance and the fiat rate as left-to-right values', () => {
    const wrapper = mountWalletTab()
    const isolated = wrapper.findAll('bdi[dir="ltr"]').map((bdi) => bdi.text())

    expect(isolated).toEqual(['12.5', '12.5 USD'])
  })
})
