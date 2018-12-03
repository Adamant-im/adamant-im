<template>
  <v-layout row wrap justify-center>
    <v-flex xs12 md4>
      <v-card flat class="transparent white--text">

        <!-- Wallets -->
        <v-list two-line class="transparent">
          <v-subheader>
            {{ $t('wallets') }}
          </v-subheader>

          <v-list-tile
            v-for="wallet in wallets"
            :key="wallet.system"
            avatar
            @click="copyToClipboard(wallet.walletAddress)"
          >
            <v-list-tile-avatar>
              <v-icon class="grey lighten-1 white--text">{{ wallet.iconWallet }}</v-icon>
            </v-list-tile-avatar>

            <v-list-tile-content>
              <v-list-tile-title>{{ $t(wallet.titleWallet) }}</v-list-tile-title>
              <v-list-tile-sub-title>{{ wallet.walletAddress }}</v-list-tile-sub-title>
            </v-list-tile-content>

            <v-list-tile-action>
              <v-icon>mdi-content-copy</v-icon>
            </v-list-tile-action>
          </v-list-tile>
        </v-list>

        <!-- Wallets Balance -->
        <v-list two-line class="transparent">
          <v-subheader>
            {{ $t('balance') }}
          </v-subheader>
          <v-list-tile
            v-for="wallet in wallets"
            :key="wallet.system"
            :to="wallet.link"
            avatar
          >
            <v-list-tile-avatar>
              <v-icon class="grey lighten-1 white--text">{{ wallet.iconBalance }}</v-icon>
            </v-list-tile-avatar>

            <v-list-tile-content>
              <v-list-tile-title>{{ $t(wallet.titleBalance) }}</v-list-tile-title>
              <v-list-tile-sub-title>{{ wallet.walletBalance }} {{ wallet.system }}</v-list-tile-sub-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list>

        <!-- Actions -->
        <v-list class="transparent">

          <v-list-tile @click="sendFunds" avatar>
            <v-list-tile-avatar>
              <v-icon class="grey lighten-1 white--text">mdi-cube-send</v-icon>
            </v-list-tile-avatar>

            <v-list-tile-content>
              <v-list-tile-title>{{ $t('sendFunds') }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>

          <v-list-tile @click="buyTokens" avatar>
            <v-list-tile-avatar>
              <v-icon class="grey lighten-1 white--text">mdi-cash-usd</v-icon>
            </v-list-tile-avatar>

            <v-list-tile-content>
              <v-list-tile-title>{{ $t('buyTokens') }}</v-list-tile-title>
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
          titleWallet: 'adamantAddress',
          titleBalance: 'adamantBalance',
          link: '/transactions'
        },
        {
          system: 'BNB',
          walletAddress: this.$store.state.bnb.address,
          walletBalance: this.$store.state.bnb.balance,
          iconWallet: 'mdi-polaroid',
          iconBalance: 'mdi-polaroid',
          titleWallet: 'binanceCoinAddress',
          titleBalance: 'binanceCoinBalance'
        },
        {
          system: 'ETH',
          walletAddress: this.$store.state.eth.address,
          walletBalance: this.$store.state.eth.balance,
          iconWallet: 'mdi-ethereum',
          iconBalance: 'mdi-ethereum',
          titleWallet: 'ethereumAddress',
          titleBalance: 'ethereumBalance'
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
        message: 'Copied'
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

<i18n>
{
  "en": {
    "wallets": "Wallets",
    "balance": "Balance",
    "adamantAddress": "ADAMANT address",
    "ethereumAddress": "Ethereum address",
    "binanceCoinAddress": "Binance Coin Address",
    "adamantBalance": "ADAMANT balance",
    "ethereumBalance": "Ethereum balance",
    "binanceCoinBalance": "Binance Coin balance",
    "sendFunds": "Send Funds",
    "buyTokens": "Buy Tokens"
  },
  "ru": {
    "wallets": "Кошельки",
    "balance": "Баланс",
    "adamantAddress": "Кошелек ADAMANT",
    "ethereumAddress": "Кошелек Ethereum",
    "binanceCoinAddress": "Кошелек Binance Coin",
    "adamantBalance": "Баланс ADM",
    "ethereumBalance": "Баланс ETH",
    "binanceCoinBalance": "Баланс BNB",
    "sendFunds": "Отправить средства",
    "buyTokens": "Купить токены"
  }
}
</i18n>
