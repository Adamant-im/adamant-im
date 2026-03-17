import { SW_SECURE_COMMANDS } from '@/lib/constants'
import { ref } from 'vue'

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
let isConnecting = false
let listenersRegistered = false
let heartbeatIntervalId: ReturnType<typeof setInterval> | null = null
let waitingForPong = false

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
    if (isConnecting) return

    isConnecting = true
    isSecureChannelReady.value = false
    port.value = null

    try {
      let firebaseReg = null
      for (let i = 0; i < 10; i++) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        firebaseReg = registrations.find((reg) => reg.scope.includes('/firebase/'))
        if (firebaseReg) break
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      if (!firebaseReg) {
        console.warn('[Web Push] Firebase Service Worker registration not found')
        return
      }

      const worker = firebaseReg.active || firebaseReg.waiting || firebaseReg.installing
      if (!worker) return

      const channel = new MessageChannel()
      const port1 = channel.port1

      port1.onmessage = (event) => {
        if (event.data?.type === SW_SECURE_COMMANDS.CONFIRM_CHANNEL) {
          isSecureChannelReady.value = true
          port.value = port1
          port1.start()
          flushMessageQueue()
        } else if (event.data?.type === 'PONG') {
          waitingForPong = false
        } else if (event.data?.type === 'STATE_SYNC') {
          console.log('[Web Push] State synced from SW:', event.data.payload)
        }
      }

      worker.postMessage({ type: SW_SECURE_COMMANDS.INIT_SECURE_CHANNEL }, [channel.port2])
    } catch (error) {
      console.error('[Web Push] Failed to initialize secure channel:', error)
    } finally {
      isConnecting = false
    }
  }

  const setupSWListeners = () => {
    if (listenersRegistered) return
    listenersRegistered = true

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      setTimeout(() => initSecureChannel(), 500)
    })

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SW_RESTARTED') {
        initSecureChannel()
      }
    })
  }

  const sendSecureMessage = (type: string, payload?: any): boolean => {
    if (!isSecureChannelReady.value) {
      queueMessage(type, payload)
      return true
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

  const syncNotificationSettings = ({
    type,
    currentUserAddress,
    encryptionPassword
  }: WebNotificationSettings): boolean => {
    return sendSecureMessage(SW_SECURE_COMMANDS.SYNC_SETTINGS, {
      type,
      currentUserAddress,
      encryptionPassword
    })
  }

  const startHeartbeat = () => {
    if (heartbeatIntervalId) return

    heartbeatIntervalId = setInterval(() => {
      if (!port.value || !isSecureChannelReady.value) return
      if (waitingForPong) {
        // Previous PING went unanswered
        console.warn('[Web Push] Heartbeat timeout — re-establishing channel')
        isSecureChannelReady.value = false
        port.value = null
        waitingForPong = false
        initSecureChannel()
        return
      }
      waitingForPong = true
      sendSecureMessage(SW_SECURE_COMMANDS.PING)
      setTimeout(() => {
        waitingForPong = false
      }, 5000)
    }, 30_000)
  }

  return {
    isSupported: 'MessageChannel' in window,
    isSecureChannelReady,
    initSecureChannel,
    setPrivateKey,
    clearPrivateKey,
    syncNotificationSettings,
    setupSWListeners,
    startHeartbeat
  }
}
