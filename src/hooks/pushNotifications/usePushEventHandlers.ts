import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Composable for handling push notification events and navigation
 */
export function usePushEventHandlers() {
  const router = useRouter()

  /**
   * Opens chat with optional scroll to message
   */
  const openChatWithScroll = (partnerId: string, transactionId?: string) => {
    router.push({
      name: 'Chat',
      params: { partnerId },
      query: transactionId ? { scrollToMessage: transactionId } : { scrollToBottom: 'true' }
    })
  }

  /**
   * Handles opening chat from notification click (Android Capacitor)
   */
  const handleOpenChat = (event: Event) => {
    const detail = (event as CustomEvent).detail
    if (detail?.partnerId) {
      openChatWithScroll(detail.partnerId, detail.transactionId)
    }
  }

  /**
   * Handles messages from Service Worker (Web PWA)
   */
  const handleServiceWorkerMessage = (event: MessageEvent) => {
    if (!event.data) return

    const { action, partnerId, transactionId } = event.data

    if (action === 'OPEN_CHAT' && partnerId) {
      openChatWithScroll(partnerId, transactionId)
      window.focus()
    }
  }

  /**
   * Sets up event listeners
   */
  const setupEventListeners = () => {
    window.addEventListener('openChat', handleOpenChat)
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage)
  }

  /**
   * Removes event listeners
   */
  const removeEventListeners = () => {
    window.removeEventListener('openChat', handleOpenChat)
    navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage)
  }

  onMounted(setupEventListeners)
  onBeforeUnmount(removeEventListeners)
}
