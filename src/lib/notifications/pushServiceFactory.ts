import { Capacitor } from '@capacitor/core'
import { PushService } from './pushServiceBase'
import { WebPushService } from './pushServiceWeb'
import { AndroidPushService } from './pushServiceAndroid'

export function createPushService(): PushService {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    return new AndroidPushService()
  } else {
    return new WebPushService()
  }
}

export const pushService = createPushService()
