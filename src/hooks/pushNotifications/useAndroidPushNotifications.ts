import { ref, computed } from 'vue'
import { Capacitor } from '@capacitor/core'

export interface AndroidNotificationSettings {
  type: number
  privateKey?: string
}

/**
 * Android-specific composable for managing push notifications
 * Handles only data passing to AndroidPushService
 */
export function useAndroidPushNotifications() {
  const privateKey = ref<string | null>(null)
  const isSupported = Capacitor.getPlatform() === 'android'

  const isActive = computed(() => privateKey.value !== null)

  /**
   * Gets reference to pushService
   */
  const getPushService = async () => {
    try {
      const { pushService } = await import('@/lib/notifications/pushServiceFactory')
      return pushService
    } catch (error) {
      console.error('[Android Push] Failed to import pushService:', error)
      return null
    }
  }

  /**
   * Stores private key and passes it to AndroidPushService
   */
  const sendPrivateKey = async (key: string): Promise<boolean> => {
    if (!isSupported || !key) {
      return false
    }

    try {
      // Store locally
      privateKey.value = key

      // Pass to push service
      const pushService = await getPushService()
      if (pushService) {
        pushService.setPrivateKey(key)
        return true
      }

      return false
    } catch (error) {
      console.error('[Android Push] Failed to send private key:', error)
      return false
    }
  }

  /**
   * Clears private key
   */
  const clearPrivateKey = async (): Promise<boolean> => {
    if (!isSupported) {
      return false
    }

    try {
      // Clear locally
      privateKey.value = null

      // Clear in push service
      const pushService = await getPushService()
      if (pushService) {
        pushService.setPrivateKey('')
        return true
      }

      return false
    } catch (error) {
      console.error('[Android Push] Failed to clear private key:', error)
      return false
    }
  }

  /**
   * Syncs notification settings (mainly stores private key if provided)
   */
  const syncNotificationSettings = async (
    settings: AndroidNotificationSettings
  ): Promise<boolean> => {
    if (!isSupported) {
      return false
    }

    try {
      // If private key provided - store it
      if (settings.privateKey) {
        await sendPrivateKey(settings.privateKey)
      }

      return true
    } catch (error) {
      console.error('[Android Push] Failed to sync settings:', error)
      return false
    }
  }

  return {
    isActive,
    sendPrivateKey,
    clearPrivateKey,
    syncNotificationSettings
  }
}
