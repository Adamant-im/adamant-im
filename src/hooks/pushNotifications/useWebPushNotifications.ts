import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

export interface WebNotificationSettings {
  type: number
  privateKey?: string
}

export function useWebPushNotifications() {
  const channel = ref<BroadcastChannel | null>(null)
  const isSupported = computed(() => typeof BroadcastChannel !== 'undefined')

  /**
   * Gets reference to pushService (always WebPushService on web)
   */
  const getPushService = async () => {
    if (!isSupported.value) return null

    const { pushService } = await import('@/lib/notifications/pushServiceFactory')
    return pushService
  }

  /**
   * Creates BroadcastChannel for Service Worker communication
   */
  const setupChannel = () => {
    if (!isSupported.value) return

    try {
      channel.value = new BroadcastChannel('adm_notifications')
    } catch (error) {
      console.error('[Web Push] Failed to create BroadcastChannel:', error)
    }
  }

  /**
   * Sends private key to Service Worker via BroadcastChannel
   */
  const sendPrivateKeyToSW = (privateKey: string): boolean => {
    if (!channel.value) return false

    try {
      channel.value.postMessage({ privateKey })
      return true
    } catch (error) {
      console.error('[Web Push] Failed to send private key to SW:', error)
      return false
    }
  }

  /**
   * Sets private key both in Service Worker and PushService
   */
  const setPrivateKey = async (privateKey: string): Promise<boolean> => {
    if (!isSupported.value) return false

    // Send to Service Worker
    const swResult = sendPrivateKeyToSW(privateKey)

    // Send to PushService
    const service = await getPushService()
    if (service) {
      service.setPrivateKey(privateKey)
    }

    return swResult
  }

  /**
   * Clears private key from both Service Worker and PushService
   */
  const clearPrivateKey = async (): Promise<boolean> => {
    if (!channel.value) return false

    try {
      // Clear from Service Worker
      channel.value.postMessage({ clearPrivateKey: true })

      // Clear from PushService
      const service = await getPushService()
      if (service) {
        service.setPrivateKey('')
      }

      return true
    } catch (error) {
      console.error('[Web Push] Failed to clear private key:', error)
      return false
    }
  }

  /**
   * Syncs notification settings with Service Worker
   */
  const syncNotificationSettings = (settings: WebNotificationSettings): boolean => {
    if (!channel.value) return false

    try {
      channel.value.postMessage({
        notificationType: settings.type
      })

      if (settings.privateKey) {
        sendPrivateKeyToSW(settings.privateKey)
      }

      return true
    } catch (error) {
      console.error('[Web Push] Failed to sync settings:', error)
      return false
    }
  }

  /**
   * Sets message handler for Service Worker communication
   */
  const setMessageHandler = (handler: (event: MessageEvent) => void): boolean => {
    if (!channel.value) return false

    try {
      channel.value.onmessage = handler
      return true
    } catch (error) {
      console.error('[Web Push] Failed to set message handler:', error)
      return false
    }
  }

  onMounted(setupChannel)

  onBeforeUnmount(() => {
    if (channel.value) {
      channel.value.close()
      channel.value = null
    }
  })

  return {
    isSupported,
    setPrivateKey,
    clearPrivateKey,
    syncNotificationSettings,
    setMessageHandler,
    getPushService
  }
}
