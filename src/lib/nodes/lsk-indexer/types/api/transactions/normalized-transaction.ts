export type NormalizedTransaction = {
  id: string
  hash: string
  fee: number
  status: 'CONFIRMED' | 'REGISTERED'
  data: string
  timestamp: number // block timestamp
  direction: 'from' | 'to'
  senderId: string
  recipientId: string
  amount: number
  height: number // block height
  nonce: string
  module: 'token'
  command: 'transfer'
}
