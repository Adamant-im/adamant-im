<template>
  <v-layout row wrap justify-center :class="className">

    <container>

      <v-card flat class="transparent white--text" :class="`${className}__card`">

        <!-- Wallets -->
        <v-card :class="`${className}__wallets`" flat>
          <v-tabs
            v-model="currentWallet"
            grow
            ref="vtabs"
          >
            <v-tab
              v-for="wallet in wallets"
              :href="`#${wallet.cryptoCurrency}`"
              :key="wallet.cryptoCurrency"
            >
              <div>
                <crypto-icon
                  :crypto="wallet.cryptoCurrency"
                  size="medium"
                  slot="icon"
                  :class="`${className}__icon`"
                />
                <div>{{ wallet.balance | numberFormat(4) }}</div>
                <div>{{ wallet.cryptoCurrency }}</div>
              </div>
            </v-tab>

            <v-tab-item
              v-for="wallet in wallets"
              :value="wallet.cryptoCurrency"
              :key="wallet.cryptoCurrency"
            >
              <wallet-card
                :address="wallet.address"
                :balance="wallet.balance"
                :crypto="wallet.cryptoCurrency"
                :crypto-name="wallet.cryptoName"
                @click:balance="goToTransactions"
              >
                <crypto-icon
                  :crypto="wallet.cryptoCurrency"
                  size="large"
                  slot="icon"
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

import { Cryptos, CryptosNames } from '@/lib/constants'

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
  mounted () {
    this.$refs.vtabs.scrollIntoView = scrollIntoView
  },
  computed: {
    className: () => 'account-view',
    wallets () {
      return Object.keys(Cryptos).map(crypto => {
        const state = this.$store.state
        const key = crypto.toLowerCase()
        const address = crypto === Cryptos.ADM ? state.address : state[key].address
        const balance = crypto === Cryptos.ADM ? state.balance : state[key].balance

        return {
          address,
          balance,
          cryptoCurrency: crypto,
          cryptoName: CryptosNames[crypto]
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
  methods: {
    goToTransactions (crypto) {
      this.$router.push({
        name: 'Transactions',
        params: {
          crypto
        }
      })
    }
  },
  components: {
    WalletCard,
    CryptoIcon
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
  &__card
    margin: -24px
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
    >>> .v-tabs__item--active
      font-weight: 500
    >>> .v-tabs__item:not(.v-tabs__item--active) // [2]
      opacity: 1
    >>> .v-tabs__div
      font-size: 16px
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
        background-color: $shades.white !important
      >>> .v-tabs__item
        color: $shades.white
      >>> .v-tabs__item--active
        color: $adm-colors.white
        .svg-icon
          fill: $adm-colors.white

/** Breakpoints **/
@media $display-breakpoints.md-and-down
  .account-view
    &__card
      margin: -20px
</style>
