import { computed } from 'vue'
import { Capacitor } from '@capacitor/core'

export function useAndroidPushNotifications() {
  const isSupported = computed(() => Capacitor.getPlatform() === 'android')

  /**
   * Gets reference to pushService (always AndroidPushService on Android)
   */
  const getPushService = async () => {
    if (!isSupported.value) return null

    const { pushService } = await import('@/lib/notifications/pushServiceFactory')
    return pushService
  }

  /**
   * Sets private key - proxy to pushService.setPrivateKey()
   */
  const setPrivateKey = async (key: string): Promise<boolean> => {
    if (!isSupported.value) return false

    const service = await getPushService()
    if (service) {
      service.setPrivateKey(key)
      return true
    }

    return false
  }

  /**
   * Clears private key - proxy to pushService.setPrivateKey('')
   */
  const clearPrivateKey = async (): Promise<boolean> => {
    return setPrivateKey('')
  }

  return {
    isSupported,
    setPrivateKey,
    clearPrivateKey,
    getPushService
  }
}
