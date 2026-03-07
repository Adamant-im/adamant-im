import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { Capacitor } from '@capacitor/core'
import { NotificationType, PUSH_REGISTRATION_RETRY_DELAY } from '@/lib/constants'
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
  const currentNotificationType = store.state.options.allowNotificationType
  const isPushNotification = computed(() => {
    return currentNotificationType === NotificationType['Push']
  })

  /**
   * Sends current settings to Service Worker
   */
  const sendCurrentSettings = async () => {
    const privateKey = store.state.passphrase ? await getPrivateKey() : undefined
    const currentUserAddress = store.state.address

    const settings = {
      type: currentNotificationType,
      privateKey: privateKey || undefined,
      currentUserAddress
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

        await new Promise((resolve) => setTimeout(resolve, PUSH_REGISTRATION_RETRY_DELAY))
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

    const { pushService } = await import('@/lib/notifications/pushServiceFactory')

    pushService.setPrivateKey(privateKey)
    await pushService.initialize()
    await pushService.registerDevice()

    syncNotificationSettings(currentNotificationType)
    await sendPrivateKey()
  }

  /**
   * Sets up watchers for automatic registration and settings sync
   */
  const setupWatchers = () => {
    if (webPush) {
      watch(
        () => webPush.isSecureChannelReady.value,
        async (isReady) => {
          if (isReady) {
            await sendCurrentSettings()
          }
        }
      )
    }

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
      async (newType) => {
        syncNotificationSettings(newType)

        if (newType == NotificationType['Push']) {
          await sendPrivateKey()
        } else {
          await clearPrivateKey()
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
  const initialize = async () => {
    if (webPush && !webPush?.isSecureChannelReady.value) {
      await webPush.initSecureChannel()
    }
    setupWatchers()
  }

  onMounted(initialize)
}
