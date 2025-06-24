import { PushNotificationSchema } from '@capacitor/push-notifications'

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

export interface PushNotification extends PushNotificationSchema {
  data: NotificationData
}
