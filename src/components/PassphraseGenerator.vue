<template>
  <div class="passphrase-generator">
    <div class="text-xs-center">
      <h3 class="body-1 grey--text text--darken-2">{{ $t('login.create_address_label') }}</h3>
      <v-btn @click="generatePassphrase" flat>
        {{ $t('login.new_button') }}
      </v-btn>
    </div>

    <template v-if="showPassphrase">
      <div
        v-html="$t('login.new_password_label')"
        class="caption grey--text mt-2"
        ref="el"
      ></div>
      <v-textarea
        :value="passphrase"
        @click.prevent="selectText"
        @click:append="copyToClipboard"
        @click:append-outer="saveFile"
        append-icon="mdi-content-copy"
        append-outer-icon="mdi-package-down"
        type="text"
        multi-line
        readonly
        rows="2"
        class="pt-0"
        ref="textarea"
      />
    </template>
  </div>
</template>

<script>
import Mnemonic from 'bitcore-mnemonic'
import { copyToClipboard, downloadFile } from '@/lib/textHelpers'

export default {
  data: () => ({
    passphrase: '',
    showPassphrase: false
  }),
  methods: {
    copyToClipboard () {
      copyToClipboard(this.passphrase)

      this.$emit('copy')
    },
    saveFile () {
      var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
      if (!iOS) {
        downloadFile(
          this.passphrase,
          'adm-' + btoa(new Date().getTime()).replace('==', '') + '.txt',
          'text/plain'
        )
      }

      this.$emit('save')
    },
    selectText () {
      this.$refs.textarea.$el
        .querySelector('textarea')
        .select()
    },
    generatePassphrase () {
      this.passphrase = new Mnemonic(Mnemonic.Words.ENGLISH).toString()

      this.showPassphrase = true
    }
  }
}
</script>
