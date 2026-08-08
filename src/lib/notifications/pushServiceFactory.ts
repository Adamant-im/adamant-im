import { PushService } from './pushServiceBase'
import { Capacitor } from '@capacitor/core'
import { AndroidPushService } from './pushServiceAndroid'
import { WebPushService } from './pushServiceWeb'

export function createPushService(): PushService {
  if (Capacitor.getPlatform() === 'android') {
    return new AndroidPushService()
  }
  return new WebPushService()
}

export const pushService = createPushService()
