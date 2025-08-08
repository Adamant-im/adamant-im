import utils from '@/lib/adamant'
import type { ParsedPushData, NotificationData } from './pushTypes'

export function parsePushPayload(payload: any): ParsedPushData | null {
  const txnString = payload.data?.txn || payload.txn
  if (!txnString) return null

  const txnData = typeof txnString === 'string' ? JSON.parse(txnString) : txnString
  const { id, senderId, senderPublicKey, asset } = txnData

  if (!id || !senderId || !senderPublicKey || !asset?.chat) return null

  return {
    transactionId: id,
    senderId,
    senderPublicKey,
    encryptedMessage: asset.chat.message,
    nonce: asset.chat.own_message
  }
}

export function decryptPushMessage(parsedData: ParsedPushData, privateKey: string): string | null {
  try {
    if (!privateKey) {
      console.warn('Cannot decrypt: private key not provided')
      return null
    }

    const decrypted = utils.decodeMessage(
      parsedData.encryptedMessage,
      parsedData.senderPublicKey,
      privateKey,
      parsedData.nonce
    )

    if (!decrypted) {
      console.warn('Decryption returned empty result')
      return null
    }

    console.log('Message decrypted successfully')
    return decrypted
  } catch (error) {
    console.error('Error decrypting push message:', error)
    return null
  }
}

export function createNotificationData(
  decryptedMessage: string,
  { senderId, transactionId }: ParsedPushData
): NotificationData {
  return {
    title: 'ADAMANT Messenger',
    body: decryptedMessage,
    senderId: senderId,
    transactionId: transactionId
  }
}

export function navigateToChat(senderId: string, transactionId?: string): void {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('openChat', {
          detail: {
            partnerId: senderId,
            transactionId: transactionId
          }
        })
      )
      console.log(`📱 Navigation to chat requested: ${senderId}`)
    }
  } catch (error) {
    console.error('Error navigating to chat:', error)
  }
}

export function notifyClient(client: any, senderId: string, transactionId?: string): void {
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

export async function processPushNotification(
  payload: any,
  privateKey: string,
  isAppVisible: boolean,
  showNotificationFn: (data: NotificationData) => Promise<void>
): Promise<boolean> {
  try {
    if (isAppVisible) {
      return false
    }

    const parsedData = parsePushPayload(payload)
    if (!parsedData) {
      return false
    }

    const decryptedMessage = decryptPushMessage(parsedData, privateKey)
    if (!decryptedMessage) {
      return false
    }

    const notificationData = createNotificationData(decryptedMessage, parsedData)

    await showNotificationFn(notificationData)
    return true
  } catch (error) {
    console.error('Error processing push notification:', error)
    return false
  }
}
