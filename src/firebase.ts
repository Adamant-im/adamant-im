import { initializeApp } from 'firebase/app'
import { getMessaging } from 'firebase/messaging'
import { getId, getInstallations } from 'firebase/installations'
import { firebaseConfig } from '@/lib/firebase-config'

const firebaseApp = initializeApp(firebaseConfig)

let fcm: ReturnType<typeof getMessaging> | null = null

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    fcm = getMessaging(firebaseApp)
  } catch (error) {
    console.warn('Firebase Messaging not supported:', error)
    fcm = null
  }
} else {
  console.warn('Service Workers not supported - Firebase Messaging unavailable')
}

async function getDeviceId(): Promise<string> {
  return await getId(getInstallations(firebaseApp))
}

export { firebaseApp, fcm, getDeviceId }
