import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Composable for handling push notification events and navigation
 */
export function usePushEventHandlers() {
  const router = useRouter()

  /**
   * Handles opening chat from notification click
   */
  const handleOpenChat = (event: Event) => {
    const detail = (event as CustomEvent).detail
    if (detail?.partnerId) {
      router.push({
        name: 'Chat',
        params: { partnerId: detail.partnerId }
      })
    }
  }

  /**
   * Handles messages from Service Worker
   */
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

  return {
    handleOpenChat,
    handleServiceWorkerMessage,
    setupEventListeners,
    removeEventListeners
  }
}
