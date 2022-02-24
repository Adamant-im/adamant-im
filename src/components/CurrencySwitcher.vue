<template>
  <v-menu
    offset-y
    class="language-switcher"
  >
    <v-btn
      slot="activator"
      class="ma-0"
      flat
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
export default {
  props: {
    prependIcon: {
      type: String,
      default: ''
    },
    appendIcon: {
      type: String,
      default: ''
    },
    currencies: {
      type: Array,
      default: () => {
        return ['USD ($)', 'EUR (€)', 'RUB (₽)', 'CNY (¥)', 'JPY (¥)']
      }
    }
  },
  computed: {
    currentCurrency () {
      return 'USD ($)'
    }
  },
  methods: {
    onSelect (e) {
      console.log(e)
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '~vuetify/src/stylus/settings/_colors.styl'
@import '../assets/stylus/settings/_colors.styl'

.language-switcher
  >>> .v-menu__activator
    .v-icon
      margin-top: 2px
    .v-icon:before
      transition: 0.2s linear
  >>> .v-menu__activator--active
    .v-icon:before
      transform: rotate(90deg)
  >>> .v-btn
    text-transform: capitalize

/** Themes **/
.theme--light
  .language-switcher
    .v-btn
      color: $adm-colors.regular
      font-weight: 300
</style>
