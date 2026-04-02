/* eslint-disable no-undef */
importScripts('/js/firebase-app-compat.js')
importScripts('/js/firebase-messaging-compat.js')
importScripts('/js/nacl.min.js')
importScripts('/js/ed2curve.min.js')

function hexToBytes(hex) {
  const bytes = []
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16))
  }
  return Uint8Array.from(bytes)
}

const NOTIFICATION_TYPES = {
  NO_NOTIFICATIONS: 0,
  BACKGROUND_FETCH: 1,
  PUSH: 2
}

// State
let privateKey = ''
let currentUserAddress = ''
let notificationSettings = {
  type: NOTIFICATION_TYPES.NO_NOTIFICATIONS,
  initialized: false
}

// Security
const usedNonces = new Set()
const MAX_NONCES = 100

// Database configuration
const DB_NAME = 'AdamantSWStorage'
const DB_VERSION = 3
const STORE_NAME = 'secure_context'
const EVENTS_STORE_NAME = 'processed_events'

let dbInstance = null

// Initialize DB immediately
const initDB = () => {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
      if (!db.objectStoreNames.contains(EVENTS_STORE_NAME)) {
        db.createObjectStore(EVENTS_STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = (e) => {
      dbInstance = e.target.result
      loadStateFromDB()
      resolve(dbInstance)
    }
    request.onerror = () => resolve(null)
  })
}

initDB()

async function getFromStorage(key) {
  if (!dbInstance) return null
  return new Promise((resolve) => {
    const transaction = dbInstance.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).get(key)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => resolve(null)
  })
}

async function saveToStorage(key, value) {
  if (!dbInstance) return
  const transaction = dbInstance.transaction(STORE_NAME, 'readwrite')
  transaction.objectStore(STORE_NAME).put(value, key)
}

async function deleteFromStorage(key) {
  if (!dbInstance) return
  const transaction = dbInstance.transaction(STORE_NAME, 'readwrite')
  transaction.objectStore(STORE_NAME).delete(key)
}

async function loadStateFromDB() {
  if (!dbInstance) return
  const [addr, type, key] = await Promise.all([
    getFromStorage('currentUserAddress'),
    getFromStorage('notificationType'),
    getFromStorage('privateKey')
  ])

  if (addr) currentUserAddress = addr
  if (type !== null) notificationSettings.type = type
  if (key) privateKey = key

  notificationSettings.initialized = true
}

async function isEventProcessed(eventId) {
  if (!eventId || !dbInstance) return false

  return new Promise((resolve) => {
    const transaction = dbInstance.transaction(EVENTS_STORE_NAME, 'readonly')
    const request = transaction.objectStore(EVENTS_STORE_NAME).get(eventId)
    request.onsuccess = () => {
      if (request.result) {
        resolve(true)
      } else {
        const addTx = dbInstance.transaction(EVENTS_STORE_NAME, 'readwrite')
        addTx.objectStore(EVENTS_STORE_NAME).put({ id: eventId, timestamp: Date.now() })
        resolve(false)
      }
    }
    request.onerror = () => resolve(false)
  })
}

