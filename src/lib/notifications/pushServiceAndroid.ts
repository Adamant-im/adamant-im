import { sendSpecialMessage } from '../adamant-api'
import { ADAMANT_NOTIFICATION_SERVICE_ADDRESS } from '../constants'
import { BasePushService } from './pushServiceBase'
import { PushNotifications, PushNotificationSchema } from '@capacitor/push-notifications'
import { signalAsset } from '@/lib/adamant-api/asset'
import { processPushNotification, navigateToChat, NotificationData } from './pushUtils'
import { App, AppState } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

interface PushNotification extends PushNotificationSchema {
  data: NotificationData
}

const TOKEN_REGISTRATION_TIMEOUT = 10000
const TOKEN_CHECK_INTERVAL = 100

export class AndroidPushService extends BasePushService {
  private token: string | null = null
  private privateKey: string | null = null
  private isAppInForeground: boolean = true

  async initialize(): Promise<boolean> {
    const baseInitialized = await super.initialize()
    if (!baseInitialized) {
      return false
    }

    this.setupAppStateTracking()
    await this.setupPushNotificationHandler()
    await this.setupNotificationClickHandler()
    await this.setupTokenRegistrationHandler()

    return true
  }

  async requestPermissions(): Promise<boolean> {
    const permissionResult = await PushNotifications.requestPermissions()
    return permissionResult.receive === 'granted'
  }

  async registerDevice(): Promise<void> {
    await PushNotifications.register()

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Token registration timeout'))
      }, TOKEN_REGISTRATION_TIMEOUT)

      const checkToken = () => {
        if (this.token) {
          clearTimeout(timeout)
          resolve()
        } else {
          setTimeout(checkToken, TOKEN_CHECK_INTERVAL)
        }
      }

      checkToken()
    })
  }

  async unregisterDevice(): Promise<boolean> {
    if (!this.token || !this.deviceId) return false

    try {
      await sendSpecialMessage(
        ADAMANT_NOTIFICATION_SERVICE_ADDRESS,
        signalAsset(this.deviceId, this.token, 'FCM', 'remove')
      )
      this.token = null
      return true
    } catch (error) {
      console.error('Failed to unregister device:', error)
      return false
    }
  }

  setPrivateKey(privateKey: string): void {
    this.privateKey = privateKey
  }

  private async setupPushNotificationHandler(): Promise<void> {
    await PushNotifications.addListener(
      'pushNotificationReceived',
      async (notification: PushNotification) => {
        if (this.isAppInForeground || !this.privateKey || !notification.data) {
          return
        }

        try {
          await processPushNotification(
            notification.data,
            this.privateKey,
            this.isAppInForeground,
            async () => {}
          )
        } catch (error) {
          console.error('Failed to process push notification:', error)
        }
      }
    )
  }

  private async setupNotificationClickHandler(): Promise<void> {
    await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      const { senderId, transactionId }: NotificationData = notification.notification.data

      if (!senderId) {
        return
      }

      try {
        navigateToChat(senderId, transactionId)
      } catch (error) {
        console.error('Failed to navigate to chat:', error)
      }
    })
  }

  private async setupTokenRegistrationHandler(): Promise<void> {
    await PushNotifications.addListener('registration', async (tokenData) => {
      const oldToken = this.token
      this.token = tokenData.value

      if (!this.deviceId) {
        console.error('Device ID not available for token registration')
        return
      }

      try {
        await this.handleTokenRegistration(oldToken, tokenData.value)
      } catch (error) {
        console.error('Failed to register token in ANS:', error)
        throw error
      }
    })

    await PushNotifications.addListener('registrationError', (error) => {
      console.error('FCM token registration failed:', error)
      this.token = null
    })
  }

  private async handleTokenRegistration(oldToken: string | null, newToken: string): Promise<void> {
    if (oldToken && oldToken !== newToken) {
      await sendSpecialMessage(
        ADAMANT_NOTIFICATION_SERVICE_ADDRESS,
        signalAsset(this.deviceId!, oldToken, 'FCM', 'remove')
      )
    }

    await sendSpecialMessage(
      ADAMANT_NOTIFICATION_SERVICE_ADDRESS,
      signalAsset(this.deviceId!, newToken, 'FCM', 'add')
    )
  }

  private setupAppStateTracking(): void {
    if (!Capacitor.isNativePlatform() || typeof App === 'undefined') {
      return
    }

    App.addListener('appStateChange', (state: AppState) => {
      this.isAppInForeground = state.isActive
    })

    App.addListener('resume', () => {
      this.isAppInForeground = true
    })

    App.addListener('pause', () => {
      this.isAppInForeground = false
    })
  }
}
