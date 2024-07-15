import { MaybeRef } from 'vue'
import { CryptoSymbol, isErc20 } from '@/lib/constants'
import { useAdmTransactionQuery } from './useAdmTransactionQuery'
import { useBtcTransactionQuery } from './useBtcTransactionQuery'
import { useDogeTransactionQuery } from './useDogeTransactionQuery'
import { useDashTransactionQuery } from './useDashTransactionQuery'
import { useEthTransactionQuery } from './useEthTransactionQuery'
import { useErc20TransactionQuery } from './useErc20TransactionQuery'
import { useKlyTransactionQuery } from './useKlyTransactionQuery'

const query = {
  ADM: useAdmTransactionQuery,
  BTC: useBtcTransactionQuery,
  DOGE: useDogeTransactionQuery,
  DASH: useDashTransactionQuery,
  ETH: useEthTransactionQuery,
  KLY: useKlyTransactionQuery
} as const

export function useTransactionQuery(transactionId: MaybeRef<string>, crypto: CryptoSymbol) {
  if (isErc20(crypto)) {
    return useErc20TransactionQuery(crypto)(transactionId)
  }

  switch (crypto) {
    case 'ADM':
    case 'BTC':
    case 'DOGE':
    case 'DASH':
    case 'ETH':
    case 'KLY':
      return query[crypto](transactionId)
    default:
      throw new Error(`Unsupported crypto: ${crypto}`)
  }
}
