<template>
  <v-menu offset-y :class="className">
    <template #activator="{ props }">
      <v-btn
        :class="[`${className}__button`, 'a-switcher-button']"
        variant="text"
        v-bind="props"
        :prepend-icon="prependIcon"
        :append-icon="appendIcon"
      >
        {{ currentCurrency }}
      </v-btn>
    </template>

    <v-list :class="`${className}__list`">
      <v-list-item
        v-for="(currency, idx) in currencies"
        :key="idx"
        :class="`${className}__item`"
        @click="onSelect(idx)"
      >
        <v-list-item-title :class="`${className}__item-title`">
          {{ currency }}
        </v-list-item-title>
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
    const className = 'currency-switcher'
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
      className,
      currencies,
      currentCurrency,
      onSelect
    }
  }
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/_switcher-menu.scss' as switcherMenu;

.currency-switcher {
  @include switcherMenu.a-switcher-menu();
}
</style>
