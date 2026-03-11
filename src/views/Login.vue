<template>
  <component :is="layout">
    <v-row justify="center" gap="0" :class="className">
      <container>
        <div :class="`${className}__buttons`">
          <div class="text-right">
            <language-switcher :prepend-icon="mdiChevronRight" />
          </div>
          <div :class="`${className}__settings-button-container`">
            <router-link to="/options/nodes" custom #default="{ navigate }">
              <v-btn
                @click="navigate"
                icon
                variant="plain"
                :size="AUTH_FORM_SETTINGS_BUTTON_SIZE"
                :class="`${className}__settings-button`"
              >
                <v-icon :icon="mdiCog" />
              </v-btn>
            </router-link>
          </div>
        </div>

        <v-sheet class="text-center mt-4" color="transparent">
          <logo :class="`${className}__logo`" />

          <h1 :class="`${className}__title`">
            {{ t('login.brand_title') }}
          </h1>
          <h2 :class="`${className}__subtitle`">
            {{ t('login.subheader') }}
          </h2>
        </v-sheet>

        <v-sheet
          v-if="!isLoginViaPassword"
          class="text-center"
          :class="`${className}__auth-sheet`"
          color="transparent"
        >
          <v-row justify="center" gap="0">
            <v-col sm="8" md="8" lg="8">
              <login-form
                ref="loginForm"
                v-model="passphrase"
                @login="onLogin"
                @error="onLoginError"
              />
            </v-col>
          </v-row>

          <v-row justify="center" class="mt-4" gap="0">
            <v-col cols="auto">
              <v-btn
                class="ma-2"
                :title="t('login.scan_qr_code_button_tooltip')"
                icon
                variant="text"
                size="x-small"
                :class="`${className}__icon`"
                @click="showQrcodeScanner = true"
              >
                <icon><qr-code-scan-icon /></icon>
              </v-btn>
            </v-col>

            <v-col cols="auto">
              <qrcode-capture @detect="onDetectQrcode" @error="onDetectQrcodeError">
                <v-btn
                  class="ma-2"
                  :title="t('login.login_by_qr_code_tooltip')"
                  icon
                  variant="text"
                  size="x-small"
                  :class="`${className}__icon`"
                >
                  <icon><file-icon /></icon>
                </v-btn>
              </qrcode-capture>
            </v-col>
          </v-row>
        </v-sheet>

        <v-row v-if="!isLoginViaPassword" justify="center" :class="`${className}__passphrase-row`">
          <v-col sm="8" md="8" lg="8">
            <passphrase-generator @copy="onCopyPassphrase" />
          </v-col>
        </v-row>

        <v-sheet
          v-if="isLoginViaPassword"
          class="text-center"
          :class="`${className}__auth-sheet`"
          color="transparent"
        >
          <v-row gap="0" justify="center">
            <v-col sm="8" md="8" lg="8">
              <login-password-form v-model="password" @login="onLogin" @error="onLoginError" />
            </v-col>
          </v-row>
        </v-sheet>

        <qrcode-scanner-dialog
          v-if="showQrcodeScanner"
          v-model="showQrcodeScanner"
          @scan="onScanQrcode"
        />
      </container>
    </v-row>
  </component>
</template>

<script lang="ts" setup>
import { nextTick, computed, ref, useTemplateRef } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { mdiCog, mdiChevronRight } from '@mdi/js'
import { useRoute } from 'vue-router'

import QrcodeCapture from '@/components/QrcodeCapture.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import PassphraseGenerator from '@/components/PassphraseGenerator.vue'
import LoginForm from '@/components/LoginForm.vue'
import QrcodeScannerDialog from '@/components/QrcodeScannerDialog.vue'
import Icon from '@/components/icons/BaseIcon.vue'
import QrCodeScanIcon from '@/components/icons/common/QrCodeScan.vue'
import FileIcon from '@/components/icons/common/File.vue'
import LoginPasswordForm from '@/components/LoginPasswordForm.vue'
import Logo from '@/components/icons/common/Logo.vue'
import { navigateByURI } from '@/router/navigationGuard'
import { logger } from '@/utils/devTools/logger'
import { AUTH_FORM_SETTINGS_BUTTON_SIZE } from '@/components/Login/helpers/uiMetrics'

const store = useStore()
const route = useRoute()
const { t } = useI18n()

const className = 'login-page'
const passphrase = ref('')
const password = ref('')
const showQrcodeScanner = ref(false)
const loginForm = useTemplateRef<InstanceType<typeof LoginForm> | null>('loginForm')

