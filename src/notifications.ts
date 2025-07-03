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

  let swRegistration = await navigator.serviceWorker.getRegistration('/firebase/')

  if (!swRegistration) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    swRegistration = await navigator.serviceWorker.getRegistration('/firebase/')
  }

  if (!swRegistration) {
    return null
  }

  try {
    if (!fcm) {
      throw new Error('Firebase Messaging not available')
    }

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
