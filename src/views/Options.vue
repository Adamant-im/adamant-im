<template>
  <navigation-wrapper :class="className">
    <router-view v-if="hasView" />
    <template v-else>
      <!-- General -->
      <h3 :class="`${className}__title a-text-caption`" class="mt-4 mb-4">
        {{ t('options.general_title') }}
      </h3>
      <v-row align="center" no-gutters>
        <v-col cols="6">
          <v-list-subheader :class="`${className}__label`">
            {{ t('options.language_label') }}
          </v-list-subheader>
        </v-col>
        <v-col cols="6" class="text-right">
          <language-switcher :append-icon="mdiChevronDown" />
        </v-col>
        <v-col cols="6">
          <v-list-subheader :class="`${className}__label`">
            {{ t('options.currency_label') }}
          </v-list-subheader>
        </v-col>
        <v-col cols="6" class="text-right">
          <currency-switcher :append-icon="mdiChevronDown" />
        </v-col>
        <v-col cols="12">
          <v-checkbox
            v-model="darkTheme"
            :label="t('options.dark_theme')"
            color="grey darken-1"
            density="comfortable"
            hide-details
          />
        </v-col>
      </v-row>

      <!-- Security -->
      <h3 :class="`${className}__title a-text-caption`" class="mt-6 mb-6">
        {{ t('options.security_title') }}
      </h3>
      <v-row align="center" no-gutters>
        <v-col cols="12" a-text-regular-enlarged>
          <v-checkbox
            :label="t('options.stay_logged_in')"
            color="grey darken-1"
            :modelValue="stayLoggedIn"
            density="comfortable"
            hide-details
            @click.prevent="onCheckStayLoggedIn"
          />

          <div
            class="a-text-explanation-enlarged"
            :class="{ 'auth-method-tooltip': selectedAuthMethodIcon }"
          >
            <template v-if="selectedAuthMethodIcon">
              <v-icon :icon="selectedAuthMethodIcon" size="20" class="auth-method-status-icon" />
            </template>
            <template v-else>
              {{ t('options.stay_logged_in_tooltip') }}
            </template>
          </div>

          <div v-if="stayLoggedIn" class="mt-4">
            <v-text-field
              :model-value="selectedAuthMethodDisplayText"
              :label="t('options.authentication_method_label')"
              readonly
              density="comfortable"
              variant="outlined"
              hide-details
              :append-inner-icon="mdiChevronDown"
              @click="isSignInOptionsDialogDisplayed = true"
              class="auth-method-selector"
            />
          </div>

          <password-set-dialog v-model="isPasswordDialogDisplayed" @password="onSetPassword" />
          <sign-in-options-dialog
            v-model="isSignInOptionsDialogDisplayed"
            @select-auth-method="onAuthenticationMethodChange"
          />
        </v-col>
      </v-row>

      <!-- Chats -->
      <h3 :class="`${className}__title a-text-caption`" class="mt-6 mb-6">
        {{ t('options.chats_title') }}
      </h3>
      <v-row align="center" no-gutters>
        <v-col cols="12">
          <v-checkbox
            v-model="sendMessageOnEnter"
            :label="t('options.send_on_enter')"
            color="grey darken-1"
            density="comfortable"
            hide-details
          />

          <div class="a-text-explanation-enlarged">
            {{ t('options.send_on_enter_tooltip') }}
          </div>
        </v-col>

        <v-col cols="12" class="mt-6">
          <v-checkbox
            v-model="formatMessages"
            :label="t('options.format_messages')"
            color="grey darken-1"
            density="comfortable"
            hide-details
          />

          <div class="a-text-explanation-enlarged">
            {{ t('options.format_messages_tooltip') }}
          </div>
        </v-col>

        <v-col cols="12" class="mt-6">
          <v-checkbox
            v-model="useFullDate"
            :label="t('options.use_full_date')"
            color="grey darken-1"
            density="comfortable"
            hide-details
          />

          <div class="a-text-explanation-enlarged">
            {{ t('options.use_full_date_tooltip') }}
          </div>
        </v-col>
      </v-row>

      <!-- Notifications -->
      <h3 :class="`${className}__title a-text-caption`" class="mt-6 mb-6">
        {{ t('options.notification_title') }}
      </h3>
      <v-row align="center" no-gutters>
        <v-col cols="12">
          <v-checkbox
            v-model="allowSoundNotifications"
            :label="t('options.enable_sound')"
            color="grey darken-1"
            density="comfortable"
            hide-details
          />

          <div class="a-text-explanation-enlarged">
            {{ t('options.enable_sound_tooltip') }}
          </div>
        </v-col>
        <v-col cols="12" class="mt-6">
          <v-checkbox
            v-model="allowPushNotifications"
            :label="t('options.enable_push')"
            color="grey darken-1"
            density="comfortable"
            hide-details
          />

          <div class="a-text-explanation-enlarged">
            {{ t('options.enable_push_tooltip') }}
          </div>
        </v-col>
      </v-row>

      <!-- Actions -->
      <h3 :class="`${className}__title a-text-caption`" class="mt-6 mb-6">
        {{ t('options.actions') }}
      </h3>
      <v-row no-gutters>
        <v-col cols="12">
          <v-list class="actions-list">
            <v-list-item
              :title="t('options.nodes_list')"
              :append-icon="mdiChevronRight"
              @click="router.push('/options/nodes')"
            />

            <v-list-item
              :title="t('options.wallets_list')"
              :append-icon="mdiChevronRight"
              @click="router.push('/options/wallets')"
            />

            <v-list-item
              :title="t('options.export_keys.title')"
              :append-icon="mdiChevronRight"
              @click="router.push('/options/export-keys')"
            />

            <v-list-item
              :title="t('options.vote_for_delegates_button')"
              :append-icon="mdiChevronRight"
              @click="router.push('/votes')"
            />

            <v-list-item
              v-if="isDevModeEnabled"
              :title="t('options.dev_screens')"
              :append-icon="mdiChevronRight"
              @click="router.push('/options/dev-screens')"
            />

            <v-divider />

            <v-list-item
              :title="t('bottom.exit_button')"
              :append-icon="mdiLogoutVariant"
              @click="logout"
            />
          </v-list>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <div
          :class="`${className}__version_info ml-auto`"
          @click="onVersionClick"
          data-test-id="version-info"
        >
          {{ t('options.version') }} {{ appVersion }}
        </div>
      </v-row>
    </template>
  </navigation-wrapper>
