<template>
  <v-list-item :title="localWallet.cryptoName">
    <v-list-item-subtitle>
      <p>
        {{ localWallet.type }} <b>{{ localWallet.symbol }}</b>
      </p>
    </v-list-item-subtitle>
    <template v-slot:prepend>
      <v-avatar>
        <crypto-icon :class="classes.cryptoIcon" :crypto="localWallet.symbol" size="small" />
      </v-avatar>
    </template>

    <template v-slot:append>
      <WalletBalance :symbol="localWallet.symbol"></WalletBalance>
      <v-checkbox
        hide-details
        :model-value="store.getters['wallets/getVisibility'](localWallet.symbol)"
        @update:model-value="
          store.commit('wallets/updateVisibility', {
            symbol: localWallet.symbol,
            isVisible: $event
          })
        "
      ></v-checkbox>
      <v-btn
        color="grey-lighten-1"
        class="handle"
        icon="mdi-menu"
        :disabled="!localWallet.isVisible || !!search"
        variant="text"
      ></v-btn>
    </template>
  </v-list-item>
</template>

<script lang="ts">
import CryptoIcon from '@/components/icons/CryptoIcon.vue'
import WalletBalance from '@/components/wallets/WalletBalance.vue'
import { computed, defineComponent, PropType, toRef } from 'vue'
import { useStore } from 'vuex'
import { CryptoSymbol } from '@/lib/constants'

type Wallet = {
  erc20: boolean
  cryptoName: string
  isVisible: boolean
  symbol: CryptoSymbol
  type: string
}

const className = 'wallets-view'
const classes = {
  root: className,
  cryptoIcon: `${className}__crypto-icon`
}

export default defineComponent({
  components: {
    WalletBalance,
    CryptoIcon
  },
  props: {
    wallet: {
      type: Object as PropType<Wallet>,
      required: true
    },
    search: {
      type: String,
      required: false,
      default: ''
    }
  },
  setup(props) {
    const store = useStore()
    const localWallet = toRef(props, 'wallet')

    return {
      classes,
      localWallet,
      store
    }
  }
})
</script>

<style scoped lang="scss">
@import '@/assets/styles/themes/adamant/_mixins.scss';
@import 'vuetify/settings';
@import '@/assets/styles/settings/_colors.scss';

.wallets-view {
  &__crypto-icon {
    padding-top: 3px;
  }
  &__info {
    :deep(a) {
      text-decoration-line: none;
      &:hover {
        text-decoration-line: underline;
      }
    }
  }
  :deep(.v-input--selection-controls:not(.v-input--hide-details)) .v-input__slot {
    margin-bottom: 0;
  }

  :deep(.v-checkbox) {
    margin-left: -8px;
  }

  :deep(.sortable-chosen) {
    -webkit-box-shadow:
      0 8px 9px -5px var(--v-shadow-key-umbra-opacity, rgba(0, 0, 0, 0.2)),
      0 15px 22px 2px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.14)),
      0 6px 28px 5px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.12)) !important;
    box-shadow:
      0 8px 9px -5px var(--v-shadow-key-umbra-opacity, rgba(0, 0, 0, 0.2)),
      0 15px 22px 2px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.14)),
      0 6px 28px 5px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.12)) !important;
  }
}
/** Themes **/
.v-theme--light {
  .wallets-view {
    &__checkbox {
      :deep(.v-label) {
        color: map-get($adm-colors, 'regular');
      }
      :deep(.v-input--selection-controls__ripple),
      :deep(.v-input--selection-controls__input) i {
        color: map-get($adm-colors, 'regular') !important;
        caret-color: map-get($adm-colors, 'regular') !important;
      }
    }
  }
}
</style>
