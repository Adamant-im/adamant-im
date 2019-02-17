<template>
  <v-card flat class="wallet-card">
    <div class="wallet-card__container">
      <div class="wallet-card__left">
        <v-layout
          align-end
          :style="{ cursor: 'pointer' }"
          @click="copyToClipboard(address)"
        >
          <div>
            <h3 class="wallet-card__title">{{ cryptoName }} {{ $t('home.wallet') }}</h3>
            <div class="wallet-card__subtitle">{{ address }}</div>
          </div>

          <div class="ml-3"><v-icon>mdi-content-copy</v-icon></div>
        </v-layout>

        <v-layout
          align-center
          class="mt-2"
          :style="{ cursor: 'pointer' }"
          @click="$emit('click:balance', crypto)"
        >
          <div>
            <h3 class="wallet-card__title">{{ $t('home.balance') }}</h3>
            <div class="wallet-card__subtitle">
              {{ crypto === 'ADM' ? balance * 1e8 : balance | currency(crypto) }}
            </div>
          </div>
        </v-layout>
      </div>

      <div class="wallet-card__right">
        <slot name="icon"/>
      </div>
    </div>
  </v-card>
</template>

<script>
import { copyToClipboard } from '@/lib/textHelpers'

export default {
  methods: {
    copyToClipboard (text) {
      copyToClipboard(text)

      this.$store.dispatch('snackbar/show', {
        message: this.$t('home.copied')
      })
    }
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

.wallet-card
  height: 200px

  &__container
    display: flex
    align-items: center
    justify-content: space-between
    height: inherit
    margin: 0 16px 0 16px
    position: relative
  &__left
    margin-right: 120px
    z-index: 1
  &__right
    text-align: center
    position: absolute
    right: 0

    h3
      text-transform: uppercase
      color: $grey.darken-1
  &__title
    font-size: 16px
    font-weight: 500
  &__subtitle
    font-size: 14px
    font-weight: 400
    word-break: break-word
    font-style: italic

/** Themes **/
.theme--light
  .wallet-card
    background-color: transparent

    &__title
      color: $grey.darken-3
    &__subtitle
      color: $grey.darken-2
    &__action
      color: $blue.base
.theme--dark
  .wallet-card
    background-color: transparent

    &__title
      color: $shades.white
    &__subtitle
      color: $shades.white
    &__action
      color: $shades.white
</style>
