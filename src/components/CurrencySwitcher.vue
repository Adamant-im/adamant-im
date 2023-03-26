<template>
  <v-menu offset-y>
    <template #activator="{ props }">
      <v-btn
        class="ma-0 btn"
        variant="text"
        v-bind="props"
        :prepend-icon="prependIcon"
        :append-icon="appendIcon"
      >
        {{ currentCurrency }}
      </v-btn>
    </template>

    <v-list>
      <v-list-item
        v-for="(currency, idx) in currencies"
        :key="idx"
        @click="onSelect(idx)"
      >
        <v-list-item-title>{{ currency }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
import { RatesNames } from '@/lib/constants'
import { defineComponent, computed, defineProps } from 'vue'
import { useStore } from 'vuex'

export default defineComponent({
  setup () {
    const store = useStore()

    const props = defineProps({
      prependIcon: {
        type: String,
        default: ''
      },
      appendIcon: {
        type: String,
        default: ''
      }
    })

    const currencies = computed(() => {
      return RatesNames
    })
    let currentCurrency = computed({
      get () {
        return store.state.options.currentRate
      },
      set (value) {
        store.commit('options/updateOption', {
          key: 'currentRate',
          value
        })
      }
    })

    const onSelect = (currency) => {
      currentCurrency = currency
    }

    return {
      currencies,
      currentCurrency,
      props,
      onSelect
    }
  }
})
</script>

<style lang="scss" scoped>
@import '~vuetify/settings';
@import '../assets/styles/settings/_colors.scss';

.btn {
  text-transform: capitalize;
  font-weight: 300;

  :deep(.v-icon) {
    margin-top: 2px;

    &:before {
      transition: 0.2s linear;
    }
  }

  &[aria-expanded="true"] {
    :deep(.v-icon) {
      transform: rotate(90deg);
    }
  }
}

/** Themes **/
.v-theme--light {
  .btn {
    color: map-get($adm-colors, 'regular');
  }
}
</style>
