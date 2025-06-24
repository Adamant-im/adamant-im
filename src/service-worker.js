import {
  precacheAndRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { clientsClaim } from 'workbox-core'

// PWA
self.skipWaiting()
clientsClaim()
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

// FIREBASE
import { initializeApp } from 'firebase/app'
import { getMessaging, onBackgroundMessage, isSupported } from 'firebase/messaging/sw'

const firebaseConfig = {
  apiKey: 'AIzaSyDgtB_hqwL1SS_YMYepRMmXYhmc7154wmU',
  authDomain: 'adamant-messenger.firebaseapp.com',
  databaseURL: 'https://adamant-messenger.firebaseio.com',
  projectId: 'adamant-messenger',
  storageBucket: 'adamant-messenger.appspot.com',
  messagingSenderId: '987518845753',
  appId: '1:987518845753:web:6585b11ca36bac4c251ee8'
}

const firebaseApp = initializeApp(firebaseConfig, 'sw-app')
let messaging = null
let isMessagingSupported = false

isSupported()
  .then((supported) => {
    isMessagingSupported = supported
    if (supported) {
      messaging = getMessaging(firebaseApp)
      setupPushHandler()
    }
  })
  .catch(() => {
    isMessagingSupported = false
  })

let privateKey = ''
let hasPrivateKey = false
const channel = new BroadcastChannel('adm_notifications')

channel.onmessage = (event) => {
  const data = event.data

  if (data && data.isCheckPK) {
    channel.postMessage({ isNoPrivateKey: !hasPrivateKey })
  } else if (data && data.privateKey) {
    privateKey = data.privateKey
    hasPrivateKey = true
  }
}

async function isAppVisible() {
  try {
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })

    return clients.some((client) => client.focused && client.visibilityState === 'visible')
  } catch {
    return false
  }
}

async function processPushNotification(payload, privateKey, isAppVisible, showNotificationFn) {
  try {
    if (isAppVisible) {
      return false
    }

    const notificationData = {
      title: 'ADAMANT Messenger',
      body: 'New message received',
      senderId: payload.data?.senderId || 'unknown',
      transactionId: payload.data?.transactionId || Date.now().toString()
    }

    await showNotificationFn(notificationData)
    return true
  } catch (error) {
    console.error('Error processing push notification:', error)
    return false
  }
}

function notifyClient(client, senderId, transactionId) {
  try {
    client.postMessage({
      action: 'OPEN_CHAT',
      partnerId: senderId,
      transactionId: transactionId,
      fromNotification: true
    })
    console.log(`Message sent to client for chat: ${senderId}`)
  } catch (error) {
    console.error('Error sending message to client:', error)
  }
}

function setupPushHandler() {
  if (!messaging || !isMessagingSupported) {
    return
  }

  onBackgroundMessage(messaging, async (payload) => {
    if (!hasPrivateKey) {
      return
    }

    const appVisible = await isAppVisible()

    if (appVisible) {
      const clients = await self.clients.matchAll({ type: 'window' })
      for (const client of clients) {
        if (client.focused) {
          client.postMessage({
            action: 'FOREGROUND_MESSAGE',
            payload: payload
          })
        }
      }
      return
    }

    await processPushNotification(payload, privateKey, appVisible, async (notificationData) => {
      const notificationOptions = {
        body: notificationData.body,
        icon: '/img/icons/android-chrome-192x192.png',
        tag: notificationData.transactionId,
        badge: '/img/icons/android-chrome-192x192.png',
        requireInteraction: false,
        silent: false,
        data: {
          transactionId: notificationData.transactionId,
          senderId: notificationData.senderId,
          message: notificationData.body,
          timestamp: Date.now()
        }
      }

      await self.registration.showNotification(notificationData.title, notificationOptions)
    })
  })
}

// Firebase notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data
  if (!data || !data.senderId) {
    return
  }

  event.waitUntil(
    (async () => {
      try {
        const clientList = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        })

        // Try to focus existing window
        const existingClient = clientList.find((client) =>
          client.url.includes(self.location.origin)
        )

        if (existingClient) {
          await existingClient.focus()
          notifyClient(existingClient, data.senderId, data.transactionId)
          return
        }

        // Open new window if no existing one
        const newClient = await self.clients.openWindow(`/chats/${data.senderId}`)
        if (newClient) {
          setTimeout(() => {
            notifyClient(newClient, data.senderId, data.transactionId)
          }, 1000)
        }
      } catch (error) {
        console.error('Error handling notification click:', error)
      }
    })()
  )
})

// Cleanup old notifications daily
setInterval(
  () => {
    self.registration.getNotifications().then((notifications) => {
      const now = Date.now()
      const maxAge = 24 * 60 * 60 * 1000

      notifications.forEach((notification) => {
        const timestamp = notification.data?.timestamp || 0
        if (now - timestamp > maxAge) {
          notification.close()
        }
      })
    })
  },
  60 * 60 * 1000
)
