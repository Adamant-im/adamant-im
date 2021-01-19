<template>
  <v-list :class="className">
    <v-list-tile @click="sendFunds" avatar>
      <v-list-tile-avatar :class="`${className}__avatar`">
        <v-icon :class="`${className}__icon`">mdi-bank-transfer-out</v-icon>
      </v-list-tile-avatar>

      <v-list-tile-content>
        <v-list-tile-title :class="`${className}__title`">{{ $t('home.send_crypto', { crypto }) }}</v-list-tile-title>
      </v-list-tile-content>
    </v-list-tile>

    <v-list-tile v-if="isADM" @click="buyTokens" avatar>
      <v-list-tile-avatar :class="`${className}__avatar`">
        <v-icon :class="`${className}__icon`">mdi-finance</v-icon>
      </v-list-tile-avatar>

      <v-list-tile-content>
        <v-list-tile-title :class="`${className}__title`">{{ $t('home.buy_tokens_btn') }}</v-list-tile-title>
      </v-list-tile-content>
    </v-list-tile>

    <v-list-tile v-if="isADM && !hasAdmTokens" @click="getFreeTokens" avatar>
      <v-list-tile-avatar :class="`${className}__avatar`">
        <v-icon :class="`${className}__icon`">mdi-gift</v-icon>
      </v-list-tile-avatar>

      <v-list-tile-content>
        <v-list-tile-title :class="`${className}__title`">{{ $t('home.free_adm_btn') }}</v-list-tile-title>
      </v-list-tile-content>
    </v-list-tile>

    <buy-tokens-dialog
      v-model="showBuyTokensDialog"
      :adamant-address="$store.state.address"
    />
  </v-list>
</template>

<script>
import { Cryptos } from '@/lib/constants'
import BuyTokensDialog from '@/components/BuyTokensDialog'
import { uriToOnion } from '@/lib/uri'

export default {
  computed: {
    className: () => 'wallet-actions',
    hasAdmTokens () {
      return this.$store.state.balance > 0
    }
  },
  data: () => ({
    showBuyTokensDialog: false
  }),
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
      this.showBuyTokensDialog = true
    },
    getFreeTokens () {
      const link = uriToOnion(this.$t('home.free_tokens_link') + '?wallet=' + this.$store.state.address)
      window.open(link, '_blank', 'resizable,scrollbars,status,noopener')
    }
  },
  components: {
    BuyTokensDialog
  },
  props: {
    crypto: {
      type: String,
      default: Cryptos.ADM,
      validator: v => v in Cryptos
    },
    isADM: {
      required: true,
      type: Boolean
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '../assets/stylus/settings/_colors.styl'
@import '../assets/stylus/themes/adamant/_mixins.styl'

.wallet-actions
  &__title
    a-text-caption-light()
  &__avatar
    min-width: unset
    .v-avatar
      width: unset !important
      padding-right: 15px

/** Themes **/
.theme--light
  .wallet-actions
    &__title, &__icon
      color: $adm-colors.regular
</style>
