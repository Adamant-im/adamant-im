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
        <div :class="`${className}__version_info ml-auto`">
          {{ t('options.version') }} {{ appVersion }}
        </div>
      </v-row>
    </template>
  </navigation-wrapper>
</template>

<script setup lang="ts">
import { nextTick, inject, computed, onBeforeUnmount, onMounted, Ref } from 'vue'
import { mdiChevronRight, mdiChevronDown, mdiLogoutVariant } from '@mdi/js'
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
import { sidebarLayoutKey } from '@/lib/constants'
import { useChatStateStore } from '@/stores/modal-state'

const store = useStore()
const chatStateStore = useChatStateStore()
const router = useRouter()
const { t } = useI18n()
const theme = useTheme()

const className = 'settings-view'

const { hasView } = useSavedScroll()

const appVersion = inject('appVersion')
const sidebarLayoutRef = inject<Ref>(sidebarLayoutKey)

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

const isLoginViaPassword = computed(() => store.getters['options/isLoginViaPassword'])

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
  resetPinia()
  store.dispatch('stopInterval')
  store.dispatch('logout')

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

onMounted(() => {
  nextTick(() => {
    if (sidebarLayoutRef && scrollTopPosition) {
      sidebarLayoutRef.value.scrollTo({
        top: scrollTopPosition
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
