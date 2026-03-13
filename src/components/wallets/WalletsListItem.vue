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
        <crypto-icon
          :class="classes.cryptoIcon"
          :crypto="localWallet.symbol"
          :customSize="WALLET_LIST_ICON_SIZE"
        />
      </v-avatar>
    </template>

    <template v-slot:append>
      <WalletBalance :symbol="localWallet.symbol" :class="classes.balance"></WalletBalance>
      <v-checkbox
        :class="[classes.checkbox, classes.checkboxControl]"
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
        :class="classes.sortableHandle"
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
import { WALLET_LIST_ICON_SIZE } from '@/components/wallets/helpers/uiMetrics'
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
  balance: `${className}__balance`,
  cryptoContent: `${className}__crypto-content`,
  cryptoIcon: `${className}__crypto-icon`,
  cryptoSubtitle: `${className}__crypto-subtitle`,
  cryptoSubtitleWrap: `${className}__crypto-subtitle-wrap`,
  cryptoSubtitleMuted: `${className}__crypto-subtitle-muted`,
  cryptoSubtitleBold: `${className}__crypto-subtitle-bold`,
  cryptoTitle: `${className}__crypto-title`,
  checkbox: `${className}__checkbox`,
  checkboxControl: `${className}__checkbox-control`,
  sortableHandle: `${className}__sortable-handle`
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
      store,
      mdiMenu,
      WALLET_LIST_ICON_SIZE
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
  --a-wallets-list-item-checkbox-offset: calc(var(--a-space-2) * -1);
  --a-wallets-list-item-subtitle-weight: var(--a-financial-text-font-weight);
  --a-wallets-list-item-subtitle-muted-dark: var(--a-color-text-muted-dark);

  &__crypto-content {
    height: var(--a-wallets-list-item-content-height);
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--a-wallets-list-item-content-gap);
    line-height: var(--a-wallet-compact-line-height);
  }
  &__crypto-subtitle-wrap {
    opacity: 1;
    line-height: var(--a-wallet-compact-line-height);
  }
  &__crypto-subtitle {
    display: flex;
    align-items: baseline;
    gap: var(--a-space-1);
    font-weight: var(--a-wallets-list-item-subtitle-weight);
    line-height: var(--a-wallet-compact-line-height);
  }
  &__crypto-subtitle-muted {
    color: var(--a-wallets-list-item-subtitle-muted-dark);
  }
  &__crypto-subtitle-bold {
    font-weight: 600;
  }
  &__crypto-title {
    line-height: var(--a-wallet-compact-title-line-height);
  }
  &__balance {
    margin-inline-end: var(--a-wallets-list-item-balance-offset-inline-end);
  }
  &__checkbox-control {
    padding: var(--a-wallets-list-item-checkbox-padding);
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
    box-shadow: var(--a-wallets-list-item-sortable-shadow);
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
        color: map.get(colors.$adm-colors, 'regular');
        caret-color: map.get(colors.$adm-colors, 'regular');
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
