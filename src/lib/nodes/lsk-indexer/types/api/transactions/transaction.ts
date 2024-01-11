export type Transaction = {
  id: string
  moduleCommand: string
  nonce: string
  fee: string
  minFee: string
  size: number
  block: {
    id: string
    height: number
    timestamp: number
    isFinal: boolean
  }
  sender: {
    address: string
    publicKey: string
    name: string
  }
  params: {
    amount: string
    recipientAddress: string
    tokenID: string
    data: string
  }
  executionStatus: string
  index: number
  meta: {
    recipient: {
      address: string
      publicKey: string
      name: string
    }
  }
}
