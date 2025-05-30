import utils from '@/lib/adamant'

export interface ParsedPushData {
  transactionId: string
  senderId: string
  senderPublicKey: string
  encryptedMessage: string
  nonce: string
}

export interface NotificationData {
  title: string
  body: string
  senderId: string
  transactionId: string
}

export function parsePushPayload(payload: any): ParsedPushData | null {
  try {
    const txnString = payload.data?.txn || payload.txn || ''
    if (!txnString) {
      console.log('No transaction data in push payload')
      return null
    }

    const txnData = typeof txnString === 'string' ? JSON.parse(txnString) : txnString

    if (!txnData.id || !txnData.senderId || !txnData.senderPublicKey || !txnData.asset?.chat) {
      console.log('Invalid transaction data format in push payload')
      return null
    }

    return {
      transactionId: txnData.id,
      senderId: txnData.senderId,
      senderPublicKey: txnData.senderPublicKey,
      encryptedMessage: txnData.asset.chat.message,
      nonce: txnData.asset.chat.own_message
    }
  } catch (error) {
    console.error('Error parsing push payload:', error)
    return null
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
  parsedData: ParsedPushData
): NotificationData {
  return {
    title: 'ADAMANT Messenger',
    body: decryptedMessage,
    senderId: parsedData.senderId,
    transactionId: parsedData.transactionId
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
      console.log('App visible, suppressing notification')
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
    console.log('Push notification processed and shown successfully')
    return true
  } catch (error) {
    console.error('Error processing push notification:', error)
    return false
  }
}
