import { ref, computed, watch, onMounted, onBeforeUnmount, readonly } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { notificationType } from '@/lib/constants'
import { registerServiceWorker } from '@/notifications'

export function usePushNotificationSetup() {
  const store = useStore()
  const { t } = useI18n()
  const router = useRouter()

  const broadcastChannel = ref<BroadcastChannel | null>(null)
  const registrationInProgress = ref(false)

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

  const sendPrivateKeyToFirebaseSW = async () => {
    const privateKey = await getPrivateKey()
    if (privateKey && broadcastChannel.value) {
      broadcastChannel.value.postMessage({ privateKey })
    }
  }

  const clearPrivateKeyFromSW = () => {
    if (broadcastChannel.value) {
      broadcastChannel.value.postMessage({ clearPrivateKey: true })
    }
  }

  const handleChannelMessage = (event: MessageEvent) => {
    const data = event.data

    if (data?.requestCurrentSettings) {
      sendCurrentSettings()
    }
  }

  const sendCurrentSettings = async () => {
    if (!broadcastChannel.value) return

    const currentNotificationType = store.state.options.allowNotificationType
    broadcastChannel.value.postMessage({ notificationType: currentNotificationType })

    if (currentNotificationType === notificationType['Push'] && store.state.passphrase) {
      await sendPrivateKeyToFirebaseSW()
    }
  }

  const syncPushSettings = (notificationType: number) => {
    if (broadcastChannel.value) {
      broadcastChannel.value.postMessage({ notificationType })
    }
  }

  const setupBroadcastChannel = () => {
    if (typeof BroadcastChannel === 'undefined') return

    broadcastChannel.value = new BroadcastChannel('adm_notifications')
    broadcastChannel.value.onmessage = handleChannelMessage

    // Timeout for wait sw initialization
    setTimeout(sendCurrentSettings, 1000)
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
      (newType, oldType) => {
        if (newType !== oldType) {
          syncPushSettings(newType)

          if (oldType === notificationType['Push'] && newType !== notificationType['Push']) {
            clearPrivateKeyFromSW()
          }
        }
      }
    )
  }

  const setupLogoutWatcher = () => {
    watch(
      () => store.state.passphrase,
      (newPassphrase, oldPassphrase) => {
        if (!newPassphrase && oldPassphrase) {
          clearPrivateKeyFromSW()
        }
      }
    )
  }

  const setupEventListeners = () => {
    window.addEventListener('openChat', handleOpenChat)
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage)
  }

  const removeEventListeners = () => {
    window.removeEventListener('openChat', handleOpenChat)
    navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage)
  }

  const cleanup = () => {
    removeEventListeners()
    clearPrivateKeyFromSW()

    if (broadcastChannel.value) {
      broadcastChannel.value.close()
      broadcastChannel.value = null
    }
  }

  const initialize = () => {
    setupBroadcastChannel()
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
    broadcastChannel: readonly(broadcastChannel)
  }
}
