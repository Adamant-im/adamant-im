import { MaybeRef } from 'vue'
import { CryptoSymbol, isErc20 } from '@/lib/constants'
import { useBtcTransactionQuery } from './useBtcTransactionQuery'
import { useDogeTransactionQuery } from './useDogeTransactionQuery'
import { useDashTransactionQuery } from './useDashTransactionQuery'
import { useEthTransactionQuery } from './useEthTransactionQuery'
import { useErc20TransactionQuery } from './useErc20TransactionQuery'
import { useAdmTransactionQuery } from './useAdmTransactionQuery'
import { UseTransactionQueryParams } from './types'

const query = {
  ADM: useAdmTransactionQuery,
  BTC: useBtcTransactionQuery,
  DOGE: useDogeTransactionQuery,
  DASH: useDashTransactionQuery,
  ETH: useEthTransactionQuery
} as const

export function useTransactionQuery(
  transactionId: MaybeRef<string>,
  crypto: CryptoSymbol,
  params: UseTransactionQueryParams = {}
) {
  if (isErc20(crypto)) {
    return useErc20TransactionQuery(crypto)(transactionId, params)
  }

  switch (crypto) {
    case 'ADM':
    case 'BTC':
    case 'DOGE':
    case 'DASH':
    case 'ETH':
      return query[crypto](transactionId, params)
    default:
      throw new Error(`Unsupported crypto: ${crypto}`)
  }
}