</template>

<script setup lang="ts">
import { nextTick, inject, computed, onBeforeUnmount, onMounted, Ref, ref } from 'vue'
import {
  mdiChevronRight,
  mdiChevronDown,
  mdiLogoutVariant,
  mdiFingerprint,
  mdiKeyVariant,
  mdiLock
} from '@mdi/js'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'

import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import CurrencySwitcher from '@/components/CurrencySwitcher.vue'
import PasswordSetDialog from '@/components/PasswordSetDialog.vue'
import SignInOptionsDialog from '@/components/SignInOptionsDialog.vue'
import { clearDb, db as isIDBSupported } from '@/lib/idb'
import { resetPinia } from '@/plugins/pinia'
import NavigationWrapper from '@/components/NavigationWrapper.vue'
import { useSavedScroll } from '@/hooks/useSavedScroll'
import { sidebarLayoutKey } from '@/lib/constants'
import { useChatStateStore } from '@/stores/modal-state'
import { biometricAuth, passkeyAuth } from '@/lib/auth'
import { AuthenticationMethod, SetupResult } from '@/lib/auth/types'
import { saveState } from '@/lib/idb/state'
import { saveSecureData } from '@/lib/adamant-api'
import { setGlobalEncryptionKey } from '@/lib/idb/crypto'

const store = useStore()
const chatStateStore = useChatStateStore()
const router = useRouter()
const { t } = useI18n()
const theme = useTheme()

const className = 'settings-view'

const { hasView } = useSavedScroll()

const appVersion = inject('appVersion')
const sidebarLayoutRef = inject<Ref>(sidebarLayoutKey)

const tapCount = ref(0)
const isSignInOptionsDialogDisplayed = ref(false)

const isPasswordDialogDisplayed = computed({
  get() {
    return chatStateStore.isShowSetPasswordDialog
  },
  set(value) {
    chatStateStore.setShowSetPasswordDialog(value)
  }
})

const stayLoggedIn = computed({
  get() {
    return store.state.options.stayLoggedIn
  },
  set(value) {
    store.commit('options/updateOption', {
      key: 'stayLoggedIn',
      value
    })
  }
})

const scrollTopPosition = computed({
  get() {
    return store.state.options.scrollTopPosition
  },
  set(value) {
    store.commit('options/updateOption', {
      key: 'scrollTopPosition',
      value
    })
  }
})

const sendMessageOnEnter = computed({
  get() {
    return store.state.options.sendMessageOnEnter
  },
  set(value) {
    store.commit('options/updateOption', {
      key: 'sendMessageOnEnter',
      value
    })
  }
})

const formatMessages = computed({
  get() {
    return store.state.options.formatMessages
  },
  set(value) {
    store.commit('options/updateOption', {
      key: 'formatMessages',
      value
    })
  }
})

const useFullDate = computed({
  get() {
    return store.state.options.useFullDate
  },
  set(value) {
    store.commit('options/updateOption', {
      key: 'useFullDate',
      value
    })
  }
})

const allowSoundNotifications = computed({
  get() {
    return store.state.options.allowSoundNotifications
  },
  set(value) {
    store.commit('options/updateOption', {
      key: 'allowSoundNotifications',
      value
    })
  }
})

