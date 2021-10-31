<template>
  <v-layout
    row
    wrap
    justify-center
    :class="className"
  >
    <container>
      <v-card
        flat
        class="transparent white--text"
        :class="`${className}__card`"
      >
        <!-- Wallets -->
        <v-card
          :class="`${className}__wallets`"
          flat
        >
          <v-tabs
            ref="vtabs"
            v-model="currentWallet"
            grow
            show-arrows
          >
            <v-tab
              v-for="wallet in wallets"
              :key="wallet.cryptoCurrency"
              :href="`#${wallet.cryptoCurrency}`"
              @wheel="onWheel"
            >
              <div>
                <crypto-icon
                  slot="icon"
                  :crypto="wallet.cryptoCurrency"
                  size="medium"
                  :class="`${className}__icon`"
                />
                <div>{{ wallet.balance | numberFormat(4) }}</div>
                <div>
                  {{ wallet.cryptoCurrency }}
                  <span
                    v-if="wallet.erc20"
                    style="font-size:10px"
                  >
                    <sub>ERC20</sub>
                  </span>
                </div>
              </div>
            </v-tab>

            <v-tab-item
              v-for="wallet in wallets"
              :key="wallet.cryptoCurrency"
              :value="wallet.cryptoCurrency"
            >
              <wallet-card
                :address="wallet.address"
                :balance="wallet.balance"
                :crypto="wallet.cryptoCurrency"
                :crypto-name="wallet.cryptoName"
                @click:balance="goToTransactions"
              >
                <crypto-icon
                  slot="icon"
                  :crypto="wallet.cryptoCurrency"
                  size="large"
                />
              </wallet-card>
            </v-tab-item>
          </v-tabs>
        </v-card>
      </v-card>
    </container>
  </v-layout>
</template>

<script>
import WalletCard from '@/components/WalletCard'
import CryptoIcon from '@/components/icons/CryptoIcon'

import { Cryptos, CryptosNames, isErc20 } from '@/lib/constants'

/**
 * Center VTab element on click.
 *
 * @override vuetify.VTabs.methods.scrollIntoView()
 */
function scrollIntoView () {
  if (!this.activeTab) return
  if (!this.isOverflowing) return (this.scrollOffset = 0)

  const totalWidth = this.widths.wrapper + this.scrollOffset
  const { clientWidth, offsetLeft } = this.activeTab.$el

  const scrollOffset = this.scrollOffset - (totalWidth - offsetLeft - clientWidth / 2 - this.widths.wrapper / 2)

  if (scrollOffset <= 0) {
    this.scrollOffset = 0
  } else if (scrollOffset >= this.widths.container - this.widths.wrapper) {
    this.scrollOffset = this.widths.container - this.widths.wrapper
  } else {
    this.scrollOffset = scrollOffset
  }
}

export default {
  components: {
    WalletCard,
    CryptoIcon
  },
  computed: {
    className: () => 'account-view',
    wallets () {
      return Object.keys(Cryptos).map(crypto => {
        const state = this.$store.state
        const key = crypto.toLowerCase()
        const address = crypto === Cryptos.ADM ? state.address : state[key].address
        const balance = crypto === Cryptos.ADM ? state.balance : state[key].balance
        const erc20 = isErc20(crypto.toUpperCase())

        return {
          address,
          balance,
          cryptoCurrency: crypto,
          cryptoName: CryptosNames[crypto],
          erc20
        }
      })
    },
    currentWallet: {
      get () {
        return this.$store.state.options.currentWallet
      },
      set (value) {
        this.$store.commit('options/updateOption', {
          key: 'currentWallet',
          value
        })
      }
    }
  },
  mounted () {
    this.$refs.vtabs.scrollIntoView = scrollIntoView
  },
  methods: {
    goToTransactions (crypto) {
      this.$router.push({
        name: 'Transactions',
        params: {
          crypto
        }
      })
    },
    onWheel (e) {
      const currentWallet = this.wallets.find(wallet => wallet.cryptoCurrency === this.currentWallet)
      const currentWalletIndex = this.wallets.indexOf(currentWallet)

      const nextWalletIndex = e.deltaY < 0 ? currentWalletIndex + 1 : currentWalletIndex - 1
      const nextWallet = this.wallets[nextWalletIndex]

      if (nextWallet) this.currentWallet = nextWallet.cryptoCurrency
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '~vuetify/src/stylus/settings/_variables.styl'
@import '~vuetify/src/stylus/settings/_colors.styl'
@import '../assets/stylus/settings/_colors.styl'

/**
 * 1. Reset VTabs container fixed height.
 * 2. Reset VTabItem opacity.
 */
.account-view
  &__wallets
    &.v-card
      background-color: transparent
    >>> .v-tabs__container
      height: auto // [1]
    >>> .v-tabs__slider
      height: 2px
    >>> .v-tabs__wrapper
      padding: 10px 0px 1px 0px
      margin-bottom: 10px
    >>> .v-tabs__item
      font-weight: 300
      padding: 6px 4px
    >>> .v-tabs__item--active
      font-weight: 500
    >>> .v-tabs__item:not(.v-tabs__item--active) // [2]
      opacity: 1
    >>> .v-tabs__div
      font-size: 16px
      min-width: 74px
  &__icon
    margin-bottom: 3px

/** Themes **/
.theme--light
  .account-view
    &__wallets
      >>> .v-tabs__bar
        background-color: $adm-colors.secondary2-transparent
      >>> .v-tabs__slider
        background-color: $adm-colors.primary !important
      >>> .v-tabs__item
        color: $adm-colors.regular
      >>> .v-tabs__icon
        color: $adm-colors.primary2
        pointer-events: none
      >>> .v-tabs__wrapper--show-arrows
        margin-left: 0
        margin-right: 0
      >>> .v-tabs__item--active
        color: $adm-colors.primary
        .svg-icon
          fill: $adm-colors.primary
.theme--dark
  .account-view
    &__wallets
      >>> .v-tabs__bar
        background-color: transparent
      >>> .v-tabs__slider
        background-color: $adm-colors.primary !important
      >>> .v-tabs__icon
        color: $adm-colors.primary2
        pointer-events: none
      >>> .v-tabs__wrapper--show-arrows
        margin-left: 0
        margin-right: 0
      >>> .v-tabs__item
        color: $shades.white
      >>> .v-tabs__item--active
        color: $adm-colors.primary
        .svg-icon
          fill: $adm-colors.primary
</style>
