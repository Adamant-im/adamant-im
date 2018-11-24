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

/**
 * Copy to clipboard helper.
 *
 * @param {string} data
 */
function copyToClipboard (data) {
  let el = document.createElement('textarea')
  el.value = data

  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
}

/**
 * Download file helper.
 *
 * @param {string} data
 * @param {string} filename
 * @param {string} type Example `text/plain`
 */
function downloadFile (data, filename, type) {
  var file = new Blob([data], { type: type })
  if (window.navigator.msSaveOrOpenBlob) { // IE10+
    window.navigator.msSaveOrOpenBlob(file, filename)
  } else { // Others
    var a = document.createElement('a')
    var url = URL.createObjectURL(file)
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    setTimeout(function () {
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }, 0)
  }
}

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
