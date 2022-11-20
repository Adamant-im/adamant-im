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

      <v-divider class="a-divider" />

      <v-row
        justify="center"
        align="center"
        no-gutters
        class="pa-4"
      >
        <v-text-field
          ref="partnerField"
          v-model="recipientAddress"
          class="a-input"
          :label="$t('chats.recipient')"
          :title="$t('chats.recipient_tooltip')"
          autofocus
          @paste="onPasteURI"
        >
          <template #append>
            <v-menu
              :offset-overflow="true"
              :offset-y="false"
              left
            >
              <template #activator="{ on, attrs }">
                <v-icon
                  v-bind="attrs"
                  v-on="on"
                >
                  mdi-dots-vertical
                </v-icon>
              </template>
              <v-list>
                <v-list-item @click="showQrcodeScanner = true">
                  <v-list-item-title>{{ $t('transfer.decode_from_camera') }}</v-list-item-title>
                </v-list-item>
                <v-list-item class="v-list__tile--link">
                  <v-list-item-title>
                    <qrcode-capture
                      @detect="onDetectQrcode"
                      @error="onDetectQrcodeError"
                    >
                      <span>{{ $t('transfer.decode_from_image') }}</span>
                    </qrcode-capture>
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
        </v-text-field>

        <v-col
          cols="12"
          class="text-center"
        >
          <v-btn
            :class="[`${className}__btn-start-chat`, 'a-btn-primary']"
            @click="startChat"
          >
            {{ $t('chats.start_chat') }}
          </v-btn>
        </v-col>

        <v-col
          cols="12"
          :class="`${className}__btn-show-qrcode`"
        >
          <a
            class="a-text-active"
            @click="showQrcodeRendererDialog = true"
          >
            {{ $t('chats.show_my_qr_code') }}
          </a>
        </v-col>
      </v-row>
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
import { nextTick } from 'vue'

import { Cryptos } from '@/lib/constants'
import { generateURI, parseURIasAIP } from '@/lib/uri'
import validateAddress from '@/lib/validateAddress'
import QrcodeCapture from '@/components/QrcodeCapture'
import QrcodeScannerDialog from '@/components/QrcodeScannerDialog'
import QrcodeRendererDialog from '@/components/QrcodeRendererDialog'
import Icon from '@/components/icons/BaseIcon'
import QrCodeScanIcon from '@/components/icons/common/QrCodeScan'
import partnerName from '@/mixins/partnerName'

export default {
  components: {
    QrcodeCapture,
    QrcodeScannerDialog,
    QrcodeRendererDialog,
    Icon,
    QrCodeScanIcon
  },
  mixins: [partnerName],
  props: {
    partnerId: {
      type: String
    },
    modelValue: {
      type: Boolean,
      required: true
    }
  },
  emits: ['start-chat', 'error', 'update:modelValue'],
  data: () => ({
    recipientAddress: '',
    recipientName: '',
    showQrcodeScanner: false,
    showQrcodeRendererDialog: false,
    uriMessage: ''
  }),
  computed: {
    className: () => 'chat-start-dialog',
    show: {
      get () {
        return this.modelValue
      },
      set (value) {
        this.$emit('update:modelValue', value)
      }
    },
    uri () {
      return generateURI(Cryptos.ADM, this.$store.state.address)
    }
  },
  mounted () {
    if (this.partnerId) {
      this.recipientAddress = this.partnerId
    }
  },
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
     * @param {ClipboardEvent} e Event
     */
    onPasteURI (e) {
      const data = e.clipboardData.getData('text')
      nextTick(() => {
        const address = parseURIasAIP(data).address
        if (validateAddress('ADM', address)) {
          e.preventDefault()
          this.getInfoFromURI(data)
        } else {
          this.$emit('error', this.$t('transfer.error_incorrect_address', { crypto: 'ADM' }))
        }
      })
    },

    /**
     * Parse info from an URI on QR code scan
     * @param {string} uri URI
     */
    onScanQrcode (uri) {
      this.getInfoFromURI(uri)
    },

    /**
     * Get info from an URI
     * @param {string} uri URI
     */
    getInfoFromURI (uri) {
      const partner = parseURIasAIP(uri)

      this.recipientAddress = ''
      if (validateAddress(Cryptos.ADM, partner.address)) {
        this.recipientAddress = partner.address
        if (!this.getPartnerName(this.recipientAddress)) {
          this.recipientName = partner.params.label
        }
        if (partner.params.message) {
          this.uriMessage = partner.params.message
        }
        this.startChat()
      } else {
        this.$emit('error', this.$t('chats.incorrect_address', { crypto: Cryptos.ADM }))
      }
    },
    isValidUserAddress () {
      return validateAddress(Cryptos.ADM, this.recipientAddress)
    },
    onEnter () {
      this.startChat()
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../assets/styles/settings/_colors.scss';

.chat-start-dialog {
  &__btn-scan {
    margin-left: 5px !important;
    margin-right: -5px !important;
  }

  &__btn-start-chat {
    margin-top: 15px;
  }

  &__btn-show-qrcode {
    margin-top: 15px;
    margin-bottom: 15px;
    text-align: center;
  }
}

.v-theme--light {
  .chat-start-dialog {
    :deep(&__btn-scan) {
      color: map-get($adm-colors, 'regular');
    }
  }
}
</style>
