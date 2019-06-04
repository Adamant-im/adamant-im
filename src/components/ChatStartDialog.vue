<template>
  <v-dialog
    v-model="show"
    width="500"
    :class="className"
  >
    <v-card>
      <v-card-title
        class="a-text-header"
      >
        {{ $t('chats.new_chat') }}
      </v-card-title>

      <v-divider class="a-divider"></v-divider>

      <v-layout row wrap justify-center align-center class="pa-3">

        <v-text-field
          class="a-input"
          v-model="recipientAddress"
          :label="$t('chats.recipient')"
          :title="$t('chats.recipient_tooltip')"
        />

        <v-btn @click="showQrcodeScanner = true" :class="`${className}__btn-scan ml-3 mr-0`" icon flat>
          <icon width="24" height="24"><qr-code-scan-icon/></icon>
        </v-btn>

        <v-flex xs12 class="text-xs-center">
          <v-btn @click="startChat" :class="[`${className}__btn-start-chat`, 'a-btn-primary']">
            {{ $t('chats.start_chat') }}
          </v-btn>
        </v-flex>

        <v-flex xs12 :class="`${className}__btn-show-qrcode`">
          <a @click="showQrcodeRendererDialog = true" class="a-text-active">
            {{ $t('chats.show_my_qr_code') }}
          </a>
        </v-flex>

      </v-layout>
    </v-card>

    <qrcode-scanner-dialog
      v-if="showQrcodeScanner"
      v-model="showQrcodeScanner"
      @scan="onScanQrcode"
    />

    <qrcode-renderer-dialog
      v-model="showQrcodeRendererDialog"
      :passphrase="passphrase"
    />
  </v-dialog>
</template>

<script>
import { Base64 } from 'js-base64'

import validateAddress from '@/lib/validateAddress'
import QrcodeScannerDialog from '@/components/QrcodeScannerDialog'
import QrcodeRendererDialog from '@/components/QrcodeRendererDialog'
import Icon from '@/components/icons/BaseIcon'
import QrCodeScanIcon from '@/components/icons/common/QrCodeScan'

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
    passphrase () {
      const passphrase = Base64.decode(this.$store.state.passphrase)

      return passphrase
    }
  },
  data: () => ({
    recipientAddress: '',
    showQrcodeScanner: false,
    showQrcodeRendererDialog: false
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
    QrcodeScannerDialog,
    QrcodeRendererDialog,
    Icon,
    QrCodeScanIcon
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

.chat-start-dialog
  &__btn-scan
    margin-left: 5px!important;
    margin-right: -5px!important;
  &__btn-start-chat
    margin-top: 15px
  &__btn-show-qrcode
    margin-top: 8px
    margin-bottom: 15px
    text-align: center
.theme--light
  .chat-start-dialog
     >>> &__btn-scan
      color: $adm-colors.regular
</style>
