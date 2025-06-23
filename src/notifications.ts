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
    const registration = await navigator.serviceWorker.ready
    return registration
  } catch {
    return null
  }
}

export async function initializePushNotifications(): Promise<string | null> {
  if (!fcm) return null

  let swRegistration = await registerServiceWorker()

  if (!swRegistration) {
    swRegistration = await navigator.serviceWorker.ready
  }

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