const allowPushNotifications = computed({
  get() {
    return store.state.options.allowPushNotifications
  },
  set(value) {
    store.commit('options/updateOption', {
      key: 'allowPushNotifications',
      value
    })
  }
})

const darkTheme = computed({
  get() {
    return store.state.options.darkTheme
  },
  set(isDarkTheme) {
    store.commit('options/updateOption', {
      key: 'darkTheme',
      value: isDarkTheme
    })

    theme.global.name.value = isDarkTheme ? 'dark' : 'light'
  }
})

const isDevModeEnabled = computed({
  get() {
    return store.state.options.devModeEnabled
  },
  set(value) {
    store.commit('options/updateOption', {
      key: 'devModeEnabled',
      value
    })
  }
})

const selectedAuthenticationMethod = computed({
  get() {
    return store.state.options.authenticationMethod || null
  },
  set(value) {
    store.commit('options/updateOption', {
      key: 'authenticationMethod',
      value
    })
  }
})

const selectedAuthMethodDisplayText = computed(() => {
  if (!selectedAuthenticationMethod.value) {
    return t('options.authentication_method_placeholder')
  }

  return t(`login.signin_options.${selectedAuthenticationMethod.value}.title`)
})

const selectedAuthMethodIcon = computed(() => {
  switch (selectedAuthenticationMethod.value) {
    case AuthenticationMethod.Biometric:
      return mdiFingerprint
    case AuthenticationMethod.Passkey:
      return mdiKeyVariant
    case AuthenticationMethod.Password:
      return mdiLock
    default:
      return null
  }
})

const onCheckStayLoggedIn = () => {
  if (!stayLoggedIn.value) {
    isIDBSupported
      .then(() => {
        store.commit('options/updateOption', {
          key: 'stayLoggedIn',
          value: true
        })
      })
      .catch(() => {
        store.dispatch('snackbar/show', {
          message: t('options.idb_not_supported'),
          timeout: 5000
        })
      })
  } else {
    clearDb().then(async () => {
      // Clear all authentication methods when disabling stay logged in
      await clearAllAuthenticationMethods()
      store.commit('options/updateOption', {
        key: 'stayLoggedIn',
        value: false
      })
    })
  }
}

const logout = () => {
  resetPinia()
  store.dispatch('stopInterval')
  store.dispatch('logout')
  router.push('/')
}

const setupPasswordAuth = () => {
  store.commit('resetPassword')
  selectedAuthenticationMethod.value = null
  isPasswordDialogDisplayed.value = true
}

const onSetPassword = () => {
  selectedAuthenticationMethod.value = AuthenticationMethod.Password
  showSuccess(t('login.signin_options.notifications.password_enabled'))
}

const showSuccess = (message: string) => {
  store.dispatch('snackbar/show', {
    message,
    timeout: 3000
  })
}

const showError = (message: string) => {
  store.dispatch('snackbar/show', {
    message,
    timeout: 5000
  })
}

const setupBiometricAuth = async (): Promise<boolean> => {
  try {
    const result = await biometricAuth.setupBiometric()

    if (result === SetupResult.Cancel) {
      return false
    }

    if (result !== SetupResult.Success) {
      throw new Error(t('login.signin_options.not_available'))
    }

    const currentPassphrase = store.getters.getPassPhrase
    if (!currentPassphrase) {
      throw new Error(t('login.signin_options.notifications.biometric_failed'))
    }
    const encryptionKey = crypto.getRandomValues(new Uint8Array(32))
    await saveSecureData(currentPassphrase, encryptionKey)
    selectedAuthenticationMethod.value = AuthenticationMethod.Biometric
    store.commit('resetPassword')
    await clearDb()
    setGlobalEncryptionKey(encryptionKey)
    await saveState(store)
    showSuccess(t('login.signin_options.notifications.biometric_enabled'))
    return true
  } catch (error) {
    showError(
      error instanceof Error
        ? error.message
        : t('login.signin_options.notifications.biometric_failed')
    )
    return false
  }
}

const setupPasskeyAuth = async (): Promise<boolean> => {
  try {
    const result = await passkeyAuth.setupPasskey()

    if (result === SetupResult.Cancel) {
      return false
    }

    if (result !== SetupResult.Success) {
      throw new Error(t('login.signin_options.not_available'))
    }

    const currentPassphrase = store.getters.getPassPhrase
    if (!currentPassphrase) {
      throw new Error(t('login.signin_options.notifications.passkey_failed'))
    }
    selectedAuthenticationMethod.value = AuthenticationMethod.Passkey
    const encryptionKey = crypto.getRandomValues(new Uint8Array(32))
    await saveSecureData(currentPassphrase, encryptionKey)
    store.commit('resetPassword')
    await clearDb()
    setGlobalEncryptionKey(encryptionKey)
    await saveState(store)
    showSuccess(t('login.signin_options.notifications.passkey_enabled'))
    return true
  } catch (error) {
    showError(
      error instanceof Error
        ? error.message
        : t('login.signin_options.notifications.passkey_failed')
    )
    return false
  }
}

