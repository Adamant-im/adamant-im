<template>
  <v-layout row wrap justify-center class="home-page">

    <container>

      <v-card flat class="transparent white--text">

        <!-- Wallets -->
        <v-card class="home-page__wallets">
          <v-tabs grow slider-color="white">
            <v-tab
              v-for="wallet in wallets"
              :key="wallet.cryptoCurrency"
            >
              <div>
                <crypto-icon
                  :crypto="wallet.cryptoCurrency"
                  size="small"
                  slot="icon"
                  class="mb-2"
                />
                <div>{{ wallet.balance | numberFormat(4) }}</div>
                <div>{{ wallet.cryptoCurrency }}</div>
              </div>
            </v-tab>

            <v-tab-item
              v-for="wallet in wallets"
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

export default {
  computed: {
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
@import '~vuetify/src/stylus/settings/_colors.styl'

/**
 * 1. Reset VTabs container fixed height.
 */
.home-page__wallets >>> .v-tabs__container
  height: auto // [1]

/** Themes **/
.theme--light
  .action-list
    &__icon
      background-color: $grey.lighten-1
      color: $shades.white
.theme--dark
  .action-list
    &__icon
      background-color: $grey.darken-3
      color: $shades.white
</style>
