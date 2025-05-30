import { BasePushService, PushPlatform } from './pushServiceBase'
import { getDeviceId } from '@/firebase'
import { initializePushNotifications, revokeToken } from '@/notifications'
import { sendSpecialMessage } from '@/lib/adamant-api'
import { signalAsset } from '@/lib/adamant-api/asset'
import { ADAMANT_NOTIFICATION_SERVICE_ADDRESS } from '@/lib/constants'

export class WebPushService extends BasePushService {
  platform: PushPlatform = 'web'
  private token: string | null = null
  private deviceId: string | null = null
  private privateKey: string | null = null
  private initialized: boolean = false

  async initialize(): Promise<boolean> {
    if (this.initialized) return true

    this.deviceId = await getDeviceId()
    if (!this.deviceId) return false

    this.initialized = true
    return true
  }

  async requestPermissions(): Promise<boolean> {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  async registerDevice(): Promise<boolean> {
    if (!this.initialized) {
      const initResult = await this.initialize()
      if (!initResult) return false
    }

    if (!this.deviceId) return false

    const permissionGranted = await this.requestPermissions()
    if (!permissionGranted) return false

    this.token = await initializePushNotifications()
    if (!this.token) return false

    this.notify('deviceToken', this.token)

    const result = await sendSpecialMessage(
      ADAMANT_NOTIFICATION_SERVICE_ADDRESS,
      signalAsset(this.deviceId, this.token, 'FCM', 'add')
    )

    if ('error' in result) {
      throw result.error
    }

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
