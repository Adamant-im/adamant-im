<template>
  <div class="px-5">
    <p :class="[classes.statusTitle, balance === 0 && 'a-text-explanation']">
      {{ calculatedBalance }}
    </p>

    <p v-if="Number(balance) !== 0" :class="classes.statusText" class="text-end">
      {{ currentFiatCurrency }} {{ rate }}
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs } from 'vue'
import currencyAmount from '@/filters/currencyAmount.js'
import { CryptoSymbol } from '@/lib/constants'

const className = 'wallet-balance'
const classes = {
  statusTitle: `${className}__status-title`,
  statusText: `${className}__status-text`
}

type WalletBalance = {
  balance: number | string
  currentFiatCurrency: string
  rate: number
  symbol: CryptoSymbol
}

export default defineComponent({
  props: {
    walletBalance: {
      type: Object as PropType<WalletBalance>,
      required: true
    }
  },
  setup(props) {
    const { walletBalance } = toRefs(props)

    const { balance, currentFiatCurrency, rate, symbol } = walletBalance.value
    const calculatedBalance = balance ? `~${currencyAmount(Number(balance), symbol)}` : 0

    return {
      balance,
      classes,
      calculatedBalance,
      currentFiatCurrency,
      rate
    }
  }
})
</script>

<style lang="scss" scoped>
@import 'vuetify/settings';
@import '@/assets/styles/settings/_colors.scss';

.wallet-balance {
  &__status-title {
    line-height: 17px;
  }

  &__status-text {
    font-size: 12px;
    font-weight: 300;
  }
}

.v-theme--light {
  .wallet-balance {
    &__status-text {
      color: map-get($adm-colors, 'regular');
    }
  }
}

.v-theme--dark {
  .wallet-balance {
    &__status-text {
      color: map-get($shades, 'white');
      opacity: 0.7;
    }
  }
}
</style>
