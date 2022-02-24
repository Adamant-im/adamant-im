<template>
  <v-card
    flat
    :class="className"
  >
    <v-list
      two-line
      :class="`${className}__list`"
    >
      <v-list-tile
        :class="`${className}__tile`"
        @click="showShareURIDialog = true"
      >
        <v-list-tile-content>
          <v-list-tile-title :class="`${className}__title`">
            {{ $t('home.wallet_crypto', { crypto: cryptoName }) }}
          </v-list-tile-title>
          <v-list-tile-sub-title :class="`${className}__subtitle`">
            {{ address }}
          </v-list-tile-sub-title>
        </v-list-tile-content>

        <v-list-tile-action>
          <v-btn
            icon
            ripple
            :class="`${className}__action`"
          >
            <v-icon
              :class="`${className}__icon`"
              size="20"
            >
              mdi-share-variant
            </v-icon>
          </v-btn>
        </v-list-tile-action>
      </v-list-tile>

      <v-list-tile @click="$emit('click:balance', crypto)">
        <v-list-tile-content>
          <v-list-tile-title :class="`${className}__title`">
            {{ $t('home.balance') }}
          </v-list-tile-title>
          <v-list-tile-sub-title :class="`${className}__subtitle`">
            {{ balance | currency(crypto, true) }} <span class="a-text-regular">~{{ rates }} USD</span>
          </v-list-tile-sub-title>
        </v-list-tile-content>

        <v-list-tile-action>
          <v-btn
            icon
            ripple
            :class="`${className}__action`"
          >
            <v-icon
              :class="`${className}__icon`"
              size="20"
            >
              mdi-chevron-right
            </v-icon>
          </v-btn>
        </v-list-tile-action>
      </v-list-tile>
    </v-list>

    <WalletCardListActions
      :class="`${className}__list`"
      :crypto="crypto"
      :is-a-d-m="isADM"
    />

    <ShareURIDialog
      v-model="showShareURIDialog"
      :address="address"
      :crypto="crypto"
      :is-a-d-m="isADM"
    />
  </v-card>
</template>

<script>
import ShareURIDialog from '@/components/ShareURIDialog'
import WalletCardListActions from '@/components/WalletCardListActions'
import { Cryptos } from '@/lib/constants'

export default {
  components: {
    ShareURIDialog,
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
    rates: {
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
  },
  data: () => ({ showShareURIDialog: false }),
  computed: {
    className () {
      return 'wallet-card'
    },
    isADM () {
      return this.crypto === Cryptos.ADM
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '~vuetify/src/stylus/settings/_colors.styl'
@import '../assets/stylus/settings/_colors.styl'
@import '../assets/stylus/themes/adamant/_mixins.styl'

.wallet-card
  &__title
    a-text-caption()
  &__subtitle
    a-text-regular-enlarged()
    word-break: break-word
    span
      font-style: italic
      color: inherit
  &__list
    padding: 8px 0 0
  &__tile
    // height: 60px // too small height

/** Themes **/
.theme--light
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
