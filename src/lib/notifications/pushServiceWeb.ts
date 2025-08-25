import { revokeToken } from '@/notifications'
import { BasePushService } from './pushServiceBase'
import { sendSpecialMessage } from '../adamant-api'
import { ADAMANT_NOTIFICATION_SERVICE_ADDRESS, VAPID_KEY, MessageType } from '../constants'
import { signalAsset } from '../adamant-api/asset'
import { fcm } from '@/firebase'
import { getToken } from 'firebase/messaging'

export class WebPushService extends BasePushService {
  private token: string | null = null
  private privateKey: string | null = null

  async initialize(): Promise<boolean> {
    if (!fcm) {
      console.warn('Firebase Messaging not available - Web Push unavailable')
      return false
    }

    const baseInitialized = await super.initialize()
    if (!baseInitialized) {
      return false
    }

    return true
  }

  async requestPermissions(): Promise<boolean> {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  async registerDevice(): Promise<void> {
    if (!fcm) {
      throw new Error('Firebase Messaging not available')
    }

    try {
      const swRegistration = await navigator.serviceWorker.getRegistration('/firebase/')

      if (!swRegistration) {
        throw new Error('Firebase Service Worker not registered')
      }

      this.token = await getToken(fcm, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration
      })
    } catch (error) {
      console.error('Failed to get FCM token:', error)
      throw error
    }

    if (!this.token) {
      throw new Error('Failed to get Web Push token')
    }

    if (this.deviceId) {
      try {
        const signalData = signalAsset(this.deviceId, this.token, 'FCM', 'add')
        await sendSpecialMessage(ADAMANT_NOTIFICATION_SERVICE_ADDRESS, signalData, MessageType.SIGNAL_MESSAGE)
      } catch (error) {
        console.error('Failed to register device with notification service:', error)
        throw error
      }
    }
  }

  async unregisterDevice(): Promise<boolean> {
    if (!this.token || !this.deviceId) return false

    try {
      await sendSpecialMessage(
        ADAMANT_NOTIFICATION_SERVICE_ADDRESS,
        signalAsset(this.deviceId, this.token, 'FCM', 'remove'),
        MessageType.SIGNAL_MESSAGE
      )

      const revoked = await revokeToken()
      if (!revoked) {
        throw new Error('Failed to revoke FCM token')
      }

      this.token = null
      this.privateKey = null

      return true
    } catch (error) {
      console.error('Failed to unregister device:', error)
      return false
    }
  }

  setPrivateKey(privateKey: string): void {
    this.privateKey = privateKey
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
