<template>
  <v-form>
    <div v-if="keys.length" :class="`${className}__keys`">
      <div
        v-for="key in keys"
        :key="key.crypto"
      >
        <v-text-field
          v-model="key.key"
          :readonly="true"
          class="a-input"
          type="text"
        >
          <template slot="label">
            <span class="font-weight-medium">
              {{ key.cryptoName }}
            </span>
          </template>
          <template slot="append">
            <v-btn icon ripple :class="`${className}__btn-copy`" @click="copyKey(key.key)">
              <v-icon :class="`${className}__icon`" size="20">mdi-content-copy</v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </div>

      <div class="text-xs-right">
        <v-btn
          :class="`${className}__copy_all_button`"
          @click="copyAll"
          class="a-btn-link" flat small
        >
          {{ $t('options.export_keys.copy_all') }}
        </v-btn>
      </div>

    </div>

    <div :class="`${className}__disclaimer a-text-regular-enlarged`">
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
        :class="`${className}__export_keys_button`"
        @click="revealKeys"
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
import { validateMnemonic } from 'bip39'
import { getAccountFromPassphrase as getEthAccount } from '@/lib/eth-utils'
import { getAccount as getBtcAccount } from '@/lib/bitcoin/btc-base-api'
import { Cryptos, CryptosNames } from '@/lib/constants'
import { copyToClipboard } from '@/lib/textHelpers'

import QrcodeCapture from '@/components/QrcodeCapture'
import QrcodeScannerDialog from '@/components/QrcodeScannerDialog'

function getBtcKey (crypto, passphrase, asWif) {
  const keyPair = getBtcAccount(crypto, passphrase).keyPair
  const key = asWif
    ? keyPair.toWIF()
    : `0x${keyPair.privateKey.toString('hex')}`

  return {
    crypto: crypto,
    cryptoName: CryptosNames[crypto],
    key
  }
}

export default {
  components: {
    QrcodeCapture,
    QrcodeScannerDialog
  },
  data () {
    return {
      passphrase: '',
      showQrcodeScanner: false,
      keys: []
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
    },

    revealKeys () {
      this.keys = []

      if (!validateMnemonic(this.passphrase)) {
        this.$store.dispatch('snackbar/show', {
          message: this.$t('login.invalid_passphrase')
        })
        return
      }

      setTimeout(() => {
        const eth = {
          crypto: Cryptos.ETH,
          cryptoName: this.$t('options.export_keys.eth'),
          key: getEthAccount(this.passphrase).privateKey
        }

        const bitcoin = getBtcKey(Cryptos.BTC, this.passphrase, true)
        const dash = getBtcKey(Cryptos.DASH, this.passphrase, false)
        const doge = getBtcKey(Cryptos.DOGE, this.passphrase, true)

        this.keys = [bitcoin, eth, doge, dash]
      }, 100)
    },

    copyKey (key) {
      copyToClipboard(key)
      this.$store.dispatch('snackbar/show', {
        message: this.$t('home.copied'),
        timeout: 1500
      })
    },

    copyAll () {
      const allKeys = this.keys.map(k => `${k.cryptoName}\r\n${k.key}`).join('\r\n\r\n')
      this.copyKey(allKeys)
    }
  }
}
</script>
<style lang="stylus" scoped>
  .export-keys-form
    &__keys
      margin-bottom: 24px
    &__disclaimer
      margin-top: 12px
      margin-bottom: 24px
    &__btn-copy
      margin-right: 0
      margin-bottom: 0
    &__export_keys_button
      margin-top: 15px
      margin-bottom: 24px
    &__copy_all_button
      padding-right: 0
      margin-right: 0
      margin-bottom: 24px
</style>
