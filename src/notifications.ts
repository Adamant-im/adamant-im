import { fcm } from './firebase'
import { VAPID_KEY } from '@/lib/constants'
import { getToken, deleteToken } from 'firebase/messaging'

export async function revokeToken(): Promise<boolean> {
  if (!fcm) return false

  try {
    await deleteToken(fcm)
    return true
  } catch {
    return false
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null
  }

  try {
    const swPath = import.meta.env.PROD ? '/firebase-messaging-sw.js' : '/dev-sw.js?dev-sw'

    const swType = import.meta.env.PROD ? 'classic' : 'module'

    const registration = await navigator.serviceWorker.register(swPath, {
      type: swType as WorkerType,
      scope: '/'
    })

    if (registration.installing) {
      await new Promise<void>((resolve) => {
        registration.installing?.addEventListener('statechange', (e) => {
          if ((e.target as ServiceWorker).state === 'activated') {
            resolve()
          }
        })
      })
    }

    return registration
  } catch {
    return null
  }
}

export async function initializePushNotifications(): Promise<string | null> {
  if (!fcm) return null

  const swRegistration = await registerServiceWorker()
  if (!swRegistration) return null

  try {
    const token = await getToken(fcm, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration
    })
    return token || null
  } catch (error) {
    console.error('FCM Token error:', error)
    return null
  }
}
