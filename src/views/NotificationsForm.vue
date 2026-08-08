<template>
  <div :class="className">
    <v-row align="center" gap="0">
      <!-- Sound -->
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

      <!-- Push type -->
      <v-col cols="12" class="mt-6">
        <v-row no-gutters class="my-0">
          <v-col cols="6" class="d-flex align-center">
            <div>{{ t('options.notification_title') }}</div>
            <v-tooltip
              :text="t('options.notifications_info')"
              location="end"
              :max-width="520"
              :class="`${className}__info-tooltip`"
            >
              <template #activator="{ props }">
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
            >
              <template #item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps" :disabled="item.disabled" />
              </template>
            </v-select>
          </v-col>
        </v-row>
        <div class="a-text-explanation-enlarged">
          {{ t('options.enable_push_tooltip') }}
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { Capacitor } from '@capacitor/core'
import { mdiInformation } from '@mdi/js'
import { NotificationType } from '@/lib/constants'
import { pushService } from '@/lib/notifications/pushServiceFactory'

const store = useStore()
const { t } = useI18n()

const className = 'notifications-form'
const isAndroid = Capacitor.getPlatform() === 'android'
const isNotificationRegistering = ref(false)
const lastSuccessfulNotificationType = ref(store.state.options.allowNotificationType)

const stayLoggedIn = computed(() => store.state.options.stayLoggedIn)

const notificationItems = computed(() => [
  {
    title: t('options.no_notifications'),
    value: NotificationType['NoNotifications'],
    disabled: false
  },
  {
    title: 'Background Fetch',
    value: NotificationType['BackgroundFetch'],
    disabled: isAndroid
  },
  {
    title: stayLoggedIn.value ? 'Push' : `Push (${t('options.push_stay_logged_in_only')})`,
    value: NotificationType['Push'],
    disabled: !stayLoggedIn.value
  }
])

const allowSoundNotifications = computed({
  get() {
    return store.state.options.allowSoundNotifications
  },
  set(value) {
    store.commit('options/updateOption', { key: 'allowSoundNotifications', value })
  }
})

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
    store.dispatch('snackbar/show', { message: t('options.push_subscribe_success') })
  } else {
    await pushService.unregisterDevice()
    store.dispatch('snackbar/show', { message: t('options.push_unsubscribe_success') })
  }
}

const handleNotificationTypeChange = async (newVal: number): Promise<void> => {
  const oldVal = store.state.options.allowNotificationType
  if (newVal === oldVal) {
    return
  }

  isNotificationRegistering.value = true

  try {
    const isNotPushNotification =
      newVal === NotificationType['NoNotifications'] ||
      newVal === NotificationType['BackgroundFetch']

    if (newVal === NotificationType['Push']) {
      await setPushNotifications(true)
    } else if (isNotPushNotification && oldVal === NotificationType['Push']) {
      await setPushNotifications(false)
    }

    store.commit('options/updateOption', { key: 'allowNotificationType', value: newVal })

    if (isAndroid) {
      try {
        const { Preferences } = await import('@capacitor/preferences')
        await Preferences.set({ key: 'allowNotificationType', value: newVal.toString() })
      } catch (error) {
        console.error('[Notifications] Failed to sync with Android:', error)
      }
    }

    lastSuccessfulNotificationType.value = newVal
  } catch (error) {
    store.dispatch('snackbar/show', {
      message: error instanceof Error ? error.message : t('options.push_register_error')
    })
    // Revert to last successful value
    store.commit('options/updateOption', {
      key: 'allowNotificationType',
      value: lastSuccessfulNotificationType.value
    })
  } finally {
    isNotificationRegistering.value = false
  }
}

const allowNotificationType = computed({
  get() {
    return store.state.options.allowNotificationType
  },
  set(value) {
    handleNotificationTypeChange(value)
  }
})

// Disable Push automatically if stayLoggedIn is turned off
watch(stayLoggedIn, async (isStaying) => {
  if (!isStaying && allowNotificationType.value === NotificationType['Push']) {
    await handleNotificationTypeChange(NotificationType['NoNotifications'])
  }
})
</script>

<style lang="scss" scoped>
.notifications-form {
  padding: 16px 0;

  &__info-tooltip {
    margin-left: 4px;
  }
}
</style>
