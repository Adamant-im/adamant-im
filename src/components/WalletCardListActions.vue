<template>
  <v-list :class="className">
    <v-list-item
      avatar
      @click="sendFunds"
    >
      <v-list-item-avatar :class="`${className}__avatar`">
        <v-icon :class="`${className}__icon`">
          mdi-bank-transfer-out
        </v-icon>
      </v-list-item-avatar>

      <v-list-item-content>
        <v-list-item-title :class="`${className}__title`">
          {{ $t('home.send_crypto', { crypto }) }}
        </v-list-item-title>
      </v-list-item-content>
    </v-list-item>

    <v-list-item
      v-if="isADM"
      avatar
      @click="buyTokens"
    >
      <v-list-item-avatar :class="`${className}__avatar`">
        <v-icon :class="`${className}__icon`">
          mdi-finance
        </v-icon>
      </v-list-item-avatar>

      <v-list-item-content>
        <v-list-item-title :class="`${className}__title`">
          {{ $t('home.buy_tokens_btn') }}
        </v-list-item-title>
      </v-list-item-content>
    </v-list-item>

    <v-list-item
      v-if="isADM && !hasAdmTokens"
      avatar
      @click="getFreeTokens"
    >
      <v-list-item-avatar :class="`${className}__avatar`">
        <v-icon :class="`${className}__icon`">
          mdi-gift
        </v-icon>
      </v-list-item-avatar>

      <v-list-item-content>
        <v-list-item-title :class="`${className}__title`">
          {{ $t('home.free_adm_btn') }}
        </v-list-item-title>
      </v-list-item-content>
    </v-list-item>

    <buy-tokens-dialog
      v-model="showBuyTokensDialog"
      :adamant-address="$store.state.address"
    />
  </v-list>
</template>

<script>
import { Cryptos } from '@/lib/constants'
import BuyTokensDialog from '@/components/BuyTokensDialog'
import { websiteUriToOnion } from '@/lib/uri'

export default {
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
  },
  data: () => ({
    showBuyTokensDialog: false
  }),
  computed: {
    className: () => 'wallet-actions',
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
      this.showBuyTokensDialog = true
    },
    getFreeTokens () {
      const link = websiteUriToOnion(this.$t('home.free_tokens_link') + '?wallet=' + this.$store.state.address)
      window.open(link, '_blank', 'resizable,scrollbars,status,noopener')
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../assets/stylus/themes/adamant/_mixins.scss';
@import '../assets/stylus/settings/_colors.scss';

.wallet-actions {
  &__title {
    @include a-text-caption-light();
  }
  &__avatar {
    min-width: unset;.v-avatar {
      width: unset !important;
      padding-right: 15px;
    }
  }
}

/** Themes **/
.theme--light {
  .wallet-actions {
    &__title, &__icon {
      color: map-get($adm-colors, 'regular');
    }
  }
}
</style>
