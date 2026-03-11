import { SW_SECURE_COMMANDS } from '@/lib/constants'
import { ref, watch } from 'vue'

export interface WebNotificationSettings {
  type: number
  privateKey?: string
  currentUserAddress?: string
  encryptionPassword?: string
}

const port = ref<MessagePort | null>(null)
const isSecureChannelReady = ref(false)
const messageQueue: Array<{ type: string; payload?: any }> = []
const isSyncing = ref(false)

export function useWebPushNotifications() {
  const generateNonce = () => Math.random().toString(36).substring(2, 15)

  const flushMessageQueue = () => {
    if (!port.value || !isSecureChannelReady.value || isSyncing.value) return

    isSyncing.value = true
    while (messageQueue.length > 0) {
      const msg = messageQueue.shift()
      if (msg) {
        try {
          port.value.postMessage({
            type: msg.type,
            payload: msg.payload,
            timestamp: Date.now(),
            nonce: generateNonce()
          })
        } catch (error) {
          console.error('[Web Push] Failed to send queued message:', error)
          messageQueue.unshift(msg) // Put back on failure
          break
        }
      }
    }
    isSyncing.value = false
  }

  const queueMessage = (type: string, payload?: any) => {
    messageQueue.push({ type, payload })
    flushMessageQueue()
  }

  const initSecureChannel = async () => {
    if (!('serviceWorker' in navigator)) return

    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      const firebaseReg = registrations.find((reg) => reg.scope.includes('/firebase/'))

      if (!firebaseReg) {
        console.warn('[Web Push] Firebase Service Worker registration not found')
        return
      }

      const worker = firebaseReg.active || firebaseReg.waiting || firebaseReg.installing
      if (!worker) return

      const channel = new MessageChannel()
      const port1 = channel.port1
      const port2 = channel.port2

      port1.onmessage = (event) => {
        if (event.data?.type === SW_SECURE_COMMANDS.CONFIRM_CHANNEL) {
          isSecureChannelReady.value = true
          port.value = port1
          port1.start()
          flushMessageQueue()
        } else if (event.data?.type === 'STATE_SYNC') {
          console.log('[Web Push] State synced from SW:', event.data.payload)
        }
      }

      worker.postMessage({ type: SW_SECURE_COMMANDS.INIT_SECURE_CHANNEL }, [port2])

      // Re-establish channel on SW update
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[Web Push] Service Worker changed, re-initializing channel')
        isSecureChannelReady.value = false
        port.value = null
        setTimeout(() => initSecureChannel(), 500)
      })
    } catch (error) {
      console.error('[Web Push] Failed to initialize secure channel:', error)
    }
  }

  const sendSecureMessage = (type: string, payload?: any): boolean => {
    if (!isSecureChannelReady.value) {
      queueMessage(type, payload)
      return true // Queued successfully
    }

    try {
      if (port.value) {
        port.value.postMessage({
          type,
          payload,
          timestamp: Date.now(),
          nonce: generateNonce()
        })
        return true
      }
      return false
    } catch (error) {
      console.error('[Web Push] Failed to send secure message:', error)
      queueMessage(type, payload)
      return true
    }
  }

  const setPrivateKey = async (privateKey: string): Promise<boolean> => {
    const result = sendSecureMessage(SW_SECURE_COMMANDS.SET_PRIVATE_KEY, { privateKey })
    try {
      const { pushService } = await import('@/lib/notifications/pushServiceFactory')
      if (pushService) pushService.setPrivateKey(privateKey)
    } catch (e) {
      console.warn('Client push service not available', e)
    }
    return result
  }

  const clearPrivateKey = async (): Promise<boolean> => {
    const result = sendSecureMessage(SW_SECURE_COMMANDS.CLEAR_PRIVATE_KEY)
    try {
      const { pushService } = await import('@/lib/notifications/pushServiceFactory')
      if (pushService) pushService.clearPrivateKey()
    } catch (e) {
      console.warn('Client push service not available', e)
    }
    return result
  }

  const syncNotificationSettings = (settings: WebNotificationSettings): boolean => {
    return sendSecureMessage(SW_SECURE_COMMANDS.SYNC_SETTINGS, {
      type: settings.type,
      currentUserAddress: settings.currentUserAddress
    })
  }

  // Watch for channel readiness and flush queue
  watch(isSecureChannelReady, (ready) => {
    if (ready) {
      flushMessageQueue()
    }
  })

  return {
    isSupported: 'MessageChannel' in window,
    isSecureChannelReady,
    initSecureChannel,
    setPrivateKey,
    clearPrivateKey,
    syncNotificationSettings
  }
}
