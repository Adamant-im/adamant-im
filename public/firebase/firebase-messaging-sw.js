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

// Checking double notifications
const processedEvents = new Set()
setInterval(() => processedEvents.clear(), 2 * 60 * 1000) // 2 minutes

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

let privateKey = ''
let notificationSettings = {
  type: 2, // Default: PUSH
  initialized: false
}
const channel = new BroadcastChannel('adm_notifications')

// Utillites for decoding
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
let ourNotificationInProgress = false

self.registration.showNotification = function (title, options) {
  if (ourNotificationInProgress) {
    return originalShowNotification(title, options)
  }
  return Promise.resolve() // return promise as original functions returns promise
}

// Sync settings witn the main app
channel.onmessage = (event) => {
  const data = event.data

  if (data?.privateKey) {
    privateKey = data.privateKey
  }

  if (data?.clearPrivateKey) {
    privateKey = ''
  }

  if (data?.notificationType !== undefined) {
    notificationSettings.type = data.notificationType
    notificationSettings.initialized = true
  }
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

async function ensureSettingsInitialized() {
  if (notificationSettings.initialized) {
    return
  }

  await new Promise((resolve) => setTimeout(resolve, 2000))

  if (!notificationSettings.initialized) {
    notificationSettings.initialized = true
  }
}

function isPushEnabled() {
  return notificationSettings.type === NOTIFICATION_TYPES.PUSH
}

messaging.onBackgroundMessage(async (payload) => {
  const parsed = parseTransactionPayload(payload)
  if (!parsed) return

  const { transaction, eventId } = parsed

  if (isEventProcessed(eventId)) return

  await ensureSettingsInitialized()

  if (!isPushEnabled() || (await isAppVisible())) {
    return
  }

  const senderId = transaction.senderId
  const transactionId = transaction.id
  const senderName = payload.notification?.title || transaction.senderId.substring(0, 12)
  let messageText = `New message from ${senderName} (open app to decrypt)`

  const decryptedMessage = decryptMessage(transaction, privateKey)
  if (decryptedMessage) {
    const partnerTitle = payload.notification?.title || senderId.substring(0, 12)
    messageText = `${partnerTitle}: ${decryptedMessage}`
  }

  const notificationOptions = {
    body: messageText,
    icon: '/img/icons/android-chrome-192x192.png',
    tag: `adamant-push-${senderId}`,
    badge: '/img/icons/android-chrome-192x192.png',
    renotify: true,
    data: { senderId, transactionId, type: 'push' }
  }

  ourNotificationInProgress = true
  try {
    await self.registration.showNotification('ADAMANT Messenger', notificationOptions)
  } catch (error) {
    console.error('Failed to show notification:', error)
  } finally {
    ourNotificationInProgress = false
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

        // Focus on the excisting window
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

        // Open a new window
        const url = data?.senderId ? `/chats/${data.senderId}` : '/'
        await self.clients.openWindow(url)
      } catch (error) {
        console.error('Click handler error:', error)
      }
    })()
  )
})

// Fetch notifications during the app starting
setTimeout(() => {
  channel.postMessage({ requestCurrentSettings: true })
}, 1000)
