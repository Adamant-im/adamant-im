import { getDeviceId } from '@/firebase'

export interface PushService {
  initialize(): Promise<boolean>
  requestPermissions(): Promise<boolean>
  reset(): void
  registerDevice(): Promise<void>
  unregisterDevice(): Promise<boolean>
  setPrivateKey(privateKey: string): void
}

export abstract class BasePushService implements PushService {
  protected initialized: boolean = false
  protected deviceId: string | null = null
  abstract requestPermissions(): Promise<boolean>
  abstract registerDevice(): Promise<void>
  abstract unregisterDevice(): Promise<boolean>
  abstract setPrivateKey(privateKey: string): void

  async initialize(): Promise<boolean> {
    if (this.initialized && this.deviceId) {
      return true
    }

    try {
      this.deviceId = await getDeviceId()
      this.initialized = true
      return true
    } catch (error) {
      console.log(error)
      this.reset()
      return this.initialized
    }
  }

  reset(): void {
    this.initialized = false
    this.deviceId = null
  }
}
