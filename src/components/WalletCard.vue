<template>
  <v-card flat :class="className">
    <v-list two-line :class="`${className}__list`">
      <v-list-tile @click="copyToClipboard(address)" :class="`${className}__tile`">
        <v-list-tile-content>
          <v-list-tile-title :class="`${className}__title a-text-caption`">
            {{ cryptoName }} {{ $t('home.wallet') }}
          </v-list-tile-title>
          <v-list-tile-sub-title :class="`${className}__subtitle a-text-regular-enlarged`">
            {{ address }}
          </v-list-tile-sub-title>
        </v-list-tile-content>

        <v-list-tile-action>
          <v-btn icon ripple :class="`${className}__action`">
            <v-icon :class="`${className}__icon`" size="20">mdi-content-copy</v-icon>
          </v-btn>
        </v-list-tile-action>
      </v-list-tile>

      <v-list-tile @click="$emit('click:balance', crypto)">
        <v-list-tile-content>
          <v-list-tile-title :class="`${className}__title a-text-caption`">
            {{ $t('home.balance') }}
          </v-list-tile-title>
          <v-list-tile-sub-title :class="`${className}__subtitle a-text-regular-enlarged`">
            {{ balance | currency(crypto, true) }}
          </v-list-tile-sub-title>
        </v-list-tile-content>

        <v-list-tile-action>
          <v-btn icon ripple :class="`${className}__action`">
            <v-icon :class="`${className}__icon`" size="20">mdi-chevron-right</v-icon>
          </v-btn>
        </v-list-tile-action>
      </v-list-tile>
    </v-list>

    <WalletCardListActions
      :class="`${className}__list`"
      :crypto="crypto"
    />
  </v-card>
</template>

<script>
import { copyToClipboard } from '@/lib/textHelpers'
import WalletCardListActions from '@/components/WalletCardListActions'

export default {
  computed: {
    className () {
      return 'wallet-card'
    }
  },
  methods: {
    copyToClipboard (text) {
      copyToClipboard(text)

      this.$store.dispatch('snackbar/show', {
        message: this.$t('home.copied')
      })
    }
  },
  components: {
    WalletCardListActions
  },
  props: {
    address: {
      type: String,
      required: true
    },
    balance: {
      type: Number,
      required: true
    },
    crypto: {
      type: String,
      default: 'ADM'
    },
    cryptoName: {
      type: String,
      default: 'ADAMANT'
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '~vuetify/src/stylus/settings/_colors.styl'
@import '../assets/stylus/settings/_colors.styl'

.wallet-card
  &__title
    font-size: 16px
    font-weight: 300
  &__subtitle
    font-size: 14px
    font-weight: 300
    word-break: break-word
  &__list
    padding: 8px 0 0
  &__tile
    // height: 60px // too small height

.v-tabs__wrapper
  padding: 10px 0px 1px 0px;
  margin-bottom: 10px;

/** Themes **/
.theme--light
  .v-tabs__bar
    background-color: $adm-colors.secondary2-transparent
  .wallet-card
    background-color: transparent

    &__list
      background: inherit
    &__title
      color: $adm-colors.regular
    &__subtitle
      color: $adm-colors.muted
    &__action
      color: $adm-colors.muted
.theme--dark
  .wallet-card
    background-color: transparent

    &__list
      background: inherit
    &__title
      color: $shades.white
    &__subtitle
      color: $shades.white
</style>
