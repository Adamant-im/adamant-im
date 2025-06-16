import { initializeApp } from 'firebase/app'
import { getMessaging } from 'firebase/messaging'
import { getId, getInstallations } from 'firebase/installations'
import { firebaseConfig } from '@/lib/firebase-config'

const firebaseApp = initializeApp(firebaseConfig)
const fcm = getMessaging(firebaseApp)

async function getDeviceId(): Promise<string> {
  return await getId(getInstallations(firebaseApp))
}

export { firebaseApp, fcm, getDeviceId }
