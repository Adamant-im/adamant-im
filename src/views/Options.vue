<template>
  <navigation-wrapper :class="className">
    <router-view v-if="hasView" />
    <template v-else>
      <!-- General -->
      <h3 :class="[`${className}__title`, `${className}__title--first`]">
        {{ t('options.general_title') }}
      </h3>
      <v-row align="center" gap="0">
        <v-col cols="6">
          <v-list-subheader :class="`${className}__label`">
            {{ t('options.language_label') }}
          </v-list-subheader>
        </v-col>
        <v-col cols="6" :class="`${className}__control-col`">
          <language-switcher :append-icon="mdiChevronDown" />
        </v-col>
        <v-col cols="6">
          <v-list-subheader :class="`${className}__label`">
            {{ t('options.currency_label') }}
          </v-list-subheader>
        </v-col>
        <v-col cols="6" :class="`${className}__control-col`">
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
      <h3 :class="[`${className}__title`, `${className}__title--section`]">
        {{ t('options.security_title') }}
      </h3>
      <v-row align="center" gap="0">
        <v-col cols="12" :class="`${className}__security-block`">
          <v-checkbox
            :label="t('options.stay_logged_in')"
            color="grey darken-1"
            :modelValue="stayLoggedIn"
            density="comfortable"
            hide-details
            @click.prevent="onCheckStayLoggedIn"
          />

          <div :class="`${className}__explanation`">
            {{ t('options.stay_logged_in_tooltip') }}
          </div>

          <password-set-dialog v-model="isPasswordDialogDisplayed" @password="onSetPassword" />
        </v-col>
      </v-row>

      <!-- Chats -->
      <h3 :class="[`${className}__title`, `${className}__title--section`]">
        {{ t('options.chats_title') }}
      </h3>
      <v-row align="center" gap="0">
        <v-col cols="12">
          <v-checkbox
            v-model="sendMessageOnEnter"
            :label="t('options.send_on_enter')"
            color="grey darken-1"
            density="comfortable"
            hide-details
          />

          <div :class="`${className}__explanation`">
            {{ t('options.send_on_enter_tooltip') }}
          </div>
        </v-col>

        <v-col cols="12" :class="`${className}__option-offset`">
          <v-checkbox
            v-model="formatMessages"
            :label="t('options.format_messages')"
            color="grey darken-1"
            density="comfortable"
            hide-details
          />

          <div :class="`${className}__explanation`">
            {{ t('options.format_messages_tooltip') }}
          </div>
        </v-col>

        <v-col cols="12" :class="`${className}__option-offset`">
          <v-checkbox
            v-model="useFullDate"
            :label="t('options.use_full_date')"
            color="grey darken-1"
            density="comfortable"
            hide-details
          />

          <div :class="`${className}__explanation`">
            {{ t('options.use_full_date_tooltip') }}
          </div>
        </v-col>
      </v-row>

      <!-- Notifications -->
      <h3 :class="[`${className}__title`, `${className}__title--section`]">
        {{ t('options.notification_title') }}
      </h3>
      <v-row align="center" gap="0">
        <v-col cols="12">
          <v-checkbox
            v-model="allowSoundNotifications"
            :label="t('options.enable_sound')"
            color="grey darken-1"
            density="comfortable"
            hide-details
          />

          <div :class="`${className}__explanation`">
            {{ t('options.enable_sound_tooltip') }}
          </div>
        </v-col>
        <v-col cols="12" :class="`${className}__option-offset`">
          <v-checkbox
            v-model="allowPushNotifications"
            :label="t('options.enable_push')"
            color="grey darken-1"
            density="comfortable"
            hide-details
          />

          <div :class="`${className}__explanation`">
            {{ t('options.enable_push_tooltip') }}
          </div>
        </v-col>
      </v-row>

      <!-- Actions -->
      <h3 :class="[`${className}__title`, `${className}__title--section`]">
        {{ t('options.actions') }}
      </h3>
      <v-row gap="0">
        <v-col cols="12">
          <v-list class="actions-list">
            <v-list-item
              :title="t('options.nodes_list')"
              :append-icon="mdiChevronRight"
              @click="navigateToSettingsChild('/options/nodes')"
            />

            <v-list-item
              :title="t('options.wallets_list')"
              :append-icon="mdiChevronRight"
              @click="navigateToSettingsChild('/options/wallets')"
            />

            <v-list-item
              :title="t('options.export_keys.title')"
              :append-icon="mdiChevronRight"
              @click="navigateToSettingsChild('/options/export-keys')"
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
              @click="navigateToSettingsChild('/options/dev-screens')"
            />

            <v-divider />

            <v-list-item
              :class="`${className}__logout`"
              :title="t('bottom.exit_button')"
              :append-icon="mdiLogoutVariant"
              @click="logout"
            />
          </v-list>
        </v-col>
      </v-row>
      <v-row gap="0">
        <button
          type="button"
          :class="`${className}__version_info`"
          @click="onVersionClick"
          data-test-id="version-info"
        >
          {{ t('options.version') }} {{ appVersion }}
        </button>
      </v-row>
    </template>
  </navigation-wrapper>
