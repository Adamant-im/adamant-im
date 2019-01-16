<template>
  <v-card flat class="wallet-card">
    <div class="wallet-card__container">
      <div class="wallet-card__left">
        <h3 class="wallet-card__title">{{ cryptoName }} {{ $t('home.wallet') }}</h3>
        <div class="wallet-card__subtitle mb-2">{{ address }}</div>

        <h3 class="wallet-card__title">{{ $t('home.balance') }}</h3>
        <div
          class="wallet-card__subtitle"
          :style="{ cursor: 'pointer' }"
          @click="$emit('click:balance', cryptoCurrency)"
        >
          {{ balance }} {{ cryptoCurrency }}
        </div>
      </div>

      <div class="wallet-card__right">
        <slot name="icon"/>
        <div>
          <v-btn class="wallet-card__action" @click="copyToClipboard(address)" flat>
            {{ $t('home.copy') }}
          </v-btn>
        </div>
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
      type: [Number, String], // @todo fix erc20 balance string => number
      required: true
    },
    cryptoCurrency: {
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
    font-weight: 400
  &__subtitle
    font-size: 16px
    font-weight: 400
    word-break: break-word

/** Themes **/
.theme--light
  .wallet-card
    &__title
      color: $grey.base
    &__subtitle
      color: $shades.black
    &__action
      color: $blue.base
.theme--dark
  .wallet-card
    &__title
      color: $grey.base
    &__subtitle
      color: $shades.white
    &__action
      color: $shades.white
</style>
