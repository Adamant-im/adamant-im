<template>
  <v-layout row wrap justify-center>
    <v-flex xs12 sm12 md8 lg5>
      <v-card flat class="transparent white--text">

        <!-- Wallets -->
        <v-tabs color="transparent" grow slider-color="blue">
          <v-tab :key="wallet.system" color="black" v-for="wallet in wallets">
            {{ $t(wallet.system) }}
          </v-tab>
          <v-tab-item :key="wallet.system" v-for="wallet in wallets">
            <v-flex xs12>
              <v-card :class="wallet.style + ' elevation-2'" flat>
                <v-card-title primary-title>
                  <v-spacer></v-spacer>{{ $t(wallet.titleWallet) }}
                </v-card-title>
                <v-layout row>
                  <v-card-text>
                    <div class="caption grey--text">{{ $t(wallet.titleBalance) }}</div>
                    <div>{{ wallet.walletBalance }}</div>
                    <div class="caption grey--text">{{ $t(wallet.titleWallet) }}</div>
                    <div>{{ wallet.walletAddress }}</div>
                  </v-card-text>
                </v-layout>
                <v-card-actions class="pa-3">
                  <v-btn @click="copyToClipboard(wallet.walletAddress)" color="blue" flat>
                    {{ $t(wallet.buttonCopyAddress) }}
                  </v-btn>
                  <v-spacer></v-spacer>
                  <!--v-btn flat color="blue">
                    {{ $t(wallet.buttonCreateQrCode) }}
                  </v-btn-->
                </v-card-actions>
              </v-card>
            </v-flex>
          </v-tab-item>
        </v-tabs>

        <!-- Actions -->
        <v-list class="transparent">

          <v-list-tile @click="sendFunds" avatar>
            <v-list-tile-avatar>
              <v-icon class="grey lighten-1 white--text">mdi-cube-send</v-icon>
            </v-list-tile-avatar>

            <v-list-tile-content>
              <v-list-tile-title>{{ $t('home.send_btn') }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>

          <v-list-tile @click="buyTokens" avatar>
            <v-list-tile-avatar>
              <v-icon class="grey lighten-1 white--text">mdi-cash-usd</v-icon>
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
import { copyToClipboard } from '@/lib/textHelpers'

export default {
  computed: {
    wallets () {
      return [
        {
          system: 'ADM',
          walletAddress: this.$store.state.address,
          walletBalance: this.$store.state.balance,
          iconWallet: 'mdi-polaroid',
          iconBalance: 'mdi-polaroid',
          titleWallet: 'home.your_address_ADM',
          titleBalance: 'home.your_balance_ADM',
          buttonCopyAddress: 'home.copy',
          buttonCreateQrCode: 'home.create_qrcode',
          link: '/transactions',
          style: 'wallet-adm'
        },
        {
          system: 'BNB',
          walletAddress: this.$store.state.bnb.address,
          walletBalance: this.$store.state.bnb.balance,
          iconWallet: 'mdi-polaroid',
          iconBalance: 'mdi-polaroid',
          titleWallet: 'home.your_address_BNB',
          titleBalance: 'home.your_balance_BNB',
          buttonCopyAddress: 'home.copy',
          buttonCreateQrCode: 'home.create_qrcode',
          style: 'wallet-bnb'
        },
        {
          system: 'ETH',
          walletAddress: this.$store.state.eth.address,
          walletBalance: this.$store.state.eth.balance,
          iconWallet: 'mdi-ethereum',
          iconBalance: 'mdi-ethereum',
          titleWallet: 'home.your_address_ETH',
          titleBalance: 'home.your_balance_ETH',
          buttonCopyAddress: 'home.copy',
          buttonCreateQrCode: 'home.create_qrcode',
          style: 'wallet-eth'
        }
      ]
    }
  },
  data: () => ({
  }),
  methods: {
    copyToClipboard (text) {
      copyToClipboard(text)

      this.$store.dispatch('snackbar/show', {
        message: this.$t('home.copied')
      })
    },
    sendFunds () {
      this.$router.push('/transfer')
    },
    buyTokens () {
      window.open('https://adamant.im/buy-tokens/?wallet=U9203183357885757380', '_blank')
    }
  }
}
</script>

<style scoped>
.wallet-adm {
  background: url('/img/Wallet/adm-address.svg') center right no-repeat;
}
.wallet-bnb {
  background: url('/img/Wallet/bnb-address.svg') center right no-repeat;
}
.wallet-eth {
  background: url('/img/Wallet/eth-address.svg') center right no-repeat;
}
</style>
