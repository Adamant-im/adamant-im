import { useStore } from 'vuex'
import { Capacitor } from '@capacitor/core'
import { useWebPushNotifications } from './useWebPushNotifications'
import { useAndroidPushNotifications } from './useAndroidPushNotifications'

/**
 * Composable for managing private key across platforms
 * Handles sending/clearing private keys to both Service Worker and Push Services
 */
export function usePrivateKeyManager() {
  const store = useStore()
  const platform = Capacitor.getPlatform()

  // Platform-specific composables
  const webPush = platform === 'web' ? useWebPushNotifications() : null
  const androidPush = platform === 'android' ? useAndroidPushNotifications() : null

  /**
   * Gets private key from store
   */
  const getPrivateKey = async (): Promise<string | null> => {
    try {
      return await store.dispatch('getPrivateKeyForPush')
    } catch (error) {
      console.error('Error getting private key:', error)
      return null
    }
  }

  /**
   * Sends private key to appropriate platform handlers
   */
  const sendPrivateKey = async (): Promise<boolean> => {
    const privateKey = await getPrivateKey()
    if (!privateKey) return false

    if (webPush) {
      return webPush.setPrivateKey(privateKey)
    }
    if (androidPush) {
      return await androidPush.setPrivateKey(privateKey)
    }

    return false
  }

  /**
   * Clears private key from appropriate platform handlers
   */
  const clearPrivateKey = async (): Promise<boolean> => {
    if (webPush) {
      return webPush.clearPrivateKey()
    }
    if (androidPush) {
      return await androidPush.clearPrivateKey()
    }

    return false
  }

  /**
   * Syncs notification settings (web only)
   */
  const syncNotificationSettings = (type: number) => {
    if (webPush) {
      webPush.syncNotificationSettings({ type })
    }
    // Android settings are managed through pushService directly
  }

  return {
    getPrivateKey,
    sendPrivateKey,
    clearPrivateKey,
    syncNotificationSettings
  }
}
