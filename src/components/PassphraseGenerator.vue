<template>
  <div :class="classes.root">
    <div :class="classes.createSection">
      <h3 :class="classes.createTitle">
        {{ t('login.create_address_label') }}
      </h3>
      <v-btn :class="classes.createButton" variant="text" size="small" @click="generatePassphrase">
        {{ t('login.new_button') }}
      </v-btn>
    </div>

    <transition name="slide-fade">
      <div v-if="showPassphrase" :class="classes.box">
        <!-- eslint-disable vue/no-v-html -- Safe internal content -->
        <div ref="el" :class="classes.passphraseLabel" v-html="t('login.new_passphrase_label')" />
        <!-- eslint-enable vue/no-v-html -->

        <v-textarea
          ref="textarea"
          :value="displayedPassphrase"
          type="text"
          variant="plain"
          multi-line
          readonly
          rows="3"
          :class="classes.textarea"
          color="grey"
          hide-details
          no-resize
          @click.prevent="selectText"
        >
          <template #append>
            <div :class="classes.icons">
              <icon
                :class="classes.icon"
                :width="AUTH_FORM_TOGGLE_ICON_SIZE"
                :height="AUTH_FORM_TOGGLE_ICON_SIZE"
                shape-rendering="crispEdges"
                :title="t('login.copy_button_tooltip')"
                @click="copyToClipboardHandler"
              >
                <copy-icon />
              </icon>
              <icon
                :class="classes.icon"
                :width="AUTH_FORM_TOGGLE_ICON_SIZE"
                :height="AUTH_FORM_TOGGLE_ICON_SIZE"
                shape-rendering="auto"
                :title="t('login.save_button_tooltip')"
                @click="saveFile"
              >
                <save-icon />
              </icon>
              <icon
                :class="classes.icon"
                :width="AUTH_FORM_TOGGLE_ICON_SIZE"
                :height="AUTH_FORM_TOGGLE_ICON_SIZE"
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
                :size="AUTH_FORM_TOGGLE_ICON_SIZE"
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
import { logger } from '@/utils/devTools/logger'
import { AUTH_FORM_TOGGLE_ICON_SIZE } from '@/components/Login/helpers/uiMetrics'

const { t } = useI18n()

const emit = defineEmits(['copy', 'save'])

const className = 'passphrase-generator'
const classes = {
  root: className,
  createSection: `${className}__create-section`,
  createTitle: `${className}__create-title`,
  createButton: `${className}__create-button`,
  box: `${className}__box`,
  passphraseLabel: `${className}__passphrase-label`,
  textarea: `${className}__textarea`,
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
      logger.log('PassphraseGenerator', 'warn', '[PassphraseGenerator] `element` is undefined')
    }
  }, 0)
}

const togglePassphraseVisibility = () => {
  showSuggestedPassphrase.value = !showSuggestedPassphrase.value
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/components/_form-action-layout.scss' as formActionLayout;
@use '@/assets/styles/components/_link-action-button.scss' as linkActionButton;
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

/**
 * 1. Change color icons when focus textarea.
 * 2. Remove textarea border bottom.
 */
.passphrase-generator {
  --a-passphrase-create-title-gap: var(--a-space-1);
  --a-passphrase-create-button-margin-top: var(--a-space-2);
  --a-passphrase-box-margin-top: var(--a-space-10);
  --a-passphrase-label-margin-top: var(--a-space-2);
  --a-passphrase-label-font-size: var(--a-font-size-xs);
  --a-passphrase-label-font-weight: var(--a-font-weight-regular);
  --a-passphrase-label-letter-spacing: var(--a-letter-spacing-normal);
  --a-passphrase-textarea-padding-top: var(--a-space-3);
  --a-passphrase-icon-opacity: var(--a-opacity-icon-muted);
  --a-passphrase-icon-transition-duration: var(--a-motion-emphasized);
  --a-passphrase-icon-size: var(--a-auth-control-hit-size);
  --a-passphrase-icon-hit-offset: calc(
    (var(--a-passphrase-icon-size) - var(--a-auth-control-icon-size)) / -2
  );
  --a-passphrase-icons-top-offset: calc(var(--a-space-1) * -1);
  --a-passphrase-icons-gap: var(--a-space-5);
  --a-passphrase-icon-backdrop-opacity-dark: 0.3;
  --a-passphrase-icon-backdrop-opacity-light: 0.12;
  --a-passphrase-label-line-height: var(--a-auth-control-label-line-height);

  &__create-section {
    @include formActionLayout.a-form-helper-section-center();
  }

  &__create-title {
    @include mixins.a-text-regular();
    margin-top: 0;
    margin-bottom: var(--a-passphrase-create-title-gap);
  }

  &__create-button {
    @include linkActionButton.a-link-action-button();
    margin-top: var(--a-passphrase-create-button-margin-top);
  }

  &__box {
    margin-top: var(--a-passphrase-box-margin-top);
    :deep(.v-input) {
      margin-top: 0;
    }
    :deep(.v-textarea) textarea {
      @include mixins.a-text-regular();
      line-height: var(--a-passphrase-label-line-height);
      padding-top: var(--a-passphrase-textarea-padding-top);
      mask-image: unset;
    }
    :deep(.v-textarea) {
      .v-input__slot:before,
      .v-input__slot:after {
        border-width: 0;
      }
    }
  }

  &__textarea {
    :deep(.v-field__input) {
      padding-top: 0;
    }
  }

  &__icon {
    position: relative;
    opacity: var(--a-passphrase-icon-opacity);
    transition: all var(--a-passphrase-icon-transition-duration) ease;

    &::before {
      content: '';
      position: absolute;
      border-radius: var(--a-radius-round);
      width: var(--a-passphrase-icon-size);
      height: var(--a-passphrase-icon-size);
      top: var(--a-passphrase-icon-hit-offset);
      left: var(--a-passphrase-icon-hit-offset);
      background-color: map.get(colors.$adm-colors, 'regular');
      opacity: 0;
      transition: all var(--a-passphrase-icon-transition-duration) ease;
    }

    &:hover {
      opacity: 1;
    }
  }
  &__icons {
    margin-top: var(--a-passphrase-icons-top-offset);
    > *:not(:first-child) {
      margin-left: var(--a-passphrase-icons-gap);
    }
  }
  &__passphrase-label {
    margin-top: var(--a-passphrase-label-margin-top);
    color: map.get(colors.$adm-colors, 'grey');
    font-size: var(--a-passphrase-label-font-size);
    font-weight: var(--a-passphrase-label-font-weight);
    line-height: var(--a-passphrase-label-line-height);
    letter-spacing: var(--a-passphrase-label-letter-spacing);
  }

  :deep(.v-input--is-focused) {
    .v-icon .svg-icon {
      fill: map.get(colors.$adm-colors, 'regular');
    }
  }
}

.v-theme--light {
  .passphrase-generator {
    &__create-button {
      @include linkActionButton.a-link-action-button-light();
    }
  }
}

.v-theme--dark {
  .passphrase-generator {
    &__create-button {
      @include linkActionButton.a-link-action-button-dark();
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
          opacity: var(--a-passphrase-icon-backdrop-opacity-dark);
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
          opacity: var(--a-passphrase-icon-backdrop-opacity-light);
        }
      }
    }
  }
}
</style>
