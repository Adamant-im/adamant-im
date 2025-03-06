import adamant from '@/lib/adamant'
import bignum from '@/lib/bignumber.js'
import type { RegisterChatMessageTransaction } from '@/lib/schema/client'

export const getTransactionId = (transaction: RegisterChatMessageTransaction) => {
  if (!transaction.signature) {
    throw new Error('Transaction Signature is required')
  }

  const hash = adamant.getHash(transaction)

  const temp = Buffer.alloc(8)
  for (let i = 0; i < 8; i++) {
    temp[i] = hash[7 - i]
  }

  return bignum.fromBuffer(temp).toString()
}
