<template>
  <v-dialog
    v-model="show"
    width="500"
    :class="className"
    @keydown.enter="onEnter"
  >
    <v-card>
      <v-card-title class="a-text-header">
        {{ header }}
      </v-card-title>

      <v-divider class="a-divider"></v-divider>

      <v-card-text>
        <div :class="`${className}__disclaimer a-text-regular-enlarged`" v-html="content">
        </div>
      </v-card-text>

      <v-flex xs12 class="text-xs-center">
        <v-btn :class="[`${className}__btn-hide`, 'a-btn-primary']"
          @click="hide()"
        >
          <v-icon :class="`${className}__btn-icon`">mdi-alert</v-icon>
          <div :class="`${className}__btn-text`">{{ $t('warning_on_addresses.hide_button') }}</div>
        </v-btn>
      </v-flex>

      <v-flex xs12 :class="`${className}__btn-forget`">
        <a @click="forget()" class="a-text-active">
          {{ $t('warning_on_addresses.forget_button') }}
        </a>
      </v-flex>

    </v-card>
  </v-dialog>
</template>

<script>
import { vueBus } from '@/main'
import DOMPurify from 'dompurify'

export default {
  created () {
    var dialog = this
    vueBus.$on('warningOnAddressDialog', function (validateSummary) {
      console.log('yep2!', validateSummary)
      if (!validateSummary.isAllRight) {
        dialog.header = dialog.$t('warning_on_addresses.warning') + ': ' + dialog.$t('warning_on_addresses.headline')
        let contents = '<p>' + dialog.$t('warning_on_addresses.about') + '</p>'

        if (validateSummary.isWrongAddress) {
          contents += '<p style="background-color: darkred;">' + dialog.$t('warning_on_addresses.specifics_wrong_addresses', { crypto: validateSummary.wrongCoin, storedAddress: validateSummary.storedAddress, correctAddress: validateSummary.correctAddress })
          if (validateSummary.wrongCoins.length > 1) {
            let wrongCoins = validateSummary.wrongCoins.join(', ')
            contents += ' ' + dialog.$t('warning_on_addresses.full_list_wrong_addresses', { crypto_list: wrongCoins })
          }
          contents += '</p>'
        } else if (validateSummary.isManyAddresses) {
          let manyAddresses = validateSummary.manyAddresses.join(', ')
          contents += '<p style="background-color: darkred;">' + dialog.$t('warning_on_addresses.specifics_many_addresses', { crypto: validateSummary.manyAddressesCoin, manyAddresses: manyAddresses })
          if (validateSummary.manyAddressesCoins.length > 1) {
            let wrongCoins = validateSummary.manyAddressesCoins.join(', ')
            contents += ' ' + dialog.$t('warning_on_addresses.full_list_many_addresses', { crypto_list: wrongCoins })
          }
          contents += '</p>'
        }

        contents += '<p>' + dialog.$t('warning_on_addresses.reasons') + '</p>'
        contents += '<p>' + dialog.$t('warning_on_addresses.what_to_do') + '</p>'

        dialog.content = DOMPurify.sanitize(contents)
        dialog.show = true
      }
    })
  },
  computed: {
    className: () => 'warning-on-addresses-dialog',
    show: {
      get () {
        return this.value
      },
      set (value) {
        this.$emit('input', value)
      }
    }
  },
  data: () => ({
    header: '',
    content: ''
  }),
  methods: {
    hide () {
      this.show = false
    },
    forget () {
      this.hide()
    },
    onEnter () {
      if (this.show) {
        this.hide()
      }
    }
  },
  props: {
    value: {
      type: Boolean,
      required: true
    }
  }
}
</script>
<style lang="stylus" scoped>
  .warning-on-addresses-dialog
    &__disclaimer
      margin-top: 10px
    &__btn-hide
      margin-top: 15px
      margin-bottom: 20px
    &__btn-icon
      margin-right: 8px
    &__btn-forget
      padding-bottom: 30px
      text-align: center
</style>