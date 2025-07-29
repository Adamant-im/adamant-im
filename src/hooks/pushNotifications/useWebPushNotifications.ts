import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

export interface WebNotificationSettings {
  type: number
  privateKey?: string
}

/**
 * Web-specific composable for managing push notifications
 * Handles only BroadcastChannel communication with Service Worker
 */
export function useWebPushNotifications() {
  const channel = ref<BroadcastChannel | null>(null)
  const isSupported = typeof BroadcastChannel !== 'undefined'

  const isActive = computed(() => channel.value !== null)
  /**
   * Creates BroadcastChannel connection
   */
  const setupChannel = () => {
    if (!isSupported) return

    try {
      channel.value = new BroadcastChannel('adm_notifications')
    } catch (error) {
      console.error('[Web Push] Failed to create BroadcastChannel:', error)
    }
  }

  /**
   * Sends private key to Service Worker
   */
  const sendPrivateKey = (privateKey: string): boolean => {
    if (!channel.value || !privateKey) {
      return false
    }

    try {
      channel.value.postMessage({ privateKey })
      return true
    } catch (error) {
      console.error('[Web Push] Failed to send private key:', error)
      return false
    }
  }

  /**
   * Clears private key from Service Worker
   */
  const clearPrivateKey = (): boolean => {
    if (!channel.value) {
      return false
    }

    try {
      channel.value.postMessage({ clearPrivateKey: true })
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
    if (!channel.value) {
      return false
    }

    try {
      // Send notification type
      channel.value.postMessage({
        notificationType: settings.type
      })

      // If push notifications and private key exists - send it
      if (settings.privateKey) {
        sendPrivateKey(settings.privateKey)
      }

      return true
    } catch (error) {
      console.error('[Web Push] Failed to sync settings:', error)
      return false
    }
  }

  /**
   * Sets message handler for incoming messages from Service Worker
   */
  const setMessageHandler = (handler: (event: MessageEvent) => void): boolean => {
    if (!channel.value) {
      return false
    }

    try {
      channel.value.onmessage = handler
      return true
    } catch (error) {
      console.error('[Web Push] Failed to set message handler:', error)
      return false
    }
  }

  onMounted(() => {
    setupChannel()
  })

  onBeforeUnmount(() => {
    if (channel.value) {
      channel.value.close()
      channel.value = null
    }
  })

  return {
    isActive,
    sendPrivateKey,
    clearPrivateKey,
    syncNotificationSettings,
    setMessageHandler
  }
}