</template>

<script setup lang="ts">
import { nextTick, inject, computed, onBeforeUnmount, onMounted, Ref, ref, watch } from 'vue'
import { mdiChevronRight, mdiChevronDown, mdiLogoutVariant } from '@mdi/js'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'

import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import CurrencySwitcher from '@/components/CurrencySwitcher.vue'
import PasswordSetDialog from '@/components/PasswordSetDialog.vue'
import { clearDb, db as isIDBSupported } from '@/lib/idb'
import { resetPinia } from '@/plugins/pinia'
import NavigationWrapper from '@/components/NavigationWrapper.vue'
import { sidebarLayoutKey } from '@/lib/constants'
import { useChatStateStore } from '@/stores/modal-state'
import { logger } from '@/utils/devTools/logger'

const store = useStore()
const chatStateStore = useChatStateStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const theme = useTheme()

const className = 'settings-view'
const hasView = computed(() => route.matched.length > 2)

const appVersion = inject('appVersion')
const sidebarLayoutRef = inject<Ref>(sidebarLayoutKey)

const tapCount = ref(0)
const SETTINGS_STATE_RESET_KEY = 'resetSettingsView'
const SETTINGS_STATE_FORCE_RESET_KEY = 'forceResetSettingsView'
const SETTINGS_PATH_PREFIX = '/options'
const SETTINGS_ROUTE_PATHS = ['/votes']
const activeSettingsScrollPath = ref(route.path)
const isRestoringSettingsScroll = ref(false)
const isLoggingOut = ref(false)
let settingsRestoreFrame = 0
let settingsRestoreObserver: ResizeObserver | null = null

const isSettingsPath = (path: string) => {
  return path.startsWith(SETTINGS_PATH_PREFIX) || SETTINGS_ROUTE_PATHS.includes(path)
}
const getCurrentScrollTop = () => sidebarLayoutRef?.value?.scrollTop || 0
const applySettingsScrollTop = (top: number) => {
  if (!sidebarLayoutRef?.value) {
    return
  }

  sidebarLayoutRef.value.scrollTop = top
  sidebarLayoutRef.value.scrollTo({ top })
}
const shouldResetSettingsViewState = (path: string) => {
  if (window.history.state?.[SETTINGS_STATE_FORCE_RESET_KEY]) {
    return true
  }

  if (!window.history.state?.[SETTINGS_STATE_RESET_KEY]) {
    return false
  }

  return store.getters['options/settingsScrollPosition'](path) <= 0
}
const stopSettingsRestore = () => {
  if (settingsRestoreFrame) {
    window.cancelAnimationFrame(settingsRestoreFrame)
    settingsRestoreFrame = 0
  }

  settingsRestoreObserver?.disconnect()
  settingsRestoreObserver = null
}
const waitForSettingsViewFrame = async () => {
  await nextTick()
  await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))
}
const onSidebarScroll = () => {
  if (isRestoringSettingsScroll.value || isLoggingOut.value) {
    return
  }

  saveSettingsViewState(activeSettingsScrollPath.value)
}

