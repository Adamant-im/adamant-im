import { PushNotifications } from '@capacitor/push-notifications'
import { App, AppState } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { BasePushService, PushPlatform } from './pushServiceBase'
import { getDeviceId } from '@/firebase'
import { sendSpecialMessage } from '@/lib/adamant-api'
import { signalAsset } from '@/lib/adamant-api/asset'
import { ADAMANT_NOTIFICATION_SERVICE_ADDRESS } from '@/lib/constants'
import { navigateToChat, processPushNotification } from './pushUtils'

export class AndroidPushService extends BasePushService {
  platform: PushPlatform = 'android'
  private token: string | null = null
  private deviceId: string | null = null
  private privateKey: string | null = null
  private initialized: boolean = false
  private isAppInForeground: boolean = true

  async initialize(): Promise<boolean> {
    if (this.initialized) return true

    this.deviceId = await getDeviceId()
    if (!this.deviceId) return false

    this.setupAppStateTracking()
    await this.setupNotificationHandlers()

    this.initialized = true
    return true
  }

  private setupAppStateTracking() {
    if (Capacitor.isNativePlatform() && typeof App !== 'undefined') {
      App.addListener('appStateChange', (state: AppState) => {
        this.isAppInForeground = state.isActive
      })

      App.addListener('resume', () => {
        this.isAppInForeground = true
      })

      App.addListener('pause', () => {
        this.isAppInForeground = false
      })
    } else {
      this.isAppInForeground = document?.visibilityState === 'visible' && document?.hasFocus()
    }
  }

  async requestPermissions(): Promise<boolean> {
    const permResult = await PushNotifications.requestPermissions()
    return permResult.receive === 'granted'
  }

  async registerDevice(): Promise<boolean> {
    if (!this.initialized) {
      const initResult = await this.initialize()
      if (!initResult) return false
    }

    const permissionGranted = await this.requestPermissions()
    if (!permissionGranted) return false

    await PushNotifications.register()
    return true
  }

  async unregisterDevice(): Promise<boolean> {
    if (!this.token || !this.deviceId) return false

    const result = await sendSpecialMessage(
      ADAMANT_NOTIFICATION_SERVICE_ADDRESS,
      signalAsset(this.deviceId, this.token, 'FCM', 'remove')
    )

    if ('error' in result) {
      throw result.error
    }

    this.token = null
    return true
  }

  setPrivateKey(privateKey: string): void {
    this.privateKey = privateKey
  }

  private async setupNotificationHandlers(): Promise<void> {
    await PushNotifications.addListener('registration', async (token) => {
      const oldToken = this.token
      this.token = token.value

      this.notify('deviceToken', token.value)

      if (this.deviceId) {
        if (oldToken && oldToken !== token.value) {
          await sendSpecialMessage(
            ADAMANT_NOTIFICATION_SERVICE_ADDRESS,
            signalAsset(this.deviceId, oldToken, 'FCM', 'remove')
          )
        }

        const result = await sendSpecialMessage(
          ADAMANT_NOTIFICATION_SERVICE_ADDRESS,
          signalAsset(this.deviceId, token.value, 'FCM', 'add')
        )

        if ('error' in result) {
          throw result.error
        }
      }
    })

    await PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      this.notify('pushNotificationReceived', notification)

      if (this.isAppInForeground || !this.privateKey || !notification.data) {
        return
      }

      await processPushNotification(
        notification.data,
        this.privateKey,
        this.isAppInForeground,
        async () => {}
      )
    })

    await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      const data = notification.notification.data
      if (data && data.senderId) {
        navigateToChat(data.senderId, data.transactionId)
      }
    })
  }
}
