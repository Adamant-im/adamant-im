import { ref, computed, watch, onMounted, onBeforeUnmount, readonly } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { notificationType } from '@/lib/constants'
import { registerServiceWorker } from '@/notifications'
import { useWebPushNotifications } from './useWebPushNotifications'
import { useAndroidPushNotifications } from './useAndroidPushNotifications'

export function usePushNotificationSetup() {
  const store = useStore()
  const { t } = useI18n()
  const router = useRouter()

  const platform = Capacitor.getPlatform()
  const registrationInProgress = ref(false)

  const webPush = platform === 'web' ? useWebPushNotifications() : null
  const androidPush = platform === 'android' ? useAndroidPushNotifications() : null

  const isPushNotification = computed(() => {
    return store.state.options.allowNotificationType === notificationType['Push']
  })

  const getPrivateKey = async (): Promise<string | null> => {
    try {
      return await store.dispatch('getPrivateKeyForPush')
    } catch (error) {
      console.error('Error getting private key:', error)
      return null
    }
  }

  const sendPrivateKeyToFirebaseSW = async (): Promise<boolean> => {
    const privateKey = await getPrivateKey()
    if (!privateKey) return false

    if (webPush) {
      return webPush.sendPrivateKey(privateKey)
    }
    if (androidPush) {
      return await androidPush.sendPrivateKey(privateKey)
    }

    return false
  }

  const clearPrivateKeyFromSW = async (): Promise<boolean> => {
    if (webPush) {
      return webPush.clearPrivateKey()
    }
    if (androidPush) {
      return await androidPush.clearPrivateKey()
    }

    return false
  }

  const handleChannelMessage = (event: MessageEvent) => {
    const data = event.data

    if (data?.requestCurrentSettings) {
      sendCurrentSettings()
    }
  }

  const sendCurrentSettings = async () => {
    const currentNotificationType = store.state.options.allowNotificationType
    const privateKey = store.state.passphrase ? await getPrivateKey() : undefined

    const settings = {
      type: currentNotificationType,
      privateKey: privateKey || undefined
    }

    if (webPush) {
      webPush.syncNotificationSettings(settings)
    }
    if (androidPush) {
      await androidPush.syncNotificationSettings(settings)
    }
  }

  const syncPushSettings = (notificationType: number) => {
    if (webPush) {
      webPush.syncNotificationSettings({ type: notificationType })
    }
    // Android settings are managed through pushService directly
  }

  const handleOpenChat = (event: Event) => {
    const detail = (event as CustomEvent).detail
    if (detail?.partnerId) {
      router.push({
        name: 'Chat',
        params: { partnerId: detail.partnerId }
      })
    }
  }

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    if (!event.data) return

    const { action, partnerId } = event.data

    if (action === 'OPEN_CHAT' && partnerId) {
      const currentRoute = router.currentRoute.value

      if (currentRoute.name !== 'Chat' || currentRoute.params.partnerId !== partnerId) {
        router.push({
          name: 'Chat',
          params: { partnerId }
        })
      }

      window.focus()
    }
  }

  const registerWithRetry = async (maxRetries = 2) => {
    if (registrationInProgress.value) return

    registrationInProgress.value = true

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await registerPushNotificationsOnLogin()
        registrationInProgress.value = false
        return
      } catch (error) {
        console.warn(`Push registration attempt ${attempt + 1} failed:`, error)

        if (attempt === maxRetries - 1) {
          registrationInProgress.value = false

          store.dispatch('snackbar/show', {
            message: t('options.push_register_retry_failed'),
            timeout: 5000
          })
          return
        }

        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }
  }

  const registerPushNotificationsOnLogin = async () => {
    if (!isPushNotification.value) return

    const privateKey = await getPrivateKey()
    if (!privateKey) return

    if (Capacitor.isNativePlatform()) {
      const { pushService } = await import('@/lib/notifications/pushServiceFactory')
      pushService.setPrivateKey(privateKey)
      await pushService.initialize()
      await pushService.registerDevice()
    } else {
      const { pushService } = await import('@/lib/notifications/pushServiceFactory')
      pushService.setPrivateKey(privateKey)
      await registerServiceWorker()
      await sendPrivateKeyToFirebaseSW()
    }
  }

  const setupAutoRegistration = () => {
    watch(
      () => store.state.passphrase,
      async (encodedPassphrase, oldPassphrase) => {
        if (encodedPassphrase && !oldPassphrase) {
          await registerWithRetry()
        }
      }
    )
  }

  const setupNotificationSettingsWatcher = () => {
    watch(
      () => store.state.options.allowNotificationType,
      async (newType, oldType) => {
        if (newType !== oldType) {
          syncPushSettings(newType)

          // If disabled push - clear key
          if (oldType === notificationType['Push'] && newType !== notificationType['Push']) {
            await clearPrivateKeyFromSW()
          }
        }
      }
    )
  }

  const setupLogoutWatcher = () => {
    watch(
      () => store.state.passphrase,
      async (newPassphrase, oldPassphrase) => {
        if (!newPassphrase && oldPassphrase) {
          await clearPrivateKeyFromSW()
        }
      }
    )
  }

  const syncNotificationSettings = (type: number) => {
    if (webPush) {
      webPush.syncNotificationSettings({ type })
    }
    if (androidPush) {
      androidPush.syncNotificationSettings({ type })
    }
  }

  const setupEventListeners = () => {
    window.addEventListener('openChat', handleOpenChat)
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage)
  }

  const removeEventListeners = () => {
    window.removeEventListener('openChat', handleOpenChat)
    navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage)
  }

  const cleanup = async () => {
    removeEventListeners()
    await clearPrivateKeyFromSW()
  }

  const initialize = () => {
    if (webPush) {
      webPush.setMessageHandler(handleChannelMessage)

      // Send initial settings with delay for SW initialization
      setTimeout(sendCurrentSettings, 1000)
    }
    setupEventListeners()
    setupAutoRegistration()
    setupNotificationSettingsWatcher()
    setupLogoutWatcher()
  }

  onMounted(initialize)
  onBeforeUnmount(cleanup)

  return {
    sendPrivateKeyToFirebaseSW,
    clearPrivateKeyFromSW,
    isPushNotification,
    registrationInProgress: readonly(registrationInProgress),
    syncNotificationSettings
  }
}
