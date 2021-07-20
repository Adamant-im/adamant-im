<template>
  <div :class="className">
    <div class="text-xs-center">
      <h3 class="a-text-regular">
        {{ $t('login.create_address_label') }}
      </h3>
      <v-btn
        class="a-btn-link"
        flat
        small
        @click="generatePassphrase"
      >
        {{ $t('login.new_button') }}
      </v-btn>
    </div>

    <transition name="slide-fade">
      <div
        v-if="showPassphrase"
        :class="`${className}__box`"
      >
        <div
          ref="el"
          class="caption grey--text mt-2"
          v-html="$t('login.new_passphrase_label')"
        />
        <v-textarea
          ref="textarea"
          :value="passphrase"
          type="text"
          multi-line
          readonly
          rows="3"
          class="pt-0"
          color="grey"
          no-resize
          @click.prevent="selectText"
        >
          <template slot="append">
            <div :class="`${className}__icons`">
              <icon
                :width="24"
                :height="24"
                shape-rendering="crispEdges"
                :title="$t('login.copy_button_tooltip')"
                @click="copyToClipboard"
              >
                <copy-icon />
              </icon>
              <icon
                :width="24"
                :height="24"
                shape-rendering="auto"
                :title="$t('login.save_button_tooltip')"
                @click="saveFile"
              >
                <save-icon />
              </icon>
              <icon
                :width="24"
                :height="24"
                shape-rendering="crispEdges"
                :title="$t('login.save_qr_code_tooltip')"
                @click="showQrcodeRendererDialog = true"
              >
                <qr-code-icon />
              </icon>
            </div>
          </template>
        </v-textarea>
      </div>
    </transition>

    <QrcodeRendererDialog
      v-model="showQrcodeRendererDialog"
      :text="passphrase"
    />
  </div>
</template>

<script>
import * as bip39 from 'bip39'

import { copyToClipboard, downloadFile } from '@/lib/textHelpers'
import QrcodeRendererDialog from '@/components/QrcodeRendererDialog'
import Icon from '@/components/icons/BaseIcon'
import CopyIcon from '@/components/icons/common/Copy'
import SaveIcon from '@/components/icons/common/Save'
import QrCodeIcon from '@/components/icons/common/QrCode'

export default {
  components: {
    Icon,
    CopyIcon,
    SaveIcon,
    QrCodeIcon,
    QrcodeRendererDialog
  },
  data: () => ({
    passphrase: '',
    showPassphrase: false,
    showQrcodeRendererDialog: false
  }),
  computed: {
    className () {
      return 'passphrase-generator'
    }
  },
  methods: {
    copyToClipboard () {
      copyToClipboard(this.passphrase)

      this.$emit('copy')
    },
    saveFile () {
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
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
      this.passphrase = bip39.generateMnemonic()

      this.showPassphrase = true

      // callback after Vue rerender
      setTimeout(() => {
        this.$scrollTo(this.$refs.textarea.$el, { easing: 'ease-in' })
      }, 0)
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '~vuetify/src/stylus/settings/_variables.styl'
@import '../assets/stylus/settings/_colors.styl'
@import '../assets/stylus/themes/adamant/_mixins.styl'

/**
 * 1. Change color icons when focus textarea.
 * 2. Remove textarea border bottom.
 */
.passphrase-generator
  &__box
    margin-top: 30px
    >>> .v-textarea textarea
      a-text-regular()
    >>> .v-textarea
      .v-input__slot:before, .v-input__slot:after
        border-width: 0 // [2]

  &__icons
    margin-top: 10px

    > *:not(:first-child)
      margin-left: 8px

  >>> .v-input--is-focused
    .v-icon .svg-icon
      fill: $adm-colors.regular

/** Themes **/
.theme--light
  .passphrase-generator
    >>> .v-textarea textarea
      color: $adm-colors.regular
</style>
