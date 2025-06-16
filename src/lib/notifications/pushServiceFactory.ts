import { PushService } from './pushServiceBase'
import { Capacitor } from '@capacitor/core'
import { AndroidPushService } from './pushServiceAndroid'
import { WebPushService } from './pushServiceWeb'

export function createPushService(): PushService {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    return new AndroidPushService()
  } else {
    return new WebPushService()
  }
}

export const pushService = createPushService()
