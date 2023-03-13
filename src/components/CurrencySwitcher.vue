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

export default {
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
  computed: {
    currencies () {
      return RatesNames
    },
    currentCurrency: {
      get () {
        return this.$store.state.options.currentRate
      },
      set (value) {
        this.$store.commit('options/updateOption', {
          key: 'currentRate',
          value
        })
      }
    }
  },
  methods: {
    onSelect (currency) {
      this.currentCurrency = currency
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'vuetify/settings';
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
