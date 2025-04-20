/* eslint-disable */

console.log('custom sw ts from src')

const swSelf = globalThis as unknown as ServiceWorkerGlobalScope

swSelf.addEventListener('install', (event) => {
  event.waitUntil(swSelf.skipWaiting())
})

import { initializeApp } from 'firebase/app'
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'
import utils from '@/lib/adamant'

const firebaseApp = initializeApp({
  apiKey: 'AIzaSyDgtB_hqwL1SS_YMYepRMmXYhmc7154wmU',
  authDomain: 'adamant-messenger.firebaseapp.com',
  databaseURL: 'https://adamant-messenger.firebaseio.com',
  projectId: 'adamant-messenger',
  storageBucket: 'adamant-messenger.appspot.com',
  messagingSenderId: '987518845753',
  appId: '1:987518845753:web:6585b11ca36bac4c251ee8'
})

let privateKey: string = ''
const channel = new BroadcastChannel('adm_notifications')
channel.onmessage = (event) => {
  console.log('🚀 ~ :35 ~ event:', event)
  const data = event.data
  if (data && data.isCheckPK) channel.postMessage({ isNoPrivateKey: true })
  else if (data && data.privateKey) {
    privateKey = data.privateKey
    console.log('🚀 ~ firebase-messaging-sw.ts:40 ~ privateKey:', privateKey)
  }
}
if (!privateKey) {
  channel.postMessage({ isNoPrivateKey: true })
}

const messaging = getMessaging(firebaseApp)
onBackgroundMessage(messaging, (payload: any) => {
  console.log('🚀 ~ :37 ~ privateKey:', privateKey)
  console.log('🚀 ~ :40 ~ onBackgroundMessage ~ payload:', payload)
  const txn = payload.data?.txn || ''
  const _txn = JSON.parse(txn)
  const { senderPublicKey } = _txn
  const asset = _txn.asset
  const chat = asset.chat
  let decoded_message = ''
  const { message, own_message } = chat
  if (privateKey) {
    decoded_message = utils.decodeMessage(message, senderPublicKey, privateKey, own_message)
    console.log('🚀 ~ :60 ~ onBackgroundMessage ~ decoded_message:', decoded_message)
    const notificationTitle = 'ADAMANT Messenger'
    const notificationBody = payload.notification?.title + ' sw: ' + decoded_message
    const notificationOptions = {
      body: notificationBody,
      icon: '/icon.png'
    }
    swSelf.registration.showNotification(notificationTitle, notificationOptions)
  }
})
