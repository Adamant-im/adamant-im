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
          :value="displayedPassphrase"
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
                :class="`${className}__icon`"
                :width="24"
                :height="24"
                shape-rendering="crispEdges"
                :title="$t('login.copy_button_tooltip')"
                @click="copyToClipboard"
              >
                <copy-icon />
              </icon>
              <icon
                :class="`${className}__icon`"
                :width="24"
                :height="24"
                shape-rendering="auto"
                :title="$t('login.save_button_tooltip')"
                @click="saveFile"
              >
                <save-icon />
              </icon>
              <icon
                :class="`${className}__icon`"
                :width="24"
                :height="24"
                shape-rendering="crispEdges"
                :title="$t('login.save_qr_code_tooltip')"
                @click="showQrcodeRendererDialog = true"
              >
                <qr-code-icon />
              </icon>
              <v-icon
                :class="`${className}__icon`"
                :title="passphraseVisibilityTooltip"
                :icon="showSuggestedPassphrase ? mdiEye : mdiEyeOff"
                size="24"
                @click="togglePassphraseVisibility"
              />
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
import { mdiEye, mdiEyeOff } from '@mdi/js'

export default {
  components: {
    Icon,
    CopyIcon,
    SaveIcon,
    QrCodeIcon,
    QrcodeRendererDialog,
  },
  emits: ['copy', 'save'],
  setup() {

    return {
      mdiEye,
      mdiEyeOff
    }
  },
  data: () => ({
    passphrase: '',
    showPassphrase: false,
    showQrcodeRendererDialog: false,
    showSuggestedPassphrase: false,
  }),
  computed: {
    className() {
      return 'passphrase-generator'
    },
    displayedPassphrase() {
      return this.showSuggestedPassphrase ? this.passphrase : '*** *** *** *** *** *** *** *** *** *** *** *** '
    },
    passphraseVisibilityTooltip() {
      return this.showSuggestedPassphrase ? this.$t('login.hide_passphrase_tooltip') : this.$t('login.show_passphrase_tooltip')
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
    },
    togglePassphraseVisibility() {
      this.showSuggestedPassphrase = !this.showSuggestedPassphrase
    },
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
      margin-left: 20px;
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
.v-theme--dark {
  .passphrase-generator {
    &__icon {
      position: relative;
      opacity: 0.62;

      &::before {
        content: '';
        position: absolute;
        border-radius: 50%;
        background-color: currentColor;
        opacity: 0.12;
        width: 36px;
        height: 36px;
        top: -6px;
        left: -7px;
      }

      &:hover {
        opacity: 1;
      }

      &:hover::before {
        opacity: 0.2;
      }

      :deep(.svg-icon) {
        position: relative;
        fill: map.get(colors.$adm-colors, 'grey-transparent');
      }
    }
  }
}

.v-theme--light {
  .passphrase-generator {
    :deep(.v-textarea) textarea {
      color: map.get(colors.$adm-colors, 'regular');
    }

    &__icon {
      position: relative;
      opacity: 0.62;

      &::before {
        content: '';
        position: absolute;
        border-radius: 50%;
        background-color: currentColor;
        opacity: 0.12;
        width: 36px;
        height: 36px;
        top: -6px;
        left: -6px;
      }

      &:hover {
        opacity: 1;
      }

      &:hover::before {
        opacity: 0.2;
      }

      :deep(.svg-icon) {
        position: relative;
        fill: map.get(colors.$adm-colors, 'black2');
      }
    }
  }
}
</style>