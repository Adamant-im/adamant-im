type Block = {
  id: string
  height: number
  timestamp: number
  isFinal: boolean
}

type TransactionStatus = 'successful' | 'pending' | 'failed'

type BaseTransaction<Status extends TransactionStatus> = {
  id: string
  moduleCommand: string
  nonce: string
  fee: string
  minFee: string
  size: number
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
  executionStatus: Status
  index: number
  meta: {
    recipient: {
      address: string
      publicKey: string | null
      name: string | null
    }
  }
}

export type PendingTransaction = BaseTransaction<'pending'>

export type SuccessfulTransaction = BaseTransaction<'successful'> & {
  index: number
  block: Block
}

export type FailedTransaction = BaseTransaction<'failed'> & {
  index: number
  block: Block
}

export type Transaction = PendingTransaction | SuccessfulTransaction | FailedTransaction
