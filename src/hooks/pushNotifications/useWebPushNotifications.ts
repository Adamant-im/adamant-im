import { SW_SECURE_COMMANDS } from '@/lib/constants'
import { ref, onBeforeUnmount } from 'vue'

export interface WebNotificationSettings {
  type: number
  privateKey?: string
  currentUserAddress?: string
}

export function useWebPushNotifications() {
  const port = ref<MessagePort | null>(null)
  const isSecureChannelReady = ref(false)

  const generateNonce = () => Math.random().toString(36).substring(2, 15)

  /**
   * Gets reference to pushService (always WebPushService on web)
   */
  const getPushService = async () => {
    const { pushService } = await import('@/lib/notifications/pushServiceFactory')
    return pushService
  }

  /**
   * Initializes secure MessageChannel with Service Worker
   */
  const initSecureChannel = async () => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      console.warn('[Web Push] Service Worker controller not found')
      return
    }

    const channel = new MessageChannel()
    const port1 = channel.port1
    const port2 = channel.port2

    port1.onmessage = (event) => {
      if (event.data?.type === SW_SECURE_COMMANDS.CONFIRM_CHANNEL) {
        isSecureChannelReady.value = true
        port.value = port1
      }
    }

    navigator.serviceWorker.controller.postMessage(
      { type: SW_SECURE_COMMANDS.INIT_SECURE_CHANNEL },
      [port2]
    )
  }

  /**
   * Sends a secure message through the established port
   */
  const sendSecureMessage = (type: string, payload?: any): boolean => {
    if (!port.value || !isSecureChannelReady.value) {
      console.warn('[Web Push] Cannot send message: channel not ready')
      return false
    }

    try {
      port.value.postMessage({
        type,
        payload,
        timestamp: Date.now(),
        nonce: generateNonce()
      })
      return true
    } catch (error) {
      console.error('[Web Push] Failed to send secure message:', error)
      return false
    }
  }

  /**
   * Sets private key both in Service Worker and PushService
   */
  const setPrivateKey = async (privateKey: string): Promise<boolean> => {
    const swResult = sendSecureMessage(SW_SECURE_COMMANDS.SET_PRIVATE_KEY, { privateKey })

    const pushService = await getPushService()
    if (pushService) {
      pushService.setPrivateKey(privateKey)
    }

    return swResult
  }

  /**
   * Clears private key from both Service Worker and PushService
   */
  const clearPrivateKey = async (): Promise<boolean> => {
    const swResult = sendSecureMessage(SW_SECURE_COMMANDS.CLEAR_PRIVATE_KEY)

    const pushService = await getPushService()
    if (pushService) {
      pushService.clearPrivateKey()
    }

    return swResult
  }

  /**
   * Syncs notification settings with Service Worker
   */
  const syncNotificationSettings = (settings: WebNotificationSettings): boolean => {
    return sendSecureMessage(SW_SECURE_COMMANDS.SYNC_SETTINGS, {
      type: settings.type,
      currentUserAddress: settings.currentUserAddress
    })
  }

  /**
   * Implementation for MessagePort doesn't support global onmessage easily.
   * Usually, SW sends messages back to the port it received.
   */
  const setMessageHandler = (handler: (event: MessageEvent) => void): boolean => {
    if (!port.value) return false
    port.value.onmessage = (event) => {
      // If SW sends a CONFIRM, we handle it internally, otherwise pass to handler
      if (event.data?.type === SW_SECURE_COMMANDS.CONFIRM_CHANNEL) {
        isSecureChannelReady.value = true
      } else {
        handler(event)
      }
    }
    return true
  }

  onBeforeUnmount(() => {
    if (port.value) {
      port.value.close()
      port.value = null
    }
  })

  return {
    isSupported: 'MessageChannel' in window,
    isSecureChannelReady,
    initSecureChannel,
    setPrivateKey,
    clearPrivateKey,
    syncNotificationSettings,
    setMessageHandler
  }
}
