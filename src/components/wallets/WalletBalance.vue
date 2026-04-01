<template>
  <div
    :class="{
      [classes.root]: true,
      [classes.singleLine]: !isBalanceValid || Number(balance) === 0
    }"
  >
    <div v-if="!isBalanceValid" :class="classes.statusLoading">
      <v-icon :icon="mdiDotsHorizontal" :size="WALLET_TAB_LOADING_ICON_SIZE" />
    </div>

    <p v-else :class="[classes.statusTitle, { [classes.statusTitleEmpty]: balance === 0 }]">
      {{ xs ? calculatedBalance : calculatedFullBalance }}
      <v-tooltip
        v-if="xs && calculatedFullBalance.toString().length > SIGNIFICANT_DIGITS"
        activator="parent"
        location="top"
      >
        {{ calculatedFullBalance }}
      </v-tooltip>
    </p>

    <p v-if="showFiatRate" :class="classes.statusText">{{ currentFiatCurrency }} {{ rate }}</p>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, toRefs } from 'vue'
import currencyAmount from '@/filters/currencyAmount'
import { Cryptos } from '@/lib/constants'
import { useStore } from 'vuex'
import smartNumber from '@/lib/smartNumber'
import { useDisplay } from 'vuetify'
import { useNow } from '@vueuse/core'
import { mdiDotsHorizontal } from '@mdi/js'
import { WALLET_TAB_LOADING_ICON_SIZE } from '@/components/wallets/helpers/uiMetrics'

const SIGNIFICANT_DIGITS = 7
const className = 'wallet-balance'

const classes = {
  root: className,
  singleLine: `${className}--single-line`,
  statusLoading: `${className}__status-loading`,
  statusTitle: `${className}__status-title`,
  statusTitleEmpty: `${className}__status-title--empty`,
  statusText: `${className}__status-text`
}

export default defineComponent({
  props: {
    symbol: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const store = useStore()
    const now = useNow({ interval: 500 })
    const { xs } = useDisplay()
    const { symbol } = toRefs(props)
    const key = symbol.value.toLowerCase()
    const currentTime = computed(() => now.value.getTime())

    const balance = computed(() => {
      return symbol.value === Cryptos.ADM
        ? store.state.balance
        : store.state[key]
          ? store.state[key].balance
          : 0
    })

    const balanceActualUntil = computed(() => {
      return symbol.value === Cryptos.ADM
        ? store.state.balanceActualUntil
        : store.state[key]
          ? store.state[key].balanceActualUntil
          : 0
    })

    const isBalanceValid = computed(() => {
      return balanceActualUntil.value > currentTime.value
    })

    const calculatedBalance = computed(() => {
      return smartNumber(calculatedFullBalance.value)
    })

    const calculatedFullBalance = computed(() => {
      return balance.value ? currencyAmount(Number(balance.value), symbol.value, true) : 0
    })

    const currentFiatCurrency = computed(() => {
      return store.state.options.currentRate
    })

    const currentRate = computed(() => {
      return store.state.rate.rates[`${symbol.value}/${currentFiatCurrency.value}`]
    })

    const rate = computed(() => {
      return currentRate.value !== undefined
        ? Number((balance.value * currentRate.value).toFixed(2))
        : 0
    })

    const showFiatRate = computed(() => {
      return isBalanceValid.value && Number(balance.value) !== 0 && currentRate.value !== undefined
    })

    return {
      SIGNIFICANT_DIGITS,
      WALLET_TAB_LOADING_ICON_SIZE,
      balance,
      isBalanceValid,
      classes,
      calculatedBalance,
      calculatedFullBalance,
      currentFiatCurrency,
      mdiDotsHorizontal,
      rate,
      showFiatRate,
      xs
    }
  }
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/_color-roles.scss' as colorRoles;
@use '@/assets/styles/components/_wallet-compact-content.scss' as walletCompactContent;
@use '@/assets/styles/themes/adamant/_mixins.scss' as mixins;

.wallet-balance {
  --a-wallet-balance-height: var(--a-control-size-md);
  --a-wallet-balance-gap: var(--a-financial-stack-gap);
  --a-wallet-balance-fiat-size: var(--a-font-size-xs);
  --a-wallet-balance-status-font-weight: var(--a-financial-text-font-weight);
  @include colorRoles.a-color-role-supporting-var('--a-wallet-balance-status-color');

  height: var(--a-wallet-balance-height);
  display: flex;
  @include walletCompactContent.a-wallet-compact-line-copy();
  flex-direction: column;
  justify-content: center;
  gap: var(--a-wallet-balance-gap);

  p {
    margin: 0;
  }

  &--single-line {
    gap: 0;
    justify-content: center;
  }

  &__status-title {
    @include mixins.a-text-regular-enlarged();
    @include walletCompactContent.a-wallet-compact-trailing-copy();
  }

  &__status-loading {
    @include walletCompactContent.a-wallet-compact-trailing-loading();
  }

  &__status-title--empty {
    @include mixins.a-text-explanation();
  }

  &__status-text {
    @include walletCompactContent.a-wallet-compact-trailing-copy();
    font-size: var(--a-wallet-balance-fiat-size);
    font-weight: var(--a-wallet-balance-status-font-weight);
  }
}

.v-theme--light {
  .wallet-balance {
    &__status-text {
      color: var(--a-wallet-balance-status-color);
    }
  }
}

.v-theme--dark {
  .wallet-balance {
    &__status-text {
      color: var(--a-wallet-balance-status-color);
    }
  }
}
</style>
