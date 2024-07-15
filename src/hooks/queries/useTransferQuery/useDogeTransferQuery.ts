import { MaybeRef, unref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { Cryptos } from '@/lib/constants'
import { doge } from '@/lib/nodes'
import { DogeTransaction } from '@/lib/nodes/types/transaction'
import { refetchIntervalFactory, retryDelayFactory, retryFactory } from './utils'

/**
 * @param transactionId - DOGE transaction ID
 * @param address - DOGE address
 */
export function useDogeTransferQuery(transactionId: MaybeRef<string>, address: MaybeRef<string>) {
  return useQuery({
    queryKey: ['transaction', Cryptos.DOGE, transactionId],
    queryFn: () => doge.getTransaction(unref(transactionId), unref(address)),
    initialData: {} as DogeTransaction,
    retry: retryFactory(Cryptos.BTC, unref(transactionId)),
    retryDelay: retryDelayFactory(Cryptos.BTC, unref(transactionId)),
    refetchInterval: refetchIntervalFactory(Cryptos.BTC)
  })
}
