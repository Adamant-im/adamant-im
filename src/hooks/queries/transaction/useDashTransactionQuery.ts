import { MaybeRef, unref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { Cryptos } from '@/lib/constants'
import { dash } from '@/lib/nodes'
import { DashTransaction } from '@/lib/nodes/types/transaction'
import { refetchIntervalFactory, retryDelayFactory, retryFactory } from './utils'

/**
 * @param transactionId - DASH transaction ID
 * @param address - DASH address
 */
export function useDashTransactionQuery(
  transactionId: MaybeRef<string>,
  address: MaybeRef<string>
) {
  return useQuery({
    queryKey: ['transaction', Cryptos.DASH, transactionId],
    queryFn: () => dash.getTransaction(unref(transactionId), unref(address)),
    initialData: {} as DashTransaction,
    retry: retryFactory(Cryptos.BTC, unref(transactionId)),
    retryDelay: retryDelayFactory(Cryptos.BTC, unref(transactionId)),
    refetchInterval: refetchIntervalFactory(Cryptos.BTC)
  })
}
