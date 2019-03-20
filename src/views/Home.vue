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
                <icon :width="36" :height="36" fill="#BDBDBD" slot="icon" class="mb-2">
                  <component :is="wallet.icon"/>
                </icon>
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
                <icon :width="125" :height="125" fill="#BDBDBD" slot="icon">
                  <component :is="wallet.icon"/>
                </icon>
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
import Icon from '@/components/icons/BaseIcon'
import AdmFillIcon from '@/components/icons/AdmFill'
import BnbFillIcon from '@/components/icons/BnbFill'
import EthFillIcon from '@/components/icons/EthFill'
import BnzFillIcon from '@/components/icons/BnzFill'
import DogeFillIcon from '@/components/icons/DogeFill'
import DashFillIcon from '@/components/icons/DashFill'

export default {
  computed: {
    wallets () {
      return [
        {
          address: this.$store.state.address,
          balance: this.$store.state.balance,
          cryptoCurrency: 'ADM',
          cryptoName: 'ADAMANT',
          icon: 'adm-fill-icon'
        },
        {
          address: this.$store.state.bnb.address,
          balance: this.$store.state.bnb.balance,
          cryptoCurrency: 'BNB',
          cryptoName: 'Binance Coin',
          icon: 'bnb-fill-icon'
        },
        {
          address: this.$store.state.eth.address,
          balance: this.$store.state.eth.balance,
          cryptoCurrency: 'ETH',
          cryptoName: 'Ethereum',
          icon: 'eth-fill-icon'
        },
        {
          address: this.$store.state.bz.address,
          balance: this.$store.state.bz.balance,
          cryptoCurrency: 'BZ',
          cryptoName: 'Bit-Z',
          icon: 'bnz-fill-icon'
        },
        {
          address: this.$store.state.doge.address,
          balance: this.$store.state.doge.balance,
          cryptoCurrency: 'DOGE',
          cryptoName: 'DOGE',
          icon: 'doge-fill-icon'
        },
        {
          address: this.$store.state.dash.address,
          balance: this.$store.state.dash.balance,
          cryptoCurrency: 'DASH',
          cryptoName: 'DASH',
          icon: 'dash-fill-icon'
        }
      ]
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
    Icon,
    AdmFillIcon,
    BnbFillIcon,
    EthFillIcon,
    BnzFillIcon,
    DogeFillIcon,
    DashFillIcon
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
