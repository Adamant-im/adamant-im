<template>
  <v-app :theme="themeName" class="application--linear-gradient">
    <UploadAttachmentExitPrompt />
    <warning-on-addresses-dialog v-model="showWarningOnAddressesDialog" />

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, getCurrentInstance, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import WarningOnAddressesDialog from '@/components/WarningOnAddressesDialog.vue'
import UploadAttachmentExitPrompt from '@/components/UploadAttachmentExitPrompt.vue'
import Notifications from '@/lib/notifications'
import { ThemeName } from './plugins/vuetify'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useResendPendingMessages } from '@/hooks/useResendPendingMessages'
import { useTrackConnection } from '@/hooks/useTrackConnection'
import { notificationType } from '@/lib/constants'
import { registerServiceWorker } from '@/notifications'
import { Capacitor } from '@capacitor/core'

useResendPendingMessages()
useTrackConnection()

const { t } = useI18n()

const router = useRouter()
const store = useStore()
const isSnackbarShowing = computed(() => store.state.snackbar.show)

const showWarningOnAddressesDialog = ref(false)

const notifications = ref<Notifications | null>(null)

const themeName = computed(() => {
  return store.state.options.darkTheme ? ThemeName.Dark : ThemeName.Light
})

const isPushNotification = computed(() => {
  return store.state.options.allowNotificationType === notificationType['Push']
})

const { locale } = useI18n()

onMounted(() => {
  const instance = getCurrentInstance()

  if (instance) {
    const notifications = new Notifications(instance.proxy)
    notifications.start()
  }

  window.addEventListener('keydown', onKeydownHandler, true)
  window.addEventListener('openChat', handleOpenChat)
  navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage)
})

onBeforeUnmount(() => {
  notifications.value?.stop()
  store.dispatch('stopInterval')

  window.removeEventListener('keydown', onKeydownHandler, true)
  window.removeEventListener('openChat', handleOpenChat)
  navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage)
})

const onKeydownHandler = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (isSnackbarShowing.value) {
      e.stopPropagation()
      store.commit('snackbar/changeState', false)
    }
  }
}

const setLocale = () => {
  // Set language from `localStorage`.
  //
  // This is required only when initializing the application.
  // Subsequent mutations of `language.currentLocale`
  // will be synchronized with `i18n.locale`.
  const localeFromStorage = store.state.language.currentLocale
  locale.value = localeFromStorage
  dayjs.locale(localeFromStorage)
}

const handleOpenChat = (event: Event) => {
  const detail = (event as CustomEvent).detail
  if (detail && detail.partnerId) {
    router.push({
      name: 'Chat',
      params: { partnerId: detail.partnerId }
    })
  }
}

const handleServiceWorkerMessage = (event: MessageEvent) => {
  if (!event.data) {
    return
  }
  const data = event.data

  if (data.action === 'OPEN_CHAT' && data.partnerId) {
    if (
      router.currentRoute.value.name !== 'Chat' ||
      router.currentRoute.value.params.partnerId !== data.partnerId
    ) {
      router.push({
        name: 'Chat',
        params: { partnerId: data.partnerId }
      })
    }

    window.focus()
  }
}

// auto register push notification when user authorizes and push notifications are enabled
watch(
  () => store.state.passphrase,
  async (encodedPassphrase, oldPassphrase) => {
    if (encodedPassphrase && !oldPassphrase && isPushNotification.value) {
      try {
        const privateKey = await store.dispatch('getPrivateKeyForPush')

        if (!privateKey) {
          return
        }

        if (Capacitor.isNativePlatform()) {
          const { pushService } = await import('@/lib/notifications/pushServiceFactory')
          pushService.setPrivateKey(privateKey)
          await pushService.initialize()
          await pushService.registerDevice()
        } else {
          const { pushService } = await import('@/lib/notifications/pushServiceFactory')
          pushService.setPrivateKey(privateKey)
          await registerServiceWorker()
        }
      } catch (error) {
        store.dispatch('snackbar/show', {
          message: typeof error === 'string' ? error : t('options.push_register_error'),
          timeout: 5000
        })
      }
    }
  }
)

setLocale()
</script>

<style lang="scss" scoped>
@use '@/assets/styles/themes/adamant/_mixins.scss';

.v-theme--light.application--linear-gradient {
  @include mixins.linear-gradient-light();
}
.v-theme--dark.application--linear-gradient {
  @include mixins.linear-gradient-dark();
}
</style>