const saveSettingsViewState = (path = route.path) => {
  if (!isSettingsPath(path) || !sidebarLayoutRef?.value) {
    return
  }

  store.commit('options/setSettingsLastRoute', path)
  store.commit('options/setSettingsScrollPosition', {
    path,
    top: getCurrentScrollTop()
  })
}

const restoreSettingsViewState = async (path = route.path) => {
  if (!isSettingsPath(path) || !sidebarLayoutRef?.value) {
    return
  }

  stopSettingsRestore()
  isRestoringSettingsScroll.value = true
  await waitForSettingsViewFrame()

  const shouldReset = shouldResetSettingsViewState(path)
  const top = shouldReset ? 0 : store.getters['options/settingsScrollPosition'](path)

  applySettingsScrollTop(top)
  await waitForSettingsViewFrame()
  applySettingsScrollTop(top)

  const finalizeRestore = (restoredTop: number) => {
    stopSettingsRestore()
    activeSettingsScrollPath.value = path
    store.commit('options/setSettingsScrollPosition', {
      path,
      top: restoredTop
    })

    store.commit('options/setSettingsLastRoute', path)
    isRestoringSettingsScroll.value = false
  }

  if (shouldReset || top <= 0) {
    finalizeRestore(0)
    return
  }

  const restoreDeadline = window.performance.now() + 1500
  let stableFrames = 0
  let lastTop = -1

  const continueRestore = () => {
    if (!sidebarLayoutRef?.value || route.path !== path) {
      stopSettingsRestore()
      isRestoringSettingsScroll.value = false
      return
    }

    applySettingsScrollTop(top)

    const currentTop = getCurrentScrollTop()
    const canReachTop =
      sidebarLayoutRef.value.scrollHeight - sidebarLayoutRef.value.clientHeight >= top - 1
    const reachedTop = Math.abs(currentTop - top) <= 1 && canReachTop

    if (reachedTop) {
      stableFrames = currentTop === lastTop ? stableFrames + 1 : 1
      lastTop = currentTop

      if (stableFrames >= 2) {
        finalizeRestore(currentTop)
        return
      }
    } else {
      stableFrames = 0
      lastTop = currentTop
    }

    if (window.performance.now() >= restoreDeadline) {
      finalizeRestore(currentTop)
      return
    }

    settingsRestoreFrame = window.requestAnimationFrame(continueRestore)
  }

  settingsRestoreObserver = new ResizeObserver(() => {
    applySettingsScrollTop(top)
  })
  settingsRestoreObserver.observe(sidebarLayoutRef.value)
  settingsRestoreFrame = window.requestAnimationFrame(continueRestore)
}

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

    theme.change(isDarkTheme ? 'dark' : 'light')
  }
})

