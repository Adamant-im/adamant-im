<template>
  <v-list-item :class="classes.root">
    <template v-slot:default>
      <div :class="classes.cryptoContent">
        <v-list-item-title :class="classes.cryptoTitle">{{
          localWallet.cryptoName
        }}</v-list-item-title>
        <v-list-item-subtitle :class="classes.cryptoSubtitleWrap">
          <p :class="classes.cryptoSubtitle">
            <span :class="classes.cryptoSubtitleMuted">{{ localWallet.type }}</span>
            <span :class="classes.cryptoSubtitleBold">{{ localWallet.symbol }}</span>
          </p>
        </v-list-item-subtitle>
      </div>
    </template>
    <template v-slot:prepend>
      <v-avatar>
        <crypto-icon :crypto="localWallet.symbol" :customSize="iconSize" />
      </v-avatar>
    </template>

    <template v-slot:append>
      <WalletBalance :symbol="localWallet.symbol" class="mr-2"></WalletBalance>
      <v-checkbox
        class="pa-1"
        :class="classes.checkbox"
        color="grey darken-1"
        density="comfortable"
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
        density="comfortable"
        :icon="mdiMenu"
        :disabled="!localWallet.isVisible || !!search"
        variant="text"
      ></v-btn>
    </template>
  </v-list-item>
</template>

<script lang="ts">
import CryptoIcon from '@/components/icons/CryptoIcon.vue'
import WalletBalance from '@/components/wallets/WalletBalance.vue'
import { defineComponent, PropType, toRef } from 'vue'
import { useStore } from 'vuex'
import { CryptoSymbol } from '@/lib/constants'
import { mdiMenu } from '@mdi/js'

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
  cryptoContent: `${className}__crypto-content`,
  cryptoSubtitle: `${className}__crypto-subtitle`,
  cryptoSubtitleWrap: `${className}__crypto-subtitle-wrap`,
  cryptoSubtitleMuted: `${className}__crypto-subtitle-muted`,
  cryptoSubtitleBold: `${className}__crypto-subtitle-bold`,
  cryptoTitle: `${className}__crypto-title`,
  checkbox: `${className}__checkbox`
}
const iconSize = 32

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
      iconSize,
      localWallet,
      store,
      mdiMenu
    }
  }
})
</script>

<style scoped lang="scss">
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';

.wallets-view {
  --a-wallets-list-item-content-height: var(--a-control-size-md);
  --a-wallets-list-item-content-gap: var(--a-financial-stack-gap);
  --a-wallets-list-item-line-height: 1;
  --a-wallets-list-item-title-line-height: 1.1;
  --a-wallets-list-item-checkbox-offset: calc(var(--a-space-2) * -1);
  --a-wallets-list-item-subtitle-weight: var(--a-financial-text-font-weight);
  --a-wallets-list-item-subtitle-muted-dark: var(--a-color-text-muted-dark);

  &__crypto-content {
    height: var(--a-wallets-list-item-content-height);
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--a-wallets-list-item-content-gap);
    line-height: var(--a-wallets-list-item-line-height);
  }
  &__crypto-subtitle-wrap {
    opacity: 1;
    line-height: var(--a-wallets-list-item-line-height);
  }
  &__crypto-subtitle {
    display: flex;
    align-items: baseline;
    gap: var(--a-space-1);
    font-weight: var(--a-wallets-list-item-subtitle-weight);
    line-height: var(--a-wallets-list-item-line-height);
  }
  &__crypto-subtitle-muted {
    color: var(--a-wallets-list-item-subtitle-muted-dark);
  }
  &__crypto-subtitle-bold {
    font-weight: 600;
  }
  &__crypto-title {
    line-height: var(--a-wallets-list-item-title-line-height);
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
    margin-left: var(--a-wallets-list-item-checkbox-offset);
  }

  :deep(.sortable-chosen) {
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
        color: map.get(colors.$adm-colors, 'regular');
      }
      :deep(.v-input--selection-controls__ripple),
      :deep(.v-input--selection-controls__input) i {
        color: map.get(colors.$adm-colors, 'regular') !important;
        caret-color: map.get(colors.$adm-colors, 'regular') !important;
      }
    }
    &__crypto-subtitle-muted {
      color: map.get(colors.$adm-colors, 'muted');
    }
    &__crypto-subtitle-bold {
      color: map.get(colors.$adm-colors, 'regular');
    }
  }
}
</style>
