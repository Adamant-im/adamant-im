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

          <div class="a-text-explanation-enlarged">
            {{ t('options.stay_logged_in_tooltip') }}
          </div>

          <password-set-dialog v-model="isPasswordDialogDisplayed" @password="onSetPassword" />
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
          <v-row no-gutters class="my-0">
            <v-col cols="6" class="d-flex">
              <div>
                {{ t('options.notification_title') }}
              </div>
              <v-tooltip
                :text="infoText"
                location="end"
                :max-width="520"
                :class="`${className}__info-tooltip`"
              >
                <template v-slot:activator="{ props }">
                  <v-icon v-bind="props" :icon="mdiInformation" />
                </template>
              </v-tooltip>
            </v-col>
            <v-col cols="6" :class="`${className}__notifications-col`" class="my-0">
              <v-select
                v-model="allowNotificationType"
                :items="notificationItems"
                variant="underlined"
                :loading="isNotificationRegistering"
                :disabled="isNotificationRegistering"
              />
            </v-col>
          </v-row>
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
import { mdiChevronRight, mdiChevronDown, mdiLogoutVariant, mdiInformation } from '@mdi/js'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'

import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import CurrencySwitcher from '@/components/CurrencySwitcher.vue'
import PasswordSetDialog from '@/components/PasswordSetDialog.vue'
import { clearDb, db as isIDBSupported } from '@/lib/idb'
import { resetPinia } from '@/plugins/pinia'
import NavigationWrapper from '@/components/NavigationWrapper.vue'
import { useSavedScroll } from '@/hooks/useSavedScroll'
import { sidebarLayoutKey, notificationType } from '@/lib/constants'
import { useChatStateStore } from '@/stores/modal-state'
import { pushService } from '@/lib/notifications/pushServiceFactory'
import { usePushNotificationSetup } from '@/hooks/pushNotifications/usePushNotificationSetup'
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

const store = useStore()
const chatStateStore = useChatStateStore()
const router = useRouter()
const { t } = useI18n()
const theme = useTheme()

const { syncNotificationSettings } = usePushNotificationSetup()

const className = 'settings-view'

const { hasView } = useSavedScroll()

const notificationItems = [
  { title: 'No Notifications', value: notificationType['No Notifications'] },
  { title: 'Background Fetch', value: notificationType['Background Fetch'] },
  { title: 'Push', value: notificationType['Push'] }
]

const infoText = t('options.notifications_info')

const appVersion = inject('appVersion')
const sidebarLayoutRef = inject<Ref>(sidebarLayoutKey)

const tapCount = ref(0)
const isNotificationRegistering = ref(false)

const isPasswordDialogDisplayed = computed({
  get() {
    return chatStateStore.isShowSetPasswordDialog
  },
  set(value) {
    chatStateStore.setShowSetPasswordDialog(value)
  }
})

const stayLoggedIn = computed(() => {
  return store.state.options.stayLoggedIn
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

const allowNotificationType = computed({
  get() {
    return store.state.options.allowNotificationType
  },
  set(value) {
    handleNotificationTypeChange(value)
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

const isLoginViaPassword = computed(() => store.getters['options/isLoginViaPassword'])
const lastSuccessfulNotificationType = ref(allowNotificationType.value)

const handleNotificationTypeChange = async (newVal: number) => {
  const oldVal = store.state.options.allowNotificationType

  if (newVal === oldVal) return

  isNotificationRegistering.value = true

  try {
    const isNotPushNotification =
      newVal === notificationType['No Notifications'] ||
      newVal === notificationType['Background Fetch']

    if (newVal === notificationType['Push']) {
      await setPushNotifications(true)
    } else if (isNotPushNotification && oldVal === notificationType['Push']) {
      await setPushNotifications(false)
    }

    store.commit('options/updateOption', {
      key: 'allowNotificationType',
      value: newVal
    })

    if (Capacitor.getPlatform() === 'android') {
      try {
        await Preferences.set({
          key: 'allowNotificationType',
          value: newVal.toString()
        })
        console.log(`[Options] Synced notification setting to Android: ${newVal}`)
      } catch (error) {
        console.error('[Options] Failed to sync with Android:', error)
      }
    }

    syncNotificationSettings(newVal)
    lastSuccessfulNotificationType.value = newVal

    console.log(`[Options] Notification type changed: ${newVal}`)
  } catch (error) {
    if (typeof error === 'string') {
      showSnackbar(error)
    } else if (error instanceof Error) {
      showSnackbar(error.message)
    } else {
      showSnackbar(t('options.push_register_error'))
    }
  } finally {
    isNotificationRegistering.value = false
  }
}

const setPushNotifications = async (enabled: boolean): Promise<void> => {
  if (enabled) {
    const initialized = await pushService.initialize()

    if (!initialized) {
      throw new Error(t('options.push_not_supported'))
    }

    const permissionGranted = await pushService.requestPermissions()

    if (!permissionGranted) {
      throw new Error(t('options.push_denied'))
    }

    const privateKey = await store.dispatch('getPrivateKeyForPush')
    if (privateKey) {
      pushService.setPrivateKey(privateKey)
    }

    await pushService.registerDevice()

    showSnackbar(t('options.push_subscribe_success'))
  } else {
    await pushService.unregisterDevice()

    showSnackbar(t('options.push_unsubscribe_success'))
  }
}

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

const onSetPassword = () => {
  store.commit('options/updateOption', {
    key: 'stayLoggedIn',
    value: true
  })
}

const onCheckStayLoggedIn = () => {
  if (!stayLoggedIn.value) {
    isIDBSupported
      .then(() => {
        isPasswordDialogDisplayed.value = true
      })
      .catch(() => {
        showSnackbar(t('options.idb_not_supported'))
      })
  } else {
    clearDb().then(() => {
      store.commit('options/updateOption', {
        key: 'stayLoggedIn',
        value: false
      })

      store.commit('resetPassword')
    })
  }
}

const logout = () => {
  resetPinia()
  store.dispatch('stopInterval')
  store.dispatch('logout')
  pushService.reset()

  if (isLoginViaPassword.value) {
    return clearDb()
      .catch((err) => {
        console.error(err)
      })
      .finally(() => {
        // turn off `loginViaPassword` option
        store.commit('options/updateOption', { key: 'stayLoggedIn', value: false })

        router.push('/')
      })
  } else {
    return Promise.resolve(router.push('/'))
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

const showSnackbar = (message: string, timeout: number = 5000) => {
  store.dispatch('snackbar/show', {
    message,
    timeout
  })
}

onMounted(() => {
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
  &__info-tooltip {
    white-space: break-spaces;
    :deep(.v-overlay__content) {
      padding-top: 24px;
      color: white;
      background-color: map.get(colors.$adm-colors, 'regular');
    }
  }
  &__notifications-col {
    height: 60px;
    margin-top: -10px !important;
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