const isLoginViaPassword = computed(() => store.getters['options/isLoginViaPassword'])
const layout = computed(() => route.meta.layout || 'default')

const onDetectQrcode = (passphrase: string) => {
  onScanQrcode(passphrase)
}

const onDetectQrcodeError = (err: unknown) => {
  passphrase.value = ''
  store.dispatch('snackbar/show', {
    message: t('login.invalid_qr_code')
  })
  logger.log('Login', 'warn', err)
}

const onLogin = () => {
  if (!store.state.chat.isFulfilled) {
    store.commit('chat/createAdamantChats')
    store.dispatch('chat/loadChats').then(() => store.dispatch('startInterval'))
  } else {
    store.dispatch('startInterval')
  }
  navigateByURI()
}

const onLoginError = (errorMessage: string) => {
  store.dispatch('snackbar/show', {
    message: errorMessage,
    timeout: 3000
  })
}

const onCopyPassphrase = () => {
  store.dispatch('snackbar/show', {
    message: t('home.copied'),
    timeout: 2000
  })
}

const onScanQrcode = (value: string) => {
  passphrase.value = value
  nextTick(() => {
    loginForm.value?.submit()
  })
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

.login-page {
  --a-login-title-letter-spacing: 0.12em;
  --a-login-title-gap-from-logo: var(--a-space-6);
  --a-login-subtitle-gap: var(--a-space-2);
  --a-login-subtitle-weight: 100;
  --a-login-auth-sheet-margin-top: var(--a-space-6);
  --a-login-passphrase-row-margin-top: var(--a-space-10);
  --a-login-settings-offset-inline: var(--a-space-2);
  --a-login-settings-hover-overlay-opacity: var(--a-opacity-overlay-soft);
  --a-login-icon-opacity: var(--a-opacity-icon-muted);
  --a-login-bottom-padding: calc(var(--a-space-8) + var(--a-safe-area-bottom));
  --a-login-bottom-padding-mobile: calc(
    var(--a-space-10) + var(--a-space-2) + var(--a-safe-area-bottom)
  );

  height: 100%;
  padding-bottom: var(--a-login-bottom-padding);

  &__logo {
    width: var(--a-login-hero-logo-width);
    max-width: 100%;
    height: auto;
  }

  &__title {
    @include mixins.a-text-headline();
    font-family: var(--a-font-family-sans);
    line-height: var(--a-login-hero-title-line-height);
    letter-spacing: var(--a-login-title-letter-spacing);
    margin-top: var(--a-login-title-gap-from-logo);
    margin-bottom: 0;
  }
  &__subtitle {
    @include mixins.a-text-caption-light();
    font-family: var(--a-font-family-sans);
    font-weight: var(--a-login-subtitle-weight);
    margin-top: var(--a-login-subtitle-gap);
    margin-bottom: 0;
  }
  &__icon {
    transition:
      opacity var(--a-motion-base) linear,
      color var(--a-motion-base) linear;
  }
  &__buttons {
    position: relative;
  }
  &__settings-button-container {
    position: absolute;
    right: 0;
    margin-right: var(--a-login-settings-offset-inline);
  }
  &__settings-button {
    &:hover > ::v-deep(.v-btn__overlay) {
      display: block;
      opacity: var(--a-login-settings-hover-overlay-opacity);
    }

    &:focus-visible {
      box-shadow: var(--a-focus-ring);
      border-radius: var(--a-radius-round);
    }
  }

  &__passphrase-row {
    margin-top: var(--a-login-passphrase-row-margin-top);
  }

  &__auth-sheet {
    margin-top: var(--a-login-auth-sheet-margin-top);
  }

  @media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
    padding-bottom: var(--a-login-bottom-padding-mobile);
  }
}

/** Themes **/
.v-theme--light {
  .login-page {
    &__title,
    &__subtitle {
      color: map.get(colors.$adm-colors, 'regular');
    }

    &__icon {
      color: map.get(colors.$adm-colors, 'black2');
      opacity: var(--a-login-icon-opacity);

      &:hover {
        opacity: 1;
      }
    }
  }
}
.v-theme--dark {
  .login-page {
    &__icon {
      color: map.get(colors.$adm-colors, 'grey-transparent');

      &:hover {
        color: map.get(colors.$adm-colors, 'secondary');
        opacity: 1;
      }
    }
  }
}
</style>
