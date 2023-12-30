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
import { computed, defineComponent, toRefs } from 'vue'
import currencyAmount from '@/filters/currencyAmount.js'
import { Cryptos } from '@/lib/constants'
import { useStore } from 'vuex'

const className = 'wallet-balance'
const classes = {
  statusTitle: `${className}__status-title`,
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
    const { symbol } = toRefs(props)
    const key = symbol.value.toLowerCase()

    const balance = computed(() => {
      return symbol.value === Cryptos.ADM
        ? store.state.balance
        : store.state[key]
          ? store.state[key].balance
          : 0
    })

    const calculatedBalance = computed(() => {
      return balance.value ? `~${currencyAmount(Number(balance.value), symbol.value, true)}` : 0
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
