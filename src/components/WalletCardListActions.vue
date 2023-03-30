<template>
  <v-list :class="className">
    <v-list-item
      @click="sendFunds"
    >
      <template #prepend>
        <v-icon
          :class="`${className}__icon`"
          icon="mdi-bank-transfer-out"
        />
      </template>

      <v-list-item-title :class="`${className}__title`">
        {{ $t('home.send_crypto', { crypto }) }}
      </v-list-item-title>
    </v-list-item>

    <v-list-item
      v-if="isADM"
      @click="buyTokens"
    >
      <template #prepend>
        <v-icon
          :class="`${className}__icon`"
          icon="mdi-finance"
        />
      </template>

      <v-list-item-title :class="`${className}__title`">
        {{ $t('home.buy_tokens_btn') }}
      </v-list-item-title>
    </v-list-item>

    <v-list-item
      v-if="isADM && !hasAdmTokens"
      @click="getFreeTokens"
    >
      <template #prepend>
        <v-icon
          :class="`${className}__icon`"
          icon="mdi-gift"
        />
      </template>

      <v-list-item-title :class="`${className}__title`">
        {{ $t('home.free_adm_btn') }}
      </v-list-item-title>
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
@import 'vuetify/settings';
@import '../assets/styles/themes/adamant/_mixins.scss';
@import '../assets/styles/settings/_colors.scss';

.wallet-actions {
  &__title {
    @include a-text-caption-light();
  }
  :deep(.v-list-item__prepend) {
    > .v-icon {
      margin-inline-end: 16px;
    }
  }
  :deep(.v-list-item) {
    padding: 0 8px;
  }
  :deep(.v-list-item__prepend) {
    > .v-icon {
      opacity: unset;
    }
  }
  :deep(.v-list-item__append) {
    > .v-icon {
      opacity: unset;
    }
  }
}

/** Themes **/
.v-theme--light {
  .wallet-actions {
    &__title, &__icon {
      color: map-get($adm-colors, 'regular');
    }
  }
}

.v-theme--dark {
  .wallet-actions {
    &__title, &__icon {
      color: map-get($shades, 'white');
    }
  }
}
</style>