const isLoginViaPassword = computed(() => store.getters['options/isLoginViaPassword'])

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
        store.dispatch('snackbar/show', {
          message: t('options.idb_not_supported'),
          timeout: 5000
        })
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
  isLoggingOut.value = true
  resetPinia()
  store.dispatch('stopInterval')
  store.dispatch('logout')

  if (isLoginViaPassword.value) {
    return clearDb()
      .catch((err) => {
        logger.log('options', 'warn', err)
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

const navigateToSettingsChild = (path: string) => {
  saveSettingsViewState(route.path)

  const savedTop = store.getters['options/settingsScrollPosition'](path)

  router.push({
    path,
    state: {
      resetSettingsView: savedTop <= 0
    }
  })
}

onMounted(() => {
  sidebarLayoutRef?.value?.addEventListener('scroll', onSidebarScroll, { passive: true })
  restoreSettingsViewState()
})

onBeforeUnmount(() => {
  stopSettingsRestore()
  sidebarLayoutRef?.value?.removeEventListener('scroll', onSidebarScroll)

  if (!isRestoringSettingsScroll.value && !isLoggingOut.value) {
    saveSettingsViewState(activeSettingsScrollPath.value)
  }
})

watch(
  () => route.path,
  async (nextPath) => {
    await restoreSettingsViewState(nextPath)
  }
)
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/components/_text-content.scss' as textContent;
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

.settings-view {
  --a-settings-gutter: var(--a-space-6);
  --a-settings-title-padding-top: var(--a-space-4);
  --a-settings-title-margin-top-first: var(--a-space-6);
  --a-settings-title-margin-top-section: var(--a-space-6);
  --a-settings-title-margin-bottom-first: var(--a-space-4);
  --a-settings-title-margin-bottom-section: var(--a-space-6);
  --a-settings-actions-row-min-height: var(--a-list-row-min-height);
  --a-settings-actions-row-padding-block: var(--a-list-row-padding-block);
  --a-settings-logout-margin-top: var(--a-space-4);
  --a-settings-option-offset: var(--a-space-6);
  --a-settings-version-info-hover-opacity: var(--a-opacity-interactive-hover);
  --a-settings-version-info-active-opacity: var(--a-opacity-interactive-pressed);

  &__title {
    @include mixins.a-text-caption();
    padding-top: var(--a-settings-title-padding-top);
    margin-top: 0;
    margin-left: calc(var(--a-settings-gutter) * -1);
    margin-right: calc(var(--a-settings-gutter) * -1);
    padding-left: var(--a-settings-gutter);
    padding-right: var(--a-settings-gutter);
  }

  &__title--first {
    margin-top: var(--a-settings-title-margin-top-first);
    margin-bottom: var(--a-settings-title-margin-bottom-first);
  }

  &__title--section {
    margin-top: var(--a-settings-title-margin-top-section);
    margin-bottom: var(--a-settings-title-margin-bottom-section);
  }

  &__control-col {
    text-align: end;
  }

  &__security-block {
    @include mixins.a-text-regular-enlarged();
  }

  &__explanation {
    @include textContent.a-content-explanatory-copy();
  }

  &__option-offset {
    margin-top: var(--a-settings-option-offset);
  }

  &__version_info {
    @include mixins.a-text-explanation();
    margin-left: auto;
    margin-top: var(--a-space-6);
    margin-bottom: var(--a-space-4);
    padding: 0;
    border: 0;
    background: transparent;
    user-select: none;

    &:hover {
      opacity: var(--a-settings-version-info-hover-opacity);
    }

    &:active {
      opacity: var(--a-settings-version-info-active-opacity);
    }
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
    margin-left: calc(var(--a-settings-gutter) * -1);
    margin-right: calc(var(--a-settings-gutter) * -1);

    :deep(.v-list-item) {
      padding-inline-start: var(--a-settings-gutter);
      padding-inline-end: var(--a-settings-gutter);
    }

    :deep(.v-list-item--density-default.v-list-item--one-line) {
      min-height: var(--a-settings-actions-row-min-height);
      padding-top: var(--a-settings-actions-row-padding-block);
      padding-bottom: var(--a-settings-actions-row-padding-block);
    }
  }
  :deep(.v-list-subheader) {
    height: var(--a-control-size-lg);
  }
  :deep(.v-checkbox) {
    margin-left: calc(var(--a-space-2) * -1);
  }

  &__logout {
    margin-top: var(--a-settings-logout-margin-top);
  }
}

/** Themes **/
.v-theme--light {
  .settings-view {
    &__version_info {
      color: var(--a-color-text-muted-light);
    }
    &__title {
      background-color: var(--a-color-surface-soft-light);
      color: map.get(colors.$adm-colors, 'regular');
    }
    :deep(.a-switcher-button),
    :deep(.a-switcher-button .v-icon),
    :deep(.v-label),
    &__label {
      color: map.get(colors.$adm-colors, 'regular');
    }
    .v-divider {
      border-color: var(--a-color-border-soft-light);
    }
  }
}
.v-theme--dark {
  .settings-view {
    &__explanation {
      color: var(--a-color-text-muted-dark);
    }

    :deep(.a-switcher-button),
    :deep(.a-switcher-button .v-icon),
    &__label {
      color: map.get(settings.$shades, 'white');
    }

    .actions-list {
      :deep(.v-list-item-title) {
        color: map.get(settings.$shades, 'white');
      }
    }
  }
}
</style>
