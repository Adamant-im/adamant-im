import { EPOCH } from '@/lib/constants'

export function isWelcomeMessage(transaction) {
  return transaction.timestamp === EPOCH
}
