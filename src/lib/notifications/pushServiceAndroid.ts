import { sendSpecialMessage } from '../adamant-api'
import { ADAMANT_NOTIFICATION_SERVICE_ADDRESS } from '../constants'
import { BasePushService } from './pushServiceBase'
import { PushNotifications } from '@capacitor/push-notifications'
import { LocalNotifications } from '@capacitor/local-notifications'
import { signalAsset } from '@/lib/adamant-api/asset'
import { Capacitor } from '@capacitor/core'

const TOKEN_REGISTRATION_TIMEOUT = 10000
const TOKEN_CHECK_INTERVAL = 100

export class AndroidPushService extends BasePushService {
  private token: string | null = null
  private privateKey: string | null = null

  async initialize(): Promise<boolean> {
    const baseInitialized = await super.initialize()
    if (!baseInitialized) {
      return false
    }

    await LocalNotifications.requestPermissions()
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
        signalAsset(this.deviceId!, this.token, 'FCM', 'remove')
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

    if (Capacitor.getPlatform() === 'android' && privateKey) {
      this.savePrivateKeyToAndroid(privateKey)
    }
  }

  private async savePrivateKeyToAndroid(privateKey: string): Promise<void> {
    try {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.set({
        key: 'adamant_private_key',
        value: privateKey
      })
    } catch (error) {
      console.error('Failed to save private key:', error)
    }
  }

  private async setupTokenRegistrationHandler(): Promise<void> {
    await PushNotifications.addListener('registration', async (tokenData) => {
      const oldToken = this.token
      this.token = tokenData.value

      try {
        await this.handleTokenRegistration(oldToken, tokenData.value)
      } catch (error) {
        console.error('Failed to register token:', error)
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

  isInitialized(): boolean {
    return super.isInitialized()
  }

  getDeviceId(): string | null {
    return super.getDeviceId()
  }

  reset(): void {
    super.reset()
    this.token = null
    this.privateKey = null
  }
}
