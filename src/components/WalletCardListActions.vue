<template>
  <v-list :class="className">
    <v-list-tile @click="sendFunds" avatar>
      <v-list-tile-avatar :class="`${className}__avatar`">
        <v-icon :class="`${className}__icon`">mdi-cube-send</v-icon>
      </v-list-tile-avatar>

      <v-list-tile-content>
        <v-list-tile-title :class="`${className}__title` a-text-caption">{{ $t('home.send_crypto', { crypto }) }}</v-list-tile-title>
      </v-list-tile-content>
    </v-list-tile>

    <v-list-tile v-if="isADMCrypto" @click="buyTokens" avatar>
      <v-list-tile-avatar :class="`${className}__avatar`">
        <v-icon :class="`${className}__icon`">mdi-cash-usd</v-icon>
      </v-list-tile-avatar>

      <v-list-tile-content>
        <v-list-tile-title :class="`${className}__title` a-text-caption">{{ $t('home.invest_btn') }}</v-list-tile-title>
      </v-list-tile-content>
    </v-list-tile>

    <v-list-tile v-if="isADMCrypto && !hasAdmTokens" @click="getFreeTokens" avatar>
      <v-list-tile-avatar :class="`${className}__avatar`">
        <v-icon :class="`${className}__icon`">mdi-gift</v-icon>
      </v-list-tile-avatar>

      <v-list-tile-content>
        <v-list-tile-title :class="`${className}__title` a-text-caption">{{ $t('home.free_adm_btn') }}</v-list-tile-title>
      </v-list-tile-content>
    </v-list-tile>
  </v-list>
</template>

<script>
import { Cryptos } from '@/lib/constants'

export default {
  computed: {
    className: () => 'wallet-actions',
    hasAdmTokens () {
      return this.$store.state.balance > 0
    },
    isADMCrypto () {
      return this.crypto === Cryptos.ADM
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

<style lang="stylus" scoped>
@import '../assets/stylus/settings/_colors.styl'

.wallet-actions
  &__title
    font-size: 16px
    font-weight: 300
  &__avatar
    min-width: unset
    .v-avatar
      width: unset !important
      padding-right: 15px

/** Themes **/
.theme--light
  .wallet-actions
    &__title, &__icon
      color: $adm-colors.muted
</style>
