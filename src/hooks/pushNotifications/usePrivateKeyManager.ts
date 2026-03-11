import { useStore } from 'vuex'
import { Capacitor } from '@capacitor/core'
import { useWebPushNotifications } from './useWebPushNotifications'
import { useAndroidPushNotifications } from './useAndroidPushNotifications'
import { Base64 } from 'js-base64'

/**
 * Composable for managing private key across platforms
 * Handles sending/clearing private keys to both Service Worker and Push Services
 */
export function usePrivateKeyManager() {
  const store = useStore()
  const platform = Capacitor.getPlatform()

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
   */ const sendPrivateKey = async (): Promise<boolean> => {
    const privateKey = await getPrivateKey()
    if (!privateKey) {
      return false
    }

    if (webPush) {
      return await webPush.setPrivateKey(privateKey)
    }
    if (androidPush) {
      return await androidPush.setPrivateKey(privateKey)
    }

    return false
  }

  const clearPrivateKey = async (): Promise<boolean> => {
    if (webPush) {
      return await webPush.clearPrivateKey()
    }
    if (androidPush) {
      return await androidPush.clearPrivateKey()
    }
    return false
  }

  const syncNotificationSettings = (type: number) => {
    if (webPush) {
      const currentUserAddress = store.state.address
      // hex-encode passphrase so SW's deriveEncryptionKey (which does hexToBytes) handles both paths uniformly
      const toHex = (s: string) =>
        Array.from(new TextEncoder().encode(s))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      const encryptionPassword =
        store.state.password || toHex(Base64.decode(store.state.passphrase))

      webPush.syncNotificationSettings({ type, currentUserAddress, encryptionPassword })
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
