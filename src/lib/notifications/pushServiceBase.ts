export type PushPlatform = 'android' | 'web'
export type PushEventType = 'pushNotificationReceived' | 'deviceToken'
export type PushCallback = (data: any) => void

export interface PushService {
  platform: PushPlatform
  initialize(): Promise<boolean>
  requestPermissions(): Promise<boolean>
  registerDevice(): Promise<boolean>
  unregisterDevice(): Promise<boolean>
  subscribe(event: PushEventType, callback: PushCallback): void
  unsubscribe(event: PushEventType, callback?: PushCallback): void
  setPrivateKey(privateKey: string): void
}

export abstract class BasePushService implements PushService {
  abstract platform: PushPlatform
  protected eventListeners: Map<PushEventType, Set<PushCallback>> = new Map()

  abstract initialize(): Promise<boolean>
  abstract requestPermissions(): Promise<boolean>
  abstract registerDevice(): Promise<boolean>
  abstract unregisterDevice(): Promise<boolean>
  abstract setPrivateKey(privateKey: string): void

  subscribe(event: PushEventType, callback: PushCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }

    this.eventListeners.get(event)!.add(callback)
  }

  unsubscribe(event: PushEventType, callback?: PushCallback): void {
    if (callback) {
      const listeners = this.eventListeners.get(event)
      if (listeners) {
        listeners.delete(callback)
        if (listeners.size === 0) {
          this.eventListeners.delete(event)
        }
      }
    } else {
      this.eventListeners.delete(event)
    }
  }

  protected notify(event: PushEventType, data: any): void {
    const listeners = this.eventListeners.get(event)

    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in ${event} listener:`, error)
        }
      })
    }
  }
}
