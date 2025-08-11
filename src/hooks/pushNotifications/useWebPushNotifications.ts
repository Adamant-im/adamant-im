import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

export interface WebNotificationSettings {
  type: number
  privateKey?: string
}

export function useWebPushNotifications() {
  const channel = ref<BroadcastChannel | null>(null)
  const isSupported = computed(() => typeof BroadcastChannel !== 'undefined')

  /**
   * Closes the broadcast channel in case of error for preventing memory leaks
   */
  const safeCloseChannel = () => {
    if (channel.value) {
      try {
        channel.value.close()
      } catch (error) {
        console.warn('[Web Push] Error closing BroadcastChannel:', error)
      } finally {
        channel.value = null
      }
    }
  }

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
      channel.value = null
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
      safeCloseChannel()
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
      safeCloseChannel()
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
      safeCloseChannel()
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
      safeCloseChannel()
      return false
    }
  }

  onMounted(setupChannel)

  onBeforeUnmount(safeCloseChannel)

  return {
    isSupported,
    setPrivateKey,
    clearPrivateKey,
    syncNotificationSettings,
    setMessageHandler,
    getPushService
  }
}
