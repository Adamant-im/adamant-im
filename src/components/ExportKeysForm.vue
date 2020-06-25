<template>
  <v-form>
    <div>
      {{ $t("options.export_keys.disclaimer") }}
    </div>

    <v-text-field
      v-model.trim="passphrase"
      class="a-input"
      type="text"
    >
      <template slot="label">
        <span class="font-weight-medium">
          {{ $t('options.export_keys.passphrase') }}
        </span>
      </template>
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

    <div class="text-xs-center">
      <v-btn
        :class="`${className}__button`"
        @click="confirm"
        class="a-btn-primary"
      >
        {{ $t('options.export_keys.button') }}
      </v-btn>
    </div>

    <qrcode-scanner-dialog
      @scan="onScanQrcode"
      v-if="showQrcodeScanner"
      v-model="showQrcodeScanner"
    />
  </v-form>
</template>
<script>
import QrcodeCapture from '@/components/QrcodeCapture'
import QrcodeScannerDialog from '@/components/QrcodeScannerDialog'

export default {
  components: {
    QrcodeCapture,
    QrcodeScannerDialog
  },
  data () {
    return {
      passphrase: '',
      showQrcodeScanner: false
    }
  },
  computed: {
    className: () => 'export-keys-form'
  },
  methods: {
    onDetectQrcode (passphrase) {
      this.onScanQrcode(passphrase)
    },

    onDetectQrcodeError (error) {
      this.cryptoAddress = ''
      this.$store.dispatch('snackbar/show', {
        message: this.$t('transfer.invalid_qr_code')
      })
      console.warn(error)
    },

    onScanQrcode (pass) {
      this.passphrase = pass
    }
  }
}
</script>
