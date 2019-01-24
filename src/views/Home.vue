<template>
  <v-layout row wrap justify-center class="home-page">

    <v-flex xs12 sm12 md8 lg5>

      <v-card flat class="transparent white--text">

        <!-- Wallets -->
        <v-card class="home-page__wallets">
          <v-tabs grow fixed-tabs slider-color="white">
            <v-tab
              v-for="wallet in wallets"
              :key="wallet.cryptoCurrency"
            >
              {{ wallet.cryptoCurrency }}
            </v-tab>

            <v-tab-item
              v-for="wallet in wallets"
              :key="wallet.cryptoCurrency"
            >
              <wallet-card
                :address="wallet.address"
                :balance="wallet.balance"
                :crypto-currency="wallet.cryptoCurrency"
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

        <!-- Actions -->
        <v-list class="action-list transparent">
          <v-list-tile @click="sendFunds" avatar>
            <v-list-tile-avatar>
              <v-icon class="action-list__icon">mdi-cube-send</v-icon>
            </v-list-tile-avatar>

            <v-list-tile-content>
              <v-list-tile-title>{{ $t('home.send_btn') }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>

          <v-list-tile @click="buyTokens" avatar>
            <v-list-tile-avatar>
              <v-icon class="action-list__icon">mdi-cash-usd</v-icon>
            </v-list-tile-avatar>

            <v-list-tile-content>
              <v-list-tile-title>{{ $t('home.invest_btn') }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list>

      </v-card>

    </v-flex>

  </v-layout>
</template>

<script>
import WalletCard from '@/components/WalletCard'
import Icon from '@/components/icons/BaseIcon'
import AdmFillIcon from '@/components/icons/AdmFill'
import BnbFillIcon from '@/components/icons/BnbFill'
import EthFillIcon from '@/components/icons/EthFill'
import BnzFillIcon from '@/components/icons/BnzFill'

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
        }
      ]
    }
  },
  data: () => ({
  }),
  methods: {
    sendFunds () {
      this.$router.push('/transfer')
    },
    buyTokens () {
      window.open('https://adamant.im/buy-tokens/?wallet=U9203183357885757380', '_blank')
    },
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
    BnzFillIcon
  }
}
</script>

<style lang="stylus" scoped>
@import '~vuetify/src/stylus/settings/_colors.styl'

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
