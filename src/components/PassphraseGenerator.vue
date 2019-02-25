<template>
  <div class="passphrase-generator">
    <div class="text-xs-center">
      <h3 class="body-1">{{ $t('login.create_address_label') }}</h3>
      <v-btn @click="generatePassphrase" flat>
        {{ $t('login.new_button') }}
      </v-btn>
    </div>

    <transition name="slide-fade">
      <div v-if="showPassphrase">
        <div
          v-html="$t('login.new_passphrase_label')"
          class="caption grey--text mt-2"
          ref="el"
        ></div>
        <v-textarea
          :value="passphrase"
          @click.prevent="selectText"
          type="text"
          multi-line
          readonly
          rows="2"
          class="pt-0"
          color="grey"
          ref="textarea"
        >
          <icon @click="copyToClipboard" :width="24" :height="24" shape-rendering="crispEdges" slot="append">
            <copy-icon/>
          </icon>
          <icon @click="saveFile" :width="24" :height="24" shape-rendering="auto" slot="append-outer">
            <save-icon/>
          </icon>
        </v-textarea>
      </div>
    </transition>
  </div>
</template>

<script>
import Mnemonic from 'bitcore-mnemonic'

import { copyToClipboard, downloadFile } from '@/lib/textHelpers'
import Icon from '@/components/icons/BaseIcon'
import CopyIcon from '@/components/icons/common/Copy'
import SaveIcon from '@/components/icons/common/Save'

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
  },
  components: {
    Icon,
    CopyIcon,
    SaveIcon
  }
}
</script>
