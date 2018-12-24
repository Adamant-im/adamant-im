export type Message = {
  id: number,
  senderId: string,
  message: string,
  timestamp: number,
  admTimestamp: number,
  amount: number,
  i18n: boolean,
  status: MessageStatus,
  type: MessageType,
}

export enum MessageType {
  Message = 'message',
  ADM = 'ADM',
  ETH = 'ETH'
}

export enum MessageStatus {
  sent,
  confirmed,
  rejected
}

export type User = {
  id: string,
  name?: string
}
