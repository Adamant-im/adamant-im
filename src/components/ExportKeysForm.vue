<template>
  <v-form @submit.prevent="revealKeys">
    <div
      v-if="keys.length"
      :class="`${className}__keys`"
    >
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
            <v-btn
              icon
              ripple
              :class="`${className}__btn-copy`"
              @click="copyKey(key.key)"
            >
              <v-icon
                :class="`${className}__icon`"
                size="20"
              >
                mdi-content-copy
              </v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </div>

      <div class="text-xs-right">
        <v-btn
          :class="`${className}__copy_all_button`"
          class="a-btn-link"
          flat
          small
          @click="copyAll"
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
        <v-menu
          :offset-overflow="true"
          :offset-y="false"
          left
        >
          <v-icon slot="activator">
            mdi-dots-vertical
          </v-icon>
          <v-list>
            <v-list-tile @click="showQrcodeScanner = true">
              <v-list-tile-title>{{ $t('transfer.decode_from_camera') }}</v-list-tile-title>
            </v-list-tile>
            <v-list-tile class="v-list__tile--link">
              <v-list-tile-title>
                <qrcode-capture
                  @detect="onDetectQrcode"
                  @error="onDetectQrcodeError"
                >
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
        class="a-btn-primary"
        @click="revealKeys"
      >
        {{ $t('options.export_keys.button') }}
      </v-btn>
    </div>

    <qrcode-scanner-dialog
      v-if="showQrcodeScanner"
      v-model="showQrcodeScanner"
      @scan="onScanQrcode"
    />
  </v-form>
</template>
<script>
import { validateMnemonic } from 'bip39'
import { getAccountFromPassphrase as getEthAccount } from '@/lib/eth-utils'
import { getAccount as getBtcAccount } from '@/lib/bitcoin/btc-base-api'
import { getAccount as getLskAccount } from '@/lib/lisk/lisk-api'
import { Cryptos, CryptosNames } from '@/lib/constants'
import { copyToClipboard } from '@/lib/textHelpers'

import QrcodeCapture from '@/components/QrcodeCapture'
import QrcodeScannerDialog from '@/components/QrcodeScannerDialog'

function getBtcKey (crypto, passphrase, asWif) {
  const keyPair = getBtcAccount(crypto, passphrase).keyPair
  const key = asWif
    ? keyPair.toWIF()
    : keyPair.privateKey.toString('hex')

  return {
    crypto: crypto,
    cryptoName: CryptosNames[crypto],
    key
  }
}

function getLskKey (crypto, passphrase) {
  const keyPair = getLskAccount(crypto, passphrase).keyPair
  const key = keyPair.secretKey.toString('hex')

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
      this.revealKeys()
    },

    revealKeys () {
      this.keys = []

      if (!validateMnemonic(this.passphrase)) {
        this.$store.dispatch('snackbar/show', {
          message: this.$t('login.invalid_passphrase')
        })
        return
      }

      // Keys generation will block the UI thread for a couple of seconds, so we'll use setTimeout
      // to let the UI changes happen first
      setTimeout(() => {
        const eth = {
          crypto: Cryptos.ETH,
          cryptoName: this.$t('options.export_keys.eth'),
          key: (getEthAccount(this.passphrase).privateKey || '').substr(2)
        }

        const bitcoin = getBtcKey(Cryptos.BTC, this.passphrase, true)
        const dash = getBtcKey(Cryptos.DASH, this.passphrase, false)
        const doge = getBtcKey(Cryptos.DOGE, this.passphrase, true)

        const lsk = getLskKey(Cryptos.LSK, this.passphrase)

        this.keys = [bitcoin, eth, doge, dash, lsk]
      }, 0)
    },

    copyKey (key) {
      copyToClipboard(key)
      this.$store.dispatch('snackbar/show', {
        message: this.$t('home.copied'),
        timeout: 2000
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
      margin-bottom: 12px
</style>
