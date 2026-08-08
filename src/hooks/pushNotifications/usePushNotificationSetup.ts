import { watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import { Capacitor } from '@capacitor/core'
import { usePrivateKeyManager } from './usePrivateKeyManager'
import { usePushEventHandlers } from './usePushEventHandlers'
import { useWebPushNotifications } from './useWebPushNotifications'

export function usePushNotificationSetup() {
  const store = useStore()
  const platform = Capacitor.getPlatform()

  usePushEventHandlers()

  const { clearPrivateKey, getPrivateKey, sendPrivateKey } = usePrivateKeyManager()
  const webPush = platform === 'web' ? useWebPushNotifications() : null

  const sendCurrentSettings = async () => {
    const type = store.state.options.allowNotificationType
    const privateKey = store.state.passphrase ? await getPrivateKey() : undefined
    const currentUserAddress = store.state.address

    if (webPush) {
      webPush.syncNotificationSettings({ type, currentUserAddress })
      if (privateKey) {
        await sendPrivateKey()
      }
    }
  }

  const setupWatchers = () => {
    if (webPush) {
      // Sync when channel becomes ready
      watch(
        () => webPush.isSecureChannelReady.value,
        async (isReady) => {
          if (isReady && store.state.passphrase) {
            await sendCurrentSettings()
          }
        }
      )
    }

    watch(
      () => store.state.passphrase,
      async (newPassphrase, oldPassphrase) => {
        if (newPassphrase && !oldPassphrase) {
          // Login: sync SW with current state
          await sendCurrentSettings()
        } else if (!newPassphrase && oldPassphrase) {
          // Logout: wipe key from SW
          await clearPrivateKey()
        }
      }
    )

    watch(
      () => store.state.options.allowNotificationType,
      async () => {
        if (store.state.passphrase) {
          await sendCurrentSettings()
        }
      }
    )
  }

  const initialize = async () => {
    if (webPush) {
      webPush.setupSWListeners()
      await webPush.initSecureChannel()
      webPush.startHeartbeat()
    }
    setupWatchers()
  }

  onMounted(initialize)
}
