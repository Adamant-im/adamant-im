import { initializePushNotifications, revokeToken } from '@/notifications'
import { BasePushService } from './pushServiceBase'
import { sendSpecialMessage } from '../adamant-api'
import { ADAMANT_NOTIFICATION_SERVICE_ADDRESS } from '../constants'
import { signalAsset } from '../adamant-api/asset'

export class WebPushService extends BasePushService {
  private token: string | null = null
  private privateKey: string | null = null

  async initialize(): Promise<boolean> {
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
    this.token = await initializePushNotifications()
    if (!this.token) {
      throw new Error('Failed to get Web Push token')
    }

    if (this.deviceId) {
      await sendSpecialMessage(
        ADAMANT_NOTIFICATION_SERVICE_ADDRESS,
        signalAsset(this.deviceId, this.token, 'FCM', 'add')
      )
    }
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

    const revoked = await revokeToken()
    if (!revoked) return false

    this.token = null
    this.privateKey = null

    return true
  }

  setPrivateKey(privateKey: string): void {
    this.privateKey = privateKey

    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('adm_notifications')
      channel.postMessage({ privateKey })
    }
  }
}
