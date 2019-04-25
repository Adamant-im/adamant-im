<template>
  <v-dialog
    v-model="show"
    width="500"
    :class="className"
  >
    <v-card>
      <v-card-title
        class="headline"
        primary-title
        :class="`${className}__title`"
      >
        {{ $t('chats.new_chat') }}
      </v-card-title>

      <v-divider></v-divider>

      <v-layout row wrap justify-center align-center class="pa-3">

        <v-flex xs10>
          <v-text-field
            v-model="recipientAddress"
            :rules="validationRules"
            :label="$t('chats.recipient')"
            :title="$t('chats.recipient_tooltip')"
          />
        </v-flex>

        <v-flex xs2 class="text-xs-right">
          <v-btn @click="showQrcodeScanner = true" icon flat>
            <v-icon>mdi-qrcode-scan</v-icon>
          </v-btn>
        </v-flex>

        <v-flex xs4 class="text-xs-center">
          <v-btn @click="startChat" class="v-btn--primary">{{ $t('chats.start_chat') }}</v-btn>
        </v-flex>

      </v-layout>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          flat
          @click="show = false"
          class="a-button-regular"
        >
          {{ $t('scan.close_button') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <qrcode-scanner-dialog
      v-if="showQrcodeScanner"
      v-model="showQrcodeScanner"
      @scan="onScanQrcode"
    />
  </v-dialog>
</template>

<script>
import validateAddress from '@/lib/validateAddress'
import QrcodeScannerDialog from '@/components/QrcodeScannerDialog'

export default {
  computed: {
    className: () => 'chat-start-dialog',
    show: {
      get () {
        return this.value
      },
      set (value) {
        this.$emit('input', value)
      }
    },
    validationRules () {
      return [
        v => validateAddress('ADM', v) || this.$t('chats.incorrect_address')
      ]
    }
  },
  data: () => ({
    recipientAddress: '',
    showQrcodeScanner: false
  }),
  methods: {
    startChat () {
      if (!this.isValidUserAddress()) {
        this.$store.dispatch('snackbar/show', {
          message: this.$t('chats.incorrect_address')
        })

        return Promise.reject(new Error(this.$t('chats.incorrect_address')))
      }

      return this.$store.dispatch('chat/createChat', {
        partnerId: this.recipientAddress
      })
        .then((key) => {
          this.$emit('start-chat', this.recipientAddress)
          this.show = false
        })
        .catch(err => {
          this.$store.dispatch('snackbar/show', {
            message: err.message // @todo translations
          })
        })
    },
    onScanQrcode (userId) {
      this.recipientAddress = userId
      this.startChat()
    },
    isValidUserAddress () {
      return validateAddress('ADM', this.recipientAddress)
    }
  },
  components: {
    QrcodeScannerDialog
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
@import '../assets/stylus/settings/_colors.styl'

/** Themes **/
.theme--light
  .chat-start-dialog
    &__title
      color: $adm-colors.regular
</style>
