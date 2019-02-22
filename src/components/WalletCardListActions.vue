<template>
  <v-list>
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

    <v-list-tile v-if="!hasAdmTokens" @click="getFreeTokens" avatar>
      <v-list-tile-avatar>
        <v-icon class="action-list__icon">mdi-gift</v-icon>
      </v-list-tile-avatar>

      <v-list-tile-content>
        <v-list-tile-title>{{ $t('home.free_adm_btn') }}</v-list-tile-title>
      </v-list-tile-content>
    </v-list-tile>
  </v-list>
</template>

<script>
import { Cryptos } from '@/lib/constants'

export default {
  computed: {
    hasAdmTokens () {
      return this.$store.state.balance > 0
    }
  },
  methods: {
    sendFunds () {
      this.$router.push({
        name: 'SendFunds',
        params: {
          cryptoCurrency: this.crypto
        }
      })
    },
    buyTokens () {
      window.open('https://adamant.im/buy-tokens/?wallet=U9203183357885757380', '_blank')
    },
    getFreeTokens () {
      const link = 'https://adamant.im/free-adm-tokens/?wallet=' + this.$store.state.address

      window.open(link, '_blank')
    }
  },
  props: {
    crypto: {
      type: String,
      default: Cryptos.ADM,
      validator: v => v in Cryptos
    }
  }
}
</script>
