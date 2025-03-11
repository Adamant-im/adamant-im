<template>
  <div :class="className">
    <div class="text-center">
      <h3 class="a-text-regular">
        {{ $t('login.create_address_label') }}
      </h3>
      <v-btn class="a-btn-link mt-2" variant="text" size="small" @click="generatePassphrase">
        {{ $t('login.new_button') }}
      </v-btn>
    </div>

    <transition name="slide-fade">
      <div v-if="showPassphrase" :class="`${className}__box`">
        <!-- eslint-disable vue/no-v-html -- Safe internal content -->
        <div
          ref="el"
          :class="{
            'mt-2': true,
            [`${className}__passphrase-label`]: true
          }"
          v-html="$t('login.new_passphrase_label')"
        />
        <!-- eslint-enable vue/no-v-html -->

        <v-textarea
          ref="textarea"
          :value="passphrase"
          type="text"
          variant="plain"
          multi-line
          readonly
          rows="3"
          class="pt-0"
          color="grey"
          no-resize
          @click.prevent="selectText"
        >
          <template #append>
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

    <QrcodeRendererDialog v-model="showQrcodeRendererDialog" :text="passphrase" />
  </div>
</template>

<script>
import * as bip39 from 'bip39'
import copyToClipboard from 'copy-to-clipboard'

import { downloadFile } from '@/lib/textHelpers'
import QrcodeRendererDialog from '@/components/QrcodeRendererDialog.vue'
import Icon from '@/components/icons/BaseIcon.vue'
import CopyIcon from '@/components/icons/common/Copy.vue'
import SaveIcon from '@/components/icons/common/Save.vue'
import QrCodeIcon from '@/components/icons/common/QrCode.vue'

export default {
  components: {
    Icon,
    CopyIcon,
    SaveIcon,
    QrCodeIcon,
    QrcodeRendererDialog
  },
  emits: ['copy', 'save'],
  data: () => ({
    passphrase: '',
    showPassphrase: false,
    showQrcodeRendererDialog: false
  }),
  computed: {
    className() {
      return 'passphrase-generator'
    }
  },
  methods: {
    copyToClipboard() {
      copyToClipboard(this.passphrase)

      this.selectText()

      this.$emit('copy')
    },
    saveFile() {
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
    selectText() {
      this.$refs.textarea.$el.querySelector('textarea').select()
    },
    generatePassphrase() {
      this.passphrase = bip39.generateMnemonic()

      this.showPassphrase = true

      // callback after Vue rerender
      setTimeout(() => {
        const element = this.$refs.textarea.$el

        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        } else {
          console.warn('[PassphraseGenerator] `element` is undefined')
        }
      }, 0)
    }
  }
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

/**
 * 1. Change color icons when focus textarea.
 * 2. Remove textarea border bottom.
 */
.passphrase-generator {
  &__box {
    margin-top: 36px;
    :deep(.v-input) {
      margin-top: 0;
    }
    :deep(.v-textarea) textarea {
      @include mixins.a-text-regular();
      line-height: 18px;
      padding-top: 12px;
      mask-image: unset;
    }
    :deep(.v-textarea) {
      .v-input__slot:before,
      .v-input__slot:after {
        border-width: 0;
      }
    }
  }
  &__icons {
    > *:not(:first-child) {
      margin-left: 8px;
    }
  }
  &__passphrase-label {
    color: map.get(colors.$adm-colors, 'grey');
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    letter-spacing: normal !important;
  }

  :deep(.v-input--is-focused) {
    .v-icon .svg-icon {
      fill: map.get(colors.$adm-colors, 'regular');
    }
  }
}

/** Themes **/
.v-theme--light {
  .passphrase-generator {
    :deep(.v-textarea) textarea {
      color: map.get(colors.$adm-colors, 'regular');
    }
  }
}
</style>