async function cleanupProcessedEvents() {
  if (!dbInstance) return
  const transaction = dbInstance.transaction(EVENTS_STORE_NAME, 'readwrite')
  const store = transaction.objectStore(EVENTS_STORE_NAME)
  const countRequest = store.count()

  countRequest.onsuccess = () => {
    if (countRequest.result > 1000) {
      store.clear()
    }
  }
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

// Secure Channel Handling
let securePort = null

self.addEventListener('message', (event) => {
  console.log('[Push-Reg] SW: Message received from UI')
  if (event.data && event.data.type === 'INIT_SECURE_CHANNEL') {
    // Close old port if exists
    if (securePort) {
      try {
        securePort.close()
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        /* empty */
      }
    }

    securePort = event.ports[0]
    securePort.onmessage = (portEvent) => handleSecureMessage(portEvent.data)
    securePort.postMessage({ type: 'CONFIRM_CHANNEL', timestamp: Date.now() })

    // Re-sync state to new client immediately
    securePort.postMessage({
      type: 'STATE_SYNC',
      payload: {
        currentUserAddress,
        notificationType: notificationSettings.type,
        hasPrivateKey: !!privateKey
      }
    })
  }
})

async function handleSecureMessage(data) {
  const { type, payload, nonce } = data

  if (!nonce || usedNonces.has(nonce)) return

  usedNonces.add(nonce)
  if (usedNonces.size > MAX_NONCES) {
    const iterator = usedNonces.values()
    usedNonces.delete(iterator.next().value)
  }

  switch (type) {
    case 'SET_PRIVATE_KEY':
      if (payload?.privateKey) {
        privateKey = payload?.privateKey
        await saveToStorage('privateKey', privateKey)
        console.log('[SW] Private key updated')
      }
      break
    case 'CLEAR_PRIVATE_KEY':
      privateKey = ''
      currentUserAddress = ''
      await deleteFromStorage('privateKey')
      await saveToStorage('currentUserAddress', '')
      break
    case 'SYNC_SETTINGS':
      console.log('[Push-Reg] SW: Syncing settings')
      if (payload?.currentUserAddress) {
        if (currentUserAddress && currentUserAddress !== payload.currentUserAddress) {
          // User changed - clear old key
          privateKey = ''
          await deleteFromStorage('privateKey')
        }
        currentUserAddress = payload.currentUserAddress
        await saveToStorage('currentUserAddress', currentUserAddress)
      }
      if (payload?.type !== undefined) {
        notificationSettings.type = payload.type
        await saveToStorage('notificationType', payload.type)
      }
      notificationSettings.initialized = true
      console.log('[SW] Settings synced:', { currentUserAddress, type: notificationSettings.type })
      break
    case 'PING':
      securePort?.postMessage({ type: 'PONG' })
      break
    default:
      console.warn('[SW] Unknown secure command:', type)
  }
}

function decode(bytes) {
  return new TextDecoder('utf-8').decode(bytes)
}

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
  if (options?.data?.type === 'push' && title === 'ADAMANT Messenger') {
    return originalShowNotification(title, options)
  }
  return Promise.resolve()
}

function parseTransactionPayload(payload) {
  if (!payload.data?.txn) return null
  try {
    const transaction = JSON.parse(payload.data.txn)
    return { transaction, eventId: transaction.id }
  } catch (error) {
    console.warn('Invalid transaction JSON:', error)
    return null
  }
}

messaging.onBackgroundMessage(async (payload) => {
  console.log('[Push-Reg] SW: Incoming push event from network')
  await initDB()
  console.log('[Push-Reg] SW: DB initialized')
  if (!securePort) {
    const windowClients = await self.clients.matchAll({ type: 'window' })
    windowClients.forEach((c) => c.postMessage({ type: 'SW_RESTARTED' }))
  }
  if (!notificationSettings.initialized) {
    await loadStateFromDB()
  }

  if (notificationSettings.type !== NOTIFICATION_TYPES.PUSH) return

  const parsed = parseTransactionPayload(payload)
  if (!parsed) return

  const { transaction, eventId } = parsed

  if (transaction.recipientId !== currentUserAddress) return

  if (await isEventProcessed(eventId)) return

  cleanupProcessedEvents()

  if (await isAppVisible()) return

  const senderId = transaction.senderId
  const decryptedMessage = decryptMessage(transaction, privateKey)

  let messageText = `New message from ${senderId} (open app to decrypt)`
  if (decryptedMessage) {
    messageText = `${payload.notification?.title || senderId}: ${decryptedMessage}`
  }

  const notificationOptions = {
    body: messageText,
    icon: '/img/icons/android-chrome-192x192.png',
    tag: `adamant-push-${senderId}`,
    badge: '/img/icons/android-chrome-192x192.png',
    renotify: true,
    data: {
      senderId,
      recipientId: transaction.recipientId,
      transactionId: transaction.id,
      type: 'push'
    }
  }

  try {
    await self.registration.showNotification('ADAMANT Messenger', notificationOptions)
  } catch (error) {
    console.error('Failed to show notification:', error)
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification.data

  event.waitUntil(
    (async () => {
      try {
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
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

        const targetUrl = data?.senderId ? `/?address=${data.senderId}` : '/'
        await self.clients.openWindow(targetUrl)
      } catch (error) {
        console.error('Click handler error:', error)
      }
    })()
  )
})
