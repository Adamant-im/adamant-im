import { ref, computed, watch, onMounted, readonly } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { Capacitor } from '@capacitor/core'
import { notificationType } from '@/lib/constants'
import { registerServiceWorker } from '@/notifications'
import { usePrivateKeyManager } from './usePrivateKeyManager'
import { usePushEventHandlers } from './usePushEventHandlers'
import { useWebPushNotifications } from './useWebPushNotifications'

export function usePushNotificationSetup() {
  const store = useStore()
  const { t } = useI18n()
  const platform = Capacitor.getPlatform()
  const registrationInProgress = ref(false)

  usePushEventHandlers()
  const { clearPrivateKey, getPrivateKey, sendPrivateKey, syncNotificationSettings } =
    usePrivateKeyManager()
  const webPush = platform === 'web' ? useWebPushNotifications() : null

  const isPushNotification = computed(() => {
    return store.state.options.allowNotificationType === notificationType['Push']
  })

  /**
   * Handles BroadcastChannel messages from Service Worker
   */
  const handleChannelMessage = (event: MessageEvent) => {
    const data = event.data

    if (data?.requestCurrentSettings) {
      sendCurrentSettings()
    }
  }

  /**
   * Sends current settings to Service Worker
   */
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
  }

  /**
   * Registers push notifications with retry logic
   */
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

  /**
   * Registers push notifications on login
   */
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
      await sendPrivateKey()
    }
  }

  /**
   * Sets up watchers for automatic registration and settings sync
   */
  const setupWatchers = () => {
    // Auto-register on login
    watch(
      () => store.state.passphrase,
      async (encodedPassphrase, oldPassphrase) => {
        if (encodedPassphrase && !oldPassphrase) {
          await registerWithRetry()
        }
      }
    )

    // Sync settings when notification type changes
    watch(
      () => store.state.options.allowNotificationType,
      async (newType, oldType) => {
        if (newType !== oldType) {
          syncNotificationSettings(newType)

          // Clear key if push disabled
          if (oldType === notificationType['Push'] && newType !== notificationType['Push']) {
            await clearPrivateKey()
          }
        }
      }
    )

    // Clear key on logout
    watch(
      () => store.state.passphrase,
      async (newPassphrase, oldPassphrase) => {
        if (!newPassphrase && oldPassphrase) {
          await clearPrivateKey()
        }
      }
    )
  }

  /**
   * Initialize the composable
   */
  const initialize = () => {
    if (webPush) {
      webPush.setMessageHandler(handleChannelMessage)
      // Send initial settings with delay for SW initialization
      setTimeout(sendCurrentSettings, 1000)
    }
    setupWatchers()
  }

  onMounted(initialize)

  return {
    sendPrivateKeyToFirebaseSW: sendPrivateKey,
    clearPrivateKeyFromSW: clearPrivateKey,
    isPushNotification,
    registrationInProgress: readonly(registrationInProgress),
    syncNotificationSettings: syncNotificationSettings
  }
}
