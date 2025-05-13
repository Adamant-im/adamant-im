<template>
  <div :class="classes.root">
    <div class="text-center">
      <h3 class="a-text-regular">
        {{ t('login.create_address_label') }}
      </h3>
      <v-btn class="a-btn-link mt-2" variant="text" size="small" @click="generatePassphrase">
        {{ t('login.new_button') }}
      </v-btn>
    </div>

    <transition name="slide-fade">
      <div v-if="showPassphrase" :class="classes.box">
        <!-- eslint-disable vue/no-v-html -- Safe internal content -->
        <div
          ref="el"
          :class="{
            'mt-2': true,
            [classes.passphraseLabel]: true
          }"
          v-html="t('login.new_passphrase_label')"
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
            <div :class="classes.icons">
              <icon
                :class="classes.icon"
                :width="24"
                :height="24"
                shape-rendering="crispEdges"
                :title="t('login.copy_button_tooltip')"
                @click="copyToClipboardHandler"
              >
                <copy-icon />
              </icon>
              <icon
                :class="classes.icon"
                :width="24"
                :height="24"
                shape-rendering="auto"
                :title="t('login.save_button_tooltip')"
                @click="saveFile"
              >
                <save-icon />
              </icon>
              <icon
                :class="classes.icon"
                :width="24"
                :height="24"
                shape-rendering="crispEdges"
                :title="t('login.save_qr_code_tooltip')"
                @click="showQrcodeRendererDialog = true"
              >
                <qr-code-icon />
              </icon>
              <v-icon
                :class="classes.icon"
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

<script setup lang="ts">
import * as bip39 from 'bip39'
import copyToClipboard from 'copy-to-clipboard'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { downloadFile } from '@/lib/textHelpers'
import QrcodeRendererDialog from '@/components/QrcodeRendererDialog.vue'
import Icon from '@/components/icons/BaseIcon.vue'
import CopyIcon from '@/components/icons/common/Copy.vue'
import SaveIcon from '@/components/icons/common/Save.vue'
import QrCodeIcon from '@/components/icons/common/QrCode.vue'
import { mdiEye, mdiEyeOff } from '@mdi/js'
import { VTextarea } from 'vuetify/components'

const { t } = useI18n()

const emit = defineEmits(['copy', 'save'])

const className = 'passphrase-generator'
const classes = {
  root: className,
  box: `${className}__box`,
  passphraseLabel: `${className}__passphrase-label`,
  icons: `${className}__icons`,
  icon: `${className}__icon`
}

const passphrase = ref('')
const showPassphrase = ref(false)
const showQrcodeRendererDialog = ref(false)
const showSuggestedPassphrase = ref(false)
const textarea = ref<InstanceType<typeof VTextarea> | null>(null)
const el = ref<HTMLElement | null>(null)

const displayedPassphrase = computed(() => {
  return showSuggestedPassphrase.value
    ? passphrase.value
    : '⁕⁕⁕ ⁕⁕⁕ ⁕⁕⁕ ⁕⁕⁕ ⁕⁕⁕ ⁕⁕⁕ ⁕⁕⁕ ⁕⁕⁕ ⁕⁕⁕ ⁕⁕⁕ ⁕⁕⁕ ⁕⁕⁕'
})

const passphraseVisibilityTooltip = computed(() => {
  return showSuggestedPassphrase.value
    ? t('login.hide_passphrase_tooltip')
    : t('login.show_passphrase_tooltip')
})

const copyToClipboardHandler = () => {
  copyToClipboard(passphrase.value)
  selectText()
  emit('copy')
}

const saveFile = () => {
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
  if (!iOS) {
    downloadFile(
      passphrase.value,
      'adm-' + btoa(new Date().getTime().toString()).replace('==', '') + '.txt',
      'text/plain'
    )
  }

  emit('save')
}

const selectText = () => {
  textarea.value?.$el.querySelector('textarea').select()
}

const generatePassphrase = () => {
  passphrase.value = bip39.generateMnemonic()
  showPassphrase.value = true

  // callback after Vue rerender
  setTimeout(() => {
    const element = textarea.value?.$el

    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    } else {
      console.warn('[PassphraseGenerator] `element` is undefined')
    }
  }, 0)
}

const togglePassphraseVisibility = () => {
  showSuggestedPassphrase.value = !showSuggestedPassphrase.value
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
  &__icon {
    position: relative;
    opacity: 0.62;
    transition: all 0.4s ease;

    &::before {
      content: '';
      position: absolute;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      top: -6px;
      left: -6px;
      background-color: map.get(colors.$adm-colors, 'regular');
      opacity: 0;
      transition: all 0.4s ease;
    }

    &:hover {
      opacity: 1;
    }
  }
  &__icons {
    margin-top: -4px;
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
      :deep(.svg-icon),
      :deep(.v-icon__svg) {
        position: relative;
        fill: map.get(colors.$adm-colors, 'grey-transparent');
      }

      &:hover {
        :deep(.svg-icon),
        :deep(.v-icon__svg) {
          fill: #fff;
          opacity: 1;
        }

        &:before {
          opacity: 0.3;
        }
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
      :deep(.svg-icon),
      :deep(.v-icon__svg) {
        position: relative;
        fill: map.get(colors.$adm-colors, 'black2');
      }

      &:hover {
        :deep(.svg-icon),
        :deep(.v-icon__svg) {
          fill: map.get(colors.$adm-colors, 'black');
        }

        &:before {
          opacity: 0.12;
        }
      }
    }
  }
}
</style>
