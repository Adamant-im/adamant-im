/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js')
importScripts('https://cdnjs.cloudflare.com/ajax/libs/tweetnacl/1.0.3/nacl.min.js')
importScripts('/js/ed2curve.min.js')

const NOTIFICATION_TYPES = {
  NO_NOTIFICATIONS: 0,
  BACKGROUND_FETCH: 1,
  PUSH: 2
}

let privateKey = ''
let currentUserAddress = ''
let notificationSettings = {
  type: NOTIFICATION_TYPES.NO_NOTIFICATIONS, // default
  initialized: false
}

// Checking double notifications
const processedEvents = new Set()
setInterval(() => processedEvents.clear(), 2 * 60 * 1000) // 2 minutes

let securePort = null
const usedNonces = new Set()

// Resolvers for settings initialization promises
let settingsInitializedResolvers = []

// Database configuration
const DB_NAME = 'AdamantSWStorage'
const STORE_NAME = 'secure_context'
const DB_VERSION = 1

// IndexedDB Helper
const dbPromise = new Promise((resolve) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION)
  request.onupgradeneeded = (e) => {
    const db = e.target.result
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME)
    }
  }
  request.onsuccess = (e) => resolve(e.target.result)
  request.onerror = () => resolve(null)
})

async function getFromStorage(key) {
  const db = await dbPromise
  if (!db) return null
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).get(key)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => resolve(null)
  })
}

async function saveToStorage(key, value) {
  const db = await dbPromise
  if (!db) return
  const transaction = db.transaction(STORE_NAME, 'readwrite')
  transaction.objectStore(STORE_NAME).put(value, key)
}

// Firebase initialization
const firebaseConfig = {
  apiKey: 'AIzaSyDgtB_hqwL1SS_YMYepRMmXYhmc7154wmU',
  authDomain: 'adamant-messenger.firebaseapp.com',
  databaseURL: 'https://adamant-messenger.firebaseio.com',
  projectId: 'adamant-messenger',
  storageBucket: 'adamant-messenger.appspot.com',
  messagingSenderId: '987518845753',
  appId: '1:987518845753:web:6585b11ca36bac4c251ee8'
}

firebase.initializeApp(firebaseConfig)
const messaging = firebase.messaging()

/**
 * Global message listener to intercept the MessagePort transfer.
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'INIT_SECURE_CHANNEL') {
    securePort = event.ports[0]

    securePort.onmessage = (portEvent) => {
      handleSecureMessage(portEvent.data)
    }

    securePort.postMessage({
      type: 'CONFIRM_CHANNEL',
      timestamp: Date.now()
    })
  }
})

/**
 * Logic for processing messages received through the secure port.
 */
async function handleSecureMessage(data) {
  const { type, payload, timestamp, nonce } = data

  // Time-based  and nonce-based security
  if (!timestamp || !nonce || Math.abs(Date.now() - timestamp) > 10000 || usedNonces.has(nonce)) {
    return
  }

  usedNonces.add(nonce)

  // Keep the Set size manageable
  if (usedNonces.size > 100) {
    const [firstItem] = usedNonces
    usedNonces.delete(firstItem)
  }

  switch (type) {
    case 'SET_PRIVATE_KEY':
      if (payload?.privateKey) {
        privateKey = payload.privateKey
        await saveToStorage('privateKey', privateKey)
      }
      break

    case 'CLEAR_PRIVATE_KEY':
      privateKey = ''
      break

    case 'SYNC_SETTINGS':
      if (payload?.currentUserAddress) {
        if (currentUserAddress && currentUserAddress !== payload.currentUserAddress) {
          privateKey = ''
          await saveToStorage('privateKey', '')
        }
        currentUserAddress = payload.currentUserAddress
        await saveToStorage('currentUserAddress', currentUserAddress)
      }

      if (payload?.type !== undefined) {
        notificationSettings.type = payload.type
        await saveToStorage('notificationType', payload.type)
      }

      notificationSettings.initialized = true

      if (settingsInitializedResolvers.length > 0) {
        settingsInitializedResolvers.forEach((resolve) => resolve())
        settingsInitializedResolvers = []
      }
      break

    default:
      console.warn('[SW] Unknown secure command:', type)
  }
}

// Utilities for decoding
function hexToBytes(hex) {
  const bytes = []
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16))
  }
  return Uint8Array.from(bytes)
}

function decode(bytes) {
  return new TextDecoder('utf-8').decode(bytes)
}

// Adamant messages decrypting
function decryptMessage(transaction, privateKeyHex) {
  try {
    const chat = transaction.asset?.chat
    if (!chat?.message || !transaction.senderPublicKey || !privateKeyHex) return null

    const { message, own_message } = chat

    const msgBytes = hexToBytes(message)
    const nonceBytes = hexToBytes(own_message)
    const senderKeyBytes = hexToBytes(transaction.senderPublicKey)
    const privateKeyBytes = hexToBytes(privateKeyHex)

    const dhPublicKey = ed2curve.convertPublicKey(senderKeyBytes)
    const dhSecretKey = ed2curve.convertSecretKey(privateKeyBytes)

    if (!dhPublicKey || !dhSecretKey) return null

    const decrypted = nacl.box.open(msgBytes, nonceBytes, dhPublicKey, dhSecretKey)
    if (!decrypted) return null

    return decode(decrypted)
  } catch (error) {
    console.error('Decryption failed:', error)
    return null
  }
}

