<template>
  <crypto-icon :class="classes.cryptoIcon" :crypto="wallet.cryptoCurrency" size="medium" />

  <div>
    <div v-if="isBalanceValid && !isRefreshing">{{ formattedBalance }}</div>
    <div v-else :class="classes.balanceLoading">
      <v-icon :icon="mdiDotsHorizontal" size="18" />
    </div>

    <div>
      {{ wallet.cryptoCurrency }}
      <span v-if="wallet.erc20" style="font-size: 10px">
        <sub>ERC20</sub>
      </span>
    </div>

    <div v-if="isRateLoaded" :class="['a-text-explanation', classes.rates]">
      {{ wallet.rate }} {{ fiatCurrency }}
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

const className = 'wallet-tab'
const classes = {
  root: className,
  cryptoIcon: `${className}__crypto-icon`,
  balanceLoading: `${className}__balance-loading`,
  balanceError: `${className}__balance-error`,
  rates: `${className}__rates`
}

export type Wallet = {
  address: string
  balance: number
  cryptoName: string
  erc20: boolean
  rate: number
  cryptoCurrency: string
  isBalanceLoading: boolean
  hasBalanceLoaded: boolean
}

type Props = {
  wallet: Wallet
  fiatCurrency: string
  isBalanceValid: boolean
  isRefreshing: boolean
}

const props = defineProps<Props>()

const store = useStore()

const currentBalance = computed(() => props.wallet.balance)

const isRateLoaded = computed(() => store.state.rate.isLoaded && props.wallet.rate)

const formattedBalance = computed(() => numberFormat(props.wallet.balance, 4))

watch(currentBalance, (newBalance, oldBalance) => {
  if (oldBalance < newBalance) {
    vibrate.doubleVeryShort()
  }
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/settings';

.wallet-tab {
  &__crypto-icon {
    margin-bottom: 3px;
  }

  &__balance-loading {
    line-height: 1;
  }

  &__balance-error {
    line-height: 1;
  }

  &__rates {
    margin-top: 2px;
  }
}

.v-theme--light {
  .wallet-tab {
    &__rates {
      color: map.get(colors.$adm-colors, 'muted');
    }
  }
}

.v-theme--dark {
  .wallet-tab {
    &__rates {
      color: hsla(0, 0%, 100%, 0.7);
    }
  }
}

.v-tab--selected {
  .wallet-tab {
    &__rates {
      color: inherit;
    }
  }
}
</style>
