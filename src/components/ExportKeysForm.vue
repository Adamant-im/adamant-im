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
          variant="underlined"
          color="primary"
        >
          <template #label>
            <span class="font-weight-medium">
              {{ key.cryptoName }}
            </span>
          </template>
          <template #append-inner>
            <v-btn
              icon
              ripple
              size="28"
              :class="`${className}__btn-copy`"
              @click="copyKey(key.key)"
            >
              <v-icon
                :class="`${className}__icon`"
                icon="mdi-content-copy"
                size="20"
              />
            </v-btn>
          </template>
        </v-text-field>
      </div>

      <div class="text-right">
        <v-btn
          :class="`${className}__copy_all_button`"
          class="a-btn-link"
          variant="text"
          size="small"
          @click="copyAll"
        >
          {{ t('options.export_keys.copy_all') }}
        </v-btn>
      </div>
    </div>

    <div :class="`${className}__disclaimer a-text-regular-enlarged`">
      {{ t("options.export_keys.disclaimer") }}
    </div>

    <v-text-field
      v-model.trim="passphrase"
      class="a-input"
      variant="underlined"
      color="primary"
      type="text"
    >
      <template #label>
        <span class="font-weight-medium">
          {{ t('options.export_keys.passphrase') }}
        </span>
      </template>
      <template #append-inner>
        <v-menu
          :offset-overflow="true"
          :offset-y="false"
          left
        >
          <template #activator="{ props }">
            <v-icon
              v-bind="props"
              icon="mdi-dots-vertical"
            />
          </template>
          <v-list>
            <v-list-item @click="showQrcodeScanner = true">
              <v-list-item-title>{{ t('transfer.decode_from_camera') }}</v-list-item-title>
            </v-list-item>
            <v-list-item class="v-list__tile--link">
              <v-list-item-title>
                <qrcode-capture
                  @detect="onDetectQrcode"
                  @error="onDetectQrcodeError"
                >
                  <span>{{ t('transfer.decode_from_image') }}</span>
                </qrcode-capture>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-text-field>

    <div class="text-center">
      <v-btn
        :class="`${className}__export_keys_button`"
        class="a-btn-primary"
        @click="revealKeys"
      >
        {{ t('options.export_keys.button') }}
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
import copyToClipboard from 'copy-to-clipboard'
import { getAccountFromPassphrase as getEthAccount } from '@/lib/eth-utils'
import { getAccount as getBtcAccount } from '@/lib/bitcoin/btc-base-api'
import { getAccount as getLskAccount } from '@/lib/lisk/lisk-api'
import { Cryptos, CryptosNames } from '@/lib/constants'
import QrcodeCapture from '@/components/QrcodeCapture'
import QrcodeScannerDialog from '@/components/QrcodeScannerDialog'
import { ref, reactive, computed } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'

export default {
  components: {
    QrcodeCapture,
    QrcodeScannerDialog
  },

  setup () {
    const passphrase = ref('')
    const showQrcodeScanner = ref(false)
    const store = useStore()
    const { t } = useI18n()
    let keys = reactive([])

    const className = computed(() => {
      return 'export-keys-form'
    })

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

    function onDetectQrcode (passphrase) {
      onScanQrcode(passphrase)
    }
    function onDetectQrcodeError (error) {
      this.cryptoAddress = ''
      store.dispatch('snackbar/show', {
        message: t('transfer.invalid_qr_code')
      })
      console.warn(error)
    }
    function onScanQrcode (pass) {
      passphrase.value = pass
      revealKeys()
    }
    function revealKeys () {
      keys = []

      if (!validateMnemonic(passphrase.value)) {
        store.dispatch('snackbar/show', {
          message: t('login.invalid_passphrase')
        })
        return
      }

      // Keys generation will block the UI thread for a couple of seconds, so we'll use setTimeout
      // to let the UI changes happen first
      setTimeout(() => {
        const eth = {
          crypto: Cryptos.ETH,
          cryptoName: t('options.export_keys.eth'),
          key: (getEthAccount(passphrase.value).privateKey || '').substr(2)
        }

        const bitcoin = getBtcKey(Cryptos.BTC, passphrase.value, true)
        const dash = getBtcKey(Cryptos.DASH, passphrase.value, false)
        const doge = getBtcKey(Cryptos.DOGE, passphrase.value, true)

        const lsk = getLskKey(Cryptos.LSK, passphrase.value)

        keys = [bitcoin, eth, doge, dash, lsk]
      }, 0)
    }
    function copyKey (key) {
      copyToClipboard(key)
      store.dispatch('snackbar/show', {
        message: t('home.copied'),
        timeout: 2000
      })
    }
    function copyAll () {
      const allKeys = keys.map(k => `${k.cryptoName}\r\n${k.key}`).join('\r\n\r\n')
      copyKey(allKeys)
    }

    return {
      passphrase,
      showQrcodeScanner,
      keys,
      className,
      onDetectQrcode,
      onDetectQrcodeError,
      onScanQrcode,
      revealKeys,
      copyKey,
      copyAll,
      t
    }
  }
}
</script>
<style lang="scss" scoped>
.export-keys-form {
  &__keys {
    margin-bottom: 24px;
  }
  &__disclaimer {
    margin-top: 12px;
    margin-bottom: 24px;
  }
  &__btn-copy {
    margin-right: 0;
    margin-bottom: 0;
  }
  &__export_keys_button {
    margin-top: 15px;
    margin-bottom: 24px;
  }
  &__copy_all_button {
    padding-right: 0;
    margin-right: 0;
    margin-bottom: 12px;
  }
}
</style>
