<template>
  <div class="px-5">
    <p :class="classes.statusTitle">
      {{ balance ? `~${mathRound(Number(balance), 8)}` : 0 }}
    </p>

    <p v-if="!!balance" :class="classes.statusText" class="text-end">
      {{ currentFiatCurrency }} {{ rate }}
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs } from 'vue'

const className = 'wallet-balance'
const classes = {
  statusTitle: `${className}__status-title`,
  statusText: `${className}__status-text`
}

type WalletBalance = {
  balance: number
  currentFiatCurrency: string
  rate: number
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

    const mathRound = (num: number, decimalPlaces: number) => {
      const p = Math.pow(10, decimalPlaces || 0)
      const n = num * p * (1 + Number.EPSILON)
      return Math.round(n) / p
    }

    const { balance, currentFiatCurrency, rate } = walletBalance.value

    return {
      balance,
      currentFiatCurrency,
      mathRound,
      rate,
      classes
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
