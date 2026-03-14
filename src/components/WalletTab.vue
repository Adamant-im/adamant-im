<template>
  <div :class="classes.root">
    <crypto-icon :class="classes.cryptoIcon" :crypto="wallet.cryptoCurrency" size="medium" />

    <div :class="classes.content">
      <div v-if="isBalanceValid && !isRefreshing">{{ formattedBalance }}</div>
      <div v-else :class="classes.balanceLoading">
        <v-icon :icon="mdiDotsHorizontal" :size="WALLET_TAB_LOADING_ICON_SIZE" />
      </div>

      <div :class="classes.networkRow">
        {{ wallet.cryptoCurrency }}
        <span v-if="wallet.erc20" :class="classes.networkLabel">
          <sub>ERC20</sub>
        </span>
      </div>

      <div
        v-if="showFiatRates"
        :class="[
          classes.rates,
          {
            [classes.ratesPlaceholder]: !isRateLoaded
          }
        ]"
        :aria-hidden="!isRateLoaded"
      >
        <span v-if="isRateLoaded">{{ wallet.rate }} {{ fiatCurrency }}</span>
        <span v-else>&nbsp;</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useStore } from 'vuex'

import CryptoIcon from '@/components/icons/CryptoIcon.vue'
import numberFormat from '@/filters/numberFormat'
import { mdiDotsHorizontal } from '@mdi/js'
import { vibrate } from '@/lib/vibrate'
import { CryptoSymbol } from '@/lib/constants'
import { WALLET_TAB_LOADING_ICON_SIZE } from '@/components/wallets/helpers/uiMetrics'

const className = 'wallet-tab'
const classes = {
  root: className,
  content: `${className}__content`,
  cryptoIcon: `${className}__crypto-icon`,
  balanceLoading: `${className}__balance-loading`,
  balanceError: `${className}__balance-error`,
  networkRow: `${className}__network-row`,
  networkLabel: `${className}__network-label`,
  rates: `${className}__rates`,
  ratesPlaceholder: `${className}__rates-placeholder`
}

export type Wallet = {
  address: string
  balance: number
  cryptoName: string
  erc20: boolean
  rate: number
  cryptoCurrency: CryptoSymbol
}

type Props = {
  wallet: Wallet
  fiatCurrency: string
  hideFiatRates?: boolean
  isBalanceValid: boolean
  isRefreshing: boolean
}

const props = defineProps<Props>()

const store = useStore()

const currentBalance = computed(() => props.wallet.balance)

const isRateLoaded = computed(() => store.state.rate.isLoaded && props.wallet.rate)
const showFiatRates = computed(() => !props.hideFiatRates)

const formattedBalance = computed(() => numberFormat(props.wallet.balance, 4))

watch(currentBalance, (newBalance, oldBalance) => {
  if (oldBalance < newBalance) {
    vibrate.doubleVeryShort()
  }
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/components/_wallet-compact-content.scss' as walletCompactContent;
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss' as mixins;
@use 'vuetify/settings';

.wallet-tab {
  --a-wallet-tab-rates-color: var(--a-color-text-muted-light);

  display: flex;
  flex-direction: column;
  align-items: center;

  &__crypto-icon {
    margin-bottom: var(--a-wallet-tab-icon-offset);
  }

  &__content {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    min-height: var(--a-wallet-tab-content-min-height);
  }

  &__network-row {
    @include walletCompactContent.a-wallet-compact-line-copy();
    margin-top: var(--a-wallet-tab-balance-to-ticker-offset);
  }

  &__rates {
    @include mixins.a-text-explanation();
  }

  &__balance-loading {
    @include walletCompactContent.a-wallet-compact-line-copy();
  }

  &__balance-error {
    @include walletCompactContent.a-wallet-compact-line-copy();
  }

  &__network-label {
    font-size: var(--a-wallet-tab-network-label-size);
    @include walletCompactContent.a-wallet-compact-line-copy();
    position: relative;
    transform: translate(
      var(--a-wallet-tab-network-label-shift-x),
      var(--a-wallet-tab-network-label-shift-y)
    );

    sub {
      font-size: inherit;
      line-height: inherit;
      vertical-align: baseline;
    }
  }

  &__rates {
    margin-top: var(--a-wallet-tab-rates-offset);
  }

  &__rates-placeholder {
    visibility: hidden;
  }
}

.v-theme--light {
  .wallet-tab {
    --a-wallet-tab-rates-color: var(--a-color-text-muted-light);
  }
}

.v-theme--dark {
  .wallet-tab {
    --a-wallet-tab-rates-color: var(--a-color-text-muted-dark);
  }
}

.wallet-tab__rates {
  color: var(--a-wallet-tab-rates-color);
}

.v-tab--selected {
  .wallet-tab {
    &__rates {
      color: inherit;
    }
  }
}
</style>