const clearAllAuthenticationMethods = async () => {
  store.commit('resetPassword')

  store.commit('options/updateOption', {
    key: 'authenticationMethod',
    value: null
  })
}

const onAuthenticationMethodChange = async (method: AuthenticationMethod) => {
  store.commit('resetPassword')

  if (method === AuthenticationMethod.Password) {
    setupPasswordAuth()
    return
  }

  let success = false

  if (method === AuthenticationMethod.Biometric) {
    success = await setupBiometricAuth()
  }

  if (method === AuthenticationMethod.Passkey) {
    success = await setupPasskeyAuth()
  }

  if (!success) {
    selectedAuthenticationMethod.value = null
  }
}

const onVersionClick = () => {
  tapCount.value++

  if (tapCount.value >= 10) {
    isDevModeEnabled.value = true

    store.dispatch('snackbar/show', {
      message: 'Dev screens enabled',
      timeout: 3000
    })
  }
}

onMounted(() => {
  if (stayLoggedIn.value && !selectedAuthenticationMethod.value) {
    // Auto-disable stay logged in if no authentication method selected
    store.commit('options/updateOption', {
      key: 'stayLoggedIn',
      value: false
    })
  }
  nextTick(() => {
    if (sidebarLayoutRef && scrollTopPosition.value) {
      sidebarLayoutRef.value.scrollTo({
        top: scrollTopPosition.value
      })
    }
  })
})

onBeforeUnmount(() => {
  if (sidebarLayoutRef) {
    scrollTopPosition.value = sidebarLayoutRef.value.scrollTop || 0
  }
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

.settings-view {
  &__title {
    padding-top: 15px;
    margin-left: -24px;
    margin-right: -24px;
    padding-left: 24px;
    padding-right: 24px;
  }
  &__version_info {
    @include mixins.a-text-explanation();
    margin-top: 24px;
    margin-bottom: 16px;
    cursor: pointer;
    user-select: none;

    &:hover {
      opacity: 0.8;
    }

    &:active {
      opacity: 0.6;
    }
  }
  &__action {
    display: block;
    font-size: 16px;
    font-weight: 500;
    text-decoration-line: underline;
    margin: 6px 8px;
    padding: 0 16px;
  }
  :deep(.v-input--selection-controls):not(.v-input--hide-details) .v-input__slot {
    margin-bottom: 0;
  }
  :deep(.v-input--selection-controls) {
    margin-top: 0;
  }
  :deep(.v-label),
  &__label,
  &__list__title {
    @include mixins.a-text-regular-enlarged();
  }
  :deep(.v-list) {
    background: transparent;
    padding: 0;
  }
  .actions-list {
    margin-left: -24px;
    margin-right: -24px;

    :deep(.v-list-item) {
      padding-inline-start: 24px;
      padding-inline-end: 24px;
    }
  }
  :deep(.v-list-subheader) {
    height: 48px;
  }
  :deep(.v-checkbox) {
    margin-left: -8px;
  }

  .auth-method-selector {
    :deep(.v-field),
    :deep(.v-field__input),
    :deep(.v-field__append-inner),
    :deep(.v-label) {
      cursor: pointer;
    }
  }

  .auth-method-tooltip {
    display: flex;
    align-items: center;
  }

  .auth-method-status-icon {
    margin-left: 0;
  }
}

/** Themes **/
.v-theme--light {
  .settings-view {
    &__version_info {
      color: map.get(colors.$adm-colors, 'muted');
    }
    &__title {
      background-color: map.get(colors.$adm-colors, 'secondary2-transparent');
      color: map.get(colors.$adm-colors, 'regular');
    }
    &__action {
      color: map.get(colors.$adm-colors, 'regular');
    }
    :deep(.v-label),
    &__label {
      color: map.get(colors.$adm-colors, 'regular');
    }
    .v-divider {
      border-color: map.get(colors.$adm-colors, 'secondary2');
    }
  }
}
.v-theme--dark {
  .settings-view {
    &__action {
      color: map.get(settings.$shades, 'white');
    }
  }
}

/** Breakpoints **/
@media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
  .settings-view {
    &__title {
      margin-left: -16px;
      margin-right: -16px;
      padding-left: 16px;
      padding-right: 16px;
    }

    .actions-list {
      margin-left: -16px;
      margin-right: -16px;

      :deep(.v-list-item) {
        padding-inline-start: 16px;
        padding-inline-end: 16px;
      }
    }
  }
}
</style>
