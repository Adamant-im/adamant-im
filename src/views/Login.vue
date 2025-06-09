<template>
  <component :is="layout">
    <v-row justify="center" no-gutters :class="className">
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
                :size="32"
                :class="`${className}__settings-button`"
              >
                <v-icon :icon="mdiCog" />
              </v-btn>
            </router-link>
          </div>
        </div>

        <v-sheet class="text-center mt-4" color="transparent">
          <logo style="width: 300px" />

          <h1 :class="`${className}__title`">
            {{ t('login.brand_title') }}
          </h1>
          <h2 :class="`${className}__subtitle`" class="hidden-sm-and-down mt-4">
            {{ t('login.subheader') }}
          </h2>
        </v-sheet>

        <v-sheet v-if="!isLoginViaPassword" class="text-center mt-4" color="transparent">
          <v-row justify="center" no-gutters>
            <v-col sm="8" md="8" lg="8">
              <login-form
                ref="loginForm"
                v-model="passphrase"
                @login="onLogin"
                @error="onLoginError"
              />
            </v-col>
          </v-row>

          <v-row justify="center" class="mt-4" no-gutters>
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

        <v-row v-if="!isLoginViaPassword" justify="center" class="mt-8">
          <v-col sm="8" md="8" lg="8">
            <passphrase-generator @copy="onCopyPassphrase" />
          </v-col>
        </v-row>

        <v-sheet v-if="isLoginViaPassword" class="text-center mt-6" color="transparent">
          <v-row no-gutters justify="center">
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

<script setup lang="ts">
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
  console.warn(err)
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
@use 'vuetify/settings';

.login-page {
  height: 100%;

  &__title {
    font-family:
      -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
      sans-serif;
    font-weight: 100;
    font-size: 40px;
    line-height: 40px;
    text-transform: uppercase;
  }
  &__subtitle {
    font-family:
      -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
      sans-serif;
    font-weight: 100;
    font-size: 18px;
  }
  &__icon {
    transition: 0.2s linear;
  }
  &__buttons {
    position: relative;
  }
  &__settings-button-container {
    position: absolute;
    right: 0;
    margin-right: 8px;
  }
  &__settings-button {
    &:hover > ::v-deep(.v-btn__overlay) {
      display: block;
      opacity: 0.06;
    }
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
      opacity: 0.62;

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
