<template>
  <v-card
    flat
    :class="className"
  >
    <v-list
      lines="two"
      :class="`${className}__list`"
    >
      <v-list-item
        :class="`${className}__tile`"
        @click="showShareURIDialog = true"
      >
        <v-list-item-title :class="`${className}__title`">
          {{ $t('home.wallet_crypto', { crypto: cryptoName }) }}
        </v-list-item-title>
        <v-list-item-subtitle :class="`${className}__subtitle`">
          {{ address }}
        </v-list-item-subtitle>

        <template #append>
          <v-btn
            icon
            ripple
            variant="text"
            :class="`${className}__action`"
          >
            <v-icon
              :class="`${className}__icon`"
              icon="mdi-share-variant"
              size="small"
            />
          </v-btn>
        </template>
      </v-list-item>

      <v-list-item @click="$emit('click:balance', crypto)">
        <v-list-item-title :class="`${className}__title`">
          {{ $t('home.balance') }}
        </v-list-item-title>
        <v-list-item-subtitle :class="`${className}__subtitle`">
          {{ currency(balance, crypto, true) }} <span
            v-if="$store.state.rate.isLoaded"
            class="a-text-regular"
          >~{{ rate }} {{ currentCurrency }}</span>
        </v-list-item-subtitle>

        <template #append>
          <v-btn
            icon
            ripple
            variant="text"
            :class="`${className}__action`"
          >
            <v-icon
              :class="`${className}__icon`"
              icon="mdi-chevron-right"
              size="small"
            />
          </v-btn>
        </template>
      </v-list-item>
    </v-list>

    <WalletCardListActions
      :class="`${className}__list`"
      :crypto="crypto"
      :is-a-d-m="isADM"
    />

    <ShareURIDialog
      v-model="showShareURIDialog"
      :address="address"
      :crypto="crypto"
      :is-a-d-m="isADM"
    />
  </v-card>
</template>

<script>
import ShareURIDialog from '@/components/ShareURIDialog'
import WalletCardListActions from '@/components/WalletCardListActions'
import { Cryptos } from '@/lib/constants'
import currency from '@/filters/currencyAmountWithSymbol'

export default {
  components: {
    ShareURIDialog,
    WalletCardListActions
  },
  props: {
    address: {
      type: String,
      required: true
    },
    balance: {
      type: Number,
      required: true
    },
    rate: {
      type: Number,
      required: true
    },
    crypto: {
      type: String,
      default: 'ADM'
    },
    cryptoName: {
      type: String,
      default: 'ADAMANT'
    },
    currentCurrency: {
      type: String,
      default: 'USD'
    }
  },
  emits: ['click:balance'],
  data: () => ({ showShareURIDialog: false }),
  computed: {
    className () {
      return 'wallet-card'
    },
    isADM () {
      return this.crypto === Cryptos.ADM
    }
  },
  methods: {
    currency
  }
}
</script>

<style lang="scss" scoped>
@import '../assets/styles/themes/adamant/_mixins.scss';
@import '~vuetify/settings';
@import '../assets/styles/settings/_colors.scss';

.wallet-card {
  &__title {
    @include a-text-caption();
  }
  &__subtitle {
    @include a-text-regular-enlarged();
    word-break: break-word;
    span {
      font-style: italic;
      color: inherit;
    }
  }
  &__list {
    padding: 8px 0 0;
  }
  &__tile {
    // height: 60px // too small height
  }
}

/** Themes **/
.v-theme--light {
  .wallet-card {
    background-color: transparent;
    &__list {
      background: inherit;
    }
    &__title {
      color: map-get($adm-colors, 'regular');
    }
    &__subtitle {
      color: map-get($adm-colors, 'muted');
    }
    &__action {
      color: map-get($adm-colors, 'muted');
    }
  }
}
.v-theme--dark {
  .wallet-card {
    background-color: transparent;
    &__list {
      background: inherit;
    }
    &__title {
      color: map-get($shades, 'white');
    }
    &__subtitle {
      color: map-get($shades, 'white');
    }
  }
}
</style>