async function isAppVisible() {
  try {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    return clients.some((client) => client.focused && client.visibilityState === 'visible')
  } catch {
    return false
  }
}

// Block firebase service notifications
const originalShowNotification = self.registration.showNotification.bind(self.registration)

self.registration.showNotification = function (title, options) {
  // Allow only our notifications with specific markers
  if (options?.data?.type === 'push' && title === 'ADAMANT Messenger') {
    return originalShowNotification(title, options)
  }

  return Promise.resolve() // return promise as original functions returns promise
}

function parseTransactionPayload(payload) {
  if (!payload.data?.txn) {
    return null
  }

  try {
    const transaction = JSON.parse(payload.data.txn)
    return {
      transaction,
      eventId: transaction.id
    }
  } catch (error) {
    console.warn('Invalid transaction JSON:', error)
    return null
  }
}

function isEventProcessed(eventId) {
  if (!eventId || processedEvents.has(eventId)) {
    return true
  }
  processedEvents.add(eventId)
  return false
}

function waitForSettingsEvent() {
  return new Promise((resolve) => {
    settingsInitializedResolvers.push(resolve)

    // Timeout fallback
    setTimeout(() => {
      const index = settingsInitializedResolvers.indexOf(resolve)
      if (index !== -1) {
        settingsInitializedResolvers.splice(index, 1)
        resolve()
      }
    }, 3000)
  })
}

async function ensureSettingsInitialized() {
  if (notificationSettings.initialized) {
    return
  }

  await waitForSettingsEvent()

  if (!notificationSettings.initialized) {
    notificationSettings.initialized = true
  }
}

function isPushEnabled() {
  return notificationSettings.type === NOTIFICATION_TYPES.PUSH
}

messaging.onBackgroundMessage(async (payload) => {
  // Restore state from IDB
  if (!currentUserAddress) {
    currentUserAddress = (await getFromStorage('currentUserAddress')) || ''
    const savedType = await getFromStorage('notificationType')
    notificationSettings.type = savedType ?? NOTIFICATION_TYPES.NO_NOTIFICATIONS
  }

  if (!privateKey) {
    privateKey = (await getFromStorage('privateKey')) || ''
  }

  if (notificationSettings.type !== NOTIFICATION_TYPES.PUSH) {
    return // Push is disabled in UI for this account
  }

  const parsed = parseTransactionPayload(payload)
  if (!parsed) return

  const { transaction, eventId } = parsed

  // Ensure the push is meant for the currently logged-in address in SW
  if (transaction.recipientId !== currentUserAddress) {
    return
  }

  if (isEventProcessed(eventId)) return

  await ensureSettingsInitialized()
  if (!isPushEnabled() || (await isAppVisible())) {
    return
  }

  const senderId = transaction.senderId
  const recipientId = transaction.recipientId
  const transactionId = transaction.id
  const senderName = payload.notification?.title || transaction.senderId
  let messageText = `New message from ${senderName} (open app to decrypt)`

  const decryptedMessage = decryptMessage(transaction, privateKey)
  if (decryptedMessage) {
    const partnerTitle = payload.notification?.title || senderId
    messageText = `${partnerTitle}: ${decryptedMessage}`
  }

  const notificationOptions = {
    body: messageText,
    icon: '/img/icons/android-chrome-192x192.png',
    tag: `adamant-push-${senderId}`,
    badge: '/img/icons/android-chrome-192x192.png',
    renotify: true,
    data: { senderId, recipientId, transactionId, type: 'push' }
  }

  try {
    await self.registration.showNotification('ADAMANT Messenger', notificationOptions)
  } catch (error) {
    console.error('Failed to show notification:', error)
  }
})

// Handling notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data

  event.waitUntil(
    (async () => {
      try {
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })

        // Set focus to the existing window
        const existingClient = clients.find((client) => client.url.includes(self.location.origin))
        if (existingClient) {
          await existingClient.focus()

          if (data?.senderId) {
            existingClient.postMessage({
              action: 'OPEN_CHAT',
              partnerId: data.senderId,
              transactionId: data.transactionId,
              fromNotification: true
            })
          }
          return
        }

        // Use AIP-9 format to open a specific chat after login
        // @see https://aips.adamant.im/AIPS/aip-9
        const targetUrl = data?.senderId ? `/?address=${data.senderId}` : '/'
        await self.clients.openWindow(targetUrl)
      } catch (error) {
        console.error('Click handler error:', error)
      }
    })()
  )
})
