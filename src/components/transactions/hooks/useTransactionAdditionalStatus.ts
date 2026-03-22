import { computed, MaybeRef, Ref, unref } from 'vue'
import {
  Cryptos,
  CryptoSymbol,
  TransactionAdditionalStatus,
  TransactionAdditionalStatusType,
  TransactionStatus
} from '@/lib/constants'

type TransactionWithAdditionalStatus = {
  status?: string
  instantlock?: boolean
  instantlock_internal?: boolean
  instantsend?: boolean
}

export function useTransactionAdditionalStatus(
  transaction: Ref<any>,
  crypto: MaybeRef<CryptoSymbol>
) {
  return computed<TransactionAdditionalStatusType>(() => {
    const currentTransaction = transaction.value as TransactionWithAdditionalStatus | undefined

    if (!currentTransaction?.status) {
      return TransactionAdditionalStatus.NONE
    }

    if (
      unref(crypto) === Cryptos.DASH &&
      currentTransaction.status === TransactionStatus.REGISTERED &&
      (currentTransaction.instantsend ||
        currentTransaction.instantlock ||
        currentTransaction.instantlock_internal)
    ) {
      return TransactionAdditionalStatus.INSTANT_SEND
    }

    if (
      unref(crypto) === Cryptos.ADM &&
      currentTransaction.status === TransactionStatus.REGISTERED
    ) {
      return TransactionAdditionalStatus.ADM_REGISTERED
    }

    return TransactionAdditionalStatus.NONE
  })
}
