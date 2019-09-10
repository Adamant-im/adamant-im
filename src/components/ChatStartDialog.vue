<template>
  <v-dialog
    v-model="show"
    width="500"
    :class="className"
    @keydown.enter="onEnter"
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
          @paste="onPasteURI"
        >
          <template slot="append">
            <v-menu :offset-overflow="true" :offset-y="false" left>
              <v-icon slot="activator">mdi-dots-vertical</v-icon>
              <v-list>
                <v-list-tile @click="showQrcodeScanner = true">
                  <v-list-tile-title>{{ $t('transfer.decode_from_camera') }}</v-list-tile-title>
                </v-list-tile>
                <v-list-tile class="v-list__tile--link">
                  <v-list-tile-title>
                    <qrcode-capture @detect="onDetectQrcode" @error="onDetectQrcodeError">
                      <span>{{ $t('transfer.decode_from_image') }}</span>
                    </qrcode-capture>
                  </v-list-tile-title>
                </v-list-tile>
              </v-list>
            </v-menu>
          </template>
        </v-text-field>

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
      :text="uri"
      logo
    />
  </v-dialog>
</template>

<script>
import { Cryptos } from '@/lib/constants'
import { generateURI, parseURI } from '@/lib/uri'
import validateAddress from '@/lib/validateAddress'
import QrcodeCapture from '@/components/QrcodeCapture'
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
    uri () {
      return generateURI(Cryptos.ADM, this.$store.state.address)
    }
  },
  data: () => ({
    recipientAddress: '',
    recipientName: '',
    showQrcodeScanner: false,
    showQrcodeRendererDialog: false,
    uriMessage: ''
  }),
  methods: {
    startChat () {
      this.recipientAddress = this.recipientAddress
        .trim()
        .toUpperCase()

      if (!this.isValidUserAddress()) {
        this.$store.dispatch('snackbar/show', {
          message: this.$t('chats.incorrect_address')
        })

        return Promise.reject(new Error(this.$t('chats.incorrect_address')))
      }

      return this.$store.dispatch('chat/createChat', {
        partnerId: this.recipientAddress,
        partnerName: this.recipientName
      })
        .then((key) => {
          this.$emit('start-chat', this.recipientAddress, this.uriMessage)
          this.show = false
        })
        .catch(err => {
          this.$store.dispatch('snackbar/show', {
            message: err.message // @todo translations
          })
        })
    },

    /**
     * Handle successful address decode from a QR code
     * @param {string} address Address
     */
    onDetectQrcode (address) {
      this.onScanQrcode(address)
    },

    /**
     * Handle failed address decode from a QR code
     * @param {string} error Error instance
     */
    onDetectQrcodeError (error) {
      this.cryptoAddress = ''
      this.$store.dispatch('snackbar/show', {
        message: this.$t('transfer.invalid_qr_code')
      })
      console.warn(error)
    },

    /**
     * Parse info from an URI on paste text
     * @param {string} e Event
     */
    onPasteURI (e) {
      this.$nextTick(() => {
        const partner = parseURI(e.target.value)

        this.recipientAddress = ''
        if (validateAddress(Cryptos.ADM, partner.address)) {
          this.recipientAddress = partner.address
          if (!this.$store.getters['partners/displayName'](this.recipientAddress)) {
            this.recipientName = partner.params.label
          }
          if (partner.params.message) {
            this.uriMessage = partner.params.message
          }
          this.startChat()
        } else {
          this.$emit('error', this.$t('transfer.error_incorrect_address', { crypto: Cryptos.ADM }))
        }
      })
    },

    /**
     * Parse info from an URI on QR code scan
     * @param {string} uri URI
     */
    onScanQrcode (uri) {
      const partner = parseURI(uri)

      this.recipientAddress = ''
      if (validateAddress(Cryptos.ADM, partner.address)) {
        this.recipientAddress = partner.address
        if (!this.$store.getters['partners/displayName'](this.recipientAddress)) {
          this.recipientName = partner.params.label
        }
        if (partner.params.message) {
          this.uriMessage = partner.params.message
        }
        this.startChat()
      } else {
        this.$emit('error', this.$t('transfer.error_incorrect_address', { crypto: Cryptos.ADM }))
      }
    },
    isValidUserAddress () {
      return validateAddress(Cryptos.ADM, this.recipientAddress)
    },
    onEnter () {
      this.startChat()
    }
  },
  components: {
    QrcodeCapture,
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
