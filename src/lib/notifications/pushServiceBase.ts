import { getDeviceId } from '@/firebase'

export interface PushService {
  // Initialization
  initialize(): Promise<boolean>
  reset(): void

  // Permissions and registration
  requestPermissions(): Promise<boolean>
  registerDevice(): Promise<void>
  unregisterDevice(): Promise<boolean>

  // Private key management
  setPrivateKey(privateKey: string): void

  // State getters
  isInitialized(): boolean
  getDeviceId(): string | null
}

export abstract class BasePushService implements PushService {
  protected initialized: boolean = false
  protected deviceId: string | null = null

  abstract requestPermissions(): Promise<boolean>
  abstract registerDevice(): Promise<void>
  abstract unregisterDevice(): Promise<boolean>
  abstract setPrivateKey(privateKey: string): void

  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true
    }

    try {
      this.deviceId = await getDeviceId()
      this.initialized = true
      return true
    } catch (error) {
      console.error('Push service initialization failed:', error)
      this.reset()
      return false
    }
  }

  reset(): void {
    this.initialized = false
    this.deviceId = null
  }

  isInitialized(): boolean {
    return this.initialized
  }

  getDeviceId(): string | null {
    return this.deviceId
  }
}
