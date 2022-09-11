<template>
  <v-menu
    offset-y
    class="language-switcher"
  >
    <v-btn
      slot="activator"
      class="ma-0"
      text
    >
      <slot name="prepend">
        <v-icon
          v-if="prependIcon"
          left
        >
          {{ prependIcon }}
        </v-icon>
      </slot>
      {{ currentCurrency }}
      <slot name="append">
        <v-icon
          v-if="appendIcon"
          right
        >
          {{ appendIcon }}
        </v-icon>
      </slot>
    </v-btn>
    <v-list>
      <v-list-tile
        v-for="(currency, idx) in currencies"
        :key="idx"
        @click="onSelect(idx)"
      >
        <v-list-tile-title>{{ currency }}</v-list-tile-title>
      </v-list-tile>
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
@import '~vuetify/src/styles/settings/_colors.scss';
@import '../assets/stylus/settings/_colors.scss';
.language-switcher {
  :deep(.v-menu__activator) {
    .v-icon {
      margin-top: 2px;
    }.v-icon:before {
      transition: 0.2s linear;
    }
  }
  :deep(.v-menu__activator--active) {
    .v-icon:before {
      transform: rotate(90deg);
    }
  }
  :deep(.v-btn) {
    text-transform: capitalize;
  }
}

/** Themes **/
.theme--light {
  .language-switcher {
    .v-btn {
      color: map-get($adm-colors, 'regular');
      font-weight: 300;
    }
  }
}
</style>
