<template>
  <v-menu offset-y>
    <template #activator="{ props }">
      <v-btn
        class="ma-0 a-switcher-button"
        variant="text"
        v-bind="props"
        :prepend-icon="prependIcon"
        :append-icon="appendIcon"
      >
        {{ currentCurrency }}
      </v-btn>
    </template>

    <v-list>
      <v-list-item v-for="(currency, idx) in currencies" :key="idx" @click="onSelect(idx)">
        <v-list-item-title>{{ currency }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
import { RatesNames } from '@/lib/constants'
import { defineComponent, computed } from 'vue'
import { useStore } from 'vuex'

export default defineComponent({
  props: {
    prependIcon: {
      type: String,
      default: ''
    },
    appendIcon: {
      type: String,
      default: ''
    }
  },
  setup() {
    const store = useStore()
    const currencies = RatesNames

    const currentCurrency = computed({
      get() {
        return store.state.options.currentRate
      },
      set(value) {
        store.commit('options/updateOption', {
          key: 'currentRate',
          value
        })
      }
    })

    const onSelect = (currency) => {
      currentCurrency.value = currency
    }

    return {
      currencies,
      currentCurrency,
      onSelect
    }
  }
})
</script>
