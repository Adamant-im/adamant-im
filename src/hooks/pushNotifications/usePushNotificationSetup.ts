import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import { Capacitor } from '@capacitor/core'
import { NotificationType, PUSH_REGISTRATION_RETRY_DELAY } from '@/lib/constants'
import { usePrivateKeyManager } from './usePrivateKeyManager'
import { usePushEventHandlers } from './usePushEventHandlers'
import { useWebPushNotifications } from './useWebPushNotifications'

export function usePushNotificationSetup() {
  const store = useStore()
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

  const sendCurrentSettings = async () => {
    const privateKey = store.state.passphrase ? await getPrivateKey() : undefined
    const currentUserAddress = store.state.address

    const settings = {
      type: currentNotificationType,
      privateKey: privateKey || undefined,
      currentUserAddress
    }

    if (webPush) {
      console.log('[PushSetup] Sending current settings to SW')
      webPush.syncNotificationSettings(settings)
      if (privateKey) {
        await sendPrivateKey()
      }
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
          return
        }
        await new Promise((resolve) => setTimeout(resolve, PUSH_REGISTRATION_RETRY_DELAY))
      }
    }
  }

  const registerPushNotificationsOnLogin = async () => {
    if (!isPushNotification.value) return

    const privateKey = await getPrivateKey()
    if (!privateKey) {
      console.warn('[PushSetup] Cannot register: no private key')
      return
    }

    const { pushService } = await import('@/lib/notifications/pushServiceFactory')
    pushService.setPrivateKey(privateKey)

    await pushService.initialize()
    await pushService.registerDevice()

    syncNotificationSettings(currentNotificationType)
    await sendPrivateKey()
  }

  const setupWatchers = () => {
    if (webPush) {
      // Sync when channel becomes ready
      watch(
        () => webPush.isSecureChannelReady.value,
        async (isReady) => {
          if (isReady && store.state.passphrase) {
            console.log('[PushSetup] Channel ready, syncing state')
            await sendCurrentSettings()
          }
        }
      )
    }

    // Login: send key
    watch(
      () => store.state.passphrase,
      async (encodedPassphrase, oldPassphrase) => {
        if (encodedPassphrase && !oldPassphrase) {
          if (store.state.options.allowNotificationType === NotificationType['Push']) {
            console.log('[PushSetup] User logged in, registering for Push')
            await sendCurrentSettings()
            await registerWithRetry()
          }
        }
      }
    )

    // Notification type change
    watch(
      () => store.state.options.allowNotificationType,
      async (newType) => {
        console.log('[PushSetup] Notification type changed:', newType)
        syncNotificationSettings(newType)
        if (newType === NotificationType['Push']) {
          await sendPrivateKey()
        } else {
          await clearPrivateKey()
        }
      }
    )

    // Logout: clear key
    watch(
      () => store.state.passphrase,
      async (newPassphrase, oldPassphrase) => {
        if (!newPassphrase && oldPassphrase) {
          console.log('[PushSetup] User logged out')
          await clearPrivateKey()
        }
      }
    )

    // Address change (account switch)
    watch(
      () => store.state.address,
      async (newAddress) => {
        if (newAddress) {
          await sendCurrentSettings()
        }
      }
    )
  }

  const initialize = async () => {
    if (webPush && !webPush.isSecureChannelReady.value) {
      console.log('[PushSetup] Initializing secure channel')
      await webPush.initSecureChannel()
    }
    setupWatchers()
  }

  onMounted(initialize)
}
