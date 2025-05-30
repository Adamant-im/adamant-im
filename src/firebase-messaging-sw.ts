import { initializeApp } from 'firebase/app'
import { getMessaging, onBackgroundMessage, isSupported } from 'firebase/messaging/sw'
import { firebaseConfig } from '@/lib/firebase-config'
import { processPushNotification, notifyClient } from '@/lib/notifications/pushUtils'

const swSelf = globalThis as unknown as ServiceWorkerGlobalScope

const firebaseApp = initializeApp(firebaseConfig)
let messaging: any = null
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

swSelf.addEventListener('install', (event) => {
  event.waitUntil(swSelf.skipWaiting())
})

swSelf.addEventListener('activate', (event) => {
  event.waitUntil(swSelf.clients.claim())
})

let privateKey: string = ''
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

async function isAppVisible(): Promise<boolean> {
  try {
    const clients = await swSelf.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })

    return clients.some((client) => client.focused && client.visibilityState === 'visible')
  } catch {
    return false
  }
}

function setupPushHandler() {
  if (!messaging || !isMessagingSupported) {
    return
  }

  onBackgroundMessage(messaging, async (payload: any) => {
    if (!hasPrivateKey) {
      return
    }

    const appVisible = await isAppVisible()

    if (appVisible) {
      const clients = await swSelf.clients.matchAll({ type: 'window' })
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

      await swSelf.registration.showNotification(notificationData.title, notificationOptions)
    })
  })
}

swSelf.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data
  if (!data || !data.senderId) {
    return
  }

  event.waitUntil(
    (async () => {
      try {
        const clientList = await swSelf.clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        })

        // Try to focus existing window
        const existingClient = clientList.find((client) =>
          client.url.includes(swSelf.location.origin)
        )

        if (existingClient) {
          await existingClient.focus()
          notifyClient(existingClient, data.senderId, data.transactionId)
          return
        }

        // Open new window if no existing one
        const newClient = await swSelf.clients.openWindow(`/chats/${data.senderId}`)
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
    swSelf.registration.getNotifications().then((notifications) => {
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
